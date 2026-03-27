import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  _hydrated: boolean;
  revealedQuestions: Record<string, boolean>;
  toggleQuestion: (id: string) => void;
  collapsedCategories: Record<string, boolean>;
  toggleCategory: (slug: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      _hydrated: false,
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
    }),
    {
      name: "ui-store",
      partialize: (state) => ({
        collapsedCategories: state.collapsedCategories,
      }),
      onRehydrateStorage: () => (_state, _error) => {
        useUIStore.setState({ _hydrated: true });
      },
    }
  )
);

export function useHydrated() {
  return useUIStore((s) => s._hydrated);
}
