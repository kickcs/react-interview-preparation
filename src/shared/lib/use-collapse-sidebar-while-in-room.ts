"use client";
import { useEffect } from "react";
import { useUIStore } from "./ui-store";

/**
 * Holds the sidebar collapsed for as long as a room page is mounted, so the
 * editors get the full width, and releases it on exit.
 *
 * The hold lives in the non-persisted `roomCollapsed` flag on purpose. Writing
 * to the persisted `sidebarCollapsed` instead would leave the sidebar hidden on
 * every page of the site once the user closed the tab inside a room.
 */
export function useCollapseSidebarWhileInRoom(): void {
  const setRoomCollapsed = useUIStore((s) => s.setRoomCollapsed);

  useEffect(() => {
    setRoomCollapsed(true);
    return () => setRoomCollapsed(false);
  }, [setRoomCollapsed]);
}
