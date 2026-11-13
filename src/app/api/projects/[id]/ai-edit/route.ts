import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleKnownError, jsonError } from "@/lib/api";
import { assertAiQuota } from "@/lib/plans";
import { rateLimit } from "@/lib/rate-limit";
import { getSessionUser } from "@/lib/session";
import { proposeEdit } from "@/modules/ai/edit-site";

const bodySchema = z.object({
  instruction: z.string().trim().min(3).max(600),
  selectedSectionId: z.string().nullable().optional(),
  theme: z.object({ primaryColor: z.string(), mode: z.enum(["light", "dark"]), fontFamily: z.string() }),
  page: z.object({
    name: z.string(),
    slug: z.string(),
    sections: z.array(z.object({ id: z.string(), type: z.string(), props: z.record(z.string(), z.unknown()) })).max(60),
  }),
  otherPages: z.array(z.object({ name: z.string(), slug: z.string() })).max(30),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  const { id } = await params;
  if (!rateLimit(`ai-edit:${user.id}`, 12, 60_000)) return jsonError("Too many requests. Slow down.", 429);

  const owned = await db.project.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!owned) return jsonError("Not found", 404);

  const raw = await req.text();
  if (raw.length > 120_000) return jsonError("This page is too large for the assistant.", 413);
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return jsonError("Invalid input", 400);
  }
  const body = bodySchema.safeParse(json);
  if (!body.success) return jsonError("Invalid input", 400);

  try {
    await assertAiQuota(user.id, user.plan, "ai_edit");
    const result = await proposeEdit({
      instruction: body.data.instruction,
      selectedSectionId: body.data.selectedSectionId ?? null,
      theme: body.data.theme as never,
      page: body.data.page,
      otherPages: body.data.otherPages,
    });
    await db.usageRecord.create({ data: { userId: user.id, kind: "ai_edit" } });
    return NextResponse.json(result);
  } catch (e) {
    return handleKnownError(e);
  }
}
