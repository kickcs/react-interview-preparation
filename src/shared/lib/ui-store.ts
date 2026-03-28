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
    }),
    {
      name: "ui-store",
      partialize: (state) => ({
        collapsedCategories: state.collapsedCategories,
      }),
    }
  )
);

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useUIStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useUIStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}
