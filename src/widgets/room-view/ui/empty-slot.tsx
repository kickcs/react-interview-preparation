"use client";
import { useCopyRoomLink } from "../lib/use-copy-room-link";

export function EmptySlot({ roomId }: { roomId: string }) {
  const { link, copied, copy } = useCopyRoomLink(roomId);
  return (
    <div className="room-box" data-boot style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 8 }}>
      <div style={{ color: "var(--room-fg-dim)", letterSpacing: "0.12em" }}>░░░░░░░░░░</div>
      <div className="room-label">WAITING FOR PLAYER</div>
      <div style={{ fontSize: 11, color: "var(--room-fg-dim)", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
        {link}
      </div>
      <button className="room-btn" onClick={copy}>
        [ ↗ {copied ? "COPIED" : "COPY LINK"} ]
      </button>
    </div>
  );
}
