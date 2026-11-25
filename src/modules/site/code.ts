/**
 * Phase E: the custom code block. Users write HTML, CSS and JS; it ONLY ever runs inside a sandboxed iframe
 * (no allow-same-origin => opaque origin: no cookies, no storage, no access to the studio or the parent page).
 * The AI can never create, edit or read these blocks (see AI_BLOCKED_TYPES in schema.ts).
 */
export const CODE_LIMITS = { html: 60_000, css: 30_000, js: 60_000, minHeight: 80, maxHeight: 1600, defaultHeight: 320 } as const;

/** Only scripts: no forms, popups, top navigation, downloads or same-origin access. */
export const CODE_SANDBOX = "allow-scripts";

/** Inside the iframe. connect-src is 'none' so a block cannot send data anywhere; relax it here if you add a trusted use case. */
export const CODE_CSP = [
  "default-src 'none'",
  "img-src https: data: blob:",
  "media-src https: data: blob:",
  "font-src https://fonts.gstatic.com data:",
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join("; ");

export type CodeProps = { html: string; css: string; js: string; height: number };

export const DEFAULT_CODE: CodeProps = {
  html: '<div class="box">\n  <h3>Hello from custom code</h3>\n  <p>Edit the HTML, CSS and JS in the code editor.</p>\n  <button id="b">Click me</button>\n</div>',
  css: ".box { font-family: system-ui, sans-serif; text-align: center; padding: 24px; }\nbutton { padding: 10px 18px; border: 0; border-radius: 8px; background: #4f46e5; color: #fff; cursor: pointer; }",
  js: 'document.getElementById("b").addEventListener("click", function () {\n  this.textContent = "Clicked!";\n});',
  height: CODE_LIMITS.defaultHeight,
};

const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\0/g, "").slice(0, max) : "");

export function cleanHeight(v: unknown): number {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return CODE_LIMITS.defaultHeight;
  return Math.round(Math.min(CODE_LIMITS.maxHeight, Math.max(CODE_LIMITS.minHeight, n)));
}

/** Keeps the code as written (no tag stripping: it is code), but caps sizes and fixes types. */
export function cleanCodeProps(props: Record<string, unknown>): Record<string, unknown> {
  return {
    html: text(props.html, CODE_LIMITS.html),
    css: text(props.css, CODE_LIMITS.css),
    js: text(props.js, CODE_LIMITS.js),
    height: cleanHeight(props.height),
  };
}

/** The full document placed in the iframe's srcdoc. The CSP meta comes first so it applies to everything after it. */
export function buildCodeSrcDoc(p: { html?: unknown; css?: unknown; js?: unknown }): string {
  const html = text(p.html, CODE_LIMITS.html);
  const css = text(p.css, CODE_LIMITS.css);
  const js = text(p.js, CODE_LIMITS.js).replace(/<\/script/gi, "<\\/script");
  return (
    `<!doctype html><html><head><meta charset="utf-8">` +
    `<meta http-equiv="Content-Security-Policy" content="${CODE_CSP}">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<style>html,body{margin:0}${css}</style></head><body>${html}` +
    (js ? `<script>${js}</script>` : "") +
    `</body></html>`
  );
}
