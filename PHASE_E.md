# Phase E: component library, save as component, custom code block

## What was added
- **Library panel** (left tab "Library", open by default in Manual Build Mode): search, blocks grouped by category, and a **My components** tab.
- **Basic blocks** (new): Text, Button, Image, Spacer/divider. Tight default spacing so a page can be built from small pieces.
- **Save as component**: select a block, "Save as component", name it. It appears under My components (click or drag to add; rename; delete). Stored per user in the database, usable on any page or site. Saved copies are always unlocked. Limits per plan are in `lib/plans.ts` (`maxSavedComponents`: 5 / 50 / 500).
- **Custom code block** (Advanced > Custom code): HTML, CSS and JS edited in a full-screen **Monaco** editor with a live interactive preview. Undo/redo and autosave work as for every other edit.

## Safety rules (important)
- Code runs ONLY in `<iframe sandbox="allow-scripts">` with no `allow-same-origin`: no cookies, storage, access to the studio or the parent page, no forms, popups or navigation.
- A CSP inside the frame blocks all network requests (`connect-src 'none'`), and only allows scripts from cdnjs.cloudflare.com and cdn.jsdelivr.net. Change `CODE_CSP` in `site/code.ts` if you decide to allow more.
- The AI can never create, edit, remove or read a code block (`AI_BLOCKED_TYPES` in `site/schema.ts`; enforced in generation, AI edit normalizing, the client apply step, and the payload sent to the AI is redacted).
- The save route used to strip `<` `>` and cap every string at 2,000 characters. Code blocks now go through `sanitizeSectionProps` (`site/sanitize-section.ts`): code is kept as written but capped (HTML 60k, CSS 30k, JS 60k characters, height 80-1600), and block styles are still validated. Every other block is sanitized exactly as before.
- In the editor canvas the code frame ignores clicks (so you can select the block); published and exported sites are fully interactive.

## Where things are
- `site/code.ts` (limits, CSP, srcdoc builder), `site/sanitize.ts`, `site/sanitize-section.ts`
- `renderer/sections/basic.tsx`, "Phase E" block at the end of `renderer/site.css`
- `editor/library-panel.tsx`, `library-store.ts`, `code-editor.tsx`; `store.insertSections`
- `app/api/components` (GET/POST) and `app/api/components/[id]` (PATCH/DELETE), all scoped to the signed-in user
- Prisma model `SavedComponent`

## Setup after copying the files
```powershell
npm install                 # adds @monaco-editor/react
npx prisma migrate dev --name saved_components   # commit the new migration folder; Render runs `db:deploy`
npm run test:style          # 26 tests
```
Monaco loads its files from the jsDelivr CDN at runtime (the library's default).

## Not in this phase
- True nested containers (blocks inside blocks). The document is still a flat list of sections; "Save as component" saves one section at a time.
- Saving several selected blocks as one component, embeds (YouTube, Maps, Calendly: Phase F), icon/list/divider-style extras beyond Spacer.
- AI-made components (Phase G).
