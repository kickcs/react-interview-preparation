# Solo-режим решения для Q&A вопросов

**Дата:** 2026-06-07
**Статус:** Согласован, готов к планированию

## Проблема

Существует фича live-coding rooms — совместное решение задач в комнатах с
редактором кода (Sandpack) у каждого участника. Хочется, чтобы со страницы Q&A
вопроса (`/[category]/[slug]`) можно было открыть ту же задачу для **одиночного**
решения в редакторе — без комнаты, участников и WebSocket.

## Решение

Кнопка «Решать в редакторе» на странице Q&A вопроса ведёт на новую solo-страницу
`/[category]/[slug]/solo`. Там:

- **Слева** — панель вопроса: заголовок + текст вопроса, ответ скрыт под `Spoiler`
  (как на обычной Q&A странице — сначала решаешь сам, потом раскрываешь).
- **Справа** — Sandpack-редактор с консолью/output и переключателем языка
  (js / ts / react, дефолт — react).
- Никакого WebSocket, участников, share/ready.

## Ключевой контекст

- Q&A вопросы (`content/<category>/*.mdx`) содержат только `title`, `order` и
  текст ответов (`<AnswerGroup>` + `<Answer lang>`). **У них нет привязанного
  стартового кода или языка** — поэтому редактор открывается с дефолтным стартером
  per-language и переключателем.
- `CodeEditor` (`features/code-editor/ui/code-editor.tsx`) — переиспользуемый
  компонент (Sandpack: редактор + `OutputPanel`). Принимает `value`, `language`,
  `onChange` и опциональные console-колбэки. Console-sync включается только когда
  переданы `onConsoleBatch`/`onConsoleClear` — в solo они не нужны, опускаем.
- `Spoiler` (`shared/ui/spoiler`), `Answer`, `AnswerGroup` — переиспользуем для
  левой панели как есть из `QuestionView`.
- Двухколоночный layout берём по образцу `RoomView`:
  `grid min-h-0 flex-1 gap-3 md:grid-cols-[minmax(320px,38%)_1fr]`, но без `TopBar`.

## Архитектура (FSD-lite)

### 1. `widgets/solo-view` (новый виджет)
Композитный UI solo-страницы. Client component (редактор интерактивный).

- `ui/solo-view.tsx` — корневой layout: левая панель вопроса + правая панель
  редактора. Держит локальный стейт:
  - `useState<Language>('react')`
  - `useState<string>` — текущий код (инициализируется стартером для react)
  - при смене языка: код сбрасывается на стартер нового языка.
- `ui/solo-question-panel.tsx` — заголовок + `Spoiler` + `MDXRemote` с
  компонентами `Answer`/`AnswerGroup`. Принимает `meta`, `content`.
  **Примечание:** `MDXRemote` из `next-mdx-remote/rsc` — серверный. Чтобы держать
  панель в client-дереве, MDX рендерим в server-компоненте страницы и передаём как
  `ReactNode` проп (`questionContent`) в `SoloView`. Так избегаем смешения rsc-MDX
  с `"use client"`.
- `ui/solo-editor-cell.tsx` — хедер (переключатель языка) + `CodeEditor`.
- `index.ts` — публичный API (`export { SoloView }`).

### 2. `features/language-switch` (новая маленькая фича)
- `ui/language-switch.tsx` — сегментированный переключатель js/ts/react.
  Принимает `value: Language`, `onChange: (l: Language) => void`. Стиля придерживаемся
  существующих `shared/ui` примитивов (Badge/Button-подобные).

### 3. Стартовый код per-language
- Добавить `SOLO_STARTERS: Record<Language, string>` в
  `features/code-editor/lib/sandpack-config.ts` (рядом с `SANDPACK_TEMPLATES`):
  - `js` / `ts` — короткий комментарий-заглушка в `index.ts`.
  - `react` — минимальный `App.tsx` с дефолтным компонентом.

### 4. Маршрут `app/[category]/[slug]/solo/page.tsx` (server component)
- `generateStaticParams` — копия логики родителя (`getCategories` +
  `getQuestionsByCategory`), генерирует все `{category, slug}`.
- `generateMetadata` — `${question.meta.title} — Solo`.
- Грузит `getQuestion(category, slug)` (404 через `notFound()` при ошибке).
- Рендерит MDX через `MDXRemote` (server) → передаёт результат как `questionContent`
  проп в `<SoloView meta=... questionContent=... />`.

### 5. Кнопка на `QuestionView`
- В `widgets/question-view/ui/question-view.tsx` добавить `Link` на
  `/{category}/{slug}/solo` (например, рядом с h1 или в breadcrumb-блоке).
  Стиль — ненавязчивая кнопка/ссылка (иконка кода + текст «Решать в редакторе»).

## Поток данных

```
Server (solo/page.tsx):
  getQuestion(category, slug) → { meta, content }
  MDXRemote(content) → questionNode (ReactNode)
  → <SoloView meta={meta} questionContent={questionNode} />

Client (SoloView):
  language: Language = 'react'
  code: string = SOLO_STARTERS['react']
  onLanguageChange(next): setLanguage(next); setCode(SOLO_STARTERS[next])
  onCodeChange(v): setCode(v)
  → <CodeEditor value={code} language={language} onChange={onCodeChange} />
```

## Обработка ошибок

- Несуществующий вопрос → `notFound()` (как на родительской странице).
- Редактор/Sandpack — без console-sync, стандартное поведение `CodeEditor`.

## Тестирование

- Текущие тесты покрывают только entity-логику (`tests/entities/`). Новой
  entity-логики не добавляется (переиспользуем `getQuestion`), поэтому новых
  unit-тестов на данные не требуется.
- Проверка вручную: `bun dev` → открыть вопрос → кнопка → solo-страница →
  переключение языка сбрасывает код → редактор и консоль работают.
- `bun run lint` и `bun run build` (SSG `generateStaticParams`) должны проходить.

## YAGNI (явно не делаем)

- Нет персиста кода в localStorage.
- Нет связи solo с live-coding `challenge`-контентом.
- Нет share/ready/участников/ws.
- Нет привязки конкретного стартового кода к конкретному вопросу.
