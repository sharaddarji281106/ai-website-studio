import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { slugify } from "@/lib/slug";
import { getSessionUser } from "@/lib/session";
import { getOwnedProject } from "@/modules/projects/service";

const MAX_PAGES = 30;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  const { id } = await params;

  const body = z.object({ name: z.string().trim().min(1).max(60) }).safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Invalid input", 400);

  const project = await getOwnedProject(user.id, id);
  if (!project) return jsonError("Not found", 404);
  if (project.pages.length >= MAX_PAGES) return jsonError("Page limit reached", 403);

  const taken = new Set(project.pages.map((p) => p.slug));
  const base = slugify(body.data.name);
  let slug = base;
  let n = 2;
  while (taken.has(slug)) slug = `${base}-${n++}`;

  const page = await db.page.create({
    data: { projectId: id, name: body.data.name, slug, content: { sections: [] } },
  });
  return NextResponse.json(page, { status: 201 });
}
