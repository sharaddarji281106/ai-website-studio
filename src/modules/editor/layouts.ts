import type { Section, SectionType } from "@/modules/site/schema";
import type { SectionStyle } from "@/modules/site/style";
import { newSection } from "./defaults";

/** One-click starting points for an empty page. Built from the same blocks as everything else, so every tool works on them. */
export type LayoutPreset = { id: string; label: string; description: string; build: () => Section[] };

function make(type: SectionType, props: Record<string, unknown> = {}, style?: SectionStyle): Section {
  const s = newSection(type);
  return { ...s, props: { ...s.props, ...props, ...(style ? { __style: style } : {}) } };
}

const NO_IMAGE = { image: "", imageQuery: "" };

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: "header-footer",
    label: "Header & footer",
    description: "Navigation and footer only. Add everything in between.",
    build: () => [make("navbar"), make("footer")],
  },
  {
    id: "one-column",
    label: "One column",
    description: "A focused, centered page.",
    build: () => [
      make("navbar"),
      make("hero", NO_IMAGE, { width: "narrow", align: "center" }),
      make("about", NO_IMAGE, { width: "narrow" }),
      make("cta"),
      make("footer"),
    ],
  },
  {
    id: "two-column",
    label: "Two columns",
    description: "Text beside an image, then side-by-side columns.",
    build: () => {
      const cols = make("columns", {}, { cols: 2 });
      const items = cols.props.items as unknown[];
      return [make("navbar"), make("about"), { ...cols, props: { ...cols.props, heading: "Two columns", items: items.slice(0, 2) } }, make("footer")];
    },
  },
];
