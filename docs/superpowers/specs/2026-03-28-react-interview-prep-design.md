# React Interview Preparation — Спецификация

## Обзор

Статический сайт для подготовки русскоговорящих React-разработчиков к собеседованиям на английском языке. Вопросы и ответы представлены на двух языках одновременно (EN + RU). Английский текст на уровне B2 — понятный, не перегруженный. Примеры кода прилагаются в английском блоке, где это необходимо.

## Стек

- **Bun** — пакетный менеджер и рантайм
- **Next.js 16** — App Router, SSG через `generateStaticParams`
- **TypeScript** — строгая типизация
- **Tailwind CSS v4** — утилитарные стили, CSS-переменные
- **shadcn/ui** — библиотека компонентов (ScrollArea, Button, Badge, Sheet)
- **MDX** — контент в markdown с JSX-компонентами
- **next-mdx-remote** — компиляция MDX на этапе билда
- **gray-matter** — парсинг frontmatter
- **rehype-pretty-code + Shiki** — подсветка синтаксиса кода
- **FSD** — Feature-Sliced Design (упрощённый)

## Архитектура (FSD)

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Корневой layout (sidebar + content)
│   ├── page.tsx                  # Главная страница (редирект или welcome)
│   └── [category]/
│       └── [slug]/
│           └── page.tsx          # Страница вопроса
│
├── widgets/                      # Композитные блоки UI
│   ├── sidebar/                  # Sidebar с категориями и вопросами
│   └── question-view/            # Отображение вопроса + двуязычного ответа
│
├── entities/                     # Бизнес-сущности
│   ├── question/                 # Типы, утилиты для вопросов
│   └── category/                 # Типы, утилиты для категорий
│
├── shared/                       # Общие ресурсы
│   ├── ui/                       # shadcn/ui компоненты
│   ├── lib/                      # Утилиты (MDX парсинг, файловая система)
│   └── config/                   # Конфигурация (метаданные категорий)
│
content/                          # MDX файлы (вне src/)
├── javascript-core/
│   ├── _meta.json
│   ├── 01-closures.mdx
│   └── ...
├── html-css/
├── browser-network/
├── react-basics/
├── hooks/
├── advanced-react/
├── state-management/
├── typescript-react/
├── performance/
├── testing/
├── nextjs/
└── tooling-architecture/
```

## Формат контента

### MDX-файл вопроса

```mdx
---
title: "What is JSX?"
order: 1
---

<Answer lang="en">

JSX stands for **JavaScript XML**. It is a syntax extension for JavaScript
that lets you write HTML-like code inside your JavaScript files.

\`\`\`jsx
const element = <h1>Hello, world!</h1>;
\`\`\`

JSX is not required to use React, but it makes the code more readable.

</Answer>

<Answer lang="ru">

JSX расшифровывается как **JavaScript XML**. Это расширение синтаксиса
JavaScript, которое позволяет писать HTML-подобный код внутри JavaScript файлов.

JSX не обязателен для использования React, но он делает код более читаемым.

</Answer>
```

### Метаданные категории (`_meta.json`)

```json
{
  "title": "React Basics",
  "order": 4,
  "description": "Основы React: JSX, компоненты, пропсы, стейт"
}
```

### Правила контента

- `title` в frontmatter — заголовок вопроса (он же H1 на странице), всегда на английском
- `order` — порядок внутри категории (дублирует префикс файла)
- Код размещается только в EN-блоке `<Answer lang="en">`
- RU-блок содержит только текстовое объяснение
- Английский текст на уровне B2
- Вопросы внутри категории выстроены в логическую цепочку: каждый следующий опирается на предыдущий

## Категории (в порядке изучения)

| # | Slug | Название | Описание |
|---|------|----------|----------|
| 1 | javascript-core | JavaScript Core | Замыкания, прототипы, Event Loop, промисы, async/await, this, ES6+, структуры данных |
| 2 | html-css | HTML & CSS | Семантика, доступность, Flexbox, Grid, позиционирование, анимации, адаптивность, BEM, CSS Modules |
| 3 | browser-network | Browser & Network | DOM API, события браузера, HTTP/HTTPS, REST, CORS, cookies, localStorage, Web APIs, безопасность |
| 4 | react-basics | React Basics | JSX, компоненты, пропсы, стейт, жизненный цикл, условный рендеринг, списки и ключи, события, формы |
| 5 | hooks | Hooks | useState, useEffect, useContext, useRef, useMemo, useCallback, useReducer, кастомные хуки |
| 6 | advanced-react | Advanced React | HOC, Render Props, Compound Components, Context API, Error Boundaries, Portals, Suspense, React.lazy |
| 7 | state-management | State Management | Redux Toolkit, Zustand, Jotai, React Query / TanStack Query, сравнение подходов |
| 8 | typescript-react | TypeScript + React | Типизация пропсов, хуков, событий, дженерик-компоненты, утилитарные типы, discriminated unions |
| 9 | performance | Performance & Optimization | React.memo, виртуализация, code splitting, профайлинг, Web Vitals, оптимизация ре-рендеров |
| 10 | testing | Testing | Jest, React Testing Library, юнит/интеграционные тесты, моки, тестирование хуков |
| 11 | nextjs | Next.js | App Router, Server Components, SSR/SSG/ISR, роутинг, middleware, API routes, оптимизация изображений |
| 12 | tooling-architecture | Tooling & Architecture | Webpack/Vite, Git, CI/CD, линтинг, паттерны проектирования, SOLID, чистая архитектура, FSD |

## UI / Лейаут

### Desktop (≥768px)

- **Sidebar** (280px, фиксированный слева): категории с раскрывающимися списками вопросов. Активный вопрос подсвечен синим (`border-left: 2px solid #3b82f6`). Скроллится через `ScrollArea` (shadcn/ui).
- **Контент** (справа, `max-width: 720px`): breadcrumb (категория + номер вопроса), заголовок H1 (title из frontmatter), два блока ответов (EN с синим бейджем, RU с фиолетовым бейджем), навигация "Предыдущий / Следующий" внизу.

### Mobile (<768px)

- **Sidebar** скрыт. Открывается как `Sheet` (shadcn/ui) по нажатию на hamburger-иконку (☰) в хедере.
- **Контент** занимает 100% ширины, паддинги уменьшены (16px вместо 48px).
- **Блоки кода** получают `overflow-x: auto` для горизонтального скролла.

### Тема

- Тёмная тема по умолчанию (shadcn/ui dark theme).
- Цвета: EN-бейдж — синий (#3b82f6), RU-бейдж — фиолетовый (#a855f7).

## Поток данных (build time)

```
content/*.mdx → gray-matter (frontmatter) → next-mdx-remote (компиляция) → rehype-pretty-code (подсветка) → статическая HTML-страница
```

### Утилиты (entities/question, entities/category)

- `getCategories()` — список категорий из `_meta.json`, отсортированных по `order`
- `getQuestionsByCategory(slug)` — вопросы категории, отсортированные по `order`
- `getQuestion(category, slug)` — один вопрос: frontmatter + скомпилированный MDX
- `getAdjacentQuestions(category, slug)` — prev/next для навигации между вопросами

## Компонент `<Answer>`

Кастомный MDX-компонент, принимающий `lang: "en" | "ru"`:

- Рендерит блок с бейджем языка (EN синий / RU фиолетовый)
- Внутри — обычный markdown: текст, код, списки, таблицы
- Стилизован через Tailwind: фон `#111`, граница `#222`, скруглённые углы

## Главная страница

`/` — редирект на первый вопрос первой категории (`/javascript-core/closures`).

## Требования к реализации

- Дизайн UI прорабатывается через **frontend-design** skill — для создания качественного, нешаблонного интерфейса
- Компоненты UI строятся на **shadcn/ui** — использовать context7 для актуальной документации по shadcn/ui
- Актуальные версии всех библиотек проверяются через **context7** перед установкой

## Что НЕ входит в скоуп

- Система прогресса / отслеживание
- Авторизация / аккаунты
- Поиск по вопросам
- Светлая тема / переключение тем
- Редактор кода / интерактивное выполнение
- Бэкенд / API
