import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().email().max(200),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  if (!rateLimit(`register:${clientIp(req.headers)}`, 5, 60 * 60_000)) {
    return NextResponse.json({ error: "Too many sign-ups from this network. Try again later." }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();
  const exists = await db.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await db.user.create({ data: { name: parsed.data.name, email, passwordHash } });
  return NextResponse.json({ ok: true }, { status: 201 });
}
