"use client";
import { useState, useSyncExternalStore } from "react";
import { RoomView } from "@/widgets/room-view";
import { JoinRoomForm } from "@/features/room-join/ui/join-room-form";
import { useAutoCollapseOnRouteEnter } from "@/shared/lib/use-auto-collapse-on-route-enter";
import type { TaskContent } from "@/shared/contracts";

interface Props {
  roomId: string;
  task: TaskContent;
  initialParticipantCount: number;
}

const subscribe = () => () => {};

export function RoomClient({ roomId, task, initialParticipantCount }: Props) {
  const [localNickname, setLocalNickname] = useState<string | null>(null);
  const stored = useSyncExternalStore<string | null | undefined>(
    subscribe,
    () => sessionStorage.getItem(`rooms.nickname.${roomId}`),
    () => undefined,
  );
  useAutoCollapseOnRouteEnter(roomId);

  if (stored === undefined) {
    return (
      <main className="mx-auto flex max-w-md justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Загрузка комнаты…</p>
        </div>
      </main>
    );
  }

  const nickname = localNickname ?? stored;

  if (!nickname) {
    return (
      <main className="mx-auto flex max-w-md justify-center px-4 py-10 md:py-16">
        <JoinRoomForm
          roomId={roomId}
          participantCount={initialParticipantCount}
          onSubmit={(nick) => {
            sessionStorage.setItem(`rooms.nickname.${roomId}`, nick);
            setLocalNickname(nick);
          }}
        />
      </main>
    );
  }

  return <RoomView roomId={roomId} nickname={nickname} task={task} />;
}
