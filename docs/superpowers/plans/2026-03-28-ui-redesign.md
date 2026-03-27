# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign question view with horizontal bilingual layout, spoiler effect, Inter font, and code section below answers.

**Architecture:** Modify existing Answer component, add AnswerGroup grid wrapper and Spoiler toggle component. Update QuestionView to wire them together. Migrate all 13 MDX files to new format. Change fonts via next/font/google.

**Tech Stack:** next/font/google (Inter, JetBrains Mono), CSS Grid, React useState for spoiler

---

## File Map

```
Modified:
  src/app/layout.tsx                           # Add Inter + JetBrains Mono fonts
  src/app/globals.css                          # Font variables, code block spacing
  src/shared/ui/answer.tsx                     # Remove mb-4 conditional
  src/widgets/question-view/ui/question-view.tsx  # Wrap MDX in Spoiler, add AnswerGroup to components, max-w 900px

Created:
  src/shared/ui/answer-group.tsx               # Grid wrapper for EN/RU columns
  src/shared/ui/spoiler.tsx                    # Client component with toggle

Migrated (13 files):
  content/javascript-core/01-closures.mdx
  content/html-css/01-semantic-html.mdx
  content/browser-network/01-dom-api.mdx
  content/react-basics/01-what-is-jsx.mdx
  content/react-basics/02-components-and-props.mdx
  content/hooks/01-what-are-hooks.mdx
  content/advanced-react/01-higher-order-components.mdx
  content/state-management/01-what-is-state-management.mdx
  content/typescript-react/01-typing-props.mdx
  content/performance/01-react-memo.mdx
  content/testing/01-what-is-testing.mdx
  content/nextjs/01-what-is-nextjs.mdx
  content/tooling-architecture/01-module-bundlers.mdx
```

---

### Task 1: Inter & JetBrains Mono Fonts

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add font imports to layout.tsx**

Replace the entire `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { getCategories } from "@/entities/category";
import { getQuestionsByCategory } from "@/entities/question";
import { Sidebar, MobileSidebar } from "@/widgets/sidebar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-jetbrains-mono",
});

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
    <html
      lang="en"
      className={`dark ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
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

- [ ] **Step 2: Update font variables in globals.css**

In `src/app/globals.css`, inside the `@theme inline` block, replace the font lines:

Change:
```css
  --font-sans: var(--font-sans);
  --font-mono: var(--font-geist-mono);
```

To:
```css
  --font-sans: var(--font-inter);
  --font-mono: var(--font-jetbrains-mono);
```

- [ ] **Step 3: Verify fonts render**

```bash
bun run dev
```

Open localhost:3000. Text should render in Inter (check in browser DevTools — computed font-family should show "Inter"). Code blocks should use JetBrains Mono. Both Cyrillic and Latin should look consistent.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: switch to Inter + JetBrains Mono fonts for bilingual consistency"
```

---

### Task 2: AnswerGroup Component

**Files:**
- Create: `src/shared/ui/answer-group.tsx`

- [ ] **Step 1: Create AnswerGroup component**

Create `src/shared/ui/answer-group.tsx`:

```tsx
interface AnswerGroupProps {
  children: React.ReactNode;
}

export function AnswerGroup({ children }: AnswerGroupProps) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/ui/answer-group.tsx
git commit -m "feat: add AnswerGroup grid wrapper component"
```

---

### Task 3: Spoiler Component

**Files:**
- Create: `src/shared/ui/spoiler.tsx`

- [ ] **Step 1: Create Spoiler component**

Create `src/shared/ui/spoiler.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface SpoilerProps {
  children: React.ReactNode;
}

export function Spoiler({ children }: SpoilerProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div>
      <button
        onClick={() => setRevealed(!revealed)}
        className="mb-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-5 py-3.5 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground"
      >
        {revealed ? (
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
        className={`grid transition-all duration-300 ease-in-out ${
          revealed
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/ui/spoiler.tsx
git commit -m "feat: add Spoiler toggle component with animation"
```

---

### Task 4: Update Answer & QuestionView

**Files:**
- Modify: `src/shared/ui/answer.tsx`
- Modify: `src/widgets/question-view/ui/question-view.tsx`

- [ ] **Step 1: Update Answer component — remove mb-4**

Replace `src/shared/ui/answer.tsx` with:

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
    <div className="rounded-lg border border-border bg-card p-5 md:p-6">
      <div className="mb-3 flex items-center gap-2">
        <Badge variant="outline" className={config.badgeClassName}>
          {config.label}
        </Badge>
        <span className="text-xs text-muted-foreground">{config.sublabel}</span>
      </div>
      <div className="prose dark:prose-invert prose-sm max-w-none">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Update QuestionView — add Spoiler, AnswerGroup, widen max-width**

Replace `src/widgets/question-view/ui/question-view.tsx` with:

```tsx
import { Answer } from "@/shared/ui/answer";
import { AnswerGroup } from "@/shared/ui/answer-group";
import { Spoiler } from "@/shared/ui/spoiler";
import { QuestionNavigation } from "./question-navigation";
import type { QuestionMeta, AdjacentQuestions } from "@/entities/question";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";

const mdxComponents = {
  Answer,
  AnswerGroup,
};

interface QuestionViewProps {
  meta: QuestionMeta;
  content: string;
  adjacent: AdjacentQuestions;
  categoryTitle: string;
  questionIndex: number;
  totalQuestions: number;
}

export async function QuestionView({
  meta,
  content,
  adjacent,
  categoryTitle,
  questionIndex,
  totalQuestions,
}: QuestionViewProps) {
  return (
    <article className="mx-auto max-w-[900px] px-4 py-6 md:px-12 md:py-10">
      <div className="mb-4 text-sm text-muted-foreground">
        {categoryTitle}{" "}
        <span className="text-muted-foreground/50">›</span> Вопрос{" "}
        {questionIndex} из {totalQuestions}
      </div>

      <h1 className="mb-8 text-2xl font-bold md:text-3xl">{meta.title}</h1>

      <Spoiler>
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
      </Spoiler>

      <QuestionNavigation adjacent={adjacent} />
    </article>
  );
}
```

- [ ] **Step 3: Add spacing for code blocks after AnswerGroup in globals.css**

Add to `src/app/globals.css` after the existing code block styles:

```css
/* Spacing between AnswerGroup and code block */
[data-rehype-pretty-code-figure] {
  @apply mt-6;
}
```

- [ ] **Step 4: Verify build**

```bash
bun run build
```

Expected: Build passes. The MDX files still use old format so the layout won't look right yet, but no errors.

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/answer.tsx src/widgets/question-view/ui/question-view.tsx src/app/globals.css
git commit -m "feat: integrate Spoiler, AnswerGroup into QuestionView, widen to 900px"
```

---

### Task 5: Migrate All MDX Content

**Files:**
- Modify: all 13 `content/**/*.mdx` files

The new format for every MDX file:
1. Frontmatter stays the same
2. `<AnswerGroup>` wraps both `<Answer>` blocks
3. Code is moved OUTSIDE `<AnswerGroup>`, after the closing tag
4. Both EN and RU answers contain equivalent text (no code in either)
5. EN and RU should have the SAME information, just in different languages

- [ ] **Step 1: Migrate content/javascript-core/01-closures.mdx**

```mdx
---
title: "What are closures?"
order: 1
---

<AnswerGroup>
<Answer lang="en">

A **closure** is a function that has access to variables from its outer (enclosing) function's scope, even after the outer function has returned. Closures are created every time a function is created.

The inner function "closes over" the `count` variable. Even though `createCounter` has finished running, the inner function still has access to `count`.

</Answer>
<Answer lang="ru">

**Замыкание** — это функция, которая имеет доступ к переменным из области видимости внешней (обёртывающей) функции, даже после того как внешняя функция завершила выполнение. Замыкания создаются каждый раз при создании функции.

Внутренняя функция «замыкает» переменную `count`. Даже после завершения `createCounter`, внутренняя функция сохраняет доступ к `count`.

</Answer>
</AnswerGroup>

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
```

- [ ] **Step 2: Migrate content/html-css/01-semantic-html.mdx**

```mdx
---
title: "What is semantic HTML?"
order: 1
---

<AnswerGroup>
<Answer lang="en">

**Semantic HTML** means using HTML elements that clearly describe their meaning to both the browser and the developer. Instead of using generic `<div>` and `<span>` for everything, you use elements like `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, and `<footer>`.

Semantic elements improve accessibility, SEO, and code readability.

</Answer>
<Answer lang="ru">

**Семантический HTML** означает использование HTML-элементов, которые ясно описывают своё значение как для браузера, так и для разработчика. Вместо использования `<div>` и `<span>` для всего, вы используете элементы вроде `<header>`, `<nav>`, `<main>`, `<article>`, `<section>` и `<footer>`.

Семантические элементы улучшают доступность, SEO и читаемость кода.

</Answer>
</AnswerGroup>

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
```

- [ ] **Step 3: Migrate content/browser-network/01-dom-api.mdx**

Read the current file, then rewrite it following the pattern: move code outside AnswerGroup, make RU equivalent to EN. The EN answer text stays the same but without code. The RU answer should match the EN content in meaning.

- [ ] **Step 4: Migrate content/react-basics/01-what-is-jsx.mdx**

```mdx
---
title: "What is JSX?"
order: 1
---

<AnswerGroup>
<Answer lang="en">

JSX stands for **JavaScript XML**. It is a syntax extension for JavaScript that lets you write HTML-like code inside your JavaScript files.

JSX is not required to use React, but it makes the code more readable and easier to write. Under the hood, JSX is transformed into `React.createElement()` calls.

</Answer>
<Answer lang="ru">

JSX расшифровывается как **JavaScript XML**. Это расширение синтаксиса JavaScript, которое позволяет писать HTML-подобный код внутри JavaScript файлов.

JSX не обязателен для использования React, но он делает код более читаемым и удобным для написания. Под капотом JSX трансформируется в вызовы `React.createElement()`.

</Answer>
</AnswerGroup>

```jsx
const element = <h1>Hello, world!</h1>;
```
```

- [ ] **Step 5: Migrate content/react-basics/02-components-and-props.mdx**

Read the current file, then rewrite: move code outside AnswerGroup, ensure RU matches EN.

- [ ] **Step 6: Migrate content/hooks/01-what-are-hooks.mdx**

Read the current file, then rewrite: move code outside AnswerGroup, ensure RU matches EN.

- [ ] **Step 7: Migrate content/advanced-react/01-higher-order-components.mdx**

Read the current file, then rewrite: move code outside AnswerGroup, ensure RU matches EN.

- [ ] **Step 8: Migrate content/state-management/01-what-is-state-management.mdx**

Read the current file, then rewrite: move code outside AnswerGroup, ensure RU matches EN.

- [ ] **Step 9: Migrate content/typescript-react/01-typing-props.mdx**

Read the current file, then rewrite: move code outside AnswerGroup, ensure RU matches EN.

- [ ] **Step 10: Migrate content/performance/01-react-memo.mdx**

Read the current file, then rewrite: move code outside AnswerGroup, ensure RU matches EN.

- [ ] **Step 11: Migrate content/testing/01-what-is-testing.mdx**

Read the current file, then rewrite: move code outside AnswerGroup, ensure RU matches EN.

- [ ] **Step 12: Migrate content/nextjs/01-what-is-nextjs.mdx**

Read the current file, then rewrite: move code outside AnswerGroup, ensure RU matches EN.

- [ ] **Step 13: Migrate content/tooling-architecture/01-module-bundlers.mdx**

Read the current file, then rewrite: move code outside AnswerGroup, ensure RU matches EN.

- [ ] **Step 14: Verify build**

```bash
bun run build
```

Expected: Build succeeds, all 17 pages generated.

- [ ] **Step 15: Run tests**

```bash
bun run test
```

Expected: All 7 tests pass (content utilities unchanged).

- [ ] **Step 16: Commit**

```bash
git add content/
git commit -m "feat: migrate all MDX to AnswerGroup format with code sections below"
```

---

### Task 6: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Full build**

```bash
bun run build
```

Expected: Clean build, no warnings.

- [ ] **Step 2: Run tests**

```bash
bun run test
```

Expected: 7 tests pass.

- [ ] **Step 3: Dev server manual check**

```bash
bun run dev
```

Verify at localhost:3000:
1. Font is Inter (check DevTools computed styles)
2. Code blocks use JetBrains Mono
3. Question page shows only title + spoiler button
4. Clicking "Показать ответ" reveals EN | RU side by side + code below
5. Clicking "Скрыть ответ" hides them with animation
6. Code block has proper syntax highlighting and spacing below the grid
7. On mobile viewport (<768px): answers stack vertically (one column)
8. Navigation prev/next still works
9. All 12 categories render correctly

- [ ] **Step 4: Commit any fixes**

If any visual issues found, fix and commit:

```bash
git add .
git commit -m "fix: polish UI redesign"
```
