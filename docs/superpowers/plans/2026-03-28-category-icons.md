# Category Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add icons next to category names in the sidebar — devicon SVGs for technology brands, lucide for concepts.

**Architecture:** Add `icon` field to `_meta.json` and `CategoryMeta` type. Create inline devicon SVG components in `shared/ui`. Build a `CategoryIcon` resolver component used by `sidebar-nav.tsx`.

**Tech Stack:** React 19, lucide-react (already installed), devicon SVGs (inline), Next.js App Router

---

### Task 1: Add devicon SVG components

**Files:**
- Create: `src/shared/ui/devicons.tsx`

- [ ] **Step 1: Create devicon components file**

Create `src/shared/ui/devicons.tsx` with 5 inline SVG React components. Each accepts `className` for sizing and uses `currentColor` for fill so they match surrounding text color.

```tsx
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function JavaScriptIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
      <path
        fill="currentColor"
        d="M116.347 96.736c-.917-5.711-4.641-10.508-15.672-14.981-3.832-1.761-8.104-3.022-9.377-5.926-.452-1.69-.512-2.642-.226-3.665.821-3.32 4.784-4.355 7.925-3.403 2.023.678 3.938 2.237 5.093 4.724 5.402-3.498 5.391-3.475 9.163-5.879-1.381-2.141-2.118-3.129-3.022-4.045-3.249-3.629-7.676-5.498-14.756-5.355l-3.688.477c-3.534.893-6.902 2.748-8.877 5.235-5.926 6.724-4.236 18.492 2.975 23.335 7.104 5.332 17.54 6.545 18.873 11.531 1.297 6.104-4.486 8.08-10.234 7.378-4.236-.881-6.592-3.034-9.139-6.949-4.688 2.713-4.688 2.713-9.508 5.485 1.143 2.499 2.344 3.63 4.26 5.795 9.068 9.198 31.76 8.746 35.83-5.176.165-.478 1.261-3.666.38-8.581zM69.462 58.943H57.753l-.048 30.272c0 6.438.333 12.34-.714 14.149-1.713 3.558-6.152 3.117-8.175 2.427-2.059-1.012-3.106-2.451-4.319-4.485-.333-.584-.583-1.036-.667-1.071l-9.52 5.83c1.583 3.249 3.915 6.069 6.902 7.901 4.462 2.678 10.459 3.499 16.731 2.059 4.082-1.189 7.604-3.652 9.448-7.401 2.666-4.915 2.094-10.864 2.07-17.444.06-10.735.001-21.468.001-32.237z"
      />
    </svg>
  );
}

export function Html5Icon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
      <path
        fill="currentColor"
        d="M19.037 113.876L9.032 1.661h109.936l-10.016 112.198-45.019 12.48z"
      />
      <path
        fill="currentColor"
        opacity={0.8}
        d="M64 116.8l36.378-10.086 8.559-95.878H64z"
      />
    </svg>
  );
}

export function ReactIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
      <g fill="currentColor">
        <circle cx="64" cy="64" r="11.4" />
        <path d="M107.3 45.2c-2.2-.8-4.5-1.6-6.9-2.3.6-2.4 1.1-4.8 1.5-7.1 2.1-13.2-.2-22.5-6.6-26.1-1.9-1.1-4-1.6-6.4-1.6-7 0-15.9 5.2-24.9 13.9-9-8.7-17.9-13.9-24.9-13.9-2.4 0-4.5.5-6.4 1.6-6.4 3.7-8.7 13-6.6 26.1.4 2.3.9 4.7 1.5 7.1-2.4.7-4.7 1.4-6.9 2.3C8.2 50 1.4 56.6 1.4 64s6.9 14 19.3 18.8c2.2.8 4.5 1.6 6.9 2.3-.6 2.4-1.1 4.8-1.5 7.1-2.1 13.2.2 22.5 6.6 26.1 1.9 1.1 4 1.6 6.4 1.6 7.1 0 16-5.2 24.9-13.9 9 8.7 17.9 13.9 24.9 13.9 2.4 0 4.5-.5 6.4-1.6 6.4-3.7 8.7-13 6.6-26.1-.4-2.3-.9-4.7-1.5-7.1 2.4-.7 4.7-1.4 6.9-2.3 12.5-4.8 19.3-11.4 19.3-18.8s-6.8-14-19.3-18.8zM92.5 14.7c4.1 2.4 5.5 9.8 3.8 20.3-.3 2.1-.8 4.3-1.4 6.6-5.2-1.2-10.7-2-16.5-2.5-3.4-4.8-6.9-9.1-10.4-13 7.4-7.3 14.9-12.3 21-12.3 1.3 0 2.5.3 3.5.9zM81.3 74c-1.8 3.2-3.9 6.4-6.1 9.6-3.7.3-7.4.4-11.2.4-3.9 0-7.6-.1-11.2-.4-2.2-3.2-4.2-6.4-6-9.6-1.9-3.3-3.7-6.7-5.3-10 1.6-3.3 3.4-6.7 5.3-10 1.8-3.2 3.9-6.4 6.1-9.6 3.7-.3 7.4-.4 11.2-.4 3.9 0 7.6.1 11.2.4 2.2 3.2 4.2 6.4 6 9.6 1.9 3.3 3.7 6.7 5.3 10-1.7 3.3-3.4 6.6-5.3 10zm8.3-3.3c1.5 3.5 2.7 6.9 3.8 10.3-3.4.8-7 1.4-10.8 1.9 1.2-1.9 2.5-3.9 3.6-6 1.2-2.1 2.3-4.2 3.4-6.2zM64 97.8c-2.4-2.6-4.7-5.4-6.9-8.3 2.3.1 4.6.2 6.9.2 2.3 0 4.6-.1 6.9-.2-2.2 2.9-4.5 5.7-6.9 8.3zm-18.6-15c-3.8-.5-7.4-1.1-10.8-1.9 1.1-3.3 2.3-6.8 3.8-10.3 1.1 2 2.2 4.1 3.4 6.1 1.2 2.2 2.4 4.1 3.6 6.1zm-7-25.5c-1.5-3.5-2.7-6.9-3.8-10.3 3.4-.8 7-1.4 10.8-1.9-1.2 1.9-2.5 3.9-3.6 6-1.2 2.1-2.3 4.2-3.4 6.2zM64 30.2c2.4 2.6 4.7 5.4 6.9 8.3-2.3-.1-4.6-.2-6.9-.2-2.3 0-4.6.1-6.9.2 2.2-2.9 4.5-5.7 6.9-8.3zm22.2 21l-3.6-6c3.8.5 7.4 1.1 10.8 1.9-1.1 3.3-2.3 6.8-3.8 10.3-1.1-2.1-2.2-4.2-3.4-6.2zM31.7 35c-1.7-10.5-.3-17.9 3.8-20.3 1-.6 2.2-.9 3.5-.9 6 0 13.5 4.9 21 12.3-3.5 3.8-7 8.2-10.4 13-5.8.5-11.3 1.4-16.5 2.5-.6-2.3-1-4.5-1.4-6.6zM7 64c0-4.7 5.7-9.7 15.7-13.4 2-.8 4.2-1.5 6.4-2.1 1.6 5 3.6 10.3 6 15.6-2.4 5.3-4.5 10.5-6 15.5C15.3 75.6 7 69.6 7 64zm28.5 49.3c-4.1-2.4-5.5-9.8-3.8-20.3.3-2.1.8-4.3 1.4-6.6 5.2 1.2 10.7 2 16.5 2.5 3.4 4.8 6.9 9.1 10.4 13-7.4 7.3-14.9 12.3-21 12.3-1.3 0-2.5-.3-3.5-.9zM96.3 93c1.7 10.5.3 17.9-3.8 20.3-1 .6-2.2.9-3.5.9-6 0-13.5-4.9-21-12.3 3.5-3.8 7-8.2 10.4-13 5.8-.5 11.3-1.4 16.5-2.5.6 2.3 1 4.5 1.4 6.6zm9-15.6c-2 .8-4.2 1.5-6.4 2.1-1.6-5-3.6-10.3-6-15.6 2.4-5.3 4.5-10.5 6-15.5 13.8 4 22.1 10 22.1 15.6 0 4.7-5.8 9.7-15.7 13.4z" />
      </g>
    </svg>
  );
}

export function TypeScriptIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
      <path
        fill="currentColor"
        d="M1.5 63.91v62.5h125v-125H1.5zm100.73-5a15.56 15.56 0 017.82 4.5 20.58 20.58 0 013 4c0 .16-5.4 3.81-8.69 5.85-.12.08-.6-.44-1.13-1.23a7.09 7.09 0 00-5.87-3.53c-3.79-.26-6.23 1.73-6.21 5a4.58 4.58 0 00.54 2.34c.83 1.73 2.38 2.76 7.24 4.86 8.95 3.85 12.78 6.39 15.16 10 2.66 4 3.25 10.46 1.45 15.24-2 5.2-6.9 8.73-13.83 9.9a38.32 38.32 0 01-9.52-.1 23 23 0 01-12.72-6.63c-1.15-1.27-3.39-4.58-3.25-4.82a9.34 9.34 0 011.15-.73L82 101l3.59-2.08.75 1.11a16.78 16.78 0 004.74 4.54c4 2.1 9.46 1.81 12.16-.62a5.43 5.43 0 00.69-6.92c-1-1.39-3-2.56-8.59-5-6.45-2.78-9.23-4.5-11.77-7.24a16.48 16.48 0 01-3.43-6.25 25 25 0 01-.22-8c1.33-6.23 6-10.58 12.82-11.87a31.66 31.66 0 019.49.26zm-29.34 5.24v5.12H56.66v46.23H45.15V69.26H28.88v-5a49.19 49.19 0 01.12-5.17C29.08 59 39 59 51 59h21.83z"
      />
    </svg>
  );
}

export function NextjsIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
      <circle cx="64" cy="64" r="64" fill="currentColor" />
      <path
        fill="var(--sidebar-background, white)"
        d="M106.317 112.014 49.167 38.4H38.4v51.179h8.614v-40.24l52.54 67.884a64.216 64.216 0 0 0 6.763-5.209z"
      />
      <path
        fill="var(--sidebar-background, white)"
        d="M81.778 38.4h8.533v51.2h-8.533z"
      />
    </svg>
  );
}

export const devicons: Record<string, React.ComponentType<IconProps>> = {
  javascript: JavaScriptIcon,
  html5: Html5Icon,
  react: ReactIcon,
  typescript: TypeScriptIcon,
  nextjs: NextjsIcon,
};
```

- [ ] **Step 2: Verify file compiles**

Run: `bunx tsc --noEmit src/shared/ui/devicons.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/shared/ui/devicons.tsx
git commit -m "feat: add inline devicon SVG components for category icons"
```

---

### Task 2: Update CategoryMeta type and getCategories

**Files:**
- Modify: `src/entities/category/model/types.ts`
- Modify: `src/entities/category/lib/get-categories.ts`
- Modify: `tests/entities/category/get-categories.test.ts`

- [ ] **Step 1: Write test for icon field**

Add a test to `tests/entities/category/get-categories.test.ts`:

```ts
it("categories with icon field include it in result", async () => {
  const categories = await getCategories();
  const jsCategory = categories.find((c) => c.slug === "javascript-core");

  expect(jsCategory).toBeDefined();
  expect(jsCategory!.icon).toBe("javascript");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run tests/entities/category/get-categories.test.ts`
Expected: FAIL — `icon` property does not exist on `CategoryMeta`

- [ ] **Step 3: Add icon to CategoryMeta type**

Update `src/entities/category/model/types.ts`:

```ts
export interface CategoryMeta {
  title: string;
  order: number;
  description: string;
  slug: string;
  icon?: string;
}
```

- [ ] **Step 4: Read icon in getCategories**

In `src/entities/category/lib/get-categories.ts`, update the object pushed to `categories`:

```ts
categories.push({
  title: meta.title,
  order: meta.order,
  description: meta.description,
  slug: entry.name,
  icon: meta.icon,
});
```

- [ ] **Step 5: Add icon to javascript-core _meta.json (needed for test)**

Update `content/javascript-core/_meta.json`:

```json
{
  "title": "JavaScript Core",
  "order": 1,
  "description": "Замыкания, прототипы, Event Loop, промисы, async/await, this, ES6+",
  "icon": "javascript"
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `bunx vitest run tests/entities/category/get-categories.test.ts`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add src/entities/category/model/types.ts src/entities/category/lib/get-categories.ts tests/entities/category/get-categories.test.ts content/javascript-core/_meta.json
git commit -m "feat: add icon field to CategoryMeta type and getCategories"
```

---

### Task 3: Add icon field to all remaining _meta.json files

**Files:**
- Modify: `content/html-css/_meta.json` — add `"icon": "html5"`
- Modify: `content/browser-network/_meta.json` — add `"icon": "globe"`
- Modify: `content/react-basics/_meta.json` — add `"icon": "react"`
- Modify: `content/hooks/_meta.json` — add `"icon": "fishing-hook"`
- Modify: `content/advanced-react/_meta.json` — add `"icon": "flask-conical"`
- Modify: `content/state-management/_meta.json` — add `"icon": "database"`
- Modify: `content/typescript-react/_meta.json` — add `"icon": "typescript"`
- Modify: `content/performance/_meta.json` — add `"icon": "gauge"`
- Modify: `content/testing/_meta.json` — add `"icon": "test-tubes"`
- Modify: `content/nextjs/_meta.json` — add `"icon": "nextjs"`
- Modify: `content/tooling-architecture/_meta.json` — add `"icon": "wrench"`
- Modify: `content/architecture-system-design/_meta.json` — add `"icon": "blocks"`

- [ ] **Step 1: Add icon to each _meta.json**

For each file, add `"icon": "<value>"` as the last field before the closing `}`. Example for `content/html-css/_meta.json`:

```json
{
  "title": "HTML & CSS",
  "order": 2,
  "description": "...",
  "icon": "html5"
}
```

Complete mapping:
- `html-css` → `"html5"`
- `browser-network` → `"globe"`
- `react-basics` → `"react"`
- `hooks` → `"fishing-hook"`
- `advanced-react` → `"flask-conical"`
- `state-management` → `"database"`
- `typescript-react` → `"typescript"`
- `performance` → `"gauge"`
- `testing` → `"test-tubes"`
- `nextjs` → `"nextjs"`
- `tooling-architecture` → `"wrench"`
- `architecture-system-design` → `"blocks"`

- [ ] **Step 2: Run tests to verify nothing broke**

Run: `bunx vitest run tests/entities/category/get-categories.test.ts`
Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add content/*/_meta.json
git commit -m "content: add icon field to all category _meta.json files"
```

---

### Task 4: Add CategoryIcon component and integrate into sidebar

**Files:**
- Modify: `src/widgets/sidebar/ui/sidebar-nav.tsx`

- [ ] **Step 1: Add CategoryIcon component and lucide imports**

At the top of `src/widgets/sidebar/ui/sidebar-nav.tsx`, add imports:

```tsx
import {
  Globe,
  FishingHook,
  FlaskConical,
  Database,
  Gauge,
  TestTubes,
  Wrench,
  Blocks,
} from "lucide-react";
import { devicons } from "@/shared/ui/devicons";
import type { ComponentType, SVGProps } from "react";
```

Add the lucide icon map and CategoryIcon component before `SidebarNav`:

```tsx
const lucideIcons: Record<string, ComponentType<{ className?: string }>> = {
  globe: Globe,
  "fishing-hook": FishingHook,
  "flask-conical": FlaskConical,
  database: Database,
  gauge: Gauge,
  "test-tubes": TestTubes,
  wrench: Wrench,
  blocks: Blocks,
};

function CategoryIcon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  if (!name) return null;

  const DevIcon = devicons[name];
  if (DevIcon) return <DevIcon className={className} />;

  const LucideIcon = lucideIcons[name];
  if (LucideIcon) return <LucideIcon className={className} />;

  return null;
}
```

- [ ] **Step 2: Render CategoryIcon in the sidebar button**

In the category button, add `<CategoryIcon>` between the `<ChevronRight>` and `{category.title}`:

```tsx
<button
  onClick={() => toggleCategory(category.slug)}
  aria-expanded={!isCollapsed}
  className={cn(
    "flex w-full items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
    hasActiveQuestion
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground"
  )}
>
  <ChevronRight
    className={cn(
      "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
      !isCollapsed && "rotate-90"
    )}
  />
  <CategoryIcon name={category.icon} className="h-4 w-4 shrink-0" />
  {category.title}
</button>
```

- [ ] **Step 3: Run build to verify no errors**

Run: `bun run build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Visual verification**

Run: `bun dev`
Open `http://localhost:3000` and verify:
- Each category in the sidebar shows an icon between the chevron and the title
- Devicon icons (JS, HTML, React, TS, Next.js) render as recognizable brand shapes
- Lucide icons render for concept categories
- Icons follow text color (muted when inactive, foreground when active)
- Collapsed/expanded states work correctly
- Mobile sidebar also shows icons

- [ ] **Step 5: Commit**

```bash
git add src/widgets/sidebar/ui/sidebar-nav.tsx
git commit -m "feat: render category icons in sidebar navigation"
```

---

### Task 5: Final verification

- [ ] **Step 1: Run all tests**

Run: `bun run test`
Expected: All tests pass

- [ ] **Step 2: Run lint**

Run: `bun run lint`
Expected: No errors

- [ ] **Step 3: Run production build**

Run: `bun run build`
Expected: Build succeeds
