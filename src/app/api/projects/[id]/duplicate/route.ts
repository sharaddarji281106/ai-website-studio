import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { handleKnownError, jsonError } from "@/lib/api";
import { assertCanCreateProject } from "@/lib/plans";
import { rateLimit } from "@/lib/rate-limit";
import { getSessionUser } from "@/lib/session";
import { getOwnedProject } from "@/modules/projects/service";

type Ctx = { params: Promise<{ id: string }> };

/** Duplicates a website (all pages, theme and content) as a new draft. */
export async function POST(_req: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!rateLimit(`duplicate:${user.id}`, 10, 60_000)) return jsonError("Too many requests. Slow down.", 429);

  const { id } = await params;
  try {
    const source = await getOwnedProject(user.id, id);
    if (!source) return jsonError("Not found", 404);
    await assertCanCreateProject(user.id, user.plan);

    const copy = await db.project.create({
      data: {
        userId: user.id,
        name: `${source.name} (copy)`.slice(0, 80),
        category: source.category,
        theme: source.theme as unknown as Prisma.InputJsonValue,
        pages: {
          create: source.pages.map((p) => ({
            name: p.name,
            slug: p.slug,
            isHome: p.isHome,
            content: p.content as unknown as Prisma.InputJsonValue,
            seo: p.seo as unknown as Prisma.InputJsonValue,
          })),
        },
      },
      select: { id: true },
    });
    return NextResponse.json({ id: copy.id }, { status: 201 });
  } catch (e) {
    return handleKnownError(e);
  }
}
