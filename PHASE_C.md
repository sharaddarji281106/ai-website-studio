# Phase C: property panel (typography, spacing, colors, background, borders, responsive)

Works on any section, including blocks added by hand on a blank canvas (Manual Build Mode). No AI is involved.

## Where things are
- `src/modules/site/style.ts`: the style model (`props.__style`), validation (`cleanStyle`), per-device helpers, and `sectionRender()` (style -> class names + CSS variables).
- `src/modules/site/fonts.ts`, `font-names.ts`: 21 curated Google Fonts; only fonts a page uses are requested.
- `src/modules/editor/style-panel.tsx`: the Style tab. Device switch (Desktop/Tablet/Mobile) decides which screen size you are editing.
- `src/modules/renderer/site.css`: "Phase C" block at the end. Classes are added only when an option is set, so untouched sections render as before.
- Save route, AI normalizers and `ops.ts` all pass styles through `cleanStyle`.

## Behavior to know
- Responsive values: padding, margin, heading size, body size. Tablet inherits desktop; mobile inherits tablet.
- Styles are validated on save and again on render (hex colors, clamped numbers, fixed font list, https/relative image URLs only).
- AI style edits are merged into the existing `__style`; the AI cannot set background image URLs.
- Theme gets an optional `headingFont`.

## Test
`npm run test:style` (compiles `style.ts` and runs 17 unit tests with Node's built-in runner; adds no dependencies).

## Not in this phase (planned later)
Video/parallax backgrounds, gradient text, hover colors, global H1-H6 type scale, per-device alignment, uploaded images (asset manager).
