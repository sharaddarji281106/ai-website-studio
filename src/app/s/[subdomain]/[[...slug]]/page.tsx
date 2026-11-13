import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { pageMetadata, pickPage, SitePage } from "@/modules/renderer/site-page";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ subdomain: string; slug?: string[] }> };

async function load(subdomain: string, slug?: string[]) {
  const project = await db.project.findFirst({ where: { subdomain, status: "PUBLISHED" }, include: { pages: true } });
  if (!project) return null;
  const page = pickPage(project.pages, slug);
  return page ? { project, page } : null;
}

export async function generateMetadata({ params }: Params) {
  const { subdomain, slug } = await params;
  const found = await load(subdomain, slug);
  return found ? pageMetadata(found.project, found.page) : {};
}

export default async function PublicSite({ params }: Params) {
  const { subdomain, slug } = await params;
  const found = await load(subdomain, slug);
  if (!found) notFound();
  return <SitePage project={found.project} page={found.page} base={`/s/${subdomain}`} />;
}
