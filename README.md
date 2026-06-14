# React Interview Preparation

A bilingual (EN/RU) interview-prep platform for frontend and full-stack engineers. It combines a build-time MDX Q&A library with an interactive, multiplayer live-coding environment where candidates can solve tasks in real time.

> Built with Next.js 16 (App Router), React 19, a standalone Fastify + Socket.IO WebSocket server, and an in-browser Sandpack sandbox.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io)
![Tests](https://img.shields.io/badge/tests-Vitest-6e9f18?logo=vitest&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

<!-- Optional once a public deploy exists:
[**Live demo →**](https://your-demo-url.example.com)
-->

## Screenshots

<!-- TODO: replace the placeholders below with real captures (PNG/GIF in docs/). -->

| Q&A library | Live-coding room |
| --- | --- |
| _Add a screenshot of the bilingual Q&A view (`docs/screenshot-qa.png`)._ | _Add a GIF of a multiplayer room with synced editors (`docs/demo-room.gif`)._ |

## Features

- **Bilingual Q&A library** — 19 categories, ~340 MDX documents covering JavaScript core, React (basics + advanced), hooks, TypeScript, state management, performance, testing, Next.js, browser/network, security, system design, PostgreSQL, Python backend, AWS, LLM/AI workflows, and more. Every answer is authored in both English and Russian via `<AnswerGroup>` / `<Answer lang>` components.
- **Live-coding rooms** — real-time collaborative rooms (up to 4 participants). Each participant gets their own editor and sandbox; code, console output, and ready status are synchronized over WebSockets.
- **Solo mode** — practice a live-coding task alone in a full editor + sandbox before going multiplayer.
- **Challenge mode** — guided coding challenges with starter code extracted from the task definition.
- **In-browser execution** — code runs client-side via [CodeSandbox Sandpack](https://sandpack.codesandbox.io/); no backend code execution.
- **Syntax-highlighted content** — MDX is rendered at build time with `rehype-pretty-code` + Shiki.
- **Persistent UI state** — revealed answers and collapsed sidebar sections are stored in `localStorage` (Zustand `persist`), with a hydration guard to avoid SSR mismatch.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, RSC, standalone output), React 19 |
| Language | TypeScript 5 |
| Content | MDX via `next-mdx-remote/rsc`, `gray-matter`, `rehype-pretty-code` / Shiki |
| Realtime | Fastify 5 + Socket.IO 4 (standalone Node server), `@fastify/rate-limit` |
| Sandbox | `@codesandbox/sandpack-react` |
| State | Zustand 5 (`persist`) |
| Styling | Tailwind CSS 4, shadcn/ui (`base-nova`), `@tailwindcss/typography` |
| Tooling | bun (package manager), ESLint 9 (flat config), Vitest 4 |
| Deploy | Docker multi-stage, GitHub Actions |

## Architecture

The codebase follows an FSD-lite (Feature-Sliced Design) layout under `src/`:

```
src/
  app/        Next.js routes (App Router). SSG via generateStaticParams.
  entities/   Domain data access (category, question, challenge, room) — reads the filesystem, no DB.
  features/   Self-contained UI behaviors (code-editor, room-create, room-join, share-code, language-switch, …).
  widgets/    Composite UI (question-view, challenge-view, room-view, solo-view, sidebar).
  shared/     UI primitives (shadcn/ui), utils, config, Zustand store, cross-process contracts.
src-server/   Standalone WebSocket server (Fastify + Socket.IO): http, ws, state, config.
content/      MDX content grouped by category, plus a live-coding/ task catalog.
tests/        Vitest tests mirroring src/ and src-server/.
```

### Content system

Each category under `content/` is a directory with a `_meta.json` (title, order, description) and numbered MDX files (`01-closures.mdx`). The slug is derived from the filename by stripping the numeric prefix. MDX frontmatter carries `title` and `order`.

### Realtime model

`src-server/` runs as a separate Node process. Rooms are kept in memory with a TTL and per-IP rate limiting. The server validates nicknames, caps code payload size, throttles code updates (5/sec), and broadcasts code/console/status events to peers. Shared contracts (event types, sanitization) live in `src/shared/contracts` and are imported by both the Next app and the server.

In production both processes sit behind a single ingress port (the browser uses same-origin); in development the WS server can be reached directly via `NEXT_PUBLIC_WS_URL`.

## Getting Started

Prerequisites: [bun](https://bun.sh) (the package manager — do not use npm/yarn/pnpm) and Node.js 20+.

```bash
bun install

# Dev: runs Next.js + the WebSocket server concurrently
bun dev
# → app at http://localhost:3000, ws-server at http://localhost:3001
```

Copy `.env.example` to `.env` and adjust as needed (room limits, ports, rate limits, CORS).

### Scripts

```bash
bun dev            # Next.js + ws-server (concurrently)
bun run dev:next   # Next.js only
bun run dev:ws     # ws-server only (tsx watch)
bun run build      # Production build: next build + compile ws-server
bun run start      # Start the production Next.js server
bun run lint       # ESLint
bun run test       # Vitest (run once)
bun run test:watch # Vitest watch mode
```

Run a single test file:

```bash
bunx vitest run tests/entities/question
```

## Testing

Tests live in `tests/`, mirroring the source layout, and cover entity logic (category/question/challenge/room readers), the Zustand store, and the WebSocket server (state, http, ws integration, sanitization). Run them with `bun run test`.

## Deployment

A multi-stage `Dockerfile` builds the Next.js standalone output and the compiled WebSocket server, then runs both behind a single port via `scripts/start-prod.js`. Deployment is automated through GitHub Actions (`.github/workflows/deploy.yml`) — pushing to `main` triggers the pipeline.

```bash
docker compose -f docker-compose.prod.yml up --build
```

## Project Structure Conventions

- Path alias `@/` maps to `src/` (configured in `tsconfig.json` and `vitest.config.ts`).
- shadcn/ui components are aliased to FSD paths (`@/shared/ui`, `@/shared/lib`) via `components.json`.
- See `CLAUDE.md` / `AGENTS.md` for repo-specific notes.
