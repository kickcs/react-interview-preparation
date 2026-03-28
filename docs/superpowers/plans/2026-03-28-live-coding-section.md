# Live Coding Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Live Coding" section with 7 subcategories and ~70 coding challenges to the React Interview Preparation app.

**Architecture:** New `challenge` entity mirrors existing `question` entity but reads from `content/live-coding/`. Three new MDX components (`StarterCode`, `Hint`, `Solution`) handle challenge-specific rendering. Sidebar gets a divider and new section. New route `/live-coding/[category]/[slug]` serves challenge pages via SSG.

**Tech Stack:** Next.js 16 App Router, React 19, MDX (`next-mdx-remote/rsc`), `rehype-pretty-code`, Zustand, Tailwind CSS, Vitest

**Spec:** `docs/superpowers/specs/2026-03-28-live-coding-section-design.md`

---

## File Map

### New files

| File | Responsibility |
|------|---------------|
| `src/entities/challenge/model/types.ts` | `ChallengeCategoryMeta`, `ChallengeMeta`, `ChallengeFull`, `AdjacentChallenges` types |
| `src/entities/challenge/lib/get-challenge-categories.ts` | Read `content/live-coding/*/_ meta.json`, return sorted categories |
| `src/entities/challenge/lib/get-challenges.ts` | Read MDX files per subcategory, get single challenge, get adjacent |
| `src/entities/challenge/index.ts` | Public API barrel export |
| `src/shared/ui/starter-code.tsx` | `<StarterCode>` component — wrapper with label + copy button |
| `src/shared/ui/hint.tsx` | `<Hint>` component — collapsible hint with yellow accent |
| `src/shared/ui/solution.tsx` | `<Solution>` component — collapsible solution with green accent |
| `src/widgets/challenge-view/ui/challenge-view.tsx` | MDXRemote rendering for challenges |
| `src/widgets/challenge-view/ui/challenge-navigation.tsx` | Prev/next navigation for challenges |
| `src/widgets/challenge-view/index.ts` | Barrel export |
| `src/app/live-coding/[category]/[slug]/page.tsx` | Challenge page route with SSG |
| `tests/entities/challenge/get-challenges.test.ts` | Entity tests for challenge functions |
| `content/live-coding/_meta.json` | Top-level live-coding section metadata |
| `content/live-coding/{subcategory}/_meta.json` × 7 | Subcategory metadata |
| `content/live-coding/{subcategory}/*.mdx` × ~70 | Challenge MDX content files |

### Modified files

| File | Change |
|------|--------|
| `src/shared/lib/ui-store.ts` | Add `revealedHints`, `toggleHint`, `revealedSolutions`, `toggleSolution` |
| `src/shared/config/constants.ts` | Add `LIVE_CODING_DIR` constant |
| `src/widgets/sidebar/ui/sidebar-nav.tsx` | Add live-coding divider + subcategories section |
| `src/widgets/sidebar/ui/sidebar.tsx` | Pass challenge data to `SidebarNav` |
| `src/widgets/sidebar/ui/mobile-sidebar.tsx` | Pass challenge data to `SidebarNav` |
| `src/app/layout.tsx` | Fetch challenge categories/challenges for sidebar |

---

## Task 1: Constants & Types

**Files:**
- Modify: `src/shared/config/constants.ts`
- Create: `src/entities/challenge/model/types.ts`
- Create: `src/entities/challenge/index.ts` (partial — types only for now)

- [ ] **Step 1: Add LIVE_CODING_DIR constant**

In `src/shared/config/constants.ts`, add:

```ts
export const LIVE_CODING_DIR = path.join(process.cwd(), "content", "live-coding");
```

- [ ] **Step 2: Create challenge types**

Create `src/entities/challenge/model/types.ts`:

```ts
export interface ChallengeCategoryMeta {
  title: string;
  order: number;
  slug: string;
  description: string;
  icon?: string;
}

export interface ChallengeMeta {
  title: string;
  order: number;
  slug: string;
  category: string;
}

export interface ChallengeFull {
  meta: ChallengeMeta;
  content: string;
}

export interface AdjacentChallenges {
  prev: ChallengeMeta | null;
  next: ChallengeMeta | null;
}
```

- [ ] **Step 3: Create partial barrel export**

Create `src/entities/challenge/index.ts`:

```ts
export type {
  ChallengeCategoryMeta,
  ChallengeMeta,
  ChallengeFull,
  AdjacentChallenges,
} from "./model/types";
```

- [ ] **Step 4: Commit**

```bash
git add src/shared/config/constants.ts src/entities/challenge/
git commit -m "feat: add challenge types and LIVE_CODING_DIR constant"
```

---

## Task 2: Seed content — one subcategory with 2 challenges

Before writing entity logic, we need real content to test against.

**Files:**
- Create: `content/live-coding/_meta.json`
- Create: `content/live-coding/javascript/_meta.json`
- Create: `content/live-coding/javascript/01-closure-counter.mdx`
- Create: `content/live-coding/javascript/02-currying.mdx`

- [ ] **Step 1: Create top-level _meta.json**

Create `content/live-coding/_meta.json`:

```json
{
  "title": "Live Coding",
  "order": 100,
  "description": "Практические задачи по программированию",
  "icon": "code",
  "type": "live-coding"
}
```

- [ ] **Step 2: Create javascript subcategory _meta.json**

Create `content/live-coding/javascript/_meta.json`:

```json
{
  "title": "JavaScript",
  "order": 1,
  "description": "Замыкания, this, прототипы, hoisting, event loop"
}
```

- [ ] **Step 3: Create first challenge MDX**

Create `content/live-coding/javascript/01-closure-counter.mdx`:

```mdx
---
title: "Замыкание-счётчик"
order: 1
---

Реализуйте функцию `createCounter`, которая принимает начальное значение и возвращает объект с тремя методами:
- `increment()` — увеличивает счётчик на 1
- `decrement()` — уменьшает счётчик на 1
- `getCount()` — возвращает текущее значение

<StarterCode>

```js
function createCounter(initialValue) {
  // Ваш код здесь
}

// ✅ Проверка
const counter = createCounter(10);
console.log(counter.getCount() === 10);  // true
counter.increment();
counter.increment();
console.log(counter.getCount() === 12);  // true
counter.decrement();
console.log(counter.getCount() === 11);  // true
```

</StarterCode>

<Hint title="Подсказка 1">
Используйте замыкание — объявите переменную внутри функции, чтобы методы имели к ней доступ.
</Hint>

<Hint title="Подсказка 2">
Верните объект с тремя методами. Каждый метод может читать и изменять переменную `count` через замыкание.
</Hint>

<Solution>

```js
function createCounter(initialValue) {
  let count = initialValue;
  return {
    increment() { count++; },
    decrement() { count--; },
    getCount() { return count; },
  };
}
```

</Solution>
```

- [ ] **Step 4: Create second challenge MDX**

Create `content/live-coding/javascript/02-currying.mdx`:

```mdx
---
title: "Каррирование"
order: 2
---

Реализуйте функцию `curry`, которая превращает обычную функцию в каррированную. Каррированная функция принимает аргументы по одному (или группами) и вызывает оригинал, когда набралось достаточно аргументов.

<StarterCode>

```js
function curry(fn) {
  // Ваш код здесь
}

// ✅ Проверка
function sum(a, b, c) {
  return a + b + c;
}

const curriedSum = curry(sum);
console.log(curriedSum(1)(2)(3) === 6);      // true
console.log(curriedSum(1, 2)(3) === 6);      // true
console.log(curriedSum(1)(2, 3) === 6);      // true
console.log(curriedSum(1, 2, 3) === 6);      // true
```

</StarterCode>

<Hint title="Подсказка 1">
Используйте `fn.length`, чтобы узнать сколько аргументов ожидает оригинальная функция.
</Hint>

<Hint title="Подсказка 2">
Верните рекурсивную функцию, которая собирает аргументы. Когда их достаточно — вызывает `fn`.
</Hint>

<Solution>

```js
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function (...nextArgs) {
      return curried.apply(this, [...args, ...nextArgs]);
    };
  };
}
```

</Solution>
```

- [ ] **Step 5: Commit**

```bash
git add content/live-coding/
git commit -m "content: seed live-coding section with javascript subcategory and 2 challenges"
```

---

## Task 3: Challenge entity — data access functions

**Files:**
- Create: `src/entities/challenge/lib/get-challenge-categories.ts`
- Create: `src/entities/challenge/lib/get-challenges.ts`
- Modify: `src/entities/challenge/index.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/entities/challenge/get-challenges.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  getChallengeCategories,
  getChallengesByCategory,
  getChallenge,
  getAdjacentChallenges,
} from "@/entities/challenge";

describe("getChallengeCategories", () => {
  it("returns challenge subcategories sorted by order", async () => {
    const categories = await getChallengeCategories();

    expect(categories.length).toBeGreaterThanOrEqual(1);
    expect(categories[0].slug).toBe("javascript");
    expect(categories[0].title).toBe("JavaScript");
    expect(categories[0].order).toBe(1);

    for (let i = 1; i < categories.length; i++) {
      expect(categories[i].order).toBeGreaterThan(categories[i - 1].order);
    }
  });

  it("each category has required fields", async () => {
    const categories = await getChallengeCategories();

    for (const category of categories) {
      expect(category).toHaveProperty("title");
      expect(category).toHaveProperty("order");
      expect(category).toHaveProperty("description");
      expect(category).toHaveProperty("slug");
    }
  });
});

describe("getChallengesByCategory", () => {
  it("returns challenges sorted by order", async () => {
    const challenges = await getChallengesByCategory("javascript");

    expect(challenges.length).toBeGreaterThanOrEqual(2);
    expect(challenges[0].slug).toBe("closure-counter");
    expect(challenges[0].title).toBe("Замыкание-счётчик");
    expect(challenges[0].order).toBe(1);
    expect(challenges[0].category).toBe("javascript");

    for (let i = 1; i < challenges.length; i++) {
      expect(challenges[i].order).toBeGreaterThan(challenges[i - 1].order);
    }
  });

  it("returns empty array for non-existent category", async () => {
    const challenges = await getChallengesByCategory("nonexistent");
    expect(challenges).toEqual([]);
  });
});

describe("getChallenge", () => {
  it("returns challenge data with content", async () => {
    const challenge = await getChallenge("javascript", "closure-counter");

    expect(challenge.meta.title).toBe("Замыкание-счётчик");
    expect(challenge.meta.slug).toBe("closure-counter");
    expect(challenge.meta.category).toBe("javascript");
    expect(challenge.content).toBeDefined();
    expect(challenge.content.length).toBeGreaterThan(0);
  });
});

describe("getAdjacentChallenges", () => {
  it("returns null prev for first challenge in first category", async () => {
    const adj = await getAdjacentChallenges("javascript", "closure-counter");

    expect(adj.prev).toBeNull();
    expect(adj.next).not.toBeNull();
    expect(adj.next!.slug).toBe("currying");
  });

  it("returns prev and next within same category", async () => {
    const adj = await getAdjacentChallenges("javascript", "currying");

    expect(adj.prev).not.toBeNull();
    expect(adj.prev!.slug).toBe("closure-counter");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bunx vitest run tests/entities/challenge`
Expected: FAIL — module `@/entities/challenge` doesn't export the functions yet

- [ ] **Step 3: Implement getChallengeCategories**

Create `src/entities/challenge/lib/get-challenge-categories.ts`:

```ts
import { cache } from "react";
import fs from "fs/promises";
import path from "path";
import { LIVE_CODING_DIR } from "@/shared/config/constants";
import type { ChallengeCategoryMeta } from "../model/types";

export const getChallengeCategories = cache(
  async (): Promise<ChallengeCategoryMeta[]> => {
    const entries = await fs.readdir(LIVE_CODING_DIR, { withFileTypes: true });
    const categories: ChallengeCategoryMeta[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const metaPath = path.join(LIVE_CODING_DIR, entry.name, "_meta.json");
      try {
        const raw = await fs.readFile(metaPath, "utf-8");
        const meta = JSON.parse(raw);
        categories.push({
          title: meta.title,
          order: meta.order,
          description: meta.description,
          slug: entry.name,
          icon: meta.icon,
        });
      } catch {
        // Skip directories without _meta.json
      }
    }

    return categories.sort((a, b) => a.order - b.order);
  }
);
```

- [ ] **Step 4: Implement getChallengesByCategory, getChallenge, getAdjacentChallenges**

Create `src/entities/challenge/lib/get-challenges.ts`:

```ts
import { cache } from "react";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { LIVE_CODING_DIR } from "@/shared/config/constants";
import { getChallengeCategories } from "./get-challenge-categories";
import type { ChallengeMeta, ChallengeFull, AdjacentChallenges } from "../model/types";

function fileNameToSlug(fileName: string): string {
  return fileName
    .replace(/\.mdx$/, "")
    .replace(/^\d+-/, "");
}

export const getChallengesByCategory = cache(
  async (categorySlug: string): Promise<ChallengeMeta[]> => {
    const categoryDir = path.join(LIVE_CODING_DIR, categorySlug);

    try {
      const files = await fs.readdir(categoryDir);
      const mdxFiles = files.filter((f) => f.endsWith(".mdx"));

      const challenges = await Promise.all(
        mdxFiles.map(async (file) => {
          const raw = await fs.readFile(path.join(categoryDir, file), "utf-8");
          const { data } = matter(raw);
          return {
            title: data.title,
            order: data.order,
            slug: fileNameToSlug(file),
            category: categorySlug,
          };
        })
      );

      return challenges.sort((a, b) => a.order - b.order);
    } catch {
      return [];
    }
  }
);

export const getChallenge = cache(
  async (categorySlug: string, challengeSlug: string): Promise<ChallengeFull> => {
    const categoryDir = path.join(LIVE_CODING_DIR, categorySlug);
    const files = await fs.readdir(categoryDir);
    const fileName = files.find(
      (f) => f.endsWith(".mdx") && fileNameToSlug(f) === challengeSlug
    );

    if (!fileName) {
      throw new Error(`Challenge not found: ${categorySlug}/${challengeSlug}`);
    }

    const filePath = path.join(categoryDir, fileName);
    const raw = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(raw);

    return {
      meta: {
        title: data.title,
        order: data.order,
        slug: challengeSlug,
        category: categorySlug,
      },
      content,
    };
  }
);

export async function getAdjacentChallenges(
  categorySlug: string,
  challengeSlug: string
): Promise<AdjacentChallenges> {
  const challenges = await getChallengesByCategory(categorySlug);
  const challengeIndex = challenges.findIndex((c) => c.slug === challengeSlug);
  const categories = await getChallengeCategories();
  const categoryIndex = categories.findIndex((c) => c.slug === categorySlug);

  let prev: ChallengeMeta | null = null;
  let next: ChallengeMeta | null = null;

  if (challengeIndex > 0) {
    prev = challenges[challengeIndex - 1];
  } else if (challengeIndex === 0 && categoryIndex > 0) {
    const prevChallenges = await getChallengesByCategory(
      categories[categoryIndex - 1].slug
    );
    if (prevChallenges.length > 0) {
      prev = prevChallenges[prevChallenges.length - 1];
    }
  }

  if (challengeIndex < challenges.length - 1) {
    next = challenges[challengeIndex + 1];
  } else if (
    challengeIndex === challenges.length - 1 &&
    categoryIndex < categories.length - 1
  ) {
    const nextChallenges = await getChallengesByCategory(
      categories[categoryIndex + 1].slug
    );
    if (nextChallenges.length > 0) {
      next = nextChallenges[0];
    }
  }

  return { prev, next };
}
```

- [ ] **Step 5: Update barrel export**

Update `src/entities/challenge/index.ts`:

```ts
export { getChallengeCategories } from "./lib/get-challenge-categories";
export {
  getChallengesByCategory,
  getChallenge,
  getAdjacentChallenges,
} from "./lib/get-challenges";
export type {
  ChallengeCategoryMeta,
  ChallengeMeta,
  ChallengeFull,
  AdjacentChallenges,
} from "./model/types";
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `bunx vitest run tests/entities/challenge`
Expected: All 6 tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/entities/challenge/ tests/entities/challenge/
git commit -m "feat: add challenge entity with data access functions and tests"
```

---

## Task 4: Zustand store — add hint/solution state

**Files:**
- Modify: `src/shared/lib/ui-store.ts`

- [ ] **Step 1: Add new state fields**

In `src/shared/lib/ui-store.ts`, update the `UIState` interface and store implementation.

Add to the interface (after `toggleAllCategories`):

```ts
  revealedHints: Record<string, boolean>;
  toggleHint: (id: string) => void;
  revealedSolutions: Record<string, boolean>;
  toggleSolution: (id: string) => void;
```

Add to the `persist` callback (after `toggleAllCategories` implementation):

```ts
      revealedHints: {},
      toggleHint: (id) =>
        set((state) => ({
          revealedHints: {
            ...state.revealedHints,
            [id]: !state.revealedHints[id],
          },
        })),
      revealedSolutions: {},
      toggleSolution: (id) =>
        set((state) => ({
          revealedSolutions: {
            ...state.revealedSolutions,
            [id]: !state.revealedSolutions[id],
          },
        })),
```

The `partialize` function already only persists `collapsedCategories`, so `revealedHints` and `revealedSolutions` will NOT be persisted — they reset on page reload. No changes needed to `partialize`.

- [ ] **Step 2: Verify build**

Run: `bunx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/shared/lib/ui-store.ts
git commit -m "feat: add revealedHints and revealedSolutions to UI store"
```

---

## Task 5: MDX components — StarterCode, Hint, Solution

**Files:**
- Create: `src/shared/ui/starter-code.tsx`
- Create: `src/shared/ui/hint.tsx`
- Create: `src/shared/ui/solution.tsx`

- [ ] **Step 1: Create StarterCode component**

Create `src/shared/ui/starter-code.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/shared/ui/button";

interface StarterCodeProps {
  children: React.ReactNode;
}

export function StarterCode({ children }: StarterCodeProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const codeEl = document.querySelector("[data-starter-code] pre code");
    if (codeEl) {
      navigator.clipboard.writeText(codeEl.textContent ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="my-6" data-starter-code>
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-border bg-emerald-500/10 px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Стартовый код
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleCopy}
          aria-label="Копировать код"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <div className="[&>pre]:!mt-0 [&>pre]:!rounded-t-none">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create Hint component**

Create `src/shared/ui/hint.tsx`:

```tsx
"use client";

import { Lightbulb, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useUIStore, useHydrated } from "@/shared/lib/ui-store";
import { Skeleton } from "@/shared/ui/skeleton";

interface HintProps {
  title: string;
  id: string;
  children: React.ReactNode;
}

export function Hint({ title, id, children }: HintProps) {
  const hydrated = useHydrated();
  const revealed = useUIStore((s) => s.revealedHints[id] ?? false);
  const toggle = useUIStore((s) => s.toggleHint);

  if (!hydrated) {
    return <Skeleton className="my-3 h-11 w-full rounded-lg" />;
  }

  return (
    <div className="my-3">
      <button
        onClick={() => toggle(id)}
        aria-expanded={revealed}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-amber-500/5 px-4 py-2.5 text-sm transition-colors hover:bg-amber-500/10"
      >
        <Lightbulb className="h-4 w-4 shrink-0 text-amber-400" />
        <span className="font-medium text-amber-400">{title}</span>
        <ChevronRight
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            revealed && "rotate-90"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          revealed
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pt-3 text-sm text-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Solution component**

Create `src/shared/ui/solution.tsx`:

```tsx
"use client";

import { Eye, EyeOff, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useUIStore, useHydrated } from "@/shared/lib/ui-store";
import { Skeleton } from "@/shared/ui/skeleton";

interface SolutionProps {
  id: string;
  children: React.ReactNode;
}

export function Solution({ id, children }: SolutionProps) {
  const hydrated = useHydrated();
  const revealed = useUIStore((s) => s.revealedSolutions[id] ?? false);
  const toggle = useUIStore((s) => s.toggleSolution);

  if (!hydrated) {
    return <Skeleton className="my-4 h-11 w-full rounded-lg" />;
  }

  return (
    <div className="my-4">
      <button
        onClick={() => toggle(id)}
        aria-expanded={revealed}
        className="flex w-full items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-sm transition-colors hover:bg-emerald-500/10"
      >
        {revealed ? (
          <EyeOff className="h-4 w-4 shrink-0 text-emerald-400" />
        ) : (
          <Eye className="h-4 w-4 shrink-0 text-emerald-400" />
        )}
        <span className="font-medium text-emerald-400">
          {revealed ? "Скрыть решение" : "Показать решение"}
        </span>
        <ChevronRight
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            revealed && "rotate-90"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          revealed
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="pt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `bunx tsc --noEmit`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/starter-code.tsx src/shared/ui/hint.tsx src/shared/ui/solution.tsx
git commit -m "feat: add StarterCode, Hint, and Solution MDX components"
```

---

## Task 6: Challenge view widget

**Files:**
- Create: `src/widgets/challenge-view/ui/challenge-view.tsx`
- Create: `src/widgets/challenge-view/ui/challenge-navigation.tsx`
- Create: `src/widgets/challenge-view/index.ts`

- [ ] **Step 1: Create ChallengeNavigation component**

Create `src/widgets/challenge-view/ui/challenge-navigation.tsx`:

```tsx
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
```

- [ ] **Step 2: Create ChallengeView component**

Create `src/widgets/challenge-view/ui/challenge-view.tsx`.

**Important:** The `<Hint>` and `<Solution>` components need an `id` prop for Zustand state, but MDX authors only write `<Hint title="...">` and `<Solution>` without ids. We must generate ids from the challenge slug. To do this, create wrapper components inside `ChallengeView` that inject the id:

```tsx
import Link from "next/link";
import { StarterCode } from "@/shared/ui/starter-code";
import { Hint } from "@/shared/ui/hint";
import { Solution } from "@/shared/ui/solution";
import { ChallengeNavigation } from "./challenge-navigation";
import type { ChallengeMeta, AdjacentChallenges } from "@/entities/challenge";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";

interface ChallengeViewProps {
  meta: ChallengeMeta;
  content: string;
  adjacent: AdjacentChallenges;
  categoryTitle: string;
  categoryFirstSlug: string;
  challengeIndex: number;
  totalChallenges: number;
}

export async function ChallengeView({
  meta,
  content,
  adjacent,
  categoryTitle,
  categoryFirstSlug,
  challengeIndex,
  totalChallenges,
}: ChallengeViewProps) {
  const challengeId = `${meta.category}/${meta.slug}`;
  let hintCounter = 0;

  const mdxComponents = {
    StarterCode,
    Hint: ({ title, children }: { title: string; children: React.ReactNode }) => {
      const id = `${challengeId}-hint-${hintCounter++}`;
      return <Hint title={title} id={id}>{children}</Hint>;
    },
    Solution: ({ children }: { children: React.ReactNode }) => (
      <Solution id={challengeId}>{children}</Solution>
    ),
  };

  return (
    <article className="mx-auto max-w-[900px] px-4 py-6 md:px-12 md:py-10">
      <div className="mb-4 text-sm text-muted-foreground">
        <Link
          href={`/live-coding/${meta.category}/${categoryFirstSlug}`}
          className="transition-colors hover:text-foreground"
        >
          {categoryTitle}
        </Link>{" "}
        <span className="text-muted-foreground/50">›</span> Задача{" "}
        {challengeIndex} из {totalChallenges}
      </div>

      <h1 className="mb-8 text-2xl font-bold md:text-3xl">{meta.title}</h1>

      <div className="prose prose-invert max-w-none">
        <MDXRemote
          source={content}
          components={mdxComponents}
          options={{
            mdxOptions: {
              rehypePlugins: [
                [
                  rehypePrettyCode,
                  {
                    theme: "github-dark-default",
                    keepBackground: true,
                  },
                ],
              ],
            },
          }}
        />
      </div>

      <ChallengeNavigation adjacent={adjacent} />
    </article>
  );
}
```

- [ ] **Step 3: Create barrel export**

Create `src/widgets/challenge-view/index.ts`:

```ts
export { ChallengeView } from "./ui/challenge-view";
```

- [ ] **Step 4: Commit**

```bash
git add src/widgets/challenge-view/
git commit -m "feat: add ChallengeView and ChallengeNavigation widgets"
```

---

## Task 7: Challenge page route

**Files:**
- Create: `src/app/live-coding/[category]/[slug]/page.tsx`

- [ ] **Step 1: Create the page component**

Create `src/app/live-coding/[category]/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import {
  getChallengeCategories,
  getChallengesByCategory,
  getChallenge,
  getAdjacentChallenges,
} from "@/entities/challenge";
import { ChallengeView } from "@/widgets/challenge-view";

interface PageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const categories = await getChallengeCategories();
  const allChallenges = await Promise.all(
    categories.map((c) => getChallengesByCategory(c.slug))
  );

  return categories.flatMap((category, i) =>
    allChallenges[i].map((challenge) => ({
      category: category.slug,
      slug: challenge.slug,
    }))
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { category, slug } = await params;
  try {
    const challenge = await getChallenge(category, slug);
    return {
      title: `${challenge.meta.title} — Live Coding`,
    };
  } catch {
    return { title: "Not Found" };
  }
}

export default async function ChallengePage({ params }: PageProps) {
  const { category, slug } = await params;

  let challenge;
  try {
    challenge = await getChallenge(category, slug);
  } catch {
    notFound();
  }

  const categories = await getChallengeCategories();
  const categoryMeta = categories.find((c) => c.slug === category);
  const challenges = await getChallengesByCategory(category);
  const adjacent = await getAdjacentChallenges(category, slug);
  const challengeIndex = challenges.findIndex((c) => c.slug === slug) + 1;

  return (
    <ChallengeView
      meta={challenge.meta}
      content={challenge.content}
      adjacent={adjacent}
      categoryTitle={categoryMeta?.title ?? category}
      categoryFirstSlug={challenges[0]?.slug ?? slug}
      challengeIndex={challengeIndex}
      totalChallenges={challenges.length}
    />
  );
}
```

- [ ] **Step 2: Test manually**

Run: `bun dev`
Navigate to: `http://localhost:3000/live-coding/javascript/closure-counter`
Expected: Challenge page renders with title, starter code, hints, solution

- [ ] **Step 3: Commit**

```bash
git add src/app/live-coding/
git commit -m "feat: add live-coding challenge page route with SSG"
```

---

## Task 8: Sidebar — add live-coding section

**Files:**
- Modify: `src/widgets/sidebar/ui/sidebar-nav.tsx`
- Modify: `src/widgets/sidebar/ui/sidebar.tsx`
- Modify: `src/widgets/sidebar/ui/mobile-sidebar.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update root layout to fetch challenge data**

In `src/app/layout.tsx`, add imports and data fetching:

Add import:
```ts
import {
  getChallengeCategories,
  getChallengesByCategory as getChallenges,
} from "@/entities/challenge";
import type { ChallengeCategoryMeta, ChallengeMeta } from "@/entities/challenge";
```

Inside `RootLayout`, after the existing `questionsByCategory` loop, add:

```ts
  const challengeCategories = await getChallengeCategories();

  const challengesByCategory: Record<string, ChallengeMeta[]> = {};
  for (const cat of challengeCategories) {
    challengesByCategory[cat.slug] = await getChallenges(cat.slug);
  }
```

Pass new props to both `Sidebar` and `MobileSidebar`:

```tsx
<Sidebar
  categories={categories}
  questionsByCategory={questionsByCategory}
  challengeCategories={challengeCategories}
  challengesByCategory={challengesByCategory}
/>
```

```tsx
<MobileSidebar
  categories={categories}
  questionsByCategory={questionsByCategory}
  challengeCategories={challengeCategories}
  challengesByCategory={challengesByCategory}
/>
```

- [ ] **Step 2: Update SidebarNav props and add live-coding section**

In `src/widgets/sidebar/ui/sidebar-nav.tsx`:

Add import:
```ts
import type { ChallengeCategoryMeta, ChallengeMeta } from "@/entities/challenge";
import { Code } from "lucide-react";
```

Add `Code` to the existing lucideIcons map:
```ts
  code: Code,
```

Update `SidebarNavProps`:
```ts
interface SidebarNavProps {
  categories: CategoryMeta[];
  questionsByCategory: Record<string, QuestionMeta[]>;
  challengeCategories: ChallengeCategoryMeta[];
  challengesByCategory: Record<string, ChallengeMeta[]>;
  onNavigate?: () => void;
}
```

In `SidebarNav`, destructure new props:
```ts
export function SidebarNav({
  categories,
  questionsByCategory,
  challengeCategories,
  challengesByCategory,
  onNavigate,
}: SidebarNavProps) {
```

After the existing `categories.map(...)` block (inside `<nav>`), add the live-coding divider and section:

```tsx
      {/* Live Coding divider */}
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
```

Update the skeleton loader too — add a placeholder for the live-coding section after the existing skeleton categories:

After the existing skeleton `categories.map(...)`:
```tsx
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
```

- [ ] **Step 3: Update CollapseAllButton to include challenge slugs**

`CollapseAllButton` receives `slugs` from parent. We need parents to pass challenge slugs too.

Update `CollapseAllButton` — no changes needed to the component itself. The parent (`Sidebar`, `MobileSidebar`) must pass the combined slug array.

- [ ] **Step 4: Update Sidebar component**

In `src/widgets/sidebar/ui/sidebar.tsx`, add imports and update props:

```ts
import type { ChallengeCategoryMeta, ChallengeMeta } from "@/entities/challenge";
```

Update `SidebarProps`:
```ts
interface SidebarProps {
  categories: CategoryMeta[];
  questionsByCategory: Record<string, QuestionMeta[]>;
  challengeCategories: ChallengeCategoryMeta[];
  challengesByCategory: Record<string, ChallengeMeta[]>;
}
```

Update the component:
```ts
export function Sidebar({
  categories,
  questionsByCategory,
  challengeCategories,
  challengesByCategory,
}: SidebarProps) {
  const slugs = [
    ...categories.map((c) => c.slug),
    ...challengeCategories.map((c) => `live-coding-${c.slug}`),
  ];
```

Pass new props to `SidebarNav`:
```tsx
<SidebarNav
  categories={categories}
  questionsByCategory={questionsByCategory}
  challengeCategories={challengeCategories}
  challengesByCategory={challengesByCategory}
/>
```

- [ ] **Step 5: Update MobileSidebar component**

In `src/widgets/sidebar/ui/mobile-sidebar.tsx`, same pattern:

```ts
import type { ChallengeCategoryMeta, ChallengeMeta } from "@/entities/challenge";
```

Update `MobileSidebarProps`:
```ts
interface MobileSidebarProps {
  categories: CategoryMeta[];
  questionsByCategory: Record<string, QuestionMeta[]>;
  challengeCategories: ChallengeCategoryMeta[];
  challengesByCategory: Record<string, ChallengeMeta[]>;
}
```

Update the component:
```ts
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
```

Pass new props to `SidebarNav`:
```tsx
<SidebarNav
  categories={categories}
  questionsByCategory={questionsByCategory}
  challengeCategories={challengeCategories}
  challengesByCategory={challengesByCategory}
  onNavigate={() => setOpen(false)}
/>
```

- [ ] **Step 6: Verify dev server**

Run: `bun dev`
Expected: Sidebar shows existing Q&A categories, then "Live Coding" divider, then "JAVASCRIPT" with 2 challenges. Clicking a challenge navigates to `/live-coding/javascript/closure-counter`.

- [ ] **Step 7: Run all existing tests to ensure no regressions**

Run: `bun run test`
Expected: All tests pass

- [ ] **Step 8: Commit**

```bash
git add src/widgets/sidebar/ src/app/layout.tsx
git commit -m "feat: add live-coding section to sidebar with divider and violet accent"
```

---

## Task 9: Content — all 7 subcategories with 10 challenges each

This is the largest task. Create all remaining content files. Each subcategory gets a `_meta.json` and 10 MDX challenge files.

**Files:**
- Create: `content/live-coding/{subcategory}/_meta.json` × 6 (javascript already exists)
- Create: `content/live-coding/{subcategory}/*.mdx` × ~68 (javascript already has 2)

- [ ] **Step 1: Create remaining subcategory _meta.json files**

Create `content/live-coding/typescript/_meta.json`:
```json
{
  "title": "TypeScript",
  "order": 2,
  "description": "Дженерики, utility types, type narrowing, infer"
}
```

Create `content/live-coding/async/_meta.json`:
```json
{
  "title": "Async",
  "order": 3,
  "description": "Промисы, async/await, race conditions, параллельность"
}
```

Create `content/live-coding/js-trivia/_meta.json`:
```json
{
  "title": "JS Trivia",
  "order": 4,
  "description": "typeof null, NaN === NaN, приведение типов, WTF JS"
}
```

Create `content/live-coding/react/_meta.json`:
```json
{
  "title": "React",
  "order": 5,
  "description": "Хуки, рендеринг, ререндеры, кастомные хуки"
}
```

Create `content/live-coding/refactoring/_meta.json`:
```json
{
  "title": "Refactoring",
  "order": 6,
  "description": "Улучшение читаемости, архитектуры, устранение запахов"
}
```

Create `content/live-coding/algorithms/_meta.json`:
```json
{
  "title": "Algorithms",
  "order": 7,
  "description": "Типовые алгоритмические задачи с собеседований"
}
```

- [ ] **Step 2: Create remaining JavaScript challenges (03–10)**

Create 8 more MDX files in `content/live-coding/javascript/`. Each follows the same format: frontmatter with `title`/`order`, task description, `<StarterCode>` with scaffold + console.log checks, 1-2 `<Hint>` blocks, `<Solution>` block.

Challenges to create:
- `03-debounce.mdx` — реализовать debounce
- `04-deep-clone.mdx` — глубокое клонирование объекта
- `05-flat-array.mdx` — рекурсивное выравнивание массива
- `06-event-emitter.mdx` — паттерн EventEmitter (on/emit/off)
- `07-memoize.mdx` — мемоизация функции
- `08-bind-polyfill.mdx` — реализовать Function.prototype.bind
- `09-promise-all.mdx` — реализовать Promise.all
- `10-get-by-path.mdx` — получение значения объекта по строковому пути

- [ ] **Step 3: Create TypeScript challenges (01–10)**

Create 10 MDX files in `content/live-coding/typescript/`. TypeScript challenges test type-level programming — each has a type problem to solve and `console.log` checks that verify the types work at runtime.

Challenges to create:
- `01-generic-identity.mdx` — типизировать identity-функцию через дженерик
- `02-readonly-deep.mdx` — реализовать DeepReadonly<T>
- `03-pick-implementation.mdx` — реализовать MyPick<T, K>
- `04-return-type.mdx` — реализовать MyReturnType<T>
- `05-tuple-to-union.mdx` — превратить тип кортежа в union
- `06-type-narrowing.mdx` — корректный type guard для shape
- `07-overloaded-function.mdx` — перегрузки функции
- `08-mapped-types.mdx` — Optional<T> через mapped types
- `09-template-literal.mdx` — типы через template literal types
- `10-infer-first-arg.mdx` — извлечь тип первого аргумента функции через infer

- [ ] **Step 4: Create Async challenges (01–10)**

Challenges to create:
- `01-delay.mdx` — промис-обёртка над setTimeout
- `02-sequential-promises.mdx` — выполнить промисы последовательно
- `03-promise-race.mdx` — реализовать Promise.race
- `04-retry-async.mdx` — повторить async-операцию N раз
- `05-parallel-limit.mdx` — параллельное выполнение с лимитом
- `06-async-queue.mdx` — очередь async-задач
- `07-cancellable-promise.mdx` — отменяемый промис через AbortController
- `08-timeout-promise.mdx` — промис с таймаутом
- `09-async-map.mdx` — asyncMap с concurrency
- `10-debounce-async.mdx` — debounce для async-функций

- [ ] **Step 5: Create JS Trivia challenges (01–10)**

JS Trivia format: показать код, спросить "что выведет console.log?". Пользователь должен предсказать вывод, потом проверить запустив.

Challenges to create:
- `01-typeof-null.mdx` — typeof null и typeof undefined
- `02-equality-coercion.mdx` — == vs === с приведением типов
- `03-hoisting-vars.mdx` — var hoisting и TDZ для let/const
- `04-nan-comparison.mdx` — NaN === NaN, isNaN, Number.isNaN
- `05-array-sort.mdx` — [10, 9, 8].sort() без компаратора
- `06-plus-operator.mdx` — приведение с + ([] + {}, {} + [])
- `07-comma-operator.mdx` — оператор запятая и возвращаемое значение
- `08-scope-closures.mdx` — setTimeout в цикле (var vs let)
- `09-prototype-chain.mdx` — instanceof и prototype-цепочка
- `10-implicit-coercion.mdx` — приведение в if, !, +, -

- [ ] **Step 6: Create React challenges (01–10)**

React challenges: each has a component to fix/implement. Since there's no runtime in the app, provide the component code as starter code that user runs in their own React project.

Challenges to create:
- `01-use-toggle.mdx` — написать кастомный хук useToggle
- `02-use-previous.mdx` — написать хук usePrevious через useRef
- `03-conditional-rendering.mdx` — исправить условный рендеринг
- `04-list-key-fix.mdx` — найти и исправить проблему с key
- `05-use-debounce.mdx` — написать хук useDebounce
- `06-memo-optimization.mdx` — оптимизировать ререндеры через memo
- `07-use-fetch.mdx` — написать хук useFetch с loading/error
- `08-controlled-input.mdx` — превратить uncontrolled в controlled
- `09-use-local-storage.mdx` — написать хук useLocalStorage
- `10-render-counter.mdx` — найти причину лишних ререндеров

- [ ] **Step 7: Create Refactoring challenges (01–10)**

Challenges to create:
- `01-extract-function.mdx` — разбить длинную функцию на части
- `02-remove-magic-numbers.mdx` — убрать магические числа
- `03-simplify-conditionals.mdx` — упростить вложенные if/else
- `04-replace-switch.mdx` — заменить switch на объект-маппинг
- `05-dry-handlers.mdx` — устранить дублирование в обработчиках
- `06-extract-validation.mdx` — вынести валидацию в отдельные функции
- `07-promise-chain.mdx` — переписать .then-цепочку на async/await
- `08-class-to-functions.mdx` — рефакторинг класса в функции
- `09-normalize-data.mdx` — нормализовать вложенную структуру данных
- `10-clean-api-layer.mdx` — рефакторинг API-слоя

- [ ] **Step 8: Create Algorithms challenges (01–10)**

Challenges to create:
- `01-two-sum.mdx` — два числа дающие целевую сумму
- `02-reverse-string.mdx` — развернуть строку без reverse()
- `03-palindrome.mdx` — проверка на палиндром
- `04-fizzbuzz.mdx` — FizzBuzz
- `05-anagram.mdx` — проверка анаграмм
- `06-max-subarray.mdx` — максимальная сумма подмассива (Кадане)
- `07-binary-search.mdx` — бинарный поиск
- `08-flatten-object.mdx` — "выпрямить" вложенный объект
- `09-group-by.mdx` — реализовать groupBy
- `10-linked-list-reverse.mdx` — развернуть связный список

- [ ] **Step 9: Commit all content**

```bash
git add content/live-coding/
git commit -m "content: add 70 live-coding challenges across 7 subcategories"
```

---

## Task 10: Final verification

- [ ] **Step 1: Run all tests**

Run: `bun run test`
Expected: All tests pass

- [ ] **Step 2: Run type check**

Run: `bunx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Run lint**

Run: `bun run lint`
Expected: No lint errors

- [ ] **Step 4: Test production build**

Run: `bun run build`
Expected: Build succeeds, all static pages generated including `/live-coding/*` routes

- [ ] **Step 5: Manual verification**

Run: `bun dev`
Check:
1. Sidebar shows "Live Coding" divider with 7 subcategories in violet
2. Navigate to `/live-coding/javascript/closure-counter` — page renders correctly
3. StarterCode block shows with copy button
4. Hints expand/collapse independently
5. Solution expands/collapses
6. Prev/next navigation works between challenges and across subcategories
7. Mobile sidebar shows live-coding section correctly

- [ ] **Step 6: Commit any fixes**

If any issues found, fix and commit.
