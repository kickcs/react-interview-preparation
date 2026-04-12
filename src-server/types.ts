import type { Language, ParticipantStatus, TaskSource } from "@/shared/contracts";

export interface Participant {
  id: string;
  nickname: string;
  joinedAt: number;
  status: ParticipantStatus;
  code: string;
  sharedCode: string | null;
  language: Language;
}

export interface Room {
  id: string;
  taskSource: TaskSource;
  participants: Map<string, Participant>;
  createdAt: number;
  emptyAt: number | null;
}

export interface StateStore {
  rooms: Map<string, Room>;
  now: () => number;
  newRoomId: () => string;
}
