"use client";
import { Maximize2, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { CODE_LIMITS, CODE_SANDBOX, buildCodeSrcDoc } from "@/modules/site/code";
import { isLocked } from "@/modules/site/style";
import { selectActivePage, useEditor } from "./store";

// Monaco is large: load it only when the editor is opened, and never on the server.
const Monaco = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-slate-400">Loading editor…</div>,
});

type Tab = "html" | "css" | "js";
const TABS: { id: Tab; label: string; language: string }[] = [
  { id: "html", label: "HTML", language: "html" },
  { id: "css", label: "CSS", language: "css" },
  { id: "js", label: "JavaScript", language: "javascript" },
];

/** Full-screen code editor for one custom-code block. Edits are written back (debounced) as normal undoable steps. */
export function CodeEditorModal({ sectionId, onClose }: { sectionId: string; onClose: () => void }) {
  const section = useEditor((s) => selectActivePage(s).sections.find((x) => x.id === sectionId) ?? null);
  const [tab, setTab] = useState<Tab>("html");
  const [draft, setDraft] = useState(() => ({
    html: typeof section?.props.html === "string" ? section.props.html : "",
    css: typeof section?.props.css === "string" ? section.props.css : "",
    js: typeof section?.props.js === "string" ? section.props.js : "",
  }));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const readOnly = !section || isLocked(section.props);
  const dark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  const flush = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const st = useEditor.getState();
    const cur = selectActivePage(st).sections.find((x) => x.id === sectionId);
    if (!cur || isLocked(cur.props)) return;
    const d = draftRef.current;
    if (cur.props.html === d.html && cur.props.css === d.css && cur.props.js === d.js) return;
    st.replaceProps(sectionId, { ...cur.props, ...d }, "code");
  };
  const change = (value: string) => {
    setDraft((d) => ({ ...d, [tab]: value.slice(0, CODE_LIMITS[tab]) }));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 500);
  };
  const close = () => { flush(); onClose(); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { flush(); onClose(); } };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); flush(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const srcDoc = useMemo(() => buildCodeSrcDoc(draft), [draft]);
  if (!section) return null;
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white dark:bg-slate-950" role="dialog" aria-modal="true" aria-label="Code editor">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 px-3 dark:border-slate-800">
        <Maximize2 size={15} className="text-slate-400" />
        <span className="text-sm font-semibold">Custom code</span>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`rounded-lg px-3 py-1 text-xs font-medium ${tab === t.id ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300" : "text-slate-500"}`}>{t.label}</button>
          ))}
        </div>
        <span className="hidden text-xs text-slate-500 md:block">{readOnly ? "This block is locked (read-only)." : "Runs in a sandbox: no access to your account, cookies or this page."}</span>
        <button className="btn-primary ml-auto" onClick={close}><X size={14} className="mr-1" /> Done</button>
      </header>
      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        <div className="min-h-[40vh] border-b border-slate-200 lg:border-b-0 lg:border-r dark:border-slate-800">
          <Monaco
            key={tab}
            height="100%"
            language={active.language}
            theme={dark ? "vs-dark" : "light"}
            value={draft[tab]}
            onChange={(v) => change(v ?? "")}
            options={{ readOnly, minimap: { enabled: false }, wordWrap: "on", fontSize: 13, tabSize: 2, scrollBeyondLastLine: false, automaticLayout: true }}
          />
        </div>
        <div className="min-h-[40vh] overflow-auto bg-slate-100 p-3 dark:bg-slate-900">
          <p className="mb-2 text-xs font-medium text-slate-500">Live preview (interactive)</p>
          <iframe title="Code preview" sandbox={CODE_SANDBOX} srcDoc={srcDoc} className="h-[calc(100%-1.5rem)] min-h-64 w-full rounded-lg bg-white" referrerPolicy="no-referrer" />
        </div>
      </div>
    </div>
  );
}
