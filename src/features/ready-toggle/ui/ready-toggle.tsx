"use client";
import { Check, CircleDashed } from "lucide-react";
import type { ParticipantStatus } from "@/shared/contracts";
import { Button } from "@/shared/ui/button";

interface Props {
  status: ParticipantStatus;
  onChange: (next: ParticipantStatus) => void;
}

export function ReadyToggle({ status, onChange }: Props) {
  const ready = status === "ready";
  return (
    <Button
      type="button"
      size="sm"
      variant={ready ? "default" : "outline"}
      onClick={() => onChange(ready ? "thinking" : "ready")}
    >
      {ready ? <Check /> : <CircleDashed />}
      {ready ? "Готов" : "Не готов"}
    </Button>
  );
}
