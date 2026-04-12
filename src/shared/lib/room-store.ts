import { createStore } from "zustand/vanilla";
import type {
  ParticipantPublic,
  ParticipantStatus,
  RoomSnapshot,
  Language,
  TaskContent,
} from "@/shared/contracts";

export interface SharedCode {
  code: string;
  language: Language;
}

export type RoomEvent =
  | { type: "room:participant-joined"; payload: { participant: ParticipantPublic } }
  | { type: "room:participant-left"; payload: { participantId: string } }
  | { type: "room:participant-status"; payload: { participantId: string; status: ParticipantStatus } }
  | { type: "room:shared-code-updated"; payload: { participantId: string; code: string; language: Language } }
  | { type: "room:shared-code-cleared"; payload: { participantId: string } };

export interface RoomState {
  roomId: string | null;
  selfId: string | null;
  participants: Map<string, ParticipantPublic>;
  sharedCodes: Map<string, SharedCode>;
  collapsedPeers: Set<string>;
  myCode: string;
  myLanguage: Language;
  myStatus: ParticipantStatus;
  isSharing: boolean;
  task: TaskContent | null;
}

export interface RoomActions {
  applyEvent(event: RoomEvent): void;
  hydrateFromSnapshot(input: {
    snapshot: RoomSnapshot;
    selfId: string;
    sharedCodes: Array<{ participantId: string; code: string; language: Language }>;
  }): void;
  setMyCode(code: string): void;
  setMyLanguage(language: Language): void;
  setMyStatus(status: ParticipantStatus): void;
  setSharing(flag: boolean): void;
  setTask(task: TaskContent): void;
  togglePeerCollapsed(id: string): void;
  reset(): void;
  allReady(): boolean;
}

export type RoomStoreState = RoomState & RoomActions;

const initial = (): RoomState => ({
  roomId: null,
  selfId: null,
  participants: new Map(),
  sharedCodes: new Map(),
  collapsedPeers: new Set(),
  myCode: "",
  myLanguage: "ts",
  myStatus: "thinking",
  isSharing: false,
  task: null,
});

export function createRoomStore() {
  return createStore<RoomStoreState>((set, get) => ({
    ...initial(),

    applyEvent(event) {
      set((state) => {
        switch (event.type) {
          case "room:participant-joined": {
            const participants = new Map(state.participants);
            participants.set(event.payload.participant.id, event.payload.participant);
            return { participants };
          }
          case "room:participant-left": {
            const participants = new Map(state.participants);
            participants.delete(event.payload.participantId);
            const sharedCodes = new Map(state.sharedCodes);
            sharedCodes.delete(event.payload.participantId);
            const collapsedPeers = new Set(state.collapsedPeers);
            collapsedPeers.delete(event.payload.participantId);
            return { participants, sharedCodes, collapsedPeers };
          }
          case "room:participant-status": {
            const p = state.participants.get(event.payload.participantId);
            if (!p || p.status === event.payload.status) return state;
            const participants = new Map(state.participants);
            participants.set(p.id, { ...p, status: event.payload.status });
            return { participants };
          }
          case "room:shared-code-updated": {
            const sharedCodes = new Map(state.sharedCodes);
            sharedCodes.set(event.payload.participantId, {
              code: event.payload.code,
              language: event.payload.language,
            });
            const participants = new Map(state.participants);
            const p = participants.get(event.payload.participantId);
            if (p) participants.set(p.id, { ...p, hasSharedCode: true });
            return { sharedCodes, participants };
          }
          case "room:shared-code-cleared": {
            const sharedCodes = new Map(state.sharedCodes);
            sharedCodes.delete(event.payload.participantId);
            const participants = new Map(state.participants);
            const p = participants.get(event.payload.participantId);
            if (p) participants.set(p.id, { ...p, hasSharedCode: false });
            return { sharedCodes, participants };
          }
          default:
            return state;
        }
      });
    },

    hydrateFromSnapshot({ snapshot, selfId, sharedCodes }) {
      const participants = new Map<string, ParticipantPublic>();
      snapshot.participants.forEach((p) => participants.set(p.id, p));
      const sharedMap = new Map<string, SharedCode>();
      sharedCodes.forEach((s) => sharedMap.set(s.participantId, { code: s.code, language: s.language }));
      set({
        roomId: snapshot.id,
        selfId,
        participants,
        sharedCodes: sharedMap,
        collapsedPeers: new Set(),
      });
    },

    setMyCode(code) {
      set({ myCode: code });
    },
    setMyLanguage(language) {
      set({ myLanguage: language });
    },
    setMyStatus(status) {
      set({ myStatus: status });
    },
    setSharing(flag) {
      set({ isSharing: flag });
    },
    setTask(task) {
      set({ task });
    },

    togglePeerCollapsed(id) {
      set((state) => {
        const next = new Set(state.collapsedPeers);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { collapsedPeers: next };
      });
    },

    reset() {
      set(initial());
    },

    allReady() {
      const { participants } = get();
      if (participants.size === 0) return false;
      for (const p of participants.values()) {
        if (p.status !== "ready") return false;
      }
      return true;
    },
  }));
}

export const roomStore = createRoomStore();
