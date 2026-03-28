import { ScrollArea } from "@/shared/ui/scroll-area";
import { SidebarNav } from "./sidebar-nav";
import type { CategoryMeta } from "@/entities/category";
import type { QuestionMeta } from "@/entities/question";

interface SidebarProps {
  categories: CategoryMeta[];
  questionsByCategory: Record<string, QuestionMeta[]>;
}

export function Sidebar({ categories, questionsByCategory }: SidebarProps) {
  return (
    <aside className="sticky top-0 h-screen hidden w-[320px] shrink-0 border-r border-border md:block">
      <div className="border-b border-border px-5 py-4">
        <div className="text-lg font-bold">React Interview</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Подготовка к собеседованию
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-73px)]">
        <SidebarNav
          categories={categories}
          questionsByCategory={questionsByCategory}
        />
      </ScrollArea>
    </aside>
  );
}
