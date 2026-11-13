# Modules

Each domain gets its own folder under `src/modules/<name>` (components, server logic, types, hooks).
Planned: ai-generation, ai-editing, renderer, editor, components-lib, code-editor, projects,
publishing, billing, analytics, templates, admin.
Rule: modules talk through exported functions/types only; no cross-importing internals.
