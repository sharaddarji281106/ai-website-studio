import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * The signed-in session, or null. A session whose user no longer exists in the database
 * (deleted account, reset database) is treated as signed out, so nothing is ever written
 * with a user id that has no row (that caused Prisma P2003 foreign key errors).
 */
export async function getValidSession() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ? session : null;
}

export async function getSessionUser() {
  const session = await getValidSession();
  return session?.user ?? null;
}
