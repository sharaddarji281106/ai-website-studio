import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { handleKnownError, jsonError } from "@/lib/api";
import { assertCanSaveComponent } from "@/lib/plans";
import { rateLimit } from "@/lib/rate-limit";
import { getSessionUser } from "@/lib/session";
import { SECTION_TYPES } from "@/modules/site/schema";
import { sanitizeSectionProps } from "@/modules/site/sanitize-section";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(60),
  sections: z
    .array(z.object({ id: z.string().min(1).max(100), type: z.enum(SECTION_TYPES), props: z.record(z.string(), z.unknown()) }))
    .min(1)
    .max(20),
});

/** The user's saved components (newest first). Always scoped to the signed-in user. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  const rows = await db.savedComponent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: { id: true, name: true, sections: true, createdAt: true },
  });
  return NextResponse.json({ components: rows });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!rateLimit(`components:${user.id}`, 30, 60_000)) return jsonError("Too many requests. Slow down.", 429);

  const raw = await req.text();
  if (raw.length > 400_000) return jsonError("That component is too large.", 413);
  let json: unknown;
  try { json = JSON.parse(raw); } catch { return jsonError("Invalid input", 400); }
  const body = bodySchema.safeParse(json);
  if (!body.success) return jsonError("Invalid input", 400);

  try {
    await assertCanSaveComponent(user.id, user.plan);
    // Same cleaning as the save route; a saved copy is always unlocked so it can be edited after inserting.
    const sections = body.data.sections.map((s) => {
      const props = sanitizeSectionProps(s.type, s.props);
      delete props.__locked;
      return { id: s.id, type: s.type, props };
    });
    const row = await db.savedComponent.create({
      data: { userId: user.id, name: body.data.name, sections: sections as unknown as Prisma.InputJsonValue },
      select: { id: true, name: true, sections: true, createdAt: true },
    });
    return NextResponse.json({ component: row }, { status: 201 });
  } catch (e) {
    return handleKnownError(e);
  }
}
