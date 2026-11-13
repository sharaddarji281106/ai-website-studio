"use client";
import { Check, Loader2, Send, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { FONTS, type Theme } from "@/modules/site/schema";
import { SECTION_DEFAULTS, SECTION_META, withDefaults } from "./defaults";
import { describeOp } from "./ops";
import { PropsEditor } from "./props-editor";
import { selectActivePage, useEditor } from "./store";

function useSelectedSection() {
  const page = useEditor(selectActivePage);
  const selectedId = useEditor((s) => s.selectedId);
  return page?.sections.find((s) => s.id === selectedId) ?? null;
}

/* ---------------- Content ---------------- */
export function ContentPanel() {
  const section = useSelectedSection();
  if (!section) {
    return (
      <div className="grid place-items-center gap-2 p-8 text-center text-sm text-slate-500">
        <Sparkles size={22} className="text-indigo-500" />
        Select a section on the canvas to edit its content.
      </div>
    );
  }
  const meta = SECTION_META[section.type];
  const merged = withDefaults(section.type, section.props);
  return (
    <div className="grid gap-4 p-3">
      <h3 className="panel-title">{meta.label}</h3>
      <PropsEditor
        value={merged}
        defaults={SECTION_DEFAULTS[section.type]}
        onChange={(props, key) => useEditor.getState().replaceProps(section.id, props, key)}
      />
    </div>
  );
}

/* ---------------- Style ---------------- */
function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)} className={`rounded-md px-2 py-1 text-xs font-medium transition ${value === o.v ? "bg-white shadow-sm dark:bg-slate-700" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function StylePanel() {
  const theme = useEditor((s) => s.doc.theme);
  const { updateTheme, replaceProps } = useEditor.getState();
  const section = useSelectedSection();
  const st = (section?.props.__style ?? {}) as { pad?: string; align?: string; bg?: string };
  const hide = (section?.props.__hide ?? {}) as { desktop?: boolean; tablet?: boolean; mobile?: boolean };
  const setStyle = (patch: Record<string, string>) => section && replaceProps(section.id, { ...section.props, __style: { ...st, ...patch } });
  const setHide = (k: "desktop" | "tablet" | "mobile", v: boolean) => section && replaceProps(section.id, { ...section.props, __hide: { ...hide, [k]: v } });

  return (
    <div className="grid gap-6 p-3">
      <div className="grid gap-3">
        <h3 className="panel-title">Website theme</h3>
        <div className="grid gap-1">
          <span className="field-label">Brand color</span>
          <div className="flex items-center gap-2">
            <input type="color" value={theme.primaryColor} onChange={(e) => updateTheme({ primaryColor: e.target.value })} className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0.5 dark:border-slate-700" />
            <input className="input" value={theme.primaryColor} maxLength={7} onChange={(e) => /^#[0-9a-fA-F]{6}$/.test(e.target.value) && updateTheme({ primaryColor: e.target.value })} />
          </div>
        </div>
        <div className="grid gap-1">
          <span className="field-label">Mode</span>
          <Segmented<Theme["mode"]> value={theme.mode} onChange={(mode) => updateTheme({ mode })} options={[{ v: "light", l: "Light" }, { v: "dark", l: "Dark" }]} />
        </div>
        <label className="grid gap-1">
          <span className="field-label">Font</span>
          <select className="input" value={theme.fontFamily} onChange={(e) => updateTheme({ fontFamily: e.target.value as Theme["fontFamily"] })}>
            {FONTS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </label>
      </div>

      {section ? (
        <div className="grid gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
          <h3 className="panel-title">{SECTION_META[section.type].label} section</h3>
          <div className="grid gap-1"><span className="field-label">Spacing</span>
            <Segmented value={st.pad ?? "md"} onChange={(pad) => setStyle({ pad })} options={[{ v: "none", l: "None" }, { v: "sm", l: "S" }, { v: "md", l: "M" }, { v: "lg", l: "L" }]} />
          </div>
          <div className="grid gap-1"><span className="field-label">Alignment</span>
            <Segmented value={st.align ?? "default"} onChange={(align) => setStyle({ align })} options={[{ v: "default", l: "Auto" }, { v: "left", l: "Left" }, { v: "center", l: "Center" }]} />
          </div>
          <div className="grid gap-1"><span className="field-label">Background</span>
            <Segmented value={st.bg ?? "default"} onChange={(bg) => setStyle({ bg })} options={[{ v: "default", l: "Default" }, { v: "muted", l: "Muted" }, { v: "primary", l: "Brand" }, { v: "dark", l: "Dark" }]} />
          </div>
          <div className="grid gap-1"><span className="field-label">Hide on</span>
            <div className="flex gap-3 text-sm">
              {(["desktop", "tablet", "mobile"] as const).map((k) => (
                <label key={k} className="flex items-center gap-1.5 capitalize"><input type="checkbox" checked={!!hide[k]} onChange={(e) => setHide(k, e.target.checked)} />{k}</label>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="border-t border-slate-200 pt-5 text-sm text-slate-500 dark:border-slate-800">Select a section to adjust its spacing, alignment, background and device visibility.</p>
      )}
    </div>
  );
}

/* ---------------- AI assistant ---------------- */
type Msg = { role: "user" | "ai" | "error"; text: string };
const SUGGESTIONS = ["Change the website theme to dark", "Add a pricing section", "Create a new About Us page", "Make the buttons and headings feel more modern"];

export function AiPanel() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const proposal = useEditor((s) => s.proposal);
  const doc = useEditor((s) => s.doc);
  const pageId = useEditor((s) => s.activePageId);

  async function send(text: string) {
    const instruction = text.trim();
    if (!instruction || busy) return;
    const st = useEditor.getState();
    const page = selectActivePage(st);
    setMsgs((m) => [...m, { role: "user", text: instruction }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${st.projectId}/ai-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction,
          selectedSectionId: st.selectedId,
          theme: st.doc.theme,
          page: { name: page.name, slug: page.slug, sections: page.sections },
          otherPages: st.doc.pages.filter((p) => p.id !== page.id).map((p) => ({ name: p.name, slug: p.slug })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      if (!data.ops?.length) {
        setMsgs((m) => [...m, { role: "ai", text: "I didn't find a change to make. Try describing it differently." }]);
      } else {
        st.setProposal({ summary: data.summary, ops: data.ops });
        setMsgs((m) => [...m, { role: "ai", text: data.summary }]);
      }
    } catch (e) {
      setMsgs((m) => [...m, { role: "error", text: e instanceof Error ? e.message : "Something went wrong" }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {msgs.length === 0 && (
          <div className="grid gap-2">
            <p className="text-sm text-slate-500">Ask for a change. I only touch what you ask for, and you approve before anything is applied.</p>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-indigo-400 hover:bg-indigo-50 dark:border-slate-700 dark:hover:bg-slate-800">{s}</button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "ml-6 bg-indigo-600 text-white" : m.role === "error" ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300" : "mr-6 bg-slate-100 dark:bg-slate-800"}`}>{m.text}</div>
        ))}
        {busy && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={14} className="animate-spin" /> Thinking (local models can take a while)…</div>}

        {proposal && (
          <div className="rounded-xl border-2 border-indigo-500 p-3">
            <p className="mb-2 text-sm font-semibold">Proposed changes</p>
            <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {proposal.ops.map((op, i) => <li key={i}>{describeOp(op, doc, pageId)}</li>)}
            </ul>
            <div className="flex gap-2">
              <button className="btn-primary flex-1 gap-1" onClick={() => { useEditor.getState().acceptProposal(); }}><Check size={14} /> Accept</button>
              <button className="btn-ghost flex-1 gap-1" onClick={() => useEditor.getState().setProposal(null)}><X size={14} /> Reject</button>
            </div>
          </div>
        )}
      </div>
      <form className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <input className="input" placeholder={proposal ? "Accept or reject first…" : "Describe a change…"} value={input} disabled={busy || !!proposal} onChange={(e) => setInput(e.target.value)} maxLength={600} />
        <button className="btn-primary px-3" disabled={busy || !!proposal || input.trim().length < 3} aria-label="Send"><Send size={16} /></button>
      </form>
    </div>
  );
}
