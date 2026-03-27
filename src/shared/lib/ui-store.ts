import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";

interface UIState {
  // Spoiler: open/closed per question
  revealedQuestions: Record<string, boolean>;
  toggleQuestion: (id: string) => void;
  isQuestionRevealed: (id: string) => boolean;

  // Sidebar: collapsed/expanded per category
  collapsedCategories: Record<string, boolean>;
  toggleCategory: (slug: string) => void;
  isCategoryCollapsed: (slug: string) => boolean;
}

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useUIStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useUIStore.persist.onFinishHydration(() => {
        setHydrated(true);
      });
      return unsub;
    }
  }, []);

  return hydrated;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      revealedQuestions: {},
      toggleQuestion: (id) =>
        set((state) => ({
          revealedQuestions: {
            ...state.revealedQuestions,
            [id]: !state.revealedQuestions[id],
          },
        })),
      isQuestionRevealed: (id) => !!get().revealedQuestions[id],

      collapsedCategories: {},
      toggleCategory: (slug) =>
        set((state) => ({
          collapsedCategories: {
            ...state.collapsedCategories,
            [slug]: !state.collapsedCategories[slug],
          },
        })),
      isCategoryCollapsed: (slug) => !!get().collapsedCategories[slug],
    }),
    {
      name: "ui-store",
      partialize: (state) => ({
        revealedQuestions: state.revealedQuestions,
        collapsedCategories: state.collapsedCategories,
      }),
    }
  )
);
