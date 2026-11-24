import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { SiteSpec } from "@/modules/site/schema";

export async function createProjectFromSpec(userId: string, spec: SiteSpec) {
  return db.project.create({
    data: {
      userId,
      name: spec.siteName,
      category: spec.category,
      theme: spec.theme as unknown as Prisma.InputJsonValue,
      pages: {
        create: spec.pages.map((p, i) => ({
          name: p.name,
          slug: p.slug,
          isHome: i === 0,
          content: { sections: p.sections } as unknown as Prisma.InputJsonValue,
        })),
      },
    },
    select: { id: true },
  });
}

/** Manual Build Mode: an empty website with a single empty home page (the full default theme is required by the editor). */
export async function createBlankProject(userId: string, name: string) {
  return db.project.create({
    data: {
      userId,
      name,
      category: "blank",
      theme: { primaryColor: "#4f46e5", mode: "light", fontFamily: "Inter" } as unknown as Prisma.InputJsonValue,
      pages: {
        create: [{ name: "Home", slug: "home", isHome: true, content: { sections: [] } as unknown as Prisma.InputJsonValue }],
      },
    },
    select: { id: true },
  });
}

/** Every query is scoped by userId, so users can never touch each other's data. */
export function getOwnedProject(userId: string, projectId: string) {
  return db.project.findFirst({
    where: { id: projectId, userId },
    include: { pages: { orderBy: [{ isHome: "desc" }, { name: "asc" }] } },
  });
}

export function getOwnedPage(userId: string, projectId: string, pageId: string) {
  return db.page.findFirst({ where: { id: pageId, projectId, project: { userId } } });
}
