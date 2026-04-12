import type { Server as IOServer, Socket } from "socket.io";
import {
  joinRoom,
  leaveRoom,
  updateCode,
  shareCode,
  unshareCode,
  setStatus,
  toSnapshot,
} from "./state";
import type { StateStore, Participant } from "./types";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  JoinAck,
  ParticipantPublic,
  TaskContent,
} from "@/shared/contracts";
import { ROOM_ERROR_LABELS, validateNickname } from "@/shared/contracts";

export interface AttachWsOptions {
  store: StateStore;
  maxCodeBytes: number;
  maxUpdatesPerSec: number;
  loadTaskContent?: (roomId: string) => Promise<TaskContent>;
}

interface SocketData {
  roomId?: string;
  nickname?: string;
  updateWindowStart: number;
  updateCount: number;
}

function participantToPublic(p: Participant): ParticipantPublic {
  return {
    id: p.id,
    nickname: p.nickname,
    status: p.status,
    joinedAt: p.joinedAt,
    hasSharedCode: p.sharedCode !== null,
  };
}

export function attachWs(
  io: IOServer<ClientToServerEvents, ServerToClientEvents>,
  opts: AttachWsOptions
): void {
  io.on(
    "connection",
    (
      socket: Socket<
        ClientToServerEvents,
        ServerToClientEvents,
        Record<string, never>,
        SocketData
      >
    ) => {
      socket.data = { updateWindowStart: 0, updateCount: 0 };

      socket.on("room:join", async (payload, ack) => {
        const nick = validateNickname(payload.nickname);
        if (!nick.ok) {
          ack({ ok: false, error: "NICKNAME_INVALID" } satisfies JoinAck);
          return;
        }
        const result = joinRoom(opts.store, {
          roomId: payload.roomId,
          socketId: socket.id,
          nickname: nick.value,
        });
        if (!result.ok) {
          ack({ ok: false, error: result.error } satisfies JoinAck);
          return;
        }
        socket.data.roomId = payload.roomId;
        socket.data.nickname = nick.value;
        await socket.join(payload.roomId);

        const room = result.room;
        const snapshot = toSnapshot(room);
        const sharedCodes = Array.from(room.participants.values())
          .filter((p) => p.sharedCode !== null && p.id !== socket.id)
          .map((p) => ({
            participantId: p.id,
            code: p.sharedCode as string,
            language: p.language,
          }));

        const task: TaskContent = opts.loadTaskContent
          ? await opts.loadTaskContent(payload.roomId)
          : { title: "", markdown: "" };

        ack({ ok: true, snapshot, selfId: socket.id, task, sharedCodes } satisfies JoinAck);
        socket.to(payload.roomId).emit("room:participant-joined", {
          participant: participantToPublic(result.participant),
        });
      });

      socket.on("code:update", (payload) => {
        const roomId = socket.data.roomId;
        if (!roomId) {
          socket.emit("room:error", {
            code: "NOT_JOINED",
            message: ROOM_ERROR_LABELS.NOT_JOINED,
          });
          return;
        }
        const now = Date.now();
        if (now - socket.data.updateWindowStart > 1000) {
          socket.data.updateWindowStart = now;
          socket.data.updateCount = 0;
        }
        socket.data.updateCount += 1;
        if (socket.data.updateCount > opts.maxUpdatesPerSec) return;

        const result = updateCode(opts.store, {
          roomId,
          socketId: socket.id,
          code: payload.code,
          language: payload.language,
          maxCodeBytes: opts.maxCodeBytes,
        });
        if (!result.ok) {
          if (result.error === "CODE_TOO_LARGE") {
            socket.emit("room:error", {
              code: "CODE_TOO_LARGE",
              message: ROOM_ERROR_LABELS.CODE_TOO_LARGE,
            });
          }
          return;
        }
        if (result.broadcast) {
          socket.to(roomId).emit("room:shared-code-updated", {
            participantId: socket.id,
            code: payload.code,
            language: payload.language,
          });
        }
      });

      socket.on("code:share", () => {
        const roomId = socket.data.roomId;
        if (!roomId) return;
        const result = shareCode(opts.store, { roomId, socketId: socket.id });
        if (!result.ok) return;
        socket.to(roomId).emit("room:shared-code-updated", {
          participantId: socket.id,
          code: result.code,
          language: result.language,
        });
      });

      socket.on("code:unshare", () => {
        const roomId = socket.data.roomId;
        if (!roomId) return;
        const result = unshareCode(opts.store, { roomId, socketId: socket.id });
        if (!result.ok) return;
        socket.to(roomId).emit("room:shared-code-cleared", { participantId: socket.id });
      });

      socket.on("status:set", (payload) => {
        const roomId = socket.data.roomId;
        if (!roomId) return;
        const result = setStatus(opts.store, {
          roomId,
          socketId: socket.id,
          status: payload.status,
        });
        if (!result.ok || !result.changed) return;
        io.to(roomId).emit("room:participant-status", {
          participantId: socket.id,
          status: payload.status,
        });
      });

      socket.on("console:output", (payload) => {
        const roomId = socket.data.roomId;
        if (!roomId) return;
        if (!payload || !Array.isArray(payload.logs)) return;
        const logs = payload.logs.slice(0, 50);
        socket.to(roomId).emit("room:peer-console-output", {
          participantId: socket.id,
          logs,
        });
      });

      socket.on("console:clear", () => {
        const roomId = socket.data.roomId;
        if (!roomId) return;
        socket.to(roomId).emit("room:peer-console-cleared", {
          participantId: socket.id,
        });
      });

      socket.on("disconnect", () => {
        const roomId = socket.data.roomId;
        if (!roomId) return;
        const result = leaveRoom(opts.store, { roomId, socketId: socket.id });
        if (result.removed) {
          io.to(roomId).emit("room:participant-left", { participantId: socket.id });
        }
      });
    }
  );
}
