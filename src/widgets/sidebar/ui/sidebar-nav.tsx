"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useUIStore, useHydrated } from "@/shared/lib/ui-store";
import { Skeleton } from "@/shared/ui/skeleton";
import type { CategoryMeta } from "@/entities/category";
import type { QuestionMeta } from "@/entities/question";

interface SidebarNavProps {
  categories: CategoryMeta[];
  questionsByCategory: Record<string, QuestionMeta[]>;
  onNavigate?: () => void;
}

export function SidebarNav({
  categories,
  questionsByCategory,
  onNavigate,
}: SidebarNavProps) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const collapsedCategories = useUIStore((s) => s.collapsedCategories);
  const toggleCategory = useUIStore((s) => s.toggleCategory);

  if (!hydrated) {
    return (
      <nav className="space-y-1 p-3">
        {categories.map((category) => (
          <div key={category.slug} className="mb-1">
            <div className="px-3 py-2">
              <Skeleton className="h-3.5 w-24" />
            </div>
            <div className="space-y-1 pl-2">
              <Skeleton className="ml-3 h-4 w-36" />
              <Skeleton className="ml-3 h-4 w-28" />
            </div>
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav className="space-y-1 p-3">
      {categories.map((category) => {
        const isCollapsed = !!collapsedCategories[category.slug];
        const questions = questionsByCategory[category.slug] ?? [];
        const hasActiveQuestion = questions.some(
          (q) => pathname === `/${category.slug}/${q.slug}`
        );

        return (
          <div key={category.slug} className="mb-1">
            <button
              onClick={() => toggleCategory(category.slug)}
              aria-expanded={!isCollapsed}
              className={cn(
                "flex w-full items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                hasActiveQuestion
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                  !isCollapsed && "rotate-90"
                )}
              />
              {category.title}
            </button>

            <div
              className={cn(
                "grid",
                hydrated && "transition-all duration-200 ease-in-out",
                isCollapsed
                  ? "grid-rows-[0fr] opacity-0"
                  : "grid-rows-[1fr] opacity-100"
              )}
            >
              <div className="overflow-hidden">
                {questions.map((question) => {
                  const href = `/${category.slug}/${question.slug}`;
                  const isActive = pathname === href;

                  return (
                    <Link
                      key={question.slug}
                      href={href}
                      onClick={onNavigate}
                      className={cn(
                        "block rounded-r-md border-l-2 px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "border-blue-500 bg-blue-500/10 text-foreground"
                          : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      {question.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
