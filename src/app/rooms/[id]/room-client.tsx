"use client";
import { useCallback, useState, useSyncExternalStore } from "react";
import { RoomView } from "@/widgets/room-view";
import { JoinRoomForm } from "@/features/room-join/ui/join-room-form";
import { useCollapseSidebarWhileInRoom } from "@/shared/lib/use-collapse-sidebar-while-in-room";
import { roomStore } from "@/shared/lib/room-store";
import type { TaskContent } from "@/shared/contracts";

interface Props {
  roomId: string;
  task: TaskContent;
  initialParticipantCount: number;
}

const subscribe = () => () => {};

export function RoomClient({ roomId, task, initialParticipantCount }: Props) {
  const [localNickname, setLocalNickname] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);
  const [joinNotice, setJoinNotice] = useState<string | null>(null);
  const stored = useSyncExternalStore<string | null | undefined>(
    subscribe,
    () => sessionStorage.getItem(`rooms.nickname.${roomId}`),
    () => undefined,
  );
  useCollapseSidebarWhileInRoom();

  const handleJoinError = useCallback(
    (message: string) => {
      sessionStorage.removeItem(`rooms.nickname.${roomId}`);
      roomStore.getState().reset();
      setLocalNickname(null);
      setCleared(true);
      setJoinNotice(message);
    },
    [roomId],
  );

  if (stored === undefined) {
    return (
      <main className="mx-auto flex max-w-md justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Loading room…</p>
        </div>
      </main>
    );
  }

  const nickname = localNickname ?? (cleared ? null : stored);

  if (!nickname) {
    return (
      <main className="mx-auto flex max-w-md justify-center px-4 py-10 md:py-16">
        <JoinRoomForm
          roomId={roomId}
          participantCount={initialParticipantCount}
          notice={joinNotice}
          onSubmit={(nick) => {
            sessionStorage.setItem(`rooms.nickname.${roomId}`, nick);
            setLocalNickname(nick);
            setCleared(false);
            setJoinNotice(null);
          }}
        />
      </main>
    );
  }

  return (
    <RoomView
      roomId={roomId}
      nickname={nickname}
      task={task}
      onJoinError={handleJoinError}
    />
  );
}
