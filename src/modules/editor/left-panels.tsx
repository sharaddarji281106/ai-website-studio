"use client";
import { Copy, GripVertical, House, Plus, Trash2 } from "lucide-react";
import { useState, type DragEvent } from "react";
import { SECTION_TYPES, type SectionType } from "@/modules/site/schema";
import { SECTION_META } from "./defaults";
import { selectActivePage, useEditor } from "./store";

/* ---------------- Pages ---------------- */
export function PagesPanel() {
  const pages = useEditor((s) => s.doc.pages);
  const activeId = useEditor((s) => s.activePageId);
  const page = useEditor(selectActivePage);
  const st = useEditor.getState;
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <div className="grid gap-5 p-3">
      <div className="grid gap-1">
        {pages.map((p) => (
          <div key={p.id} className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm ${p.id === activeId ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
            <button className="flex flex-1 items-center gap-2 truncate text-left" onClick={() => st().setActivePage(p.id)}>
              {p.isHome ? <House size={14} /> : <span className="w-3.5" />}
              <span className="truncate font-medium">{p.name}</span>
              <span className="truncate text-xs text-slate-400">/{p.slug}</span>
            </button>
            {!p.isHome && <button className="icon-btn" title="Set as homepage" onClick={() => st().setHome(p.id)}><House size={13} /></button>}
            <button className="icon-btn" title="Duplicate" onClick={() => st().duplicatePage(p.id)}><Copy size={13} /></button>
            <button className="icon-btn text-red-500" title="Delete" onClick={() => setMsg(st().deletePage(p.id) ?? "")}><Trash2 size={13} /></button>
          </div>
        ))}
        {msg && <p className="text-xs text-red-500">{msg}</p>}
      </div>

      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { st().addPage(name.trim()); setName(""); setMsg(""); } }}>
        <input className="input" placeholder="New page name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        <button className="btn-primary px-3" aria-label="Add page"><Plus size={16} /></button>
      </form>

      {page && (
        <div className="grid gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <h3 className="panel-title">Page settings</h3>
          <label className="grid gap-1"><span className="field-label">Name</span>
            <input className="input" value={page.name} onChange={(e) => st().updatePage(page.id, { name: e.target.value }, "name")} />
          </label>
          <label className="grid gap-1"><span className="field-label">URL</span>
            <div className="flex items-center gap-1"><span className="text-slate-400">/</span>
              <input className="input" value={page.slug} onChange={(e) => st().updatePage(page.id, { slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }, "slug")} />
            </div>
          </label>
          <label className="grid gap-1"><span className="field-label">SEO title</span>
            <input className="input" value={page.seo.title ?? ""} placeholder={page.name} onChange={(e) => st().updatePage(page.id, { seo: { title: e.target.value } }, "seo-title")} />
          </label>
          <label className="grid gap-1"><span className="field-label">SEO description</span>
            <textarea className="input min-h-[72px]" value={page.seo.description ?? ""} onChange={(e) => st().updatePage(page.id, { seo: { description: e.target.value } }, "seo-desc")} />
          </label>
        </div>
      )}
    </div>
  );
}

/* ---------------- Layers ---------------- */
export function LayersPanel() {
  const page = useEditor(selectActivePage);
  const selectedId = useEditor((s) => s.selectedId);
  const st = useEditor.getState;
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const drop = (e: DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(null);
    const id = e.dataTransfer.getData("application/x-section-id");
    const type = e.dataTransfer.getData("application/x-section-type");
    if (id) st().moveSection(id, index);
    else if (type && (SECTION_TYPES as readonly string[]).includes(type)) st().addSection(type as SectionType, index);
    st().setDragging(false);
  };

  if (!page) return null;
  return (
    <div className="grid gap-1 p-3">
      {page.sections.length === 0 && <p className="text-sm text-slate-500">No sections yet.</p>}
      {page.sections.map((s, i) => {
        const meta = SECTION_META[s.type];
        const Icon = meta.icon;
        return (
          <div
            key={s.id}
            draggable
            onDragStart={(e) => { e.dataTransfer.setData("application/x-section-id", s.id); st().setDragging(true); }}
            onDragEnd={() => { setOverIndex(null); st().setDragging(false); }}
            onDragOver={(e) => { e.preventDefault(); setOverIndex(i); }}
            onDrop={(e) => drop(e, i)}
            onClick={() => st().select(s.id)}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-2 text-sm ${overIndex === i ? "border-t-2 border-indigo-500" : "border-transparent"} ${selectedId === s.id ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            <GripVertical size={14} className="shrink-0 cursor-grab text-slate-400" />
            <Icon size={15} className="shrink-0" />
            <span className="flex-1 truncate">{meta.label}</span>
            <button className="icon-btn" title="Duplicate" onClick={(e) => { e.stopPropagation(); st().duplicateSection(s.id); }}><Copy size={13} /></button>
            <button className="icon-btn text-red-500" title="Delete" onClick={(e) => { e.stopPropagation(); st().removeSection(s.id); }}><Trash2 size={13} /></button>
          </div>
        );
      })}
      <div className="h-6" onDragOver={(e) => { e.preventDefault(); setOverIndex(page.sections.length); }} onDrop={(e) => drop(e, page.sections.length)} />
    </div>
  );
}

/* ---------------- Components ---------------- */
export function ComponentsPanel() {
  const st = useEditor.getState;
  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {SECTION_TYPES.map((t) => {
        const meta = SECTION_META[t];
        const Icon = meta.icon;
        return (
          <button
            key={t}
            draggable
            onDragStart={(e) => { e.dataTransfer.setData("application/x-section-type", t); e.dataTransfer.effectAllowed = "copy"; st().setDragging(true); }}
            onDragEnd={() => st().setDragging(false)}
            onClick={() => st().addSection(t)}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-3 text-xs font-medium text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Click to add, or drag onto the canvas"
          >
            <Icon size={18} />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
