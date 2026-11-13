import { z } from "zod";

export const SECTION_TYPES = [
  "navbar", "hero", "about", "features", "menu", "products", "pricing",
  "testimonials", "gallery", "faq", "blog", "contact", "cta", "footer",
] as const;
export const CATEGORIES = [
  "business", "portfolio", "ecommerce", "restaurant", "education", "blog",
  "landing", "agency", "personal", "saas", "realestate",
] as const;
export const FONTS = ["Inter", "Poppins", "Playfair Display", "Roboto", "Lora"] as const;

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
  theme: { primaryColor: string; mode: "light" | "dark"; fontFamily: (typeof FONTS)[number] };
  pages: SitePage[];
};

export type Theme = SiteSpec["theme"];
export type SectionType = (typeof SECTION_TYPES)[number];
