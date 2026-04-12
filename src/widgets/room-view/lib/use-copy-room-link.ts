"use client";
import { useCallback, useState } from "react";

export function useCopyRoomLink(roomId: string) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/rooms/${roomId}` : `/rooms/${roomId}`;
  const copy = useCallback(() => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [link]);
  return { link, copied, copy };
}
