import { NextResponse } from "next/server";
import { z } from "zod";
import { handleKnownError, jsonError } from "@/lib/api";
import { assertCanCreateProject } from "@/lib/plans";
import { rateLimit } from "@/lib/rate-limit";
import { getSessionUser } from "@/lib/session";
import { createBlankProject } from "@/modules/projects/service";

const bodySchema = z.object({ name: z.string().trim().min(1).max(80).optional() });

/** Manual Build Mode: creates an empty website. No AI call, so it never uses AI quota. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!rateLimit(`blank:${user.id}`, 10, 60_000)) return jsonError("Too many requests. Slow down.", 429);

  const body = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return jsonError("Invalid input", 400);

  try {
    await assertCanCreateProject(user.id, user.plan);
    const project = await createBlankProject(user.id, body.data.name ?? "Untitled website");
    return NextResponse.json({ id: project.id }, { status: 201 });
  } catch (e) {
    return handleKnownError(e);
  }
}
