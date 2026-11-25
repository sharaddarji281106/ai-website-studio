import { z } from "zod";
import { FONTS, type FontName } from "./font-names";
export { FONTS };
export type { FontName };

export const SECTION_TYPES = [
  "navbar", "hero", "about", "features", "columns", "menu", "products", "pricing",
  "testimonials", "gallery", "faq", "blog", "contact", "cta", "footer",
  // Phase E: basic blocks and the sandboxed custom-code block
  "text", "button", "image", "spacer", "code",
] as const;

/** Blocks the AI may never create, edit, or read (the user writes code by hand; the AI never runs or writes code). */
export const AI_BLOCKED_TYPES = ["code"] as const;
export const AI_ALLOWED_TYPES = SECTION_TYPES.filter((t) => !(AI_BLOCKED_TYPES as readonly string[]).includes(t));
/** Types the site generator is told about (it is not told about the hand-built blocks). */
export const AI_GENERATE_TYPES = SECTION_TYPES.filter((t) => !["columns", "text", "button", "image", "spacer", "code"].includes(t));
export const CATEGORIES = [
  "business", "portfolio", "ecommerce", "restaurant", "education", "blog",
  "landing", "agency", "personal", "saas", "realestate",
] as const;

/** Raw shape we ask the AI for (lenient; normalize() tightens it). */
export const rawSpecSchema = z.object({
  siteName: z.string().min(1).max(80),
  category: z.string().default("business"),
  theme: z
    .object({
      primaryColor: z.string().default("#4f46e5"),
      mode: z.string().default("light"),
      fontFamily: z.string().default("Inter"),
    })
    .default({ primaryColor: "#4f46e5", mode: "light", fontFamily: "Inter" }),
  pages: z
    .array(
      z.object({
        name: z.string().min(1).max(60),
        slug: z.string().max(60).optional(),
        sections: z.array(z.object({ type: z.string(), props: z.record(z.string(), z.unknown()).default({}) })).max(20),
      }),
    )
    .min(1)
    .max(8),
});

export type Section = { id: string; type: (typeof SECTION_TYPES)[number]; props: Record<string, unknown> };
export type SitePage = { name: string; slug: string; sections: Section[] };
export type SiteSpec = {
  siteName: string;
  category: (typeof CATEGORIES)[number];
  theme: { primaryColor: string; mode: "light" | "dark"; fontFamily: FontName; headingFont?: FontName };
  pages: SitePage[];
};

export type Theme = SiteSpec["theme"];
export type SectionType = (typeof SECTION_TYPES)[number];
