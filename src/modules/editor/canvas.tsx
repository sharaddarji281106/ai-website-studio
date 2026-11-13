"use client";
import { ChevronDown, ChevronUp, Copy, GripVertical, Trash2 } from "lucide-react";
import { Fragment, useLayoutEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { renderSection } from "@/modules/renderer/render-section";
import { SiteRoot } from "@/modules/renderer/site-view";
import { SECTION_TYPES, type Section, type SectionType } from "@/modules/site/schema";
import { SECTION_META } from "./defaults";
import { applyOps } from "./ops";
import { selectActivePage, useEditor } from "./store";

const FRAME_WIDTH = { desktop: 1280, tablet: 768, mobile: 390 } as const;

/** Lays the site out at the real device width, then scales it down to fit the available space. */
function Frame({ width, children }: { width: number; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      if (!outer.current || !inner.current) return;
      setScale(Math.min(1, outer.current.clientWidth / width));
      setHeight(inner.current.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (outer.current) ro.observe(outer.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={outer} className="mx-auto w-full" style={{ maxWidth: width }}>
      <div style={{ height: height * scale }}>
        <div ref={inner} style={{ width, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function DropZone({ index, onDropAt }: { index: number; onDropAt: (e: DragEvent, i: number) => void }) {
  const dragging = useEditor((s) => s.dragging);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { if (dragging) { e.preventDefault(); setOver(true); } }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { setOver(false); onDropAt(e, index); }}
      className={`relative z-20 transition-all ${dragging ? (over ? "h-14 bg-indigo-500/25" : "h-8 bg-indigo-500/10") : "h-0"}`}
      style={dragging ? { outline: "2px dashed rgb(99 102 241 / .7)", outlineOffset: -2 } : undefined}
    >
      {dragging && <span className="pointer-events-none absolute inset-0 grid place-items-center text-xs font-medium text-indigo-600">Drop here</span>}
    </div>
  );
}

function SectionFrame({ section, index, count, readOnly }: { section: Section; index: number; count: number; readOnly: boolean }) {
  const selected = useEditor((s) => s.selectedId === section.id);
  const { select, nudgeSection, duplicateSection, removeSection, setDragging } = useEditor.getState();
  const meta = SECTION_META[section.type];

  return (
    <div
      className="group/section relative"
      onClick={(e) => { e.stopPropagation(); if (!readOnly) select(section.id); }}
    >
      {renderSection(section, "")}
      {/* selection overlay */}
      <div
        className={`pointer-events-none absolute inset-0 z-10 transition ${selected ? "" : "opacity-0 group-hover/section:opacity-100"}`}
        style={{ outline: `${selected ? 3 : 2}px solid ${selected ? "#6366f1" : "rgb(99 102 241 / .45)"}`, outlineOffset: -2 }}
      />
      {!readOnly && (
        <div className={`absolute right-3 top-3 z-30 flex items-center gap-0.5 rounded-lg bg-slate-900 p-1 text-white shadow-lg transition ${selected ? "" : "pointer-events-none opacity-0 group-hover/section:pointer-events-auto group-hover/section:opacity-100"}`}>
          <span
            draggable
            onDragStart={(e) => { e.dataTransfer.setData("application/x-section-id", section.id); e.dataTransfer.effectAllowed = "move"; setDragging(true); }}
            onDragEnd={() => setDragging(false)}
            className="grid cursor-grab place-items-center px-1 active:cursor-grabbing"
            title="Drag to reorder"
          >
            <GripVertical size={14} />
          </span>
          <span className="px-1.5 text-[11px] font-medium">{meta.label}</span>
          <button className="tb-btn" aria-label="Move up" disabled={index === 0} onClick={(e) => { e.stopPropagation(); nudgeSection(section.id, -1); }}><ChevronUp size={14} /></button>
          <button className="tb-btn" aria-label="Move down" disabled={index === count - 1} onClick={(e) => { e.stopPropagation(); nudgeSection(section.id, 1); }}><ChevronDown size={14} /></button>
          <button className="tb-btn" aria-label="Duplicate" onClick={(e) => { e.stopPropagation(); duplicateSection(section.id); }}><Copy size={14} /></button>
          <button className="tb-btn text-red-300" aria-label="Delete" onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}><Trash2 size={14} /></button>
        </div>
      )}
    </div>
  );
}

export function Canvas() {
  const doc = useEditor((s) => s.doc);
  const proposal = useEditor((s) => s.proposal);
  const device = useEditor((s) => s.device);
  const activePageId = useEditor((s) => s.activePageId);
  const select = useEditor((s) => s.select);

  // while the AI has a proposal pending, show the result of applying it (live preview)
  const shown = useMemo(() => (proposal ? applyOps(doc, activePageId, proposal.ops) : doc), [doc, proposal, activePageId]);
  const page = shown.pages.find((p) => p.id === activePageId) ?? shown.pages[0] ?? selectActivePage(useEditor.getState());
  const readOnly = !!proposal;

  const onDropAt = (e: DragEvent, index: number) => {
    e.preventDefault();
    const st = useEditor.getState();
    const type = e.dataTransfer.getData("application/x-section-type");
    const id = e.dataTransfer.getData("application/x-section-id");
    if (type && (SECTION_TYPES as readonly string[]).includes(type)) st.addSection(type as SectionType, index);
    else if (id) st.moveSection(id, index);
    st.setDragging(false);
  };

  // links must never navigate inside the editor
  const blockLinks = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) e.preventDefault();
  };

  return (
    <div className="canvas-bg h-full overflow-auto p-6" onClick={() => select(null)}>
      {proposal && (
        <div className="sticky top-0 z-40 mx-auto mb-4 w-fit rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white shadow-lg">
          Previewing AI changes. Accept or reject them in the AI tab.
        </div>
      )}
      <div className="overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/10 transition-all duration-300" style={{ maxWidth: FRAME_WIDTH[device], margin: "0 auto" }}>
        <Frame width={FRAME_WIDTH[device]}>
          <div onClickCapture={blockLinks}>
            <SiteRoot theme={shown.theme}>
              {page.sections.length === 0 && (
                <div className="grid h-64 place-items-center text-sm text-slate-400">Empty page. Drag a component here or click one in the Components tab.</div>
              )}
              {page.sections.map((s, i) => (
                <Fragment key={s.id}>
                  {!readOnly && <DropZone index={i} onDropAt={onDropAt} />}
                  <SectionFrame section={s} index={i} count={page.sections.length} readOnly={readOnly} />
                </Fragment>
              ))}
              {!readOnly && <DropZone index={page.sections.length} onDropAt={onDropAt} />}
            </SiteRoot>
          </div>
        </Frame>
      </div>
    </div>
  );
}
