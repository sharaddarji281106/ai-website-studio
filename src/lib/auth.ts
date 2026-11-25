import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Email",
      credentials: { email: {}, password: {} },
      async authorize(raw, req) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const ip = clientIp(req?.headers as Record<string, string | string[] | undefined> | undefined);
        const email = parsed.data.email.toLowerCase();
        // 10 attempts per 15 minutes per email+IP, and 30 per IP, to slow password guessing.
        if (!rateLimit(`login:${email}:${ip}`, 10, 15 * 60_000) || !rateLimit(`login-ip:${ip}`, 30, 15 * 60_000)) return null;
        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        return ok ? { id: user.id, email: user.email, name: user.name } : null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      if (token.id) {
        const fresh = await db.user.findUnique({ where: { id: token.id as string }, select: { role: true, plan: true } });
        if (fresh) {
          token.role = fresh.role;
          token.plan = fresh.plan;
        } else {
          // The user row is gone (deleted account or reset database): invalidate this session.
          delete token.id;
          delete token.role;
          delete token.plan;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN";
        session.user.plan = token.plan as "FREE" | "PRO" | "BUSINESS";
      }
      return session;
    },
  },
};
