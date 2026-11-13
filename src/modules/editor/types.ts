import type { Section, Theme } from "@/modules/site/schema";

export type SeoMeta = { title?: string; description?: string };
export type EditorPage = { id: string; name: string; slug: string; isHome: boolean; seo: SeoMeta; sections: Section[] };
export type Doc = { name: string; theme: Theme; pages: EditorPage[] };
export type Device = "desktop" | "tablet" | "mobile";

export type EditOp =
  | { op: "updateProps"; sectionId: string; props: Record<string, unknown> }
  | { op: "addSection"; afterSectionId: string | null; section: Section }
  | { op: "removeSection"; sectionId: string }
  | { op: "updateTheme"; theme: Partial<Theme> }
  | { op: "createPage"; page: EditorPage };

export type Proposal = { summary: string; ops: EditOp[] };
