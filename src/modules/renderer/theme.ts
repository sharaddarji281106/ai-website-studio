import type { CSSProperties } from "react";
import type { Theme } from "@/modules/site/schema";

export function onColor(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111827" : "#ffffff";
}

export function themeStyle(theme: Theme): CSSProperties {
  return {
    "--primary": theme.primaryColor,
    "--on-primary": onColor(theme.primaryColor),
    "--font": `'${theme.fontFamily}'`,
  } as CSSProperties;
}
