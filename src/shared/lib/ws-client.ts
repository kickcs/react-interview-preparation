"use client";
import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@/shared/contracts";
import { WS_BASE_URL } from "@/shared/config/ws";

export type RoomSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let singleton: RoomSocket | null = null;

export function getRoomSocket(): RoomSocket {
  if (singleton) return singleton;
  const options = {
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  };
  singleton = (WS_BASE_URL ? io(WS_BASE_URL, options) : io(options)) as RoomSocket;
  return singleton;
}

export function disconnectRoomSocket(): void {
  if (singleton) {
    singleton.disconnect();
    singleton = null;
  }
}
