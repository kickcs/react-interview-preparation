"use client";

import { Eye, EyeOff } from "lucide-react";
import { useUIStore, useHydrated } from "@/shared/lib/ui-store";
import { Skeleton } from "@/shared/ui/skeleton";

interface ToggleAllAnswersProps {
  pageId: string;
}

export function ToggleAllAnswers({ pageId }: ToggleAllAnswersProps) {
  const hydrated = useHydrated();
  const allRevealed = useUIStore((s) => s.allRevealed[pageId] ?? false);
  const toggleAllRevealed = useUIStore((s) => s.toggleAllRevealed);

  if (!hydrated) {
    return <Skeleton className="h-11 w-64 rounded-lg" />;
  }

  return (
    <button
      onClick={() => toggleAllRevealed(pageId)}
      className="flex items-center gap-2 rounded-lg border border-indigo-500/15 bg-indigo-500/[0.08] px-3.5 py-2.5 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-500/[0.12] hover:text-indigo-300"
    >
      {allRevealed ? (
        <>
          <EyeOff className="h-4 w-4" />
          Скрыть все ответы
        </>
      ) : (
        <>
          <Eye className="h-4 w-4" />
          Показать все ответы
        </>
      )}
    </button>
  );
}
