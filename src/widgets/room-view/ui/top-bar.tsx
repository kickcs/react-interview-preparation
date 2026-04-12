"use client";
import Link from "next/link";
import type { ParticipantPublic } from "@/shared/contracts";
import { useCopyRoomLink } from "../lib/use-copy-room-link";

interface Props {
  roomId: string;
  participants: ParticipantPublic[];
  allReady: boolean;
}

function glyph(p: ParticipantPublic): string {
  if (p.status === "ready") return "✓";
  if (p.hasSharedCode) return "»";
  return "◉";
}

export function TopBar({ roomId, participants, allReady }: Props) {
  const { copied, copy } = useCopyRoomLink(roomId);
  return (
    <div
      className="room-box"
      data-boot
      style={{
        display: "flex",
        gap: 16,
        alignItems: "center",
        justifyContent: "space-between",
        borderColor: allReady ? "var(--room-amber)" : undefined,
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <span className="room-label">ROOM #{roomId}</span>
        <span style={{ color: "var(--room-fg-dim)" }}>
          {participants.map((p) => `${glyph(p)}${p.nickname}`).join("  ")}
        </span>
        <span className="room-label">[{participants.length}/4]</span>
        {allReady && (
          <span style={{ color: "var(--room-amber)" }}>
            ▓▓▓ ALL HANDS READY ▓▓▓
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="room-btn" onClick={copy}>
          [ ↗ {copied ? "COPIED" : "COPY"} ]
        </button>
        <Link className="room-btn" data-variant="danger" href="/rooms">
          [ × EXIT ]
        </Link>
      </div>
    </div>
  );
}
