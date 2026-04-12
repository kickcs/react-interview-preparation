export type ConsoleMethod = "log" | "info" | "warn" | "error" | "debug";

export interface ConsoleMessage {
  id: string;
  method: ConsoleMethod;
  data: string[];
  timestamp: number;
}

export interface ConsoleOutputPayload {
  logs: ConsoleMessage[];
}

export interface PeerConsoleOutputPayload {
  participantId: string;
  logs: ConsoleMessage[];
}

export interface PeerConsoleClearedPayload {
  participantId: string;
}
