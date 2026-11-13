import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { slugify } from "@/lib/slug";
import { getSessionUser } from "@/lib/session";
import { getOwnedPage } from "@/modules/projects/service";

type Ctx = { params: Promise<{ id: string; pageId: string }> };

const patchSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  slug: z.string().trim().min(1).max(60).optional(),
  isHome: z.literal(true).optional(),
});

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  const { id, pageId } = await params;

  const body = patchSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Invalid input", 400);

  const page = await getOwnedPage(user.id, id, pageId);
  if (!page) return jsonError("Not found", 404);

  const data: { name?: string; slug?: string; isHome?: boolean } = {};
  if (body.data.name) data.name = body.data.name;
  if (body.data.slug) {
    const slug = slugify(body.data.slug);
    const clash = await db.page.findFirst({ where: { projectId: id, slug, NOT: { id: pageId } } });
    if (clash) return jsonError("That URL is already used by another page", 409);
    data.slug = slug;
  }

  if (body.data.isHome) {
    await db.$transaction([
      db.page.updateMany({ where: { projectId: id }, data: { isHome: false } }),
      db.page.update({ where: { id: pageId }, data: { ...data, isHome: true } }),
    ]);
  } else {
    await db.page.update({ where: { id: pageId }, data });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  const { id, pageId } = await params;

  const page = await getOwnedPage(user.id, id, pageId);
  if (!page) return jsonError("Not found", 404);
  if (page.isHome) return jsonError("Set another page as homepage before deleting this one", 400);

  await db.page.delete({ where: { id: pageId } });
  return NextResponse.json({ ok: true });
}
