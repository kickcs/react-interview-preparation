"use client";

import { type ComponentType, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Eye,
  EyeOff,
  Globe,
  FishingHook,
  FlaskConical,
  Database,
  Gauge,
  TestTubes,
  Wrench,
  Blocks,
  Code,
  Cloud,
  Shield,
  Sparkles,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useUIStore, useHydrated } from "@/shared/lib/ui-store";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
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
  cloud: Cloud,
  shield: Shield,
  sparkles: Sparkles,
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

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-blue-500/20 text-blue-400">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

interface SidebarNavProps {
  categories: CategoryMeta[];
  questionsByCategory: Record<string, QuestionMeta[]>;
  challengeCategories: ChallengeCategoryMeta[];
  challengesByCategory: Record<string, ChallengeMeta[]>;
  onNavigate?: () => void;
  searchQuery: string;
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

export function ToggleAllAnswersButton() {
  const hydrated = useHydrated();
  const allAnswersRevealed = useUIStore((s) => s.allAnswersRevealed);
  const toggleAllAnswersRevealed = useUIStore(
    (s) => s.toggleAllAnswersRevealed
  );

  if (!hydrated) return null;

  const label = allAnswersRevealed ? "Скрыть все ответы" : "Показать все ответы";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleAllAnswersRevealed}
      aria-label={label}
      title={label}
      className={cn(
        allAnswersRevealed && "text-indigo-400 hover:text-indigo-300"
      )}
    >
      {allAnswersRevealed ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </Button>
  );
}

export function SidebarSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative px-3 pb-2 pt-3">
      <Search className="pointer-events-none absolute left-5.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Поиск вопросов…"
        className="h-8 pl-8 pr-8 text-base md:text-xs"
      />
      {value && (
        <button
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute right-5.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

interface FilteredCategory {
  category: CategoryMeta | ChallengeCategoryMeta;
  storeSlug: string;
  allItems: { slug: string; title: string }[];
  displayItems: { slug: string; title: string }[];
  matchedCount: number;
}

function filterCategories(
  categories: (CategoryMeta | ChallengeCategoryMeta)[],
  itemsBySlug: Record<string, { slug: string; title: string }[]>,
  query: string,
  slugPrefix = "",
): FilteredCategory[] {
  return categories.flatMap((category) => {
    const storeSlug = slugPrefix ? `${slugPrefix}${category.slug}` : category.slug;
    const allItems = itemsBySlug[category.slug] ?? [];

    if (!query) {
      return [{ category, storeSlug, allItems, displayItems: allItems, matchedCount: allItems.length }];
    }

    const matchedItems = allItems.filter((item) => item.title.toLowerCase().includes(query));
    const catMatch = category.title.toLowerCase().includes(query);

    if (!catMatch && matchedItems.length === 0) return [];

    // When only category title matches, show all items
    const displayItems = catMatch && matchedItems.length === 0 ? allItems : matchedItems;
    return [{ category, storeSlug, allItems, displayItems, matchedCount: matchedItems.length }];
  });
}

const LIVE_CODING_SLUG_PREFIX = "live-coding-";

export function buildAllCategorySlugs(
  categories: CategoryMeta[],
  challengeCategories: ChallengeCategoryMeta[],
) {
  return [
    ...categories.map((c) => c.slug),
    ...challengeCategories.map((c) => `${LIVE_CODING_SLUG_PREFIX}${c.slug}`),
  ];
}

interface CategorySectionProps {
  entries: FilteredCategory[];
  query: string;
  isSearching: boolean;
  pathname: string;
  collapsedCategories: Record<string, boolean>;
  toggleCategory: (slug: string) => void;
  hrefPrefix: string;
  activeColor: string;
  activeTextClass: string;
  inactiveTextClass: string;
  onNavigate?: () => void;
}

function CategorySection({
  entries,
  query,
  isSearching,
  pathname,
  collapsedCategories,
  toggleCategory,
  hrefPrefix,
  activeColor,
  activeTextClass,
  inactiveTextClass,
  onNavigate,
}: CategorySectionProps) {
  return (
    <>
      {entries.map(({ category, storeSlug, allItems, displayItems }) => {
        const isCollapsed = isSearching ? false : !!collapsedCategories[storeSlug];
        const isActive = pathname.startsWith(`${hrefPrefix}${category.slug}`);

        return (
          <div key={storeSlug} className="mb-1">
            <button
              onClick={() => !isSearching && toggleCategory(storeSlug)}
              aria-expanded={!isCollapsed}
              className={cn(
                "flex w-full items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                isActive ? activeTextClass : inactiveTextClass,
                isSearching && "cursor-default"
              )}
            >
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                  !isCollapsed && "rotate-90"
                )}
              />
              <CategoryIcon name={category.icon} className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 text-left">
                <HighlightMatch text={category.title} query={query} />
              </span>
              <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                {isSearching && displayItems.length !== allItems.length
                  ? `${displayItems.length}/${allItems.length}`
                  : allItems.length}
              </span>
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
                {displayItems.map((item) => {
                  const href = `${hrefPrefix}${category.slug}/${item.slug}`;
                  const isItemActive = pathname === href;

                  return (
                    <Link
                      key={item.slug}
                      href={href}
                      onClick={onNavigate}
                      className={cn(
                        "block rounded-r-md border-l-2 px-3 py-2 text-sm transition-colors",
                        isItemActive
                          ? `${activeColor} text-foreground`
                          : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <HighlightMatch text={item.title} query={query} />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

export function SidebarNav({
  categories,
  questionsByCategory,
  challengeCategories,
  challengesByCategory,
  onNavigate,
  searchQuery,
}: SidebarNavProps) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const collapsedCategories = useUIStore((s) => s.collapsedCategories);
  const toggleCategory = useUIStore((s) => s.toggleCategory);

  const query = searchQuery.trim().toLowerCase();
  const isSearching = query.length > 0;

  const { questionEntries, challengeEntries, totalMatchedCount } = useMemo(() => {
    const qEntries = filterCategories(categories, questionsByCategory, query);
    const cEntries = filterCategories(challengeCategories, challengesByCategory, query, LIVE_CODING_SLUG_PREFIX);
    const count = query
      ? qEntries.reduce((sum, e) => sum + e.matchedCount, 0) +
        cEntries.reduce((sum, e) => sum + e.matchedCount, 0)
      : 0;
    return { questionEntries: qEntries, challengeEntries: cEntries, totalMatchedCount: count };
  }, [categories, questionsByCategory, challengeCategories, challengesByCategory, query]);

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

  const totalCategoryCount = questionEntries.length + challengeEntries.length;

  return (
    <nav className="space-y-1 p-3">
      <CategorySection
        entries={questionEntries}
        query={query}
        isSearching={isSearching}
        pathname={pathname}
        collapsedCategories={collapsedCategories}
        toggleCategory={toggleCategory}
        hrefPrefix="/"
        activeColor="border-blue-500 bg-blue-500/10"
        activeTextClass="text-foreground"
        inactiveTextClass="text-muted-foreground hover:text-foreground"
        onNavigate={onNavigate}
      />

      {challengeEntries.length > 0 && (
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

          <CategorySection
            entries={challengeEntries}
            query={query}
            isSearching={isSearching}
            pathname={pathname}
            collapsedCategories={collapsedCategories}
            toggleCategory={toggleCategory}
            hrefPrefix="/live-coding/"
            activeColor="border-violet-500 bg-violet-500/10"
            activeTextClass="text-violet-300"
            inactiveTextClass="text-violet-400/60 hover:text-violet-300"
            onNavigate={onNavigate}
          />
        </>
      )}

      {isSearching && totalCategoryCount === 0 && (
        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
          Ничего не найдено
        </div>
      )}

      {isSearching && totalMatchedCount > 0 && (
        <div className="px-3 pt-2 text-center text-[11px] text-muted-foreground">
          {totalMatchedCount === 1
            ? "Найден 1 вопрос"
            : `Найдено ${totalMatchedCount}`}
          {" "}в {totalCategoryCount}{" "}
          {totalCategoryCount === 1 ? "категории" : "категориях"}
        </div>
      )}
    </nav>
  );
}
