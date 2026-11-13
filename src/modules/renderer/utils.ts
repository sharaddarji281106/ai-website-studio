export type Rec = Record<string, unknown>;

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
export const str = (v: unknown): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");
export const arr = (v: unknown): Rec[] => (Array.isArray(v) ? v.filter((x): x is Rec => !!x && typeof x === "object") : []);
export const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/** Only http(s), mailto, tel, in-page and internal links are ever rendered. */
export function resolveHref(base: string, h: unknown): string {
  const s = typeof h === "string" ? h.trim() : "";
  if (!s || s === "#") return "#";
  if (/^(https?:|mailto:|tel:)/i.test(s) || s.startsWith("#")) return s;
  if (s.startsWith("/")) return s === "/" ? base || "/" : `${base}${s}`;
  return "#";
}
export const isExternal = (h: unknown) => typeof h === "string" && /^https?:/i.test(h.trim());
