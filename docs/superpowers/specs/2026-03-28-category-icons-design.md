# Category Icons in Sidebar

## Summary

Add icons next to category names in the sidebar navigation. Technology categories use devicon SVGs (as inline React components), conceptual categories use lucide-react icons. Icon names are stored in each category's `_meta.json`.

## Scope

Sidebar only (`sidebar-nav.tsx`). No changes to question pages, breadcrumbs, or other views.

## Data Model

### `_meta.json` changes

Add `icon` field to each category's `_meta.json`:

```json
{
  "title": "JavaScript Core",
  "order": 1,
  "description": "...",
  "icon": "javascript"
}
```

### `CategoryMeta` type update

```ts
export interface CategoryMeta {
  title: string;
  order: number;
  description: string;
  slug: string;
  icon?: string;
}
```

`icon` is optional for backwards compatibility — categories without it render no icon.

### `getCategories()` update

Read and pass through the `icon` field from `_meta.json`.

## Icon Mapping

### Devicon icons (technology brands)

| Category | `icon` value | Devicon source |
|---|---|---|
| JavaScript Core | `javascript` | devicon/javascript |
| HTML & CSS | `html5` | devicon/html5 |
| React Basics | `react` | devicon/react |
| TypeScript + React | `typescript` | devicon/typescript |
| Next.js | `nextjs` | devicon/nextjs |

### Lucide icons (concepts)

| Category | `icon` value | Lucide component |
|---|---|---|
| Browser & Network | `globe` | `Globe` |
| Hooks | `fish-hook` | `FishHook` |
| Advanced React | `flask-conical` | `FlaskConical` |
| State Management | `database` | `Database` |
| Performance & Optimization | `gauge` | `Gauge` |
| Testing | `test-tubes` | `TestTubes` |
| Tooling & Architecture | `wrench` | `Wrench` |
| Architecture & System Design | `blocks` | `Blocks` |

## Architecture

### New files

**`src/shared/ui/devicons.tsx`** — Inline SVG React components for the 5 devicon icons. Each component accepts `className` prop for sizing. SVG paths copied from [devicon](https://github.com/devicons/devicon) (MIT license).

### Modified files

1. **`src/entities/category/model/types.ts`** — Add `icon?: string` to `CategoryMeta`
2. **`src/entities/category/lib/get-categories.ts`** — Read `icon` from `_meta.json`
3. **`src/widgets/sidebar/ui/sidebar-nav.tsx`** — Render icon before category title
4. **All 13 `content/*/_meta.json`** — Add `icon` field

### Icon resolution logic

New component or utility in the sidebar that maps an icon string to a React component:

```tsx
// in sidebar-nav.tsx or a small helper
function CategoryIcon({ name, className }: { name: string; className?: string }) {
  // Check devicons first
  const DevIcon = devicons[name];
  if (DevIcon) return <DevIcon className={className} />;

  // Fall back to lucide
  const LucideIcon = lucideIcons[name];
  if (LucideIcon) return <LucideIcon className={className} />;

  return null;
}
```

This keeps the mapping centralized and the sidebar component clean.

## Visual Behavior

- Icon renders at `h-4 w-4` (matching the existing `ChevronRight` size)
- Placed between the `ChevronRight` chevron and the category title text
- Devicon SVGs use `currentColor` to match the text color (active/muted states)
- No icon animation or hover effects beyond the existing button styles

## Testing

- Update existing entity tests if they assert on `CategoryMeta` shape
- Manual visual verification in dev server

## Error Handling

- Missing `icon` field in `_meta.json`: no icon rendered (graceful fallback)
- Unknown icon name: `CategoryIcon` returns `null`
