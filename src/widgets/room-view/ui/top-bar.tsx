"use client";
import Link from "next/link";
import { Check, Circle, CircleDashed, Copy, LogOut, Share2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ParticipantPublic } from "@/shared/contracts";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { useCopyRoomLink } from "../lib/use-copy-room-link";

interface Props {
  roomId: string;
  participants: ParticipantPublic[];
  allReady: boolean;
}

function participantIcon(p: ParticipantPublic): LucideIcon {
  if (p.status === "ready") return Check;
  if (p.hasSharedCode) return Share2;
  if (p.status === "thinking") return CircleDashed;
  return Circle;
}

export function TopBar({ roomId, participants, allReady }: Props) {
  const { copied, copy } = useCopyRoomLink(roomId);
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2.5",
        allReady && "border-amber-500/60"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Комната
        </span>
        <span className="font-mono text-sm font-medium">{roomId}</span>
        <Badge variant="outline">{participants.length}/4</Badge>
        <div className="mx-2 hidden h-4 w-px bg-border md:block" />
        <div className="flex flex-wrap items-center gap-1.5">
          {participants.map((p) => {
            const Icon = participantIcon(p);
            return (
              <Badge
                key={p.id}
                variant={p.status === "ready" ? "default" : "outline"}
                className="gap-1"
              >
                <Icon />
                {p.nickname}
              </Badge>
            );
          })}
        </div>
        {allReady && (
          <Badge variant="default" className="gap-1 bg-amber-500/15 text-amber-500">
            <Check />
            Все готовы
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={copy}>
          <Copy />
          {copied ? "Скопировано" : "Скопировать"}
        </Button>
        <Button size="sm" variant="destructive" render={<Link href="/rooms" />}>
          <LogOut />
          Выйти
        </Button>
      </div>
    </div>
  );
}
