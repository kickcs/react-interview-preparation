"use client";

import { useMemo, useState } from "react";
import { ScrollArea } from "@/shared/ui/scroll-area";
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
  const slugs = useMemo(
    () => buildAllCategorySlugs(categories, challengeCategories),
    [categories, challengeCategories]
  );

  return (
    <aside className="sticky top-0 h-screen hidden w-[320px] shrink-0 border-r border-border md:block">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-lg font-bold">React Interview</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Подготовка к собеседованию
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ToggleAllAnswersButton />
          <CollapseAllButton slugs={slugs} />
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
