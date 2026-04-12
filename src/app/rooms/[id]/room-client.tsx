"use client";
import { useSyncExternalStore, useState } from "react";
import { RoomView } from "@/widgets/room-view";
import { JoinRoomForm } from "@/features/room-join/ui/join-room-form";
import type { TaskContent } from "@/shared/contracts";

interface Props {
  roomId: string;
  task: TaskContent;
  initialParticipantCount: number;
}

const noopSubscribe = () => () => {};

export function RoomClient({ roomId, task, initialParticipantCount }: Props) {
  const stored = useSyncExternalStore(
    noopSubscribe,
    () => sessionStorage.getItem(`rooms.nickname.${roomId}`),
    () => null
  );
  const [override, setOverride] = useState<string | null>(null);
  const nickname = override ?? stored;

  if (!nickname) {
    return (
      <main style={{ padding: "48px 24px", position: "relative", zIndex: 2, display: "flex", justifyContent: "center" }}>
        <JoinRoomForm
          roomId={roomId}
          participantCount={initialParticipantCount}
          onSubmit={(nick) => {
            sessionStorage.setItem(`rooms.nickname.${roomId}`, nick);
            setOverride(nick);
          }}
        />
      </main>
    );
  }

  return <RoomView roomId={roomId} nickname={nickname} task={task} />;
}
