"use client";
import type { ConnectionStatus } from "@/shared/lib/use-room-socket";

interface Props {
  status: ConnectionStatus;
  error: string | null;
}

export function RoomErrors({ status, error }: Props) {
  if (status === "joined" && !error) return null;
  if (status === "disconnected") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "repeating-linear-gradient(45deg, rgba(0,0,0,0.7) 0 6px, rgba(0,0,0,0.82) 6px 12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
        }}
      >
        <div className="room-box" style={{ borderColor: "var(--room-crimson)" }}>
          <div style={{ color: "var(--room-crimson)", fontSize: 18 }}>× CONNECTION LOST</div>
          <div className="room-label" style={{ marginTop: 8 }}>reconnecting…</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--room-fg-dim)" }}>
            your code is safe locally.
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          padding: "8px 14px",
          border: "1px solid var(--room-crimson)",
          color: "var(--room-crimson)",
          zIndex: 60,
        }}
      >
        × {error}
      </div>
    );
  }
  return null;
}
