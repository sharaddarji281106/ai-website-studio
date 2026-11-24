import type { CSSProperties } from "react";
import { onColor } from "../renderer/theme";
import type { FontName } from "./font-names";
import { fontStack, isFontName } from "./fonts";
import type { SectionType } from "./schema";

/**
 * Phase C: one validated style model for every section, used by the property panel, the renderer,
 * the save route and the AI. It lives in `props.__style`, so it works the same on AI-generated and
 * blank-canvas (Manual Build Mode) sites, and older sites that only have pad/align/bg keep working.
 *
 * Safety: nothing from the document reaches CSS unless it passes cleanStyle(): colors are 6-digit hex,
 * numbers are clamped, fonts come from a fixed list, enums are checked and URLs are restricted.
 */

export type Device = "desktop" | "tablet" | "mobile";

export const PADS = ["none", "sm", "md", "lg"] as const;
export const ALIGNS = ["default", "left", "center", "right"] as const;
export const BGS = ["default", "muted", "primary", "dark"] as const;
export const WIDTHS = ["narrow", "default", "wide", "full"] as const;
export const TRANSFORMS = ["none", "uppercase", "capitalize"] as const;
export const BORDER_STYLES = ["solid", "dashed", "dotted"] as const;
export const SHADOWS = ["none", "sm", "md", "lg"] as const;
export const BG_SIZES = ["cover", "contain"] as const;
export const BG_POSITIONS = ["center", "top", "bottom", "left", "right"] as const;
export const COL_ALIGNS = ["start", "center", "end"] as const;
export const WEIGHTS = [300, 400, 500, 600, 700, 800, 900] as const;

/** Values that can differ per device. Tablet inherits desktop; mobile inherits tablet. */
export const RESPONSIVE_KEYS = ["padTop", "padBottom", "marginTop", "marginBottom", "headingSize", "bodySize"] as const;
export type ResponsiveKey = (typeof RESPONSIVE_KEYS)[number];
export type Responsive = Partial<Record<ResponsiveKey, number>>;

export type SectionStyle = {
  // presets (original keys, still supported)
  pad?: (typeof PADS)[number];
  align?: (typeof ALIGNS)[number];
  bg?: (typeof BGS)[number];
  // layout and spacing
  width?: (typeof WIDTHS)[number];
  padTop?: number;
  padBottom?: number;
  marginTop?: number;
  marginBottom?: number;
  marginX?: number;
  // typography
  headingFont?: FontName;
  bodyFont?: FontName;
  headingSize?: number;
  bodySize?: number;
  headingWeight?: number;
  bodyWeight?: number;
  headingLineHeight?: number;
  bodyLineHeight?: number;
  headingSpacing?: number;
  headingTransform?: (typeof TRANSFORMS)[number];
  // colors
  textColor?: string;
  headingColor?: string;
  accentColor?: string;
  // background
  bgColor?: string;
  bgGradient?: { from: string; to: string; angle: number };
  bgImage?: string;
  bgOverlay?: number;
  bgSize?: (typeof BG_SIZES)[number];
  bgPosition?: (typeof BG_POSITIONS)[number];
  // border and effects
  borderWidth?: number;
  borderStyle?: (typeof BORDER_STYLES)[number];
  borderColor?: string;
  radius?: number;
  shadow?: (typeof SHADOWS)[number];
  opacity?: number;
  // grid (any section with a card grid, and the Columns block)
  cols?: number;
  gap?: number;
  colAlign?: (typeof COL_ALIGNS)[number];
  // per-device overrides
  responsive?: { tablet?: Responsive; mobile?: Responsive };
};

export type Hide = { desktop?: true; tablet?: true; mobile?: true };

export const RANGE = {
  padTop: { min: 0, max: 320, step: 4 },
  padBottom: { min: 0, max: 320, step: 4 },
  marginTop: { min: 0, max: 240, step: 4 },
  marginBottom: { min: 0, max: 240, step: 4 },
  marginX: { min: 0, max: 240, step: 4 },
  headingSize: { min: 16, max: 120, step: 1 },
  bodySize: { min: 12, max: 32, step: 1 },
  headingLineHeight: { min: 0.9, max: 2, step: 0.05 },
  bodyLineHeight: { min: 1, max: 2.4, step: 0.05 },
  headingSpacing: { min: -0.05, max: 0.2, step: 0.005 },
  bgOverlay: { min: 0, max: 90, step: 5 },
  borderWidth: { min: 0, max: 12, step: 1 },
  radius: { min: 0, max: 96, step: 2 },
  opacity: { min: 20, max: 100, step: 1 },
  cols: { min: 1, max: 6, step: 1 },
  gap: { min: 0, max: 96, step: 4 },
  angle: { min: 0, max: 360, step: 5 },
} as const;

type RangeKey = keyof typeof RANGE;

/* ---------------- validation ---------------- */

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function pick<T extends string>(v: unknown, list: readonly T[]): T | undefined {
  return typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T) : undefined;
}

export const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
const hex = (v: unknown): string | undefined => (isHex(v) ? v.toLowerCase() : undefined);

function num(v: unknown, key: RangeKey): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return undefined;
  const { min, max } = RANGE[key];
  return Math.round(Math.min(max, Math.max(min, n)) * 1000) / 1000;
}

function weight(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && (WEIGHTS as readonly number[]).includes(n) ? n : undefined;
}

/** https or site-relative only, and none of the characters that could break out of a CSS url("..."). */
export function safeUrl(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (s.length === 0 || s.length > 500) return undefined;
  if (/^https:\/\/[A-Za-z0-9\-._~:/?#@!$&*+,=%]+$/.test(s)) return s;
  if (/^\/(?!\/)[A-Za-z0-9\-._~:/?#@!$&*+,=%]*$/.test(s)) return s;
  return undefined;
}

const NUMERIC_KEYS = [
  "padTop", "padBottom", "marginTop", "marginBottom", "marginX", "headingSize", "bodySize",
  "headingLineHeight", "bodyLineHeight", "headingSpacing", "bgOverlay", "borderWidth", "radius", "opacity", "gap",
] as const;
const COLOR_KEYS = ["textColor", "headingColor", "accentColor", "bgColor", "borderColor"] as const;

/** Returns only valid, in-range values. Unknown keys and bad values are dropped. Never throws. */
export function cleanStyle(raw: unknown, opts: { allowImage?: boolean } = {}): SectionStyle {
  if (!isObj(raw)) return {};
  const o: Record<string, unknown> = {};
  const put = (k: string, v: unknown) => {
    if (v !== undefined) o[k] = v;
  };

  put("pad", pick(raw.pad, PADS));
  put("align", pick(raw.align, ALIGNS));
  put("bg", pick(raw.bg, BGS));
  put("width", pick(raw.width, WIDTHS));
  for (const k of NUMERIC_KEYS) put(k, num(raw[k], k));
  for (const k of COLOR_KEYS) put(k, hex(raw[k]));
  put("headingFont", isFontName(raw.headingFont) ? raw.headingFont : undefined);
  put("bodyFont", isFontName(raw.bodyFont) ? raw.bodyFont : undefined);
  put("headingWeight", weight(raw.headingWeight));
  put("bodyWeight", weight(raw.bodyWeight));
  put("headingTransform", pick(raw.headingTransform, TRANSFORMS));
  put("bgSize", pick(raw.bgSize, BG_SIZES));
  put("bgPosition", pick(raw.bgPosition, BG_POSITIONS));
  put("borderStyle", pick(raw.borderStyle, BORDER_STYLES));
  put("shadow", pick(raw.shadow, SHADOWS));
  put("colAlign", pick(raw.colAlign, COL_ALIGNS));
  const cols = num(raw.cols, "cols");
  put("cols", cols === undefined ? undefined : Math.round(cols));
  if (opts.allowImage !== false) put("bgImage", safeUrl(raw.bgImage));

  if (isObj(raw.bgGradient)) {
    const from = hex(raw.bgGradient.from);
    const to = hex(raw.bgGradient.to);
    if (from && to) put("bgGradient", { from, to, angle: num(raw.bgGradient.angle, "angle") ?? 135 });
  }

  if (isObj(raw.responsive)) {
    const resp: Record<string, Responsive> = {};
    for (const dev of ["tablet", "mobile"] as const) {
      const r = raw.responsive[dev];
      if (!isObj(r)) continue;
      const one: Responsive = {};
      for (const k of RESPONSIVE_KEYS) {
        const n = num(r[k], k);
        if (n !== undefined) one[k] = n;
      }
      if (Object.keys(one).length) resp[dev] = one;
    }
    if (Object.keys(resp).length) put("responsive", resp);
  }
  return o as SectionStyle;
}

export function cleanHide(raw: unknown): Hide {
  if (!isObj(raw)) return {};
  const h: Hide = {};
  if (raw.desktop === true) h.desktop = true;
  if (raw.tablet === true) h.tablet = true;
  if (raw.mobile === true) h.mobile = true;
  return h;
}

/** A locked section can be selected but not edited, moved or deleted until it is unlocked. */
export const isLocked = (props: Record<string, unknown>): boolean => props.__locked === true;

/** Section types whose content is a card grid, so the Columns/Gap controls apply. */
export const GRID_TYPES: readonly SectionType[] = ["features", "columns", "menu", "products", "pricing", "testimonials", "gallery", "blog"];

/** Cleans `__style`, `__hide`, `__label` and `__locked` inside a section's props and leaves every other prop alone. */
export function cleanSectionProps(props: Record<string, unknown>, opts: { allowImage?: boolean } = {}): Record<string, unknown> {
  const out = { ...props };
  if ("__style" in out) {
    const st = cleanStyle(out.__style, opts);
    if (Object.keys(st).length) out.__style = st;
    else delete out.__style;
  }
  if ("__label" in out) {
    const l = typeof out.__label === "string" ? out.__label.trim().slice(0, 60) : "";
    if (l) out.__label = l;
    else delete out.__label;
  }
  if ("__locked" in out && out.__locked !== true) delete out.__locked;
  if ("__hide" in out) {
    const h = cleanHide(out.__hide);
    if (Object.keys(h).length) out.__hide = h;
    else delete out.__hide;
  }
  return out;
}

/* ---------------- responsive values (used by the property panel) ---------------- */

const PAD_PX = { none: 0, sm: 32, md: 64, lg: 104 } as const;

/** The spacing the stylesheet gives a section for a preset, in px. */
export function presetPadPx(type: SectionType, pad: SectionStyle["pad"]): number {
  const p = pad ?? "md";
  if (p === "md" && type === "navbar") return 16;
  if (p === "md" && type === "footer") return 40;
  return PAD_PX[p];
}

/** What a value is before the user sets it. Used so a tablet-only change never shifts the desktop look. */
export function baseDefault(key: ResponsiveKey, type: SectionType, style: SectionStyle): number {
  switch (key) {
    case "padTop":
    case "padBottom":
      return presetPadPx(type, style.pad);
    case "marginTop":
    case "marginBottom":
      return 0;
    case "headingSize":
      return type === "hero" ? 56 : 36;
    case "bodySize":
      return 16;
  }
}

/** The value in effect on a device (mobile falls back to tablet, tablet to desktop). undefined = automatic. */
export function valueAt(style: SectionStyle, key: ResponsiveKey, device: Device): number | undefined {
  const r = style.responsive;
  if (device === "mobile") return r?.mobile?.[key] ?? r?.tablet?.[key] ?? style[key];
  if (device === "tablet") return r?.tablet?.[key] ?? style[key];
  return style[key];
}

/** True when this device has its own value instead of inheriting. */
export function hasOverride(style: SectionStyle, key: ResponsiveKey, device: Device): boolean {
  return device !== "desktop" && style.responsive?.[device]?.[key] !== undefined;
}

export function setResponsive(style: SectionStyle, key: ResponsiveKey, value: number, device: Device, type: SectionType): SectionStyle {
  const v = num(value, key);
  if (v === undefined) return style;
  if (device === "desktop") return { ...style, [key]: v };
  const base = style[key] ?? baseDefault(key, type, style);
  return {
    ...style,
    [key]: base,
    responsive: { ...style.responsive, [device]: { ...style.responsive?.[device], [key]: v } },
  };
}

/** Desktop: back to automatic on every device. Tablet/mobile: drop this device's override so it inherits again. */
export function clearResponsive(style: SectionStyle, key: ResponsiveKey, device: Device): SectionStyle {
  const next: SectionStyle = { ...style };
  if (device === "desktop") {
    delete next[key];
    const resp: NonNullable<SectionStyle["responsive"]> = { ...style.responsive };
    for (const dev of ["tablet", "mobile"] as const) {
      if (!resp[dev]) continue;
      const one = { ...resp[dev] };
      delete one[key];
      if (Object.keys(one).length) resp[dev] = one;
      else delete resp[dev];
    }
    if (Object.keys(resp).length) next.responsive = resp;
    else delete next.responsive;
    return next;
  }
  const one = { ...style.responsive?.[device] };
  delete one[key];
  const resp: NonNullable<SectionStyle["responsive"]> = { ...style.responsive };
  if (Object.keys(one).length) resp[device] = one;
  else delete resp[device];
  if (Object.keys(resp).length) next.responsive = resp;
  else delete next.responsive;
  return next;
}

/* ---------------- rendering ---------------- */

const CODE: Record<ResponsiveKey, string> = {
  padTop: "pt", padBottom: "pb", marginTop: "mt", marginBottom: "mb", headingSize: "hs", bodySize: "bs",
};
const px = (n: number) => `${n}px`;

export type SectionRender = { className: string; style: CSSProperties };

/**
 * Turns a section's props into the class names and CSS variables its wrapper needs.
 * The matching rules are in renderer/site.css ("Phase C"). Invalid data is ignored, never rendered.
 */
export function sectionRender(props: Record<string, unknown>, type: SectionType): SectionRender {
  const st = cleanStyle(props.__style);
  const hide = cleanHide(props.__hide);
  const cls: string[] = [`st-pad-${st.pad ?? "md"}`, `st-align-${st.align ?? "default"}`];
  const v: Record<string, string> = {};

  const customBg = !!(st.bgColor || st.bgGradient || st.bgImage);
  cls.push(customBg ? "st-bg-custom" : `st-bg-${st.bg ?? "default"}`);
  if (st.width && st.width !== "default") cls.push(`s-w-${st.width}`);

  // spacing and sizes that can differ per device
  for (const key of RESPONSIVE_KEYS) {
    const d = st[key];
    const t = st.responsive?.tablet?.[key];
    const m = st.responsive?.mobile?.[key];
    if (d === undefined && t === undefined && m === undefined) continue;
    const c = CODE[key];
    cls.push(`s-${c}`);
    v[`--${c}-d`] = px(d ?? baseDefault(key, type, st));
    if (t !== undefined) v[`--${c}-t`] = px(t);
    if (m !== undefined) v[`--${c}-m`] = px(m);
  }
  if (st.marginX) {
    cls.push("s-mx");
    v["--s-mx"] = px(st.marginX);
  }

  // typography
  if (st.headingFont) { cls.push("s-hf"); v["--s-hf"] = fontStack(st.headingFont); }
  if (st.bodyFont) { cls.push("s-bf"); v["--s-bf"] = fontStack(st.bodyFont); }
  if (st.headingWeight) { cls.push("s-hw"); v["--s-hw"] = String(st.headingWeight); }
  if (st.bodyWeight) { cls.push("s-bw"); v["--s-bw"] = String(st.bodyWeight); }
  if (st.headingLineHeight) { cls.push("s-hlh"); v["--s-hlh"] = String(st.headingLineHeight); }
  if (st.bodyLineHeight) { cls.push("s-blh"); v["--s-blh"] = String(st.bodyLineHeight); }
  if (st.headingSpacing) { cls.push("s-hls"); v["--s-hls"] = `${st.headingSpacing}em`; }
  if (st.headingTransform && st.headingTransform !== "none") cls.push(`s-ht-${st.headingTransform}`);

  // colors: text color wins; otherwise pick readable text for a custom background
  const autoFg = st.bgColor
    ? onColor(st.bgColor)
    : st.bgGradient
      ? onColor(st.bgGradient.from)
      : st.bgImage && (st.bgOverlay ?? 0) >= 40
        ? "#ffffff"
        : undefined;
  const fg = st.textColor ?? autoFg;
  if (fg) { cls.push("s-fg"); v["--s-fg"] = fg; }
  if (st.headingColor) { cls.push("s-hc"); v["--s-hc"] = st.headingColor; }
  if (st.accentColor) { cls.push("s-ac"); v["--s-ac"] = st.accentColor; v["--s-acfg"] = onColor(st.accentColor); }

  // background
  if (st.bgColor) { cls.push("s-bgc"); v["--s-bgc"] = st.bgColor; }
  if (st.bgGradient) {
    cls.push("s-bgi");
    v["--s-bgi"] = `linear-gradient(${st.bgGradient.angle}deg, ${st.bgGradient.from}, ${st.bgGradient.to})`;
  } else if (st.bgImage) {
    const ov = (st.bgOverlay ?? 0) / 100;
    const shade = ov > 0 ? `linear-gradient(rgba(0,0,0,${ov}), rgba(0,0,0,${ov})), ` : "";
    cls.push("s-bgi");
    v["--s-bgi"] = `${shade}url("${st.bgImage}")`;
    if (st.bgSize) v["--s-bgsz"] = st.bgSize;
    if (st.bgPosition) v["--s-bgpos"] = st.bgPosition;
  }

  // border and effects
  if (st.borderWidth) {
    cls.push("s-bd");
    v["--s-bdw"] = px(st.borderWidth);
    if (st.borderStyle) v["--s-bds"] = st.borderStyle;
    if (st.borderColor) v["--s-bdc"] = st.borderColor;
  }
  if (st.radius) { cls.push("s-rad"); v["--s-rad"] = px(st.radius); }
  if (st.shadow && st.shadow !== "none") cls.push(`s-sh-${st.shadow}`);
  if (st.opacity !== undefined && st.opacity < 100) { cls.push("s-op"); v["--s-op"] = String(st.opacity / 100); }

  // grid
  if (st.cols) cls.push("s-cols", `s-cols-${st.cols}`);
  if (st.gap !== undefined) { cls.push("s-gap"); v["--s-gap"] = px(st.gap); }
  if (st.colAlign) cls.push(`s-ca-${st.colAlign}`);

  if (hide.desktop) cls.push("st-hide-desktop");
  if (hide.tablet) cls.push("st-hide-tablet");
  if (hide.mobile) cls.push("st-hide-mobile");

  return { className: cls.join(" "), style: v as CSSProperties };
}

/** Every font a page needs, so only those are requested from Google Fonts. */
export function usedFonts(
  theme: { fontFamily?: unknown; headingFont?: unknown },
  sections: { props: Record<string, unknown> }[],
): FontName[] {
  const out = new Set<FontName>();
  if (isFontName(theme.fontFamily)) out.add(theme.fontFamily);
  if (isFontName(theme.headingFont)) out.add(theme.headingFont);
  for (const s of sections) {
    const st = cleanStyle(s.props.__style);
    if (st.headingFont) out.add(st.headingFont);
    if (st.bodyFont) out.add(st.bodyFont);
  }
  return [...out];
}
