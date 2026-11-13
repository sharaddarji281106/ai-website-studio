"use client";
import type { Doc } from "./types";

/** Collects only the rendered-site CSS (the .site-root / .st-* rules) from the page's stylesheets. */
function collectSiteCss(): string {
  const out: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const r of Array.from(rules)) {
      if (/\.site-root|\.st-/.test(r.cssText)) out.push(r.cssText);
    }
  }
  return out.join("\n");
}

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&family=Roboto:wght@400;500;700&family=Lora:wght@400;500;600&display=swap";

/** Builds a static multi-page website (HTML + one CSS file) and downloads it as a .zip. */
export async function exportSiteZip(doc: Doc) {
  const [{ renderToStaticMarkup }, { default: JSZip }, { SitePageView }] = await Promise.all([
    import("react-dom/server"),
    import("jszip"),
    import("@/modules/renderer/site-view"),
  ]);
  const { createElement } = await import("react");

  const css = collectSiteCss();
  const home = doc.pages.find((p) => p.isHome) ?? doc.pages[0];
  const fileFor = (p: { id: string; slug: string }) => (p.id === home.id ? "index.html" : `${p.slug}.html`);

  const zip = new JSZip();
  zip.file("styles.css", css);

  for (const page of doc.pages) {
    let body = renderToStaticMarkup(createElement(SitePageView, { theme: doc.theme, sections: page.sections, base: "", live: true }));
    // internal links -> relative .html files
    body = body.replace(/href="\/([a-z0-9-]*)"/g, (_m, slug: string) => {
      const target = slug === "" || slug === home.slug ? home : doc.pages.find((p) => p.slug === slug);
      return `href="${target ? fileFor(target) : "#"}"`;
    });
    const title = (page.seo.title || `${page.name} | ${doc.name}`).replace(/[<>&"]/g, "");
    const desc = (page.seo.description || "").replace(/[<>&"]/g, "");
    zip.file(
      fileFor(page),
      `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${title}</title>\n${desc ? `<meta name="description" content="${desc}">\n` : ""}<link rel="preconnect" href="https://fonts.googleapis.com">\n<link href="${FONT_LINK}" rel="stylesheet">\n<link rel="stylesheet" href="styles.css">\n<style>html,body{margin:0}</style>\n</head>\n<body>\n${body}\n</body>\n</html>\n`,
    );
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "website"}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
