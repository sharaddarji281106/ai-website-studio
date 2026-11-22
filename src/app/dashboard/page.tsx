import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AppHeader } from "@/components/app-header";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLAN_LIMITS } from "@/lib/plans";
import { NewWebsiteForm } from "@/modules/projects/new-website-form";
import { ProjectGrid, type ProjectItem } from "@/modules/projects/project-grid";

export const dynamic = "force-dynamic";

const HEX = /^#[0-9a-f]{6}$/i;

type RawSection = { type?: string; props?: Record<string, unknown> };
const str = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");

/** Small, safe summary of a site's home page, used to draw the card thumbnail. */
function previewOf(content: unknown) {
  const sections = ((content as { sections?: RawSection[] } | null)?.sections ?? []) as RawSection[];
  const hero = sections.find((s) => s.type === "hero");
  return {
    heading: str(hero?.props?.heading, 60),
    sub: str(hero?.props?.subheading, 90),
    kinds: sections.map((s) => String(s.type)).filter((k) => !["navbar", "footer", "hero"].includes(k)).slice(0, 3),
  };
}

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className="font-semibold">{limit ? `${used} / ${limit}` : used}</span>
      </div>
      {limit ? (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
          <div className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-indigo-500"}`} style={{ width: `${pct}%` }} />
        </div>
      ) : null}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;
  const plan = session.user.plan;
  const limits = PLAN_LIMITS[plan];
  const unlimitedAi = process.env.DISABLE_AI_QUOTA === "true";

  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [projects, genUsed, editUsed] = await Promise.all([
    db.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { pages: true } }, pages: { where: { isHome: true }, take: 1, select: { content: true } } },
    }),
    db.usageRecord.count({ where: { userId, kind: "ai_generation", createdAt: { gte: since } } }),
    db.usageRecord.count({ where: { userId, kind: "ai_edit", createdAt: { gte: since } } }),
  ]);

  const items: ProjectItem[] = projects.map((p) => {
    const c = (p.theme as { primaryColor?: string } | null)?.primaryColor;
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      status: p.status,
      subdomain: p.subdomain,
      updatedAt: p.updatedAt.toISOString(),
      pages: p._count.pages,
      color: c && HEX.test(c) ? c : "#4f46e5",
      ...previewOf(p.pages[0]?.content),
    };
  });

  const published = items.filter((p) => p.status === "PUBLISHED").length;
  const atLimit = items.length >= limits.maxProjects;
  const firstName = session.user.name?.split(" ")[0];

  return (
    <>
      <AppHeader name={session.user.name ?? session.user.email ?? "Account"} email={session.user.email ?? undefined} plan={plan} />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-[Poppins] text-3xl font-bold tracking-tight">{firstName ? `Welcome back, ${firstName}` : "Welcome back"}</h1>
          <p className="mt-1 text-slate-500">Describe a website and let AI build it, or pick up where you left off.</p>
        </div>

        <div className="mb-12 grid gap-5 lg:grid-cols-3">
          <NewWebsiteForm atLimit={atLimit} used={items.length} max={limits.maxProjects} plan={plan} />
          <aside className="card h-fit p-6" aria-label="Plan and usage">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold">Your plan</h2>
              <span className="badge">{plan}</span>
            </div>
            <div className="space-y-4">
              <UsageRow label="Websites" used={items.length} limit={limits.maxProjects} />
              <UsageRow label="AI generations this month" used={genUsed} limit={unlimitedAi ? null : limits.aiGenerationsPerMonth} />
              <UsageRow label="AI edits this month" used={editUsed} limit={unlimitedAi ? null : limits.aiEditsPerMonth} />
            </div>
            <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800">
              {published} {published === 1 ? "site is" : "sites are"} live.{unlimitedAi ? " AI usage is unlimited in this environment." : ""}
            </p>
          </aside>
        </div>

        <ProjectGrid projects={items} atLimit={atLimit} />
      </main>
    </>
  );
}
