import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AdjacentQuestions } from "@/entities/question";

interface QuestionNavigationProps {
  adjacent: AdjacentQuestions;
}

export function QuestionNavigation({ adjacent }: QuestionNavigationProps) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
      {adjacent.prev ? (
        <Button
          variant="ghost"
          nativeButton={false}
          render={
            <Link href={`/${adjacent.prev.category}/${adjacent.prev.slug}`} />
          }
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {adjacent.prev.title}
        </Button>
      ) : (
        <div />
      )}
      {adjacent.next ? (
        <Button
          variant="ghost"
          nativeButton={false}
          render={
            <Link href={`/${adjacent.next.category}/${adjacent.next.slug}`} />
          }
        >
          {adjacent.next.title}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      ) : (
        <div />
      )}
    </div>
  );
}
