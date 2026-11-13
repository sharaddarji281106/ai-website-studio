import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { pageMetadata, pickPage, SitePage } from "@/modules/renderer/site-page";
import { getOwnedProject } from "@/modules/projects/service";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string; slug?: string[] }> };

export async function generateMetadata({ params }: Params) {
  const user = await getSessionUser();
  if (!user) return {};
  const { id, slug } = await params;
  const project = await getOwnedProject(user.id, id);
  const page = project ? pickPage(project.pages, slug) : null;
  return project && page ? pageMetadata(project, page) : {};
}

export default async function PreviewPage({ params }: Params) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id, slug } = await params;
  const project = await getOwnedProject(user.id, id);
  if (!project) notFound();
  const page = pickPage(project.pages, slug);
  if (!page) notFound();
  return <SitePage project={project} page={page} base={`/studio/${id}/preview`} />;
}
