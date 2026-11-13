import type { Page, Project } from "@prisma/client";
import type { Section, Theme } from "@/modules/site/schema";
import { SitePageView } from "./site-view";

export function pickPage(pages: Page[], slug?: string[]): Page | null {
  const wanted = slug?.[0];
  if (!wanted) return pages.find((p) => p.isHome) ?? pages[0] ?? null;
  return pages.find((p) => p.slug === wanted) ?? null;
}

export function SitePage({ project, page, base }: { project: Project; page: Page; base: string }) {
  const sections = ((page.content as { sections?: Section[] } | null)?.sections ?? []) as Section[];
  return <SitePageView theme={project.theme as unknown as Theme} sections={sections} base={base} live />;
}

export function pageMetadata(project: Project, page: Page) {
  const seo = (page.seo ?? {}) as { title?: string; description?: string };
  return {
    title: seo.title || `${page.name} | ${project.name}`,
    description: seo.description || undefined,
  };
}
