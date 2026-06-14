"use client";
import { useState } from "react";
import {
  MAX_PARTICIPANTS,
  NICKNAME_MAX_LEN,
  ROOM_ERROR_LABELS,
  validateNickname,
} from "@/shared/contracts";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { FieldLabel } from "@/shared/ui/field-label";

interface Props {
  roomId: string;
  onSubmit: (nickname: string) => void;
  participantCount: number;
}

export function JoinRoomForm({ roomId, onSubmit, participantCount }: Props) {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    const check = validateNickname(nickname);
    if (!check.ok) {
      setError(ROOM_ERROR_LABELS.NICKNAME_INVALID);
      return;
    }
    onSubmit(check.value);
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Room
          </p>
          <p className="mt-1 font-mono text-sm font-medium">{roomId}</p>
        </div>
        <Badge variant="outline">{participantCount}/{MAX_PARTICIPANTS}</Badge>
      </div>

      <div className="my-5 border-t border-border" />

      <div className="space-y-2">
        <FieldLabel htmlFor="join-nickname">Your nickname</FieldLabel>
        <Input
          id="join-nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          maxLength={NICKNAME_MAX_LEN}
          placeholder="alice"
          autoFocus
        />
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <Button type="button" size="lg" className="mt-6 w-full" onClick={handleSubmit}>
        Join room
      </Button>
    </div>
  );
}
