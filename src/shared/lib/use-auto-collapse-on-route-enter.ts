"use client";
import { useEffect } from "react";
import { useUIStore } from "./ui-store";

const SENTINEL_KEY = (roomId: string) => `rooms-auto-collapsed:${roomId}`;

export function shouldAutoCollapse(roomId: string, storage: Storage): boolean {
  const key = SENTINEL_KEY(roomId);
  if (storage.getItem(key)) return false;
  storage.setItem(key, "1");
  return true;
}

export function useAutoCollapseOnRouteEnter(roomId: string): void {
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (shouldAutoCollapse(roomId, window.sessionStorage)) {
      setSidebarCollapsed(true);
    }
  }, [roomId, setSidebarCollapsed]);
}
