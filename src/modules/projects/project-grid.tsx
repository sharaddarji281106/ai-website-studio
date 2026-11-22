"use client";
import { Check, Copy, ExternalLink, Loader2, Pencil, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export type ProjectItem = {
  id: string;
  name: string;
  category: string | null;
  status: "DRAFT" | "PUBLISHED";
  subdomain: string | null;
  updatedAt: string;
  pages: number;
  color: string;
  heading: string;
  sub: string;
  kinds: string[];
};

type Filter = "ALL" | "PUBLISHED" | "DRAFT";
type Sort = "recent" | "name";

/** A small drawing of the site's home page: browser bar, hero text and a few content blocks. */
function Thumb({ p }: { p: ProjectItem }) {
  return (
    <div aria-hidden className="pointer-events-none flex h-full flex-col bg-white dark:bg-slate-900">
      <div className="flex items-center gap-1 border-b border-slate-100 px-2.5 py-1.5 dark:border-slate-800">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" /><span className="h-1.5 w-1.5 rounded-full bg-slate-300" /><span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
      </div>
      <div className="px-3 py-3" style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}99)` }}>
        <p className="line-clamp-2 text-[11px] font-bold leading-tight text-white">{p.heading || p.name}</p>
        {p.sub ? <p className="mt-1 line-clamp-1 text-[8px] text-white/80">{p.sub}</p> : null}
        <span className="mt-2 inline-block h-2.5 w-10 rounded-full bg-white/90" />
      </div>
      <div className="grid flex-1 grid-cols-3 gap-1.5 p-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded bg-slate-100 p-1 dark:bg-slate-800">
            <div className="h-1 w-2/3 rounded-full" style={{ background: `${p.color}88` }} />
            <div className="mt-1 h-1 w-full rounded-full bg-slate-200 dark:bg-slate-700" />
            {p.kinds[i] ? <p className="mt-1 truncate text-[7px] capitalize text-slate-400">{p.kinds[i]}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Rendered after mount so the server and browser never disagree about "now". */
function TimeAgo({ iso }: { iso: string }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const diff = (new Date(iso).getTime() - Date.now()) / 1000;
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const steps: [Intl.RelativeTimeFormatUnit, number][] = [["day", 86400], ["hour", 3600], ["minute", 60]];
    for (const [unit, secs] of steps) {
      if (Math.abs(diff) >= secs) { setText(rtf.format(Math.round(diff / secs), unit)); return; }
    }
    setText("just now");
  }, [iso]);
  return <span>{text ? `Edited ${text}` : ""}</span>;
}

async function call(url: string, init: RequestInit): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, init);
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data.error ?? "Something went wrong" };
  } catch {
    return { ok: false, error: "Network error. Check your connection and try again." };
  }
}

function ProjectCard({ p, atLimit, onNotice, onRename }: { p: ProjectItem; atLimit: boolean; onNotice: (m: string) => void; onRename: (id: string, name: string) => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "rename" | "delete">("view");
  const [busy, setBusy] = useState<"" | "rename" | "delete" | "duplicate">("");
  const [draft, setDraft] = useState(p.name);
  const published = p.status === "PUBLISHED";

  async function rename() {
    const name = draft.trim();
    if (!name || name === p.name) { setMode("view"); setDraft(p.name); return; }
    setBusy("rename");
    const r = await call(`/api/projects/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setBusy("");
    if (!r.ok) { onNotice(r.error ?? "Could not rename."); return; }
    onRename(p.id, name);
    setMode("view");
    router.refresh();
  }

  async function duplicate() {
    setBusy("duplicate");
    const r = await call(`/api/projects/${p.id}/duplicate`, { method: "POST" });
    setBusy("");
    if (!r.ok) { onNotice(r.error ?? "Could not duplicate."); return; }
    router.refresh();
  }

  async function remove() {
    setBusy("delete");
    const r = await call(`/api/projects/${p.id}`, { method: "DELETE" });
    if (!r.ok) { setBusy(""); setMode("view"); onNotice(r.error ?? "Could not delete."); return; }
    router.refresh();
  }

  return (
    <li className="card flex flex-col overflow-hidden transition hover:shadow-md">
      <Link href={`/studio/${p.id}`} aria-label={`Edit ${p.name}`} className="relative block aspect-[16/10] overflow-hidden border-b border-slate-100 dark:border-slate-800">
        <Thumb p={p} />
        <span className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${published ? "bg-emerald-500 text-white" : "bg-white/90 text-slate-700"}`}>
          {published ? "Published" : "Draft"}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          {mode === "rename" ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={draft}
                maxLength={80}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") rename(); if (e.key === "Escape") { setMode("view"); setDraft(p.name); } }}
                aria-label="Website name"
                className="input py-1"
              />
              <button className="icon-btn" onClick={rename} disabled={busy === "rename"} aria-label="Save name">
                {busy === "rename" ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              </button>
              <button className="icon-btn" onClick={() => { setMode("view"); setDraft(p.name); }} aria-label="Cancel rename"><X size={16} /></button>
            </div>
          ) : (
            <Link href={`/studio/${p.id}`} className="block truncate font-semibold hover:text-indigo-600 dark:hover:text-indigo-400">{p.name}</Link>
          )}
          <p className="mt-0.5 text-xs text-slate-500">
            {p.category ? <span className="capitalize">{p.category} · </span> : null}
            {p.pages} {p.pages === 1 ? "page" : "pages"} · <TimeAgo iso={p.updatedAt} />
          </p>
        </div>

        {mode === "delete" ? (
          <div className="mt-auto flex items-center justify-between gap-2 rounded-xl bg-red-50 p-2 pl-3 text-sm dark:bg-red-500/10" role="alertdialog" aria-label={`Delete ${p.name}?`}>
            <span className="text-red-700 dark:text-red-300">Delete permanently?</span>
            <span className="flex gap-1">
              <button onClick={remove} disabled={busy === "delete"} className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {busy === "delete" ? <Loader2 size={13} className="animate-spin" /> : null} Delete
              </button>
              <button onClick={() => setMode("view")} disabled={busy === "delete"} className="btn-mini">Cancel</button>
            </span>
          </div>
        ) : (
          <div className="mt-auto flex items-center justify-between">
            <Link href={`/studio/${p.id}`} className="btn-ghost px-3 py-1.5">Edit</Link>
            <div className="flex items-center">
              {published && p.subdomain ? (
                <Link href={`/s/${p.subdomain}`} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="Open live site" title="Open live site"><ExternalLink size={16} /></Link>
              ) : null}
              <button className="icon-btn" onClick={() => { setDraft(p.name); setMode("rename"); }} aria-label="Rename" title="Rename"><Pencil size={16} /></button>
              <button className="icon-btn" onClick={duplicate} disabled={busy === "duplicate" || atLimit} aria-label="Duplicate" title={atLimit ? "Website limit reached" : "Duplicate"}>
                {busy === "duplicate" ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
              </button>
              <button className="icon-btn text-red-500 hover:text-red-600" onClick={() => setMode("delete")} aria-label="Delete" title="Delete"><Trash2 size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

export function ProjectGrid({ projects, atLimit }: { projects: ProjectItem[]; atLimit: boolean }) {
  const [items, setItems] = useState(projects);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("recent");
  const [notice, setNotice] = useState("");

  // Re-sync with the server after router.refresh().
  useEffect(() => setItems(projects), [projects]);

  const counts = useMemo(() => ({
    ALL: items.length,
    PUBLISHED: items.filter((p) => p.status === "PUBLISHED").length,
    DRAFT: items.filter((p) => p.status === "DRAFT").length,
  }), [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((p) => (filter === "ALL" || p.status === filter) && (!q || p.name.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q)));
    return sort === "name" ? [...list].sort((a, b) => a.name.localeCompare(b.name)) : [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [items, query, filter, sort]);

  return (
    <section aria-labelledby="sites-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="sites-title" className="text-lg font-semibold">Your websites</h2>
        {items.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search websites" aria-label="Search websites" className="input w-48 pl-9" />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort websites" className="input w-auto">
              <option value="recent">Recently edited</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        )}
      </div>

      {items.length > 1 && (
        <div className="mb-5 flex gap-2" role="group" aria-label="Filter by status">
          {(["ALL", "PUBLISHED", "DRAFT"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${filter === f ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" : "border-slate-200 text-slate-600 hover:border-indigo-400 dark:border-slate-700 dark:text-slate-300"}`}>
              {f === "ALL" ? "All" : f === "PUBLISHED" ? "Published" : "Drafts"} ({counts[f]})
            </button>
          ))}
        </div>
      )}

      {notice && (
        <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss" className="shrink-0"><X size={16} /></button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-slate-700">
          <p className="font-medium text-slate-700 dark:text-slate-200">No websites yet</p>
          <p className="mt-1 text-sm">Describe your first website in the box above and AI will build it for you.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
          No websites match your search.{" "}
          <button className="font-medium text-indigo-600 underline" onClick={() => { setQuery(""); setFilter("ALL"); }}>Clear filters</button>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <ProjectCard key={p.id} p={p} atLimit={atLimit} onNotice={setNotice} onRename={(id, name) => setItems((cur) => cur.map((x) => (x.id === id ? { ...x, name } : x)))} />
          ))}
        </ul>
      )}
    </section>
  );
}
