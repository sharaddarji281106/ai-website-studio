import { randomUUID } from "crypto";
import { slugify } from "@/lib/slug";
import { AIError } from "@/modules/ai/errors";
import { AI_ALLOWED_TYPES, CATEGORIES, FONTS, rawSpecSchema, type SiteSpec } from "./schema";
import { sanitizeDeep } from "./sanitize";
import { cleanSectionProps } from "./style";

export { sanitizeDeep } from "./sanitize";

export function normalizeSpec(raw: unknown): SiteSpec {
  const parsed = rawSpecSchema.safeParse(raw);
  if (!parsed.success) throw new AIError("AI_BAD_OUTPUT", parsed.error.message);
  const s = parsed.data;

  const used = new Set<string>();
  const pages = s.pages
    .map((p) => {
      const sections = p.sections
        .filter((sec) => (AI_ALLOWED_TYPES as readonly string[]).includes(sec.type))
        .map((sec) => ({
          id: randomUUID(),
          type: sec.type as (typeof AI_ALLOWED_TYPES)[number],
          props: cleanSectionProps(sanitizeDeep(sec.props) as Record<string, unknown>, { allowImage: false }),
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
