"use client";

import { useMemo, useState } from "react";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { useUIStore, useHydrated } from "@/shared/lib/ui-store";
import { SidebarToggleButton } from "@/features/toggle-sidebar";
import {
  SidebarNav,
  SidebarSearch,
  CollapseAllButton,
  ToggleAllAnswersButton,
  RoomsCta,
  buildAllCategorySlugs,
} from "./sidebar-nav";
import type { CategoryMeta } from "@/entities/category";
import type { QuestionMeta } from "@/entities/question";
import type { ChallengeCategoryMeta, ChallengeMeta } from "@/entities/challenge";

interface SidebarProps {
  categories: CategoryMeta[];
  questionsByCategory: Record<string, QuestionMeta[]>;
  challengeCategories: ChallengeCategoryMeta[];
  challengesByCategory: Record<string, ChallengeMeta[]>;
}

export function Sidebar({
  categories,
  questionsByCategory,
  challengeCategories,
  challengesByCategory,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const hydrated = useHydrated();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const slugs = useMemo(
    () => buildAllCategorySlugs(categories, challengeCategories),
    [categories, challengeCategories]
  );

  const isCollapsed = hydrated && collapsed;

  if (isCollapsed) {
    return (
      <aside className="sticky top-0 h-screen hidden w-14 shrink-0 border-r border-border md:flex md:flex-col md:items-center md:py-4 md:gap-3">
        <div className="text-xs font-bold tracking-tight">RI</div>
        <SidebarToggleButton />
      </aside>
    );
  }

  return (
    <aside className="sticky top-0 h-screen hidden w-[320px] shrink-0 border-r border-border md:block">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-lg font-bold">React Interview</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Interview Prep
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ToggleAllAnswersButton />
          <CollapseAllButton slugs={slugs} />
          <SidebarToggleButton />
        </div>
      </div>
      <SidebarSearch value={searchQuery} onChange={setSearchQuery} />
      <RoomsCta />
      <ScrollArea className="h-[calc(100vh-73px-52px-57px)]">
        <SidebarNav
          categories={categories}
          questionsByCategory={questionsByCategory}
          challengeCategories={challengeCategories}
          challengesByCategory={challengesByCategory}
          searchQuery={searchQuery}
        />
      </ScrollArea>
    </aside>
  );
}
