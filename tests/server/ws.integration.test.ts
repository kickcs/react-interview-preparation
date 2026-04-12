import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createServer, type Server as HttpServer } from "http";
import { Server as IOServer } from "socket.io";
import { io as ClientIO, type Socket as ClientSocket } from "socket.io-client";
import { createStore, createRoom } from "../../src-server/state";
import { attachWs } from "../../src-server/ws";
import type { StateStore } from "../../src-server/types";
import type { ClientToServerEvents, ServerToClientEvents } from "@/shared/contracts";

type C = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

async function bootHarness() {
  const now = { t: 1000 };
  let counter = 0;
  const store: StateStore = createStore({
    now: () => now.t,
    newRoomId: () => `r${++counter}`,
  });
  const http: HttpServer = createServer();
  const io = new IOServer(http, { cors: { origin: "*" } });
  attachWs(io, { store, maxCodeBytes: 50 * 1024, maxUpdatesPerSec: 100 });
  await new Promise<void>((res) => http.listen(0, res));
  const address = http.address();
  if (!address || typeof address === "string") throw new Error("no address");
  const url = `http://127.0.0.1:${address.port}`;
  return { url, http, io, store, now };
}

function connect(url: string): C {
  return ClientIO(url, { transports: ["websocket"], forceNew: true }) as C;
}

function wait<T>(sock: C, event: keyof ServerToClientEvents): Promise<T> {
  return new Promise((resolve) => {
    (sock as unknown as { once: (e: string, cb: (p: T) => void) => void }).once(
      event as string,
      (payload: T) => resolve(payload)
    );
  });
}

describe("ws integration", () => {
  let harness: Awaited<ReturnType<typeof bootHarness>>;
  const clients: C[] = [];

  beforeEach(async () => {
    harness = await bootHarness();
    createRoom(harness.store, {
      taskSource: { kind: "catalog", category: "a", slug: "b" },
      maxRooms: 500,
    });
  });

  afterEach(async () => {
    clients.splice(0).forEach((c) => c.disconnect());
    harness.io.close();
    await new Promise<void>((res) => harness.http.close(() => res()));
  });

  it("two clients see each other join", async () => {
    const c1 = connect(harness.url);
    clients.push(c1);
    await new Promise<void>((r) => c1.on("connect", () => r()));
    const ack1 = await new Promise<{ ok: boolean }>((r) =>
      c1.emit("room:join", { roomId: "r1", nickname: "alice" }, r as never)
    );
    expect(ack1.ok).toBe(true);

    const c2 = connect(harness.url);
    clients.push(c2);
    await new Promise<void>((r) => c2.on("connect", () => r()));

    const joinedOnC1 = wait<{ participant: { nickname: string } }>(c1, "room:participant-joined");
    const ack2 = await new Promise<{ ok: boolean }>((r) =>
      c2.emit("room:join", { roomId: "r1", nickname: "bob" }, r as never)
    );
    expect(ack2.ok).toBe(true);
    const joined = await joinedOnC1;
    expect(joined.participant.nickname).toBe("bob");
  });

  it("code:update without share is NOT broadcast", async () => {
    const c1 = connect(harness.url);
    const c2 = connect(harness.url);
    clients.push(c1, c2);
    await Promise.all([
      new Promise<void>((r) => c1.on("connect", () => r())),
      new Promise<void>((r) => c2.on("connect", () => r())),
    ]);
    await new Promise((r) => c1.emit("room:join", { roomId: "r1", nickname: "alice" }, r as never));
    await new Promise((r) => c2.emit("room:join", { roomId: "r1", nickname: "bob" }, r as never));

    let leaked = false;
    c2.on("room:shared-code-updated", () => {
      leaked = true;
    });
    c1.emit("code:update", { code: "secret", language: "ts" });
    await new Promise((r) => setTimeout(r, 80));
    expect(leaked).toBe(false);
  });

  it("code:share then code:update broadcasts to peer", async () => {
    const c1 = connect(harness.url);
    const c2 = connect(harness.url);
    clients.push(c1, c2);
    await Promise.all([
      new Promise<void>((r) => c1.on("connect", () => r())),
      new Promise<void>((r) => c2.on("connect", () => r())),
    ]);
    await new Promise((r) => c1.emit("room:join", { roomId: "r1", nickname: "alice" }, r as never));
    await new Promise((r) => c2.emit("room:join", { roomId: "r1", nickname: "bob" }, r as never));

    c1.emit("code:update", { code: "initial", language: "ts" });
    c1.emit("code:share");
    const payload = await wait<{ code: string }>(c2, "room:shared-code-updated");
    expect(payload.code).toBe("initial");

    const nextUpdate = wait<{ code: string }>(c2, "room:shared-code-updated");
    c1.emit("code:update", { code: "updated", language: "ts" });
    const p2 = await nextUpdate;
    expect(p2.code).toBe("updated");
  });

  it("5th joiner gets ROOM_FULL", async () => {
    const sockets: C[] = [];
    for (let i = 0; i < 4; i++) {
      const c = connect(harness.url);
      sockets.push(c);
      clients.push(c);
      await new Promise<void>((r) => c.on("connect", () => r()));
      await new Promise((r) => c.emit("room:join", { roomId: "r1", nickname: `u${i}` }, r as never));
    }
    const c5 = connect(harness.url);
    clients.push(c5);
    await new Promise<void>((r) => c5.on("connect", () => r()));
    const ack = await new Promise<{ ok: boolean; error?: string }>((r) =>
      c5.emit("room:join", { roomId: "r1", nickname: "u5" }, r as never)
    );
    expect(ack.ok).toBe(false);
    expect(ack.error).toBe("ROOM_FULL");
  });

  it("join missing room returns ROOM_NOT_FOUND", async () => {
    const c = connect(harness.url);
    clients.push(c);
    await new Promise<void>((r) => c.on("connect", () => r()));
    const ack = await new Promise<{ ok: boolean; error?: string }>((r) =>
      c.emit("room:join", { roomId: "nope", nickname: "alice" }, r as never)
    );
    expect(ack.ok).toBe(false);
    expect(ack.error).toBe("ROOM_NOT_FOUND");
  });

  it("disconnect broadcasts participant-left", async () => {
    const c1 = connect(harness.url);
    const c2 = connect(harness.url);
    clients.push(c1, c2);
    await Promise.all([
      new Promise<void>((r) => c1.on("connect", () => r())),
      new Promise<void>((r) => c2.on("connect", () => r())),
    ]);
    await new Promise((r) => c1.emit("room:join", { roomId: "r1", nickname: "alice" }, r as never));
    await new Promise((r) => c2.emit("room:join", { roomId: "r1", nickname: "bob" }, r as never));

    const left = wait<{ participantId: string }>(c1, "room:participant-left");
    c2.disconnect();
    const payload = await left;
    expect(typeof payload.participantId).toBe("string");
  });
});
