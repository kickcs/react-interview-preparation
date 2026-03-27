"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";
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

  return (
    <nav className="space-y-2 p-3">
      {categories.map((category) => (
        <div key={category.slug} className="mb-4">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {category.title}
          </div>
          {questionsByCategory[category.slug]?.map((question) => {
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
      ))}
    </nav>
  );
}
