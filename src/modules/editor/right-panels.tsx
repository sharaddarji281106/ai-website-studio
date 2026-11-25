"use client";
import { Check, Loader2, Send, SquareCode, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { CodeEditorModal } from "./code-editor";
import { SaveAsComponent } from "./library-panel";
import { SECTION_DEFAULTS, SECTION_META, withDefaults } from "./defaults";
import { isLocked } from "@/modules/site/style";
import { describeOp } from "./ops";
import { PropsEditor } from "./props-editor";
import { selectActivePage, useEditor } from "./store";

function useSelectedSection() {
  const page = useEditor(selectActivePage);
  const selectedId = useEditor((s) => s.selectedId);
  return page?.sections.find((s) => s.id === selectedId) ?? null;
}

/* ---------------- Custom code block ---------------- */
function CodeContent({ id, height, locked }: { id: string; height: unknown; locked: boolean }) {
  const [open, setOpen] = useState(false);
  const h = typeof height === "number" ? height : 320;
  return (
    <fieldset disabled={locked} className="grid min-w-0 gap-3 disabled:opacity-60">
      <button type="button" className="btn-primary gap-2" onClick={() => setOpen(true)}><SquareCode size={15} /> Open code editor</button>
      <label className="grid gap-1"><span className="field-label">Height (px)</span>
        <input type="number" className="input" min={80} max={1600} value={h}
          onChange={(e) => {
            const cur = selectActivePage(useEditor.getState()).sections.find((x) => x.id === id);
            if (cur) useEditor.getState().replaceProps(id, { ...cur.props, height: Number(e.target.value) }, "height");
          }} />
      </label>
      <p className="text-xs text-slate-500">Your HTML, CSS and JavaScript run inside a sandboxed frame. They cannot read your account, cookies or the rest of the page, and cannot send data out. The AI never sees or edits this block.</p>
      {open && <CodeEditorModal sectionId={id} onClose={() => setOpen(false)} />}
    </fieldset>
  );
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
      {isLocked(section.props) && (
        <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          This section is locked. Unlock it in the Layers tab to change it.
        </p>
      )}
      <SaveAsComponent />
      {section.type === "code" ? (
        <CodeContent id={section.id} height={section.props.height} locked={isLocked(section.props)} />
      ) : (
      <fieldset disabled={isLocked(section.props)} className="min-w-0 disabled:opacity-60">
        <PropsEditor
          value={merged}
          defaults={SECTION_DEFAULTS[section.type]}
          onChange={(props, key) => useEditor.getState().replaceProps(section.id, props, key)}
        />
      </fieldset>
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
          page: { name: page.name, slug: page.slug, sections: page.sections.map((s) => (s.type === "code" ? { id: s.id, type: s.type, props: {} } : s)) },
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
