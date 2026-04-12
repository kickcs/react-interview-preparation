import { describe, it, expect, beforeEach } from "vitest";
import { createRoomStore } from "../../../src/shared/lib/room-store";
import type { ConsoleMessage } from "@/shared/contracts";

function mkLog(i: number, method: ConsoleMessage["method"] = "log"): ConsoleMessage {
  return { id: `l${i}`, method, data: [`msg ${i}`], timestamp: i };
}

describe("room-store peer consoles", () => {
  let store: ReturnType<typeof createRoomStore>;
  beforeEach(() => { store = createRoomStore(); });

  it("appends logs for a peer", () => {
    store.getState().appendPeerConsole("p1", [mkLog(1), mkLog(2)]);
    expect(store.getState().peerConsoles.get("p1")?.length).toBe(2);
  });

  it("keeps logs from multiple peers isolated", () => {
    store.getState().appendPeerConsole("p1", [mkLog(1)]);
    store.getState().appendPeerConsole("p2", [mkLog(2)]);
    expect(store.getState().peerConsoles.get("p1")?.length).toBe(1);
    expect(store.getState().peerConsoles.get("p2")?.length).toBe(1);
  });

  it("caps each peer buffer at 200 entries (FIFO)", () => {
    const batch = Array.from({ length: 250 }, (_, i) => mkLog(i));
    store.getState().appendPeerConsole("p1", batch);
    const logs = store.getState().peerConsoles.get("p1") ?? [];
    expect(logs.length).toBe(200);
    expect(logs[0]?.id).toBe("l50");
    expect(logs[199]?.id).toBe("l249");
  });

  it("clearPeerConsole empties the buffer but keeps the key", () => {
    store.getState().appendPeerConsole("p1", [mkLog(1)]);
    store.getState().clearPeerConsole("p1");
    expect(store.getState().peerConsoles.get("p1")?.length).toBe(0);
  });

  it("removePeerConsole deletes the key", () => {
    store.getState().appendPeerConsole("p1", [mkLog(1)]);
    store.getState().removePeerConsole("p1");
    expect(store.getState().peerConsoles.has("p1")).toBe(false);
  });

  it("participant-left also removes peer console", () => {
    store.getState().appendPeerConsole("p1", [mkLog(1)]);
    store.getState().applyEvent({
      type: "room:participant-left",
      payload: { participantId: "p1" },
    });
    expect(store.getState().peerConsoles.has("p1")).toBe(false);
  });

  it("shared-code-cleared also clears peer console", () => {
    store.getState().appendPeerConsole("p1", [mkLog(1)]);
    store.getState().applyEvent({
      type: "room:shared-code-cleared",
      payload: { participantId: "p1" },
    });
    expect(store.getState().peerConsoles.get("p1")?.length).toBe(0);
  });
});
