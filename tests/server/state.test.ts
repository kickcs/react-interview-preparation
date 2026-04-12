import { describe, it, expect, beforeEach } from "vitest";
import {
  createStore,
  createRoom,
  joinRoom,
  leaveRoom,
  updateCode,
  shareCode,
  unshareCode,
  setStatus,
  getRoom,
  cleanupExpiredRooms,
  toSnapshot,
} from "../../src-server/state";
import type { StateStore } from "../../src-server/types";

function makeStore(nowRef: { t: number }): StateStore {
  let counter = 0;
  return createStore({
    now: () => nowRef.t,
    newRoomId: () => `room${++counter}`,
  });
}

describe("state.createRoom", () => {
  it("creates a room with generated id", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    const res = createRoom(store, {
      taskSource: { kind: "catalog", category: "react", slug: "debounce" },
      maxRooms: 500,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.room.id).toBe("room1");
      expect(res.room.participants.size).toBe(0);
      expect(res.room.createdAt).toBe(1000);
      expect(res.room.emptyAt).toBe(1000);
    }
    expect(store.rooms.size).toBe(1);
  });

  it("returns MAX_ROOMS_REACHED when over cap", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 1 });
    const res = createRoom(store, {
      taskSource: { kind: "catalog", category: "a", slug: "c" },
      maxRooms: 1,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("MAX_ROOMS_REACHED");
  });
});

describe("state.joinRoom", () => {
  let store: StateStore;
  const now = { t: 1000 };

  beforeEach(() => {
    now.t = 1000;
    store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
  });

  it("adds participant and clears emptyAt", () => {
    const res = joinRoom(store, { roomId: "room1", socketId: "s1", nickname: "alice" });
    expect(res.ok).toBe(true);
    const room = getRoom(store, "room1")!;
    expect(room.participants.size).toBe(1);
    expect(room.participants.get("s1")?.nickname).toBe("alice");
    expect(room.emptyAt).toBeNull();
  });

  it("returns ROOM_NOT_FOUND for missing room", () => {
    const res = joinRoom(store, { roomId: "nope", socketId: "s1", nickname: "alice" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("ROOM_NOT_FOUND");
  });

  it("returns ROOM_FULL after 4 participants", () => {
    for (let i = 0; i < 4; i++) {
      joinRoom(store, { roomId: "room1", socketId: `s${i}`, nickname: `u${i}` });
    }
    const res = joinRoom(store, { roomId: "room1", socketId: "s5", nickname: "u5" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("ROOM_FULL");
  });

  it("returns NICKNAME_TAKEN for duplicate nickname (case-insensitive)", () => {
    joinRoom(store, { roomId: "room1", socketId: "s1", nickname: "alice" });
    const res = joinRoom(store, { roomId: "room1", socketId: "s2", nickname: "ALICE" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("NICKNAME_TAKEN");
  });
});

describe("state.leaveRoom", () => {
  it("removes participant and sets emptyAt when last leaves", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
    joinRoom(store, { roomId: "room1", socketId: "s1", nickname: "alice" });
    now.t = 2000;
    leaveRoom(store, { roomId: "room1", socketId: "s1" });
    const room = getRoom(store, "room1")!;
    expect(room.participants.size).toBe(0);
    expect(room.emptyAt).toBe(2000);
  });
});

describe("state.updateCode", () => {
  it("stores private code and does NOT touch sharedCode", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
    joinRoom(store, { roomId: "room1", socketId: "s1", nickname: "alice" });
    const res = updateCode(store, {
      roomId: "room1",
      socketId: "s1",
      code: "let x = 1",
      language: "ts",
      maxCodeBytes: 1024,
    });
    expect(res.ok).toBe(true);
    const p = getRoom(store, "room1")!.participants.get("s1")!;
    expect(p.code).toBe("let x = 1");
    expect(p.sharedCode).toBeNull();
  });

  it("updates sharedCode when participant is sharing", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
    joinRoom(store, { roomId: "room1", socketId: "s1", nickname: "alice" });
    shareCode(store, { roomId: "room1", socketId: "s1" });
    updateCode(store, {
      roomId: "room1",
      socketId: "s1",
      code: "new code",
      language: "ts",
      maxCodeBytes: 1024,
    });
    const p = getRoom(store, "room1")!.participants.get("s1")!;
    expect(p.sharedCode).toBe("new code");
  });

  it("rejects code above max size", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
    joinRoom(store, { roomId: "room1", socketId: "s1", nickname: "alice" });
    const res = updateCode(store, {
      roomId: "room1",
      socketId: "s1",
      code: "a".repeat(2000),
      language: "ts",
      maxCodeBytes: 1024,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("CODE_TOO_LARGE");
  });
});

describe("state.shareCode / unshareCode", () => {
  it("copies code to sharedCode", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
    joinRoom(store, { roomId: "room1", socketId: "s1", nickname: "alice" });
    updateCode(store, {
      roomId: "room1",
      socketId: "s1",
      code: "x",
      language: "ts",
      maxCodeBytes: 1024,
    });
    shareCode(store, { roomId: "room1", socketId: "s1" });
    const p = getRoom(store, "room1")!.participants.get("s1")!;
    expect(p.sharedCode).toBe("x");

    unshareCode(store, { roomId: "room1", socketId: "s1" });
    expect(getRoom(store, "room1")!.participants.get("s1")!.sharedCode).toBeNull();
  });
});

describe("state.setStatus", () => {
  it("changes status without touching sharedCode", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
    joinRoom(store, { roomId: "room1", socketId: "s1", nickname: "alice" });
    setStatus(store, { roomId: "room1", socketId: "s1", status: "ready" });
    const p = getRoom(store, "room1")!.participants.get("s1")!;
    expect(p.status).toBe("ready");
    expect(p.sharedCode).toBeNull();
  });
});

describe("state.cleanupExpiredRooms", () => {
  it("removes empty rooms older than ttl", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
    now.t = 1000 + 11 * 60 * 1000;
    cleanupExpiredRooms(store, { ttlMs: 10 * 60 * 1000 });
    expect(store.rooms.size).toBe(0);
  });

  it("keeps rooms with participants", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
    joinRoom(store, { roomId: "room1", socketId: "s1", nickname: "alice" });
    now.t = 1000 + 11 * 60 * 1000;
    cleanupExpiredRooms(store, { ttlMs: 10 * 60 * 1000 });
    expect(store.rooms.size).toBe(1);
  });

  it("keeps empty rooms under ttl", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
    now.t = 1000 + 5 * 60 * 1000;
    cleanupExpiredRooms(store, { ttlMs: 10 * 60 * 1000 });
    expect(store.rooms.size).toBe(1);
  });
});

describe("state.toSnapshot", () => {
  it("omits private code fields from output", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
    joinRoom(store, { roomId: "room1", socketId: "s1", nickname: "alice" });
    updateCode(store, {
      roomId: "room1",
      socketId: "s1",
      code: "secret",
      language: "ts",
      maxCodeBytes: 1024,
    });
    const snap = toSnapshot(getRoom(store, "room1")!);
    expect(JSON.stringify(snap)).not.toContain("secret");
    expect(snap.participants[0].nickname).toBe("alice");
    expect(snap.participants[0].hasSharedCode).toBe(false);
  });
});
