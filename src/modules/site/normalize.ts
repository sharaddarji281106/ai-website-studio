import { randomUUID } from "crypto";
import { slugify } from "@/lib/slug";
import { AIError } from "@/modules/ai/errors";
import { CATEGORIES, FONTS, SECTION_TYPES, rawSpecSchema, type SiteSpec } from "./schema";

/** Strip markup and dangerous URL schemes from AI output; cap sizes. */
export function sanitizeDeep(v: unknown, depth = 0): unknown {
  if (depth > 8) return null;
  if (typeof v === "string") {
    const s = v.replace(/[<>]/g, "").slice(0, 2000);
    return /^\s*(javascript|data|vbscript):/i.test(s) ? "" : s;
  }
  if (typeof v === "number" || typeof v === "boolean" || v === null) return v;
  if (Array.isArray(v)) return v.slice(0, 50).map((x) => sanitizeDeep(x, depth + 1));
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .slice(0, 40)
        .map(([k, val]) => [k.slice(0, 60), sanitizeDeep(val, depth + 1)]),
    );
  }
  return null;
}

export function normalizeSpec(raw: unknown): SiteSpec {
  const parsed = rawSpecSchema.safeParse(raw);
  if (!parsed.success) throw new AIError("AI_BAD_OUTPUT", parsed.error.message);
  const s = parsed.data;

  const used = new Set<string>();
  const pages = s.pages
    .map((p) => {
      const sections = p.sections
        .filter((sec) => (SECTION_TYPES as readonly string[]).includes(sec.type))
        .map((sec) => ({
          id: randomUUID(),
          type: sec.type as (typeof SECTION_TYPES)[number],
          props: sanitizeDeep(sec.props) as Record<string, unknown>,
        }));
      let slug = slugify(p.slug || p.name);
      let n = 2;
      while (used.has(slug)) slug = `${slugify(p.slug || p.name)}-${n++}`;
      used.add(slug);
      return { name: String(sanitizeDeep(p.name)), slug, sections };
    })
    .filter((p) => p.sections.length > 0);

  if (pages.length === 0) throw new AIError("AI_BAD_OUTPUT", "No usable pages");

  return {
    siteName: String(sanitizeDeep(s.siteName)),
    category: (CATEGORIES as readonly string[]).includes(s.category) ? (s.category as SiteSpec["category"]) : "business",
    theme: {
      primaryColor: /^#[0-9a-fA-F]{6}$/.test(s.theme.primaryColor) ? s.theme.primaryColor : "#4f46e5",
      mode: s.theme.mode === "dark" ? "dark" : "light",
      fontFamily: (FONTS as readonly string[]).includes(s.theme.fontFamily) ? (s.theme.fontFamily as SiteSpec["theme"]["fontFamily"]) : "Inter",
    },
    pages,
  };
}
