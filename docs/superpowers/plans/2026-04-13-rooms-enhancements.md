# Rooms Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship three independent rooms enhancements: a collapsible global Sidebar (auto-collapsed on room entry), a dynamic editor grid that matches the number of real participants, and WebSocket-synchronized console output with an explicit Run button so every participant sees the author's output.

**Architecture:** FSD-lite. New state flags in `shared/lib/ui-store.ts` (Sidebar) and `shared/lib/room-store.ts` (peer console buffers). Two new WS events (`console:output`, `console:clear`) relayed by the in-repo `src-server/ws.ts`. Code runner switches from Sandpack's auto-recompile to `autorun: false` + built-in Run button, with `SandpackConsole standalone` for authors and a plain `<PeerConsoleView>` log list for peers (peers never execute code locally).

**Tech Stack:** Next.js 16 (App Router), React 19, Zustand (persist + vanilla), socket.io, `@codesandbox/sandpack-react`, Vitest (node env, unit-only), Tailwind + shadcn.

**Spec reference:** `docs/superpowers/specs/2026-04-13-rooms-enhancements-design.md`.

**Workflow note:** Per project feedback, **do not commit between tasks** and **do not run code review mid-flow**. Run `/simplify` once at the very end, then make a single commit as Task Z.

---

## File Structure

### Created files

| Path | Responsibility |
|---|---|
| `src/shared/contracts/console.ts` | `ConsoleMessage`, `ConsoleMethod`, event payload types |
| `src/shared/lib/use-auto-collapse-on-route-enter.ts` | Hook + pure helper `shouldAutoCollapse(roomId, storage)` |
| `src/features/code-editor/lib/serialize-console-arg.ts` | Pure helper, testable |
| `src/features/code-editor/ui/use-sandpack-console-sync.ts` | Sandpack listen → throttle → callbacks |
| `src/features/code-editor/ui/output-panel.tsx` | Tabbed Console / Preview pane for author |
| `src/features/code-editor/ui/peer-console-view.tsx` | Plain log list populated from room-store |
| `src/widgets/room-view/lib/grid-class-for-count.ts` | Pure helper mapping count → Tailwind grid class |
| `tests/shared/lib/ui-store.test.ts` | `toggleSidebar`, `setSidebarCollapsed`, `partialize` |
| `tests/shared/lib/auto-collapse-sentinel.test.ts` | `shouldAutoCollapse()` cases |
| `tests/shared/lib/room-store-peer-console.test.ts` | peer-console append/clear/remove + FIFO cap |
| `tests/features/code-editor/serialize-console-arg.test.ts` | serialization edge cases |
| `tests/widgets/room-view/grid-class-for-count.test.ts` | 1..4 + defensive |

### Modified files

| Path | What changes |
|---|---|
| `src/shared/contracts/index.ts` | Re-export `./console` |
| `src/shared/contracts/events.ts` | Add 2 client → server + 2 server → client event signatures |
| `src/shared/lib/ui-store.ts` | Add `sidebarCollapsed`, actions, persist |
| `src/shared/lib/room-store.ts` | Add `peerConsoles` Map + actions; clear on left/unshare |
| `src/shared/lib/use-room-socket.ts` | Subscribe + emit helpers (gated by `isSharing`) |
| `src/features/code-editor/lib/sandpack-config.ts` | `{ autorun: false, autoReload: false }` |
| `src/features/code-editor/ui/code-editor.tsx` | `showRunButton`, `<OutputPanel>`, mount sync hook |
| `src/widgets/sidebar/ui/sidebar.tsx` | Collapsed-mode branch (width + rail content) |
| `src/widgets/room-view/ui/editors-grid.tsx` | Accept `count`, apply grid class |
| `src/widgets/room-view/ui/room-view.tsx` | Filter real participants, drop empty padding |
| `src/widgets/room-view/ui/my-editor-cell.tsx` | Pass console callbacks down |
| `src/widgets/room-view/ui/peer-editor-cell.tsx` | Render `<PeerConsoleView>` under `ReadOnlyEditor` |
| `src/widgets/room-view/ui/top-bar.tsx` | `<SidebarToggleButton>` |
| `src/app/rooms/[id]/room-client.tsx` | Mount `useAutoCollapseOnRouteEnter(roomId)` |
| `src-server/ws.ts` | Relay `console:output` / `console:clear` |
| `tests/server/ws.integration.test.ts` | Integration coverage for new events |

### Deleted files

| Path | Reason |
|---|---|
| `src/widgets/room-view/ui/empty-slot.tsx` | Replaced by dynamic grid; invite CTA already lives in `top-bar.tsx` via `useCopyRoomLink` |

---

## Phase A — Sidebar collapse

### Task A1: Add `sidebarCollapsed` state to `ui-store`

**Files:**
- Modify: `src/shared/lib/ui-store.ts`
- Create: `tests/shared/lib/ui-store.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/shared/lib/ui-store.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../../../src/shared/lib/ui-store";

describe("ui-store sidebar", () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarCollapsed: false });
  });

  it("defaults to expanded", () => {
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it("toggleSidebar flips the flag", () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it("setSidebarCollapsed forces a value", () => {
    useUIStore.getState().setSidebarCollapsed(true);
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    useUIStore.getState().setSidebarCollapsed(true);
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bunx vitest run tests/shared/lib/ui-store.test.ts
```

Expected: FAIL — `sidebarCollapsed` / `toggleSidebar` / `setSidebarCollapsed` do not exist on the store.

- [ ] **Step 3: Extend the store**

Edit `src/shared/lib/ui-store.ts`. Inside the `UIState` interface, append:

```ts
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (value: boolean) => void;
```

Inside the `create` body (after `toggleAllAnswersRevealed`), add:

```ts
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (value) => set(() => ({ sidebarCollapsed: value })),
```

Update the `partialize` config to persist the flag:

```ts
      partialize: (state) => ({
        collapsedCategories: state.collapsedCategories,
        allAnswersRevealed: state.allAnswersRevealed,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bunx vitest run tests/shared/lib/ui-store.test.ts
```

Expected: PASS (3 cases).

---

### Task A2: `shouldAutoCollapse` pure helper + hook

**Files:**
- Create: `src/shared/lib/use-auto-collapse-on-route-enter.ts`
- Create: `tests/shared/lib/auto-collapse-sentinel.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/shared/lib/auto-collapse-sentinel.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { shouldAutoCollapse } from "../../../src/shared/lib/use-auto-collapse-on-route-enter";

function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => { map.set(k, v); },
    removeItem: (k) => { map.delete(k); },
    clear: () => map.clear(),
    key: (i) => Array.from(map.keys())[i] ?? null,
    get length() { return map.size; },
  };
}

describe("shouldAutoCollapse", () => {
  it("returns true and sets sentinel on first call for a room", () => {
    const storage = fakeStorage();
    expect(shouldAutoCollapse("r1", storage)).toBe(true);
    expect(storage.getItem("rooms-auto-collapsed:r1")).toBe("1");
  });

  it("returns false on subsequent calls for the same room", () => {
    const storage = fakeStorage();
    shouldAutoCollapse("r1", storage);
    expect(shouldAutoCollapse("r1", storage)).toBe(false);
  });

  it("tracks different rooms independently", () => {
    const storage = fakeStorage();
    shouldAutoCollapse("r1", storage);
    expect(shouldAutoCollapse("r2", storage)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bunx vitest run tests/shared/lib/auto-collapse-sentinel.test.ts
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Create the helper + hook**

Create `src/shared/lib/use-auto-collapse-on-route-enter.ts`:

```ts
"use client";
import { useEffect } from "react";
import { useUIStore } from "./ui-store";

const SENTINEL_KEY = (roomId: string) => `rooms-auto-collapsed:${roomId}`;

export function shouldAutoCollapse(roomId: string, storage: Storage): boolean {
  const key = SENTINEL_KEY(roomId);
  if (storage.getItem(key)) return false;
  storage.setItem(key, "1");
  return true;
}

export function useAutoCollapseOnRouteEnter(roomId: string): void {
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (shouldAutoCollapse(roomId, window.sessionStorage)) {
      setSidebarCollapsed(true);
    }
  }, [roomId, setSidebarCollapsed]);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bunx vitest run tests/shared/lib/auto-collapse-sentinel.test.ts
```

Expected: PASS (3 cases).

---

### Task A3: Sidebar collapsed-mode branch

**Files:**
- Modify: `src/widgets/sidebar/ui/sidebar.tsx`

- [ ] **Step 1: Rewrite `sidebar.tsx` with collapsed branch**

Replace the entire file contents with:

```tsx
"use client";

import { useMemo, useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Button } from "@/shared/ui/button";
import { useUIStore, useHydrated } from "@/shared/lib/ui-store";
import {
  SidebarNav,
  SidebarSearch,
  CollapseAllButton,
  ToggleAllAnswersButton,
  RoomsCta,
  buildAllCategorySlugs,
} from "./sidebar-nav";
import type { CategoryMeta } from "@/entities/category";
import type { QuestionMeta } from "@/entities/question";
import type { ChallengeCategoryMeta, ChallengeMeta } from "@/entities/challenge";

interface SidebarProps {
  categories: CategoryMeta[];
  questionsByCategory: Record<string, QuestionMeta[]>;
  challengeCategories: ChallengeCategoryMeta[];
  challengesByCategory: Record<string, ChallengeMeta[]>;
}

export function Sidebar({
  categories,
  questionsByCategory,
  challengeCategories,
  challengesByCategory,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const hydrated = useHydrated();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const slugs = useMemo(
    () => buildAllCategorySlugs(categories, challengeCategories),
    [categories, challengeCategories]
  );

  const isCollapsed = hydrated && collapsed;

  if (isCollapsed) {
    return (
      <aside className="sticky top-0 h-screen hidden w-14 shrink-0 border-r border-border md:flex md:flex-col md:items-center md:py-4 md:gap-3">
        <div className="text-xs font-bold tracking-tight">RI</div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={toggleSidebar}
          aria-label="Развернуть боковую панель"
        >
          <PanelLeftOpen />
        </Button>
      </aside>
    );
  }

  return (
    <aside className="sticky top-0 h-screen hidden w-[320px] shrink-0 border-r border-border md:block">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-lg font-bold">React Interview</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Подготовка к собеседованию
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ToggleAllAnswersButton />
          <CollapseAllButton slugs={slugs} />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={toggleSidebar}
            aria-label="Свернуть боковую панель"
          >
            <PanelLeftClose />
          </Button>
        </div>
      </div>
      <SidebarSearch value={searchQuery} onChange={setSearchQuery} />
      <RoomsCta />
      <ScrollArea className="h-[calc(100vh-73px-52px-57px)]">
        <SidebarNav
          categories={categories}
          questionsByCategory={questionsByCategory}
          challengeCategories={challengeCategories}
          challengesByCategory={challengesByCategory}
          searchQuery={searchQuery}
        />
      </ScrollArea>
    </aside>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
bun run lint
```

Expected: PASS, no type errors in `sidebar.tsx`.

---

### Task A4: Sidebar toggle button in room top-bar

**Files:**
- Modify: `src/widgets/room-view/ui/top-bar.tsx`

- [ ] **Step 1: Add the toggle button**

Edit `src/widgets/room-view/ui/top-bar.tsx`. Replace the imports block (lines 1-9) with:

```tsx
"use client";
import Link from "next/link";
import { Check, Circle, CircleDashed, Copy, LogOut, PanelLeftClose, PanelLeftOpen, Share2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ParticipantPublic } from "@/shared/contracts";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { useCopyRoomLink } from "../lib/use-copy-room-link";
import { useUIStore } from "@/shared/lib/ui-store";
```

Inside `TopBar`, just after `const { copied, copy } = useCopyRoomLink(roomId);`, add:

```tsx
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const SidebarIcon = sidebarCollapsed ? PanelLeftOpen : PanelLeftClose;
```

In the right-side button cluster (currently `<Copy>…</Copy>` + `<LogOut>…</LogOut>`), prepend the new button. The final cluster becomes:

```tsx
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Развернуть боковую панель" : "Свернуть боковую панель"}
        >
          <SidebarIcon />
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={copy}>
          <Copy />
          {copied ? "Скопировано" : "Скопировать"}
        </Button>
        <Button size="sm" variant="destructive" render={<Link href="/rooms" />}>
          <LogOut />
          Выйти
        </Button>
      </div>
```

- [ ] **Step 2: Verify typecheck**

```bash
bun run lint
```

Expected: PASS.

---

### Task A5: Mount `useAutoCollapseOnRouteEnter` in room client

**Files:**
- Modify: `src/app/rooms/[id]/room-client.tsx`

- [ ] **Step 1: Mount the hook**

Edit `src/app/rooms/[id]/room-client.tsx`. Add import at top:

```tsx
import { useAutoCollapseOnRouteEnter } from "@/shared/lib/use-auto-collapse-on-route-enter";
```

Inside `RoomClient`, immediately after the `useState` and `useSyncExternalStore` calls (i.e. before the `if (stored === undefined)` branch), add:

```tsx
  useAutoCollapseOnRouteEnter(roomId);
```

- [ ] **Step 2: Verify typecheck**

```bash
bun run lint
```

Expected: PASS.

---

## Phase B — Dynamic editor grid

### Task B1: `gridClassForCount` helper + tests

**Files:**
- Create: `src/widgets/room-view/lib/grid-class-for-count.ts`
- Create: `tests/widgets/room-view/grid-class-for-count.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/widgets/room-view/grid-class-for-count.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { gridClassForCount } from "../../../src/widgets/room-view/lib/grid-class-for-count";

describe("gridClassForCount", () => {
  it("1 → single cell", () => {
    expect(gridClassForCount(1)).toContain("grid-cols-1");
    expect(gridClassForCount(1)).toContain("grid-rows-1");
  });

  it("2 → two columns one row", () => {
    expect(gridClassForCount(2)).toContain("grid-cols-2");
    expect(gridClassForCount(2)).toContain("grid-rows-1");
  });

  it("3 → first cell spans two columns", () => {
    const cls = gridClassForCount(3);
    expect(cls).toContain("grid-cols-2");
    expect(cls).toContain("grid-rows-2");
    expect(cls).toContain("col-span-2");
  });

  it("4 → 2x2", () => {
    expect(gridClassForCount(4)).toContain("grid-cols-2");
    expect(gridClassForCount(4)).toContain("grid-rows-2");
    expect(gridClassForCount(4)).not.toContain("col-span-2");
  });

  it("0 / negative → falls back to grid-cols-1", () => {
    expect(gridClassForCount(0)).toContain("grid-cols-1");
    expect(gridClassForCount(-1)).toContain("grid-cols-1");
  });

  it("> 4 → clamps to 4-cell layout", () => {
    expect(gridClassForCount(5)).toBe(gridClassForCount(4));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bunx vitest run tests/widgets/room-view/grid-class-for-count.test.ts
```

Expected: FAIL — module missing.

- [ ] **Step 3: Implement the helper**

Create `src/widgets/room-view/lib/grid-class-for-count.ts`:

```ts
const BASE = "grid h-full min-h-0 gap-3";

export function gridClassForCount(count: number): string {
  if (count <= 1) return `${BASE} grid-cols-1 grid-rows-1`;
  if (count === 2) return `${BASE} grid-cols-2 grid-rows-1`;
  if (count === 3) return `${BASE} grid-cols-2 grid-rows-2 [&>*:first-child]:col-span-2`;
  return `${BASE} grid-cols-2 grid-rows-2`;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bunx vitest run tests/widgets/room-view/grid-class-for-count.test.ts
```

Expected: PASS (6 cases).

---

### Task B2: `EditorsGrid` accepts `count`

**Files:**
- Modify: `src/widgets/room-view/ui/editors-grid.tsx`

- [ ] **Step 1: Rewrite the component**

Replace the entire file contents with:

```tsx
"use client";
import type { ReactNode } from "react";
import { gridClassForCount } from "../lib/grid-class-for-count";

interface Props {
  count: number;
  children: ReactNode[];
}

export function EditorsGrid({ count, children }: Props) {
  return <div className={gridClassForCount(count)}>{children}</div>;
}
```

- [ ] **Step 2: Verify typecheck (will still fail in room-view.tsx; that's next task)**

```bash
bun run lint
```

Expected: FAIL in `room-view.tsx` with `Property 'count' is missing` — expected, fixed in B3.

---

### Task B3: `RoomView` — real participants only

**Files:**
- Modify: `src/widgets/room-view/ui/room-view.tsx`

- [ ] **Step 1: Replace the slot computation and grid render**

Edit `src/widgets/room-view/ui/room-view.tsx`. Remove the `EmptySlot` import and replace the `useMemo` block + the `<EditorsGrid>` JSX.

Delete the import line:

```tsx
import { EmptySlot } from "./empty-slot";
```

Also delete the now-unused import of `MAX_PARTICIPANTS` from `@/shared/contracts` if it's only used by the padding (keep the other types):

```tsx
import { type ParticipantPublic, type TaskContent } from "@/shared/contracts";
```

Replace the `useMemo` block (lines 26-36 currently) with:

```tsx
  const { participantsList, slots } = useMemo(() => {
    const list = Array.from(state.participants.values());
    const me = state.selfId ? state.participants.get(state.selfId) : undefined;
    const ordered: ParticipantPublic[] = [];
    if (me) ordered.push(me);
    list.forEach((p) => {
      if (p.id !== state.selfId) ordered.push(p);
    });
    return { participantsList: list, slots: ordered.slice(0, 4) };
  }, [state.participants, state.selfId]);
```

Replace the `<EditorsGrid>` JSX block with:

```tsx
        <EditorsGrid count={slots.length}>
          {slots.map((p) => {
            if (p.id === state.selfId) {
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
            return (
              <PeerEditorCell
                key={p.id}
                participant={p}
                sharedCode={state.sharedCodes.get(p.id)}
                collapsed={state.collapsedPeers.has(p.id)}
                onToggleCollapsed={() => roomStore.getState().togglePeerCollapsed(p.id)}
              />
            );
          })}
        </EditorsGrid>
```

- [ ] **Step 2: Verify typecheck**

```bash
bun run lint
```

Expected: PASS.

---

### Task B4: Delete obsolete `empty-slot.tsx`

**Files:**
- Delete: `src/widgets/room-view/ui/empty-slot.tsx`

- [ ] **Step 1: Remove the file**

```bash
rm src/widgets/room-view/ui/empty-slot.tsx
```

- [ ] **Step 2: Confirm no references remain**

```bash
bunx grep -rn "empty-slot\|EmptySlot" src/ tests/
```

Expected: no matches (empty output).

- [ ] **Step 3: Verify build still passes**

```bash
bun run lint
```

Expected: PASS.

---

## Phase C — Run button + WS-synchronized console

### Task C1: Contracts — `ConsoleMessage` + new events

**Files:**
- Create: `src/shared/contracts/console.ts`
- Modify: `src/shared/contracts/index.ts`
- Modify: `src/shared/contracts/events.ts`

- [ ] **Step 1: Create `console.ts`**

Create `src/shared/contracts/console.ts`:

```ts
export type ConsoleMethod = "log" | "info" | "warn" | "error" | "debug";

export interface ConsoleMessage {
  id: string;
  method: ConsoleMethod;
  data: string[];
  timestamp: number;
}

export interface ConsoleOutputPayload {
  logs: ConsoleMessage[];
}

export interface PeerConsoleOutputPayload {
  participantId: string;
  logs: ConsoleMessage[];
}

export interface PeerConsoleClearedPayload {
  participantId: string;
}
```

- [ ] **Step 2: Re-export from index**

Edit `src/shared/contracts/index.ts`, append:

```ts
export * from "./console";
```

- [ ] **Step 3: Wire events into `events.ts`**

Edit `src/shared/contracts/events.ts`. Add import at the top next to existing ones:

```ts
import type {
  ConsoleOutputPayload,
  PeerConsoleOutputPayload,
  PeerConsoleClearedPayload,
} from "./console";
```

Extend `ServerToClientEvents` with two entries (after `"room:shared-code-cleared"` line):

```ts
  "room:peer-console-output": (payload: PeerConsoleOutputPayload) => void;
  "room:peer-console-cleared": (payload: PeerConsoleClearedPayload) => void;
```

Extend `ClientToServerEvents` (after `"status:set"` line):

```ts
  "console:output": (payload: ConsoleOutputPayload) => void;
  "console:clear": () => void;
```

- [ ] **Step 4: Verify typecheck**

```bash
bun run lint
```

Expected: PASS (new event types referenced nowhere yet, that's fine).

---

### Task C2: `serializeConsoleArg` helper + tests

**Files:**
- Create: `src/features/code-editor/lib/serialize-console-arg.ts`
- Create: `tests/features/code-editor/serialize-console-arg.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/features/code-editor/serialize-console-arg.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { serializeConsoleArg } from "../../../src/features/code-editor/lib/serialize-console-arg";

describe("serializeConsoleArg", () => {
  it("returns strings unchanged", () => {
    expect(serializeConsoleArg("hello")).toBe("hello");
  });

  it("stringifies numbers", () => {
    expect(serializeConsoleArg(42)).toBe("42");
  });

  it("pretty-prints plain objects", () => {
    expect(serializeConsoleArg({ a: 1 })).toContain("\"a\"");
  });

  it("handles cyclic references without throwing", () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    expect(() => serializeConsoleArg(obj)).not.toThrow();
    expect(typeof serializeConsoleArg(obj)).toBe("string");
  });

  it("handles undefined", () => {
    expect(serializeConsoleArg(undefined)).toBe("undefined");
  });

  it("handles functions", () => {
    expect(serializeConsoleArg(() => 1)).toContain("function");
  });

  it("handles bigint", () => {
    expect(serializeConsoleArg(10n)).toBe("10");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bunx vitest run tests/features/code-editor/serialize-console-arg.test.ts
```

Expected: FAIL — module missing.

- [ ] **Step 3: Implement the helper**

Create `src/features/code-editor/lib/serialize-console-arg.ts`:

```ts
export function serializeConsoleArg(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "function") {
    return value.toString().startsWith("function")
      ? value.toString()
      : `function ${value.name || "(anonymous)"}`;
  }
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bunx vitest run tests/features/code-editor/serialize-console-arg.test.ts
```

Expected: PASS (7 cases).

---

### Task C3: `room-store` peer console buffers + tests

**Files:**
- Modify: `src/shared/lib/room-store.ts`
- Create: `tests/shared/lib/room-store-peer-console.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/shared/lib/room-store-peer-console.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { createRoomStore } from "../../../src/shared/lib/room-store";
import type { ConsoleMessage } from "@/shared/contracts";

function mkLog(i: number, method: ConsoleMessage["method"] = "log"): ConsoleMessage {
  return { id: `l${i}`, method, data: [`msg ${i}`], timestamp: i };
}

describe("room-store peer consoles", () => {
  let store: ReturnType<typeof createRoomStore>;
  beforeEach(() => { store = createRoomStore(); });

  it("appends logs for a peer", () => {
    store.getState().appendPeerConsole("p1", [mkLog(1), mkLog(2)]);
    expect(store.getState().peerConsoles.get("p1")?.length).toBe(2);
  });

  it("keeps logs from multiple peers isolated", () => {
    store.getState().appendPeerConsole("p1", [mkLog(1)]);
    store.getState().appendPeerConsole("p2", [mkLog(2)]);
    expect(store.getState().peerConsoles.get("p1")?.length).toBe(1);
    expect(store.getState().peerConsoles.get("p2")?.length).toBe(1);
  });

  it("caps each peer buffer at 200 entries (FIFO)", () => {
    const batch = Array.from({ length: 250 }, (_, i) => mkLog(i));
    store.getState().appendPeerConsole("p1", batch);
    const logs = store.getState().peerConsoles.get("p1") ?? [];
    expect(logs.length).toBe(200);
    expect(logs[0]?.id).toBe("l50");
    expect(logs[199]?.id).toBe("l249");
  });

  it("clearPeerConsole empties the buffer but keeps the key", () => {
    store.getState().appendPeerConsole("p1", [mkLog(1)]);
    store.getState().clearPeerConsole("p1");
    expect(store.getState().peerConsoles.get("p1")?.length).toBe(0);
  });

  it("removePeerConsole deletes the key", () => {
    store.getState().appendPeerConsole("p1", [mkLog(1)]);
    store.getState().removePeerConsole("p1");
    expect(store.getState().peerConsoles.has("p1")).toBe(false);
  });

  it("participant-left also removes peer console", () => {
    store.getState().appendPeerConsole("p1", [mkLog(1)]);
    store.getState().applyEvent({
      type: "room:participant-left",
      payload: { participantId: "p1" },
    });
    expect(store.getState().peerConsoles.has("p1")).toBe(false);
  });

  it("shared-code-cleared also clears peer console", () => {
    store.getState().appendPeerConsole("p1", [mkLog(1)]);
    store.getState().applyEvent({
      type: "room:shared-code-cleared",
      payload: { participantId: "p1" },
    });
    expect(store.getState().peerConsoles.get("p1")?.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bunx vitest run tests/shared/lib/room-store-peer-console.test.ts
```

Expected: FAIL — `peerConsoles`, `appendPeerConsole`, etc. missing.

- [ ] **Step 3: Extend `room-store.ts`**

Edit `src/shared/lib/room-store.ts`.

Add import at the top:

```ts
import type { ConsoleMessage } from "@/shared/contracts";
```

Extend `RoomState` (inside the interface, after `task`):

```ts
  peerConsoles: Map<string, ConsoleMessage[]>;
```

Extend `RoomActions` (after `allReady`):

```ts
  appendPeerConsole(id: string, logs: ConsoleMessage[]): void;
  clearPeerConsole(id: string): void;
  removePeerConsole(id: string): void;
```

Add a constant near the top of the file (after imports):

```ts
const MAX_PEER_LOG_BUFFER = 200;
```

Extend `initial()` to include:

```ts
  peerConsoles: new Map(),
```

Inside `applyEvent`, extend the `"room:participant-left"` branch to also delete the peer console entry. Replace that case block with:

```ts
          case "room:participant-left": {
            const participants = new Map(state.participants);
            participants.delete(event.payload.participantId);
            const sharedCodes = new Map(state.sharedCodes);
            sharedCodes.delete(event.payload.participantId);
            const collapsedPeers = new Set(state.collapsedPeers);
            collapsedPeers.delete(event.payload.participantId);
            const peerConsoles = new Map(state.peerConsoles);
            peerConsoles.delete(event.payload.participantId);
            return { participants, sharedCodes, collapsedPeers, peerConsoles };
          }
```

Extend the `"room:shared-code-cleared"` branch to also reset the peer's logs. Replace with:

```ts
          case "room:shared-code-cleared": {
            const sharedCodes = new Map(state.sharedCodes);
            sharedCodes.delete(event.payload.participantId);
            const participants = new Map(state.participants);
            const p = participants.get(event.payload.participantId);
            if (p) participants.set(p.id, { ...p, hasSharedCode: false });
            const peerConsoles = new Map(state.peerConsoles);
            if (peerConsoles.has(event.payload.participantId)) {
              peerConsoles.set(event.payload.participantId, []);
            }
            return { sharedCodes, participants, peerConsoles };
          }
```

After the `togglePeerCollapsed` action, add:

```ts
    appendPeerConsole(id, logs) {
      set((state) => {
        const next = new Map(state.peerConsoles);
        const current = next.get(id) ?? [];
        const combined = current.concat(logs);
        const trimmed = combined.length > MAX_PEER_LOG_BUFFER
          ? combined.slice(combined.length - MAX_PEER_LOG_BUFFER)
          : combined;
        next.set(id, trimmed);
        return { peerConsoles: next };
      });
    },

    clearPeerConsole(id) {
      set((state) => {
        const next = new Map(state.peerConsoles);
        next.set(id, []);
        return { peerConsoles: next };
      });
    },

    removePeerConsole(id) {
      set((state) => {
        const next = new Map(state.peerConsoles);
        next.delete(id);
        return { peerConsoles: next };
      });
    },
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bunx vitest run tests/shared/lib/room-store-peer-console.test.ts tests/shared/lib/room-store.test.ts
```

Expected: PASS (all existing room-store tests + 7 new cases).

---

### Task C4: Server-side relay of new events + integration test

**Files:**
- Modify: `src-server/ws.ts`
- Modify: `tests/server/ws.integration.test.ts`

- [ ] **Step 1: Write the failing integration test**

Edit `tests/server/ws.integration.test.ts`. Add a new `it` block inside the existing `describe("ws integration", …)` (near the end, before the final closing brace). Copy-paste the helper patterns used by the existing tests in that file; the block below uses the same `bootHarness`, `connect`, and `wait` already defined at the top of the file:

```ts
  it("relays console:output from author to peers", async () => {
    const a = connect(harness.url);
    const b = connect(harness.url);
    clients.push(a, b);
    const aJoined = new Promise<void>((res) => a.emit("room:join", { roomId: "r1", nickname: "alice" }, () => res()));
    await aJoined;
    const bJoined = new Promise<void>((res) => b.emit("room:join", { roomId: "r1", nickname: "bob" }, () => res()));
    await bJoined;

    const received = wait<{ participantId: string; logs: Array<{ id: string }> }>(
      b,
      "room:peer-console-output"
    );
    a.emit("console:output", {
      logs: [{ id: "l1", method: "log", data: ["hi"], timestamp: 1 }],
    });
    const payload = await received;
    expect(payload.logs[0]?.id).toBe("l1");
    expect(payload.participantId).toBeTruthy();
  });

  it("relays console:clear from author to peers", async () => {
    const a = connect(harness.url);
    const b = connect(harness.url);
    clients.push(a, b);
    await new Promise<void>((res) => a.emit("room:join", { roomId: "r1", nickname: "alice" }, () => res()));
    await new Promise<void>((res) => b.emit("room:join", { roomId: "r1", nickname: "bob" }, () => res()));

    const received = wait<{ participantId: string }>(b, "room:peer-console-cleared");
    a.emit("console:clear");
    const payload = await received;
    expect(payload.participantId).toBeTruthy();
  });
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bunx vitest run tests/server/ws.integration.test.ts
```

Expected: FAIL — server does not handle the new events.

- [ ] **Step 3: Add handlers to `src-server/ws.ts`**

Edit `src-server/ws.ts`. Inside the `io.on("connection", …)` block, after the existing `socket.on("status:set", …)` handler and before `socket.on("disconnect", …)`, insert:

```ts
      socket.on("console:output", (payload) => {
        const roomId = socket.data.roomId;
        if (!roomId) return;
        if (!payload || !Array.isArray(payload.logs)) return;
        const logs = payload.logs.slice(0, 50);
        socket.to(roomId).emit("room:peer-console-output", {
          participantId: socket.id,
          logs,
        });
      });

      socket.on("console:clear", () => {
        const roomId = socket.data.roomId;
        if (!roomId) return;
        socket.to(roomId).emit("room:peer-console-cleared", {
          participantId: socket.id,
        });
      });
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bunx vitest run tests/server/ws.integration.test.ts
```

Expected: PASS (all existing cases + 2 new).

---

### Task C5: Client hook — subscribe + emit (gated by `isSharing`)

**Files:**
- Modify: `src/shared/lib/use-room-socket.ts`

- [ ] **Step 1: Extend the hook**

Edit `src/shared/lib/use-room-socket.ts`.

Update the imports block:

```ts
import type {
  ConsoleMessage,
  JoinAck,
  Language,
  ParticipantPublic,
  ParticipantStatus,
  PeerConsoleClearedPayload,
  PeerConsoleOutputPayload,
} from "@/shared/contracts";
```

Extend `UseRoomSocketResult`:

```ts
export interface UseRoomSocketResult {
  status: ConnectionStatus;
  error: string | null;
  emitCodeUpdate: (code: string, language: Language) => void;
  emitShare: () => void;
  emitUnshare: () => void;
  emitStatus: (status: ParticipantStatus) => void;
  emitConsoleOutput: (logs: ConsoleMessage[]) => void;
  emitConsoleClear: () => void;
}
```

Inside the `useEffect` that wires socket listeners, add two handlers next to the existing ones (after `const onSharedCleared = …`):

```ts
    const onPeerConsoleOutput = (p: PeerConsoleOutputPayload) =>
      roomStore.getState().appendPeerConsole(p.participantId, p.logs);
    const onPeerConsoleCleared = (p: PeerConsoleClearedPayload) =>
      roomStore.getState().clearPeerConsole(p.participantId);
```

Register them next to the other `socket.on` calls:

```ts
    socket.on("room:peer-console-output", onPeerConsoleOutput);
    socket.on("room:peer-console-cleared", onPeerConsoleCleared);
```

Unregister them in the cleanup block:

```ts
      socket.off("room:peer-console-output", onPeerConsoleOutput);
      socket.off("room:peer-console-cleared", onPeerConsoleCleared);
```

After `emitStatus`, add:

```ts
  const emitConsoleOutput = useCallback((logs: ConsoleMessage[]) => {
    if (!roomStore.getState().isSharing) return;
    if (logs.length === 0) return;
    socketRef.current?.emit("console:output", { logs });
  }, []);

  const emitConsoleClear = useCallback(() => {
    if (!roomStore.getState().isSharing) return;
    socketRef.current?.emit("console:clear");
  }, []);
```

Include them in the returned object:

```ts
  return {
    status,
    error,
    emitCodeUpdate,
    emitShare,
    emitUnshare,
    emitStatus,
    emitConsoleOutput,
    emitConsoleClear,
  };
```

- [ ] **Step 2: Verify typecheck**

```bash
bun run lint
```

Expected: PASS.

---

### Task C6: Sandpack config — disable autorun

**Files:**
- Modify: `src/features/code-editor/lib/sandpack-config.ts`

- [ ] **Step 1: Replace the options**

Replace the `SANDPACK_OPTIONS` export with:

```ts
export const SANDPACK_OPTIONS = {
  autorun: false,
  autoReload: false,
} as const;
```

- [ ] **Step 2: Verify typecheck**

```bash
bun run lint
```

Expected: PASS.

---

### Task C7: `useSandpackConsoleSync` hook

**Files:**
- Create: `src/features/code-editor/ui/use-sandpack-console-sync.ts`

- [ ] **Step 1: Create the hook**

Create `src/features/code-editor/ui/use-sandpack-console-sync.ts`:

```ts
"use client";
import { useEffect, useRef } from "react";
import { useSandpack } from "@codesandbox/sandpack-react";
import type { ConsoleMessage, ConsoleMethod } from "@/shared/contracts";
import { serializeConsoleArg } from "../lib/serialize-console-arg";

const FLUSH_DELAY_MS = 150;
const MAX_BATCH = 50;

interface Params {
  onBatch: (logs: ConsoleMessage[]) => void;
  onClear: () => void;
  enabled: boolean;
}

interface SandpackConsoleLogEntry {
  method?: ConsoleMethod;
  data?: unknown[];
}

interface SandpackMessage {
  type?: string;
  log?: SandpackConsoleLogEntry | SandpackConsoleLogEntry[];
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toMessage(entry: SandpackConsoleLogEntry): ConsoleMessage {
  const data = Array.isArray(entry.data) ? entry.data.map(serializeConsoleArg) : [];
  return {
    id: makeId(),
    method: entry.method ?? "log",
    data,
    timestamp: Date.now(),
  };
}

export function useSandpackConsoleSync({ onBatch, onClear, enabled }: Params): void {
  const { listen } = useSandpack();
  const bufferRef = useRef<ConsoleMessage[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onBatchRef = useRef(onBatch);
  const onClearRef = useRef(onClear);

  useEffect(() => { onBatchRef.current = onBatch; }, [onBatch]);
  useEffect(() => { onClearRef.current = onClear; }, [onClear]);

  useEffect(() => {
    if (!enabled) return;
    const flush = () => {
      timerRef.current = null;
      if (bufferRef.current.length === 0) return;
      let batch = bufferRef.current;
      bufferRef.current = [];
      if (batch.length > MAX_BATCH) {
        const dropped = batch.length - MAX_BATCH;
        batch = batch.slice(-MAX_BATCH);
        batch.unshift({
          id: makeId(),
          method: "warn",
          data: [`… truncated ${dropped} lines`],
          timestamp: Date.now(),
        });
      }
      onBatchRef.current(batch);
    };

    const scheduleFlush = () => {
      if (timerRef.current) return;
      timerRef.current = setTimeout(flush, FLUSH_DELAY_MS);
    };

    const unsubscribe = listen((message: SandpackMessage) => {
      if (message.type === "start") {
        bufferRef.current = [];
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        onClearRef.current();
        return;
      }
      if (message.type !== "console" || !message.log) return;
      const entries = Array.isArray(message.log) ? message.log : [message.log];
      for (const entry of entries) bufferRef.current.push(toMessage(entry));
      scheduleFlush();
    });

    return () => {
      unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      bufferRef.current = [];
    };
  }, [listen, enabled]);
}
```

- [ ] **Step 2: Verify typecheck**

```bash
bun run lint
```

Expected: PASS.

---

### Task C8: `OutputPanel` — tabbed Console / Preview

**Files:**
- Create: `src/features/code-editor/ui/output-panel.tsx`

- [ ] **Step 1: Create the panel**

Create `src/features/code-editor/ui/output-panel.tsx`:

```tsx
"use client";
import { useState } from "react";
import { SandpackConsole, SandpackPreview } from "@codesandbox/sandpack-react";
import type { Language } from "@/shared/contracts";
import { cn } from "@/shared/lib/utils";

interface Props {
  language: Language;
}

type Tab = "console" | "preview";

export function OutputPanel({ language }: Props) {
  const showPreviewTab = language === "react";
  const [tab, setTab] = useState<Tab>("console");
  const activeTab: Tab = showPreviewTab ? tab : "console";

  return (
    <div className="flex min-h-[200px] max-h-[280px] flex-col border-t border-dashed border-border">
      <div className="flex items-center gap-1 border-b border-border/60 bg-muted/20 px-2 py-1 text-xs">
        <TabButton active={activeTab === "console"} onClick={() => setTab("console")}>
          Console
        </TabButton>
        {showPreviewTab && (
          <TabButton active={activeTab === "preview"} onClick={() => setTab("preview")}>
            Preview
          </TabButton>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === "console" ? (
          <SandpackConsole standalone />
        ) : (
          <SandpackPreview showOpenInCodeSandbox={false} showRefreshButton={false} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded px-2 py-0.5 font-medium transition-colors",
        active ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
bun run lint
```

Expected: PASS.

---

### Task C9: `CodeEditor` integration — Run button + output panel + sync

**Files:**
- Modify: `src/features/code-editor/ui/code-editor.tsx`

- [ ] **Step 1: Rewrite `code-editor.tsx`**

Replace the entire file contents with:

```tsx
"use client";
import { useEffect, useMemo, useRef } from "react";
import {
  SandpackProvider,
  SandpackCodeEditor,
  useSandpack,
} from "@codesandbox/sandpack-react";
import type { ConsoleMessage, Language } from "@/shared/contracts";
import {
  SANDPACK_TEMPLATES,
  SANDPACK_FILES,
  SANDPACK_OPTIONS,
} from "../lib/sandpack-config";
import { OutputPanel } from "./output-panel";
import { useSandpackConsoleSync } from "./use-sandpack-console-sync";

interface CodeEditorProps {
  value: string;
  language: Language;
  onChange: (value: string) => void;
  onConsoleBatch?: (logs: ConsoleMessage[]) => void;
  onConsoleClear?: () => void;
}

function ChangeBridge({
  value,
  onChange,
  file,
}: {
  value: string;
  onChange: (v: string) => void;
  file: string;
}) {
  const { sandpack } = useSandpack();
  const code = sandpack.files[file]?.code ?? "";
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (code !== value) {
      onChangeRef.current(code);
    }
  }, [code, value]);

  return null;
}

function ConsoleBridge({
  onBatch,
  onClear,
}: {
  onBatch: (logs: ConsoleMessage[]) => void;
  onClear: () => void;
}) {
  useSandpackConsoleSync({ onBatch, onClear, enabled: true });
  return null;
}

export function CodeEditor({
  value,
  language,
  onChange,
  onConsoleBatch,
  onConsoleClear,
}: CodeEditorProps) {
  const template = SANDPACK_TEMPLATES[language];
  const file = SANDPACK_FILES[language];
  const files = useMemo(
    () => ({ [file]: { code: value, active: true } }),
    [file, value],
  );
  const syncEnabled = Boolean(onConsoleBatch && onConsoleClear);

  return (
    <SandpackProvider
      template={template}
      theme="dark"
      files={files}
      options={SANDPACK_OPTIONS}
    >
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1">
          <SandpackCodeEditor
            showTabs={false}
            showLineNumbers
            showInlineErrors
            showRunButton
            closableTabs={false}
          />
        </div>
        <OutputPanel language={language} />
      </div>
      <ChangeBridge value={value} onChange={onChange} file={file} />
      {syncEnabled && onConsoleBatch && onConsoleClear && (
        <ConsoleBridge onBatch={onConsoleBatch} onClear={onConsoleClear} />
      )}
    </SandpackProvider>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
bun run lint
```

Expected: PASS.

---

### Task C10: `PeerConsoleView`

**Files:**
- Create: `src/features/code-editor/ui/peer-console-view.tsx`

- [ ] **Step 1: Create the component**

Create `src/features/code-editor/ui/peer-console-view.tsx`:

```tsx
"use client";
import { useEffect, useRef } from "react";
import type { ConsoleMessage } from "@/shared/contracts";
import { cn } from "@/shared/lib/utils";

interface Props {
  logs: ConsoleMessage[];
}

const METHOD_COLOR: Record<ConsoleMessage["method"], string> = {
  log: "text-foreground/80",
  debug: "text-foreground/60",
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
};

export function PeerConsoleView({ logs }: Props) {
  const containerRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="flex min-h-[140px] max-h-[200px] items-center justify-center border-t border-dashed border-border text-xs text-muted-foreground">
        Нет вывода
      </div>
    );
  }

  return (
    <ul
      ref={containerRef}
      className="min-h-[140px] max-h-[200px] overflow-auto border-t border-dashed border-border bg-background/40 px-3 py-2 font-mono text-[11px] leading-relaxed"
    >
      {logs.map((log) => (
        <li key={log.id} className={cn("whitespace-pre-wrap break-words", METHOD_COLOR[log.method])}>
          {log.data.join(" ")}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
bun run lint
```

Expected: PASS.

---

### Task C11: Wire cells into the room view

**Files:**
- Modify: `src/widgets/room-view/ui/my-editor-cell.tsx`
- Modify: `src/widgets/room-view/ui/peer-editor-cell.tsx`
- Modify: `src/widgets/room-view/ui/room-view.tsx`

- [ ] **Step 1: Extend `MyEditorCell` props**

Edit `src/widgets/room-view/ui/my-editor-cell.tsx`. Add the import at the top:

```tsx
import type { ConsoleMessage } from "@/shared/contracts";
```

Extend the `Props` interface with two optional callbacks:

```tsx
  onConsoleBatch?: (logs: ConsoleMessage[]) => void;
  onConsoleClear?: () => void;
```

Accept them in the component signature:

```tsx
export function MyEditorCell({
  nickname,
  code,
  language,
  status,
  isSharing,
  onCodeChange,
  onShareToggle,
  onStatusChange,
  onConsoleBatch,
  onConsoleClear,
}: Props) {
```

Pass them to `<CodeEditor>`:

```tsx
        <CodeEditor
          value={code}
          language={language}
          onChange={onCodeChange}
          onConsoleBatch={onConsoleBatch}
          onConsoleClear={onConsoleClear}
        />
```

- [ ] **Step 2: Extend `PeerEditorCell` to show logs**

Edit `src/widgets/room-view/ui/peer-editor-cell.tsx`. Add imports:

```tsx
import { useStore } from "zustand";
import { roomStore } from "@/shared/lib/room-store";
import { PeerConsoleView } from "@/features/code-editor/ui/peer-console-view";
```

Inside `PeerEditorCell`, after the current destructuring, read the logs for this participant:

```tsx
  const logs = useStore(roomStore, (s) => s.peerConsoles.get(participant.id) ?? []);
```

Replace the visible-code branch (the `else` of `hidden`) with:

```tsx
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <ReadOnlyEditor value={sharedCode.code} language={sharedCode.language} />
          </div>
          <PeerConsoleView logs={logs} />
        </div>
      )}
```

- [ ] **Step 3: Pass console callbacks from `room-view.tsx`**

Edit `src/widgets/room-view/ui/room-view.tsx`. Pull the new emitters out of `useRoomSocket`:

```tsx
  const {
    status,
    error,
    emitCodeUpdate,
    emitShare,
    emitUnshare,
    emitStatus,
    emitConsoleOutput,
    emitConsoleClear,
  } = useRoomSocket(roomId, nickname);
```

Pass them into `<MyEditorCell>`:

```tsx
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
                  onConsoleBatch={emitConsoleOutput}
                  onConsoleClear={emitConsoleClear}
                />
```

- [ ] **Step 4: Verify typecheck**

```bash
bun run lint
```

Expected: PASS.

- [ ] **Step 5: Run the full test suite**

```bash
bun run test
```

Expected: PASS (all previously existing tests + every new test added in this plan).

---

## Phase D — Final verification and single commit

### Task D1: Dev-server smoke check

- [ ] **Step 1: Start the dev server**

```bash
bun dev
```

Leave running in a terminal; open `http://localhost:3000` in a browser.

- [ ] **Step 2: Walk the smoke checklist**

Manually verify **every** item, noting any failures before moving on:

1. Home page: Sidebar visible and expanded; click the `PanelLeftClose` button → rail appears (w-14). Reload the page → rail persists.
2. Click `PanelLeftOpen` → full sidebar returns.
3. Open `/rooms`, create a new room → auto-navigate into `/rooms/<id>`. Sidebar is auto-collapsed.
4. Solo in the room: single editor fills the editor area. Press **Run** (Sandpack's built-in button) → console shows output.
5. Open a second browser / incognito, join the same room with a different nickname → grid reflows to 2 columns. Toggle share on author side, press Run → second client sees the same logs in the peer-console panel under the read-only editor.
6. Join a third tab → grid reflows to first-cell-spans-two-columns layout.
7. Join a fourth tab → 2×2 grid, no empty slots.
8. Author unshares → peer's logs disappear (peer buffer cleared).
9. One participant disconnects → their cell and logs are removed; grid reflows.
10. Switch language to `react` on the author side → Preview tab appears in the OutputPanel and renders the JSX output.
11. Refresh a participant tab → reconnects cleanly, new Run produces new logs (stale logs are not resurrected).

- [ ] **Step 3: Stop the dev server**

`Ctrl+C` in the terminal running `bun dev`.

---

### Task D2: Run `/simplify` once

- [ ] **Step 1: Invoke the slash command**

Run `/simplify` in the interactive session. Let it sweep the diff for reuse, quality, and efficiency issues across everything touched in this plan. Apply whatever fixes the skill proposes inline.

- [ ] **Step 2: Re-run lint and tests**

```bash
bun run lint && bun run test
```

Expected: PASS.

---

### Task D3: Single final commit

- [ ] **Step 1: Review the diff**

```bash
git status
git diff --stat
```

- [ ] **Step 2: Stage and commit (one commit, all three features)**

```bash
git add src/shared/contracts/console.ts \
        src/shared/contracts/index.ts \
        src/shared/contracts/events.ts \
        src/shared/lib/ui-store.ts \
        src/shared/lib/room-store.ts \
        src/shared/lib/use-room-socket.ts \
        src/shared/lib/use-auto-collapse-on-route-enter.ts \
        src/features/code-editor/lib/sandpack-config.ts \
        src/features/code-editor/lib/serialize-console-arg.ts \
        src/features/code-editor/ui/code-editor.tsx \
        src/features/code-editor/ui/output-panel.tsx \
        src/features/code-editor/ui/peer-console-view.tsx \
        src/features/code-editor/ui/use-sandpack-console-sync.ts \
        src/widgets/sidebar/ui/sidebar.tsx \
        src/widgets/room-view/lib/grid-class-for-count.ts \
        src/widgets/room-view/ui/editors-grid.tsx \
        src/widgets/room-view/ui/my-editor-cell.tsx \
        src/widgets/room-view/ui/peer-editor-cell.tsx \
        src/widgets/room-view/ui/room-view.tsx \
        src/widgets/room-view/ui/top-bar.tsx \
        src/app/rooms/[id]/room-client.tsx \
        src-server/ws.ts \
        tests/shared/lib/ui-store.test.ts \
        tests/shared/lib/auto-collapse-sentinel.test.ts \
        tests/shared/lib/room-store-peer-console.test.ts \
        tests/features/code-editor/serialize-console-arg.test.ts \
        tests/widgets/room-view/grid-class-for-count.test.ts \
        tests/server/ws.integration.test.ts

git rm src/widgets/room-view/ui/empty-slot.tsx

git commit -m "$(cat <<'EOF'
feat(rooms): collapsible sidebar, synced console, dynamic editor grid

- Sidebar collapse persisted in ui-store, auto-collapsed on first entry
  to a room via sessionStorage sentinel
- Explicit Run button (autorun: false) with standalone SandpackConsole
  for the author and React Preview toggle when language === "react"
- Author console output captured via Sandpack listen() and broadcast
  through two new WS events (console:output, console:clear); peers
  render the stream in a plain PeerConsoleView; gated by isSharing
- Editor grid sizes to the actual participant count (1..4), with the
  3-participant layout spanning the first cell across two columns
- EmptySlot deleted; invite CTA already lives in TopBar

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Verify final state**

```bash
git log -1 --stat
```

Expected: one commit with all modified/created/deleted files listed. No stray untracked files relevant to this work.
