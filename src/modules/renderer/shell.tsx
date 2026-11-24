import type { ElementType, ReactNode } from "react";
import type { Section } from "@/modules/site/schema";
import { sectionRender } from "@/modules/site/style";
import { cx, type Rec } from "./utils";

/** Wraps every section: applies the section's style (spacing, typography, colors, background, border,
 *  per-device values and visibility). All of it comes from sectionRender(), which validates the data. */
export function Shell({ section, tag, className, children }: { section: Section; tag?: ElementType; className?: string; children: ReactNode }) {
  const Tag = tag ?? "section";
  const r = sectionRender(section.props, section.type);
  return (
    <Tag className={cx("st-sec", className, r.className)} style={r.style}>
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
