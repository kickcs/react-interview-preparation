# Content & Readability Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the reading experience for question/answer content with better code blocks, visual hierarchy, answer card styling, and a page-level toggle for all answers.

**Architecture:** CSS-first changes to globals.css and prose styles, component updates to Answer/Spoiler, one new ToggleAllAnswers client component, additive Zustand store changes. No data model or routing changes.

**Tech Stack:** Tailwind CSS v4, rehype-pretty-code, Zustand, Lucide icons, Next.js 16 App Router

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `src/shared/config/mdx.ts` | Add `showLineNumbers` to rehype-pretty-code config |
| Modify | `src/app/globals.css` | Code block line number styles, prose typography, separator class |
| Modify | `src/shared/ui/answer.tsx` | Language-colored card backgrounds and borders |
| Modify | `src/shared/lib/ui-store.ts` | Add `allRevealed` state + `toggleAllRevealed` action |
| Modify | `src/shared/ui/spoiler.tsx` | Read `allRevealed` state, force open when true |
| Create | `src/widgets/question-view/ui/toggle-all-answers.tsx` | Page-level "show/hide all answers" button |
| Modify | `src/widgets/question-view/ui/question-view.tsx` | Add separators, place ToggleAllAnswers component |

---

### Task 1: Code Blocks — Line Numbers + Typography

**Files:**
- Modify: `src/shared/config/mdx.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Enable line numbers in rehype-pretty-code config**

In `src/shared/config/mdx.ts`, add `defaultLang` and line number options:

```typescript
import rehypePrettyCode from "rehype-pretty-code";
import type { Pluggable } from "unified";

export const rehypePlugins: Pluggable[] = [
  [
    rehypePrettyCode,
    {
      theme: "github-dark-default",
      keepBackground: true,
      defaultLang: {
        block: "text",
      },
    },
  ],
];
```

Note: rehype-pretty-code uses shiki which generates `<code data-line-numbers>` with `<span data-line>` elements. Line numbers are styled via CSS counters on `[data-line]`.

- [ ] **Step 2: Add CSS for line numbers and improved code typography**

In `src/app/globals.css`, replace the existing code block styles:

```css
/* Code block styling for MDX content */
[data-rehype-pretty-code-figure] pre {
  @apply overflow-x-auto rounded-lg border border-border;
  padding: 14px 0;
}

[data-rehype-pretty-code-figure] code {
  font-size: 14px;
  line-height: 1.7;
  counter-reset: line;
}

[data-rehype-pretty-code-figure] code[data-line-numbers] > [data-line]::before {
  counter-increment: line;
  content: counter(line);
  display: inline-block;
  width: 2rem;
  margin-right: 1rem;
  text-align: right;
  color: oklch(0.371 0 0);
  user-select: none;
}

[data-rehype-pretty-code-figure] [data-line] {
  padding: 0 16px;
}
```

- [ ] **Step 3: Verify code blocks render correctly**

Run: `bun dev`

Open any question with a code block (e.g. `http://localhost:3000/javascript-core/closures`). Verify:
- Font size is visibly larger (14px)
- Line numbers appear on the left in muted color
- Line numbers are not selectable when copying code
- Code still horizontally scrolls on overflow

- [ ] **Step 4: Commit**

```bash
git add src/shared/config/mdx.ts src/app/globals.css
git commit -m "feat: improve code block typography and add line numbers"
```

---

### Task 2: Answer Cards — Language-Colored Styling

**Files:**
- Modify: `src/shared/ui/answer.tsx`

- [ ] **Step 1: Update Answer component with colored card backgrounds**

Replace `src/shared/ui/answer.tsx`:

```tsx
import { Badge } from "@/shared/ui/badge";

interface AnswerProps {
  lang: "en" | "ru";
  children: React.ReactNode;
}

const langConfig = {
  en: {
    label: "EN",
    sublabel: "English",
    badgeClassName: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    cardClassName: "bg-blue-500/[0.06] border-blue-500/15",
  },
  ru: {
    label: "RU",
    sublabel: "Русский",
    badgeClassName: "bg-purple-500/15 text-purple-400 border-purple-500/25",
    cardClassName: "bg-violet-500/[0.06] border-violet-500/15",
  },
} as const;

export function Answer({ lang, children }: AnswerProps) {
  const config = langConfig[lang];

  return (
    <div
      className={`rounded-[10px] border p-5 md:p-6 ${config.cardClassName}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <Badge variant="outline" className={config.badgeClassName}>
          {config.label}
        </Badge>
        <span className="text-xs text-muted-foreground">{config.sublabel}</span>
      </div>
      <div className="prose dark:prose-invert prose-sm max-w-none">
        {children}
      </div>
    </div>
  );
}
```

Key changes: replaced `bg-card border-border` with language-specific `cardClassName`. EN uses blue, RU uses violet.

- [ ] **Step 2: Verify answer cards**

Run: `bun dev`

Open any question with EN/RU answers. Verify:
- EN card has subtle blue background and blue border
- RU card has subtle violet background and violet border
- Badges still display correctly
- 2-column layout on desktop, 1-column on mobile

- [ ] **Step 3: Commit**

```bash
git add src/shared/ui/answer.tsx
git commit -m "feat: add language-colored card styling for EN/RU answers"
```

---

### Task 3: Visual Separators + Prose Typography

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/widgets/question-view/ui/question-view.tsx`

- [ ] **Step 1: Add separator CSS class and prose overrides to globals.css**

Add at the end of the existing styles in `src/app/globals.css` (before the `@layer base` block):

```css
/* Content separator */
.content-separator {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    oklch(1 0 0 / 6%) 20%,
    oklch(1 0 0 / 6%) 80%,
    transparent
  );
  margin: 28px 0;
}

/* Improved prose typography */
.dark .prose {
  font-size: 15px;
  line-height: 1.8;
}

.dark .prose :where(h2, h3):not(:where([class~="not-prose"] *)) {
  border-bottom: 1px solid oklch(1 0 0 / 6%);
  padding-bottom: 8px;
}

.dark .prose :where(li):not(:where([class~="not-prose"] *)) {
  margin-bottom: 8px;
}

.dark .prose :where(:not(pre) > code):not(:where([class~="not-prose"] *)) {
  background: oklch(1 0 0 / 6%);
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 13.5px;
}
```

- [ ] **Step 2: Add separators to QuestionView**

Replace `src/widgets/question-view/ui/question-view.tsx`:

```tsx
import Link from "next/link";
import { Answer } from "@/shared/ui/answer";
import { AnswerGroup } from "@/shared/ui/answer-group";
import { Spoiler } from "@/shared/ui/spoiler";
import { QuestionNavigation } from "./question-navigation";
import type { QuestionMeta, AdjacentQuestions } from "@/entities/question";
import { MDXRemote } from "next-mdx-remote/rsc";
import { rehypePlugins } from "@/shared/config/mdx";

const mdxComponents = {
  Answer,
  AnswerGroup,
};

interface QuestionViewProps {
  meta: QuestionMeta;
  content: string;
  adjacent: AdjacentQuestions;
  categoryTitle: string;
  categoryHref: string;
  questionIndex: number;
  totalQuestions: number;
}

export async function QuestionView({
  meta,
  content,
  adjacent,
  categoryTitle,
  categoryHref,
  questionIndex,
  totalQuestions,
}: QuestionViewProps) {
  return (
    <article className="mx-auto max-w-[900px] px-4 py-6 md:px-12 md:py-10">
      <div className="mb-4 text-sm text-muted-foreground">
        <Link
          href={categoryHref}
          className="transition-colors hover:text-foreground"
        >
          {categoryTitle}
        </Link>{" "}
        <span className="text-muted-foreground/50">›</span> Вопрос{" "}
        {questionIndex} из {totalQuestions}
      </div>

      <h1 className="mb-8 text-2xl font-bold md:text-3xl">{meta.title}</h1>

      <div className="content-separator" />

      <Spoiler id={`${meta.category}/${meta.slug}`}>
        <MDXRemote
          source={content}
          components={mdxComponents}
          options={{
            mdxOptions: { rehypePlugins },
          }}
        />
      </Spoiler>

      <div className="content-separator" />

      <QuestionNavigation adjacent={adjacent} />
    </article>
  );
}
```

Key changes: added `<div className="content-separator" />` between title → spoiler and spoiler → navigation.

- [ ] **Step 3: Verify separators and prose**

Run: `bun dev`

Verify:
- Gradient separator lines appear between title, content, and navigation
- Prose text is larger (15px), more spacious (line-height 1.8)
- Headings inside prose have subtle bottom border
- List items have more breathing room
- Inline code has background highlight

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/widgets/question-view/ui/question-view.tsx
git commit -m "feat: add visual separators and improve prose typography"
```

---

### Task 4: Toggle "Show All Answers"

**Files:**
- Modify: `src/shared/lib/ui-store.ts`
- Modify: `src/shared/ui/spoiler.tsx`
- Create: `src/widgets/question-view/ui/toggle-all-answers.tsx`
- Modify: `src/widgets/question-view/ui/question-view.tsx`

- [ ] **Step 1: Add allRevealed state to Zustand store**

In `src/shared/lib/ui-store.ts`, add the `allRevealed` field and `toggleAllRevealed` action to the interface and implementation:

Add to `UIState` interface:

```typescript
allRevealed: Record<string, boolean>;
toggleAllRevealed: (pageId: string) => void;
```

Add to the store `(set)` body (after `toggleSolution`):

```typescript
allRevealed: {},
toggleAllRevealed: (pageId) =>
  set((state) => ({
    allRevealed: {
      ...state.allRevealed,
      [pageId]: !state.allRevealed[pageId],
    },
  })),
```

This field is NOT added to `partialize` — it resets on page refresh (intentional).

- [ ] **Step 2: Update Spoiler to respect allRevealed**

In `src/shared/ui/spoiler.tsx`, update the component to read `allRevealed` and force open when true:

```tsx
"use client";

import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useUIStore, useHydrated } from "@/shared/lib/ui-store";
import { Skeleton } from "@/shared/ui/skeleton";

interface SpoilerProps {
  id: string;
  children: React.ReactNode;
}

export function Spoiler({ id, children }: SpoilerProps) {
  const hydrated = useHydrated();
  const revealed = useUIStore((s) => s.revealedQuestions[id] ?? false);
  const allRevealed = useUIStore((s) => s.allRevealed[id.split("/").slice(0, 2).join("/")] ?? false);
  const toggle = useUIStore((s) => s.toggleQuestion);

  const isOpen = revealed || allRevealed;

  if (!hydrated) {
    return <Skeleton className="h-12 w-full rounded-xl" />;
  }

  return (
    <div>
      <button
        onClick={() => toggle(id)}
        aria-expanded={isOpen}
        className="mb-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-5 py-3.5 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground"
      >
        {isOpen ? (
          <>
            <EyeOff className="h-4 w-4" />
            Скрыть ответ / Hide answer
          </>
        ) : (
          <>
            <Eye className="h-4 w-4" />
            Показать ответ / Show answer
          </>
        )}
      </button>

      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
```

Key change: reads `allRevealed` keyed by `category/slug` (extracted from `id`). When `allRevealed` is true for the page, spoiler is forced open.

Note: The `id` prop is already in the format `category/slug` (e.g. `react-basics/virtual-dom`), so we use it directly as the page key. `id.split("/").slice(0, 2).join("/")` ensures we get exactly `category/slug` even if the id has more segments.

- [ ] **Step 3: Create ToggleAllAnswers component**

Create `src/widgets/question-view/ui/toggle-all-answers.tsx`:

```tsx
"use client";

import { Eye, EyeOff } from "lucide-react";
import { useUIStore, useHydrated } from "@/shared/lib/ui-store";
import { Skeleton } from "@/shared/ui/skeleton";

interface ToggleAllAnswersProps {
  pageId: string;
}

export function ToggleAllAnswers({ pageId }: ToggleAllAnswersProps) {
  const hydrated = useHydrated();
  const allRevealed = useUIStore((s) => s.allRevealed[pageId] ?? false);
  const toggleAllRevealed = useUIStore((s) => s.toggleAllRevealed);

  if (!hydrated) {
    return <Skeleton className="h-11 w-64 rounded-lg" />;
  }

  return (
    <button
      onClick={() => toggleAllRevealed(pageId)}
      className="flex items-center gap-2 rounded-lg border border-indigo-500/15 bg-indigo-500/[0.08] px-3.5 py-2.5 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-500/[0.12] hover:text-indigo-300"
    >
      {allRevealed ? (
        <>
          <EyeOff className="h-4 w-4" />
          Скрыть все ответы
        </>
      ) : (
        <>
          <Eye className="h-4 w-4" />
          Показать все ответы
        </>
      )}
    </button>
  );
}
```

- [ ] **Step 4: Place ToggleAllAnswers in QuestionView**

Update `src/widgets/question-view/ui/question-view.tsx` to add the toggle between title and separator:

```tsx
import Link from "next/link";
import { Answer } from "@/shared/ui/answer";
import { AnswerGroup } from "@/shared/ui/answer-group";
import { Spoiler } from "@/shared/ui/spoiler";
import { ToggleAllAnswers } from "./toggle-all-answers";
import { QuestionNavigation } from "./question-navigation";
import type { QuestionMeta, AdjacentQuestions } from "@/entities/question";
import { MDXRemote } from "next-mdx-remote/rsc";
import { rehypePlugins } from "@/shared/config/mdx";

const mdxComponents = {
  Answer,
  AnswerGroup,
};

interface QuestionViewProps {
  meta: QuestionMeta;
  content: string;
  adjacent: AdjacentQuestions;
  categoryTitle: string;
  categoryHref: string;
  questionIndex: number;
  totalQuestions: number;
}

export async function QuestionView({
  meta,
  content,
  adjacent,
  categoryTitle,
  categoryHref,
  questionIndex,
  totalQuestions,
}: QuestionViewProps) {
  const pageId = `${meta.category}/${meta.slug}`;

  return (
    <article className="mx-auto max-w-[900px] px-4 py-6 md:px-12 md:py-10">
      <div className="mb-4 text-sm text-muted-foreground">
        <Link
          href={categoryHref}
          className="transition-colors hover:text-foreground"
        >
          {categoryTitle}
        </Link>{" "}
        <span className="text-muted-foreground/50">›</span> Вопрос{" "}
        {questionIndex} из {totalQuestions}
      </div>

      <h1 className="mb-8 text-2xl font-bold md:text-3xl">{meta.title}</h1>

      <ToggleAllAnswers pageId={pageId} />

      <div className="content-separator" />

      <Spoiler id={pageId}>
        <MDXRemote
          source={content}
          components={mdxComponents}
          options={{
            mdxOptions: { rehypePlugins },
          }}
        />
      </Spoiler>

      <div className="content-separator" />

      <QuestionNavigation adjacent={adjacent} />
    </article>
  );
}
```

- [ ] **Step 5: Verify toggle functionality**

Run: `bun dev`

Navigate to any question page. Verify:
- "Показать все ответы" button appears below the title in indigo accent
- Clicking it reveals all spoilers on the page
- Button text changes to "Скрыть все ответы"
- Individual spoiler buttons still work independently
- Refreshing the page resets the toggle (not persisted)

- [ ] **Step 6: Commit**

```bash
git add src/shared/lib/ui-store.ts src/shared/ui/spoiler.tsx src/widgets/question-view/ui/toggle-all-answers.tsx src/widgets/question-view/ui/question-view.tsx
git commit -m "feat: add toggle to show/hide all answers on a page"
```

---

### Task 5: Build Verification

- [ ] **Step 1: Run lint**

Run: `bun run lint`

Expected: No errors. Fix any issues if found.

- [ ] **Step 2: Run tests**

Run: `bun run test`

Expected: All existing tests pass. No new tests needed (changes are visual/CSS + additive store fields).

- [ ] **Step 3: Run production build**

Run: `bun run build`

Expected: Build succeeds with no errors. SSG pages generate correctly.

- [ ] **Step 4: Commit any fixes**

If lint/build required fixes:

```bash
git add -A
git commit -m "fix: resolve lint/build issues from content readability changes"
```
