"use client";
import { ArrowLeft, Check, Download, ExternalLink, Eye, Globe, Loader2, Monitor, Redo2, Rocket, Save, Smartphone, Tablet, Undo2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { exportSiteZip } from "./export-site";
import { useEditor } from "./store";

const DEVICES = [
  { v: "desktop", icon: Monitor, label: "Desktop" },
  { v: "tablet", icon: Tablet, label: "Tablet" },
  { v: "mobile", icon: Smartphone, label: "Mobile" },
] as const;

export function Toolbar() {
  const s = useEditor();
  const [pubOpen, setPubOpen] = useState(false);
  const [busy, setBusy] = useState<"" | "publish" | "export">("");
  const [err, setErr] = useState("");

  async function publish(publish: boolean) {
    setBusy("publish");
    setErr("");
    if (publish && s.dirty && !(await s.save())) { setBusy(""); setErr("Fix the save error first."); return; }
    const res = await fetch(`/api/projects/${s.projectId}/publish`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publish }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) s.setPublishState(data.status, data.subdomain);
    else setErr(data.error ?? "Could not publish");
    setBusy("");
  }

  async function preview() {
    const ok = !s.dirty || (await s.save());
    if (ok) window.open(`/studio/${s.projectId}/preview`, "_blank");
  }

  async function exportZip() {
    setBusy("export");
    setErr("");
    try { await exportSiteZip(s.doc); } catch (e) { console.error(e); setErr("Export failed. Is jszip installed? (npm install jszip)"); }
    setBusy("");
  }

  const liveUrl = s.subdomain ? `/s/${s.subdomain}` : null;
  const saveLabel = s.saving ? "Saving…" : s.saveError ? "Save failed" : s.dirty ? "Unsaved changes" : "All changes saved";

  return (
    <header className="relative z-50 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-950">
      <Link href="/dashboard" className="icon-btn" aria-label="Back to dashboard"><ArrowLeft size={18} /></Link>
      <input
        className="w-48 truncate rounded-lg bg-transparent px-2 py-1 text-sm font-semibold hover:bg-slate-100 focus:bg-slate-100 focus:outline-none dark:hover:bg-slate-800 dark:focus:bg-slate-800"
        value={s.doc.name}
        onChange={(e) => s.renameProject(e.target.value)}
        aria-label="Website name"
      />

      <div className="mx-auto flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {DEVICES.map(({ v, icon: Icon, label }) => (
          <button key={v} onClick={() => s.setDevice(v)} title={label} aria-label={label}
            className={`rounded-lg p-1.5 transition ${s.device === v ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}>
            <Icon size={16} />
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <button className="icon-btn" onClick={s.undo} disabled={!s.past.length} title="Undo" aria-label="Undo"><Undo2 size={17} /></button>
        <button className="icon-btn" onClick={s.redo} disabled={!s.future.length} title="Redo" aria-label="Redo"><Redo2 size={17} /></button>
      </div>
      <span className={`hidden w-36 text-xs lg:block ${s.saveError ? "text-red-500" : "text-slate-500"}`} title={s.saveError ?? undefined}>{s.saveError ?? saveLabel}</span>

      <button className="btn-ghost gap-1.5" onClick={() => s.save()} disabled={s.saving || !s.dirty}>
        {s.saving ? <Loader2 size={15} className="animate-spin" /> : s.dirty ? <Save size={15} /> : <Check size={15} />} Save
      </button>
      <button className="btn-ghost gap-1.5" onClick={preview}><Eye size={15} /> Preview</button>
      <button className="btn-ghost gap-1.5" onClick={exportZip} disabled={busy === "export"} title="Download the website as static HTML files">
        {busy === "export" ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Export
      </button>

      <div className="relative">
        <button className="btn-primary gap-1.5" onClick={() => setPubOpen((o) => !o)}>
          <Rocket size={15} /> {s.status === "PUBLISHED" ? "Published" : "Publish"}
        </button>
        {pubOpen && (
          <div className="absolute right-0 top-11 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Globe size={15} /> {s.status === "PUBLISHED" ? "Your site is live" : "Publish your site"}</div>
            {s.status === "PUBLISHED" && liveUrl && (
              <a href={liveUrl} target="_blank" className="mb-3 flex items-center gap-1 truncate text-sm text-indigo-600 hover:underline">
                {typeof window !== "undefined" ? window.location.origin : ""}{liveUrl} <ExternalLink size={12} />
              </a>
            )}
            <p className="mb-3 text-xs text-slate-500">{s.status === "PUBLISHED" ? "Publish again after editing to update the live site." : "Saves your latest changes and makes the site public at a free address."}</p>
            <div className="flex gap-2">
              <button className="btn-primary flex-1" disabled={busy === "publish"} onClick={() => publish(true)}>
                {busy === "publish" ? <Loader2 size={15} className="animate-spin" /> : s.status === "PUBLISHED" ? "Update live site" : "Publish"}
              </button>
              {s.status === "PUBLISHED" && <button className="btn-ghost" disabled={busy === "publish"} onClick={() => publish(false)}>Unpublish</button>}
            </div>
            {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
          </div>
        )}
      </div>
      <ThemeToggle />
      {err && !pubOpen && <span className="absolute right-3 top-14 z-50 rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white shadow-lg">{err}</span>}
    </header>
  );
}
