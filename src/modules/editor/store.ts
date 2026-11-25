
"use client";
import { create } from "zustand";
import { uid } from "@/lib/uid";
import { slugify } from "@/lib/slug";
import { SECTION_TYPES, type Section, type SectionType, type Theme } from "@/modules/site/schema";
import { isLocked } from "@/modules/site/style";
import { newSection } from "./defaults";
import { LAYOUT_PRESETS } from "./layouts";
import { applyOps, mapPage } from "./ops";
import type { Device, Doc, EditorPage, Proposal, SeoMeta } from "./types";
import { hasPage, resolveActivePageId } from "./integrity";

type Status = "DRAFT" | "PUBLISHED";

type State = {
  projectId: string;
  doc: Doc;
  past: Doc[];
  future: Doc[];
  lastKey: string | null;
  lastAt: number;
  activePageId: string;
  selectedId: string | null;
  device: Device;
  dragging: boolean;
  dirty: boolean;
  saving: boolean;
  saveError: string | null;
  status: Status;
  subdomain: string | null;
  proposal: Proposal | null;

  init: (a: { projectId: string; doc: Doc; status: Status; subdomain: string | null }) => void;
  select: (id: string | null) => void;
  setDevice: (d: Device) => void;
  setDragging: (v: boolean) => void;
  setActivePage: (id: string) => void;
  renameProject: (name: string) => void;
  updateTheme: (t: Partial<Theme>) => void;
  replaceProps: (sectionId: string, props: Record<string, unknown>, key?: string) => void;
  addSection: (type: SectionType, index?: number) => void;
  insertSections: (sections: Section[], index?: number) => void;
  applyLayout: (id: string) => void;
  moveSection: (id: string, index: number) => void;
  nudgeSection: (id: string, dir: -1 | 1) => void;
  duplicateSection: (id: string) => void;
  removeSection: (id: string) => void;
  addPage: (name: string) => void;
  duplicatePage: (id: string) => void;
  deletePage: (id: string) => string | null;
  setHome: (id: string) => void;
  updatePage: (id: string, patch: { name?: string; slug?: string; seo?: SeoMeta }, key?: string) => void;
  undo: () => void;
  redo: () => void;
  setProposal: (p: Proposal | null) => void;
  acceptProposal: () => void;
  save: () => Promise<boolean>;
  setPublishState: (status: Status, subdomain: string | null) => void;
};

const uniqueSlug = (pages: EditorPage[], base: string, ignoreId?: string) => {
  const taken = new Set(pages.filter((p) => p.id !== ignoreId).map((p) => p.slug));
  const root = slugify(base);
  let slug = root;
  let n = 2;
  while (taken.has(slug)) slug = `${root}-${n++}`;
  return slug;
};

const cloneSections = (sections: Section[]): Section[] =>
  sections.map((s) => ({ ...s, id: uid(), props: JSON.parse(JSON.stringify(s.props)) }));

export const useEditor = create<State>((set, get) => {
  const commit = (fn: (d: Doc) => Doc, key?: string) =>
    set((s) => {
      const next = fn(s.doc);
      if (next === s.doc) return s;

      const now = Date.now();
      const coalesce = !!key && s.lastKey === key && now - s.lastAt < 1000;

      return {
        doc: next,
        past: coalesce ? s.past : [...s.past.slice(-99), s.doc],
        future: [],
        lastKey: key ?? null,
        lastAt: now,
        dirty: true,
      };
    });

  const activePage = () => {
    const { doc, activePageId } = get();
    return doc.pages.find((p) => p.id === activePageId) ?? doc.pages[0];
  };

  const editActive = (fn: (p: EditorPage) => EditorPage, key?: string) =>
    commit((d) => mapPage(d, activePage().id, fn), key);

  return {
    projectId: "",
    doc: {
      name: "",
      theme: { primaryColor: "#4f46e5", mode: "light", fontFamily: "Inter" },
      pages: [],
    },
    past: [],
    future: [],
    lastKey: null,
    lastAt: 0,
    activePageId: "",
    selectedId: null,
    device: "desktop",
    dragging: false,
    dirty: false,
    saving: false,
    saveError: null,
    status: "DRAFT",
    subdomain: null,
    proposal: null,

    init: ({ projectId, doc, status, subdomain }) =>
      set({
        projectId,
        doc,
        status,
        subdomain,
        past: [],
        future: [],
        lastKey: null,
        dirty: false,
        saving: false,
        saveError: null,
        activePageId: resolveActivePageId(doc),
        selectedId: null,
        proposal: null,
        device: "desktop",
      }),

    select: (id) => set({ selectedId: id }),
    setDevice: (device) => set({ device }),
    setDragging: (dragging) => set({ dragging }),

    setActivePage: (id) => {
      const { doc } = get();
      if (!hasPage(doc, id)) return;

      set({ activePageId: id, selectedId: null, proposal: null });
    },

    renameProject: (name) => commit((d) => ({ ...d, name }), "project-name"),

    updateTheme: (t) =>
      commit((d) => ({ ...d, theme: { ...d.theme, ...t } }), `theme-${Object.keys(t).join()}`),

    replaceProps: (sectionId, props, key) => {
      // a locked section ignores edits; the only change allowed is unlocking it
      const current = activePage().sections.find((s) => s.id === sectionId);
      if (current && isLocked(current.props) && isLocked(props)) return;
      editActive(
        (p) => ({
          ...p,
          sections: p.sections.map((s) => (s.id === sectionId ? { ...s, props } : s)),
        }),
        key ? `${sectionId}-${key}` : undefined,
      );
    },

    addSection: (type, index) => {
      const section = newSection(type);

      editActive((p) => {
        const list = [...p.sections];
        const at =
          index ??
          (list.length && list[list.length - 1].type === "footer"
            ? list.length - 1
            : list.length);

        list.splice(Math.max(0, Math.min(at, list.length)), 0, section);
        return { ...p, sections: list };
      });

      set({ selectedId: section.id });
    },

    /** Inserts copies (new ids, unlocked) of saved sections. Used by "My components". */
    insertSections: (sections, index) => {
      const copies = cloneSections(sections.filter((s) => (SECTION_TYPES as readonly string[]).includes(s.type))).map((s) => {
        const props = { ...s.props };
        delete props.__locked;
        return { ...s, props };
      });
      if (!copies.length) return;

      editActive((p) => {
        const list = [...p.sections];
        const at = index ?? (list.length && list[list.length - 1].type === "footer" ? list.length - 1 : list.length);
        list.splice(Math.max(0, Math.min(at, list.length)), 0, ...copies);
        return { ...p, sections: list };
      });
      set({ selectedId: copies[0].id });
    },

    applyLayout: (id) => {
      const preset = LAYOUT_PRESETS.find((l) => l.id === id);
      if (!preset || activePage().sections.length > 0) return; // starter layouts are for empty pages only
      const sections = preset.build();
      editActive((p) => ({ ...p, sections }));
      set({ selectedId: null });
    },

    moveSection: (id, index) =>
      editActive((p) => {
        const from = p.sections.findIndex((s) => s.id === id);
        if (from < 0 || isLocked(p.sections[from].props)) return p;

        const list = [...p.sections];
        const [item] = list.splice(from, 1);
        list.splice(index > from ? index - 1 : index, 0, item);

        return { ...p, sections: list };
      }),

    nudgeSection: (id, dir) =>
      editActive((p) => {
        const i = p.sections.findIndex((s) => s.id === id);
        const j = i + dir;

        if (i < 0 || j < 0 || j >= p.sections.length || isLocked(p.sections[i].props)) return p;

        const list = [...p.sections];
        [list[i], list[j]] = [list[j], list[i]];

        return { ...p, sections: list };
      }),

    duplicateSection: (id) => {
      let newId: string | null = null;

      editActive((p) => {
        const i = p.sections.findIndex((s) => s.id === id);
        if (i < 0) return p;

        const [copy] = cloneSections([p.sections[i]]);
        newId = copy.id;

        const list = [...p.sections];
        list.splice(i + 1, 0, copy);

        return { ...p, sections: list };
      });

      if (newId) set({ selectedId: newId });
    },

    removeSection: (id) => {
      const page = activePage();
      const section = page?.sections.find((s) => s.id === id);

      if (!section || section.type === "navbar" || section.type === "footer" || isLocked(section.props)) return;

      editActive((p) => ({ ...p, sections: p.sections.filter((s) => s.id !== id) }));

      if (get().selectedId === id) {
        set({ selectedId: null });
      }
    },

    addPage: (name) => {
      const id = uid();

      commit((d) => {
        const page: EditorPage = {
          id,
          name,
          slug: uniqueSlug(d.pages, name),
          isHome: false,
          seo: {},
          sections: [newSection("navbar"), newSection("hero"), newSection("footer")].map((s) =>
            s.type === "hero" ? { ...s, props: { ...s.props, heading: name } } : s,
          ),
        };

        return { ...d, pages: [...d.pages, page] };
      });

      set({ activePageId: id, selectedId: null });
    },

    duplicatePage: (id) => {
      const src = get().doc.pages.find((p) => p.id === id);
      if (!src) return;

      const newId = uid();

      commit((d) => {
        const currentSrc = d.pages.find((p) => p.id === id);
        if (!currentSrc) return d;

        const copy: EditorPage = {
          ...currentSrc,
          id: newId,
          name: `${currentSrc.name} copy`,
          slug: uniqueSlug(d.pages, `${currentSrc.slug}-copy`),
          isHome: false,
          sections: cloneSections(currentSrc.sections),
        };

        return { ...d, pages: [...d.pages, copy] };
      });

      if (get().doc.pages.some((p) => p.id === newId)) {
        set({ activePageId: newId, selectedId: null, proposal: null });
      }
    },

    deletePage: (id) => {
      const { doc } = get();
      const page = doc.pages.find((p) => p.id === id);

      if (!page) return null;
      if (page.isHome) return "Set another page as the homepage before deleting this one.";
      if (doc.pages.length <= 1) return "A website needs at least one page.";

      commit((d) => ({ ...d, pages: d.pages.filter((p) => p.id !== id) }));

      if (get().activePageId === id) {
        set({
          activePageId: (get().doc.pages.find((p) => p.isHome) ?? get().doc.pages[0]).id,
          selectedId: null,
        });
      }

      return null;
    },

    setHome: (id) =>
      commit((d) => ({ ...d, pages: d.pages.map((p) => ({ ...p, isHome: p.id === id })) })),

    updatePage: (id, patch, key) =>
      commit(
        (d) => ({
          ...d,
          pages: d.pages.map((p) =>
            p.id !== id
              ? p
              : {
                  ...p,
                  ...(patch.name !== undefined ? { name: patch.name } : {}),
                  ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
                  ...(patch.seo ? { seo: { ...p.seo, ...patch.seo } } : {}),
                },
          ),
        }),
        key ? `page-${id}-${key}` : undefined,
      ),

    undo: () =>
      set((s) => {
        if (!s.past.length) return s;

        const prev = s.past[s.past.length - 1];
        const stillThere = prev.pages.some((p) => p.id === s.activePageId);

        return {
          doc: prev,
          past: s.past.slice(0, -1),
          future: [s.doc, ...s.future],
          dirty: true,
          lastKey: null,
          activePageId: stillThere
            ? s.activePageId
            : (prev.pages.find((p) => p.isHome) ?? prev.pages[0]).id,
        };
      }),

    redo: () =>
      set((s) => {
        if (!s.future.length) return s;

        const next = s.future[0];
        const stillThere = next.pages.some((p) => p.id === s.activePageId);

        return {
          doc: next,
          past: [...s.past, s.doc],
          future: s.future.slice(1),
          dirty: true,
          lastKey: null,
          activePageId: stillThere
            ? s.activePageId
            : (next.pages.find((p) => p.isHome) ?? next.pages[0]).id,
        };
      }),

    setProposal: (proposal) => set({ proposal }),

    acceptProposal: () => {
      const { proposal } = get();
      if (!proposal) return;

      const pageId = activePage().id;
      commit((d) => applyOps(d, pageId, proposal.ops));
      set({ proposal: null });
    },

    save: async () => {
      const { doc, projectId, saving } = get();
      if (saving) return false;

      set({ saving: true, saveError: null });

      try {
        const res = await fetch(`/api/projects/${projectId}/save`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(doc),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          set({ saving: false, saveError: data.error ?? "Could not save" });
          return false;
        }

        set((s) => ({ saving: false, dirty: s.doc !== doc }));
        return true;
      } catch {
        set({ saving: false, saveError: "Network error while saving" });
        return false;
      }
    },

    setPublishState: (status, subdomain) => set({ status, subdomain }),
  };
});

export const selectActivePage = (s: State): EditorPage =>
  s.doc.pages.find((p) => p.id === s.activePageId) ?? s.doc.pages[0];
