"use client";
import { Briefcase, Building2, LayoutTemplate, Loader2, Megaphone, ShoppingBag, Sparkles, Utensils, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { StartBlankButton } from "./start-blank-button";

const EXAMPLES: Record<string, string> = {
  Restaurant: "Create a modern restaurant website with a beautiful homepage, menu section, online reservation, gallery, contact page, and responsive design.",
  Portfolio: "Create a minimal portfolio website for a freelance product designer with selected work, an about page, testimonials and a contact form.",
  SaaS: "Create a landing page for a project management SaaS with a hero, features, pricing plans, testimonials, FAQ and a signup call to action.",
  Agency: "Create a website for a digital marketing agency with services, case studies, team, blog and contact pages.",
  Store: "Create an online store for handmade candles with a product showcase, about page, reviews and contact page.",
  "Real estate": "Create a real estate agency website with featured listings, about the agents, testimonials and a contact page.",
};

const ICONS: Record<string, typeof Sparkles> = {
  Restaurant: Utensils, Portfolio: Briefcase, SaaS: LayoutTemplate, Agency: Megaphone, Store: ShoppingBag, "Real estate": Building2,
};

function clock(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function NewWebsiteForm({ atLimit, used, max, plan }: { atLimit: boolean; used: number; max: number; plan: string }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
  if (!loading) return;

  const t = setInterval(() => setElapsed((s) => s + 1), 1000);
  return () => clearInterval(t);
}, [loading]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const tooShort = prompt.trim().length < 10;
  const disabled = loading || atLimit;

  async function generate() {
    if (disabled || tooShort) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setElapsed(0);
setLoading(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/projects/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? (res.status >= 502 ? "The server took too long or the AI is unreachable. Please try again." : "Something went wrong"));
      }
      router.push(`/studio/${data.id}`);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setNotice("Stopped waiting. If the server still finishes, the new site will appear in your list after you refresh the page.");
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
      setLoading(false);
    }
  }

  return (
    <section className="card p-6 lg:col-span-2" aria-labelledby="new-site-title">
      <div id="new-site-title" className="mb-1 flex items-center gap-2 font-semibold">
        <Sparkles size={18} className="text-indigo-500" /> What do you want to build?
      </div>

      {atLimit ? (
        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200" role="status">
          You’re using {used} of {max} website{max === 1 ? "" : "s"} on the {plan} plan. Delete a website below, or upgrade your plan, to create another.
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-500">Describe your website in a few sentences. Pick a starter below or write your own.</p>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(EXAMPLES).map(([k, v]) => {
              const Icon = ICONS[k] ?? Sparkles;
              const active = prompt === v;
              return (
                <button key={k} type="button" disabled={loading} onClick={() => setPrompt(v)} aria-pressed={active}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition disabled:opacity-50 ${active ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" : "border-slate-200 text-slate-700 hover:border-indigo-400 dark:border-slate-700 dark:text-slate-200"}`}>
                  <Icon size={16} className="shrink-0 text-indigo-500" /> {k}
                </button>
              );
            })}
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") generate(); }}
            maxLength={1000}
            rows={5}
            disabled={loading}
            aria-label="Describe your website"
            placeholder="e.g. A modern website for my yoga studio with class schedule, pricing, teacher bios and a booking contact form…"
            className="input"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>{tooShort && prompt.length > 0 ? "Add a little more detail (at least 10 characters)." : "Tip: press Ctrl+Enter to generate."}</span>
            <span>{prompt.length}/1000</span>
          </div>

          {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
          {notice && <p role="status" className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">{notice}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={generate} disabled={disabled || tooShort} className="btn-primary gap-2 px-5 py-2.5">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Generating… {clock(elapsed)}</> : <><Sparkles size={16} /> Generate website</>}
            </button>
            {!loading && <StartBlankButton label="Or build it myself" />}
            {loading && (
              <>
                <button type="button" onClick={() => abortRef.current?.abort()} className="btn-ghost gap-1.5"><X size={15} /> Stop waiting</button>
                <span className="text-sm text-slate-500">Your AI model is writing the site. This can take a few minutes. You can keep this tab open.</span>
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
