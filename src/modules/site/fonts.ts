import { FONTS, type FontName } from "./font-names";

type FontMeta = { weights: string; kind: "sans" | "serif" | "display" | "mono" };

/** Weights are what we request from Google Fonts; "kind" picks the fallback stack. */
const META: Record<FontName, FontMeta> = {
  Inter: { weights: "400;500;600;700", kind: "sans" },
  Poppins: { weights: "400;500;600;700", kind: "sans" },
  "Playfair Display": { weights: "500;600;700", kind: "serif" },
  Roboto: { weights: "400;500;700", kind: "sans" },
  Lora: { weights: "400;500;600", kind: "serif" },
  Montserrat: { weights: "400;500;600;700;800", kind: "sans" },
  "Open Sans": { weights: "400;600;700;800", kind: "sans" },
  Lato: { weights: "400;700;900", kind: "sans" },
  Nunito: { weights: "400;600;700;800", kind: "sans" },
  Raleway: { weights: "400;500;600;700;800", kind: "sans" },
  "DM Sans": { weights: "400;500;700", kind: "sans" },
  Manrope: { weights: "400;500;600;700;800", kind: "sans" },
  "Work Sans": { weights: "400;500;600;700", kind: "sans" },
  "Space Grotesk": { weights: "400;500;700", kind: "sans" },
  Merriweather: { weights: "400;700;900", kind: "serif" },
  "Source Serif 4": { weights: "400;600;700", kind: "serif" },
  "Cormorant Garamond": { weights: "400;500;600;700", kind: "serif" },
  "DM Serif Display": { weights: "400", kind: "display" },
  Oswald: { weights: "400;500;600;700", kind: "display" },
  "Bebas Neue": { weights: "400", kind: "display" },
  "JetBrains Mono": { weights: "400;500;700", kind: "mono" },
};

const FALLBACK: Record<FontMeta["kind"], string> = {
  sans: "ui-sans-serif, system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  display: "Impact, 'Arial Narrow', sans-serif",
  mono: "ui-monospace, Menlo, Consolas, monospace",
};

export const isFontName = (v: unknown): v is FontName => typeof v === "string" && (FONTS as readonly string[]).includes(v);

/** CSS font-family value for a known font. Only names from FONTS ever reach CSS. */
export function fontStack(name: FontName): string {
  const meta = META[name] as FontMeta | undefined; // stored data could hold an old or invalid name
  return meta ? `'${name}', ${FALLBACK[meta.kind]}` : FALLBACK.sans;
}

/** One Google Fonts stylesheet URL for just the fonts given (unknown names are ignored). "" when none. */
export function fontsHref(names: Iterable<unknown>): string {
  const used = [...new Set([...names].filter(isFontName))];
  if (used.length === 0) return "";
  const families = used.map((n) => `family=${n.replace(/ /g, "+")}:wght@${META[n].weights}`);
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}
