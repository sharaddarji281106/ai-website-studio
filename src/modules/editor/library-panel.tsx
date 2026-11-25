"use client";
import { BookmarkPlus, Loader2, Pencil, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AI_BLOCKED_TYPES, SECTION_TYPES, type SectionType } from "@/modules/site/schema";
import { LIBRARY_CATEGORIES, SECTION_CATEGORY, SECTION_META, sectionLabel } from "./defaults";
import { LAYOUT_PRESETS } from "./layouts";
import { useLibrary } from "./library-store";
import { selectActivePage, useEditor } from "./store";

/** Drag payload types (read by the canvas and the Layers panel). */
export const DRAG_SECTION_TYPE = "application/x-section-type";
export const DRAG_COMPONENT_ID = "application/x-component-id";

const tile = "flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-3 text-xs font-medium text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800";

/** "Save as component": saves the selected section so it can be reused on any page or site. */
export function SaveAsComponent() {
  const selected = useEditor((s) => selectActivePage(s).sections.find((x) => x.id === s.selectedId) ?? null);
  const { saveSelected, error } = useLibrary();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  if (!selected) return null;

  const start = () => { setName(sectionLabel(selected)); setOpen(true); setDone(false); };
  const submit = async () => {
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    const ok = await saveSelected(n);
    setBusy(false);
    if (ok) { setOpen(false); setDone(true); }
  };

  if (!open) {
    return (
      <div className="grid gap-1">
        <button type="button" className="btn-mini w-fit" onClick={start}><BookmarkPlus size={12} /> Save as component</button>
        {done && <span className="text-xs text-emerald-600">Saved. Find it under My components.</span>}
        {!open && error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
  return (
    <form className="grid gap-2 rounded-lg border border-slate-200 p-2 dark:border-slate-700" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <label className="grid gap-1"><span className="field-label">Component name</span>
        <input className="input" autoFocus value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="flex gap-2">
        <button className="btn-primary flex-1" disabled={busy || !name.trim()}>{busy ? <Loader2 size={14} className="animate-spin" /> : "Save"}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}

function BlocksTab({ query }: { query: string }) {
  const st = useEditor.getState;
  const empty = useEditor((s) => selectActivePage(s).sections.length === 0);
  const q = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      LIBRARY_CATEGORIES.map((c) => ({
        category: c,
        types: SECTION_TYPES.filter((t) => SECTION_CATEGORY[t] === c && (!q || SECTION_META[t].label.toLowerCase().includes(q) || c.toLowerCase().includes(q))),
      })).filter((g) => g.types.length),
    [q],
  );

  return (
    <div className="grid gap-4">
      {empty && !q && (
        <div className="grid gap-2">
          <h3 className="panel-title">Starter layouts</h3>
          {LAYOUT_PRESETS.map((l) => (
            <button key={l.id} type="button" onClick={() => st().applyLayout(l.id)} className="rounded-xl border border-slate-200 px-3 py-2 text-left transition hover:border-indigo-400 hover:bg-indigo-50 dark:border-slate-700 dark:hover:bg-slate-800">
              <span className="block text-sm font-medium">{l.label}</span>
              <span className="block text-xs text-slate-500">{l.description}</span>
            </button>
          ))}
        </div>
      )}
      {groups.length === 0 && <p className="text-sm text-slate-500">No blocks match “{query}”.</p>}
      {groups.map((g) => (
        <div key={g.category} className="grid gap-2">
          <h3 className="panel-title">{g.category}</h3>
          <div className="grid grid-cols-2 gap-2">
            {g.types.map((t: SectionType) => {
              const Icon = SECTION_META[t].icon;
              return (
                <button
                  key={t}
                  type="button"
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData(DRAG_SECTION_TYPE, t); e.dataTransfer.effectAllowed = "copy"; st().setDragging(true); }}
                  onDragEnd={() => st().setDragging(false)}
                  onClick={() => st().addSection(t)}
                  className={tile}
                  title="Click to add, or drag onto the canvas"
                >
                  <Icon size={18} />
                  {SECTION_META[t].label}
                  {(AI_BLOCKED_TYPES as readonly string[]).includes(t) && <span className="text-[10px] font-normal text-slate-400">written by you</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function MyComponentsTab({ query }: { query: string }) {
  const { components, status, error, load, rename, remove } = useLibrary();
  const st = useEditor.getState;
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  useEffect(() => { load(); }, [load]);
  const q = query.trim().toLowerCase();
  const list = components.filter((c) => !q || c.name.toLowerCase().includes(q));

  return (
    <div className="grid gap-3">
      <SaveAsComponent />
      {status === "loading" && <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={14} className="animate-spin" /> Loading…</p>}
      {status === "error" && <p className="text-sm text-red-500">{error} <button className="underline" onClick={() => load(true)}>Retry</button></p>}
      {status === "ready" && components.length === 0 && (
        <p className="text-sm text-slate-500">Nothing saved yet. Select a block on the canvas, then choose “Save as component” to reuse it on any page or site.</p>
      )}
      {error && status === "ready" && <p className="text-xs text-red-500">{error}</p>}
      <div className="grid gap-1.5">
        {list.map((c) => (
          <div
            key={c.id}
            draggable={editing !== c.id}
            onDragStart={(e) => { e.dataTransfer.setData(DRAG_COMPONENT_ID, c.id); e.dataTransfer.effectAllowed = "copy"; st().setDragging(true); }}
            onDragEnd={() => st().setDragging(false)}
            className="group flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-2 text-sm hover:border-indigo-400 dark:border-slate-700"
          >
            {editing === c.id ? (
              <input
                className="input !py-0.5" autoFocus value={draft} maxLength={60} aria-label="Component name"
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => { const v = draft.trim(); setEditing(null); if (v && v !== c.name) rename(c.id, v); }}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditing(null); }}
              />
            ) : (
              <button type="button" className="min-w-0 flex-1 text-left" title="Click to add to the page, or drag it onto the canvas" onClick={() => useLibrary.getState().insert(c.id)}>
                <span className="block truncate font-medium">{c.name}</span>
                <span className="block truncate text-xs text-slate-500">{c.sections.map((s) => SECTION_META[s.type]?.label ?? s.type).join(" + ")}</span>
              </button>
            )}
            <button className="icon-btn" title="Rename" aria-label={`Rename ${c.name}`} onClick={() => { setDraft(c.name); setEditing(c.id); }}><Pencil size={13} /></button>
            <button className="icon-btn text-red-500" title="Delete" aria-label={`Delete ${c.name}`} onClick={() => { if (window.confirm(`Delete “${c.name}”? Copies already on your pages stay.`)) remove(c.id); }}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The component library: built-in blocks by category, plus the user's own saved components. */
export function ComponentsPanel() {
  const [tab, setTab] = useState<"blocks" | "mine">("blocks");
  const [query, setQuery] = useState("");
  return (
    <div className="grid gap-3 p-3">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input !pl-8" placeholder="Search blocks" aria-label="Search the library" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-xs font-medium dark:bg-slate-800" role="tablist">
        {([["blocks", "Blocks"], ["mine", "My components"]] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`flex-1 rounded-lg py-1.5 transition ${tab === id ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300" : "text-slate-500"}`}>{label}</button>
        ))}
      </div>
      {tab === "blocks" ? <BlocksTab query={query} /> : <MyComponentsTab query={query} />}
    </div>
  );
}
