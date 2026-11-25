# AI Website Studio

Describe a website, let a local AI (Ollama) build it, edit it visually, publish it, or export static files.

## Setup
```powershell
npm install lucide-react jszip
docker compose up -d                 # Postgres (port 5433) + Redis
ollama pull llama3.1                 # or any model you prefer, then set OLLAMA_MODEL in .env
npx prisma migrate dev               # only needed if the schema changed
npm run dev
```
Copy `.env.example` to `.env` (keep your existing DATABASE_URL and NEXTAUTH_SECRET) and add the AI block.

## What is included
- Auth (email/password, Google), dashboard, plan limits enforced on the server
- AI provider layer: Ollama (default) and OpenAI, selected with AI_PROVIDER
- Prompt-to-website generation (validated and sanitized output)
- Renderer: 14 section types, responsive via container queries, light/dark, 5 fonts
- Studio: pages, layers, components (click or drag), canvas with desktop/tablet/mobile frames,
  content editor for every field, style panel (theme, spacing, alignment, background, hide per device),
  undo/redo, autosave, keyboard shortcuts (Ctrl+S, Ctrl+Z, Ctrl+Shift+Z, Delete)
- AI assistant: asks for scoped changes, previews them live on the canvas, you Accept or Reject
- Per-page URL and SEO title/description
- Publish/unpublish to /s/<subdomain>, owner-only preview, static HTML export (.zip)

- Phase E: component library with categories and search, My components (save as component), basic blocks, sandboxed custom code block with Monaco (see PHASE_E.md)

## Not built yet
Email verification and password reset, version history and rollback, templates marketplace,
Stripe billing, e-commerce, analytics, admin dashboard, custom domains, real contact-form delivery.
