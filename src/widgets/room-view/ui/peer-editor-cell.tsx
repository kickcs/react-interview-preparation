"use client";
import { Check, CircleDashed, EyeOff, Lock, Share2 } from "lucide-react";
import { ReadOnlyEditor } from "@/features/code-editor/ui/read-only-editor";
import { PeerPanelCollapse } from "@/features/hide-peer-code/ui/peer-panel-collapse";
import type { Language, ParticipantPublic } from "@/shared/contracts";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

interface Props {
  participant: ParticipantPublic;
  sharedCode?: { code: string; language: Language };
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function PeerEditorCell({
  participant,
  sharedCode,
  collapsed,
  onToggleCollapsed,
}: Props) {
  const ready = participant.status === "ready";
  const StatusIcon = ready ? Check : sharedCode ? Share2 : CircleDashed;
  const hidden = collapsed || !sharedCode;

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card",
        sharedCode && "border-primary/60",
        ready && "border-amber-500/60"
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <StatusIcon />
            {ready ? "Готов" : sharedCode ? "Делится" : "Думает"}
          </Badge>
          <span className="truncate text-sm font-medium">{participant.nickname}</span>
        </div>
        {sharedCode && (
          <PeerPanelCollapse collapsed={collapsed} onToggle={onToggleCollapsed} />
        )}
      </div>
      {hidden ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center text-sm text-muted-foreground">
          {sharedCode ? (
            <>
              <EyeOff className="size-5" />
              <p>Код скрыт</p>
            </>
          ) : (
            <>
              <Lock className="size-5" />
              <p>Код пока приватный</p>
            </>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <ReadOnlyEditor value={sharedCode.code} language={sharedCode.language} />
        </div>
      )}
    </div>
  );
}
