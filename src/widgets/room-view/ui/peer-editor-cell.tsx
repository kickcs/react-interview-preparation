"use client";
import { ReadOnlyEditor } from "@/features/code-editor/ui/read-only-editor";
import { PeerPanelCollapse } from "@/features/hide-peer-code/ui/peer-panel-collapse";
import type { Language, ParticipantPublic } from "@/shared/contracts";

interface Props {
  participant: ParticipantPublic;
  sharedCode?: { code: string; language: Language };
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function PeerEditorCell({ participant, sharedCode, collapsed, onToggleCollapsed }: Props) {
  const ready = participant.status === "ready";
  return (
    <div
      className={`room-box${sharedCode ? " room-box--shared" : ""}${ready ? " room-box--ready" : ""}`}
      data-boot
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span className="room-label">
          {participant.nickname} {ready ? "✓" : sharedCode ? "»" : "◇"}
        </span>
        {sharedCode && (
          <PeerPanelCollapse collapsed={collapsed} onToggle={onToggleCollapsed} />
        )}
      </div>
      {collapsed || !sharedCode ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--room-fg-dim)",
            textAlign: "center",
            fontSize: 12,
          }}
        >
          {sharedCode ? "░░░  HIDDEN (press H to show)  ░░░" : "private / waiting for share"}
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0 }}>
          <ReadOnlyEditor value={sharedCode.code} language={sharedCode.language} />
        </div>
      )}
    </div>
  );
}
