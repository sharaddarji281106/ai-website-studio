import type { Doc, EditOp, EditorPage } from "./types";

export function mapPage(d: Doc, pageId: string, fn: (p: EditorPage) => EditorPage): Doc {
  return { ...d, pages: d.pages.map((p) => (p.id === pageId ? fn(p) : p)) };
}

/** Pure: applies AI-proposed operations to a copy of the document. Used for live preview AND for accepting. */
export function applyOps(doc: Doc, pageId: string, ops: EditOp[]): Doc {
  let d = doc;
  for (const op of ops) {
    switch (op.op) {
      case "updateTheme":
        d = { ...d, theme: { ...d.theme, ...op.theme } };
        break;
      case "createPage":
        if (!d.pages.some((p) => p.slug === op.page.slug)) d = { ...d, pages: [...d.pages, op.page] };
        break;
      case "updateProps":
        d = mapPage(d, pageId, (p) => ({
          ...p,
          sections: p.sections.map((s) => (s.id === op.sectionId ? { ...s, props: { ...s.props, ...op.props } } : s)),
        }));
        break;
      case "removeSection":
        d = mapPage(d, pageId, (p) => ({ ...p, sections: p.sections.filter((s) => s.id !== op.sectionId) }));
        break;
      case "addSection":
        d = mapPage(d, pageId, (p) => {
          const list = [...p.sections];
          let at = list.length;
          if (op.afterSectionId) {
            const i = list.findIndex((s) => s.id === op.afterSectionId);
            if (i >= 0) at = i + 1;
          } else if (list.length && list[list.length - 1].type === "footer") {
            at = list.length - 1; // keep the footer last
          }
          list.splice(at, 0, op.section);
          return { ...p, sections: list };
        });
        break;
    }
  }
  return d;
}

export function describeOp(op: EditOp, doc: Doc, pageId: string): string {
  const page = doc.pages.find((p) => p.id === pageId);
  const label = (id: string) => page?.sections.find((s) => s.id === id)?.type ?? "section";
  switch (op.op) {
    case "updateProps": return `Edit ${label(op.sectionId)}: ${Object.keys(op.props).filter((k) => !k.startsWith("__")).join(", ") || "style"}`;
    case "removeSection": return `Remove ${label(op.sectionId)} section`;
    case "addSection": return `Add ${op.section.type} section`;
    case "updateTheme": return `Change theme (${Object.keys(op.theme).join(", ")})`;
    case "createPage": return `Create page "${op.page.name}" with ${op.page.sections.length} sections`;
  }
}
