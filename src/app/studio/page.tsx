import { FileText, LayoutGrid, LayoutTemplate, Layers, Paintbrush, Pencil, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AppHeader } from "@/components/app-header";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLAN_LIMITS } from "@/lib/plans";
import { StartBlankButton } from "@/modules/projects/start-blank-button";

export const dynamic = "force-dynamic";

const SECTION_LINKS = [
  { panel: "layers", label: "Editor", icon: Layers },
  { panel: "pages", label: "Pages", icon: FileText },
  { panel: "components", label: "Components", icon: LayoutGrid },
  { panel: "style", label: "Style", icon: Paintbrush },
  { panel: "ai", label: "AI", icon: Sparkles },
] as const;

export default async function StudioHomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/studio");

  const userId = session.user.id;
  const plan = session.user.plan;
  const limits = PLAN_LIMITS[plan];

  const [projects, total] = await Promise.all([
    db.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, name: true, status: true, _count: { select: { pages: true } } },
    }),
    db.project.count({ where: { userId } }),
  ]);
  const atLimit = total >= limits.maxProjects;

  return (
    <>
      <AppHeader name={session.user.name ?? session.user.email ?? "Account"} email={session.user.email ?? undefined} plan={plan} />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-[Poppins] text-3xl font-bold tracking-tight">Studio</h1>
          <p className="mt-1 text-slate-500">Choose how you want to start, or jump back into a website.</p>
        </div>

        {atLimit && (
          <div role="status" className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            You’re using {total} of {limits.maxProjects} website{limits.maxProjects === 1 ? "" : "s"} on the {plan} plan. Delete a website, or upgrade, to start a new one. You can still open your existing websites below.
          </div>
        )}

        <div className="mb-12 grid gap-5 md:grid-cols-3">
          <section className="card flex flex-col p-6" aria-labelledby="start-ai">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"><Sparkles size={20} /></div>
            <h2 id="start-ai" className="font-semibold">Build with AI</h2>
            <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">Describe your website and the AI generates the pages. Then edit everything in the studio.</p>
            <Link href="/dashboard#new-site-title" aria-disabled={atLimit} className={`btn-primary mt-5 gap-2 ${atLimit ? "pointer-events-none opacity-50" : ""}`}>
              <Sparkles size={16} /> Describe your website
            </Link>
          </section>

          <section className="card flex flex-col p-6" aria-labelledby="start-blank">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"><Pencil size={20} /></div>
            <h2 id="start-blank" className="font-semibold">Build it myself</h2>
            <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">Start from an empty page and add sections, text and styles yourself. No AI needed.</p>
            <div className="mt-5 flex flex-wrap">
              <StartBlankButton label="Open a blank page" className="btn-primary w-full gap-2" disabled={atLimit} />
            </div>
          </section>

          <section className="card flex flex-col p-6 opacity-80" aria-labelledby="start-template">
            <div className="mb-4 flex items-center justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800"><LayoutTemplate size={20} /></div>
              <span className="badge">Coming soon</span>
            </div>
            <h2 id="start-template" className="font-semibold">Start from a template</h2>
            <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">Pick a ready-made design and customise it. Templates arrive in a later update.</p>
          </section>
        </div>

        <section aria-labelledby="continue-title">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="continue-title" className="text-lg font-semibold">Continue editing</h2>
            {total > projects.length && <Link href="/dashboard" className="text-sm font-medium text-indigo-600 hover:underline">View all websites</Link>}
          </div>

          {projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
              No websites yet. Pick an option above to create your first one.
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <li key={p.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/studio/${p.id}`} className="min-w-0 truncate font-semibold hover:text-indigo-600 dark:hover:text-indigo-400">{p.name}</Link>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${p.status === "PUBLISHED" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                      {p.status === "PUBLISHED" ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{p._count.pages} {p._count.pages === 1 ? "page" : "pages"}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {SECTION_LINKS.map(({ panel, label, icon: Icon }) => (
                      <Link key={panel} href={`/studio/${p.id}?panel=${panel}`} className="btn-mini" aria-label={`${label} for ${p.name}`}>
                        <Icon size={12} /> {label}
                      </Link>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
