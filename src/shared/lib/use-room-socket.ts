"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { getRoomSocket, type RoomSocket } from "./ws-client";
import { roomStore } from "./room-store";
import type {
  ConsoleMessage,
  JoinAck,
  Language,
  ParticipantPublic,
  ParticipantStatus,
  PeerConsoleClearedPayload,
  PeerConsoleOutputPayload,
  RoomErrorCode,
} from "@/shared/contracts";
import { ROOM_ERROR_LABELS } from "@/shared/contracts";

export type ConnectionStatus = "connecting" | "joined" | "disconnected" | "error";

/** "join" = the room:join handshake itself failed and the user can recover by
 * re-entering details (e.g. nickname taken, room full). "runtime" = a transient
 * server error after a successful join (e.g. code too large). */
export type RoomErrorKind = "join" | "runtime";

function errorLabel(code: string): string {
  return ROOM_ERROR_LABELS[code as RoomErrorCode] ?? code;
}

export interface UseRoomSocketResult {
  status: ConnectionStatus;
  error: string | null;
  errorKind: RoomErrorKind | null;
  reconnect: () => void;
  emitCodeUpdate: (code: string, language: Language) => void;
  emitShare: () => void;
  emitUnshare: () => void;
  emitStatus: (status: ParticipantStatus) => void;
  emitConsoleOutput: (logs: ConsoleMessage[]) => void;
  emitConsoleClear: () => void;
}

const SESSION_NICK_KEY = (roomId: string) => `rooms.nickname.${roomId}`;
const SESSION_CODE_KEY = (roomId: string) => `rooms.code.${roomId}`;

export function useRoomSocket(roomId: string, nickname: string): UseRoomSocketResult {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<RoomErrorKind | null>(null);
  const socketRef = useRef<RoomSocket | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onConnectRef = useRef<(() => void) | null>(null);
  const statusRef = useRef<ConnectionStatus>(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    sessionStorage.setItem(SESSION_NICK_KEY(roomId), nickname);
  }, [roomId, nickname]);

  useEffect(() => {
    const socket = getRoomSocket();
    socketRef.current = socket;

    const onConnect = () => {
      setStatus("connecting");
      socket.emit("room:join", { roomId, nickname }, (ack: JoinAck) => {
        if (!ack.ok) {
          setStatus("error");
          setError(errorLabel(ack.error));
          setErrorKind("join");
          return;
        }
        roomStore.getState().hydrateFromSnapshot({
          snapshot: ack.snapshot,
          selfId: ack.selfId,
          sharedCodes: ack.sharedCodes,
        });
        roomStore.getState().setTask(ack.task);
        setStatus("joined");
        setError(null);
        setErrorKind(null);

        const savedCode = sessionStorage.getItem(SESSION_CODE_KEY(roomId));
        if (savedCode) roomStore.getState().setMyCode(savedCode);
      });
    };
    onConnectRef.current = onConnect;

    const onDisconnect = () => setStatus("disconnected");
    const onConnectError = () => setStatus("disconnected");
    const onJoined = (p: { participant: ParticipantPublic }) =>
      roomStore.getState().applyEvent({ type: "room:participant-joined", payload: p });
    const onLeft = (p: { participantId: string }) =>
      roomStore.getState().applyEvent({ type: "room:participant-left", payload: p });
    const onStatus = (p: { participantId: string; status: ParticipantStatus }) =>
      roomStore.getState().applyEvent({ type: "room:participant-status", payload: p });
    const onSharedUpdated = (p: { participantId: string; code: string; language: Language }) =>
      roomStore.getState().applyEvent({ type: "room:shared-code-updated", payload: p });
    const onSharedCleared = (p: { participantId: string }) =>
      roomStore.getState().applyEvent({ type: "room:shared-code-cleared", payload: p });
    const onPeerConsoleOutput = (p: PeerConsoleOutputPayload) =>
      roomStore.getState().appendPeerConsole(p.participantId, p.logs);
    const onPeerConsoleCleared = (p: PeerConsoleClearedPayload) =>
      roomStore.getState().clearPeerConsole(p.participantId);
    const onError = ({ code }: { code: string }) => {
      setError(errorLabel(code));
      setErrorKind("runtime");
    };

    // Always register the listener so socket.io auto-reconnects (and manual
    // reconnect()) re-run the join handshake. The singleton socket may already
    // be connected on a later mount, so also join immediately in that case.
    socket.on("connect", onConnect);
    if (socket.connected) onConnect();

    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("room:participant-joined", onJoined);
    socket.on("room:participant-left", onLeft);
    socket.on("room:participant-status", onStatus);
    socket.on("room:shared-code-updated", onSharedUpdated);
    socket.on("room:shared-code-cleared", onSharedCleared);
    socket.on("room:peer-console-output", onPeerConsoleOutput);
    socket.on("room:peer-console-cleared", onPeerConsoleCleared);
    socket.on("room:error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("room:participant-joined", onJoined);
      socket.off("room:participant-left", onLeft);
      socket.off("room:participant-status", onStatus);
      socket.off("room:shared-code-updated", onSharedUpdated);
      socket.off("room:shared-code-cleared", onSharedCleared);
      socket.off("room:peer-console-output", onPeerConsoleOutput);
      socket.off("room:peer-console-cleared", onPeerConsoleCleared);
      socket.off("room:error", onError);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [roomId, nickname]);

  const emitCodeUpdate = useCallback((code: string, language: Language) => {
    sessionStorage.setItem(SESSION_CODE_KEY(roomId), code);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      socketRef.current?.emit("code:update", { code, language });
    }, 500);
  }, [roomId]);

  const emitShare = useCallback(() => {
    roomStore.getState().setSharing(true);
    socketRef.current?.emit("code:share");
  }, []);

  const emitUnshare = useCallback(() => {
    roomStore.getState().setSharing(false);
    socketRef.current?.emit("code:unshare");
  }, []);

  const emitStatus = useCallback((status: ParticipantStatus) => {
    roomStore.getState().setMyStatus(status);
    socketRef.current?.emit("status:set", { status });
  }, []);

  const emitConsoleOutput = useCallback((logs: ConsoleMessage[]) => {
    if (!roomStore.getState().isSharing) return;
    if (logs.length === 0) return;
    socketRef.current?.emit("console:output", { logs });
  }, []);

  const emitConsoleClear = useCallback(() => {
    if (!roomStore.getState().isSharing) return;
    socketRef.current?.emit("console:clear");
  }, []);

  const reconnect = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;
    // Already in the room — don't fire a duplicate room:join.
    if (statusRef.current === "joined") return;
    setStatus("connecting");
    if (socket.connected) onConnectRef.current?.();
    else socket.connect();
  }, []);

  return { status, error, errorKind, reconnect, emitCodeUpdate, emitShare, emitUnshare, emitStatus, emitConsoleOutput, emitConsoleClear };
}
