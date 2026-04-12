"use client";
import type { ParticipantStatus } from "@/shared/contracts";

interface Props {
  status: ParticipantStatus;
  onChange: (next: ParticipantStatus) => void;
}

export function ReadyToggle({ status, onChange }: Props) {
  const ready = status === "ready";
  return (
    <button
      className="room-btn"
      data-variant={ready ? "primary" : undefined}
      onClick={() => onChange(ready ? "thinking" : "ready")}
    >
      [ R {ready ? "UNREADY" : "READY"} ]
    </button>
  );
}
