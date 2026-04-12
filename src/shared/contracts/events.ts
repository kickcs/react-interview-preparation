import type {
  Language,
  ParticipantPublic,
  ParticipantStatus,
  RoomSnapshot,
  TaskContent,
} from "./room";
import type { RoomErrorCode } from "./errors";

export interface JoinAckOk {
  ok: true;
  snapshot: RoomSnapshot;
  selfId: string;
  task: TaskContent;
  sharedCodes: Array<{ participantId: string; code: string; language: Language }>;
}

export interface JoinAckError {
  ok: false;
  error: RoomErrorCode;
}

export type JoinAck = JoinAckOk | JoinAckError;

export interface ServerToClientEvents {
  "room:participant-joined": (payload: { participant: ParticipantPublic }) => void;
  "room:participant-left": (payload: { participantId: string }) => void;
  "room:participant-status": (payload: { participantId: string; status: ParticipantStatus }) => void;
  "room:shared-code-updated": (payload: { participantId: string; code: string; language: Language }) => void;
  "room:shared-code-cleared": (payload: { participantId: string }) => void;
  "room:error": (payload: { code: RoomErrorCode; message: string }) => void;
}

export interface ClientToServerEvents {
  "room:join": (
    payload: { roomId: string; nickname: string },
    ack: (result: JoinAck) => void
  ) => void;
  "code:update": (payload: { code: string; language: Language }) => void;
  "code:share": () => void;
  "code:unshare": () => void;
  "status:set": (payload: { status: ParticipantStatus }) => void;
}
