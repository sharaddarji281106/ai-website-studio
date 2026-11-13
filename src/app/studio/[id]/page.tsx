import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { EditorShell } from "@/modules/editor/editor-shell";
import type { Doc } from "@/modules/editor/types";
import { getOwnedProject } from "@/modules/projects/service";
import type { Section, Theme } from "@/modules/site/schema";

export const dynamic = "force-dynamic";

export default async function StudioPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const project = await getOwnedProject(user.id, id);
  if (!project) notFound();

  const doc: Doc = {
    name: project.name,
    theme: project.theme as unknown as Theme,
    pages: project.pages.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      isHome: p.isHome,
      seo: (p.seo ?? {}) as { title?: string; description?: string },
      sections: ((p.content as { sections?: Section[] } | null)?.sections ?? []) as Section[],
    })),
  };

  return <EditorShell projectId={project.id} initialDoc={doc} status={project.status} subdomain={project.subdomain} />;
}
