"use client";

import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useUIStore, useHydrated } from "@/shared/lib/ui-store";
import { Skeleton } from "@/shared/ui/skeleton";

interface SpoilerProps {
  id: string;
  children: React.ReactNode;
}

export function Spoiler({ id, children }: SpoilerProps) {
  const hydrated = useHydrated();
  const allAnswersRevealed = useUIStore((s) => s.allAnswersRevealed);
  const isOpen = useUIStore(
    (s) => (s.revealedQuestions[id] ?? false) || s.allAnswersRevealed
  );
  const toggle = useUIStore((s) => s.toggleQuestion);

  if (!hydrated) {
    return <Skeleton className="h-12 w-full rounded-xl" />;
  }

  return (
    <div>
      {!allAnswersRevealed && (
        <button
          onClick={() => toggle(id)}
          aria-expanded={isOpen}
          className="mb-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-5 py-3.5 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground"
        >
          {isOpen ? (
            <>
              <EyeOff className="h-4 w-4" />
              Hide answer
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Show answer
            </>
          )}
        </button>
      )}

      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
