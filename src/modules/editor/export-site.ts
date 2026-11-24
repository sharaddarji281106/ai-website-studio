"use client";
import { fontsHref } from "@/modules/site/fonts";
import { usedFonts } from "@/modules/site/style";
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

/** Builds a static multi-page website (HTML + one CSS file) and downloads it as a .zip. */
export async function exportSiteZip(doc: Doc) {
  const [{ renderToStaticMarkup }, { default: JSZip }, { SitePageView }] = await Promise.all([
    import("react-dom/server"),
    import("jszip"),
    import("@/modules/renderer/site-view"),
  ]);
  const { createElement } = await import("react");

  const css = collectSiteCss();
  // one stylesheet link for every font the whole site uses (pages are rendered with loadFonts: false below)
  const fontLink = fontsHref(doc.pages.flatMap((p) => usedFonts(doc.theme, p.sections)));
  const home = doc.pages.find((p) => p.isHome) ?? doc.pages[0];
  const fileFor = (p: { id: string; slug: string }) => (p.id === home.id ? "index.html" : `${p.slug}.html`);

  const zip = new JSZip();
  zip.file("styles.css", css);

  for (const page of doc.pages) {
    let body = renderToStaticMarkup(createElement(SitePageView, { theme: doc.theme, sections: page.sections, base: "", live: true, loadFonts: false }));
    // internal links -> relative .html files
    body = body.replace(/href="\/([a-z0-9-]*)"/g, (_m, slug: string) => {
      const target = slug === "" || slug === home.slug ? home : doc.pages.find((p) => p.slug === slug);
      return `href="${target ? fileFor(target) : "#"}"`;
    });
    const title = (page.seo.title || `${page.name} | ${doc.name}`).replace(/[<>&"]/g, "");
    const desc = (page.seo.description || "").replace(/[<>&"]/g, "");
    zip.file(
      fileFor(page),
      `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${title}</title>\n${desc ? `<meta name="description" content="${desc}">\n` : ""}<link rel="preconnect" href="https://fonts.googleapis.com">\n${fontLink ? `<link href="${fontLink}" rel="stylesheet">` : ""}\n<link rel="stylesheet" href="styles.css">\n<style>html,body{margin:0}</style>\n</head>\n<body>\n${body}\n</body>\n</html>\n`,
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
