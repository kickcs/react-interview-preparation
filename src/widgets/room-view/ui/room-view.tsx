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

  const { participantsList, slots } = useMemo(() => {
    const list = Array.from(state.participants.values());
    const me = state.selfId ? state.participants.get(state.selfId) : undefined;
    const ordered: Array<ParticipantPublic | null> = [];
    if (me) ordered.push(me);
    list.forEach((p) => {
      if (p.id !== state.selfId) ordered.push(p);
    });
    while (ordered.length < MAX_PARTICIPANTS) ordered.push(null);
    return { participantsList: list, slots: ordered };
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
