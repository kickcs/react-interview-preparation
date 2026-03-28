"use client";

import { Eye, EyeOff, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useUIStore, useHydrated } from "@/shared/lib/ui-store";
import { Skeleton } from "@/shared/ui/skeleton";

interface SolutionProps {
  id: string;
  children: React.ReactNode;
}

export function Solution({ id, children }: SolutionProps) {
  const hydrated = useHydrated();
  const revealed = useUIStore((s) => s.revealedSolutions[id] ?? false);
  const toggle = useUIStore((s) => s.toggleSolution);

  if (!hydrated) {
    return <Skeleton className="my-4 h-11 w-full rounded-lg" />;
  }

  return (
    <div className="my-4">
      <button
        onClick={() => toggle(id)}
        aria-expanded={revealed}
        className="flex w-full items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-sm transition-colors hover:bg-emerald-500/10"
      >
        {revealed ? (
          <EyeOff className="h-4 w-4 shrink-0 text-emerald-400" />
        ) : (
          <Eye className="h-4 w-4 shrink-0 text-emerald-400" />
        )}
        <span className="font-medium text-emerald-400">
          {revealed ? "Скрыть решение" : "Показать решение"}
        </span>
        <ChevronRight
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            revealed && "rotate-90"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          revealed
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="pt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
