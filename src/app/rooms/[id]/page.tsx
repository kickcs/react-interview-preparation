import { notFound } from "next/navigation";
import { RoomClient } from "./room-client";
import { WS_INTERNAL_URL } from "@/shared/config/ws-internal";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function probeRoom(id: string) {
  try {
    const res = await fetch(`${WS_INTERNAL_URL}/api/rooms/${id}`, { cache: "no-store" });
    if (res.status === 404) return { exists: false as const };
    if (!res.ok) return null;
    return (await res.json()) as { exists: true; participantCount: number; maxParticipants: number };
  } catch {
    return null;
  }
}

export default async function RoomIdPage({ params }: PageProps) {
  const { id } = await params;
  const probe = await probeRoom(id);
  if (!probe) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-sm text-destructive">
        Сервер недоступен
      </main>
    );
  }
  if (!probe.exists) {
    notFound();
  }

  const task = { title: id, markdown: "_Loading task from ws-server…_" };

  return (
    <RoomClient
      roomId={id}
      task={task}
      initialParticipantCount={probe.participantCount}
    />
  );
}

export const dynamic = "force-dynamic";
