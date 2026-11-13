"use client";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function UserMenu({ name, plan }: { name: string; plan: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="badge">{plan}</span>
      <span className="hidden text-sm text-slate-600 dark:text-slate-300 sm:block">{name}</span>
      <button className="btn-ghost gap-1.5" onClick={() => signOut({ callbackUrl: "/" })}><LogOut size={15} /> Sign out</button>
    </div>
  );
}
