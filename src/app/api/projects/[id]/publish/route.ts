import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { slugify } from "@/lib/slug";
import { getSessionUser } from "@/lib/session";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  const { id } = await params;

  const body = z.object({ publish: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Invalid input", 400);

  const project = await db.project.findFirst({ where: { id, userId: user.id } });
  if (!project) return jsonError("Not found", 404);

  if (!body.data.publish) {
    await db.project.update({ where: { id }, data: { status: "DRAFT" } });
    return NextResponse.json({ status: "DRAFT", subdomain: project.subdomain });
  }

  let subdomain = project.subdomain;
  if (!subdomain) {
    const base = slugify(project.name).slice(0, 40);
    subdomain = base;
    for (let i = 0; i < 6; i++) {
      const taken = await db.project.findFirst({ where: { subdomain }, select: { id: true } });
      if (!taken) break;
      subdomain = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    }
  }
  await db.project.update({ where: { id }, data: { status: "PUBLISHED", subdomain } });
  return NextResponse.json({ status: "PUBLISHED", subdomain });
}
