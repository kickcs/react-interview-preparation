# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
bun dev          # Dev server at localhost:3000
bun run build    # Production build (standalone output)
bun run lint     # ESLint (flat config, next core-web-vitals + typescript)
bun run test     # Vitest (run once)
bun run test:watch               # Vitest in watch mode
bunx vitest run tests/entities/question  # Run single test file/dir
```

Package manager is **bun** (`bun.lock`). Do not use npm/yarn/pnpm.

## Architecture

Next.js 16 app (App Router, React 19, standalone output) serving a bilingual (EN/RU) React interview Q&A site. Content is MDX rendered at build time via `next-mdx-remote/rsc` + `rehype-pretty-code`.

### FSD-lite structure (`src/`)

- **`app/`** — Next.js routes. Root layout fetches all categories/questions for sidebar. `[category]/[slug]/page.tsx` uses `generateStaticParams` for SSG.
- **`entities/`** — Domain data access (no DB; reads filesystem).
  - `category/` — `getCategories()` reads `content/*/_ meta.json`, returns sorted `CategoryMeta[]`.
  - `question/` — `getQuestionsByCategory()`, `getQuestion()`, `getAdjacentQuestions()` read MDX files via `gray-matter`. Slug derived from filename by stripping numeric prefix (`01-closures.mdx` → `closures`).
- **`widgets/`** — Composite UI: `sidebar` (desktop + mobile), `question-view` (MDX rendering + navigation).
- **`shared/`** — UI primitives (shadcn/ui → aliased to `@/shared/ui`), utils, config, Zustand store.

### Content system (`content/`)

Each category is a directory with `_meta.json` (title, order, description) and numbered MDX files. MDX frontmatter has `title` and `order`. Questions use `<AnswerGroup>` + `<Answer lang="en|ru">` components for bilingual answers, with code blocks placed outside the AnswerGroup.

### Client state

Zustand store (`shared/lib/ui-store.ts`) with `persist` middleware manages revealed answers and collapsed sidebar categories in localStorage. Uses hydration guard (`useHydrated`) to avoid SSR mismatch.

### Shadcn/UI

Configured via `components.json` with aliases pointing to FSD paths (`@/shared/ui`, `@/shared/lib`). Style: `base-nova`, icon library: `lucide`.

### Path alias

`@/` maps to `src/` (configured in both `tsconfig.json` and `vitest.config.ts`).

## Tests

Tests live in `tests/` (mirroring `src/entities/`). Vitest with `globals: true`, node environment. No React component tests currently — only entity logic tests.

## Deployment

Docker multi-stage build: bun for deps/build, node:20-alpine for runtime. GitHub Actions workflow at `.github/workflows/deploy.yml`.
