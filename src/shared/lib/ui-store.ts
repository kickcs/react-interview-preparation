import { useState, useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  revealedQuestions: Record<string, boolean>;
  toggleQuestion: (id: string) => void;
  collapsedCategories: Record<string, boolean>;
  toggleCategory: (slug: string) => void;
  toggleAllCategories: (slugs: string[], collapse: boolean) => void;
  revealedHints: Record<string, boolean>;
  toggleHint: (id: string) => void;
  revealedSolutions: Record<string, boolean>;
  toggleSolution: (id: string) => void;
  allAnswersRevealed: boolean;
  toggleAllAnswersRevealed: () => void;
  /** The user's own collapse preference — persisted across visits. */
  sidebarCollapsed: boolean;
  /** Room pages hold the sidebar collapsed while mounted. Never persisted. */
  roomCollapsed: boolean;
  toggleSidebar: () => void;
  setRoomCollapsed: (value: boolean) => void;
}

/**
 * The sidebar is collapsed when the user asked for it, or while a room page
 * holds it. Room pages must not write to `sidebarCollapsed`: that flag is
 * persisted, so a room-driven collapse would follow the user across the whole
 * site and survive reloads.
 */
export function selectSidebarCollapsed(state: UIState): boolean {
  return state.sidebarCollapsed || state.roomCollapsed;
}

type PersistedUIState = Pick<
  UIState,
  "collapsedCategories" | "allAnswersRevealed" | "sidebarCollapsed"
>;

export function partializeUIState(state: UIState): PersistedUIState {
  return {
    collapsedCategories: state.collapsedCategories,
    allAnswersRevealed: state.allAnswersRevealed,
    sidebarCollapsed: state.sidebarCollapsed,
  };
}

/**
 * v0 let room pages persist their collapse into `sidebarCollapsed`, which left
 * the sidebar hidden site-wide for anyone who ever opened a room. Clear it once
 * so those users get their sidebar back; a deliberate collapse costs one click.
 */
export function migrateUIState(persisted: unknown, version: number): unknown {
  if (version >= 1) return persisted;
  if (!persisted || typeof persisted !== "object") return persisted;
  return { ...(persisted as Record<string, unknown>), sidebarCollapsed: false };
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      revealedQuestions: {},
      toggleQuestion: (id) =>
        set((state) => ({
          revealedQuestions: {
            ...state.revealedQuestions,
            [id]: !state.revealedQuestions[id],
          },
        })),
      collapsedCategories: {},
      toggleCategory: (slug) =>
        set((state) => ({
          collapsedCategories: {
            ...state.collapsedCategories,
            [slug]: !state.collapsedCategories[slug],
          },
        })),
      toggleAllCategories: (slugs, collapse) =>
        set(() => {
          if (!collapse) return { collapsedCategories: {} };
          const next: Record<string, boolean> = {};
          for (const s of slugs) next[s] = true;
          return { collapsedCategories: next };
        }),
      revealedHints: {},
      toggleHint: (id) =>
        set((state) => ({
          revealedHints: {
            ...state.revealedHints,
            [id]: !state.revealedHints[id],
          },
        })),
      revealedSolutions: {},
      toggleSolution: (id) =>
        set((state) => ({
          revealedSolutions: {
            ...state.revealedSolutions,
            [id]: !state.revealedSolutions[id],
          },
        })),
      allAnswersRevealed: false,
      toggleAllAnswersRevealed: () =>
        set((state) => ({ allAnswersRevealed: !state.allAnswersRevealed })),
      sidebarCollapsed: false,
      roomCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !selectSidebarCollapsed(state),
          roomCollapsed: false,
        })),
      setRoomCollapsed: (value) => set(() => ({ roomCollapsed: value })),
    }),
    {
      name: "ui-store",
      version: 1,
      migrate: migrateUIState,
      partialize: partializeUIState,
    }
  )
);

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useUIStore.persist.hasHydrated()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHydrated(true);
      return;
    }
    return useUIStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}
