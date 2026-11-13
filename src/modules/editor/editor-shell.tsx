"use client";
import { FileText, Layers, LayoutGrid, Paintbrush, SlidersHorizontal, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "./canvas";
import { ComponentsPanel, LayersPanel, PagesPanel } from "./left-panels";
import { AiPanel, ContentPanel, StylePanel } from "./right-panels";
import { useEditor } from "./store";
import { Toolbar } from "./toolbar";
import type { Doc } from "./types";

const LEFT = [
  { id: "pages", label: "Pages", icon: FileText },
  { id: "layers", label: "Layers", icon: Layers },
  { id: "components", label: "Components", icon: LayoutGrid },
] as const;
const RIGHT = [
  { id: "content", label: "Content", icon: SlidersHorizontal },
  { id: "style", label: "Style", icon: Paintbrush },
  { id: "ai", label: "AI", icon: Sparkles },
] as const;

function Tabs<T extends string>({ items, value, onChange }: { items: readonly { id: T; label: string; icon: React.ElementType }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex shrink-0 border-b border-slate-200 dark:border-slate-800">
      {items.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => onChange(id)} className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-2.5 text-xs font-medium transition ${value === id ? "border-indigo-600 text-indigo-600 dark:text-indigo-300" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}>
          <Icon size={14} /> {label}
        </button>
      ))}
    </div>
  );
}

export function EditorShell({ projectId, initialDoc, status, subdomain }: { projectId: string; initialDoc: Doc; status: "DRAFT" | "PUBLISHED"; subdomain: string | null }) {
  const [ready, setReady] = useState(false);
  const [left, setLeft] = useState<(typeof LEFT)[number]["id"]>("layers");
  const [right, setRight] = useState<(typeof RIGHT)[number]["id"]>("content");
  const selectedId = useEditor((s) => s.selectedId);
  const dirty = useEditor((s) => s.dirty);
  const doc = useEditor((s) => s.doc);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    useEditor.getState().init({ projectId, doc: initialDoc, status, subdomain });
    setReady(true);
  }, [projectId, initialDoc, status, subdomain]);

  // selecting a section jumps to its content tab
  useEffect(() => { if (selectedId) setRight((r) => (r === "ai" ? r : "content")); }, [selectedId]);

  // autosave 3s after the last change
  useEffect(() => {
    if (!ready || !dirty) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { useEditor.getState().save(); }, 3000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [doc, dirty, ready]);

  // keyboard shortcuts + leave warning
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      const st = useEditor.getState();
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); st.save(); }
      else if (mod && !typing && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? st.redo() : st.undo(); }
      else if (mod && !typing && e.key.toLowerCase() === "y") { e.preventDefault(); st.redo(); }
      else if (!typing && (e.key === "Delete" || e.key === "Backspace") && st.selectedId && !st.proposal) { e.preventDefault(); st.removeSection(st.selectedId); }
    };
    const beforeUnload = (e: BeforeUnloadEvent) => { if (useEditor.getState().dirty) e.preventDefault(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", beforeUnload);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("beforeunload", beforeUnload); };
  }, []);

  if (!ready) return <div className="grid h-screen place-items-center text-sm text-slate-500">Loading editor…</div>;

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Toolbar />
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <Tabs items={LEFT} value={left} onChange={setLeft} />
          <div className="min-h-0 flex-1 overflow-y-auto">
            {left === "pages" && <PagesPanel />}
            {left === "layers" && <LayersPanel />}
            {left === "components" && <ComponentsPanel />}
          </div>
        </aside>
        <main className="min-w-0 flex-1"><Canvas /></main>
        <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <Tabs items={RIGHT} value={right} onChange={setRight} />
          <div className="min-h-0 flex-1 overflow-y-auto">
            {right === "content" && <ContentPanel />}
            {right === "style" && <StylePanel />}
            {right === "ai" && <AiPanel />}
          </div>
        </aside>
      </div>
    </div>
  );
}
