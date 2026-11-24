import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { slugify } from "@/lib/slug";
import { getSessionUser } from "@/lib/session";
import { sanitizeDeep } from "@/modules/site/normalize";
import { FONTS, SECTION_TYPES } from "@/modules/site/schema";
import { cleanSectionProps } from "@/modules/site/style";

const MAX_PAGES = 30;

const sectionSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.enum(SECTION_TYPES),
  props: z.record(z.string(), z.unknown()),
});
const docSchema = z.object({
  name: z.string().trim().min(1).max(80),
  theme: z.object({
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    mode: z.enum(["light", "dark"]),
    fontFamily: z.enum(FONTS),
    headingFont: z.enum(FONTS).optional(),
  }),
  pages: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        name: z.string().trim().min(1).max(60),
        slug: z.string().trim().min(1).max(60),
        isHome: z.boolean(),
        seo: z.object({ title: z.string().max(120).optional(), description: z.string().max(300).optional() }).default({}),
        sections: z.array(sectionSchema).max(60),
      }),
    )
    .min(1)
    .max(MAX_PAGES),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  const { id } = await params;

  const owned = await db.project.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!owned) return jsonError("Not found", 404);

  const parsed = docSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid document", 400);
  const doc = parsed.data;

  // normalize: slugs, uniqueness, exactly one homepage
  const slugs = new Set<string>();
  const pages = doc.pages.map((p) => {
    const slug = slugify(p.slug);
    return { ...p, slug };
  });
  for (const p of pages) {
    if (slugs.has(p.slug)) return jsonError(`Two pages use the URL "/${p.slug}". Make each page URL unique.`, 400);
    slugs.add(p.slug);
  }
  const homeId = pages.find((p) => p.isHome)?.id ?? pages[0].id;

  const ids = pages.map((p) => p.id);
  const existing = await db.page.findMany({ where: { id: { in: ids } }, select: { id: true, projectId: true } });
  if (existing.some((p) => p.projectId !== id)) return jsonError("Invalid page id", 400);
  const existingIds = new Set(existing.map((p) => p.id));

  const dataFor = (p: (typeof pages)[number]) => ({
    name: p.name,
    slug: p.slug,
    isHome: p.id === homeId,
    seo: p.seo as Prisma.InputJsonValue,
    content: {
      // styles are validated again here, so only well-formed values can ever be stored
      sections: p.sections.map((s) => ({ ...s, props: cleanSectionProps(sanitizeDeep(s.props) as Record<string, unknown>) })),
    } as unknown as Prisma.InputJsonValue,
  });

  try {
    await db.$transaction([
      db.page.deleteMany({ where: { projectId: id, id: { notIn: ids } } }),
      // park slugs first so swapping two page URLs never violates the unique index
      ...pages.filter((p) => existingIds.has(p.id)).map((p) => db.page.update({ where: { id: p.id }, data: { slug: `__tmp_${p.id}` } })),
      ...pages.map((p) =>
        existingIds.has(p.id)
          ? db.page.update({ where: { id: p.id }, data: dataFor(p) })
          : db.page.create({ data: { id: p.id, projectId: id, ...dataFor(p) } }),
      ),
      db.project.update({ where: { id }, data: { name: doc.name, theme: doc.theme as Prisma.InputJsonValue } }),
    ]);
  } catch (e) {
    console.error(e);
    return jsonError("Could not save. Please try again.", 500);
  }
  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}
