"use client";
import { CodeEditor } from "@/features/code-editor/ui/code-editor";
import { ShareCodeToggle } from "@/features/share-code/ui/share-code-toggle";
import { ReadyToggle } from "@/features/ready-toggle/ui/ready-toggle";
import type { Language, ParticipantStatus } from "@/shared/contracts";

interface Props {
  nickname: string;
  code: string;
  language: Language;
  status: ParticipantStatus;
  isSharing: boolean;
  onCodeChange: (code: string) => void;
  onShareToggle: () => void;
  onStatusChange: (next: ParticipantStatus) => void;
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
}: Props) {
  const ready = status === "ready";
  return (
    <div
      className={`room-box room-box--active${isSharing ? " room-box--shared" : ""}${ready ? " room-box--ready" : ""}`}
      data-boot
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span className="room-label">
          {nickname} {ready ? "✓" : isSharing ? "»" : "◇"}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <ShareCodeToggle isSharing={isSharing} onToggle={onShareToggle} />
          <ReadyToggle status={status} onChange={onStatusChange} />
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <CodeEditor value={code} language={language} onChange={onCodeChange} />
      </div>
    </div>
  );
}
