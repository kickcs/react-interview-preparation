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
  ROOM_NOT_FOUND: "Комната не найдена или была закрыта",
  ROOM_FULL: "Комната заполнена (4/4)",
  NICKNAME_INVALID: "Никнейм должен быть 1–20 символов без HTML",
  NICKNAME_TAKEN: "Этот ник уже занят в комнате",
  CODE_TOO_LARGE: "Код слишком большой (>50 KB)",
  RATE_LIMITED: "Слишком много запросов — подожди минуту",
  MAX_ROOMS_REACHED: "Сервер временно переполнен",
  NOT_JOINED: "Сначала присоединись к комнате",
  INVALID_TASK_SOURCE: "Некорректное описание задачи",
};
