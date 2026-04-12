"use client";
import { useState } from "react";
import { isValidNickname } from "@/entities/room/lib/is-valid-nickname";

interface Props {
  roomId: string;
  onSubmit: (nickname: string) => void;
  participantCount: number;
}

export function JoinRoomForm({ roomId, onSubmit, participantCount }: Props) {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="room-box" style={{ maxWidth: 420 }}>
      <div className="room-label">&gt; room {roomId}</div>
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--room-fg-dim)" }}>
        [{participantCount}/4] players inside
      </div>
      <hr className="room-hr" />
      <div className="room-label">&gt; your nickname</div>
      <input
        className="room-input"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={20}
        style={{ marginTop: 6 }}
      />
      {error && (
        <div style={{ color: "var(--room-crimson)", marginTop: 12, fontSize: 12 }}>{error}</div>
      )}
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <button
          className="room-btn"
          data-variant="primary"
          onClick={() => {
            if (!isValidNickname(nickname)) {
              setError("Никнейм 1–20 символов без < >");
              return;
            }
            onSubmit(nickname.trim());
          }}
        >
          [ JOIN ROOM ]
        </button>
      </div>
    </div>
  );
}
