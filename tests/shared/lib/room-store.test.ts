import { describe, it, expect, beforeEach } from "vitest";
import { createRoomStore } from "../../../src/shared/lib/room-store";
import type { ParticipantPublic } from "@/shared/contracts";

function mkParticipant(id: string, nick: string): ParticipantPublic {
  return { id, nickname: nick, status: "thinking", joinedAt: 0, hasSharedCode: false };
}

describe("roomStore", () => {
  let store: ReturnType<typeof createRoomStore>;

  beforeEach(() => {
    store = createRoomStore();
  });

  it("applies participant-joined", () => {
    store.getState().applyEvent({
      type: "room:participant-joined",
      payload: { participant: mkParticipant("s1", "alice") },
    });
    expect(store.getState().participants.get("s1")?.nickname).toBe("alice");
  });

  it("applies participant-left and clears sharedCode", () => {
    const s = store.getState();
    s.applyEvent({ type: "room:participant-joined", payload: { participant: mkParticipant("s1", "alice") } });
    s.applyEvent({
      type: "room:shared-code-updated",
      payload: { participantId: "s1", code: "x", language: "ts" },
    });
    s.applyEvent({ type: "room:participant-left", payload: { participantId: "s1" } });
    expect(store.getState().participants.has("s1")).toBe(false);
    expect(store.getState().sharedCodes.has("s1")).toBe(false);
  });

  it("applies shared-code-updated and shared-code-cleared", () => {
    const s = store.getState();
    s.applyEvent({
      type: "room:shared-code-updated",
      payload: { participantId: "s1", code: "hello", language: "ts" },
    });
    expect(store.getState().sharedCodes.get("s1")?.code).toBe("hello");
    s.applyEvent({
      type: "room:shared-code-cleared",
      payload: { participantId: "s1" },
    });
    expect(store.getState().sharedCodes.has("s1")).toBe(false);
  });

  it("applies participant-status without touching sharedCodes", () => {
    const s = store.getState();
    s.applyEvent({ type: "room:participant-joined", payload: { participant: mkParticipant("s1", "alice") } });
    s.applyEvent({
      type: "room:participant-status",
      payload: { participantId: "s1", status: "ready" },
    });
    expect(store.getState().participants.get("s1")?.status).toBe("ready");
  });

  it("collapsedPeers is local only", () => {
    const s = store.getState();
    s.togglePeerCollapsed("s1");
    expect(store.getState().collapsedPeers.has("s1")).toBe(true);
    s.togglePeerCollapsed("s1");
    expect(store.getState().collapsedPeers.has("s1")).toBe(false);
  });

  it("allReady selector is true only when all known participants are ready", () => {
    const s = store.getState();
    s.applyEvent({ type: "room:participant-joined", payload: { participant: mkParticipant("s1", "alice") } });
    s.applyEvent({ type: "room:participant-joined", payload: { participant: mkParticipant("s2", "bob") } });
    expect(store.getState().allReady()).toBe(false);
    s.applyEvent({ type: "room:participant-status", payload: { participantId: "s1", status: "ready" } });
    expect(store.getState().allReady()).toBe(false);
    s.applyEvent({ type: "room:participant-status", payload: { participantId: "s2", status: "ready" } });
    expect(store.getState().allReady()).toBe(true);
  });

  it("hydrateFromSnapshot loads participants + sharedCodes", () => {
    store.getState().hydrateFromSnapshot({
      snapshot: {
        id: "r1",
        taskSource: { kind: "catalog", category: "a", slug: "b" },
        maxParticipants: 4,
        participants: [mkParticipant("s1", "alice"), mkParticipant("s2", "bob")],
        createdAt: 0,
      },
      selfId: "s1",
      sharedCodes: [{ participantId: "s2", code: "code2", language: "ts" }],
    });
    expect(store.getState().participants.size).toBe(2);
    expect(store.getState().sharedCodes.get("s2")?.code).toBe("code2");
    expect(store.getState().selfId).toBe("s1");
  });
});
