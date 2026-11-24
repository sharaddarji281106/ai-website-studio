"use client";
import { Copy, Eye, EyeOff, GripVertical, House, Lock, Plus, Trash2 } from "lucide-react";
import { useState, type DragEvent } from "react";
import { SECTION_TYPES, type Section, type SectionType } from "@/modules/site/schema";
import { cleanHide, isLocked } from "@/modules/site/style";
import { SECTION_META, sectionLabel } from "./defaults";
import { LAYOUT_PRESETS } from "./layouts";
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
type DropFn = (e: DragEvent, index: number) => void;

function LayerRow({ s, i, selected, over, setOver, drop }: { s: Section; i: number; selected: boolean; over: boolean; setOver: (i: number | null) => void; drop: DropFn }) {
  const st = useEditor.getState;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const meta = SECTION_META[s.type];
  const Icon = meta.icon;
  const label = sectionLabel(s);
  const locked = isLocked(s.props);
  const hide = cleanHide(s.props.__hide);
  const hidden = !!(hide.desktop && hide.tablet && hide.mobile);
  const fixed = s.type === "navbar" || s.type === "footer"; // these can be moved but not deleted

  const setProp = (patch: Record<string, unknown>, remove: string[] = []) => {
    const props = { ...s.props, ...patch };
    for (const k of remove) delete props[k];
    st().replaceProps(s.id, props);
  };
  const commitName = () => {
    setEditing(false);
    const v = draft.trim().slice(0, 60);
    if (v === label) return;
    if (v && v !== meta.label) setProp({ __label: v });
    else setProp({}, ["__label"]);
  };

  return (
    <div
      draggable={!locked && !editing}
      onDragStart={(e) => { e.dataTransfer.setData("application/x-section-id", s.id); st().setDragging(true); }}
      onDragEnd={() => { setOver(null); st().setDragging(false); }}
      onDragOver={(e) => { e.preventDefault(); setOver(i); }}
      onDrop={(e) => drop(e, i)}
      onClick={() => st().select(s.id)}
      className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-2 text-sm ${over ? "border-t-2 border-indigo-500" : "border-transparent"} ${selected ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" : "hover:bg-slate-100 dark:hover:bg-slate-800"} ${hidden ? "opacity-60" : ""}`}
    >
      <GripVertical size={14} className={`shrink-0 text-slate-400 ${locked ? "opacity-30" : "cursor-grab"}`} />
      <Icon size={15} className="shrink-0" />
      {editing ? (
        <input
          autoFocus className="input !py-0.5" value={draft} maxLength={60} aria-label="Layer name"
          onChange={(e) => setDraft(e.target.value)} onClick={(e) => e.stopPropagation()}
          onBlur={commitName}
          onKeyDown={(e) => { if (e.key === "Enter") commitName(); if (e.key === "Escape") setEditing(false); }}
        />
      ) : (
        <span className="flex-1 truncate" title={locked ? label : "Double-click to rename"} onDoubleClick={() => { if (!locked) { setDraft(label); setEditing(true); } }}>
          {label}
        </span>
      )}
      <button className="icon-btn" disabled={locked} title={hidden ? "Show section" : "Hide section (also hidden on the published site)"} aria-label={hidden ? "Show section" : "Hide section"} onClick={(e) => { e.stopPropagation(); if (hidden) setProp({}, ["__hide"]); else setProp({ __hide: { desktop: true, tablet: true, mobile: true } }); }}>
        {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
      <button className={`icon-btn ${locked ? "text-indigo-600" : "opacity-40"}`} title={locked ? "Unlock section" : "Lock section"} aria-label={locked ? "Unlock section" : "Lock section"} aria-pressed={locked} onClick={(e) => { e.stopPropagation(); if (locked) setProp({}, ["__locked"]); else setProp({ __locked: true }); }}>
        <Lock size={13} />
      </button>
      <button className="icon-btn" title="Duplicate" aria-label="Duplicate section" onClick={(e) => { e.stopPropagation(); st().duplicateSection(s.id); }}><Copy size={13} /></button>
      <button className="icon-btn text-red-500 disabled:opacity-30" disabled={locked || fixed} title={fixed ? "Navigation and footer can't be deleted" : "Delete"} aria-label="Delete section" onClick={(e) => { e.stopPropagation(); st().removeSection(s.id); }}><Trash2 size={13} /></button>
    </div>
  );
}

export function LayersPanel() {
  const page = useEditor(selectActivePage);
  const selectedId = useEditor((s) => s.selectedId);
  const st = useEditor.getState;
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const drop: DropFn = (e, index) => {
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
      {page.sections.length === 0 && <p className="text-sm text-slate-500">No sections yet. Add one from the Components tab.</p>}
      {page.sections.map((s, i) => (
        <LayerRow key={s.id} s={s} i={i} selected={selectedId === s.id} over={overIndex === i} setOver={setOverIndex} drop={drop} />
      ))}
      <div className="h-6" onDragOver={(e) => { e.preventDefault(); setOverIndex(page.sections.length); }} onDrop={(e) => drop(e, page.sections.length)} />
    </div>
  );
}

/* ---------------- Components ---------------- */
export function ComponentsPanel() {
  const st = useEditor.getState;
  const empty = useEditor((s) => selectActivePage(s).sections.length === 0);
  return (
    <div className="grid gap-4 p-3">
      {empty && (
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
      <div className="grid gap-2">
        {empty && <h3 className="panel-title">Sections</h3>}
        <div className="grid grid-cols-2 gap-2">
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
      </div>
    </div>
  );
}
