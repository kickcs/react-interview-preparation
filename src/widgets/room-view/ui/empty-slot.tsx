"use client";
import { Copy, UserPlus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useCopyRoomLink } from "../lib/use-copy-room-link";

export function EmptySlot({ roomId }: { roomId: string }) {
  const { link, copied, copy } = useCopyRoomLink(roomId);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card/40 p-5 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <UserPlus className="size-5" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        Ожидание игрока
      </p>
      <code className="max-w-full truncate text-[11px] text-muted-foreground">
        {link}
      </code>
      <Button type="button" size="sm" variant="outline" onClick={copy}>
        <Copy />
        {copied ? "Скопировано" : "Скопировать"}
      </Button>
    </div>
  );
}
