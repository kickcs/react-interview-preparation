"use client";
import { useMemo } from "react";
import { useStore } from "zustand";
import { roomStore } from "@/shared/lib/room-store";
import { useRoomSocket } from "@/shared/lib/use-room-socket";
import { MAX_PARTICIPANTS, type ParticipantPublic, type TaskContent } from "@/shared/contracts";
import { TopBar } from "./top-bar";
import { TaskPanel } from "./task-panel";
import { EditorsGrid } from "./editors-grid";
import { MyEditorCell } from "./my-editor-cell";
import { PeerEditorCell } from "./peer-editor-cell";
import { EmptySlot } from "./empty-slot";
import { RoomErrors } from "./room-errors";

interface Props {
  roomId: string;
  nickname: string;
  task: TaskContent;
}

export function RoomView({ roomId, nickname, task }: Props) {
  const state = useStore(roomStore);
  const { status, error, emitCodeUpdate, emitShare, emitUnshare, emitStatus } =
    useRoomSocket(roomId, nickname);

  const participantsList = useMemo<ParticipantPublic[]>(
    () => Array.from(state.participants.values()),
    [state.participants]
  );

  const me = state.selfId ? state.participants.get(state.selfId) : undefined;

  const slots: Array<ParticipantPublic | null> = [];
  if (me) slots.push(me);
  participantsList.forEach((p) => {
    if (p.id !== state.selfId) slots.push(p);
  });
  while (slots.length < MAX_PARTICIPANTS) slots.push(null);

  const allReady = state.allReady();

  return (
    <main
      data-all-ready={allReady ? "true" : undefined}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        gap: 8,
        padding: 8,
        position: "relative",
        zIndex: 2,
      }}
    >
      <TopBar roomId={roomId} participants={participantsList} allReady={allReady} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(320px, 38%) 1fr",
          gap: 12,
          flex: 1,
          minHeight: 0,
        }}
      >
        <TaskPanel
          title={state.task?.title ?? task.title}
          markdown={state.task?.markdown ?? task.markdown}
        />
        <EditorsGrid>
          {slots.map((p, i) => {
            if (p && p.id === state.selfId) {
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
                />
              );
            }
            if (p) {
              return (
                <PeerEditorCell
                  key={p.id}
                  participant={p}
                  sharedCode={state.sharedCodes.get(p.id)}
                  collapsed={state.collapsedPeers.has(p.id)}
                  onToggleCollapsed={() => roomStore.getState().togglePeerCollapsed(p.id)}
                />
              );
            }
            return <EmptySlot key={`slot-${i}`} roomId={roomId} />;
          })}
        </EditorsGrid>
      </div>
      <RoomErrors status={status} error={error} />
    </main>
  );
}
