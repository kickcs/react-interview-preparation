# Live Coding Section — Design Spec

**Дата:** 2026-03-28
**Статус:** Утверждён

## Обзор

Добавление секции "Live Coding" с практическими задачами по программированию в существующее приложение React Interview Preparation. Задачи содержат условие, стартовый код с console.log-проверками, подсказки и эталонное решение. Пользователь решает задачи в своей IDE/консоли.

## Решения

- **Подход:** Единый контент-движок (подход A) — задачи в `content/live-coding/`, переиспользуем инфраструктуру MDX/SSG
- **Сайдбар:** Разделитель + секция внизу (вариант A) — теория сверху, "Live Coding" разделитель, практика снизу с фиолетовым акцентом
- **Язык:** Только русский (без билингвальных компонентов)
- **Сложность:** Без лейблов, порядок от простого к сложному через `order`
- **Объём:** 70 задач (по 10 на подкатегорию), генерируются в рамках реализации

## Подкатегории (7)

| Порядок | Slug         | Название     | Примеры задач                                       |
| ------- | ------------ | ------------ | --------------------------------------------------- |
| 1       | javascript   | JavaScript   | Замыкания, this, прототипы, hoisting, event loop    |
| 2       | typescript   | TypeScript   | Дженерики, utility types, type narrowing, infer     |
| 3       | async        | Async        | Промисы, async/await, race conditions, параллельность |
| 4       | js-trivia    | JS Trivia    | typeof null, NaN === NaN, приведение типов, WTF JS  |
| 5       | react        | React        | Хуки, рендеринг, ререндеры, кастомные хуки          |
| 6       | refactoring  | Refactoring  | Улучшение читаемости, архитектуры, устранение запахов |
| 7       | algorithms   | Algorithms   | Типовые алгоритмические задачи с собеседований       |

## Структура контента

```
content/
├── javascript-core/          # существующие Q&A (без изменений)
│   ├── _meta.json
│   └── *.mdx
├── ...
└── live-coding/              # НОВОЕ — top-level секция
    ├── _meta.json            # { title: "Live Coding", order: 100, type: "live-coding", icon: "code" }
    ├── javascript/
    │   ├── _meta.json        # { title: "JavaScript", order: 1 }
    │   ├── 01-closures-counter.mdx
    │   ├── 02-currying.mdx
    │   └── ... (10 файлов)
    ├── typescript/
    │   ├── _meta.json
    │   └── ... (10 файлов)
    ├── async/
    ├── js-trivia/
    ├── react/
    ├── refactoring/
    └── algorithms/
```

Ключевое: двухуровневая вложенность. `content/live-coding/` — top-level, внутри подкатегории с задачами.

### `_meta.json` для live-coding секции

```json
{
  "title": "Live Coding",
  "order": 100,
  "description": "Практические задачи по программированию",
  "icon": "code",
  "type": "live-coding"
}
```

Поле `type: "live-coding"` отличает эту секцию от обычных Q&A категорий. Используется сайдбаром для рендеринга разделителя и подкатегорий.

### `_meta.json` для подкатегории

```json
{
  "title": "JavaScript",
  "order": 1,
  "description": "Замыкания, this, прототипы, hoisting"
}
```

### MDX-формат задачи

```mdx
---
title: "Замыкание-счётчик"
order: 3
---

Реализуйте функцию `createCounter`, которая возвращает объект
с методами `increment()`, `decrement()` и `getCount()`.
Начальное значение передаётся аргументом.

<StarterCode>

```js
function createCounter(initialValue) {
  // Ваш код здесь
}

// ✅ Проверка
const counter = createCounter(10);
console.log(counter.getCount() === 10);  // true
counter.increment();
counter.increment();
console.log(counter.getCount() === 12);  // true
counter.decrement();
console.log(counter.getCount() === 11);  // true
```

</StarterCode>

<Hint title="Подсказка 1">
Используйте замыкание для хранения состояния.
</Hint>

<Hint title="Подсказка 2">
Верните объект с тремя методами, каждый из которых имеет доступ к переменной через замыкание.
</Hint>

<Solution>

```js
function createCounter(initialValue) {
  let count = initialValue;
  return {
    increment() { count++; },
    decrement() { count--; },
    getCount() { return count; }
  };
}
```

</Solution>
```

## Роутинг

```
app/
├── [category]/[slug]/page.tsx              # существующий Q&A (без изменений)
└── live-coding/[category]/[slug]/
    └── page.tsx                             # страница задачи
```

URL-формат: `/live-coding/javascript/closures-counter`

`generateStaticParams()` генерирует все комбинации category/slug из `content/live-coding/` для SSG.

## Entities

Новый entity `src/entities/challenge/`:

```
entities/
├── category/        # существующий (без изменений)
├── question/        # существующий (без изменений)
└── challenge/       # НОВОЕ
    ├── index.ts
    └── lib/
        ├── get-challenge-categories.ts
        ├── get-challenges.ts
        ├── get-challenge.ts
        └── get-adjacent-challenges.ts
```

### Типы

```ts
interface ChallengeCategoryMeta {
  title: string;
  order: number;
  slug: string;
  icon?: string;
}

interface ChallengeMeta {
  title: string;
  order: number;
  slug: string;
  category: string;
}

interface ChallengeFull {
  meta: ChallengeMeta;
  content: string;  // raw MDX
}
```

### Функции

- `getChallengeCategories()` — читает `content/live-coding/*/_ meta.json`, возвращает `ChallengeCategoryMeta[]` отсортированный по `order`
- `getChallengesByCategory(categorySlug)` — читает MDX файлы из `content/live-coding/{categorySlug}/`, возвращает `ChallengeMeta[]`
- `getChallenge(categorySlug, challengeSlug)` — возвращает `ChallengeFull` (meta + raw MDX)
- `getAdjacentChallenges(categorySlug, challengeSlug)` — prev/next навигация, аналогично `getAdjacentQuestions`

Все функции обёрнуты в `cache()` для request deduplication.

## Новые MDX-компоненты

### `<StarterCode>`

- Путь: `src/shared/ui/starter-code.tsx`
- Обёртка вокруг блока кода: добавляет зелёную метку "Стартовый код" сверху и кнопку "Копировать"
- Код внутри — обычный fenced code block в MDX, подсветка через `rehype-pretty-code` (как в Q&A)
- Client component ("use client") для кнопки копирования

### `<Hint>`

- Путь: `src/shared/ui/hint.tsx`
- Props: `title: string` (например "Подсказка 1")
- Спойлер с жёлтым акцентом и иконкой лампочки
- Состояние: `revealedHints[challengeSlug-hintIndex]` в Zustand store
- Client component ("use client")

### `<Solution>`

- Путь: `src/shared/ui/solution.tsx`
- Спойлер с зелёным акцентом
- Обёртка: внутри fenced code block, подсветка через `rehype-pretty-code`
- Состояние: `revealedSolutions[challengeSlug]` в Zustand store
- Client component ("use client")

## Zustand Store — изменения

```ts
interface UIState {
  // существующее (без изменений)
  revealedQuestions: Record<string, boolean>;
  toggleQuestion: (id: string) => void;
  collapsedCategories: Record<string, boolean>;
  toggleCategory: (slug: string) => void;
  toggleAllCategories: (slugs: string[], collapse: boolean) => void;

  // НОВОЕ
  revealedHints: Record<string, boolean>;
  toggleHint: (id: string) => void;
  revealedSolutions: Record<string, boolean>;
  toggleSolution: (id: string) => void;
}
```

`revealedHints` и `revealedSolutions` **не персистятся** в localStorage — сбрасываются при перезагрузке.

## Сайдбар

Визуальная структура: существующие Q&A категории сверху → горизонтальный разделитель "Live Coding" → подкатегории live-coding с фиолетовым акцентом снизу.

### Изменения

1. Root layout (`app/layout.tsx`) дополнительно вызывает `getChallengeCategories()` и `getChallengesByCategory()` для всех подкатегорий
2. `SidebarNav` получает `challengeCategories` и `challengesByCategory` props
3. Рендерит разделитель после Q&A категорий
4. Подкатегории live-coding используют ту же логику expand/collapse через `collapsedCategories` store (с prefix `live-coding-` для slug уникальности)
5. Ссылки ведут на `/live-coding/[category]/[slug]`

## Страница задачи

### Layout

```
├─ Breadcrumb: Live Coding › JavaScript › Задача 3 из 10
├─ h1: Замыкание-счётчик
├─ Описание задачи (MDX prose)
├─ <StarterCode> — каркас с console.log-проверками
├─ <Hint> × N — подсказки под спойлерами
├─ <Solution> — решение под спойлером
└─ Navigation: ← Предыдущая / Следующая →
```

### Widget

Новый виджет `src/widgets/challenge-view/`:

```
widgets/
├── question-view/     # существующий
├── sidebar/           # существующий
└── challenge-view/    # НОВОЕ
    ├── index.ts
    └── ui/
        ├── challenge-view.tsx       # основной компонент (MDXRemote + компоненты)
        └── challenge-navigation.tsx  # prev/next навигация
```

`ChallengeView` аналогичен `QuestionView`, но передаёт `StarterCode`, `Hint`, `Solution` в MDXRemote components map вместо `AnswerGroup`/`Answer`.
