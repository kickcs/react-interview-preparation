"use client";

import { Lightbulb, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useUIStore, useHydrated } from "@/shared/lib/ui-store";
import { Skeleton } from "@/shared/ui/skeleton";

interface HintProps {
  title: string;
  id: string;
  children: React.ReactNode;
}

export function Hint({ title, id, children }: HintProps) {
  const hydrated = useHydrated();
  const revealed = useUIStore((s) => s.revealedHints[id] ?? false);
  const toggle = useUIStore((s) => s.toggleHint);

  if (!hydrated) {
    return <Skeleton className="my-3 h-11 w-full rounded-lg" />;
  }

  return (
    <div className="my-3">
      <button
        onClick={() => toggle(id)}
        aria-expanded={revealed}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-amber-500/5 px-4 py-2.5 text-sm transition-colors hover:bg-amber-500/10"
      >
        <Lightbulb className="h-4 w-4 shrink-0 text-amber-400" />
        <span className="font-medium text-amber-400">{title}</span>
        <ChevronRight
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            revealed && "rotate-90"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          revealed
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pt-3 text-sm text-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
