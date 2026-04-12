# Rooms Enhancements — Design Spec

**Date:** 2026-04-13
**Status:** Approved, ready for implementation plan
**Scope:** Three independent enhancements for the collaborative coding rooms feature (`/rooms/[id]`).

## Goals

1. **Collapsible global Sidebar**, auto-collapsed on first entry to a room, toggleable everywhere, state persisted in `localStorage`.
2. **Runnable code + visible output for every participant**: explicit Run button, larger console, React preview toggle, and peer console output **synchronized via WebSocket** so everyone sees the same result the author sees.
3. **Dynamic editor grid**: number of editor cells matches the number of real participants (1, 2, 3, or 4) — no empty "invite" slots; inviting moves to the top bar.

## Non-goals

- Multi-file Sandpack projects. Single-file only, as today.
- Streaming author's live typing into an execution — Run is explicit.
- Sharing console output when the author is not sharing their code (`isSharing=false`) — the output is gated by the same share flag as the code.
- Cursor/selection collaboration.
- Raising `MAX_PARTICIPANTS` above 4.
- Persisting console history on the server (logs are ephemeral; late joiners see only messages from the moment they connect).
- Running peer code locally in a second Sandpack instance.

## Current state (reference)

- Root layout renders global `<Sidebar>` on every route including `/rooms/*` (the rooms layout is a pass-through).
- `features/code-editor/ui/code-editor.tsx` already uses `SandpackProvider` + `SandpackCodeEditor` + `SandpackConsole` at `max-h-[120px]`, with a `ChangeBridge` that syncs edits outward.
- `features/code-editor/ui/read-only-editor.tsx` wraps Sandpack for peer code preview but renders no console.
- `widgets/room-view/ui/editors-grid.tsx` is a hardcoded 2×2 CSS grid.
- `widgets/room-view/ui/room-view.tsx` fills own cell first, then peers, then pads to `MAX_PARTICIPANTS` with `<EmptySlot>` invite CTAs.
- Presence state lives in `shared/lib/room-store.ts` (Zustand vanilla). WS layer is `shared/lib/use-room-socket.ts`.
- Sandpack options currently: `{ recompileMode: "delayed", recompileDelay: 400 }` — meaning code auto-runs 400 ms after each edit.

---

## Feature 1 — Sidebar collapse

### Behavior

- New `ui-store` state: `sidebarCollapsed: boolean`, persisted via the existing Zustand `persist` middleware.
- `Sidebar` renders in two modes:
  - **Expanded** (default): current `w-80` with full category/question tree.
  - **Collapsed**: `w-14` vertical rail with logo + expand button. Categories and search are unmounted.
- Toggle buttons live in two places:
  - Inside the `Sidebar` itself (arrow icon at the top, visible in both modes).
  - In `widgets/room-view/ui/top-bar.tsx` (new icon button) for convenience when inside a room.
- **Auto-collapse on first entry to a room**: a hook `useAutoCollapseOnRouteEnter(roomId)` mounted inside `app/rooms/[id]/room-client.tsx` sets `sidebarCollapsed=true` exactly once per `(browser session × roomId)`, guarded by `sessionStorage` key `rooms-auto-collapsed:<roomId>`. After the sentinel is set, the user is free to expand without fighting the auto-collapse.
- `MobileSidebar` is untouched — it has its own drawer semantics.

### Hydration strategy

- SSR always renders `w-80` to avoid layout mismatch.
- After hydration, `useHydrated()` guard switches to the persisted value. A brief flash is acceptable and noted as known minor issue.

### Files

| File | Change |
|---|---|
| `src/shared/lib/ui-store.ts` | Add `sidebarCollapsed`, `toggleSidebar`, `setSidebarCollapsed`; include in `partialize` |
| `src/shared/lib/use-auto-collapse-on-route-enter.ts` (new) | Hook + extracted pure helper `shouldAutoCollapse(roomId, storage)` for testability |
| `src/widgets/sidebar/sidebar.tsx` | Conditional rendering + width class based on state |
| `src/widgets/sidebar/sidebar.tsx` | Inline the collapsed-mode rail (logo + expand button) as a conditional branch; no separate `sidebar-rail.tsx` file unless the collapsed branch grows past ~30 LOC during implementation |
| `src/app/rooms/[id]/room-client.tsx` | Mount `useAutoCollapseOnRouteEnter(roomId)` |
| `src/widgets/room-view/ui/top-bar.tsx` | Add `<SidebarToggleButton>` |

---

## Feature 2 — Run + console for everyone

### Behavior

- `SANDPACK_OPTIONS` becomes `{ autorun: false, autoReload: false }` so the iframe waits for an explicit Run.
- `SandpackCodeEditor` gets `showRunButton` — the built-in Sandpack Run button appears in the gutter.
- The output area under the editor is replaced with a new `<OutputPanel>` containing two tabs:
  - **Console** — `<SandpackConsole standalone />` (standalone mode means the console runs its own sandpack client and does not require a mounted `<SandpackPreview>` to receive messages).
  - **Preview** — `<SandpackPreview />`, visible only when `language === "react"`.
  - Default tab: `"console"`. Height: `min-h-[200px] max-h-[280px]` with internal scroll.
- **Peer editors** (`PeerEditorCell`) never execute peer code. They render:
  - The existing `ReadOnlyEditor` for syntax-highlighted code view. Because `autorun: false` is now global in `SANDPACK_OPTIONS`, the underlying Sandpack iframe stays idle — no bundler runs, no preview mounts.
  - A new `<PeerConsoleView logs={...} />` — a plain scrollable `<ul>` populated from `roomStore.peerConsoles[participantId]`. Pure React, no Sandpack. This is the only source of peer output; nothing is re-executed client-side.

### WS synchronization of console output

When the author presses Run, their local Sandpack re-mounts the iframe. A new hook `useSandpackConsoleSync` subscribes to `sandpack.listen()` and:

1. On `message.type === "start"` → calls `onClear()`.
2. On `message.type === "console"` → serializes each argument to a string, buffers the message, and flushes the buffer via a 150 ms debounce → `onBatch(batch)`.
3. `useSandpackConsoleSync` itself is **not** aware of `isSharing`. It unconditionally buffers and calls the callbacks. The `isSharing` gate lives in exactly one place: the `emitConsoleOutput` / `emitConsoleClear` functions in `use-room-socket.ts`. Single source of truth for the share policy.
4. Caps each batch at 50 messages; excess is dropped and replaced with a synthetic `{ method: "warn", data: ["… truncated N lines"] }`. Prevents `for(;;) console.log` WS floods.

**New contracts** in `src/shared/contracts/`:

```ts
// console.ts
export type ConsoleMethod = "log" | "info" | "warn" | "error" | "debug";

export interface ConsoleMessage {
  id: string;
  method: ConsoleMethod;
  data: string[];
  timestamp: number;
}
```

**New WS events:**

| Direction | Event | Payload |
|---|---|---|
| Client → Server | `console:output` | `{ logs: ConsoleMessage[] }` |
| Client → Server | `console:clear` | `{}` |
| Server → Client | `room:peer-console-output` | `{ participantId: string; logs: ConsoleMessage[] }` |
| Server → Client | `room:peer-console-cleared` | `{ participantId: string }` |

The ws-server only needs to relay these events to the rest of the room (authenticated by the existing `participantId`). No persistence, no validation beyond shape check.

### `room-store` additions

```ts
peerConsoles: Map<string, ConsoleMessage[]>;
appendPeerConsole(id: string, logs: ConsoleMessage[]): void;
clearPeerConsole(id: string): void;
removePeerConsole(id: string): void;
```

- `appendPeerConsole` caps the per-peer buffer at **200 messages** (FIFO truncation) to bound memory.
- `clearPeerConsole` is called on both `room:peer-console-cleared` and on `room:shared-code-cleared` (un-sharing invalidates the output too).
- `removePeerConsole` is called on `room:participant-left`.

### Serialization

```ts
function serializeArg(x: unknown): string {
  if (typeof x === "string") return x;
  try { return JSON.stringify(x, null, 2); }
  catch { return String(x); }  // cyclic refs, bigint, etc.
}
```

### Files

| File | Change |
|---|---|
| `src/shared/contracts/console.ts` (new) | `ConsoleMessage`, `ConsoleMethod`, event payload types |
| `src/shared/contracts/index.ts` | Re-export new types |
| `src/shared/lib/room-store.ts` | `peerConsoles` map + three new actions; hook into participant-left and unshare cleanup |
| `src/shared/lib/use-room-socket.ts` | Subscribe to `room:peer-console-*`; expose `emitConsoleOutput` / `emitConsoleClear` (gated by `isSharing`) |
| `src/features/code-editor/lib/sandpack-config.ts` | Swap options to `{ autorun: false, autoReload: false }` |
| `src/features/code-editor/ui/code-editor.tsx` | Add `showRunButton`, replace inline `SandpackConsole` with `<OutputPanel>`, mount `useSandpackConsoleSync` when callbacks present |
| `src/features/code-editor/ui/use-sandpack-console-sync.ts` (new) | Hook: listen → throttle → onBatch/onClear |
| `src/features/code-editor/ui/serialize-console-arg.ts` (new) | Pure helper (testable) |
| `src/features/code-editor/ui/output-panel.tsx` (new) | Tab container: Console (standalone) / Preview (react only) |
| `src/features/code-editor/ui/peer-console-view.tsx` (new) | Plain log viewer component |
| `src/widgets/room-view/ui/my-editor-cell.tsx` | Pass `onConsoleBatch`/`onConsoleClear` down to `CodeEditor` |
| `src/widgets/room-view/ui/peer-editor-cell.tsx` | Render `<PeerConsoleView>` below `ReadOnlyEditor` |
| ws-server (out-of-repo file, verify at implementation time) | Relay two new events; cleanup logic for disconnect |

### Open item for implementation planning

The ws-server source may or may not live in this repo. **First action in the implementation plan**: `Glob "**/ws-server/**"` + grep for existing event handlers (`code:update`, `code:share`) to locate the server. If it is in-repo, the two new events are added in the same PR as the rest of Feature 2. If it is external, this spec is blocked on the server change and the plan must reflect that dependency explicitly. No silent assumptions either way.

---

## Feature 3 — Dynamic editor grid

### Behavior

- `EditorsGrid` accepts `count: number` and maps it to a Tailwind grid class:

| count | class |
|---|---|
| 1 | `grid grid-cols-1 grid-rows-1` |
| 2 | `grid grid-cols-2 grid-rows-1` |
| 3 | `grid grid-cols-2 grid-rows-2 [&>*:first-child]:col-span-2` |
| 4 | `grid grid-cols-2 grid-rows-2` |

All variants keep `h-full min-h-0 gap-3`. Mobile (`< md`) forces `grid-cols-1` regardless of count (same responsive behavior as today's room view outer grid).

- `RoomView` filters `slots` to **real participants only** (no null padding to `MAX_PARTICIPANTS`). Self first, peers in join order. Defensive `slice(0, MAX_PARTICIPANTS)` upper cap.
- `EmptySlot` widget is deleted.
- Invite action moves to `TopBar` as `<InviteButton roomId={roomId} />` — copies `window.location.href` via `navigator.clipboard.writeText`, with fallback to hidden-input selection in non-HTTPS contexts. Shows a toast on success.

### Files

| File | Change |
|---|---|
| `src/widgets/room-view/ui/editors-grid.tsx` | Accept `count` prop; class map via `gridClassForCount(count)` pure helper |
| `src/widgets/room-view/ui/grid-class-for-count.ts` (new) | Pure helper (testable) |
| `src/widgets/room-view/ui/room-view.tsx` | Drop empty-slot padding; pass real `count` to grid |
| `src/widgets/room-view/ui/empty-slot.tsx` | Delete (file no longer used) |
| `src/widgets/room-view/ui/top-bar.tsx` | Add `<InviteButton>` (and `<SidebarToggleButton>` from Feature 1) |
| `src/widgets/room-view/ui/invite-button.tsx` (new) | Clipboard copy + toast |

---

## Error handling summary

- **WS drops**: reconnection is already handled by `useRoomSocket`. Lost log batches are not replayed. Peers who reconnect see only new output.
- **Burst protection**: throttle 150 ms, cap 50 messages per batch, cap 200 messages per peer buffer, truncation warning inserted.
- **Sandpack runtime errors**: captured via the same `listen()` mechanism with `method: "error"` and replicated to peers.
- **Cyclic serialization**: `try/catch` around `JSON.stringify`, fallback to `String(x)`.
- **Clipboard API**: `navigator.clipboard.writeText` catch → fallback to hidden-input `execCommand("copy")` path.
- **Invalid grid count**: `count <= 0` → `grid-cols-1` + loading placeholder (defensive; not reachable in practice). `count > 4` → slice at `MAX_PARTICIPANTS`.
- **Hydration flash on sidebar**: known, minor, gated by existing `useHydrated()`.

## Testing plan

Matches the project's existing discipline (Vitest, node env, unit-only, no component tests).

| Test file | What it tests |
|---|---|
| `tests/shared/lib/ui-store.test.ts` | `toggleSidebar`, `setSidebarCollapsed`, `partialize` shape |
| `tests/shared/lib/room-store-peer-console.test.ts` | `appendPeerConsole` FIFO cap at 200, `clearPeerConsole`, `removePeerConsole`, isSharing guard |
| `tests/features/code-editor/serialize-console-arg.test.ts` | Strings, numbers, plain objects, cyclic refs, `undefined`, functions, `bigint` |
| `tests/widgets/room-view/grid-class-for-count.test.ts` | 1..4 happy path + 0/5 defensive |
| `tests/shared/lib/auto-collapse-sentinel.test.ts` | `shouldAutoCollapse(roomId, storage)` with fake `Storage` |

### Manual smoke checklist (must pass before PR)

1. Single participant: full-width editor, Run works, console shows output; sidebar auto-collapsed on entry.
2. Two participants: 2 columns; author runs → second user sees logs inside the peer cell.
3. Three participants: first cell spans two columns, other two below.
4. Four participants: 2×2, no CTA slot.
5. Sidebar toggle: collapses/expands, state survives reload.
6. React template: Console ↔ Preview tab toggle works and renders JSX preview.
7. Un-sharing code: peer logs disappear; further logs do not leak.
8. Participant leaves: their peer cell and stored logs are removed; grid reflows.
9. Reconnect: stale logs are not resurrected; new logs arrive normally.

---

## Implementation ordering hint (for the plan author)

The three features are genuinely independent and can be built and reviewed in three separate commits or PRs:

1. **Sidebar collapse** — smallest surface, pure UI state.
2. **Dynamic grid** — pure refactor in `room-view` + `editors-grid`, no WS changes.
3. **Run + synced console** — largest surface, touches contracts + ws-server + code-editor feature. Do last.

Planner decides whether to batch into one PR or split.
