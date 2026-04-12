import {
  MAX_PARTICIPANTS,
  type Language,
  type ParticipantStatus,
  type RoomSnapshot,
  type TaskSource,
} from "@/shared/contracts";
import type { Participant, Room, StateStore } from "./types";

export interface StoreDeps {
  now: () => number;
  newRoomId: () => string;
}

export function createStore(deps: StoreDeps): StateStore {
  return {
    rooms: new Map(),
    now: deps.now,
    newRoomId: deps.newRoomId,
  };
}

type Ok<T> = { ok: true } & T;
type Err<E extends string> = { ok: false; error: E };

export function createRoom(
  store: StateStore,
  input: { taskSource: TaskSource; maxRooms: number }
): Ok<{ room: Room }> | Err<"MAX_ROOMS_REACHED"> {
  if (store.rooms.size >= input.maxRooms) {
    return { ok: false, error: "MAX_ROOMS_REACHED" };
  }
  const now = store.now();
  const room: Room = {
    id: store.newRoomId(),
    taskSource: input.taskSource,
    participants: new Map(),
    createdAt: now,
    emptyAt: now,
  };
  store.rooms.set(room.id, room);
  return { ok: true, room };
}

export function getRoom(store: StateStore, roomId: string): Room | undefined {
  return store.rooms.get(roomId);
}

export function joinRoom(
  store: StateStore,
  input: { roomId: string; socketId: string; nickname: string }
):
  | Ok<{ participant: Participant; room: Room }>
  | Err<"ROOM_NOT_FOUND" | "ROOM_FULL" | "NICKNAME_TAKEN"> {
  const room = store.rooms.get(input.roomId);
  if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
  if (room.participants.size >= MAX_PARTICIPANTS) return { ok: false, error: "ROOM_FULL" };

  const lower = input.nickname.toLowerCase();
  for (const p of room.participants.values()) {
    if (p.nickname.toLowerCase() === lower) {
      return { ok: false, error: "NICKNAME_TAKEN" };
    }
  }

  const participant: Participant = {
    id: input.socketId,
    nickname: input.nickname,
    joinedAt: store.now(),
    status: "thinking",
    code: "",
    sharedCode: null,
    language: "ts",
  };
  room.participants.set(participant.id, participant);
  room.emptyAt = null;
  return { ok: true, participant, room };
}

export function leaveRoom(
  store: StateStore,
  input: { roomId: string; socketId: string }
): { removed: boolean; roomEmpty: boolean } {
  const room = store.rooms.get(input.roomId);
  if (!room) return { removed: false, roomEmpty: false };
  const removed = room.participants.delete(input.socketId);
  if (removed && room.participants.size === 0) {
    room.emptyAt = store.now();
  }
  return { removed, roomEmpty: room.participants.size === 0 };
}

export function updateCode(
  store: StateStore,
  input: {
    roomId: string;
    socketId: string;
    code: string;
    language: Language;
    maxCodeBytes: number;
  }
):
  | Ok<{ broadcast: boolean }>
  | Err<"ROOM_NOT_FOUND" | "NOT_JOINED" | "CODE_TOO_LARGE"> {
  const room = store.rooms.get(input.roomId);
  if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
  const p = room.participants.get(input.socketId);
  if (!p) return { ok: false, error: "NOT_JOINED" };
  if (Buffer.byteLength(input.code, "utf8") > input.maxCodeBytes) {
    return { ok: false, error: "CODE_TOO_LARGE" };
  }
  p.code = input.code;
  p.language = input.language;
  const broadcast = p.sharedCode !== null;
  if (broadcast) p.sharedCode = input.code;
  return { ok: true, broadcast };
}

export function shareCode(
  store: StateStore,
  input: { roomId: string; socketId: string }
): Ok<{ code: string; language: Language }> | Err<"ROOM_NOT_FOUND" | "NOT_JOINED"> {
  const room = store.rooms.get(input.roomId);
  if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
  const p = room.participants.get(input.socketId);
  if (!p) return { ok: false, error: "NOT_JOINED" };
  p.sharedCode = p.code;
  return { ok: true, code: p.code, language: p.language };
}

export function unshareCode(
  store: StateStore,
  input: { roomId: string; socketId: string }
): { ok: true } | Err<"ROOM_NOT_FOUND" | "NOT_JOINED"> {
  const room = store.rooms.get(input.roomId);
  if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
  const p = room.participants.get(input.socketId);
  if (!p) return { ok: false, error: "NOT_JOINED" };
  p.sharedCode = null;
  return { ok: true };
}

export function setStatus(
  store: StateStore,
  input: { roomId: string; socketId: string; status: ParticipantStatus }
): { ok: true; changed: boolean } | Err<"ROOM_NOT_FOUND" | "NOT_JOINED"> {
  const room = store.rooms.get(input.roomId);
  if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
  const p = room.participants.get(input.socketId);
  if (!p) return { ok: false, error: "NOT_JOINED" };
  if (p.status === input.status) return { ok: true, changed: false };
  p.status = input.status;
  return { ok: true, changed: true };
}

export function cleanupExpiredRooms(
  store: StateStore,
  input: { ttlMs: number }
): { removed: number } {
  const now = store.now();
  let removed = 0;
  for (const [id, room] of store.rooms) {
    if (room.emptyAt !== null && now - room.emptyAt >= input.ttlMs) {
      store.rooms.delete(id);
      removed++;
    }
  }
  return { removed };
}

export function toSnapshot(room: Room): RoomSnapshot {
  return {
    id: room.id,
    taskSource: room.taskSource,
    maxParticipants: MAX_PARTICIPANTS,
    participants: Array.from(room.participants.values()).map((p) => ({
      id: p.id,
      nickname: p.nickname,
      status: p.status,
      joinedAt: p.joinedAt,
      hasSharedCode: p.sharedCode !== null,
    })),
    createdAt: room.createdAt,
  };
}
