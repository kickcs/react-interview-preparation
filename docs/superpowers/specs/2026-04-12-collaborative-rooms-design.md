# Collaborative Rooms — Design Spec

**Дата:** 2026-04-12
**Статус:** Утверждён

## Обзор

Добавление возможности создавать совместные комнаты (до 4 человек) для параллельного решения live-coding задач на JS, TS и React. Каждый участник имеет свой независимый редактор с Sandpack-песочницей и своим выполнением кода. Задача отображается слева, редакторы — в сетке 2×2 справа. Автор решает, "поделиться" ли своим кодом; смотрящий может локально скрывать чужие панели.

## Решения (принятые в ходе брейншторминга)

- **Сценарий:** Совместная практика с друзьями (не mock-интервью, не обучение с ролями)
- **Вход:** По ссылке, без регистрации — только nickname. Ephemeral in-memory комнаты.
- **Исполнение кода:** Sandpack (`@codesandbox/sandpack-react`) для JS/TS/React
- **Real-time транспорт:** Свой Fastify + Socket.IO сервер (отдельный процесс)
- **Видимость чужого кода:** Гибрид — автор решает "поделиться" (opt-in), смотрящий может локально свернуть панель
- **Источник задач:** Каталог существующих live-coding задач из `content/live-coding/` ИЛИ кастомный markdown-текст
- **Сопутствующие фичи:** Presence (кто онлайн, аватары) + статус "я готов" с реveal кода
- **Layout:** Задача слева, 2×2 сетка редакторов справа
- **Backend-фреймворк:** Fastify + Socket.IO (rooms из коробки, auto-reconnect, зрелая экосистема)
- **Интеграция с Next.js:** Два процесса в одном Docker-контейнере (сохраняем `output: "standalone"`)

## Ограничения и допущения

1. **In-memory state** — при перезапуске ws-сервера все комнаты теряются. Принято осознанно (пет-проект, нет БД).
2. **Custom Next.js server НЕ используется** — в Next.js 16 он несовместим со `standalone` output (`node_modules/next/dist/docs/01-app/02-guides/custom-server.md:14`), а standalone критичен для Docker-образа и SSG 150+ статических страниц.
3. **Максимум 4 участника** в комнате, максимум 500 комнат одновременно.
4. **Максимум 50 KB на код** у одного участника.
5. **TTL пустой комнаты — 10 минут**, затем удаляется.

---

## Архитектура процессов

```
┌─────────────────── Docker container (node:20-alpine) ───────────────────┐
│                                                                         │
│  ┌────────────────────────┐        ┌─────────────────────────────┐    │
│  │  Next.js standalone    │        │  Fastify + Socket.IO         │    │
│  │  (.next/standalone/    │        │  (dist-server/ws-server.js)  │    │
│  │   server.js)           │        │                              │    │
│  │  Port 3000             │        │  Port 3001 (env WS_PORT)     │    │
│  │                        │        │                              │    │
│  │  • SSG pages (150+)    │        │  • REST: POST /rooms         │    │
│  │  • /rooms/[id] page    │        │  • REST: GET /rooms/:id      │    │
│  │  • MDX catalog         │        │  • WS: /socket.io            │    │
│  └───────────┬────────────┘        │  • In-memory room state      │    │
│              │                     └────────────┬─────────────────┘    │
│              │                                  │                      │
│              │   concurrently --kill-others     │                      │
│              └──────────────────────────────────┘                      │
│                                                                         │
└─────────────────────── EXPOSE 3000 3001 ───────────────────────────────┘
                │                         │
                ▼                         ▼
          Browser HTTP              Browser WebSocket
          (Next.js pages)           (socket.io-client → WS_PORT)
```

**Ключевые решения:**

- **Два процесса в одном контейнере**, запускаются через `concurrently --kill-others-on-fail`. Оба падают → контейнер падает.
- **Отдельные порты без внутреннего прокси.** В dev: `:3000` для страниц, `:3001` для WS. В prod: внешний reverse-proxy (если есть) может объединить, но не требуется для MVP.
- **`src-server/`** — новая директория в корне репозитория (не внутри `src/`), собирается отдельным `tsconfig.server.json` в `dist-server/`. FSD-правила проекта на неё не распространяются.
- **Общие типы** живут в `src/shared/contracts/` — импортируются обоими процессами.
- **Клиент знает WS URL через `NEXT_PUBLIC_WS_URL`** (build-time env).

---

## Модель данных (in-memory state)

### Общие типы (`src/shared/contracts/room.ts`)

```ts
export type TaskSource =
  | { kind: "catalog"; category: string; slug: string }
  | { kind: "custom"; title: string; markdown: string }

export type Language = "js" | "ts" | "react"

export type ParticipantStatus = "thinking" | "ready"

export interface ParticipantPublic {
  id: string              // socket.id
  nickname: string
  status: ParticipantStatus
  joinedAt: number
  hasSharedCode: boolean
}

export interface RoomSnapshot {
  id: string
  taskSource: TaskSource
  maxParticipants: 4
  participants: ParticipantPublic[]
  createdAt: number
}
```

### Серверный state (`src-server/state.ts`)

```ts
interface Participant {
  id: string
  nickname: string
  joinedAt: number
  status: ParticipantStatus
  code: string                  // приватный, никогда не broadcast
  sharedCode: string | null     // snapshot, виден другим если !== null
  language: Language
}

interface Room {
  id: string                    // nanoid(8)
  taskSource: TaskSource
  participants: Map<string, Participant>
  createdAt: number
  emptyAt: number | null        // timestamp когда комната опустела
}

const rooms = new Map<string, Room>()
```

### Жизненный цикл комнаты

- **Создание**: `POST /rooms` → генерация `nanoid(8)` → `rooms.set(id, ...)` → возврат `{id}`
- **Присоединение**: WS `"room:join"` → проверка `size < 4` → `socket.join(roomId)` → добавление Participant → broadcast
- **Отключение**: Socket.IO `disconnect` → удаление из `participants` → если `size === 0`, `emptyAt = Date.now()`
- **Cleanup**: каждые 60 секунд интервал проверяет `emptyAt` → удаляет комнаты старше 10 минут
- **Защита от DoS**: не более `MAX_ROOMS = 500` одновременно, при превышении `POST /rooms` → 503

### Лимиты и защита

- **Код**: максимум 50 KB на участника (клиент + сервер)
- **Дебаунс `code:update`**: 500 мс на клиенте
- **Throttle на сервере**: > 5 `code:update` / сек от одного socket → лишние дропаются
- **Rate limit `POST /rooms`**: 5 комнат / минута / IP (`@fastify/rate-limit`)
- **Nickname**: 1-20 символов, без HTML, sanitize на сервере

### Что НЕ хранится

- История изменений кода (только текущий snapshot)
- Чат (не в scope)
- Результаты выполнения кода (Sandpack работает локально)
- Персистентные комнаты (исчезают при рестарте сервера)

---

## API

### REST (Fastify)

```
POST /rooms
  Body: { taskSource: TaskSource }
  Res:  201 { id: string }
        400 { error: "INVALID_TASK_SOURCE" }
        429 (rate-limited)
        503 (MAX_ROOMS_REACHED)

GET /rooms/:id
  Res:  200 { exists: true, participantCount: number, maxParticipants: 4 }
        404 { exists: false }
```

`GET /rooms/:id` нужен, чтобы страница могла показать "не существует" / "заполнена" до подключения WS.

### Socket.IO events

**Client → Server:**

```ts
"room:join"       { roomId: string; nickname: string }
  ack: { ok: true, snapshot: RoomSnapshot, selfId: string, task: TaskContent }
     | { ok: false, error: "ROOM_NOT_FOUND" | "ROOM_FULL" | "NICKNAME_INVALID" | "NICKNAME_TAKEN" }

"code:update"     { code: string; language: Language }
  // обновляет приватный code; если isSharing — также sharedCode + broadcast
  // клиент дебаунсит 500мс

"code:share"      ()
  // sharedCode = code, broadcast

"code:unshare"    ()
  // sharedCode = null, broadcast

"status:set"      { status: "thinking" | "ready" }
  // только меняет status, не трогает sharedCode
```

**Server → Client (broadcast в `roomId`):**

```ts
"room:participant-joined"    { participant: ParticipantPublic }
"room:participant-left"      { participantId: string }
"room:participant-status"    { participantId: string; status: ParticipantStatus }
"room:shared-code-updated"   { participantId: string; code: string; language: Language }
"room:shared-code-cleared"   { participantId: string }
"room:error"                 { code: string; message: string }
```

**НЕ broadcast'ится:** приватный `code` без активного sharing, `code:update` без sharing.

**Disconnect поведение:**
- Сервер удаляет participant → broadcast `"room:participant-left"`
- Клиент с Socket.IO auto-reconnect → новый `socket.id` → снова `emit("room:join")`
- Nickname и код сохраняются в `sessionStorage` на клиенте и подставляются при возврате

---

## Frontend-структура (FSD)

```
src/
├── shared/
│   ├── contracts/              ← НОВОЕ
│   │   ├── room.ts             ← TaskSource, RoomSnapshot, ParticipantPublic
│   │   ├── events.ts           ← типы Socket.IO events
│   │   └── index.ts
│   ├── lib/
│   │   ├── ws-client.ts        ← НОВОЕ: Socket.IO client singleton
│   │   ├── use-room-socket.ts  ← НОВОЕ: React-хук обёртки
│   │   └── room-store.ts       ← НОВОЕ: Zustand store
│   └── ui/ (существующие shadcn-примитивы)
│
├── entities/
│   ├── category/ (существует)
│   ├── question/ (существует)
│   ├── challenge/ (существует)
│   └── room/                   ← НОВОЕ
│       ├── lib/
│       │   └── get-task-content.ts  ← MDX из content/live-coding/ по {category,slug}
│       ├── model/
│       │   └── types.ts        ← re-export из shared/contracts
│       └── index.ts
│
├── features/                   ← НОВЫЙ СЛОЙ (в проекте пока нет)
│   ├── room-create/ui/create-room-form.tsx
│   ├── room-join/ui/join-room-form.tsx
│   ├── code-editor/ui/code-editor.tsx         ← Sandpack-обёртка
│   ├── share-code/ui/share-code-toggle.tsx
│   ├── ready-toggle/ui/ready-toggle.tsx
│   └── hide-peer-code/ui/peer-panel-collapse.tsx
│
├── widgets/
│   ├── sidebar/ (существует, не меняется)
│   ├── challenge-view/ (существует, не меняется)
│   ├── question-view/ (существует, не меняется)
│   └── room-view/              ← НОВОЕ
│       ├── ui/
│       │   ├── room-view.tsx          ← layout: задача слева, 2×2 справа
│       │   ├── task-panel.tsx         ← MDX задачи / custom markdown
│       │   ├── editors-grid.tsx       ← 2×2 грид
│       │   ├── my-editor-cell.tsx     ← writable Sandpack
│       │   ├── peer-editor-cell.tsx   ← read-only Sandpack
│       │   ├── presence-bar.tsx      ← аватары + статусы сверху
│       │   └── room-errors.tsx       ← тосты ошибок
│       └── index.ts
│
└── app/
    └── rooms/                  ← НОВЫЙ сегмент
        ├── page.tsx            ← лендинг создания
        ├── [id]/page.tsx       ← Client Component, подключает WS
        └── layout.tsx          ← обёртка без sidebar (full-screen)
```

### Ключевые решения по фронту

1. **`/rooms/[id]` — Client Component.** В отличие от остальных страниц проекта (SSG), состояние приходит через WebSocket. `generateStaticParams` не применяется. Серверным остаётся только fetch текста задачи (async Server Component-обёртка).

2. **Задача рендерится через `next-mdx-remote`** — переиспользуем существующую инфраструктуру.

3. **Zustand `room-store.ts`** хранит:
   - `participants: Map<id, ParticipantPublic>`
   - `sharedCodes: Map<id, {code, language}>`
   - `collapsedPeers: Set<id>` — локальный свёрнутый state, НЕ синхронизируется
   - `myCode`, `myLanguage`, `myStatus`, `isSharing`
   - `applyEvent(event)` — диспатч по типу серверного события
   - Селектор `allReady` — true, когда все участники `status === "ready"`

4. **`features/` — новый слой FSD.** Проект сейчас использует "FSD-lite" без этого слоя, но документ CLAUDE.md описывает текущее состояние, не ограничение. Добавление `features/` — валидное расширение.

5. **Sandpack-обёртка** использует `@codesandbox/sandpack-react`. Для JS/TS — template `vanilla-ts`, для React — `react-ts`.

6. **Никаких изменений** в `widgets/sidebar/`, `widgets/challenge-view/`, `widgets/question-view/`. Фича изолирована в `/rooms/*`.

---

## Data flow (основные сценарии)

### 1. Создание комнаты

```
User A на /rooms → выбирает задачу + nickname
  ↓
POST /rooms { taskSource } → 201 { id }
  ↓
router.push(`/rooms/${id}`)  (nickname в sessionStorage)
  ↓
/rooms/[id] Server Component: GET /rooms/:id → 200 exists
  ↓
getTaskContent(taskSource) → MDX serialized
  ↓
<RoomView task={mdx} /> client component
  ↓
WS connect → emit("room:join", {roomId, nickname})
```

### 2. Присоединение по ссылке

```
User B открывает /rooms/[id]
  ↓
Server Component: GET /rooms/:id
  → 404 → "Комната не найдена"
  → 200, count === 4 → "Комната заполнена"
  → 200, count < 4 → <JoinRoomForm />
  ↓
User B вводит nickname → <RoomView /> монтируется → WS connect → join
  ↓
ack с RoomSnapshot → Zustand applyEvent → UI рендерит существующих
  ↓
Другие получают "room:participant-joined"
```

### 3. Редактирование кода (приватное)

```
User A печатает → Sandpack onChange → roomStore.setMyCode()
  ↓
debounce 500мс → emit("code:update", {code, language})
  ↓
Server: !isSharing → сохраняет participants.get(A).code, БЕЗ broadcast
        isSharing → обновляет code + sharedCode, broadcast "room:shared-code-updated"
```

### 4. "Поделиться кодом"

```
User A нажимает "Поделиться"
  ↓
emit("code:share") → Server: sharedCode = code, broadcast
  ↓
Другие клиенты: roomStore.applySharedCode(A, code) → <PeerEditorCell> read-only Sandpack
  ↓
Дальнейшие правки User A → emit("code:update") → сервер broadcast живого кода
  ↓
User A жмёт "Скрыть" → emit("code:unshare") → broadcast "room:shared-code-cleared"
  ↓
Другие клиенты: clearSharedCode(A) → placeholder "Код скрыт"
```

### 5. "Я готов"

```
User A жмёт "Я готов"
  ↓
emit("status:set", {status: "ready"}) + если !isSharing → также emit("code:share")
  ↓
Server broadcast "room:participant-status" + (возможно) "room:shared-code-updated"
  ↓
Остальные видят ✓ "User A готов" + его код
  ↓
Когда все status === "ready":
  Zustand selector allReady → UI баннер "Все готовы — сравните решения"
  ↓
Отмена "Готов": emit("status:set", {status: "thinking"}) — sharedCode НЕ снимается автоматически
```

### 6. Локальное скрытие чужой панели

```
User A жмёт × на <PeerEditorCell> пользователя B
  ↓
roomStore.collapsedPeers.add(B)  — ТОЛЬКО у меня, БЕЗ emit
  ↓
Панель B → "Код скрыт (локально)" + кнопка развернуть
```

### 7. Disconnect / reconnect

```
Пропадание интернета → Socket.IO auto-retry
  ↓
~25с ping timeout на сервере → disconnect → удаление participant → broadcast "participant-left"
  ↓
Возврат интернета → Socket.IO reconnect → новый socket.id
  ↓
use-room-socket.ts хук видит reconnect → снова emit("room:join")
  ↓
Если комната жива (emptyAt == null || < 10 мин) → успех
  Code из sessionStorage → подставляется в Sandpack
  Если был isSharing — клиент снова emit("code:share")
  ↓
Иначе: ROOM_NOT_FOUND → "Комната больше не существует"
```

---

## Error handling и edge cases

### Серверные коды ошибок

| Код                  | Когда                                   | Ответ клиенту                            |
|----------------------|-----------------------------------------|------------------------------------------|
| `ROOM_NOT_FOUND`     | `room:join` с невалидным roomId         | ack → страница "Комната удалена"         |
| `ROOM_FULL`          | `room:join`, `participants.size === 4`  | ack → "Комната заполнена"                |
| `NICKNAME_INVALID`   | пустой / > 20 / HTML-теги               | ack → подсветка поля                     |
| `NICKNAME_TAKEN`     | уже есть такой ник в комнате            | ack → попросить другой                   |
| `CODE_TOO_LARGE`     | `code:update` > 50 KB                   | `room:error` тост, НЕ сохраняется        |
| `RATE_LIMITED`       | > 5 `POST /rooms` в минуту с IP         | HTTP 429                                 |
| `MAX_ROOMS_REACHED`  | > 500 комнат в памяти                   | HTTP 503                                 |
| `NOT_JOINED`         | event без предшествующего join          | `room:error`                             |

### Клиентские edge cases

1. **WS не подключается вообще** → баннер "Нет связи, переподключаемся" + локальное редактирование разрешено (Sandpack работает offline).
2. **Sandpack CDN упал** → fallback в `<textarea>` с подсветкой Shiki (уже в зависимостях) + сообщение "Песочница недоступна".
3. **Перезагрузка страницы** → nickname + код из sessionStorage → авто re-join.
4. **Две вкладки одного юзера** → два socket.id → быстрее ROOM_FULL. Допустимо.
5. **Автор sharing покинул** → `disconnect` → клиенты автоматически чистят `sharedCodes[A]` в reducer.
6. **Перезапуск ws-server** → все комнаты исчезают. Клиенты получают ROOM_NOT_FOUND на reconnect → "Комната была закрыта".
7. **Участник закрыл вкладку** → ping timeout ~25с → disconnect. Остальные видят уход с задержкой. Допустимо.
8. **Код > 50 KB в sessionStorage** → клиент обрезает до 50 KB с тостом.
9. **Быстрая печать в sharing** → дебаунс 500мс клиент + throttle сервер (max 5/сек).
10. **XSS в custom markdown** → `rehype-sanitize` при рендере, плюс sanitize на сервере при сохранении.

### Логирование

- **Сервер**: Fastify `pino` (встроен), JSON-формат, `info` в prod, `debug` в dev. Все события с `roomId` и `participantId`.
- **Клиент**: `console.debug` только в dev. В prod тишина.
- **Нет** tracking/analytics в этой фиче.

---

## Тестирование

Следуем конвенции проекта: Vitest, тесты в `tests/` зеркально `src/`, только entity/logic-тесты.

### Серверные unit-тесты (`tests/server/state.test.ts`)

- `createRoom` — генерация id, лимит MAX_ROOMS
- `joinRoom` — cap 4, NICKNAME_TAKEN, сброс `emptyAt`
- `leaveRoom` — удаление, выставление `emptyAt`
- `updateCode` — лимит 50 KB, обновление sharedCode при isSharing
- `shareCode` / `unshareCode` — смена sharedCode
- `setStatus` — смена status без sharedCode
- `cleanupExpiredRooms` — удаление > 10 мин, сохранение активных и недавних

### Rate limit (`tests/server/rate-limit.test.ts`)

- `POST /rooms` — 6-й запрос с IP за минуту → 429

### Socket.IO integration (`tests/server/ws-server.integration.test.ts`)

Запускаем Fastify на случайном порту, подключаем 2 клиентов через `socket.io-client`:

- Два клиента в одной комнате → взаимные `participant-joined`
- `code:update` без sharing → других не достигает
- `code:share` → другие получают `shared-code-updated`
- `code:update` после share → другие получают обновлённый код
- `code:unshare` → `shared-code-cleared`
- `status:set` → `participant-status`
- `disconnect` → `participant-left`
- 5-й клиент → `ROOM_FULL`
- `join` в несуществующую → `ROOM_NOT_FOUND`

### Frontend unit-тесты (`tests/shared/lib/room-store.test.ts`)

- `applyEvent("room:participant-joined")` → participants.set
- `applyEvent("room:participant-left")` → delete participant + delete sharedCodes
- `applyEvent("room:shared-code-updated")` → sharedCodes.set
- `applyEvent("room:shared-code-cleared")` → sharedCodes.delete
- `applyEvent("room:participant-status")` → обновляет только status
- `collapsedPeers` — локальный toggle, не рассылается
- Селектор `allReady` — true только когда все ready

### Entity-тесты (`tests/entities/room/get-task-content.test.ts`)

- `kind: "catalog"` → читает MDX → возвращает source
- `kind: "catalog"` с несуществующим slug → NotFoundError
- `kind: "custom"` → markdown as-is (после sanitize)
- `kind: "custom"` с `<script>` → тег удалён

### Что НЕ тестируем

- React-компоненты (следуем конвенции проекта — нет component tests)
- Sandpack (сторонняя библиотека)
- `use-room-socket.ts` хук (косвенно через integration-тесты сервера)
- e2e в реальном браузере (нет инфры, не ставим ради одной фичи)
- Визуальный layout (мануально в конце)

### TDD

Реализация идёт через Red → Green → Refactor на каждой из областей (применяется skill `superpowers:test-driven-development` в фазе `writing-plans`).

---

## Deployment

### Изменения в Dockerfile

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
RUN bun run build
RUN bunx tsc -p tsconfig.server.json    # НОВОЕ: src-server/ → dist-server/

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
# НОВОЕ:
COPY --from=builder --chown=nextjs:nodejs /app/dist-server ./dist-server
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/fastify ./node_modules/fastify
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/socket.io ./node_modules/socket.io
# (и прочие runtime deps — финальный список в implementation plan)

USER nextjs
EXPOSE 3000 3001

CMD ["npx", "concurrently", "--kill-others-on-fail", \
     "node server.js", \
     "node dist-server/ws-server.js"]
```

**Тонкости:**

- `next.config.ts` не меняется, `output: "standalone"` сохраняется.
- `tsconfig.server.json` — новый TS-конфиг для `src-server/`, `module: "commonjs"`, `target: "es2022"`, `outDir: "dist-server"`.
- Runtime deps для WS-сервера копируются вручную — standalone tracing их не видит.
- `concurrently` — prod-dependency.

### ⚠️ Pre-flight checks (обязательно до первого деплоя)

Отдельная задача в implementation plan:

1. **Проверить занятость порта 3001 на проде.** Если занят → выбрать свободный и выставить через `WS_PORT` env.
2. **Проверить, что reverse proxy (если есть) пропускает WebSocket upgrade** на выбранный порт.
3. **Проверить `.github/workflows/deploy.yml`** — как пробрасываются порты наружу, добавить публикацию WS-порта.
4. **Оценить лимит памяти контейнера.** Fastify + Socket.IO для 500 комнат × 4 × 50 KB ≈ 100 MB state + ~80 MB runtime. Подобрать лимит в деплое.

### CI

`.github/workflows/deploy.yml` — структурно не меняется. Добавляется:

- Шаг `bun run test` (включая новые integration-тесты WS)
- Возможно проверка `WS_PORT` через prod secrets (на pre-flight)

### Локальный dev

```json
"scripts": {
  "dev": "concurrently -n next,ws -c blue,green \"next dev\" \"tsx watch src-server/ws-server.ts\"",
  "dev:next": "next dev",
  "dev:ws": "tsx watch src-server/ws-server.ts",
  "build": "next build && tsc -p tsconfig.server.json",
  "build:next": "next build",
  "build:ws": "tsc -p tsconfig.server.json"
}
```

### Env-переменные

| Переменная            | Где                | Дефолт                  | Назначение                           |
|-----------------------|--------------------|-------------------------|--------------------------------------|
| `WS_PORT`             | WS-сервер          | `3001`                  | Порт WebSocket-сервера               |
| `NEXT_PUBLIC_WS_URL`  | Next.js build-time | `http://localhost:3001` | URL Socket.IO-клиента                |
| `MAX_ROOMS`           | WS-сервер          | `500`                   | Лимит комнат в памяти                |
| `CLEANUP_INTERVAL_MS` | WS-сервер          | `60000`                 | Частота cleanup-проверки             |
| `ROOM_TTL_MS`         | WS-сервер          | `600000` (10 мин)       | TTL для пустой комнаты               |

---

## Новые зависимости

### Production
- `@codesandbox/sandpack-react` — песочница кода
- `socket.io` — серверный WS
- `socket.io-client` — клиентский WS
- `fastify` — HTTP сервер
- `@fastify/rate-limit` — rate limiting
- `nanoid` — генерация roomId
- `rehype-sanitize` — санитайзинг custom markdown
- `concurrently` — запуск двух процессов в Docker

### Development
- `tsx` — запуск TS в dev без компиляции

---

## Out of scope (явно не делаем)

- Чат в комнате (решено не делать)
- Таймер на решение (решено не делать)
- Аутентификация / аккаунты
- Персистентные комнаты (БД)
- История изменений кода (undo/redo между сессиями)
- Запись сессии / replay
- Множественные задачи в одной комнате
- Shared editing (CRDT, Yjs) — каждый пишет свой код отдельно
- Пригласительные email / SMS
- Модерация, роли, kick/ban
- Голосовой / видео-чат
- Mobile-оптимизация layout (2×2 на узком экране — stack, но без специальной адаптации)
- E2E-тесты (Playwright / Cypress)
- Тесты React-компонентов
- Реверс-прокси внутри контейнера (оставляем EXPOSE двух портов)

---

## Visual Design

**Концепция:** вход в комнату = "jack in" в общий терминал. Монокод-CRT-эстетика — фосфорно-зелёный на глубокой черноте, ASCII-углы, тикающий лог событий снизу, глиф-статусы. Остальной сайт остаётся спокойным greyscale — `/rooms` это намеренный контраст, момент "теперь это режим игры".

**Почему это работает:** (1) монокод — родной язык фичи; (2) ретро-терминал даёт повод для деталей (scanlines, glyphs, boot) без скатывания в clutter; (3) создаёт узнаваемость — больше нигде на сайте такого нет.

### Токены (`src/app/rooms/rooms.css`, отдельный global stylesheet)

```css
--room-bg:            oklch(0.08 0 0);
--room-panel:         oklch(0.12 0 0);
--room-border:        oklch(0.22 0 0);
--room-border-strong: oklch(0.35 0 0);
--room-fg:            oklch(0.92 0 0);
--room-fg-dim:        oklch(0.58 0 0);
--room-phosphor:      oklch(0.88 0.20 145);   /* alive / you / online */
--room-phosphor-dim:  oklch(0.55 0.14 145);
--room-amber:         oklch(0.82 0.16 75);    /* ready / attention */
--room-crimson:       oklch(0.68 0.22 25);    /* error / disconnect */
```

### Типографика

- Весь `/rooms/*` — `font-mono` (`JetBrains Mono`, уже в проекте)
- Display 24/36 для баннеров, body 13/15, label 11 ALLCAPS tracking 0.12em
- Курсор `█` мигает на текстовых инпутах вместо дефолтного caret
- `border-radius: 0` внутри `/rooms` — глобально для всех элементов

### Textures

- Scanlines: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgb(255 255 255 / 0.02) 3px)` слоем `pointer-events: none` поверх layout
- Отключается при `prefers-reduced-motion: reduce`
- Никаких blur, shadows, gradients — только 1px hairline и solid fills

### Глифы (единый язык статусов)

| Glyph | Значение |
|-------|----------|
| `◉`   | онлайн / фокус |
| `◇`   | thinking |
| `✓`   | ready (амбер) |
| `»`   | участник шарит код |
| `░`   | пустой слот / скрытая панель |
| `×`   | disconnected / error |

### Главный view комнаты

```
┌─ ROOM #XK7P2M ─────────── ◉alice  »◇bob  ◉carl  ✓dana ─── [3/4]  [↗ COPY]  [× EXIT]
│
│ ┌─ TASK ─ catalog/react/debounce ──┐  ┌─ ALICE  ◇ private ────┐  ┌─ BOB  » ───────┐
│ │                                  │  │  1  function deb() {  │  │  1  const fn=  │
│ │  Реализовать debounce             │  │  2    // …            │  │  2    (…) => { │
│ │  ────────────────────            │  │  3  }                 │  │  3    clearTim │
│ │                                  │  │                       │  │                │
│ │  Signature:                       │  │  [ S share ]  [R run] │  │  [H hide] [Rrun│
│ │    debounce(fn, ms)              │  ├───────────────────────┤  ├────────────────┤
│ │                                  │  │ > console              │  │ > console      │
│ │  Expected: …                     │  │   (idle)              │  │   3 undefined  │
│ │                                  │  └───────────────────────┘  └────────────────┘
│ │  Constraints: …                  │
│ │                                  │  ┌─ CARL  ◉ ─────────────┐  ┌─ SLOT 4 ───────┐
│ │                                  │  │  1  // wip            │  │   ░░░░░░░░░░   │
│ │                                  │  │                       │  │    WAITING     │
│ │                                  │  │  [S share ]  [R run]  │  │                │
│ │                                  │  ├───────────────────────┤  │    /rooms/XK7. │
│ │                                  │  │ > console              │  │    [↗ COPY]    │
│ └──────────────────────────────────┘  └───────────────────────┘  └────────────────┘
│
├─ LOG ────────────────────────────────────────────────────────────────────── [−] ──
│ 14:32:07  alice  joined
│ 14:33:01  dana   ready  ✓
└──────────────────────────────────────────────────────────────────────────────────
```

Детали:
- Top bar — одна строка, мини-presence через глифы (без аватаров)
- Каждая ячейка = редактор + консоль, inner rule `├─────┤`
- Твоя ячейка — `--room-border-strong`
- Shared ячейка — префикс `»` + border → `--room-phosphor-dim`
- Кнопки = `[ LETTER label ]`, letter = кейборд-шорткат (S share, H hide, R run)
- LOG strip коллапсируется до 28px, показывает только последнюю строку

### Landing `/rooms`

```
                           ╔══════════════════════════╗
                           ║    ROOMS // live-coding   ║
                           ╚══════════════════════════╝

                  ┌──────────────────────────────────────┐
                  │   > task                              │
                  │     ( ) catalog       ( ) custom     │
                  │                                      │
                  │   > your nickname                    │
                  │     [ amir_________________ ]█       │
                  │                                      │
                  │            [ CREATE ROOM ]           │
                  └──────────────────────────────────────┘

                  ─────────── or join an existing ────────
                  [ paste invite link ________________ ] →
```

- Display-текст в `╔╗╚╝` box — закрепляет терминал-идентичность
- Радио через ASCII `( )` / `(◉)` вместо нативных input-ов

### ALL READY момент

Когда все 4 в `ready`, однопиксельный амбер-border пробегает по периметру viewport-а (keyframe 900ms, один раз), в top bar появляется:

```
┌─ ROOM #XK7P2M ─ ◉◉◉◉ ─ [4/4] ── ▓▓▓ ALL HANDS READY — PRESS [R] TO COMPARE ▓▓▓ ──
```

В MVP `[R] compare` просто снимает локальные `collapsedPeers` и подсвечивает ячейки амбером — без полноценного diff-режима.

### Error states

**Room not found / full:** центрированный бокс с `×` глифом, crimson-border, кнопка возврата.

**Connection lost:** оверлей поверх текущего layout с hatch-pattern штриховкой (не blur), крупный текст `× CONNECTION LOST` в `--room-crimson`, обратный отсчёт до reconnect, строка "your code is safe locally".

### Motion (минимально и выразительно)

1. **Boot on join (~700ms):** top bar → task → cell 1 → cell 2 → cell 3 → cell 4 печатаются построчно через `animation-delay` с шагом 80ms. Без fade — сразу с текстом, имитация появления строк в терминале.
2. **Status flip (◇ → ✓):** 120ms `steps(3)` без easing, плюс 400ms амбер-вспышка border.
3. **ALL READY sweep:** однопиксельный амбер-border по периметру viewport, 900ms, один проход.

`prefers-reduced-motion: reduce` отключает boot и sweep.

### Что это значит для архитектуры

- Новый файл `src/app/rooms/rooms.css` с токенами и scanlines-оверлеем, импортируется в `src/app/rooms/layout.tsx`
- Shadcn-примитивы НЕ используются внутри `/rooms/*` — все UI-элементы пишутся руками по монокод-языку (~150 строк CSS на примитивы: бокс, кнопка, инпут, label, console)
- Sandpack-тема: custom фосфор-вариант на базе `vitesse-dark`, детали в implementation plan
- Остальной сайт не меняется — `/rooms/*` изолирован через свой layout

---

## План работ (верхнеуровневый)

Детальный TDD-план будет создан в фазе `superpowers:writing-plans`. Верхнеуровневая последовательность:

1. **Pre-flight check** продакшен-окружения (порт, прокси, CI, память)
2. **Shared contracts** — `src/shared/contracts/` (без логики)
3. **Серверный state** — `src-server/state.ts` + unit-тесты
4. **Fastify HTTP** — `POST /rooms`, `GET /rooms/:id` + тесты
5. **Socket.IO events** — `src-server/ws-server.ts` + integration-тесты
6. **Dockerfile и scripts** — параллельный запуск, `tsconfig.server.json`
7. **Клиентский WS-client + хук** — `ws-client.ts`, `use-room-socket.ts`
8. **Zustand room-store** — `room-store.ts` + тесты
9. **Entity `room`** — `get-task-content.ts` + тесты
10. **Features** — `code-editor` (Sandpack), `share-code`, `ready-toggle`, `hide-peer-code`, `room-create`, `room-join`
11. **Widget `room-view`** — layout + сборка всех features
12. **App route `/rooms`** — landing + `[id]` page + layout
13. **Мануальное smoke-тестирование** — локально с двумя вкладками, затем с другом
14. **Деплой** после всех pre-flight checks
