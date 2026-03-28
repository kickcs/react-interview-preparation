"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Globe,
  FishingHook,
  FlaskConical,
  Database,
  Gauge,
  TestTubes,
  Wrench,
  Blocks,
  Code,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useUIStore, useHydrated } from "@/shared/lib/ui-store";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { devicons } from "@/shared/ui/devicons";
import type { CategoryMeta } from "@/entities/category";
import type { QuestionMeta } from "@/entities/question";
import type { ChallengeCategoryMeta, ChallengeMeta } from "@/entities/challenge";

const lucideIcons: Record<string, ComponentType<{ className?: string }>> = {
  globe: Globe,
  "fishing-hook": FishingHook,
  "flask-conical": FlaskConical,
  database: Database,
  gauge: Gauge,
  "test-tubes": TestTubes,
  wrench: Wrench,
  blocks: Blocks,
  code: Code,
};

function CategoryIcon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  if (!name) return null;

  const DevIcon = devicons[name];
  if (DevIcon) return <DevIcon className={className} />;

  const LucideIcon = lucideIcons[name];
  if (LucideIcon) return <LucideIcon className={className} />;

  return null;
}

interface SidebarNavProps {
  categories: CategoryMeta[];
  questionsByCategory: Record<string, QuestionMeta[]>;
  challengeCategories: ChallengeCategoryMeta[];
  challengesByCategory: Record<string, ChallengeMeta[]>;
  onNavigate?: () => void;
}

export function CollapseAllButton({ slugs }: { slugs: string[] }) {
  const hydrated = useHydrated();
  const collapsedCategories = useUIStore((s) => s.collapsedCategories);
  const toggleAllCategories = useUIStore((s) => s.toggleAllCategories);

  if (!hydrated) return null;

  const allCollapsed = slugs.every((s) => collapsedCategories[s]);
  const label = allCollapsed ? "Развернуть все" : "Свернуть все";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => toggleAllCategories(slugs, !allCollapsed)}
      aria-label={label}
      title={label}
    >
      {allCollapsed ? (
        <ChevronsUpDown className="h-4 w-4" />
      ) : (
        <ChevronsDownUp className="h-4 w-4" />
      )}
    </Button>
  );
}

export function SidebarNav({
  categories,
  questionsByCategory,
  challengeCategories,
  challengesByCategory,
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
        <div className="relative my-4">
          <div className="flex justify-center">
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="mb-1">
          <div className="px-3 py-2">
            <Skeleton className="h-3.5 w-20" />
          </div>
        </div>
      </nav>
    );
  }

  const activeCategory = pathname.split("/")[1];

  return (
    <nav className="space-y-1 p-3">
      {categories.map((category) => {
        const isCollapsed = !!collapsedCategories[category.slug];
        const questions = questionsByCategory[category.slug] ?? [];
        const hasActiveQuestion = activeCategory === category.slug;

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
              <CategoryIcon name={category.icon} className="h-3.5 w-3.5 shrink-0" />
              {category.title}
            </button>

            <div
              className={cn(
                "grid transition-all duration-200 ease-in-out",
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

      {challengeCategories.length > 0 && (
        <>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center px-3">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-2 text-[10px] font-semibold uppercase tracking-widest text-violet-400">
                Live Coding
              </span>
            </div>
          </div>

          {challengeCategories.map((category) => {
            const storeSlug = `live-coding-${category.slug}`;
            const isCollapsed = !!collapsedCategories[storeSlug];
            const challenges = challengesByCategory[category.slug] ?? [];
            const hasActiveChallenge =
              pathname.startsWith(`/live-coding/${category.slug}`);

            return (
              <div key={storeSlug} className="mb-1">
                <button
                  onClick={() => toggleCategory(storeSlug)}
                  aria-expanded={!isCollapsed}
                  className={cn(
                    "flex w-full items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                    hasActiveChallenge
                      ? "text-violet-300"
                      : "text-violet-400/60 hover:text-violet-300"
                  )}
                >
                  <ChevronRight
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                      !isCollapsed && "rotate-90"
                    )}
                  />
                  <CategoryIcon
                    name={category.icon}
                    className="h-3.5 w-3.5 shrink-0"
                  />
                  {category.title}
                </button>

                <div
                  className={cn(
                    "grid transition-all duration-200 ease-in-out",
                    isCollapsed
                      ? "grid-rows-[0fr] opacity-0"
                      : "grid-rows-[1fr] opacity-100"
                  )}
                >
                  <div className="overflow-hidden">
                    {challenges.map((challenge) => {
                      const href = `/live-coding/${category.slug}/${challenge.slug}`;
                      const isActive = pathname === href;

                      return (
                        <Link
                          key={challenge.slug}
                          href={href}
                          onClick={onNavigate}
                          className={cn(
                            "block rounded-r-md border-l-2 px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "border-violet-500 bg-violet-500/10 text-foreground"
                              : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          {challenge.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </nav>
  );
}
