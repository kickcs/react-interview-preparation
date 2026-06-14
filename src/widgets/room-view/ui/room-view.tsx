"use client";
import { useEffect, useMemo, useRef } from "react";
import { useStore } from "zustand";
import { roomStore } from "@/shared/lib/room-store";
import { useRoomSocket } from "@/shared/lib/use-room-socket";
import { type ParticipantPublic, type TaskContent } from "@/shared/contracts";
import { TopBar } from "./top-bar";
import { TaskPanel } from "./task-panel";
import { EditorsGrid } from "./editors-grid";
import { MyEditorCell } from "./my-editor-cell";
import { PeerEditorCell } from "./peer-editor-cell";
import { RoomErrors } from "./room-errors";

interface Props {
  roomId: string;
  nickname: string;
  task: TaskContent;
  /** Called when the join handshake fails recoverably (nickname taken, room full),
   * so the parent can drop the stored nickname and show the join form again. */
  onJoinError?: (message: string) => void;
}

export function RoomView({ roomId, nickname, task, onJoinError }: Props) {
  const state = useStore(roomStore);
  const {
    status,
    error,
    errorKind,
    reconnect,
    emitCodeUpdate,
    emitShare,
    emitUnshare,
    emitStatus,
    emitConsoleOutput,
    emitConsoleClear,
  } = useRoomSocket(roomId, nickname);

  const joinErrorHandled = useRef(false);
  useEffect(() => {
    if (status === "error" && errorKind === "join" && error && !joinErrorHandled.current) {
      joinErrorHandled.current = true;
      onJoinError?.(error);
    }
  }, [status, errorKind, error, onJoinError]);

  const { participantsList, slots } = useMemo(() => {
    const list = Array.from(state.participants.values());
    const me = state.selfId ? state.participants.get(state.selfId) : undefined;
    const ordered: ParticipantPublic[] = [];
    if (me) ordered.push(me);
    list.forEach((p) => {
      if (p.id !== state.selfId) ordered.push(p);
    });
    return { participantsList: list, slots: ordered.slice(0, 4) };
  }, [state.participants, state.selfId]);

  const allReady = state.allReady();

  return (
    <main className="flex h-screen flex-col gap-3 p-3 md:p-4">
      <TopBar roomId={roomId} participants={participantsList} allReady={allReady} />
      <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-[minmax(320px,38%)_1fr]">
        <TaskPanel
          title={state.task?.title ?? task.title}
          markdown={state.task?.markdown ?? task.markdown}
        />
        <EditorsGrid count={slots.length}>
          {slots.map((p) => {
            if (p.id === state.selfId) {
              return (
                <MyEditorCell
                  key="me"
                  nickname={p.nickname}
                  code={state.myCode}
                  language={state.myLanguage}
                  status={state.myStatus}
                  isSharing={state.isSharing}
                  onCodeChange={(code) => {
                    roomStore.getState().setMyCode(code);
                    emitCodeUpdate(code, state.myLanguage);
                  }}
                  onShareToggle={() => {
                    if (state.isSharing) emitUnshare();
                    else emitShare();
                  }}
                  onStatusChange={emitStatus}
                  onConsoleBatch={emitConsoleOutput}
                  onConsoleClear={emitConsoleClear}
                />
              );
            }
            return (
              <PeerEditorCell
                key={p.id}
                participant={p}
                sharedCode={state.sharedCodes.get(p.id)}
                collapsed={state.collapsedPeers.has(p.id)}
                onToggleCollapsed={() => roomStore.getState().togglePeerCollapsed(p.id)}
              />
            );
          })}
        </EditorsGrid>
      </div>
      <RoomErrors status={status} error={error} errorKind={errorKind} onReconnect={reconnect} />
    </main>
  );
}
