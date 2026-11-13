import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AppHeader } from "@/components/app-header";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLAN_LIMITS } from "@/lib/plans";
import { DeleteProjectButton } from "@/modules/projects/delete-project-button";
import { NewWebsiteForm } from "@/modules/projects/new-website-form";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const projects = await db.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { pages: true } } },
  });
  const limits = PLAN_LIMITS[session.user.plan];

  return (
    <>
      <AppHeader name={session.user.name ?? session.user.email ?? "Account"} plan={session.user.plan} />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Hi, {session.user.name?.split(" ")[0] ?? "there"} 👋</h1>
          <p className="text-sm text-slate-500">{projects.length} of {limits.maxProjects} websites used on your {session.user.plan} plan.</p>
        </div>

        <NewWebsiteForm />

        <h2 className="mb-4 text-lg font-semibold">Your websites</h2>
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-slate-700">No websites yet. Describe one above to get started.</div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const color = (p.theme as { primaryColor?: string } | null)?.primaryColor ?? "#4f46e5";
              return (
                <li key={p.id} className="card group overflow-hidden transition hover:shadow-md">
                  <Link href={`/studio/${p.id}`} className="block">
                    <div className="h-28" style={{ background: `linear-gradient(135deg, ${color}, ${color}55)` }} />
                  </Link>
                  <div className="flex items-start justify-between gap-2 p-4">
                    <Link href={`/studio/${p.id}`} className="min-w-0">
                      <p className="truncate font-semibold">{p.name}</p>
                      <p className="mt-0.5 text-xs capitalize text-slate-500">{p.category} · {p._count.pages} pages · {p.status === "PUBLISHED" ? "Published" : "Draft"}</p>
                    </Link>
                    <div className="flex shrink-0 items-center">
                      {p.status === "PUBLISHED" && p.subdomain && (
                        <Link href={`/s/${p.subdomain}`} target="_blank" className="icon-btn" aria-label="Open live site"><ExternalLink size={16} /></Link>
                      )}
                      <DeleteProjectButton id={p.id} name={p.name} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
