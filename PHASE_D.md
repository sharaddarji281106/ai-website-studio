# Phase D: layout tools

## What was added
- **Grid controls** (Style tab > Layout & spacing) for every card grid: 1-6 columns, gap, vertical alignment. Columns always stack: 1 on phones, 2 on tablets, then your count.
- **Columns block** (new section type): heading plus columns with image, title, text, button. "Plain columns" removes the card look.
- **Starter layouts** on an empty page (empty canvas and Components tab): Header & footer, One column, Two columns. Built from normal blocks, so every tool works on them.
- **Layers panel**: double-click to rename, lock, hide, duplicate, delete, drag to reorder.
- **Locking**: a locked section can't be edited, moved or deleted by the user or by AI proposals until unlocked.
- **Small screens**: below 1024px the side panels become slide-in drawers with a bottom bar ("Add & layers", "Edit & style").
- **Device preview**: the canvas shows the size being previewed (for example "Tablet · 768px").

## Where things are
- `site/style.ts`: new keys `cols`, `gap`, `colAlign`; `__label`, `__locked`; `GRID_TYPES`; `isLocked`.
- `editor/layouts.ts`: starter layouts. `editor/left-panels.tsx`: Layers and Components. `editor/canvas.tsx`, `editor/editor-shell.tsx`: canvas and drawers.
- `renderer/site.css`: "Phase D" block at the end. `renderer/sections/collections.tsx`: `Columns`.
- The AI site generator is not told about the Columns block (generation is unchanged); the AI editor is.

## Not in this phase
Blocks nested inside blocks (true containers), drag-to-resize columns, alignment guides and snapping, and Ctrl+K. Nesting arrives with the component registry in Phase E.

## Test
`npm run test:style` (21 tests).
