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

    // Reserve the quota BEFORE the slow AI call so parallel requests cannot slip past the limit.
    const usage = await db.usageRecord.create({ data: { userId: user.id, kind: "ai_generation" } });
    try {
      const spec = await generateSite(body.data.prompt);
      const project = await createProjectFromSpec(user.id, spec);
      return NextResponse.json({ id: project.id }, { status: 201 });
    } catch (e) {
      // Failed generations should not use up the user's monthly quota.
      await db.usageRecord.delete({ where: { id: usage.id } }).catch(() => {});
      throw e;
    }
  } catch (e) {
    return handleKnownError(e);
  }
}
