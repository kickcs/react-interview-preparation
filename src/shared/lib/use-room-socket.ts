"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { getRoomSocket, type RoomSocket } from "./ws-client";
import { roomStore } from "./room-store";
import type {
  JoinAck,
  Language,
  ParticipantPublic,
  ParticipantStatus,
} from "@/shared/contracts";

export type ConnectionStatus = "connecting" | "joined" | "disconnected" | "error";

export interface UseRoomSocketResult {
  status: ConnectionStatus;
  error: string | null;
  emitCodeUpdate: (code: string, language: Language) => void;
  emitShare: () => void;
  emitUnshare: () => void;
  emitStatus: (status: ParticipantStatus) => void;
}

const SESSION_NICK_KEY = (roomId: string) => `rooms.nickname.${roomId}`;
const SESSION_CODE_KEY = (roomId: string) => `rooms.code.${roomId}`;

export function useRoomSocket(roomId: string, nickname: string): UseRoomSocketResult {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<RoomSocket | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          setError(ack.error);
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

        const savedCode = sessionStorage.getItem(SESSION_CODE_KEY(roomId));
        if (savedCode) roomStore.getState().setMyCode(savedCode);
      });
    };

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
    const onError = ({ code }: { code: string }) => setError(code);

    if (socket.connected) onConnect();
    else socket.on("connect", onConnect);

    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("room:participant-joined", onJoined);
    socket.on("room:participant-left", onLeft);
    socket.on("room:participant-status", onStatus);
    socket.on("room:shared-code-updated", onSharedUpdated);
    socket.on("room:shared-code-cleared", onSharedCleared);
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

  return { status, error, emitCodeUpdate, emitShare, emitUnshare, emitStatus };
}
