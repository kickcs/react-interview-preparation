# Content & Readability Improvements — Design Spec

## Goal

Improve the reading experience for question/answer content: better code blocks, visual hierarchy, answer card styling, and a page-level toggle for revealing all answers.

## Scope

5 changes to the question view. No new pages, no new routes, no architectural changes.

## 1. Code Blocks — Typography + Line Numbers

**Problem:** Code font is small (13px), tight line-height (1.5), no line numbers.

**Solution:**

- Font size: 13px → 14px
- Line-height: 1.5 → 1.7
- Padding: increase to 12–16px accounting for line number gutter
- Line numbers: muted color (`#585b70` / tailwind `text-muted-foreground/40`), right-aligned, `user-select: none` (not copied on select)

**Implementation:**

- Enable `showLineNumbers` in rehype-pretty-code config (`src/shared/lib/mdx.ts` or wherever MDX config lives)
- Add CSS in `globals.css` targeting `[data-rehype-pretty-code-figure]` for font-size, line-height, and line number styling
- Line numbers come from rehype-pretty-code's built-in `data-line-numbers` attribute — style via CSS counters or the plugin's native output

**Files:** `globals.css`, MDX config (rehype-pretty-code options)

## 2. Answer Cards EN/RU

**Problem:** EN/RU answers in `<AnswerGroup>` are plain text blocks without visual distinction. They blend into surrounding content.

**Solution:**

- Each `<Answer>` rendered inside a card with:
  - EN: `bg-blue-500/6`, `border border-blue-500/15`, `rounded-[10px]`, `p-5`
  - RU: `bg-violet-500/6`, `border border-violet-500/15`, `rounded-[10px]`, `p-5`
- Language badge in top-left: uppercase, small (`text-[11px]`), matching color scheme
  - EN badge: `bg-blue-500/15 text-blue-400`
  - RU badge: `bg-violet-500/15 text-violet-400`
- `<AnswerGroup>` remains 2-column grid on desktop, 1-column on mobile

**Files:** `src/shared/ui/answer.tsx`, `src/shared/ui/answer-group.tsx`

## 3. Visual Separators

**Problem:** Content sections (title, answers, prose, code, navigation) run together without clear boundaries. Feels "flat."

**Solution:**

- Gradient horizontal rule between major sections:
  ```css
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent);
  height: 1px;
  ```
- Applied between: title block → answer area, answer area → prose content, prose/code → navigation
- Implementation: a simple `<Separator />` component or CSS class `.content-separator`

**Files:** `src/widgets/question-view/ui/question-view.tsx` (add separators between sections), `globals.css` (separator style)

## 4. Improved Prose Typography

**Problem:** Default prose styles lack visual hierarchy. Text feels uniform.

**Solution:**

- Base font-size: 15px (from default ~14px)
- Line-height: 1.8
- Headings (h2/h3 inside prose): add `border-bottom: 1px solid rgba(255,255,255,0.06)` and `padding-bottom: 8px` for visual anchoring
- List items: `margin-bottom: 8px` for breathing room
- Inline code: `bg-white/6`, `px-[7px] py-[2px]`, `rounded`, monospace 13.5px

**Implementation:** Override `.prose` styles in `globals.css` under `.dark .prose` selector. All changes are CSS-only.

**Files:** `globals.css`

## 5. Toggle "Show All Answers"

**Problem:** Users must click each spoiler individually. For study mode, they want all answers visible at once.

**Solution:**

- New button above the content area (below title, above first separator):
  - Icon: Eye / EyeOff (lucide)
  - Text: "Показать все ответы" / "Скрыть все ответы"
  - Style: `bg-indigo-500/8 border border-indigo-500/15 rounded-lg px-3.5 py-2.5`
  - Text color: `text-indigo-400`
- Behavior: toggles all spoilers on the current page
- State: new `allRevealed` field in Zustand UI store (per-page, not persisted to localStorage)

**Implementation:**

- Add `revealAllQuestions` / `hideAllQuestions` actions to `ui-store.ts`
- New `<ToggleAllAnswers>` client component in `src/widgets/question-view/ui/`
- Spoiler component reads from store: if `allRevealed[pageId]` is true, force open regardless of individual toggle state

**Files:** `src/shared/lib/ui-store.ts`, new `src/widgets/question-view/ui/toggle-all-answers.tsx`, `src/shared/ui/spoiler.tsx` (read allRevealed state), `src/widgets/question-view/ui/question-view.tsx` (place toggle)

## Non-Goals

- No bookmarks, no floating TOC, no term highlighting
- No reading modes (study/exam)
- No progress tracking
- No changes to sidebar, routing, or data layer
- No light theme changes (app is dark-only)

## Technical Notes

- All visual changes are CSS or component-level — no data model changes
- rehype-pretty-code line numbers are a config flag + CSS styling
- Zustand store changes are additive (new fields, no breaking changes)
- No new dependencies required
