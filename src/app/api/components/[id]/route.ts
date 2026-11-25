import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { getSessionUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  const { id } = await params;
  const body = z.object({ name: z.string().trim().min(1).max(60) }).safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Invalid input", 400);
  // updateMany with userId in the filter = ownership check (no one can touch another user's component)
  const r = await db.savedComponent.updateMany({ where: { id, userId: user.id }, data: { name: body.data.name } });
  if (r.count === 0) return jsonError("Not found", 404);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  const { id } = await params;
  const r = await db.savedComponent.deleteMany({ where: { id, userId: user.id } });
  if (r.count === 0) return jsonError("Not found", 404);
  return NextResponse.json({ ok: true });
}
