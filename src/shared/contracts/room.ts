export type Language = "js" | "ts" | "react";

export type ParticipantStatus = "thinking" | "ready";

export type TaskSource =
  | { kind: "catalog"; category: string; slug: string }
  | { kind: "custom"; title: string; markdown: string };

export interface TaskContent {
  title: string;
  markdown: string;
}

export interface ParticipantPublic {
  id: string;
  nickname: string;
  status: ParticipantStatus;
  joinedAt: number;
  hasSharedCode: boolean;
}

export interface RoomSnapshot {
  id: string;
  taskSource: TaskSource;
  maxParticipants: 4;
  participants: ParticipantPublic[];
  createdAt: number;
}

export const MAX_PARTICIPANTS = 4 as const;
export const MAX_CODE_BYTES = 50 * 1024;
export const NICKNAME_MAX_LEN = 20;

const NICKNAME_FORBIDDEN = /[<>]/;

export type NicknameValidation =
  | { ok: true; value: string }
  | { ok: false; reason: "empty" | "too_long" | "forbidden_chars" };

export function validateNickname(raw: string): NicknameValidation {
  const value = raw.trim();
  if (value.length === 0) return { ok: false, reason: "empty" };
  if (value.length > NICKNAME_MAX_LEN) return { ok: false, reason: "too_long" };
  if (NICKNAME_FORBIDDEN.test(value)) return { ok: false, reason: "forbidden_chars" };
  return { ok: true, value };
}
