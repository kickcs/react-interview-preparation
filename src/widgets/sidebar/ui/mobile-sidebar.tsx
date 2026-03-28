"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/shared/ui/sheet";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { SidebarNav, CollapseAllButton } from "./sidebar-nav";
import type { CategoryMeta } from "@/entities/category";
import type { QuestionMeta } from "@/entities/question";
import type { ChallengeCategoryMeta, ChallengeMeta } from "@/entities/challenge";

interface MobileSidebarProps {
  categories: CategoryMeta[];
  questionsByCategory: Record<string, QuestionMeta[]>;
  challengeCategories: ChallengeCategoryMeta[];
  challengesByCategory: Record<string, ChallengeMeta[]>;
}

export function MobileSidebar({
  categories,
  questionsByCategory,
  challengeCategories,
  challengesByCategory,
}: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const slugs = [
    ...categories.map((c) => c.slug),
    ...challengeCategories.map((c) => `live-coding-${c.slug}`),
  ];

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" />}>
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetTitle className="flex items-center justify-between border-b border-border py-4 pl-5 pr-12">
            <div>
              <div className="text-lg font-bold">React Interview</div>
              <div className="mt-1 text-xs font-normal text-muted-foreground">
                Подготовка к собеседованию
              </div>
            </div>
            <CollapseAllButton slugs={slugs} />
          </SheetTitle>
          <ScrollArea className="h-[calc(100vh-73px)]">
            <SidebarNav
              categories={categories}
              questionsByCategory={questionsByCategory}
              challengeCategories={challengeCategories}
              challengesByCategory={challengesByCategory}
              onNavigate={() => setOpen(false)}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>
      <span className="text-sm font-semibold">React Interview</span>
    </div>
  );
}
