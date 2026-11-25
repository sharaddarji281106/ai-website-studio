
"use client";

import { FileText, Layers, LayoutGrid, Paintbrush, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "./canvas";
import { LayersPanel, PagesPanel } from "./left-panels";
import { ComponentsPanel } from "./library-panel";
import { AiPanel, ContentPanel } from "./right-panels";
import { StylePanel } from "./style-panel";
import { useEditor } from "./store";
import { Toolbar } from "./toolbar";
import type { Doc } from "./types";

const LEFT = [
  { id: "pages", label: "Pages", icon: FileText },
  { id: "layers", label: "Layers", icon: Layers },
  { id: "components", label: "Library", icon: LayoutGrid },
] as const;

const RIGHT = [
  { id: "content", label: "Content", icon: SlidersHorizontal },
  { id: "style", label: "Style", icon: Paintbrush },
  { id: "ai", label: "AI", icon: Sparkles },
] as const;

type LeftId = (typeof LEFT)[number]["id"];
type RightId = (typeof RIGHT)[number]["id"];
const isLeft = (v?: string): v is LeftId => LEFT.some((t) => t.id === v);
const isRight = (v?: string): v is RightId => RIGHT.some((t) => t.id === v);

/** Keeps ?panel= in the address bar so a section can be bookmarked or shared. */
function syncPanelToUrl(panel: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("panel", panel);
  window.history.replaceState(null, "", url);
}

function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly {
    id: T;
    label: string;
    icon: React.ElementType;
  }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex shrink-0 border-b border-slate-200 dark:border-slate-800">
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-2.5 text-xs font-medium transition ${
            value === id
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-300"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Icon size={14} /> {label}
        </button>
      ))}
    </div>
  );
}

export function EditorShell({
  projectId,
  initialDoc,
  status,
  subdomain,
  initialPanel,
  manualMode = false,
}: {
  projectId: string;
  initialDoc: Doc;
  status: "DRAFT" | "PUBLISHED";
  subdomain: string | null;
  initialPanel?: string;
  /** Manual Build Mode (a blank project): the library is open by default. */
  manualMode?: boolean;
}) {
  const initializedProjectId = useEditor((s) => s.projectId);
  // A blank project (Manual Build Mode) opens with the component library; ?panel= overrides the default.
  const startsEmpty = initialDoc.pages.length > 0 && initialDoc.pages.every((p) => p.sections.length === 0);
  const [left, setLeft] = useState<LeftId>(() => (isLeft(initialPanel) ? initialPanel : manualMode || startsEmpty ? "components" : "layers"));
  const [right, setRight] = useState<RightId>(() => (isRight(initialPanel) ? initialPanel : "content"));
  // On screens narrower than "lg" the side panels become slide-in drawers.
  const [drawer, setDrawer] = useState<"left" | "right" | null>(null);
  const dirty = useEditor((s) => s.dirty);
  const doc = useEditor((s) => s.doc);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize the editor for the current project.
  useEffect(() => {
    useEditor.getState().init({ projectId, doc: initialDoc, status, subdomain });
  }, [projectId, initialDoc, status, subdomain]);

  // Selecting a section opens Content, but never pulls the user out of the Style or AI tab they are working in.
  useEffect(() => {
    const unsubscribe = useEditor.subscribe((state, previousState) => {
      if (state.selectedId && state.selectedId !== previousState.selectedId) {
        setRight((current) => (current === "ai" || current === "style" ? current : "content"));
      }
    });

    return unsubscribe;
  }, []);

  // Autosave 3 seconds after the last change.
  useEffect(() => {
    if (initializedProjectId !== projectId || !dirty) return;

    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(() => {
      useEditor.getState().save();
    }, 3000);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [doc, dirty, initializedProjectId, projectId]);

  // Keyboard shortcuts and leave-page warning.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      const inputType = tag === "INPUT" ? (el as HTMLInputElement).type : "";
      const typing =
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (tag === "INPUT" && !["range", "color", "checkbox", "radio", "button"].includes(inputType));
      const st = useEditor.getState();

      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        st.save();
      } else if (mod && !typing && e.key.toLowerCase() === "z") {
        e.preventDefault();

        if (e.shiftKey) {
          st.redo();
        } else {
          st.undo();
        }
      } else if (mod && !typing && e.key.toLowerCase() === "y") {
        e.preventDefault();
        st.redo();
      } else if (
        !typing &&
        (e.key === "Delete" || e.key === "Backspace") &&
        st.selectedId &&
        !st.proposal
      ) {
        e.preventDefault();
        st.removeSection(st.selectedId);
      }
    };

    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (useEditor.getState().dirty) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", beforeUnload);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, []);

  // Wait until the editor store is initialized for this project.
  if (initializedProjectId !== projectId) {
    return (
      <div className="grid h-screen place-items-center text-sm text-slate-500">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Toolbar />

      {drawer && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setDrawer(null)} aria-hidden />}

      <div className="flex min-h-0 flex-1">
        {/* Left panel */}
        <aside className={`${drawer === "left" ? "fixed inset-y-0 left-0 z-50 flex w-[88vw] max-w-sm" : "hidden"} shrink-0 flex-col border-r border-slate-200 bg-white lg:static lg:z-auto lg:flex lg:w-72 lg:max-w-none dark:border-slate-800 dark:bg-slate-950`}>
          <button type="button" className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-sm font-semibold lg:hidden dark:border-slate-800" onClick={() => setDrawer(null)}>
            Add &amp; layers <X size={16} />
          </button>
          <Tabs items={LEFT} value={left} onChange={(v) => { setLeft(v); syncPanelToUrl(v); }} />

          <div className="min-h-0 flex-1 overflow-y-auto">
            {left === "pages" && <PagesPanel />}
            {left === "layers" && <LayersPanel />}
            {left === "components" && <ComponentsPanel />}
          </div>
        </aside>

        {/* Main editor canvas */}
        <main className="min-w-0 flex-1">
          <Canvas />
        </main>

        {/* Right panel */}
        <aside className={`${drawer === "right" ? "fixed inset-y-0 right-0 z-50 flex w-[88vw] max-w-sm" : "hidden"} shrink-0 flex-col border-l border-slate-200 bg-white lg:static lg:z-auto lg:flex lg:w-80 lg:max-w-none dark:border-slate-800 dark:bg-slate-950`}>
          <button type="button" className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-sm font-semibold lg:hidden dark:border-slate-800" onClick={() => setDrawer(null)}>
            Edit &amp; style <X size={16} />
          </button>
          <Tabs items={RIGHT} value={right} onChange={(v) => { setRight(v); syncPanelToUrl(v); }} />

          <div className="min-h-0 flex-1 overflow-y-auto">
            {right === "content" && <ContentPanel />}
            {right === "style" && <StylePanel />}
            {right === "ai" && <AiPanel />}
          </div>
        </aside>
      </div>

      {/* Phone / small tablet: buttons that open the panels */}
      <nav className="flex shrink-0 border-t border-slate-200 bg-white lg:hidden dark:border-slate-800 dark:bg-slate-950" aria-label="Editor panels">
        <button type="button" className="flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium" onClick={() => setDrawer("left")}><Layers size={16} /> Add &amp; layers</button>
        <button type="button" className="flex flex-1 items-center justify-center gap-2 border-l border-slate-200 py-2.5 text-sm font-medium dark:border-slate-800" onClick={() => setDrawer("right")}><Paintbrush size={16} /> Edit &amp; style</button>
      </nav>
    </div>
  );
}
