"use client";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const EXAMPLES: Record<string, string> = {
  Restaurant: "Create a modern restaurant website with a beautiful homepage, menu section, online reservation, gallery, contact page, and responsive design.",
  Portfolio: "Create a minimal portfolio website for a freelance product designer with selected work, an about page, testimonials and a contact form.",
  "SaaS": "Create a landing page for a project management SaaS with a hero, features, pricing plans, testimonials, FAQ and a signup call to action.",
  Agency: "Create a website for a digital marketing agency with services, case studies, team, blog and contact pages.",
  Store: "Create an online store for handmade candles with a product showcase, about page, reviews and contact page.",
  "Real estate": "Create a real estate agency website with featured listings, about the agents, testimonials and a contact page.",
};

export function NewWebsiteForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/projects/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(`/studio/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <section className="card mb-10 p-6">
      <div className="mb-1 flex items-center gap-2 font-semibold"><Sparkles size={18} className="text-indigo-500" /> What do you want to build?</div>
      <p className="mb-4 text-sm text-slate-500">Describe your website in a few sentences. Pick a starter below or write your own.</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {Object.entries(EXAMPLES).map(([k, v]) => (
          <button key={k} type="button" disabled={loading} onClick={() => setPrompt(v)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300">{k}</button>
        ))}
      </div>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={1000} rows={4} disabled={loading} placeholder="e.g. A modern website for my yoga studio with class schedule, pricing, teacher bios and a booking contact form…" className="input" />
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-4 flex items-center gap-3">
        <button onClick={generate} disabled={loading || prompt.trim().length < 10} className="btn-primary gap-2 px-5 py-2.5">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><Sparkles size={16} /> Generate website</>}
        </button>
        {loading && <span className="text-sm text-slate-500">Your local model is writing the site. This can take a few minutes on CPU.</span>}
      </div>
    </section>
  );
}
