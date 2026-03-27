# React Interview Preparation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static bilingual (EN+RU) React interview preparation site with MDX content, sidebar navigation, and dark theme.

**Architecture:** Next.js 16 App Router with SSG via `generateStaticParams`. MDX files in `content/` compiled at build time with next-mdx-remote. FSD structure (simplified): app → widgets → entities → shared.

**Tech Stack:** Bun, Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, next-mdx-remote, gray-matter, rehype-pretty-code, Shiki, Vitest

**Skills to invoke during implementation:**
- **context7** — check latest versions of all libraries before installing
- **frontend-design** — when building UI components (Task 6, 7, 8, 9)
- **shadcn/ui via context7** — when adding shadcn components (Task 2)

---

## File Map

```
src/
├── app/
│   ├── layout.tsx                      # Root layout: sidebar + content area
│   ├── page.tsx                        # Redirect to first question
│   ├── globals.css                     # Tailwind imports + custom styles
│   └── [category]/
│       └── [slug]/
│           └── page.tsx                # Question page with generateStaticParams
│
├── widgets/
│   ├── sidebar/
│   │   ├── ui/
│   │   │   ├── sidebar.tsx             # Desktop sidebar
│   │   │   ├── sidebar-nav.tsx         # Category list with questions
│   │   │   └── mobile-sidebar.tsx      # Sheet-based mobile sidebar
│   │   └── index.ts                    # Public API
│   └── question-view/
│       ├── ui/
│       │   ├── question-view.tsx       # Main question display
│       │   └── question-navigation.tsx # Prev/next buttons
│       └── index.ts                    # Public API
│
├── entities/
│   ├── question/
│   │   ├── model/
│   │   │   └── types.ts               # QuestionMeta, QuestionFull types
│   │   ├── lib/
│   │   │   └── get-questions.ts        # getQuestionsByCategory, getQuestion, getAdjacentQuestions
│   │   └── index.ts                    # Public API
│   └── category/
│       ├── model/
│       │   └── types.ts               # CategoryMeta type
│       ├── lib/
│       │   └── get-categories.ts      # getCategories
│       └── index.ts                    # Public API
│
├── shared/
│   ├── ui/
│   │   ├── badge.tsx                  # shadcn/ui
│   │   ├── button.tsx                 # shadcn/ui
│   │   ├── scroll-area.tsx            # shadcn/ui
│   │   ├── sheet.tsx                  # shadcn/ui
│   │   └── answer.tsx                 # Custom <Answer lang="en|ru"> MDX component
│   ├── lib/
│   │   ├── mdx.ts                     # compileMDX utility
│   │   └── utils.ts                   # cn() helper (shadcn)
│   └── config/
│       └── constants.ts               # CONTENT_DIR path constant
│
tests/
├── entities/
│   ├── category/
│   │   └── get-categories.test.ts
│   └── question/
│       └── get-questions.test.ts
│
content/                               # MDX content (outside src/)
├── javascript-core/
│   ├── _meta.json
│   ├── 01-closures.mdx
│   ├── 02-prototypes.mdx
│   └── 03-event-loop.mdx
├── react-basics/
│   ├── _meta.json
│   ├── 01-what-is-jsx.mdx
│   └── 02-components-and-props.mdx
└── ... (remaining categories with _meta.json)
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/shared/config/constants.ts`, `src/shared/lib/utils.ts`, `.gitignore`

**Pre-requisite:** Use context7 to check latest Next.js 16, Tailwind CSS v4, TypeScript versions.

- [ ] **Step 1: Initialize Next.js project with Bun**

```bash
cd /Users/hamkorlab/WebstormProjects/react-interview-preparation
bun create next-app . --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-bun
```

If the directory is not empty, move existing files aside first. Accept defaults for any prompts.

- [ ] **Step 2: Verify the app starts**

```bash
bun run dev
```

Expected: Dev server starts on localhost:3000 without errors. Stop the server after verifying.

- [ ] **Step 3: Create FSD directory structure**

```bash
mkdir -p src/widgets/sidebar/ui
mkdir -p src/widgets/question-view/ui
mkdir -p src/entities/question/model
mkdir -p src/entities/question/lib
mkdir -p src/entities/category/model
mkdir -p src/entities/category/lib
mkdir -p src/shared/ui
mkdir -p src/shared/lib
mkdir -p src/shared/config
mkdir -p content
mkdir -p tests/entities/category
mkdir -p tests/entities/question
```

- [ ] **Step 4: Create shared constants**

Create `src/shared/config/constants.ts`:

```typescript
import path from "path";

export const CONTENT_DIR = path.join(process.cwd(), "content");
```

- [ ] **Step 5: Add .superpowers/ to .gitignore**

Append to `.gitignore`:

```
.superpowers/
```

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js project with FSD structure"
```

---

### Task 2: shadcn/ui & Dark Theme Setup

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Create: `src/shared/ui/badge.tsx`, `src/shared/ui/button.tsx`, `src/shared/ui/scroll-area.tsx`, `src/shared/ui/sheet.tsx`, `components.json`

**Pre-requisite:** Use context7 to check latest shadcn/ui setup instructions for Next.js + Tailwind v4.

- [ ] **Step 1: Initialize shadcn/ui**

```bash
bunx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Zinc
- CSS variables: Yes
- Customize the import alias for components: `@/shared/ui`
- Customize the import alias for utils: `@/shared/lib`

Verify `components.json` was created and paths point to `src/shared/ui` and `src/shared/lib`.

- [ ] **Step 2: Add required shadcn components**

```bash
bunx shadcn@latest add badge button scroll-area sheet
```

Verify files created in `src/shared/ui/`.

- [ ] **Step 3: Configure dark theme in layout**

Modify `src/app/layout.tsx` — ensure `<html>` has `className="dark"` and `suppressHydrationWarning`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "React Interview Preparation",
  description: "Подготовка к собеседованию для React-разработчиков на двух языках",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify dark theme works**

```bash
bun run dev
```

Open localhost:3000 — page should have dark background. Stop server.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: setup shadcn/ui with dark theme and required components"
```

---

### Task 3: Content Types & Test Data

**Files:**
- Create: `src/entities/category/model/types.ts`, `src/entities/question/model/types.ts`, `content/react-basics/_meta.json`, `content/react-basics/01-what-is-jsx.mdx`, `content/react-basics/02-components-and-props.mdx`, `content/javascript-core/_meta.json`, `content/javascript-core/01-closures.mdx`

- [ ] **Step 1: Define Category types**

Create `src/entities/category/model/types.ts`:

```typescript
export interface CategoryMeta {
  title: string;
  order: number;
  description: string;
  slug: string;
}
```

- [ ] **Step 2: Define Question types**

Create `src/entities/question/model/types.ts`:

```typescript
import type { MDXRemoteSerializeResult } from "next-mdx-remote/serialize";

export interface QuestionMeta {
  title: string;
  order: number;
  slug: string;
  category: string;
}

export interface QuestionFull {
  meta: QuestionMeta;
  mdxSource: MDXRemoteSerializeResult;
}

export interface AdjacentQuestions {
  prev: QuestionMeta | null;
  next: QuestionMeta | null;
}
```

- [ ] **Step 3: Install MDX dependencies**

Use context7 to verify latest versions, then:

```bash
bun add next-mdx-remote gray-matter rehype-pretty-code shiki
```

- [ ] **Step 4: Create test content — javascript-core category**

Create `content/javascript-core/_meta.json`:

```json
{
  "title": "JavaScript Core",
  "order": 1,
  "description": "Замыкания, прототипы, Event Loop, промисы, async/await, this, ES6+"
}
```

Create `content/javascript-core/01-closures.mdx`:

```mdx
---
title: "What are closures?"
order: 1
---

<Answer lang="en">

A **closure** is a function that has access to variables from its outer (enclosing) function's scope, even after the outer function has returned. Closures are created every time a function is created.

```javascript
function createCounter() {
  let count = 0;
  return function () {
    count += 1;
    return count;
  };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
```

The inner function "closes over" the `count` variable. Even though `createCounter` has finished running, the inner function still has access to `count`.

</Answer>

<Answer lang="ru">

**Замыкание** — это функция, которая имеет доступ к переменным из области видимости внешней (обёртывающей) функции, даже после того как внешняя функция завершила выполнение. Замыкания создаются каждый раз при создании функции.

Внутренняя функция «замыкает» переменную `count`. Даже после завершения `createCounter`, внутренняя функция сохраняет доступ к `count`.

</Answer>
```

- [ ] **Step 5: Create test content — react-basics category**

Create `content/react-basics/_meta.json`:

```json
{
  "title": "React Basics",
  "order": 4,
  "description": "JSX, компоненты, пропсы, стейт, жизненный цикл"
}
```

Create `content/react-basics/01-what-is-jsx.mdx`:

```mdx
---
title: "What is JSX?"
order: 1
---

<Answer lang="en">

JSX stands for **JavaScript XML**. It is a syntax extension for JavaScript that lets you write HTML-like code inside your JavaScript files.

```jsx
const element = <h1>Hello, world!</h1>;
```

JSX is not required to use React, but it makes the code more readable and easier to write. Under the hood, JSX is transformed into `React.createElement()` calls.

</Answer>

<Answer lang="ru">

JSX расшифровывается как **JavaScript XML**. Это расширение синтаксиса JavaScript, которое позволяет писать HTML-подобный код внутри JavaScript файлов.

JSX не обязателен для использования React, но он делает код более читаемым и удобным для написания. Под капотом JSX трансформируется в вызовы `React.createElement()`.

</Answer>
```

Create `content/react-basics/02-components-and-props.mdx`:

```mdx
---
title: "What are components and props?"
order: 2
---

<Answer lang="en">

**Components** are the building blocks of any React application. A component is a JavaScript function that returns JSX describing a part of the UI.

**Props** (short for "properties") are the way to pass data from a parent component to a child component. Props are read-only — a component must never modify its own props.

```tsx
interface GreetingProps {
  name: string;
}

function Greeting({ name }: GreetingProps) {
  return <h1>Hello, {name}!</h1>;
}

// Usage
<Greeting name="Alice" />
```

</Answer>

<Answer lang="ru">

**Компоненты** — это строительные блоки любого React-приложения. Компонент — это JavaScript-функция, которая возвращает JSX, описывающий часть интерфейса.

**Пропсы** (сокращение от "properties") — это способ передачи данных от родительского компонента к дочернему. Пропсы доступны только для чтения — компонент никогда не должен изменять свои пропсы.

</Answer>
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add content types and sample MDX questions"
```

---

### Task 4: Content Utilities (TDD)

**Files:**
- Create: `src/entities/category/lib/get-categories.ts`, `src/entities/category/index.ts`, `src/entities/question/lib/get-questions.ts`, `src/entities/question/index.ts`, `tests/entities/category/get-categories.test.ts`, `tests/entities/question/get-questions.test.ts`, `vitest.config.ts`

- [ ] **Step 1: Install Vitest**

```bash
bun add -d vitest @vitejs/plugin-react
```

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Write failing test for getCategories**

Create `tests/entities/category/get-categories.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getCategories } from "@/entities/category";

describe("getCategories", () => {
  it("returns categories sorted by order", async () => {
    const categories = await getCategories();

    expect(categories.length).toBeGreaterThanOrEqual(2);
    expect(categories[0].slug).toBe("javascript-core");
    expect(categories[0].title).toBe("JavaScript Core");
    expect(categories[0].order).toBe(1);

    // Verify sorting
    for (let i = 1; i < categories.length; i++) {
      expect(categories[i].order).toBeGreaterThan(categories[i - 1].order);
    }
  });

  it("each category has required fields", async () => {
    const categories = await getCategories();

    for (const category of categories) {
      expect(category).toHaveProperty("title");
      expect(category).toHaveProperty("order");
      expect(category).toHaveProperty("description");
      expect(category).toHaveProperty("slug");
    }
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

```bash
bun run test
```

Expected: FAIL — module `@/entities/category` not found.

- [ ] **Step 5: Implement getCategories**

Create `src/entities/category/lib/get-categories.ts`:

```typescript
import fs from "fs/promises";
import path from "path";
import { CONTENT_DIR } from "@/shared/config/constants";
import type { CategoryMeta } from "../model/types";

export async function getCategories(): Promise<CategoryMeta[]> {
  const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
  const categories: CategoryMeta[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const metaPath = path.join(CONTENT_DIR, entry.name, "_meta.json");
    try {
      const raw = await fs.readFile(metaPath, "utf-8");
      const meta = JSON.parse(raw);
      categories.push({
        title: meta.title,
        order: meta.order,
        description: meta.description,
        slug: entry.name,
      });
    } catch {
      // Skip directories without _meta.json
    }
  }

  return categories.sort((a, b) => a.order - b.order);
}
```

Create `src/entities/category/index.ts`:

```typescript
export { getCategories } from "./lib/get-categories";
export type { CategoryMeta } from "./model/types";
```

- [ ] **Step 6: Run test to verify it passes**

```bash
bun run test tests/entities/category/
```

Expected: PASS — all tests green.

- [ ] **Step 7: Write failing tests for question utilities**

Create `tests/entities/question/get-questions.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  getQuestionsByCategory,
  getQuestion,
  getAdjacentQuestions,
} from "@/entities/question";

describe("getQuestionsByCategory", () => {
  it("returns questions sorted by order", async () => {
    const questions = await getQuestionsByCategory("react-basics");

    expect(questions.length).toBeGreaterThanOrEqual(2);
    expect(questions[0].slug).toBe("what-is-jsx");
    expect(questions[0].title).toBe("What is JSX?");
    expect(questions[0].order).toBe(1);
    expect(questions[0].category).toBe("react-basics");

    for (let i = 1; i < questions.length; i++) {
      expect(questions[i].order).toBeGreaterThan(questions[i - 1].order);
    }
  });

  it("returns empty array for non-existent category", async () => {
    const questions = await getQuestionsByCategory("nonexistent");
    expect(questions).toEqual([]);
  });
});

describe("getQuestion", () => {
  it("returns compiled MDX for a question", async () => {
    const question = await getQuestion("react-basics", "what-is-jsx");

    expect(question.meta.title).toBe("What is JSX?");
    expect(question.meta.slug).toBe("what-is-jsx");
    expect(question.meta.category).toBe("react-basics");
    expect(question.mdxSource).toBeDefined();
  });
});

describe("getAdjacentQuestions", () => {
  it("returns null prev for first question", async () => {
    const adj = await getAdjacentQuestions("react-basics", "what-is-jsx");

    expect(adj.prev).toBeNull();
    expect(adj.next).not.toBeNull();
    expect(adj.next!.slug).toBe("components-and-props");
  });

  it("returns null next for last question", async () => {
    const adj = await getAdjacentQuestions("react-basics", "components-and-props");

    expect(adj.prev).not.toBeNull();
    expect(adj.prev!.slug).toBe("what-is-jsx");
    expect(adj.next).toBeNull();
  });
});
```

- [ ] **Step 8: Run test to verify it fails**

```bash
bun run test tests/entities/question/
```

Expected: FAIL — module `@/entities/question` not found.

- [ ] **Step 9: Implement question utilities**

Create `src/shared/lib/mdx.ts`:

```typescript
import { serialize } from "next-mdx-remote/serialize";
import rehypePrettyCode from "rehype-pretty-code";
import type { MDXRemoteSerializeResult } from "next-mdx-remote/serialize";

export async function compileMDX(
  source: string
): Promise<MDXRemoteSerializeResult> {
  return serialize(source, {
    parseFrontmatter: true,
    mdxOptions: {
      rehypePlugins: [
        [
          rehypePrettyCode,
          {
            theme: "one-dark-pro",
            keepBackground: true,
          },
        ],
      ],
    },
  });
}
```

Create `src/entities/question/lib/get-questions.ts`:

```typescript
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { CONTENT_DIR } from "@/shared/config/constants";
import { compileMDX } from "@/shared/lib/mdx";
import type { QuestionMeta, QuestionFull, AdjacentQuestions } from "../model/types";

function fileNameToSlug(fileName: string): string {
  return fileName
    .replace(/\.mdx$/, "")
    .replace(/^\d+-/, "");
}

export async function getQuestionsByCategory(
  categorySlug: string
): Promise<QuestionMeta[]> {
  const categoryDir = path.join(CONTENT_DIR, categorySlug);

  try {
    const files = await fs.readdir(categoryDir);
    const mdxFiles = files.filter((f) => f.endsWith(".mdx"));
    const questions: QuestionMeta[] = [];

    for (const file of mdxFiles) {
      const filePath = path.join(categoryDir, file);
      const raw = await fs.readFile(filePath, "utf-8");
      const { data } = matter(raw);

      questions.push({
        title: data.title,
        order: data.order,
        slug: fileNameToSlug(file),
        category: categorySlug,
      });
    }

    return questions.sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

export async function getQuestion(
  categorySlug: string,
  questionSlug: string
): Promise<QuestionFull> {
  const categoryDir = path.join(CONTENT_DIR, categorySlug);
  const files = await fs.readdir(categoryDir);
  const fileName = files.find(
    (f) => f.endsWith(".mdx") && fileNameToSlug(f) === questionSlug
  );

  if (!fileName) {
    throw new Error(`Question not found: ${categorySlug}/${questionSlug}`);
  }

  const filePath = path.join(categoryDir, fileName);
  const raw = await fs.readFile(filePath, "utf-8");
  const { data, content } = matter(raw);

  const mdxSource = await compileMDX(content);

  return {
    meta: {
      title: data.title,
      order: data.order,
      slug: questionSlug,
      category: categorySlug,
    },
    mdxSource,
  };
}

export async function getAdjacentQuestions(
  categorySlug: string,
  questionSlug: string
): Promise<AdjacentQuestions> {
  const questions = await getQuestionsByCategory(categorySlug);
  const index = questions.findIndex((q) => q.slug === questionSlug);

  return {
    prev: index > 0 ? questions[index - 1] : null,
    next: index < questions.length - 1 ? questions[index + 1] : null,
  };
}
```

Create `src/entities/question/index.ts`:

```typescript
export {
  getQuestionsByCategory,
  getQuestion,
  getAdjacentQuestions,
} from "./lib/get-questions";
export type {
  QuestionMeta,
  QuestionFull,
  AdjacentQuestions,
} from "./model/types";
```

- [ ] **Step 10: Run all tests**

```bash
bun run test
```

Expected: ALL PASS. If `next-mdx-remote/serialize` has issues in test environment, adjust the `compileMDX` mock or test config as needed.

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "feat: add content utilities with tests (getCategories, getQuestions, getAdjacentQuestions)"
```

---

### Task 5: Answer MDX Component

**Files:**
- Create: `src/shared/ui/answer.tsx`

- [ ] **Step 1: Create Answer component**

Create `src/shared/ui/answer.tsx`:

```tsx
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

interface AnswerProps {
  lang: "en" | "ru";
  children: React.ReactNode;
}

const langConfig = {
  en: {
    label: "EN",
    sublabel: "English",
    badgeClassName: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  },
  ru: {
    label: "RU",
    sublabel: "Русский",
    badgeClassName: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  },
} as const;

export function Answer({ lang, children }: AnswerProps) {
  const config = langConfig[lang];

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-5 md:p-6",
        lang === "en" ? "mb-4" : ""
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <Badge variant="outline" className={config.badgeClassName}>
          {config.label}
        </Badge>
        <span className="text-xs text-muted-foreground">{config.sublabel}</span>
      </div>
      <div className="prose prose-invert prose-sm max-w-none">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add Answer MDX component with bilingual badges"
```

---

### Task 6: Sidebar Widget

**Files:**
- Create: `src/widgets/sidebar/ui/sidebar-nav.tsx`, `src/widgets/sidebar/ui/sidebar.tsx`, `src/widgets/sidebar/ui/mobile-sidebar.tsx`, `src/widgets/sidebar/index.ts`

**Pre-requisite:** Invoke **frontend-design** skill for sidebar design.

- [ ] **Step 1: Create SidebarNav component**

This is the shared navigation content used by both desktop and mobile sidebars.

Create `src/widgets/sidebar/ui/sidebar-nav.tsx`:

```tsx
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
```

- [ ] **Step 2: Create desktop Sidebar component**

Create `src/widgets/sidebar/ui/sidebar.tsx`:

```tsx
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
    <aside className="hidden w-[280px] shrink-0 border-r border-border md:block">
      <div className="border-b border-border px-5 py-4">
        <div className="text-lg font-bold">⚛️ React Interview</div>
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
```

- [ ] **Step 3: Create mobile sidebar with Sheet**

Create `src/widgets/sidebar/ui/mobile-sidebar.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/shared/ui/sheet";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { SidebarNav } from "./sidebar-nav";
import type { CategoryMeta } from "@/entities/category";
import type { QuestionMeta } from "@/entities/question";

interface MobileSidebarProps {
  categories: CategoryMeta[];
  questionsByCategory: Record<string, QuestionMeta[]>;
}

export function MobileSidebar({
  categories,
  questionsByCategory,
}: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetTitle className="border-b border-border px-5 py-4">
            <div className="text-lg font-bold">⚛️ React Interview</div>
            <div className="mt-1 text-xs font-normal text-muted-foreground">
              Подготовка к собеседованию
            </div>
          </SheetTitle>
          <ScrollArea className="h-[calc(100vh-73px)]">
            <SidebarNav
              categories={categories}
              questionsByCategory={questionsByCategory}
              onNavigate={() => setOpen(false)}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>
      <span className="text-sm font-semibold">React Interview</span>
    </div>
  );
}
```

- [ ] **Step 4: Create public API**

Create `src/widgets/sidebar/index.ts`:

```typescript
export { Sidebar } from "./ui/sidebar";
export { MobileSidebar } from "./ui/mobile-sidebar";
```

- [ ] **Step 5: Install lucide-react for icons**

```bash
bun add lucide-react
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add sidebar widget with desktop and mobile variants"
```

---

### Task 7: Question View Widget

**Files:**
- Create: `src/widgets/question-view/ui/question-view.tsx`, `src/widgets/question-view/ui/question-navigation.tsx`, `src/widgets/question-view/index.ts`

**Pre-requisite:** Invoke **frontend-design** skill for question view design.

- [ ] **Step 1: Create QuestionNavigation component**

Create `src/widgets/question-view/ui/question-navigation.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AdjacentQuestions } from "@/entities/question";

interface QuestionNavigationProps {
  adjacent: AdjacentQuestions;
}

export function QuestionNavigation({ adjacent }: QuestionNavigationProps) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
      {adjacent.prev ? (
        <Button variant="ghost" asChild>
          <Link href={`/${adjacent.prev.category}/${adjacent.prev.slug}`}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            {adjacent.prev.title}
          </Link>
        </Button>
      ) : (
        <div />
      )}
      {adjacent.next ? (
        <Button variant="ghost" asChild>
          <Link href={`/${adjacent.next.category}/${adjacent.next.slug}`}>
            {adjacent.next.title}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <div />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create QuestionView component**

Create `src/widgets/question-view/ui/question-view.tsx`:

```tsx
"use client";

import { MDXRemote } from "next-mdx-remote";
import { Answer } from "@/shared/ui/answer";
import { QuestionNavigation } from "./question-navigation";
import type { QuestionFull, AdjacentQuestions } from "@/entities/question";

const mdxComponents = {
  Answer,
};

interface QuestionViewProps {
  question: QuestionFull;
  adjacent: AdjacentQuestions;
  categoryTitle: string;
  questionIndex: number;
  totalQuestions: number;
}

export function QuestionView({
  question,
  adjacent,
  categoryTitle,
  questionIndex,
  totalQuestions,
}: QuestionViewProps) {
  return (
    <article className="mx-auto max-w-[720px] px-4 py-6 md:px-12 md:py-10">
      <div className="mb-4 text-sm text-muted-foreground">
        {categoryTitle}{" "}
        <span className="text-muted-foreground/50">›</span> Вопрос{" "}
        {questionIndex} из {totalQuestions}
      </div>

      <h1 className="mb-8 text-2xl font-bold md:text-3xl">
        {question.meta.title}
      </h1>

      <MDXRemote {...question.mdxSource} components={mdxComponents} />

      <QuestionNavigation adjacent={adjacent} />
    </article>
  );
}
```

- [ ] **Step 3: Create public API**

Create `src/widgets/question-view/index.ts`:

```typescript
export { QuestionView } from "./ui/question-view";
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add question-view widget with MDX rendering and navigation"
```

---

### Task 8: App Routes & Layout

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/app/[category]/[slug]/page.tsx`

- [ ] **Step 1: Update root layout with sidebar**

Modify `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { getCategories } from "@/entities/category";
import { getQuestionsByCategory } from "@/entities/question";
import { Sidebar } from "@/widgets/sidebar";
import { MobileSidebar } from "@/widgets/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "React Interview Preparation",
  description:
    "Подготовка к собеседованию для React-разработчиков на двух языках",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories();

  const questionsByCategory: Record<string, Awaited<ReturnType<typeof getQuestionsByCategory>>> = {};
  for (const category of categories) {
    questionsByCategory[category.slug] = await getQuestionsByCategory(
      category.slug
    );
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="flex min-h-screen">
          <Sidebar
            categories={categories}
            questionsByCategory={questionsByCategory}
          />
          <div className="flex-1">
            <MobileSidebar
              categories={categories}
              questionsByCategory={questionsByCategory}
            />
            <main>{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create homepage redirect**

Modify `src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { getCategories } from "@/entities/category";
import { getQuestionsByCategory } from "@/entities/question";

export default async function Home() {
  const categories = await getCategories();

  if (categories.length === 0) {
    return <div className="p-8">No content available.</div>;
  }

  const firstCategory = categories[0];
  const questions = await getQuestionsByCategory(firstCategory.slug);

  if (questions.length === 0) {
    return <div className="p-8">No questions available.</div>;
  }

  redirect(`/${firstCategory.slug}/${questions[0].slug}`);
}
```

- [ ] **Step 3: Create question page with SSG**

Create `src/app/[category]/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getCategories } from "@/entities/category";
import {
  getQuestionsByCategory,
  getQuestion,
  getAdjacentQuestions,
} from "@/entities/question";
import { QuestionView } from "@/widgets/question-view";

interface PageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const categories = await getCategories();
  const params: { category: string; slug: string }[] = [];

  for (const category of categories) {
    const questions = await getQuestionsByCategory(category.slug);
    for (const question of questions) {
      params.push({
        category: category.slug,
        slug: question.slug,
      });
    }
  }

  return params;
}

export async function generateMetadata({ params }: PageProps) {
  const { category, slug } = await params;
  try {
    const question = await getQuestion(category, slug);
    return {
      title: `${question.meta.title} — React Interview Prep`,
    };
  } catch {
    return { title: "Not Found" };
  }
}

export default async function QuestionPage({ params }: PageProps) {
  const { category, slug } = await params;

  let question;
  try {
    question = await getQuestion(category, slug);
  } catch {
    notFound();
  }

  const categories = await getCategories();
  const categoryMeta = categories.find((c) => c.slug === category);
  const questions = await getQuestionsByCategory(category);
  const adjacent = await getAdjacentQuestions(category, slug);
  const questionIndex = questions.findIndex((q) => q.slug === slug) + 1;

  return (
    <QuestionView
      question={question}
      adjacent={adjacent}
      categoryTitle={categoryMeta?.title ?? category}
      questionIndex={questionIndex}
      totalQuestions={questions.length}
    />
  );
}
```

- [ ] **Step 4: Verify the app builds and runs**

```bash
bun run build
```

Expected: Build succeeds, static pages generated for all questions.

```bash
bun run dev
```

Expected: Opening localhost:3000 redirects to `/javascript-core/closures`. Sidebar shows categories and questions. Content renders with EN/RU blocks and code highlighting.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add app routes with SSG, sidebar layout, and homepage redirect"
```

---

### Task 9: Remaining Category Scaffolds

**Files:**
- Create: `_meta.json` for all 12 categories, one sample `.mdx` per category

- [ ] **Step 1: Create all category _meta.json files**

Create the following files (content for javascript-core and react-basics already exists):

`content/html-css/_meta.json`:
```json
{
  "title": "HTML & CSS",
  "order": 2,
  "description": "Семантика, доступность, Flexbox, Grid, позиционирование, анимации, адаптивность"
}
```

`content/browser-network/_meta.json`:
```json
{
  "title": "Browser & Network",
  "order": 3,
  "description": "DOM API, события браузера, HTTP/HTTPS, REST, CORS, cookies, localStorage"
}
```

`content/hooks/_meta.json`:
```json
{
  "title": "Hooks",
  "order": 5,
  "description": "useState, useEffect, useContext, useRef, useMemo, useCallback, useReducer, кастомные хуки"
}
```

`content/advanced-react/_meta.json`:
```json
{
  "title": "Advanced React",
  "order": 6,
  "description": "HOC, Render Props, Compound Components, Context API, Error Boundaries, Portals, Suspense"
}
```

`content/state-management/_meta.json`:
```json
{
  "title": "State Management",
  "order": 7,
  "description": "Redux Toolkit, Zustand, Jotai, React Query / TanStack Query, сравнение подходов"
}
```

`content/typescript-react/_meta.json`:
```json
{
  "title": "TypeScript + React",
  "order": 8,
  "description": "Типизация пропсов, хуков, событий, дженерик-компоненты, утилитарные типы"
}
```

`content/performance/_meta.json`:
```json
{
  "title": "Performance & Optimization",
  "order": 9,
  "description": "React.memo, виртуализация, code splitting, профайлинг, Web Vitals"
}
```

`content/testing/_meta.json`:
```json
{
  "title": "Testing",
  "order": 10,
  "description": "Jest, React Testing Library, юнит/интеграционные тесты, моки, тестирование хуков"
}
```

`content/nextjs/_meta.json`:
```json
{
  "title": "Next.js",
  "order": 11,
  "description": "App Router, Server Components, SSR/SSG/ISR, роутинг, middleware, API routes"
}
```

`content/tooling-architecture/_meta.json`:
```json
{
  "title": "Tooling & Architecture",
  "order": 12,
  "description": "Webpack/Vite, Git, CI/CD, линтинг, паттерны проектирования, SOLID, FSD"
}
```

- [ ] **Step 2: Add one sample question to each new category**

Create `content/html-css/01-semantic-html.mdx`:

```mdx
---
title: "What is semantic HTML?"
order: 1
---

<Answer lang="en">

**Semantic HTML** means using HTML elements that clearly describe their meaning to both the browser and the developer. Instead of using generic `<div>` and `<span>` for everything, you use elements like `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, and `<footer>`.

```html
<header>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>
<main>
  <article>
    <h1>My Article</h1>
    <p>Content here...</p>
  </article>
</main>
<footer>© 2024</footer>
```

Semantic elements improve accessibility, SEO, and code readability.

</Answer>

<Answer lang="ru">

**Семантический HTML** означает использование HTML-элементов, которые ясно описывают своё значение как для браузера, так и для разработчика. Вместо использования `<div>` и `<span>` для всего, вы используете элементы вроде `<header>`, `<nav>`, `<main>`, `<article>`, `<section>` и `<footer>`.

Семантические элементы улучшают доступность, SEO и читаемость кода.

</Answer>
```

Create `content/browser-network/01-dom-api.mdx`:

```mdx
---
title: "What is the DOM?"
order: 1
---

<Answer lang="en">

The **DOM** (Document Object Model) is a programming interface for web documents. It represents the page as a tree of nodes, where each node is an object representing a part of the document.

```javascript
// Selecting elements
const element = document.getElementById("app");
const items = document.querySelectorAll(".item");

// Modifying the DOM
element.textContent = "Hello";
element.classList.add("active");
```

The browser creates the DOM when it parses HTML. JavaScript can read and change the DOM, which updates what the user sees on the page.

</Answer>

<Answer lang="ru">

**DOM** (Document Object Model) — это программный интерфейс для веб-документов. Он представляет страницу как дерево узлов, где каждый узел — это объект, представляющий часть документа.

Браузер создаёт DOM при разборе HTML. JavaScript может читать и изменять DOM, что обновляет то, что пользователь видит на странице.

</Answer>
```

Create `content/hooks/01-what-are-hooks.mdx`:

```mdx
---
title: "What are React Hooks?"
order: 1
---

<Answer lang="en">

**Hooks** are functions that let you use React features (like state and lifecycle) in function components. They were introduced in React 16.8.

```tsx
import { useState, useEffect } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);

  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

Rules of Hooks: only call hooks at the top level (not inside loops or conditions), and only call them from React function components or custom hooks.

</Answer>

<Answer lang="ru">

**Хуки** — это функции, которые позволяют использовать возможности React (такие как состояние и жизненный цикл) в функциональных компонентах. Они были представлены в React 16.8.

Правила хуков: вызывайте хуки только на верхнем уровне (не внутри циклов или условий) и только из функциональных компонентов React или кастомных хуков.

</Answer>
```

Create `content/advanced-react/01-higher-order-components.mdx`:

```mdx
---
title: "What are Higher-Order Components (HOC)?"
order: 1
---

<Answer lang="en">

A **Higher-Order Component** is a function that takes a component and returns a new component with additional props or behavior. It is a pattern for reusing component logic.

```tsx
function withLogger<T extends object>(WrappedComponent: React.ComponentType<T>) {
  return function LoggerComponent(props: T) {
    console.log("Rendering:", WrappedComponent.name);
    return <WrappedComponent {...props} />;
  };
}

const EnhancedButton = withLogger(Button);
```

HOCs were popular before hooks. Today, custom hooks are usually preferred for sharing logic between components.

</Answer>

<Answer lang="ru">

**Компонент высшего порядка** — это функция, которая принимает компонент и возвращает новый компонент с дополнительными пропсами или поведением. Это паттерн для повторного использования логики компонентов.

HOC были популярны до появления хуков. Сегодня для разделения логики между компонентами обычно предпочитают кастомные хуки.

</Answer>
```

Create `content/state-management/01-what-is-state-management.mdx`:

```mdx
---
title: "What is state management in React?"
order: 1
---

<Answer lang="en">

**State management** is how you handle and share data across your React application. React provides built-in tools like `useState` and `useContext`, but as apps grow, you may need external libraries.

```tsx
// Local state — useState
const [count, setCount] = useState(0);

// Shared state — Context
const ThemeContext = createContext("light");

// External — Redux Toolkit
const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1; },
  },
});
```

Choose the simplest approach that works: local state first, then Context, then external libraries if needed.

</Answer>

<Answer lang="ru">

**Управление состоянием** — это способ обработки и обмена данными в React-приложении. React предоставляет встроенные инструменты, такие как `useState` и `useContext`, но по мере роста приложения может потребоваться внешняя библиотека.

Выбирайте самый простой подход: сначала локальное состояние, затем Context, затем внешние библиотеки при необходимости.

</Answer>
```

Create `content/typescript-react/01-typing-props.mdx`:

```mdx
---
title: "How do you type component props?"
order: 1
---

<Answer lang="en">

In TypeScript, you define component props using an **interface** or **type alias** and pass it as a generic parameter or annotate the function argument.

```tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

function Button({ label, onClick, variant = "primary" }: ButtonProps) {
  return (
    <button onClick={onClick} className={variant}>
      {label}
    </button>
  );
}
```

Use `interface` for public component APIs — it gives better error messages and can be extended.

</Answer>

<Answer lang="ru">

В TypeScript пропсы компонентов определяются с помощью **интерфейса** или **псевдонима типа** и передаются как параметр дженерика или аннотация аргумента функции.

Используйте `interface` для публичных API компонентов — это даёт лучшие сообщения об ошибках и позволяет расширять интерфейс.

</Answer>
```

Create `content/performance/01-react-memo.mdx`:

```mdx
---
title: "What is React.memo?"
order: 1
---

<Answer lang="en">

`React.memo` is a higher-order component that prevents unnecessary re-renders. It tells React to skip rendering a component if its props have not changed.

```tsx
const ExpensiveList = React.memo(function ExpensiveList({
  items,
}: {
  items: string[];
}) {
  console.log("Rendering list...");
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
});
```

Use `React.memo` when a component renders often with the same props. Do not wrap every component — it adds overhead for the comparison.

</Answer>

<Answer lang="ru">

`React.memo` — это компонент высшего порядка, который предотвращает ненужные перерисовки. Он указывает React пропустить рендеринг компонента, если его пропсы не изменились.

Используйте `React.memo`, когда компонент часто рендерится с одинаковыми пропсами. Не оборачивайте каждый компонент — это добавляет накладные расходы на сравнение.

</Answer>
```

Create `content/testing/01-what-is-testing.mdx`:

```mdx
---
title: "Why do we test React applications?"
order: 1
---

<Answer lang="en">

Testing ensures your application works correctly and prevents regressions when you make changes. In React, the main testing tools are **Jest** (test runner) and **React Testing Library** (rendering and querying).

```tsx
import { render, screen } from "@testing-library/react";
import { Greeting } from "./Greeting";

test("renders greeting with name", () => {
  render(<Greeting name="Alice" />);
  expect(screen.getByText("Hello, Alice!")).toBeInTheDocument();
});
```

Test behavior, not implementation details. Ask "what does the user see?" not "what state value changed?"

</Answer>

<Answer lang="ru">

Тестирование гарантирует, что приложение работает корректно, и предотвращает регрессии при внесении изменений. В React основные инструменты тестирования — **Jest** (запуск тестов) и **React Testing Library** (рендеринг и запросы).

Тестируйте поведение, а не детали реализации. Спрашивайте «что видит пользователь?», а не «какое значение состояния изменилось?».

</Answer>
```

Create `content/nextjs/01-what-is-nextjs.mdx`:

```mdx
---
title: "What is Next.js and why use it?"
order: 1
---

<Answer lang="en">

**Next.js** is a React framework that adds server-side rendering (SSR), static site generation (SSG), file-based routing, and many optimizations out of the box.

```tsx
// app/page.tsx — a Server Component by default
export default async function Home() {
  const data = await fetch("https://api.example.com/posts");
  const posts = await data.json();

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

Key benefits: automatic code splitting, image optimization, built-in API routes, and the App Router with React Server Components.

</Answer>

<Answer lang="ru">

**Next.js** — это фреймворк на основе React, который добавляет серверный рендеринг (SSR), статическую генерацию (SSG), файловую маршрутизацию и множество оптимизаций из коробки.

Основные преимущества: автоматическое разделение кода, оптимизация изображений, встроенные API-маршруты и App Router с React Server Components.

</Answer>
```

Create `content/tooling-architecture/01-module-bundlers.mdx`:

```mdx
---
title: "What is a module bundler?"
order: 1
---

<Answer lang="en">

A **module bundler** takes your source files (JavaScript, CSS, images) and combines them into optimized bundles for the browser. The most common bundlers are **Webpack** and **Vite**.

```javascript
// Without bundler — browser doesn't understand this
import { formatDate } from "./utils";
import styles from "./App.module.css";

// Bundler transforms it into browser-compatible code
// and creates optimized bundles
```

**Webpack** is highly configurable but complex. **Vite** uses native ES modules in development for instant startup and esbuild/Rollup for production builds.

</Answer>

<Answer lang="ru">

**Бандлер модулей** берёт ваши исходные файлы (JavaScript, CSS, изображения) и объединяет их в оптимизированные бандлы для браузера. Самые распространённые бандлеры — **Webpack** и **Vite**.

**Webpack** обладает широкой конфигурируемостью, но сложен. **Vite** использует нативные ES-модули в разработке для мгновенного запуска и esbuild/Rollup для продакшн-сборки.

</Answer>
```

- [ ] **Step 3: Verify build with all categories**

```bash
bun run build
```

Expected: Build succeeds, all 12 categories visible in sidebar, each with at least 1 question.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add all 12 categories with sample questions"
```

---

### Task 10: Polish & Final Verification

**Files:**
- Modify: `src/app/globals.css` (prose styles for MDX code blocks)

- [ ] **Step 1: Add prose styles for code blocks**

Add to `src/app/globals.css` (after Tailwind imports):

```css
/* Code block styling for MDX content */
[data-rehype-pretty-code-figure] pre {
  @apply overflow-x-auto rounded-lg border border-border bg-[#282c34] p-4;
}

[data-rehype-pretty-code-figure] code {
  @apply text-sm leading-relaxed;
}

/* Inline code */
.prose :not(pre) > code {
  @apply rounded bg-muted px-1.5 py-0.5 text-sm font-normal;
}
```

- [ ] **Step 2: Run full build**

```bash
bun run build
```

Expected: Clean build, no warnings, all static pages generated.

- [ ] **Step 3: Run all tests**

```bash
bun run test
```

Expected: All tests pass.

- [ ] **Step 4: Run dev server and manually verify**

```bash
bun run dev
```

Verify:
1. `/` redirects to `/javascript-core/closures`
2. Sidebar shows all 12 categories with questions
3. Active question is highlighted in sidebar
4. EN block has blue badge, RU block has purple badge
5. Code blocks have syntax highlighting
6. Prev/Next navigation works
7. On mobile viewport (<768px): hamburger menu opens Sheet with sidebar
8. Code blocks scroll horizontally on mobile

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add code block styles and finalize UI polish"
```
