export type RoomErrorCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_FULL"
  | "NICKNAME_INVALID"
  | "NICKNAME_TAKEN"
  | "CODE_TOO_LARGE"
  | "RATE_LIMITED"
  | "MAX_ROOMS_REACHED"
  | "NOT_JOINED"
  | "INVALID_TASK_SOURCE";

export const ROOM_ERROR_LABELS: Record<RoomErrorCode, string> = {
  ROOM_NOT_FOUND: "Room not found or has been closed",
  ROOM_FULL: "Room is full (4/4)",
  NICKNAME_INVALID: "Nickname must be 1–20 characters with no HTML",
  NICKNAME_TAKEN: "This nickname is already taken in the room",
  CODE_TOO_LARGE: "Code is too large (>50 KB)",
  RATE_LIMITED: "Too many requests — please wait a minute",
  MAX_ROOMS_REACHED: "Server is temporarily at capacity",
  NOT_JOINED: "Join a room first",
  INVALID_TASK_SOURCE: "Invalid task description",
};
