import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handleKnownError, jsonError } from "@/lib/api";
import { assertAiQuota, assertCanCreateProject } from "@/lib/plans";
import { rateLimit } from "@/lib/rate-limit";
import { getSessionUser } from "@/lib/session";
import { generateSite } from "@/modules/ai/generate-site";
import { createProjectFromSpec } from "@/modules/projects/service";

const bodySchema = z.object({ prompt: z.string().trim().min(10).max(1000) });

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!rateLimit(`generate:${user.id}`, 5, 60_000)) return jsonError("Too many requests. Slow down.", 429);

  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Describe your website in 10 to 1000 characters.", 400);

  try {
    await assertCanCreateProject(user.id, user.plan);
    await assertAiQuota(user.id, user.plan, "ai_generation");

    const spec = await generateSite(body.data.prompt);
    const project = await createProjectFromSpec(user.id, spec);
    await db.usageRecord.create({ data: { userId: user.id, kind: "ai_generation" } });

    return NextResponse.json({ id: project.id }, { status: 201 });
  } catch (e) {
    return handleKnownError(e);
  }
}
