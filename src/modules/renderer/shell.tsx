import type { ElementType, ReactNode } from "react";
import type { Section } from "@/modules/site/schema";
import { cx, type Rec } from "./utils";

type Style = { pad?: string; align?: string; bg?: string };
type Hide = { desktop?: boolean; tablet?: boolean; mobile?: boolean };

/** Wraps every section: applies spacing, alignment, background and per-device visibility. */
export function Shell({ section, tag, className, children }: { section: Section; tag?: ElementType; className?: string; children: ReactNode }) {
  const Tag = tag ?? "section";
  const st = ((section.props as Rec).__style ?? {}) as Style;
  const hide = ((section.props as Rec).__hide ?? {}) as Hide;
  return (
    <Tag
      className={cx(
        "st-sec",
        className,
        `st-pad-${st.pad ?? "md"}`,
        `st-align-${st.align ?? "default"}`,
        `st-bg-${st.bg ?? "default"}`,
        hide.desktop && "st-hide-desktop",
        hide.tablet && "st-hide-tablet",
        hide.mobile && "st-hide-mobile",
      )}
    >
      {children}
    </Tag>
  );
}

export function Head({ p }: { p: Rec }) {
  const h = typeof p.heading === "string" ? p.heading : "";
  const s = typeof p.subheading === "string" ? p.subheading : "";
  if (!h && !s) return null;
  return (
    <div className="st-head">
      {h && <h2>{h}</h2>}
      {s && <p className="st-lead">{s}</p>}
    </div>
  );
}
