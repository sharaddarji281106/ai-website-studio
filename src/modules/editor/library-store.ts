"use client";
import { create } from "zustand";
import type { Section } from "@/modules/site/schema";
import { selectActivePage, useEditor } from "./store";

export type SavedComponent = { id: string; name: string; sections: Section[]; createdAt: string };

type Library = {
  components: SavedComponent[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  load: (force?: boolean) => Promise<void>;
  saveSelected: (name: string) => Promise<boolean>;
  rename: (id: string, name: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  insert: (id: string, index?: number) => void;
};

async function readError(res: Response, fallback: string) {
  const data = await res.json().catch(() => ({}));
  return typeof data.error === "string" ? data.error : fallback;
}

/** "My components" live in the database per user, not in the document, so they never affect undo/redo. */
export const useLibrary = create<Library>((set, get) => ({
  components: [],
  status: "idle",
  error: null,

  load: async (force) => {
    if (!force && (get().status === "ready" || get().status === "loading")) return;
    set({ status: "loading", error: null });
    try {
      const res = await fetch("/api/components");
      if (!res.ok) throw new Error(await readError(res, "Could not load your components"));
      const data = await res.json();
      set({ components: Array.isArray(data.components) ? data.components : [], status: "ready" });
    } catch (e) {
      set({ status: "error", error: e instanceof Error ? e.message : "Could not load your components" });
    }
  },

  saveSelected: async (name) => {
    const st = useEditor.getState();
    const sec = selectActivePage(st).sections.find((s) => s.id === st.selectedId);
    if (!sec) return false;
    set({ error: null });
    try {
      const res = await fetch("/api/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sections: [sec] }),
      });
      if (!res.ok) throw new Error(await readError(res, "Could not save the component"));
      const data = await res.json();
      set((s) => ({ components: [data.component, ...s.components], status: "ready" }));
      return true;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Could not save the component" });
      return false;
    }
  },

  rename: async (id, name) => {
    const prev = get().components;
    set({ components: prev.map((c) => (c.id === id ? { ...c, name } : c)), error: null });
    const res = await fetch(`/api/components/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) }).catch(() => null);
    if (!res || !res.ok) set({ components: prev, error: "Could not rename the component" });
  },

  remove: async (id) => {
    const prev = get().components;
    set({ components: prev.filter((c) => c.id !== id), error: null });
    const res = await fetch(`/api/components/${id}`, { method: "DELETE" }).catch(() => null);
    if (!res || !res.ok) set({ components: prev, error: "Could not delete the component" });
  },

  insert: (id, index) => {
    const c = get().components.find((x) => x.id === id);
    if (c) useEditor.getState().insertSections(c.sections, index);
  },
}));
