import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AdjacentChallenges } from "@/entities/challenge";

interface ChallengeNavigationProps {
  adjacent: AdjacentChallenges;
}

export function ChallengeNavigation({ adjacent }: ChallengeNavigationProps) {
  return (
    <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-6">
      {adjacent.prev ? (
        <Button
          variant="ghost"
          nativeButton={false}
          className="min-w-0 shrink"
          render={
            <Link
              href={`/live-coding/${adjacent.prev.category}/${adjacent.prev.slug}`}
            />
          }
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span className="truncate">{adjacent.prev.title}</span>
        </Button>
      ) : (
        <div />
      )}
      {adjacent.next ? (
        <Button
          variant="ghost"
          nativeButton={false}
          className="min-w-0 shrink"
          render={
            <Link
              href={`/live-coding/${adjacent.next.category}/${adjacent.next.slug}`}
            />
          }
        >
          <span className="truncate">{adjacent.next.title}</span>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </Button>
      ) : (
        <div />
      )}
    </div>
  );
}
