import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { getOwnedProject } from "@/modules/projects/service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  const { id } = await params;
  const project = await getOwnedProject(user.id, id);
  return project ? NextResponse.json(project) : jsonError("Not found", 404);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  const { id } = await params;
  const body = z.object({ name: z.string().trim().min(1).max(80) }).safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Invalid input", 400);
  const res = await db.project.updateMany({ where: { id, userId: user.id }, data: { name: body.data.name } });
  return res.count ? NextResponse.json({ ok: true }) : jsonError("Not found", 404);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  const { id } = await params;
  const res = await db.project.deleteMany({ where: { id, userId: user.id } });
  return res.count ? NextResponse.json({ ok: true }) : jsonError("Not found", 404);
}
