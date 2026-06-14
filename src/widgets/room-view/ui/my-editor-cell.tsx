"use client";
import { Check, CircleDashed, Share2 } from "lucide-react";
import { CodeEditor } from "@/features/code-editor/ui/code-editor";
import { ShareCodeToggle } from "@/features/share-code/ui/share-code-toggle";
import { ReadyToggle } from "@/features/ready-toggle/ui/ready-toggle";
import type { ConsoleMessage, Language, ParticipantStatus } from "@/shared/contracts";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

interface Props {
  nickname: string;
  code: string;
  language: Language;
  status: ParticipantStatus;
  isSharing: boolean;
  onCodeChange: (code: string) => void;
  onShareToggle: () => void;
  onStatusChange: (next: ParticipantStatus) => void;
  onConsoleBatch?: (logs: ConsoleMessage[]) => void;
  onConsoleClear?: () => void;
}

export function MyEditorCell({
  nickname,
  code,
  language,
  status,
  isSharing,
  onCodeChange,
  onShareToggle,
  onStatusChange,
  onConsoleBatch,
  onConsoleClear,
}: Props) {
  const ready = status === "ready";
  const StatusIcon = ready ? Check : isSharing ? Share2 : CircleDashed;
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card",
        isSharing && "border-primary/60",
        ready && "border-amber-500/60"
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <StatusIcon />
            You
          </Badge>
          <span className="truncate text-sm font-medium">{nickname}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShareCodeToggle isSharing={isSharing} onToggle={onShareToggle} />
          <ReadyToggle status={status} onChange={onStatusChange} />
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <CodeEditor
          value={code}
          language={language}
          onChange={onCodeChange}
          onConsoleBatch={onConsoleBatch}
          onConsoleClear={onConsoleClear}
        />
      </div>
    </div>
  );
}
