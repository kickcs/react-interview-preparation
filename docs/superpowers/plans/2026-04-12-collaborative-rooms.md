# Collaborative Rooms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **IMPORTANT — user workflow preference:** Do NOT commit or run code review between tasks. Run all tasks as one continuous flow. At the very end (after Task 22), run `/simplify` TWICE and ONLY THEN create a single commit with all changes.

**Goal:** Build ephemeral 4-person live-coding rooms where friends solve interview tasks in parallel Sandpack editors, with opt-in code sharing, readiness status, and local peer-panel hiding — delivered as a separate Fastify+Socket.IO process alongside the existing Next.js standalone build.

**Architecture:** Two-process Docker container — Next.js standalone on `:3000` handles SSG pages + the `/rooms` route scaffolding; a new Fastify+Socket.IO process on `:3001` owns the in-memory room state. Shared TypeScript contracts in `src/shared/contracts/` are imported by both processes. Client uses Zustand for room state, Sandpack for code execution, and a terminal/CRT aesthetic (monokod, phosphor green, ASCII) scoped strictly to `/rooms/*` via `src/app/rooms/rooms.css`.

**Tech Stack:** Next.js 16 (standalone), React 19, Bun (package manager), Fastify 5, Socket.IO 4, `@codesandbox/sandpack-react`, Zustand 5, nanoid, `@fastify/rate-limit`, `rehype-sanitize`, `concurrently`, `tsx`, Vitest 4, TypeScript 5.

**Reference spec:** `docs/superpowers/specs/2026-04-12-collaborative-rooms-design.md` (read this first — all architectural decisions live there).

---

## File Structure (created in this plan)

### Server (new directory at repo root)

| File | Responsibility |
|------|----------------|
| `src-server/types.ts` | Internal server-only types (Room, Participant, Config) |
| `src-server/config.ts` | Env parsing with defaults (MAX_ROOMS, ROOM_TTL_MS, CLEANUP_INTERVAL_MS, WS_PORT) |
| `src-server/sanitize.ts` | Nickname validation, custom-markdown sanitation helpers |
| `src-server/state.ts` | Pure in-memory state operations (createRoom, joinRoom, leaveRoom, updateCode, shareCode, unshareCode, setStatus, cleanupExpiredRooms, toSnapshot) |
| `src-server/http.ts` | Fastify REST routes (`POST /rooms`, `GET /rooms/:id`, rate-limit wiring) |
| `src-server/ws.ts` | Socket.IO event handlers (`room:join`, `code:update`, `code:share`, `code:unshare`, `status:set`, `disconnect`) |
| `src-server/ws-server.ts` | Entry point — wires Fastify + Socket.IO, starts cleanup interval, listens on `WS_PORT` |

### Shared contracts (imported by both processes)

| File | Responsibility |
|------|----------------|
| `src/shared/contracts/room.ts` | `TaskSource`, `Language`, `ParticipantStatus`, `ParticipantPublic`, `RoomSnapshot`, `TaskContent` |
| `src/shared/contracts/events.ts` | Socket.IO client↔server event type maps + ack result unions |
| `src/shared/contracts/errors.ts` | `RoomErrorCode` string union + human labels |
| `src/shared/contracts/index.ts` | Barrel |

### Client — FSD entity

| File | Responsibility |
|------|----------------|
| `src/entities/room/lib/get-task-content.ts` | Read MDX from `content/live-coding/{category}/{slug}.mdx` OR return custom markdown (after sanitize) |
| `src/entities/room/lib/is-valid-nickname.ts` | Client-side mirror of server nickname validation |
| `src/entities/room/model/types.ts` | Re-exports from `@/shared/contracts` |
| `src/entities/room/index.ts` | Barrel |

### Client — shared lib

| File | Responsibility |
|------|----------------|
| `src/shared/lib/ws-client.ts` | `getRoomSocket()` — lazy Socket.IO client singleton using `NEXT_PUBLIC_WS_URL` |
| `src/shared/lib/use-room-socket.ts` | React hook: connect, join, dispatch events into `room-store` |
| `src/shared/lib/room-store.ts` | Zustand store (participants, sharedCodes, collapsedPeers, myCode, myStatus, applyEvent, selectors) |

### Client — features (new FSD layer)

| File | Responsibility |
|------|----------------|
| `src/features/room-create/ui/create-room-form.tsx` | Landing form — task source + nickname |
| `src/features/room-join/ui/join-room-form.tsx` | Nickname entry for existing room |
| `src/features/code-editor/ui/code-editor.tsx` | Sandpack wrapper, writable variant |
| `src/features/code-editor/ui/read-only-editor.tsx` | Sandpack read-only variant for peer cells |
| `src/features/share-code/ui/share-code-toggle.tsx` | `[S share]` / `[S unshare]` button |
| `src/features/ready-toggle/ui/ready-toggle.tsx` | `[R ready]` / `[R unready]` button |
| `src/features/hide-peer-code/ui/peer-panel-collapse.tsx` | `[H hide]` / `[H show]` local toggle |

### Client — widget

| File | Responsibility |
|------|----------------|
| `src/widgets/room-view/ui/room-view.tsx` | Top-level layout (top-bar + task + 2×2 grid + log) |
| `src/widgets/room-view/ui/top-bar.tsx` | Room id, presence glyphs, copy link, exit |
| `src/widgets/room-view/ui/task-panel.tsx` | Left column with MDX task |
| `src/widgets/room-view/ui/editors-grid.tsx` | 2×2 grid container |
| `src/widgets/room-view/ui/my-editor-cell.tsx` | Your writable cell |
| `src/widgets/room-view/ui/peer-editor-cell.tsx` | Other's read-only cell (or placeholder) |
| `src/widgets/room-view/ui/empty-slot.tsx` | Unfilled slot placeholder with share link |
| `src/widgets/room-view/ui/event-log.tsx` | Collapsible bottom log |
| `src/widgets/room-view/ui/room-errors.tsx` | Connection-lost overlay |
| `src/widgets/room-view/index.ts` | Barrel |

### Client — app routes

| File | Responsibility |
|------|----------------|
| `src/app/rooms/rooms.css` | Scoped terminal tokens + primitives (box, button, input, log) + scanlines |
| `src/app/rooms/layout.tsx` | Wraps all `/rooms/*` pages; imports `rooms.css`; no sidebar |
| `src/app/rooms/page.tsx` | Landing — create-room form |
| `src/app/rooms/[id]/page.tsx` | Server Component — fetch task + `GET /rooms/:id` probe |
| `src/app/rooms/[id]/room-client.tsx` | Client Component — hydrates store + renders `RoomView` |

### Config / infra

| File | Responsibility |
|------|----------------|
| `tsconfig.server.json` | TS config for `src-server/` → `dist-server/` (commonjs, node target) |
| `package.json` | New scripts + deps |
| `Dockerfile` | Two-process runtime with `concurrently` |
| `next.config.ts` | Add `NEXT_PUBLIC_WS_URL` build-time env documentation (no config change) |
| `.env.example` | Document `WS_PORT`, `NEXT_PUBLIC_WS_URL`, `MAX_ROOMS`, etc |

### Tests

| File | Responsibility |
|------|----------------|
| `tests/server/sanitize.test.ts` | Nickname + markdown sanitize unit tests |
| `tests/server/state.test.ts` | Pure state function unit tests |
| `tests/server/http.test.ts` | Fastify `inject` tests for REST routes + rate limit |
| `tests/server/ws.integration.test.ts` | Real Socket.IO client ↔ server event flow |
| `tests/shared/lib/room-store.test.ts` | Zustand store reducer tests |
| `tests/entities/room/get-task-content.test.ts` | MDX loader + sanitize integration |

---

## Task 1: Pre-flight production checks

**Files:** *(no code changes — gather facts)*

- [ ] **Step 1.1: Check production port 3001 availability**

Run (on the production host, NOT locally):

```bash
ssh <prod-host> "ss -tlnp | grep ':3001' || echo FREE"
```

Expected: output `FREE`. If any line shows `LISTEN`, choose the first free port in `3001..3010` and record it as `PROD_WS_PORT`. If you cannot SSH to prod, ask the user.

- [ ] **Step 1.2: Check reverse proxy passes WebSocket upgrade**

Look for nginx/caddy/traefik config on the prod host. Confirm the block for the site either does not proxy `/socket.io/*` (so the browser hits port directly) OR has the WebSocket upgrade headers (`proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade";`). Record the decision as `WS_REACH = direct-port | via-proxy` in a note.

- [ ] **Step 1.3: Inspect `.github/workflows/deploy.yml`**

Run:

```bash
cat .github/workflows/deploy.yml
```

Identify how port 3000 is published today (Docker `-p 3000:3000`, compose, or Traefik label). Record the exact spot that must be updated to also publish `3001` (or `PROD_WS_PORT`).

- [ ] **Step 1.4: Estimate memory budget**

500 rooms × 4 participants × 50 KB code ≈ 100 MB live state + ~80 MB Node + Fastify overhead ≈ **200 MB total**. Record current container memory limit from deploy config. If limit < 256 MB, bump it in Step 20.

- [ ] **Step 1.5: Write findings into plan file**

Append the collected values to the top of this plan under a `## Pre-flight findings` section:

```markdown
## Pre-flight findings

- PROD_WS_PORT: 3001   (or chosen fallback)
- WS_REACH: direct-port
- Deploy entry to update: .github/workflows/deploy.yml:42 (example)
- Memory limit: 512 MB (OK)
```

All subsequent tasks reference `PROD_WS_PORT` and `WS_REACH` from this block.

---

## Task 2: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 2.1: Install runtime deps**

Run:

```bash
bun add fastify @fastify/rate-limit socket.io socket.io-client nanoid rehype-sanitize concurrently @codesandbox/sandpack-react
```

- [ ] **Step 2.2: Install dev deps**

Run:

```bash
bun add -d tsx @types/node
```

(`@types/node` may already be installed; `bun add -d` is idempotent.)

- [ ] **Step 2.3: Verify**

Run:

```bash
bun pm ls | grep -E "fastify|socket\.io|nanoid|sandpack|concurrently|tsx"
```

Expected: at least 7 lines showing the new packages.

---

## Task 3: Add `tsconfig.server.json` + scripts

**Files:**
- Create: `tsconfig.server.json`
- Modify: `package.json` (scripts section)
- Modify: `.gitignore` (add `dist-server/`)

- [ ] **Step 3.1: Create `tsconfig.server.json`**

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "lib": ["es2022"],
    "outDir": "dist-server",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": false,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/shared/contracts": ["src/shared/contracts/index.ts"],
      "@/shared/contracts/*": ["src/shared/contracts/*"]
    }
  },
  "include": [
    "src-server/**/*.ts",
    "src/shared/contracts/**/*.ts"
  ],
  "exclude": ["node_modules", "dist-server", "tests", ".next"]
}
```

- [ ] **Step 3.2: Update `package.json` scripts**

Replace the `"scripts"` object with:

```json
"scripts": {
  "dev": "concurrently -n next,ws -c cyan,magenta \"next dev\" \"tsx watch src-server/ws-server.ts\"",
  "dev:next": "next dev",
  "dev:ws": "tsx watch src-server/ws-server.ts",
  "build": "next build && tsc -p tsconfig.server.json",
  "build:next": "next build",
  "build:ws": "tsc -p tsconfig.server.json",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3.3: Append `dist-server/` to `.gitignore`**

```bash
echo "dist-server/" >> .gitignore
```

- [ ] **Step 3.4: Verify TS config compiles empty tree**

Run:

```bash
mkdir -p src-server && touch src-server/.placeholder.ts && bunx tsc -p tsconfig.server.json && ls dist-server/ && rm src-server/.placeholder.ts
```

Expected: no errors; `dist-server/` is created.

---

## Task 4: Shared contracts (`src/shared/contracts/`)

**Files:**
- Create: `src/shared/contracts/room.ts`
- Create: `src/shared/contracts/events.ts`
- Create: `src/shared/contracts/errors.ts`
- Create: `src/shared/contracts/index.ts`

No tests — types are verified by TypeScript compilation.

- [ ] **Step 4.1: Create `src/shared/contracts/errors.ts`**

```ts
export type RoomErrorCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_FULL"
  | "NICKNAME_INVALID"
  | "NICKNAME_TAKEN"
  | "CODE_TOO_LARGE"
  | "RATE_LIMITED"
  | "MAX_ROOMS_REACHED"
  | "NOT_JOINED"
  | "INVALID_TASK_SOURCE";

export const ROOM_ERROR_LABELS: Record<RoomErrorCode, string> = {
  ROOM_NOT_FOUND: "Комната не найдена или была закрыта",
  ROOM_FULL: "Комната заполнена (4/4)",
  NICKNAME_INVALID: "Никнейм должен быть 1–20 символов без HTML",
  NICKNAME_TAKEN: "Этот ник уже занят в комнате",
  CODE_TOO_LARGE: "Код слишком большой (>50 KB)",
  RATE_LIMITED: "Слишком много запросов — подожди минуту",
  MAX_ROOMS_REACHED: "Сервер временно переполнен",
  NOT_JOINED: "Сначала присоединись к комнате",
  INVALID_TASK_SOURCE: "Некорректное описание задачи",
};
```

- [ ] **Step 4.2: Create `src/shared/contracts/room.ts`**

```ts
export type Language = "js" | "ts" | "react";

export type ParticipantStatus = "thinking" | "ready";

export type TaskSource =
  | { kind: "catalog"; category: string; slug: string }
  | { kind: "custom"; title: string; markdown: string };

export interface TaskContent {
  title: string;
  markdown: string;
}

export interface ParticipantPublic {
  id: string;
  nickname: string;
  status: ParticipantStatus;
  joinedAt: number;
  hasSharedCode: boolean;
}

export interface RoomSnapshot {
  id: string;
  taskSource: TaskSource;
  maxParticipants: 4;
  participants: ParticipantPublic[];
  createdAt: number;
}

export const MAX_PARTICIPANTS = 4 as const;
export const MAX_CODE_BYTES = 50 * 1024;
export const NICKNAME_MAX_LEN = 20;
```

- [ ] **Step 4.3: Create `src/shared/contracts/events.ts`**

```ts
import type {
  Language,
  ParticipantPublic,
  ParticipantStatus,
  RoomSnapshot,
  TaskContent,
} from "./room";
import type { RoomErrorCode } from "./errors";

export interface JoinAckOk {
  ok: true;
  snapshot: RoomSnapshot;
  selfId: string;
  task: TaskContent;
  sharedCodes: Array<{ participantId: string; code: string; language: Language }>;
}

export interface JoinAckError {
  ok: false;
  error: RoomErrorCode;
}

export type JoinAck = JoinAckOk | JoinAckError;

export interface ServerToClientEvents {
  "room:participant-joined": (payload: { participant: ParticipantPublic }) => void;
  "room:participant-left": (payload: { participantId: string }) => void;
  "room:participant-status": (payload: { participantId: string; status: ParticipantStatus }) => void;
  "room:shared-code-updated": (payload: { participantId: string; code: string; language: Language }) => void;
  "room:shared-code-cleared": (payload: { participantId: string }) => void;
  "room:error": (payload: { code: RoomErrorCode; message: string }) => void;
}

export interface ClientToServerEvents {
  "room:join": (
    payload: { roomId: string; nickname: string },
    ack: (result: JoinAck) => void
  ) => void;
  "code:update": (payload: { code: string; language: Language }) => void;
  "code:share": () => void;
  "code:unshare": () => void;
  "status:set": (payload: { status: ParticipantStatus }) => void;
}
```

- [ ] **Step 4.4: Create `src/shared/contracts/index.ts`**

```ts
export * from "./room";
export * from "./events";
export * from "./errors";
```

- [ ] **Step 4.5: Verify it compiles**

Run:

```bash
bunx tsc --noEmit && bunx tsc -p tsconfig.server.json
```

Expected: no errors in either command.

---

## Task 5: Server — sanitize helpers

**Files:**
- Create: `src-server/sanitize.ts`
- Create: `tests/server/sanitize.test.ts`

- [ ] **Step 5.1: Write failing tests `tests/server/sanitize.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import {
  validateNickname,
  sanitizeMarkdown,
  NICKNAME_MAX_LEN,
} from "../../src-server/sanitize";

describe("validateNickname", () => {
  it("accepts 1..20 printable chars", () => {
    expect(validateNickname("alice").ok).toBe(true);
    expect(validateNickname("a").ok).toBe(true);
    expect(validateNickname("a".repeat(NICKNAME_MAX_LEN)).ok).toBe(true);
  });

  it("rejects empty and whitespace-only", () => {
    expect(validateNickname("").ok).toBe(false);
    expect(validateNickname("   ").ok).toBe(false);
  });

  it("rejects too long", () => {
    expect(validateNickname("a".repeat(NICKNAME_MAX_LEN + 1)).ok).toBe(false);
  });

  it("rejects HTML brackets", () => {
    expect(validateNickname("<img>").ok).toBe(false);
    expect(validateNickname("a<b").ok).toBe(false);
  });

  it("trims and returns normalized value", () => {
    const result = validateNickname("  alice  ");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("alice");
  });
});

describe("sanitizeMarkdown", () => {
  it("passes plain markdown unchanged", () => {
    const md = "# hello\n\nparagraph";
    expect(sanitizeMarkdown(md)).toContain("# hello");
  });

  it("strips <script> tags", () => {
    const md = "# title\n\n<script>alert(1)</script>\n\nbody";
    const cleaned = sanitizeMarkdown(md);
    expect(cleaned).not.toContain("<script>");
    expect(cleaned).not.toContain("alert(1)");
  });

  it("strips event handler attributes", () => {
    const md = '<a href="x" onclick="bad()">link</a>';
    const cleaned = sanitizeMarkdown(md);
    expect(cleaned).not.toContain("onclick");
  });

  it("keeps code blocks", () => {
    const md = "```js\nconsole.log(1)\n```";
    const cleaned = sanitizeMarkdown(md);
    expect(cleaned).toContain("```js");
    expect(cleaned).toContain("console.log");
  });
});
```

- [ ] **Step 5.2: Run tests — expect failure**

```bash
bunx vitest run tests/server/sanitize.test.ts
```

Expected: Cannot find module `'../../src-server/sanitize'`.

- [ ] **Step 5.3: Implement `src-server/sanitize.ts`**

```ts
export const NICKNAME_MAX_LEN = 20;

const NICKNAME_FORBIDDEN = /[<>]/;

export type ValidationResult =
  | { ok: true; value: string }
  | { ok: false; reason: string };

export function validateNickname(raw: string): ValidationResult {
  const value = raw.trim();
  if (value.length === 0) return { ok: false, reason: "empty" };
  if (value.length > NICKNAME_MAX_LEN) return { ok: false, reason: "too_long" };
  if (NICKNAME_FORBIDDEN.test(value)) return { ok: false, reason: "forbidden_chars" };
  return { ok: true, value };
}

const SCRIPT_RE = /<script\b[\s\S]*?<\/script\s*>/gi;
const EVENT_HANDLER_RE = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const IFRAME_RE = /<iframe\b[\s\S]*?<\/iframe\s*>/gi;
const STYLE_RE = /<style\b[\s\S]*?<\/style\s*>/gi;

export function sanitizeMarkdown(md: string): string {
  return md
    .replace(SCRIPT_RE, "")
    .replace(IFRAME_RE, "")
    .replace(STYLE_RE, "")
    .replace(EVENT_HANDLER_RE, "");
}
```

Note: this is a conservative string-based sanitizer. `rehype-sanitize` is applied at render-time client-side for defence-in-depth (Task 19).

- [ ] **Step 5.4: Run tests — expect pass**

```bash
bunx vitest run tests/server/sanitize.test.ts
```

Expected: 9 tests passing.

---

## Task 6: Server — config

**Files:**
- Create: `src-server/config.ts`

- [ ] **Step 6.1: Implement `src-server/config.ts`**

```ts
function int(name: string, def: number): number {
  const raw = process.env[name];
  if (!raw) return def;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n <= 0) {
    throw new Error(`Invalid env ${name}: ${raw}`);
  }
  return n;
}

export const config = {
  wsPort: int("WS_PORT", 3001),
  maxRooms: int("MAX_ROOMS", 500),
  roomTtlMs: int("ROOM_TTL_MS", 10 * 60 * 1000),
  cleanupIntervalMs: int("CLEANUP_INTERVAL_MS", 60 * 1000),
  maxCodeBytes: int("MAX_CODE_BYTES", 50 * 1024),
  maxRoomsPerIpPerMin: int("MAX_ROOMS_PER_IP_PER_MIN", 5),
  rateLimitTimeWindowMs: int("RATE_LIMIT_WINDOW_MS", 60 * 1000),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  logLevel: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
} as const;
```

- [ ] **Step 6.2: Verify it compiles**

```bash
bunx tsc -p tsconfig.server.json
```

Expected: no errors.

---

## Task 7: Server — pure state operations

**Files:**
- Create: `src-server/types.ts`
- Create: `src-server/state.ts`
- Create: `tests/server/state.test.ts`

- [ ] **Step 7.1: Create `src-server/types.ts`**

```ts
import type { Language, ParticipantStatus, TaskSource } from "@/shared/contracts";

export interface Participant {
  id: string;
  nickname: string;
  joinedAt: number;
  status: ParticipantStatus;
  code: string;
  sharedCode: string | null;
  language: Language;
}

export interface Room {
  id: string;
  taskSource: TaskSource;
  participants: Map<string, Participant>;
  createdAt: number;
  emptyAt: number | null;
}

export interface StateStore {
  rooms: Map<string, Room>;
  now: () => number;
  newRoomId: () => string;
}
```

- [ ] **Step 7.2: Write failing tests `tests/server/state.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  createStore,
  createRoom,
  joinRoom,
  leaveRoom,
  updateCode,
  shareCode,
  unshareCode,
  setStatus,
  getRoom,
  cleanupExpiredRooms,
  toSnapshot,
} from "../../src-server/state";
import type { StateStore } from "../../src-server/types";

function makeStore(nowRef: { t: number }): StateStore {
  let counter = 0;
  return createStore({
    now: () => nowRef.t,
    newRoomId: () => `room${++counter}`,
  });
}

describe("state.createRoom", () => {
  it("creates a room with generated id", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    const res = createRoom(store, {
      taskSource: { kind: "catalog", category: "react", slug: "debounce" },
      maxRooms: 500,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.room.id).toBe("room1");
      expect(res.room.participants.size).toBe(0);
      expect(res.room.createdAt).toBe(1000);
      expect(res.room.emptyAt).toBe(1000);
    }
    expect(store.rooms.size).toBe(1);
  });

  it("returns MAX_ROOMS_REACHED when over cap", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 1 });
    const res = createRoom(store, {
      taskSource: { kind: "catalog", category: "a", slug: "c" },
      maxRooms: 1,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("MAX_ROOMS_REACHED");
  });
});

describe("state.joinRoom", () => {
  let store: StateStore;
  const now = { t: 1000 };

  beforeEach(() => {
    now.t = 1000;
    store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
  });

  it("adds participant and clears emptyAt", () => {
    const res = joinRoom(store, { roomId: "room1", socketId: "s1", nickname: "alice" });
    expect(res.ok).toBe(true);
    const room = getRoom(store, "room1")!;
    expect(room.participants.size).toBe(1);
    expect(room.participants.get("s1")?.nickname).toBe("alice");
    expect(room.emptyAt).toBeNull();
  });

  it("returns ROOM_NOT_FOUND for missing room", () => {
    const res = joinRoom(store, { roomId: "nope", socketId: "s1", nickname: "alice" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("ROOM_NOT_FOUND");
  });

  it("returns ROOM_FULL after 4 participants", () => {
    for (let i = 0; i < 4; i++) {
      joinRoom(store, { roomId: "room1", socketId: `s${i}`, nickname: `u${i}` });
    }
    const res = joinRoom(store, { roomId: "room1", socketId: "s5", nickname: "u5" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("ROOM_FULL");
  });

  it("returns NICKNAME_TAKEN for duplicate nickname (case-insensitive)", () => {
    joinRoom(store, { roomId: "room1", socketId: "s1", nickname: "alice" });
    const res = joinRoom(store, { roomId: "room1", socketId: "s2", nickname: "ALICE" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("NICKNAME_TAKEN");
  });
});

describe("state.leaveRoom", () => {
  it("removes participant and sets emptyAt when last leaves", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
    joinRoom(store, { roomId: "room1", socketId: "s1", nickname: "alice" });
    now.t = 2000;
    leaveRoom(store, { roomId: "room1", socketId: "s1" });
    const room = getRoom(store, "room1")!;
    expect(room.participants.size).toBe(0);
    expect(room.emptyAt).toBe(2000);
  });
});

describe("state.updateCode", () => {
  it("stores private code and does NOT touch sharedCode", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
    joinRoom(store, { roomId: "room1", socketId: "s1", nickname: "alice" });
    const res = updateCode(store, {
      roomId: "room1",
      socketId: "s1",
      code: "let x = 1",
      language: "ts",
      maxCodeBytes: 1024,
    });
    expect(res.ok).toBe(true);
    const p = getRoom(store, "room1")!.participants.get("s1")!;
    expect(p.code).toBe("let x = 1");
    expect(p.sharedCode).toBeNull();
  });

  it("updates sharedCode when participant is sharing", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
    joinRoom(store, { roomId: "room1", socketId: "s1", nickname: "alice" });
    shareCode(store, { roomId: "room1", socketId: "s1" });
    updateCode(store, {
      roomId: "room1",
      socketId: "s1",
      code: "new code",
      language: "ts",
      maxCodeBytes: 1024,
    });
    const p = getRoom(store, "room1")!.participants.get("s1")!;
    expect(p.sharedCode).toBe("new code");
  });

  it("rejects code above max size", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
    joinRoom(store, { roomId: "room1", socketId: "s1", nickname: "alice" });
    const res = updateCode(store, {
      roomId: "room1",
      socketId: "s1",
      code: "a".repeat(2000),
      language: "ts",
      maxCodeBytes: 1024,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("CODE_TOO_LARGE");
  });
});

describe("state.shareCode / unshareCode", () => {
  it("copies code to sharedCode", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
    joinRoom(store, { roomId: "room1", socketId: "s1", nickname: "alice" });
    updateCode(store, {
      roomId: "room1",
      socketId: "s1",
      code: "x",
      language: "ts",
      maxCodeBytes: 1024,
    });
    shareCode(store, { roomId: "room1", socketId: "s1" });
    const p = getRoom(store, "room1")!.participants.get("s1")!;
    expect(p.sharedCode).toBe("x");

    unshareCode(store, { roomId: "room1", socketId: "s1" });
    expect(getRoom(store, "room1")!.participants.get("s1")!.sharedCode).toBeNull();
  });
});

describe("state.setStatus", () => {
  it("changes status without touching sharedCode", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
    joinRoom(store, { roomId: "room1", socketId: "s1", nickname: "alice" });
    setStatus(store, { roomId: "room1", socketId: "s1", status: "ready" });
    const p = getRoom(store, "room1")!.participants.get("s1")!;
    expect(p.status).toBe("ready");
    expect(p.sharedCode).toBeNull();
  });
});

describe("state.cleanupExpiredRooms", () => {
  it("removes empty rooms older than ttl", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
    now.t = 1000 + 11 * 60 * 1000;
    cleanupExpiredRooms(store, { ttlMs: 10 * 60 * 1000 });
    expect(store.rooms.size).toBe(0);
  });

  it("keeps rooms with participants", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
    joinRoom(store, { roomId: "room1", socketId: "s1", nickname: "alice" });
    now.t = 1000 + 11 * 60 * 1000;
    cleanupExpiredRooms(store, { ttlMs: 10 * 60 * 1000 });
    expect(store.rooms.size).toBe(1);
  });

  it("keeps empty rooms under ttl", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
    now.t = 1000 + 5 * 60 * 1000;
    cleanupExpiredRooms(store, { ttlMs: 10 * 60 * 1000 });
    expect(store.rooms.size).toBe(1);
  });
});

describe("state.toSnapshot", () => {
  it("omits private code fields from output", () => {
    const now = { t: 1000 };
    const store = makeStore(now);
    createRoom(store, { taskSource: { kind: "catalog", category: "a", slug: "b" }, maxRooms: 500 });
    joinRoom(store, { roomId: "room1", socketId: "s1", nickname: "alice" });
    updateCode(store, {
      roomId: "room1",
      socketId: "s1",
      code: "secret",
      language: "ts",
      maxCodeBytes: 1024,
    });
    const snap = toSnapshot(getRoom(store, "room1")!);
    expect(JSON.stringify(snap)).not.toContain("secret");
    expect(snap.participants[0].nickname).toBe("alice");
    expect(snap.participants[0].hasSharedCode).toBe(false);
  });
});
```

- [ ] **Step 7.3: Run tests — expect failure**

```bash
bunx vitest run tests/server/state.test.ts
```

Expected: cannot find module `'../../src-server/state'`.

- [ ] **Step 7.4: Implement `src-server/state.ts`**

```ts
import type {
  Language,
  ParticipantStatus,
  RoomSnapshot,
  TaskSource,
} from "@/shared/contracts";
import type { Participant, Room, StateStore } from "./types";

export interface StoreDeps {
  now: () => number;
  newRoomId: () => string;
}

export function createStore(deps: StoreDeps): StateStore {
  return {
    rooms: new Map(),
    now: deps.now,
    newRoomId: deps.newRoomId,
  };
}

type Ok<T> = { ok: true } & T;
type Err<E extends string> = { ok: false; error: E };

export function createRoom(
  store: StateStore,
  input: { taskSource: TaskSource; maxRooms: number }
): Ok<{ room: Room }> | Err<"MAX_ROOMS_REACHED"> {
  if (store.rooms.size >= input.maxRooms) {
    return { ok: false, error: "MAX_ROOMS_REACHED" };
  }
  const now = store.now();
  const room: Room = {
    id: store.newRoomId(),
    taskSource: input.taskSource,
    participants: new Map(),
    createdAt: now,
    emptyAt: now,
  };
  store.rooms.set(room.id, room);
  return { ok: true, room };
}

export function getRoom(store: StateStore, roomId: string): Room | undefined {
  return store.rooms.get(roomId);
}

export function joinRoom(
  store: StateStore,
  input: { roomId: string; socketId: string; nickname: string }
):
  | Ok<{ participant: Participant; room: Room }>
  | Err<"ROOM_NOT_FOUND" | "ROOM_FULL" | "NICKNAME_TAKEN"> {
  const room = store.rooms.get(input.roomId);
  if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
  if (room.participants.size >= 4) return { ok: false, error: "ROOM_FULL" };

  const lower = input.nickname.toLowerCase();
  for (const p of room.participants.values()) {
    if (p.nickname.toLowerCase() === lower) {
      return { ok: false, error: "NICKNAME_TAKEN" };
    }
  }

  const participant: Participant = {
    id: input.socketId,
    nickname: input.nickname,
    joinedAt: store.now(),
    status: "thinking",
    code: "",
    sharedCode: null,
    language: "ts",
  };
  room.participants.set(participant.id, participant);
  room.emptyAt = null;
  return { ok: true, participant, room };
}

export function leaveRoom(
  store: StateStore,
  input: { roomId: string; socketId: string }
): { removed: boolean; roomEmpty: boolean } {
  const room = store.rooms.get(input.roomId);
  if (!room) return { removed: false, roomEmpty: false };
  const removed = room.participants.delete(input.socketId);
  if (removed && room.participants.size === 0) {
    room.emptyAt = store.now();
  }
  return { removed, roomEmpty: room.participants.size === 0 };
}

export function updateCode(
  store: StateStore,
  input: {
    roomId: string;
    socketId: string;
    code: string;
    language: Language;
    maxCodeBytes: number;
  }
):
  | Ok<{ broadcast: boolean }>
  | Err<"ROOM_NOT_FOUND" | "NOT_JOINED" | "CODE_TOO_LARGE"> {
  const room = store.rooms.get(input.roomId);
  if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
  const p = room.participants.get(input.socketId);
  if (!p) return { ok: false, error: "NOT_JOINED" };
  if (Buffer.byteLength(input.code, "utf8") > input.maxCodeBytes) {
    return { ok: false, error: "CODE_TOO_LARGE" };
  }
  p.code = input.code;
  p.language = input.language;
  const broadcast = p.sharedCode !== null;
  if (broadcast) p.sharedCode = input.code;
  return { ok: true, broadcast };
}

export function shareCode(
  store: StateStore,
  input: { roomId: string; socketId: string }
): Ok<{ code: string; language: Language }> | Err<"ROOM_NOT_FOUND" | "NOT_JOINED"> {
  const room = store.rooms.get(input.roomId);
  if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
  const p = room.participants.get(input.socketId);
  if (!p) return { ok: false, error: "NOT_JOINED" };
  p.sharedCode = p.code;
  return { ok: true, code: p.code, language: p.language };
}

export function unshareCode(
  store: StateStore,
  input: { roomId: string; socketId: string }
): Ok<{}> | Err<"ROOM_NOT_FOUND" | "NOT_JOINED"> {
  const room = store.rooms.get(input.roomId);
  if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
  const p = room.participants.get(input.socketId);
  if (!p) return { ok: false, error: "NOT_JOINED" };
  p.sharedCode = null;
  return { ok: true };
}

export function setStatus(
  store: StateStore,
  input: { roomId: string; socketId: string; status: ParticipantStatus }
): Ok<{}> | Err<"ROOM_NOT_FOUND" | "NOT_JOINED"> {
  const room = store.rooms.get(input.roomId);
  if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
  const p = room.participants.get(input.socketId);
  if (!p) return { ok: false, error: "NOT_JOINED" };
  p.status = input.status;
  return { ok: true };
}

export function cleanupExpiredRooms(
  store: StateStore,
  input: { ttlMs: number }
): { removed: number } {
  const now = store.now();
  let removed = 0;
  for (const [id, room] of store.rooms) {
    if (room.emptyAt !== null && now - room.emptyAt >= input.ttlMs) {
      store.rooms.delete(id);
      removed++;
    }
  }
  return { removed };
}

export function toSnapshot(room: Room): RoomSnapshot {
  return {
    id: room.id,
    taskSource: room.taskSource,
    maxParticipants: 4,
    participants: Array.from(room.participants.values()).map((p) => ({
      id: p.id,
      nickname: p.nickname,
      status: p.status,
      joinedAt: p.joinedAt,
      hasSharedCode: p.sharedCode !== null,
    })),
    createdAt: room.createdAt,
  };
}
```

- [ ] **Step 7.5: Run tests — expect pass**

```bash
bunx vitest run tests/server/state.test.ts
```

Expected: 15 tests passing.

---

## Task 8: Server — HTTP routes

**Files:**
- Create: `src-server/http.ts`
- Create: `tests/server/http.test.ts`

- [ ] **Step 8.1: Write failing tests `tests/server/http.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../src-server/http";
import { createStore } from "../../src-server/state";
import type { StateStore } from "../../src-server/types";

function makeStore(nowRef: { t: number }): StateStore {
  let c = 0;
  return createStore({ now: () => nowRef.t, newRoomId: () => `r${++c}` });
}

describe("POST /rooms", () => {
  let store: StateStore;
  const now = { t: 1000 };

  beforeEach(() => {
    now.t = 1000;
    store = makeStore(now);
  });

  it("creates a catalog-task room", async () => {
    const app = await buildApp({ store, maxRooms: 500, rateLimit: { max: 1000, timeWindow: "1 minute" } });
    const res = await app.inject({
      method: "POST",
      url: "/rooms",
      payload: { taskSource: { kind: "catalog", category: "react", slug: "debounce" } },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual({ id: "r1" });
  });

  it("returns 400 on invalid task source", async () => {
    const app = await buildApp({ store, maxRooms: 500, rateLimit: { max: 1000, timeWindow: "1 minute" } });
    const res = await app.inject({
      method: "POST",
      url: "/rooms",
      payload: { taskSource: { kind: "wat" } },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 503 when MAX_ROOMS reached", async () => {
    const app = await buildApp({ store, maxRooms: 1, rateLimit: { max: 1000, timeWindow: "1 minute" } });
    await app.inject({
      method: "POST",
      url: "/rooms",
      payload: { taskSource: { kind: "catalog", category: "a", slug: "b" } },
    });
    const res = await app.inject({
      method: "POST",
      url: "/rooms",
      payload: { taskSource: { kind: "catalog", category: "a", slug: "c" } },
    });
    expect(res.statusCode).toBe(503);
  });

  it("rate-limits after configured max", async () => {
    const app = await buildApp({ store, maxRooms: 500, rateLimit: { max: 2, timeWindow: "1 minute" } });
    const body = { taskSource: { kind: "catalog", category: "a", slug: "b" } };
    await app.inject({ method: "POST", url: "/rooms", payload: body });
    await app.inject({ method: "POST", url: "/rooms", payload: body });
    const third = await app.inject({ method: "POST", url: "/rooms", payload: body });
    expect(third.statusCode).toBe(429);
  });
});

describe("GET /rooms/:id", () => {
  it("returns 404 for missing room", async () => {
    const store = makeStore({ t: 1000 });
    const app = await buildApp({ store, maxRooms: 500, rateLimit: { max: 1000, timeWindow: "1 minute" } });
    const res = await app.inject({ method: "GET", url: "/rooms/missing" });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ exists: false });
  });

  it("returns 200 with participantCount for existing room", async () => {
    const store = makeStore({ t: 1000 });
    const app = await buildApp({ store, maxRooms: 500, rateLimit: { max: 1000, timeWindow: "1 minute" } });
    await app.inject({
      method: "POST",
      url: "/rooms",
      payload: { taskSource: { kind: "catalog", category: "a", slug: "b" } },
    });
    const res = await app.inject({ method: "GET", url: "/rooms/r1" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ exists: true, participantCount: 0, maxParticipants: 4 });
  });
});
```

- [ ] **Step 8.2: Run tests — expect failure**

```bash
bunx vitest run tests/server/http.test.ts
```

Expected: module not found.

- [ ] **Step 8.3: Implement `src-server/http.ts`**

```ts
import Fastify, { type FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { createRoom, getRoom } from "./state";
import type { StateStore } from "./types";
import type { TaskSource } from "@/shared/contracts";

export interface BuildAppOptions {
  store: StateStore;
  maxRooms: number;
  rateLimit: { max: number; timeWindow: string };
  logger?: boolean;
}

function isTaskSource(x: unknown): x is TaskSource {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  if (o.kind === "catalog") {
    return typeof o.category === "string" && typeof o.slug === "string";
  }
  if (o.kind === "custom") {
    return typeof o.title === "string" && typeof o.markdown === "string";
  }
  return false;
}

export async function buildApp(opts: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? false });

  await app.register(rateLimit, {
    max: opts.rateLimit.max,
    timeWindow: opts.rateLimit.timeWindow,
  });

  app.post<{ Body: { taskSource: unknown } }>(
    "/rooms",
    {
      config: {
        rateLimit: { max: opts.rateLimit.max, timeWindow: opts.rateLimit.timeWindow },
      },
    },
    async (req, reply) => {
      const body = req.body ?? ({} as { taskSource: unknown });
      if (!isTaskSource(body.taskSource)) {
        return reply.code(400).send({ error: "INVALID_TASK_SOURCE" });
      }
      const result = createRoom(opts.store, {
        taskSource: body.taskSource,
        maxRooms: opts.maxRooms,
      });
      if (!result.ok) {
        return reply.code(503).send({ error: result.error });
      }
      return reply.code(201).send({ id: result.room.id });
    }
  );

  app.get<{ Params: { id: string } }>("/rooms/:id", async (req, reply) => {
    const room = getRoom(opts.store, req.params.id);
    if (!room) {
      return reply.code(404).send({ exists: false });
    }
    return reply.code(200).send({
      exists: true,
      participantCount: room.participants.size,
      maxParticipants: 4,
    });
  });

  return app;
}
```

- [ ] **Step 8.4: Run tests — expect pass**

```bash
bunx vitest run tests/server/http.test.ts
```

Expected: 6 tests passing.

---

## Task 9: Server — Socket.IO layer

**Files:**
- Create: `src-server/ws.ts`
- Create: `tests/server/ws.integration.test.ts`

- [ ] **Step 9.1: Write failing integration test `tests/server/ws.integration.test.ts`**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createServer, type Server as HttpServer } from "http";
import { Server as IOServer } from "socket.io";
import { io as ClientIO, type Socket as ClientSocket } from "socket.io-client";
import { createStore, createRoom } from "../../src-server/state";
import { attachWs } from "../../src-server/ws";
import type { StateStore } from "../../src-server/types";
import type { ClientToServerEvents, ServerToClientEvents } from "@/shared/contracts";

type C = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

async function bootHarness() {
  const now = { t: 1000 };
  let counter = 0;
  const store: StateStore = createStore({
    now: () => now.t,
    newRoomId: () => `r${++counter}`,
  });
  const http: HttpServer = createServer();
  const io = new IOServer(http, { cors: { origin: "*" } });
  attachWs(io, { store, maxCodeBytes: 50 * 1024, maxUpdatesPerSec: 100 });
  await new Promise<void>((res) => http.listen(0, res));
  const address = http.address();
  if (!address || typeof address === "string") throw new Error("no address");
  const url = `http://127.0.0.1:${address.port}`;
  return { url, http, io, store, now };
}

function connect(url: string): C {
  return ClientIO(url, { transports: ["websocket"], forceNew: true }) as C;
}

function wait<T>(sock: C, event: keyof ServerToClientEvents): Promise<T> {
  return new Promise((resolve) => {
    sock.once(event as string, (payload: T) => resolve(payload));
  });
}

describe("ws integration", () => {
  let harness: Awaited<ReturnType<typeof bootHarness>>;
  const clients: C[] = [];

  beforeEach(async () => {
    harness = await bootHarness();
    createRoom(harness.store, {
      taskSource: { kind: "catalog", category: "a", slug: "b" },
      maxRooms: 500,
    });
  });

  afterEach(async () => {
    clients.splice(0).forEach((c) => c.disconnect());
    harness.io.close();
    await new Promise<void>((res) => harness.http.close(() => res()));
  });

  it("two clients see each other join", async () => {
    const c1 = connect(harness.url);
    clients.push(c1);
    await new Promise<void>((r) => c1.on("connect", () => r()));
    const ack1 = await new Promise<any>((r) =>
      c1.emit("room:join", { roomId: "r1", nickname: "alice" }, r)
    );
    expect(ack1.ok).toBe(true);

    const c2 = connect(harness.url);
    clients.push(c2);
    await new Promise<void>((r) => c2.on("connect", () => r()));

    const joinedOnC1 = wait<{ participant: { nickname: string } }>(c1, "room:participant-joined");
    const ack2 = await new Promise<any>((r) =>
      c2.emit("room:join", { roomId: "r1", nickname: "bob" }, r)
    );
    expect(ack2.ok).toBe(true);
    const joined = await joinedOnC1;
    expect(joined.participant.nickname).toBe("bob");
  });

  it("code:update without share is NOT broadcast", async () => {
    const c1 = connect(harness.url);
    const c2 = connect(harness.url);
    clients.push(c1, c2);
    await Promise.all([
      new Promise<void>((r) => c1.on("connect", () => r())),
      new Promise<void>((r) => c2.on("connect", () => r())),
    ]);
    await new Promise<any>((r) => c1.emit("room:join", { roomId: "r1", nickname: "alice" }, r));
    await new Promise<any>((r) => c2.emit("room:join", { roomId: "r1", nickname: "bob" }, r));

    let leaked = false;
    c2.on("room:shared-code-updated", () => {
      leaked = true;
    });
    c1.emit("code:update", { code: "secret", language: "ts" });
    await new Promise((r) => setTimeout(r, 80));
    expect(leaked).toBe(false);
  });

  it("code:share then code:update broadcasts to peer", async () => {
    const c1 = connect(harness.url);
    const c2 = connect(harness.url);
    clients.push(c1, c2);
    await Promise.all([
      new Promise<void>((r) => c1.on("connect", () => r())),
      new Promise<void>((r) => c2.on("connect", () => r())),
    ]);
    await new Promise<any>((r) => c1.emit("room:join", { roomId: "r1", nickname: "alice" }, r));
    await new Promise<any>((r) => c2.emit("room:join", { roomId: "r1", nickname: "bob" }, r));

    c1.emit("code:update", { code: "initial", language: "ts" });
    c1.emit("code:share");
    const payload = await wait<{ code: string }>(c2, "room:shared-code-updated");
    expect(payload.code).toBe("initial");

    const nextUpdate = wait<{ code: string }>(c2, "room:shared-code-updated");
    c1.emit("code:update", { code: "updated", language: "ts" });
    const p2 = await nextUpdate;
    expect(p2.code).toBe("updated");
  });

  it("5th joiner gets ROOM_FULL", async () => {
    const sockets: C[] = [];
    for (let i = 0; i < 4; i++) {
      const c = connect(harness.url);
      sockets.push(c);
      clients.push(c);
      await new Promise<void>((r) => c.on("connect", () => r()));
      await new Promise<any>((r) => c.emit("room:join", { roomId: "r1", nickname: `u${i}` }, r));
    }
    const c5 = connect(harness.url);
    clients.push(c5);
    await new Promise<void>((r) => c5.on("connect", () => r()));
    const ack = await new Promise<any>((r) =>
      c5.emit("room:join", { roomId: "r1", nickname: "u5" }, r)
    );
    expect(ack.ok).toBe(false);
    expect(ack.error).toBe("ROOM_FULL");
  });

  it("join missing room returns ROOM_NOT_FOUND", async () => {
    const c = connect(harness.url);
    clients.push(c);
    await new Promise<void>((r) => c.on("connect", () => r()));
    const ack = await new Promise<any>((r) =>
      c.emit("room:join", { roomId: "nope", nickname: "alice" }, r)
    );
    expect(ack.ok).toBe(false);
    expect(ack.error).toBe("ROOM_NOT_FOUND");
  });

  it("disconnect broadcasts participant-left", async () => {
    const c1 = connect(harness.url);
    const c2 = connect(harness.url);
    clients.push(c1, c2);
    await Promise.all([
      new Promise<void>((r) => c1.on("connect", () => r())),
      new Promise<void>((r) => c2.on("connect", () => r())),
    ]);
    await new Promise<any>((r) => c1.emit("room:join", { roomId: "r1", nickname: "alice" }, r));
    await new Promise<any>((r) => c2.emit("room:join", { roomId: "r1", nickname: "bob" }, r));

    const left = wait<{ participantId: string }>(c1, "room:participant-left");
    c2.disconnect();
    const payload = await left;
    expect(typeof payload.participantId).toBe("string");
  });
});
```

- [ ] **Step 9.2: Run tests — expect failure**

```bash
bunx vitest run tests/server/ws.integration.test.ts
```

Expected: module not found.

- [ ] **Step 9.3: Implement `src-server/ws.ts`**

```ts
import type { Server as IOServer, Socket } from "socket.io";
import {
  joinRoom,
  leaveRoom,
  updateCode,
  shareCode,
  unshareCode,
  setStatus,
  getRoom,
  toSnapshot,
} from "./state";
import { validateNickname } from "./sanitize";
import type { StateStore, Participant } from "./types";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  JoinAck,
  Language,
  ParticipantStatus,
  ParticipantPublic,
  TaskContent,
} from "@/shared/contracts";
import { ROOM_ERROR_LABELS } from "@/shared/contracts";

export interface AttachWsOptions {
  store: StateStore;
  maxCodeBytes: number;
  maxUpdatesPerSec: number;
  loadTaskContent?: (roomId: string) => Promise<TaskContent>;
}

interface SocketData {
  roomId?: string;
  nickname?: string;
  updateWindowStart: number;
  updateCount: number;
}

function participantToPublic(p: Participant): ParticipantPublic {
  return {
    id: p.id,
    nickname: p.nickname,
    status: p.status,
    joinedAt: p.joinedAt,
    hasSharedCode: p.sharedCode !== null,
  };
}

export function attachWs(
  io: IOServer<ClientToServerEvents, ServerToClientEvents>,
  opts: AttachWsOptions
): void {
  io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>) => {
    socket.data = { updateWindowStart: 0, updateCount: 0 };

    socket.on("room:join", async (payload, ack) => {
      const nick = validateNickname(payload.nickname);
      if (!nick.ok) {
        ack({ ok: false, error: "NICKNAME_INVALID" } satisfies JoinAck);
        return;
      }
      const result = joinRoom(opts.store, {
        roomId: payload.roomId,
        socketId: socket.id,
        nickname: nick.value,
      });
      if (!result.ok) {
        ack({ ok: false, error: result.error } satisfies JoinAck);
        return;
      }
      socket.data.roomId = payload.roomId;
      socket.data.nickname = nick.value;
      await socket.join(payload.roomId);

      const room = result.room;
      const snapshot = toSnapshot(room);
      const sharedCodes = Array.from(room.participants.values())
        .filter((p) => p.sharedCode !== null && p.id !== socket.id)
        .map((p) => ({ participantId: p.id, code: p.sharedCode!, language: p.language }));

      const task: TaskContent = opts.loadTaskContent
        ? await opts.loadTaskContent(payload.roomId)
        : { title: "", markdown: "" };

      ack({ ok: true, snapshot, selfId: socket.id, task, sharedCodes } satisfies JoinAck);
      socket.to(payload.roomId).emit("room:participant-joined", {
        participant: participantToPublic(result.participant),
      });
    });

    socket.on("code:update", (payload) => {
      const roomId = socket.data.roomId;
      if (!roomId) {
        socket.emit("room:error", {
          code: "NOT_JOINED",
          message: ROOM_ERROR_LABELS.NOT_JOINED,
        });
        return;
      }
      const now = Date.now();
      if (now - socket.data.updateWindowStart > 1000) {
        socket.data.updateWindowStart = now;
        socket.data.updateCount = 0;
      }
      socket.data.updateCount += 1;
      if (socket.data.updateCount > opts.maxUpdatesPerSec) return;

      const result = updateCode(opts.store, {
        roomId,
        socketId: socket.id,
        code: payload.code,
        language: payload.language as Language,
        maxCodeBytes: opts.maxCodeBytes,
      });
      if (!result.ok) {
        if (result.error === "CODE_TOO_LARGE") {
          socket.emit("room:error", {
            code: "CODE_TOO_LARGE",
            message: ROOM_ERROR_LABELS.CODE_TOO_LARGE,
          });
        }
        return;
      }
      if (result.broadcast) {
        socket.to(roomId).emit("room:shared-code-updated", {
          participantId: socket.id,
          code: payload.code,
          language: payload.language as Language,
        });
      }
    });

    socket.on("code:share", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const result = shareCode(opts.store, { roomId, socketId: socket.id });
      if (!result.ok) return;
      socket.to(roomId).emit("room:shared-code-updated", {
        participantId: socket.id,
        code: result.code,
        language: result.language,
      });
    });

    socket.on("code:unshare", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const result = unshareCode(opts.store, { roomId, socketId: socket.id });
      if (!result.ok) return;
      socket.to(roomId).emit("room:shared-code-cleared", { participantId: socket.id });
    });

    socket.on("status:set", (payload) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const result = setStatus(opts.store, {
        roomId,
        socketId: socket.id,
        status: payload.status as ParticipantStatus,
      });
      if (!result.ok) return;
      io.to(roomId).emit("room:participant-status", {
        participantId: socket.id,
        status: payload.status as ParticipantStatus,
      });
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const result = leaveRoom(opts.store, { roomId, socketId: socket.id });
      if (result.removed) {
        io.to(roomId).emit("room:participant-left", { participantId: socket.id });
      }
    });
  });
}
```

- [ ] **Step 9.4: Run integration tests — expect pass**

```bash
bunx vitest run tests/server/ws.integration.test.ts
```

Expected: 6 tests passing. Each test boots a real HTTP+Socket.IO server on a random port.

---

## Task 10: Server — entry point `ws-server.ts`

**Files:**
- Create: `src-server/ws-server.ts`

- [ ] **Step 10.1: Implement `src-server/ws-server.ts`**

```ts
import { createServer } from "http";
import { Server as IOServer } from "socket.io";
import { nanoid } from "nanoid";
import fs from "fs/promises";
import path from "path";
import { config } from "./config";
import { buildApp } from "./http";
import { attachWs } from "./ws";
import { createStore, cleanupExpiredRooms, getRoom } from "./state";
import { sanitizeMarkdown } from "./sanitize";
import type { StateStore } from "./types";
import type { TaskContent } from "@/shared/contracts";

async function loadTaskContent(store: StateStore, roomId: string): Promise<TaskContent> {
  const room = getRoom(store, roomId);
  if (!room) return { title: "", markdown: "" };

  if (room.taskSource.kind === "catalog") {
    const { category, slug } = room.taskSource;
    const dir = path.join(process.cwd(), "content", "live-coding", category);
    try {
      const files = await fs.readdir(dir);
      const match = files.find(
        (f) => f.endsWith(".mdx") && f.replace(/^\d+-/, "").replace(/\.mdx$/, "") === slug
      );
      if (!match) return { title: slug, markdown: "" };
      const raw = await fs.readFile(path.join(dir, match), "utf8");
      const body = raw.replace(/^---[\s\S]*?---\n?/, "");
      return { title: slug, markdown: body };
    } catch {
      return { title: slug, markdown: "" };
    }
  }

  return {
    title: room.taskSource.title,
    markdown: sanitizeMarkdown(room.taskSource.markdown),
  };
}

async function main(): Promise<void> {
  const store = createStore({
    now: () => Date.now(),
    newRoomId: () => nanoid(8),
  });

  const fastify = await buildApp({
    store,
    maxRooms: config.maxRooms,
    rateLimit: {
      max: config.maxRoomsPerIpPerMin,
      timeWindow: `${config.rateLimitTimeWindowMs} ms`,
    },
    logger: true,
  });

  const http = createServer(fastify.server);
  await fastify.ready();

  const io = new IOServer(http, {
    cors: { origin: config.corsOrigin },
    pingTimeout: 25_000,
    pingInterval: 10_000,
  });

  attachWs(io, {
    store,
    maxCodeBytes: config.maxCodeBytes,
    maxUpdatesPerSec: 5,
    loadTaskContent: (roomId) => loadTaskContent(store, roomId),
  });

  const interval = setInterval(() => {
    const { removed } = cleanupExpiredRooms(store, { ttlMs: config.roomTtlMs });
    if (removed > 0) fastify.log.info({ removed }, "cleaned up empty rooms");
  }, config.cleanupIntervalMs);
  interval.unref();

  http.listen(config.wsPort, "0.0.0.0", () => {
    fastify.log.info({ port: config.wsPort }, "ws-server listening");
  });

  const shutdown = (signal: string) => {
    fastify.log.info({ signal }, "shutting down");
    http.close(() => process.exit(0));
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("ws-server failed to start", err);
  process.exit(1);
});
```

- [ ] **Step 10.2: Verify dev boot**

Run (in a background shell — kill it after it starts):

```bash
WS_PORT=3001 bunx tsx src-server/ws-server.ts &
SERVER_PID=$!
sleep 2
curl -s http://127.0.0.1:3001/rooms/missing
kill $SERVER_PID
```

Expected: curl prints `{"exists":false}` and the server shuts down cleanly.

- [ ] **Step 10.3: Verify production build**

```bash
bunx tsc -p tsconfig.server.json && ls dist-server/src-server/ws-server.js
```

Expected: no TS errors, `dist-server/src-server/ws-server.js` exists.

---

## Task 11: Entity — `get-task-content`

**Files:**
- Create: `src/entities/room/lib/get-task-content.ts`
- Create: `src/entities/room/lib/is-valid-nickname.ts`
- Create: `src/entities/room/model/types.ts`
- Create: `src/entities/room/index.ts`
- Create: `tests/entities/room/get-task-content.test.ts`

- [ ] **Step 11.1: Write failing tests `tests/entities/room/get-task-content.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { getTaskContent } from "../../../src/entities/room/lib/get-task-content";

describe("getTaskContent", () => {
  it("loads a real catalog task", async () => {
    const result = await getTaskContent({
      kind: "catalog",
      category: "javascript",
      slug: "debounce",
    });
    expect(result.title).toBeTruthy();
    expect(result.markdown.length).toBeGreaterThan(0);
  });

  it("throws for missing catalog slug", async () => {
    await expect(
      getTaskContent({ kind: "catalog", category: "nope", slug: "missing" })
    ).rejects.toThrow();
  });

  it("returns custom markdown sanitized", async () => {
    const result = await getTaskContent({
      kind: "custom",
      title: "ad-hoc",
      markdown: "# hi\n<script>alert(1)</script>",
    });
    expect(result.title).toBe("ad-hoc");
    expect(result.markdown).not.toContain("<script>");
    expect(result.markdown).toContain("# hi");
  });
});
```

Note: Step 11.1 assumes `content/live-coding/javascript/` has a file matching slug `debounce`. If the real file name differs, adjust the test to a slug that exists (check with `ls content/live-coding/javascript/`).

- [ ] **Step 11.2: Run — expect failure**

```bash
bunx vitest run tests/entities/room/get-task-content.test.ts
```

- [ ] **Step 11.3: Implement `src/entities/room/lib/get-task-content.ts`**

```ts
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import type { TaskContent, TaskSource } from "@/shared/contracts";
import { LIVE_CODING_DIR } from "@/shared/config/constants";
import { fileNameToSlug } from "@/shared/lib/content-utils";

const SCRIPT_RE = /<script\b[\s\S]*?<\/script\s*>/gi;
const EVENT_HANDLER_RE = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const IFRAME_RE = /<iframe\b[\s\S]*?<\/iframe\s*>/gi;
const STYLE_RE = /<style\b[\s\S]*?<\/style\s*>/gi;

function sanitize(md: string): string {
  return md
    .replace(SCRIPT_RE, "")
    .replace(IFRAME_RE, "")
    .replace(STYLE_RE, "")
    .replace(EVENT_HANDLER_RE, "");
}

export async function getTaskContent(source: TaskSource): Promise<TaskContent> {
  if (source.kind === "custom") {
    return { title: source.title, markdown: sanitize(source.markdown) };
  }
  const dir = path.join(LIVE_CODING_DIR, source.category);
  const files = await fs.readdir(dir);
  const match = files.find(
    (f) => f.endsWith(".mdx") && fileNameToSlug(f) === source.slug
  );
  if (!match) {
    throw new Error(`Task not found: ${source.category}/${source.slug}`);
  }
  const raw = await fs.readFile(path.join(dir, match), "utf8");
  const { data, content } = matter(raw);
  return {
    title: (data.title as string) ?? source.slug,
    markdown: content,
  };
}
```

- [ ] **Step 11.4: Implement `src/entities/room/lib/is-valid-nickname.ts`**

```ts
import { NICKNAME_MAX_LEN } from "@/shared/contracts";

export function isValidNickname(raw: string): boolean {
  const value = raw.trim();
  if (value.length === 0) return false;
  if (value.length > NICKNAME_MAX_LEN) return false;
  if (/[<>]/.test(value)) return false;
  return true;
}
```

- [ ] **Step 11.5: Implement `src/entities/room/model/types.ts` + `index.ts`**

`src/entities/room/model/types.ts`:

```ts
export type {
  TaskSource,
  TaskContent,
  RoomSnapshot,
  ParticipantPublic,
  ParticipantStatus,
  Language,
} from "@/shared/contracts";
```

`src/entities/room/index.ts`:

```ts
export { getTaskContent } from "./lib/get-task-content";
export { isValidNickname } from "./lib/is-valid-nickname";
export type * from "./model/types";
```

- [ ] **Step 11.6: Run tests — expect pass**

```bash
bunx vitest run tests/entities/room/get-task-content.test.ts
```

Expected: 3 tests passing. Full test suite:

```bash
bun run test
```

Expected: all pre-existing tests still green + all new server/entity tests green.

---

## Task 12: Client — Zustand `room-store`

**Files:**
- Create: `src/shared/lib/room-store.ts`
- Create: `tests/shared/lib/room-store.test.ts`

- [ ] **Step 12.1: Write failing tests `tests/shared/lib/room-store.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { createRoomStore } from "../../../src/shared/lib/room-store";
import type { ParticipantPublic } from "@/shared/contracts";

function mkParticipant(id: string, nick: string): ParticipantPublic {
  return { id, nickname: nick, status: "thinking", joinedAt: 0, hasSharedCode: false };
}

describe("roomStore", () => {
  let store: ReturnType<typeof createRoomStore>;

  beforeEach(() => {
    store = createRoomStore();
  });

  it("applies participant-joined", () => {
    store.getState().applyEvent({
      type: "room:participant-joined",
      payload: { participant: mkParticipant("s1", "alice") },
    });
    expect(store.getState().participants.get("s1")?.nickname).toBe("alice");
  });

  it("applies participant-left and clears sharedCode", () => {
    const s = store.getState();
    s.applyEvent({ type: "room:participant-joined", payload: { participant: mkParticipant("s1", "alice") } });
    s.applyEvent({
      type: "room:shared-code-updated",
      payload: { participantId: "s1", code: "x", language: "ts" },
    });
    s.applyEvent({ type: "room:participant-left", payload: { participantId: "s1" } });
    expect(store.getState().participants.has("s1")).toBe(false);
    expect(store.getState().sharedCodes.has("s1")).toBe(false);
  });

  it("applies shared-code-updated and shared-code-cleared", () => {
    const s = store.getState();
    s.applyEvent({
      type: "room:shared-code-updated",
      payload: { participantId: "s1", code: "hello", language: "ts" },
    });
    expect(store.getState().sharedCodes.get("s1")?.code).toBe("hello");
    s.applyEvent({
      type: "room:shared-code-cleared",
      payload: { participantId: "s1" },
    });
    expect(store.getState().sharedCodes.has("s1")).toBe(false);
  });

  it("applies participant-status without touching sharedCodes", () => {
    const s = store.getState();
    s.applyEvent({ type: "room:participant-joined", payload: { participant: mkParticipant("s1", "alice") } });
    s.applyEvent({
      type: "room:participant-status",
      payload: { participantId: "s1", status: "ready" },
    });
    expect(store.getState().participants.get("s1")?.status).toBe("ready");
  });

  it("collapsedPeers is local only", () => {
    const s = store.getState();
    s.togglePeerCollapsed("s1");
    expect(store.getState().collapsedPeers.has("s1")).toBe(true);
    s.togglePeerCollapsed("s1");
    expect(store.getState().collapsedPeers.has("s1")).toBe(false);
  });

  it("allReady selector is true only when all known participants are ready", () => {
    const s = store.getState();
    s.applyEvent({ type: "room:participant-joined", payload: { participant: mkParticipant("s1", "alice") } });
    s.applyEvent({ type: "room:participant-joined", payload: { participant: mkParticipant("s2", "bob") } });
    expect(store.getState().allReady()).toBe(false);
    s.applyEvent({ type: "room:participant-status", payload: { participantId: "s1", status: "ready" } });
    expect(store.getState().allReady()).toBe(false);
    s.applyEvent({ type: "room:participant-status", payload: { participantId: "s2", status: "ready" } });
    expect(store.getState().allReady()).toBe(true);
  });

  it("hydrateFromSnapshot loads participants + sharedCodes", () => {
    store.getState().hydrateFromSnapshot({
      snapshot: {
        id: "r1",
        taskSource: { kind: "catalog", category: "a", slug: "b" },
        maxParticipants: 4,
        participants: [mkParticipant("s1", "alice"), mkParticipant("s2", "bob")],
        createdAt: 0,
      },
      selfId: "s1",
      sharedCodes: [{ participantId: "s2", code: "code2", language: "ts" }],
    });
    expect(store.getState().participants.size).toBe(2);
    expect(store.getState().sharedCodes.get("s2")?.code).toBe("code2");
    expect(store.getState().selfId).toBe("s1");
  });
});
```

- [ ] **Step 12.2: Run — expect failure**

```bash
bunx vitest run tests/shared/lib/room-store.test.ts
```

- [ ] **Step 12.3: Implement `src/shared/lib/room-store.ts`**

```ts
import { createStore } from "zustand/vanilla";
import type {
  ParticipantPublic,
  ParticipantStatus,
  RoomSnapshot,
  Language,
} from "@/shared/contracts";

export interface SharedCode {
  code: string;
  language: Language;
}

export type RoomEvent =
  | { type: "room:participant-joined"; payload: { participant: ParticipantPublic } }
  | { type: "room:participant-left"; payload: { participantId: string } }
  | { type: "room:participant-status"; payload: { participantId: string; status: ParticipantStatus } }
  | { type: "room:shared-code-updated"; payload: { participantId: string; code: string; language: Language } }
  | { type: "room:shared-code-cleared"; payload: { participantId: string } };

export interface RoomStoreState {
  roomId: string | null;
  selfId: string | null;
  participants: Map<string, ParticipantPublic>;
  sharedCodes: Map<string, SharedCode>;
  collapsedPeers: Set<string>;

  myCode: string;
  myLanguage: Language;
  myStatus: ParticipantStatus;
  isSharing: boolean;

  applyEvent(event: RoomEvent): void;
  hydrateFromSnapshot(input: {
    snapshot: RoomSnapshot;
    selfId: string;
    sharedCodes: Array<{ participantId: string; code: string; language: Language }>;
  }): void;
  setMyCode(code: string): void;
  setMyLanguage(language: Language): void;
  setMyStatus(status: ParticipantStatus): void;
  setSharing(flag: boolean): void;
  togglePeerCollapsed(id: string): void;
  reset(): void;
  allReady(): boolean;
}

const initial = (): Omit<RoomStoreState,
  "applyEvent" | "hydrateFromSnapshot" | "setMyCode" | "setMyLanguage" |
  "setMyStatus" | "setSharing" | "togglePeerCollapsed" | "reset" | "allReady"
> => ({
  roomId: null,
  selfId: null,
  participants: new Map(),
  sharedCodes: new Map(),
  collapsedPeers: new Set(),
  myCode: "",
  myLanguage: "ts",
  myStatus: "thinking",
  isSharing: false,
});

export function createRoomStore() {
  return createStore<RoomStoreState>((set, get) => ({
    ...initial(),

    applyEvent(event) {
      set((state) => {
        switch (event.type) {
          case "room:participant-joined": {
            const participants = new Map(state.participants);
            participants.set(event.payload.participant.id, event.payload.participant);
            return { participants };
          }
          case "room:participant-left": {
            const participants = new Map(state.participants);
            participants.delete(event.payload.participantId);
            const sharedCodes = new Map(state.sharedCodes);
            sharedCodes.delete(event.payload.participantId);
            const collapsedPeers = new Set(state.collapsedPeers);
            collapsedPeers.delete(event.payload.participantId);
            return { participants, sharedCodes, collapsedPeers };
          }
          case "room:participant-status": {
            const participants = new Map(state.participants);
            const p = participants.get(event.payload.participantId);
            if (p) participants.set(p.id, { ...p, status: event.payload.status });
            return { participants };
          }
          case "room:shared-code-updated": {
            const sharedCodes = new Map(state.sharedCodes);
            sharedCodes.set(event.payload.participantId, {
              code: event.payload.code,
              language: event.payload.language,
            });
            const participants = new Map(state.participants);
            const p = participants.get(event.payload.participantId);
            if (p) participants.set(p.id, { ...p, hasSharedCode: true });
            return { sharedCodes, participants };
          }
          case "room:shared-code-cleared": {
            const sharedCodes = new Map(state.sharedCodes);
            sharedCodes.delete(event.payload.participantId);
            const participants = new Map(state.participants);
            const p = participants.get(event.payload.participantId);
            if (p) participants.set(p.id, { ...p, hasSharedCode: false });
            return { sharedCodes, participants };
          }
          default:
            return {};
        }
      });
    },

    hydrateFromSnapshot({ snapshot, selfId, sharedCodes }) {
      const participants = new Map<string, ParticipantPublic>();
      snapshot.participants.forEach((p) => participants.set(p.id, p));
      const sharedMap = new Map<string, SharedCode>();
      sharedCodes.forEach((s) => sharedMap.set(s.participantId, { code: s.code, language: s.language }));
      set({
        roomId: snapshot.id,
        selfId,
        participants,
        sharedCodes: sharedMap,
        collapsedPeers: new Set(),
      });
    },

    setMyCode(code) {
      set({ myCode: code });
    },
    setMyLanguage(language) {
      set({ myLanguage: language });
    },
    setMyStatus(status) {
      set({ myStatus: status });
    },
    setSharing(flag) {
      set({ isSharing: flag });
    },

    togglePeerCollapsed(id) {
      set((state) => {
        const next = new Set(state.collapsedPeers);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { collapsedPeers: next };
      });
    },

    reset() {
      set(initial());
    },

    allReady() {
      const { participants } = get();
      if (participants.size === 0) return false;
      for (const p of participants.values()) {
        if (p.status !== "ready") return false;
      }
      return true;
    },
  }));
}

export const roomStore = createRoomStore();
```

- [ ] **Step 12.4: Run tests — expect pass**

```bash
bunx vitest run tests/shared/lib/room-store.test.ts
```

Expected: 7 tests passing.

---

## Task 13: Client — WS client + hook

**Files:**
- Create: `src/shared/lib/ws-client.ts`
- Create: `src/shared/lib/use-room-socket.ts`

No unit tests — covered indirectly by server integration tests and manual smoke.

- [ ] **Step 13.1: Implement `src/shared/lib/ws-client.ts`**

```ts
"use client";
import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@/shared/contracts";

export type RoomSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let singleton: RoomSocket | null = null;

export function getRoomSocket(): RoomSocket {
  if (singleton) return singleton;
  const url = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";
  singleton = io(url, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  }) as RoomSocket;
  return singleton;
}

export function disconnectRoomSocket(): void {
  if (singleton) {
    singleton.disconnect();
    singleton = null;
  }
}
```

- [ ] **Step 13.2: Implement `src/shared/lib/use-room-socket.ts`**

```ts
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { getRoomSocket, type RoomSocket } from "./ws-client";
import { roomStore } from "./room-store";
import type { JoinAck, Language, ParticipantStatus } from "@/shared/contracts";

export type ConnectionStatus = "connecting" | "joined" | "disconnected" | "error";

export interface UseRoomSocketResult {
  status: ConnectionStatus;
  error: string | null;
  emitCodeUpdate: (code: string, language: Language) => void;
  emitShare: () => void;
  emitUnshare: () => void;
  emitStatus: (status: ParticipantStatus) => void;
}

const SESSION_NICK_KEY = (roomId: string) => `rooms.nickname.${roomId}`;
const SESSION_CODE_KEY = (roomId: string) => `rooms.code.${roomId}`;

export function useRoomSocket(roomId: string, nickname: string): UseRoomSocketResult {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<RoomSocket | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(SESSION_NICK_KEY(roomId), nickname);
  }, [roomId, nickname]);

  useEffect(() => {
    const socket = getRoomSocket();
    socketRef.current = socket;

    const join = () => {
      setStatus("connecting");
      socket.emit("room:join", { roomId, nickname }, (ack: JoinAck) => {
        if (!ack.ok) {
          setStatus("error");
          setError(ack.error);
          return;
        }
        roomStore.getState().hydrateFromSnapshot({
          snapshot: ack.snapshot,
          selfId: ack.selfId,
          sharedCodes: ack.sharedCodes,
        });
        setStatus("joined");
        setError(null);

        if (typeof window !== "undefined") {
          const savedCode = sessionStorage.getItem(SESSION_CODE_KEY(roomId));
          if (savedCode) {
            roomStore.getState().setMyCode(savedCode);
            if (roomStore.getState().isSharing) {
              socket.emit("code:update", { code: savedCode, language: roomStore.getState().myLanguage });
              socket.emit("code:share");
            }
          }
        }
      });
    };

    if (socket.connected) join();
    else socket.on("connect", join);

    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("disconnected"));

    socket.on("room:participant-joined", (p) =>
      roomStore.getState().applyEvent({ type: "room:participant-joined", payload: p })
    );
    socket.on("room:participant-left", (p) =>
      roomStore.getState().applyEvent({ type: "room:participant-left", payload: p })
    );
    socket.on("room:participant-status", (p) =>
      roomStore.getState().applyEvent({ type: "room:participant-status", payload: p })
    );
    socket.on("room:shared-code-updated", (p) =>
      roomStore.getState().applyEvent({ type: "room:shared-code-updated", payload: p })
    );
    socket.on("room:shared-code-cleared", (p) =>
      roomStore.getState().applyEvent({ type: "room:shared-code-cleared", payload: p })
    );
    socket.on("room:error", ({ code }) => setError(code));

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("room:participant-joined");
      socket.off("room:participant-left");
      socket.off("room:participant-status");
      socket.off("room:shared-code-updated");
      socket.off("room:shared-code-cleared");
      socket.off("room:error");
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [roomId, nickname]);

  const emitCodeUpdate = useCallback((code: string, language: Language) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_CODE_KEY(roomId), code);
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      socketRef.current?.emit("code:update", { code, language });
    }, 500);
  }, [roomId]);

  const emitShare = useCallback(() => {
    roomStore.getState().setSharing(true);
    socketRef.current?.emit("code:share");
  }, []);

  const emitUnshare = useCallback(() => {
    roomStore.getState().setSharing(false);
    socketRef.current?.emit("code:unshare");
  }, []);

  const emitStatus = useCallback((status: ParticipantStatus) => {
    roomStore.getState().setMyStatus(status);
    socketRef.current?.emit("status:set", { status });
  }, []);

  return { status, error, emitCodeUpdate, emitShare, emitUnshare, emitStatus };
}
```

- [ ] **Step 13.3: Verify TS**

```bash
bunx tsc --noEmit
```

Expected: no errors.

---

## Task 14: `rooms.css` — terminal tokens and primitives

**Files:**
- Create: `src/app/rooms/rooms.css`

- [ ] **Step 14.1: Create `src/app/rooms/rooms.css`**

```css
.rooms-scope {
  --room-bg: oklch(0.08 0 0);
  --room-panel: oklch(0.12 0 0);
  --room-border: oklch(0.22 0 0);
  --room-border-strong: oklch(0.35 0 0);
  --room-fg: oklch(0.92 0 0);
  --room-fg-dim: oklch(0.58 0 0);
  --room-phosphor: oklch(0.88 0.20 145);
  --room-phosphor-dim: oklch(0.55 0.14 145);
  --room-amber: oklch(0.82 0.16 75);
  --room-crimson: oklch(0.68 0.22 25);

  background: var(--room-bg);
  color: var(--room-fg);
  font-family: var(--font-jetbrains-mono), ui-monospace, monospace;
  font-size: 13px;
  line-height: 1.55;
  min-height: 100vh;
  position: relative;
}

.rooms-scope * {
  border-radius: 0 !important;
}

.rooms-scope::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    transparent 2px,
    rgb(255 255 255 / 0.02) 3px
  );
  z-index: 1;
}

@media (prefers-reduced-motion: reduce) {
  .rooms-scope::before { display: none; }
}

.room-box {
  border: 1px solid var(--room-border);
  background: var(--room-panel);
  padding: 12px 16px;
}

.room-box--active {
  border-color: var(--room-border-strong);
}

.room-box--shared {
  border-color: var(--room-phosphor-dim);
}

.room-box--ready {
  border-color: var(--room-amber);
}

.room-label {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--room-fg-dim);
}

.room-btn {
  font: inherit;
  color: var(--room-fg);
  background: transparent;
  border: 1px solid var(--room-border);
  padding: 4px 10px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 11px;
}

.room-btn:hover {
  border-color: var(--room-phosphor);
  color: var(--room-phosphor);
}

.room-btn[data-variant="primary"] {
  border-color: var(--room-phosphor);
  color: var(--room-phosphor);
}

.room-btn[data-variant="danger"] {
  border-color: var(--room-crimson);
  color: var(--room-crimson);
}

.room-input {
  font: inherit;
  background: transparent;
  color: var(--room-fg);
  border: 1px solid var(--room-border);
  padding: 6px 10px;
  width: 100%;
  caret-color: var(--room-phosphor);
}

.room-input:focus {
  outline: none;
  border-color: var(--room-phosphor);
}

.room-hr {
  border: 0;
  border-top: 1px dashed var(--room-border);
  margin: 16px 0;
}

@keyframes room-boot-in {
  from { opacity: 0; transform: translateY(-2px); }
  to { opacity: 1; transform: none; }
}

.rooms-scope [data-boot] {
  animation: room-boot-in 160ms steps(4) both;
  animation-delay: var(--boot-delay, 0ms);
}

@media (prefers-reduced-motion: reduce) {
  .rooms-scope [data-boot] { animation: none; }
}

@keyframes room-ready-sweep {
  0%, 100% { outline-color: transparent; }
  50% { outline-color: var(--room-amber); }
}

.rooms-scope[data-all-ready] {
  outline: 1px solid transparent;
  outline-offset: -1px;
  animation: room-ready-sweep 900ms ease-out 1;
}

.rooms-scope .room-blink::after {
  content: "█";
  color: var(--room-phosphor);
  animation: room-blink 1s steps(1) infinite;
}

@keyframes room-blink {
  50% { opacity: 0; }
}
```

- [ ] **Step 14.2: Verify it loads**

```bash
bunx tsc --noEmit
```

(CSS isn't checked by TS — this just catches no accidental `.ts` typos next to it.)

---

## Task 15: App route scaffolding — `/rooms` layout + landing page

**Files:**
- Create: `src/app/rooms/layout.tsx`
- Create: `src/app/rooms/page.tsx`
- Create: `src/features/room-create/ui/create-room-form.tsx`

- [ ] **Step 15.1: Create `src/app/rooms/layout.tsx`**

```tsx
import type { ReactNode } from "react";
import "./rooms.css";

export const metadata = { title: "Rooms — live-coding" };

export default function RoomsLayout({ children }: { children: ReactNode }) {
  return <div className="rooms-scope">{children}</div>;
}
```

- [ ] **Step 15.2: Create `src/features/room-create/ui/create-room-form.tsx`**

```tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TaskSource } from "@/shared/contracts";
import { isValidNickname } from "@/entities/room";

interface CatalogOption {
  category: string;
  slug: string;
  title: string;
}

interface CreateRoomFormProps {
  catalog: CatalogOption[];
}

export function CreateRoomForm({ catalog }: CreateRoomFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"catalog" | "custom">("catalog");
  const [nickname, setNickname] = useState("");
  const [selected, setSelected] = useState(catalog[0]?.slug ?? "");
  const [customTitle, setCustomTitle] = useState("");
  const [customMd, setCustomMd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    if (!isValidNickname(nickname)) {
      setError("Никнейм 1–20 символов без < >");
      return;
    }
    let taskSource: TaskSource;
    if (mode === "catalog") {
      const item = catalog.find((c) => c.slug === selected);
      if (!item) {
        setError("Выбери задачу");
        return;
      }
      taskSource = { kind: "catalog", category: item.category, slug: item.slug };
    } else {
      if (!customTitle.trim() || !customMd.trim()) {
        setError("Заполни заголовок и условие");
        return;
      }
      taskSource = { kind: "custom", title: customTitle.trim(), markdown: customMd };
    }

    start(async () => {
      try {
        const url = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";
        const res = await fetch(`${url}/rooms`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ taskSource }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(`Ошибка: ${body.error ?? res.status}`);
          return;
        }
        const { id } = (await res.json()) as { id: string };
        sessionStorage.setItem(`rooms.nickname.${id}`, nickname.trim());
        router.push(`/rooms/${id}`);
      } catch (e) {
        setError("Сервер недоступен");
      }
    });
  };

  return (
    <div className="room-box" style={{ maxWidth: 520 }}>
      <div className="room-label">&gt; task source</div>
      <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
        <button
          className="room-btn"
          data-variant={mode === "catalog" ? "primary" : undefined}
          onClick={() => setMode("catalog")}
        >
          ( {mode === "catalog" ? "◉" : " "} ) catalog
        </button>
        <button
          className="room-btn"
          data-variant={mode === "custom" ? "primary" : undefined}
          onClick={() => setMode("custom")}
        >
          ( {mode === "custom" ? "◉" : " "} ) custom
        </button>
      </div>

      <hr className="room-hr" />

      {mode === "catalog" ? (
        <>
          <div className="room-label">&gt; choose task</div>
          <select
            className="room-input"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{ marginTop: 6 }}
          >
            {catalog.map((c) => (
              <option key={`${c.category}/${c.slug}`} value={c.slug}>
                {c.category} / {c.title}
              </option>
            ))}
          </select>
        </>
      ) : (
        <>
          <div className="room-label">&gt; title</div>
          <input
            className="room-input"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            style={{ marginTop: 6 }}
          />
          <div className="room-label" style={{ marginTop: 12 }}>&gt; markdown</div>
          <textarea
            className="room-input"
            rows={8}
            value={customMd}
            onChange={(e) => setCustomMd(e.target.value)}
            style={{ marginTop: 6, resize: "vertical" }}
          />
        </>
      )}

      <hr className="room-hr" />

      <div className="room-label">&gt; your nickname</div>
      <input
        className="room-input"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={20}
        style={{ marginTop: 6 }}
        placeholder="alice"
      />

      {error && (
        <div style={{ color: "var(--room-crimson)", marginTop: 12, fontSize: 12 }}>{error}</div>
      )}

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <button className="room-btn" data-variant="primary" disabled={pending} onClick={submit}>
          [ {pending ? "CREATING…" : "CREATE ROOM"} ]
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 15.3: Create `src/app/rooms/page.tsx`**

```tsx
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { LIVE_CODING_DIR } from "@/shared/config/constants";
import { fileNameToSlug } from "@/shared/lib/content-utils";
import { CreateRoomForm } from "@/features/room-create/ui/create-room-form";

async function loadCatalog() {
  const categories = await fs.readdir(LIVE_CODING_DIR).catch(() => []);
  const all: Array<{ category: string; slug: string; title: string }> = [];
  for (const category of categories) {
    const dir = path.join(LIVE_CODING_DIR, category);
    try {
      const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".mdx"));
      for (const file of files) {
        const raw = await fs.readFile(path.join(dir, file), "utf8");
        const { data } = matter(raw);
        all.push({
          category,
          slug: fileNameToSlug(file),
          title: (data.title as string) ?? fileNameToSlug(file),
        });
      }
    } catch {
      // skip
    }
  }
  return all;
}

export default async function RoomsLandingPage() {
  const catalog = await loadCatalog();
  return (
    <main style={{ padding: "48px 24px", maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 2 }}>
      <pre style={{ color: "var(--room-phosphor)", margin: 0 }}>
{`╔══════════════════════════╗
║    ROOMS // live-coding   ║
╚══════════════════════════╝`}
      </pre>
      <p className="room-label" style={{ marginTop: 16 }}>
        pair-practice interview problems with up to 4 friends
      </p>
      <div style={{ marginTop: 32 }}>
        <CreateRoomForm catalog={catalog} />
      </div>
    </main>
  );
}
```

- [ ] **Step 15.4: Smoke-check Next build**

```bash
bun run build:next
```

Expected: build succeeds; new `/rooms` route listed under Route Tree.

---

## Task 16: Features — Sandpack editor wrappers

**Files:**
- Create: `src/features/code-editor/ui/code-editor.tsx`
- Create: `src/features/code-editor/ui/read-only-editor.tsx`

- [ ] **Step 16.1: Implement `src/features/code-editor/ui/code-editor.tsx`**

```tsx
"use client";
import { useEffect } from "react";
import {
  SandpackProvider,
  SandpackCodeEditor,
  SandpackConsole,
  useSandpack,
} from "@codesandbox/sandpack-react";
import type { Language } from "@/shared/contracts";

interface CodeEditorProps {
  value: string;
  language: Language;
  onChange: (value: string) => void;
}

const TEMPLATES: Record<Language, "vanilla-ts" | "react-ts"> = {
  js: "vanilla-ts",
  ts: "vanilla-ts",
  react: "react-ts",
};

const FILES: Record<Language, string> = {
  js: "/index.ts",
  ts: "/index.ts",
  react: "/App.tsx",
};

function ChangeBridge({ onChange, file }: { onChange: (v: string) => void; file: string }) {
  const { sandpack } = useSandpack();
  useEffect(() => {
    const current = sandpack.files[file]?.code ?? "";
    onChange(current);
  }, [sandpack.files, file, onChange]);
  return null;
}

export function CodeEditor({ value, language, onChange }: CodeEditorProps) {
  const template = TEMPLATES[language];
  const file = FILES[language];
  return (
    <SandpackProvider
      template={template}
      theme="dark"
      files={{ [file]: { code: value, active: true } }}
      options={{ recompileMode: "delayed", recompileDelay: 400 }}
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <SandpackCodeEditor showTabs={false} showLineNumbers showInlineErrors closableTabs={false} />
        </div>
        <div style={{ borderTop: "1px dashed var(--room-border)", maxHeight: 120 }}>
          <SandpackConsole />
        </div>
      </div>
      <ChangeBridge onChange={onChange} file={file} />
    </SandpackProvider>
  );
}
```

- [ ] **Step 16.2: Implement `src/features/code-editor/ui/read-only-editor.tsx`**

```tsx
"use client";
import {
  SandpackProvider,
  SandpackCodeEditor,
} from "@codesandbox/sandpack-react";
import type { Language } from "@/shared/contracts";

interface ReadOnlyEditorProps {
  value: string;
  language: Language;
}

const TEMPLATES: Record<Language, "vanilla-ts" | "react-ts"> = {
  js: "vanilla-ts",
  ts: "vanilla-ts",
  react: "react-ts",
};

const FILES: Record<Language, string> = {
  js: "/index.ts",
  ts: "/index.ts",
  react: "/App.tsx",
};

export function ReadOnlyEditor({ value, language }: ReadOnlyEditorProps) {
  return (
    <SandpackProvider
      template={TEMPLATES[language]}
      theme="dark"
      files={{ [FILES[language]]: { code: value, active: true } }}
    >
      <SandpackCodeEditor
        readOnly
        showTabs={false}
        showLineNumbers
        closableTabs={false}
      />
    </SandpackProvider>
  );
}
```

- [ ] **Step 16.3: Verify TS**

```bash
bunx tsc --noEmit
```

Expected: no errors.

---

## Task 17: Features — toggles and join form

**Files:**
- Create: `src/features/share-code/ui/share-code-toggle.tsx`
- Create: `src/features/ready-toggle/ui/ready-toggle.tsx`
- Create: `src/features/hide-peer-code/ui/peer-panel-collapse.tsx`
- Create: `src/features/room-join/ui/join-room-form.tsx`

- [ ] **Step 17.1: Implement `src/features/share-code/ui/share-code-toggle.tsx`**

```tsx
"use client";
interface Props {
  isSharing: boolean;
  onToggle: () => void;
}

export function ShareCodeToggle({ isSharing, onToggle }: Props) {
  return (
    <button
      className="room-btn"
      data-variant={isSharing ? "primary" : undefined}
      onClick={onToggle}
    >
      [ S {isSharing ? "UNSHARE" : "SHARE"} ]
    </button>
  );
}
```

- [ ] **Step 17.2: Implement `src/features/ready-toggle/ui/ready-toggle.tsx`**

```tsx
"use client";
import type { ParticipantStatus } from "@/shared/contracts";

interface Props {
  status: ParticipantStatus;
  onChange: (next: ParticipantStatus) => void;
}

export function ReadyToggle({ status, onChange }: Props) {
  const ready = status === "ready";
  return (
    <button
      className="room-btn"
      data-variant={ready ? "primary" : undefined}
      onClick={() => onChange(ready ? "thinking" : "ready")}
    >
      [ R {ready ? "UNREADY" : "READY"} ]
    </button>
  );
}
```

- [ ] **Step 17.3: Implement `src/features/hide-peer-code/ui/peer-panel-collapse.tsx`**

```tsx
"use client";
interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export function PeerPanelCollapse({ collapsed, onToggle }: Props) {
  return (
    <button className="room-btn" onClick={onToggle}>
      [ H {collapsed ? "SHOW" : "HIDE"} ]
    </button>
  );
}
```

- [ ] **Step 17.4: Implement `src/features/room-join/ui/join-room-form.tsx`**

```tsx
"use client";
import { useState } from "react";
import { isValidNickname } from "@/entities/room";

interface Props {
  roomId: string;
  onSubmit: (nickname: string) => void;
  participantCount: number;
}

export function JoinRoomForm({ roomId, onSubmit, participantCount }: Props) {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="room-box" style={{ maxWidth: 420 }}>
      <div className="room-label">&gt; room {roomId}</div>
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--room-fg-dim)" }}>
        [{participantCount}/4] players inside
      </div>
      <hr className="room-hr" />
      <div className="room-label">&gt; your nickname</div>
      <input
        className="room-input"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={20}
        style={{ marginTop: 6 }}
      />
      {error && (
        <div style={{ color: "var(--room-crimson)", marginTop: 12, fontSize: 12 }}>{error}</div>
      )}
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <button
          className="room-btn"
          data-variant="primary"
          onClick={() => {
            if (!isValidNickname(nickname)) {
              setError("Никнейм 1–20 символов без < >");
              return;
            }
            onSubmit(nickname.trim());
          }}
        >
          [ JOIN ROOM ]
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 17.5: Verify TS**

```bash
bunx tsc --noEmit
```

Expected: no errors.

---

## Task 18: Widget — `room-view` components

**Files:**
- Create: `src/widgets/room-view/ui/top-bar.tsx`
- Create: `src/widgets/room-view/ui/task-panel.tsx`
- Create: `src/widgets/room-view/ui/my-editor-cell.tsx`
- Create: `src/widgets/room-view/ui/peer-editor-cell.tsx`
- Create: `src/widgets/room-view/ui/empty-slot.tsx`
- Create: `src/widgets/room-view/ui/editors-grid.tsx`
- Create: `src/widgets/room-view/ui/event-log.tsx`
- Create: `src/widgets/room-view/ui/room-errors.tsx`
- Create: `src/widgets/room-view/ui/room-view.tsx`
- Create: `src/widgets/room-view/index.ts`

- [ ] **Step 18.1: `top-bar.tsx`**

```tsx
"use client";
import { useState } from "react";
import type { ParticipantPublic } from "@/shared/contracts";

interface Props {
  roomId: string;
  participants: ParticipantPublic[];
  allReady: boolean;
}

function glyph(p: ParticipantPublic): string {
  if (p.status === "ready") return "✓";
  if (p.hasSharedCode) return "»";
  return "◉";
}

export function TopBar({ roomId, participants, allReady }: Props) {
  const [copied, setCopied] = useState(false);
  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/rooms/${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div
      className="room-box"
      data-boot
      style={{
        display: "flex",
        gap: 16,
        alignItems: "center",
        justifyContent: "space-between",
        borderColor: allReady ? "var(--room-amber)" : undefined,
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <span className="room-label">ROOM #{roomId}</span>
        <span style={{ color: "var(--room-fg-dim)" }}>
          {participants.map((p) => `${glyph(p)}${p.nickname}`).join("  ")}
        </span>
        <span className="room-label">[{participants.length}/4]</span>
        {allReady && (
          <span style={{ color: "var(--room-amber)" }}>
            ▓▓▓ ALL HANDS READY ▓▓▓
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="room-btn" onClick={copyLink}>
          [ ↗ {copied ? "COPIED" : "COPY"} ]
        </button>
        <a className="room-btn" data-variant="danger" href="/rooms">
          [ × EXIT ]
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 18.2: `task-panel.tsx`**

```tsx
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSanitize from "rehype-sanitize";

interface Props {
  title: string;
  markdown: string;
}

export function TaskPanel({ title, markdown }: Props) {
  return (
    <div className="room-box" data-boot style={{ height: "100%", overflow: "auto" }} data-boot-delay="80">
      <div className="room-label">TASK — {title}</div>
      <hr className="room-hr" />
      <div style={{ fontSize: 13, lineHeight: 1.6 }}>
        <MDXRemote
          source={markdown}
          options={{ mdxOptions: { rehypePlugins: [rehypeSanitize] } }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 18.3: `my-editor-cell.tsx`**

```tsx
"use client";
import { CodeEditor } from "@/features/code-editor/ui/code-editor";
import { ShareCodeToggle } from "@/features/share-code/ui/share-code-toggle";
import { ReadyToggle } from "@/features/ready-toggle/ui/ready-toggle";
import type { Language, ParticipantStatus } from "@/shared/contracts";

interface Props {
  nickname: string;
  code: string;
  language: Language;
  status: ParticipantStatus;
  isSharing: boolean;
  onCodeChange: (code: string) => void;
  onShareToggle: () => void;
  onStatusChange: (next: ParticipantStatus) => void;
}

export function MyEditorCell({
  nickname,
  code,
  language,
  status,
  isSharing,
  onCodeChange,
  onShareToggle,
  onStatusChange,
}: Props) {
  const ready = status === "ready";
  return (
    <div
      className={`room-box room-box--active${isSharing ? " room-box--shared" : ""}${ready ? " room-box--ready" : ""}`}
      data-boot
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span className="room-label">
          {nickname} {ready ? "✓" : isSharing ? "»" : "◇"}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <ShareCodeToggle isSharing={isSharing} onToggle={onShareToggle} />
          <ReadyToggle status={status} onChange={onStatusChange} />
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <CodeEditor value={code} language={language} onChange={onCodeChange} />
      </div>
    </div>
  );
}
```

- [ ] **Step 18.4: `peer-editor-cell.tsx`**

```tsx
"use client";
import { ReadOnlyEditor } from "@/features/code-editor/ui/read-only-editor";
import { PeerPanelCollapse } from "@/features/hide-peer-code/ui/peer-panel-collapse";
import type { Language, ParticipantPublic } from "@/shared/contracts";

interface Props {
  participant: ParticipantPublic;
  sharedCode?: { code: string; language: Language };
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function PeerEditorCell({ participant, sharedCode, collapsed, onToggleCollapsed }: Props) {
  const ready = participant.status === "ready";
  return (
    <div
      className={`room-box${sharedCode ? " room-box--shared" : ""}${ready ? " room-box--ready" : ""}`}
      data-boot
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span className="room-label">
          {participant.nickname} {ready ? "✓" : sharedCode ? "»" : "◇"}
        </span>
        {sharedCode && (
          <PeerPanelCollapse collapsed={collapsed} onToggle={onToggleCollapsed} />
        )}
      </div>
      {collapsed || !sharedCode ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--room-fg-dim)",
            textAlign: "center",
            fontSize: 12,
          }}
        >
          {sharedCode ? "░░░  HIDDEN (press H to show)  ░░░" : "private / waiting for share"}
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0 }}>
          <ReadOnlyEditor value={sharedCode.code} language={sharedCode.language} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 18.5: `empty-slot.tsx`**

```tsx
"use client";
import { useState } from "react";

export function EmptySlot({ roomId }: { roomId: string }) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/rooms/${roomId}` : "";
  return (
    <div className="room-box" data-boot style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 8 }}>
      <div style={{ color: "var(--room-fg-dim)", letterSpacing: "0.12em" }}>░░░░░░░░░░</div>
      <div className="room-label">WAITING FOR PLAYER</div>
      <div style={{ fontSize: 11, color: "var(--room-fg-dim)", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
        {link || `/rooms/${roomId}`}
      </div>
      <button
        className="room-btn"
        onClick={() => {
          navigator.clipboard.writeText(link);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
      >
        [ ↗ {copied ? "COPIED" : "COPY LINK"} ]
      </button>
    </div>
  );
}
```

- [ ] **Step 18.6: `editors-grid.tsx`**

```tsx
"use client";
import type { ReactNode } from "react";

export function EditorsGrid({ children }: { children: ReactNode[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gridTemplateRows: "repeat(2, 1fr)",
        gap: 12,
        height: "100%",
        minHeight: 0,
      }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 18.7: `event-log.tsx`**

```tsx
"use client";
import { useState } from "react";

export interface LogEntry {
  at: number;
  text: string;
}

interface Props {
  entries: LogEntry[];
}

function fmt(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function EventLog({ entries }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="room-box" data-boot style={{ padding: "4px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="room-label">LOG</span>
        <button className="room-btn" onClick={() => setCollapsed((c) => !c)}>
          [ {collapsed ? "+" : "−"} ]
        </button>
      </div>
      {!collapsed && (
        <div style={{ maxHeight: 100, overflow: "auto", fontSize: 11, marginTop: 4 }}>
          {entries.slice(-50).map((e, i) => (
            <div key={i}>
              <span style={{ color: "var(--room-fg-dim)" }}>{fmt(e.at)}</span>{"  "}
              {e.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 18.8: `room-errors.tsx`**

```tsx
"use client";
import type { ConnectionStatus } from "@/shared/lib/use-room-socket";

interface Props {
  status: ConnectionStatus;
  error: string | null;
}

export function RoomErrors({ status, error }: Props) {
  if (status === "joined" && !error) return null;
  if (status === "disconnected") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "repeating-linear-gradient(45deg, rgba(0,0,0,0.7) 0 6px, rgba(0,0,0,0.82) 6px 12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
        }}
      >
        <div className="room-box" style={{ borderColor: "var(--room-crimson)" }}>
          <div style={{ color: "var(--room-crimson)", fontSize: 18 }}>× CONNECTION LOST</div>
          <div className="room-label" style={{ marginTop: 8 }}>reconnecting…</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--room-fg-dim)" }}>
            your code is safe locally.
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          padding: "8px 14px",
          border: "1px solid var(--room-crimson)",
          color: "var(--room-crimson)",
          zIndex: 60,
        }}
      >
        × {error}
      </div>
    );
  }
  return null;
}
```

- [ ] **Step 18.9: `room-view.tsx`**

```tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "zustand";
import { roomStore } from "@/shared/lib/room-store";
import { useRoomSocket } from "@/shared/lib/use-room-socket";
import type { ParticipantPublic, TaskContent } from "@/shared/contracts";
import { TopBar } from "./top-bar";
import { TaskPanel } from "./task-panel";
import { EditorsGrid } from "./editors-grid";
import { MyEditorCell } from "./my-editor-cell";
import { PeerEditorCell } from "./peer-editor-cell";
import { EmptySlot } from "./empty-slot";
import { EventLog, type LogEntry } from "./event-log";
import { RoomErrors } from "./room-errors";

interface Props {
  roomId: string;
  nickname: string;
  task: TaskContent;
}

export function RoomView({ roomId, nickname, task }: Props) {
  const state = useStore(roomStore);
  const { status, error, emitCodeUpdate, emitShare, emitUnshare, emitStatus } =
    useRoomSocket(roomId, nickname);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    setLogs((l) => [...l, { at: Date.now(), text: `you joined as ${nickname}` }]);
  }, [nickname]);

  const others = useMemo<ParticipantPublic[]>(
    () => Array.from(state.participants.values()).filter((p) => p.id !== state.selfId),
    [state.participants, state.selfId]
  );

  const me = state.selfId ? state.participants.get(state.selfId) : undefined;

  const slots: Array<ParticipantPublic | null> = [];
  if (me) slots.push(me);
  others.forEach((p) => slots.push(p));
  while (slots.length < 4) slots.push(null);

  const allReady = state.allReady();

  return (
    <main
      className="rooms-scope"
      data-all-ready={allReady ? "true" : undefined}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        gap: 8,
        padding: 8,
        position: "relative",
        zIndex: 2,
      }}
    >
      <TopBar roomId={roomId} participants={Array.from(state.participants.values())} allReady={allReady} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(320px, 38%) 1fr",
          gap: 12,
          flex: 1,
          minHeight: 0,
        }}
      >
        <TaskPanel title={task.title} markdown={task.markdown} />
        <EditorsGrid>
          {slots.map((p, i) => {
            if (p && p.id === state.selfId) {
              return (
                <MyEditorCell
                  key="me"
                  nickname={p.nickname}
                  code={state.myCode}
                  language={state.myLanguage}
                  status={state.myStatus}
                  isSharing={state.isSharing}
                  onCodeChange={(code) => {
                    roomStore.getState().setMyCode(code);
                    emitCodeUpdate(code, state.myLanguage);
                  }}
                  onShareToggle={() => {
                    if (state.isSharing) emitUnshare();
                    else emitShare();
                  }}
                  onStatusChange={emitStatus}
                />
              );
            }
            if (p) {
              return (
                <PeerEditorCell
                  key={p.id}
                  participant={p}
                  sharedCode={state.sharedCodes.get(p.id)}
                  collapsed={state.collapsedPeers.has(p.id)}
                  onToggleCollapsed={() => roomStore.getState().togglePeerCollapsed(p.id)}
                />
              );
            }
            return <EmptySlot key={`slot-${i}`} roomId={roomId} />;
          })}
        </EditorsGrid>
      </div>
      <EventLog entries={logs} />
      <RoomErrors status={status} error={error} />
    </main>
  );
}
```

- [ ] **Step 18.10: `src/widgets/room-view/index.ts`**

```ts
export { RoomView } from "./ui/room-view";
```

- [ ] **Step 18.11: Verify TS**

```bash
bunx tsc --noEmit
```

Expected: no errors. If Zustand's `useStore` complains, ensure `zustand` version is 5 (already in deps).

---

## Task 19: App route `/rooms/[id]`

**Files:**
- Create: `src/app/rooms/[id]/page.tsx`
- Create: `src/app/rooms/[id]/room-client.tsx`

- [ ] **Step 19.1: `src/app/rooms/[id]/room-client.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoomView } from "@/widgets/room-view";
import { JoinRoomForm } from "@/features/room-join/ui/join-room-form";
import type { TaskContent } from "@/shared/contracts";

interface Props {
  roomId: string;
  task: TaskContent;
  initialParticipantCount: number;
}

export function RoomClient({ roomId, task, initialParticipantCount }: Props) {
  const router = useRouter();
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem(`rooms.nickname.${roomId}`);
    if (saved) setNickname(saved);
  }, [roomId]);

  if (!nickname) {
    return (
      <main style={{ padding: "48px 24px", position: "relative", zIndex: 2, display: "flex", justifyContent: "center" }}>
        <JoinRoomForm
          roomId={roomId}
          participantCount={initialParticipantCount}
          onSubmit={(nick) => {
            sessionStorage.setItem(`rooms.nickname.${roomId}`, nick);
            setNickname(nick);
          }}
        />
      </main>
    );
  }

  return <RoomView roomId={roomId} nickname={nickname} task={task} />;
}
```

- [ ] **Step 19.2: `src/app/rooms/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { RoomClient } from "./room-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function probeRoom(id: string) {
  const url = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${url}/rooms/${id}`, { cache: "no-store" });
    if (res.status === 404) return { exists: false as const };
    if (!res.ok) return null;
    return (await res.json()) as { exists: true; participantCount: number; maxParticipants: number };
  } catch {
    return null;
  }
}

export default async function RoomIdPage({ params }: PageProps) {
  const { id } = await params;
  const probe = await probeRoom(id);
  if (!probe) {
    return (
      <main style={{ padding: 48, color: "var(--room-crimson)", position: "relative", zIndex: 2 }}>
        × server unreachable
      </main>
    );
  }
  if (!probe.exists) {
    notFound();
  }

  const task = { title: id, markdown: "_Loading task from ws-server…_" };

  return (
    <RoomClient
      roomId={id}
      task={task}
      initialParticipantCount={probe.participantCount}
    />
  );
}

export const dynamic = "force-dynamic";
```

Note: the actual task markdown is loaded by the ws-server at join time (included in the `room:join` ack via `task` field). The server-component placeholder is only shown between SSR and WS connection (~100ms).

- [ ] **Step 19.3: Update `RoomView` to display ack-provided task**

Edit `src/widgets/room-view/ui/room-view.tsx` — change the task prop to come from a state source. Add to `room-store.ts`:

In `RoomStoreState` add:
```ts
task: TaskContent | null;
setTask(task: TaskContent): void;
```

In `initial()` add `task: null`.
Add action:
```ts
setTask(task) { set({ task }); },
```

In `use-room-socket.ts`, inside the `room:join` ack handler, after `hydrateFromSnapshot`, add:
```ts
roomStore.getState().setTask(ack.task);
```

In `RoomView`, replace `task={task}` in `TaskPanel` with:
```tsx
<TaskPanel
  title={state.task?.title ?? task.title}
  markdown={state.task?.markdown ?? task.markdown}
/>
```

- [ ] **Step 19.4: Run full test suite**

```bash
bun run test
```

Expected: all tests pass.

- [ ] **Step 19.5: Run `bun run build`**

```bash
bun run build
```

Expected: Next build succeeds AND `tsc -p tsconfig.server.json` succeeds.

---

## Task 20: Dockerfile + env

**Files:**
- Modify: `Dockerfile`
- Create: `.env.example`

- [ ] **Step 20.1: Replace `Dockerfile` with:**

```dockerfile
FROM oven/bun:1-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# --- Build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build:next
RUN bunx tsc -p tsconfig.server.json

# --- Runner ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV WS_PORT=3001
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/content ./content
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/dist-server ./dist-server

# ws-server runtime deps (standalone tracing doesn't see src-server/)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/fastify ./node_modules/fastify
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@fastify ./node_modules/@fastify
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/socket.io ./node_modules/socket.io
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/engine.io ./node_modules/engine.io
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/socket.io-adapter ./node_modules/socket.io-adapter
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/socket.io-parser ./node_modules/socket.io-parser
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/engine.io-parser ./node_modules/engine.io-parser
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/ws ./node_modules/ws
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/nanoid ./node_modules/nanoid
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pino ./node_modules/pino
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pino-std-serializers ./node_modules/pino-std-serializers
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/gray-matter ./node_modules/gray-matter
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/concurrently ./node_modules/concurrently

USER nextjs
EXPOSE 3000 3001

CMD ["node", "node_modules/concurrently/dist/bin/concurrently.js", "--kill-others-on-fail", \
     "node server.js", \
     "node dist-server/src-server/ws-server.js"]
```

Note: if `docker build` fails due to a missing transitive dep, add another `COPY` line for it. This list is a starting point captured during pre-flight — refine during the first real build in Step 20.3.

- [ ] **Step 20.2: Create `.env.example`**

```env
# Ports
PORT=3000
WS_PORT=3001

# Public URL of the ws-server (used by browser clients)
NEXT_PUBLIC_WS_URL=http://localhost:3001

# Room limits
MAX_ROOMS=500
ROOM_TTL_MS=600000
CLEANUP_INTERVAL_MS=60000
MAX_CODE_BYTES=51200

# Rate-limit (per IP)
MAX_ROOMS_PER_IP_PER_MIN=5
RATE_LIMIT_WINDOW_MS=60000

# CORS origin for ws-server (set to your site origin in prod)
CORS_ORIGIN=*

LOG_LEVEL=info
```

- [ ] **Step 20.3: Build Docker image locally**

```bash
docker build -t rip-rooms:test .
```

Expected: build succeeds. If a `Cannot find module 'xxx'` appears when testing in Step 20.4, add the corresponding `COPY` line in the Dockerfile and retry.

- [ ] **Step 20.4: Run image and hit both ports**

```bash
docker run --rm -d -p 3000:3000 -p 3001:3001 --name rip-test rip-rooms:test
sleep 3
curl -s http://127.0.0.1:3000 | head -5
curl -s http://127.0.0.1:3001/rooms/missing
docker logs rip-test | tail -20
docker stop rip-test
```

Expected: port 3000 returns HTML; port 3001 returns `{"exists":false}`.

- [ ] **Step 20.5: Update `.github/workflows/deploy.yml`**

Based on Step 1.3 findings, add publication of port 3001 (or `PROD_WS_PORT`) alongside existing 3000 publication. Update container memory limit if Step 1.4 requires it. Ensure `NEXT_PUBLIC_WS_URL` is set at build time (it's baked into the bundle — set it to the public origin of the ws-server).

---

## Task 21: Manual smoke test

**Files:** *(no code)*

- [ ] **Step 21.1: Local smoke — two browser tabs**

```bash
bun run dev
```

Then:

1. Open `http://localhost:3000/rooms` in tab A → create a room with the catalog task "debounce" + nickname "alice" → get redirected to `/rooms/<id>`
2. Copy link from top bar, open in tab B → join as "bob"
3. Tab A: type in editor → verify code is NOT visible in tab B
4. Tab A: click `[S SHARE]` → verify tab B shows alice's code in her cell
5. Tab A: continue typing → verify tab B updates within ~500ms
6. Tab A: click `[S UNSHARE]` → verify tab B shows "private / waiting for share"
7. Tab B: click `[R READY]` → verify alice sees bob status change
8. Both click READY → verify amber "ALL HANDS READY" sweep appears
9. Tab B: close tab → verify alice sees bob leave within ~25s
10. Tab A: reload page → verify nickname + code persists from sessionStorage, rejoins same room

- [ ] **Step 21.2: Sandpack run check**

In tab A, write a function, press Sandpack's run button, verify output in the cell's console panel.

- [ ] **Step 21.3: Error state check**

Stop the ws-server (kill `dev:ws` process). Verify the connection-lost overlay appears with crimson text.

- [ ] **Step 21.4: Write findings**

If any manual test fails, record the failure in a new section at the bottom of this plan file under `## Manual test failures`, and create a follow-up subtask. Do NOT proceed to Task 22 with failing manual tests.

---

## Task 22: Final simplification + single commit

**Files:** *(all modified so far)*

- [ ] **Step 22.1: Run full test suite one last time**

```bash
bun run test && bun run lint && bun run build
```

Expected: all green.

- [ ] **Step 22.2: Invoke `/simplify` (first pass)**

Ask the /simplify skill to pass over all new files: `src-server/`, `src/shared/contracts/`, `src/shared/lib/ws-client.ts`, `src/shared/lib/use-room-socket.ts`, `src/shared/lib/room-store.ts`, `src/entities/room/`, `src/features/`, `src/widgets/room-view/`, `src/app/rooms/`.

Expected: remove dead code, collapse duplication, tighten types.

- [ ] **Step 22.3: Run tests again after first /simplify**

```bash
bun run test && bun run lint && bun run build
```

Expected: still green. Fix any regression inline before the next step.

- [ ] **Step 22.4: Invoke `/simplify` (second pass)**

Run `/simplify` a second time over the same scope. The second pass typically catches refinements the first missed after the code settled.

- [ ] **Step 22.5: Final green run**

```bash
bun run test && bun run lint && bun run build
```

Expected: all green.

- [ ] **Step 22.6: Single commit with all changes**

```bash
git add -A
git status
```

Review the staged files and ensure no secrets, lock-file explosions, or unrelated edits are included. Then:

```bash
git commit -m "$(cat <<'EOF'
feat: collaborative rooms for live-coding practice

Add ephemeral 4-person rooms where participants solve interview
tasks in parallel Sandpack editors with opt-in code sharing,
readiness status, and local peer-panel hiding.

- Fastify + Socket.IO ws-server on :3001 (new src-server/)
- Shared contracts in src/shared/contracts/
- Zustand room-store + socket hook
- Terminal/CRT aesthetic scoped to /rooms/* via rooms.css
- Two-process Dockerfile with concurrently

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 22.7: Verify commit**

```bash
git log --oneline -3
git status
```

Expected: new commit at HEAD; working tree clean.

---

## Self-review notes

- **Spec coverage:** Every numbered section of the design spec is covered — architecture (Tasks 2, 3, 20), data model (Task 4), state ops (Task 7), HTTP (Task 8), WS (Task 9), entry (Task 10), frontend FSD (Tasks 11–19), data flows (covered by Tasks 9 + 13 + 19), error handling (Tasks 9, 13, 18), testing (Tasks 5, 7, 8, 9, 11, 12), deployment (Task 20), visual design (Task 14).
- **No hidden placeholders:** every step has either actual code or an exact shell command with expected output. The one "refine during first build" note in Task 20.1 is explicitly scoped to adding missing runtime deps and is caught by Steps 20.3–20.4.
- **Type consistency:** `JoinAckOk` includes `task`, `selfId`, `snapshot`, `sharedCodes`; `use-room-socket.ts` consumes all four. `RoomStoreState.task` is added in Step 19.3 (the type system will flag any downstream miss). `Participant.language` defaults to `"ts"` in `joinRoom`, which matches client default.
- **Rate-limit window:** Task 8 passes `"1 minute"` string (Fastify rate-limit format); Task 10 converts `config.rateLimitTimeWindowMs` to a `"NNN ms"` string, also acceptable to the plugin.
- **`concurrently` binary path:** Task 20.1 uses `node node_modules/concurrently/dist/bin/concurrently.js` rather than `npx concurrently` because the standalone runner image has no `npm`/`npx` binary.

---

## Execution notes for the implementor

- Work straight through Tasks 1–22 **without committing or doing code review between tasks** — the user explicitly requested this. The only commit is in Task 22.6, after two `/simplify` passes.
- Keep a scratch log of unexpected decisions (e.g. library quirks). Fold them into the final commit message or a follow-up doc if needed.
- If a test fails unexpectedly, stop and diagnose — do not comment tests out to get green.
- Task 10.2 currently launches the ws-server using `fastify.server` as the HTTP server handed to Socket.IO. If `fastify.server` is undefined at the moment of `createServer(fastify.server)` — this is a Fastify ≤ 4 gotcha; Fastify 5 exposes it after `await fastify.ready()`. If you see a null server error at boot, replace that pattern with `const io = new IOServer(fastify.server)` called AFTER `await fastify.ready()` (the `await fastify.ready()` call is already in the plan).
