"use client";
import { AlertTriangle, WifiOff } from "lucide-react";
import type { ConnectionStatus } from "@/shared/lib/use-room-socket";

interface Props {
  status: ConnectionStatus;
  error: string | null;
}

export function RoomErrors({ status, error }: Props) {
  if (status === "joined" && !error) return null;
  if (status === "disconnected") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-xl border border-destructive/50 bg-card p-6 text-center shadow-lg">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <WifiOff className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-destructive">
            Connection lost
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Reconnecting…</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Your code is saved locally.
          </p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="fixed right-4 top-4 z-[60] flex max-w-sm items-start gap-2 rounded-lg border border-destructive/50 bg-card px-4 py-2.5 text-sm text-destructive shadow-md">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }
  return null;
}
