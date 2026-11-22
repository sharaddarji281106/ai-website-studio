"use client";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export function UserMenu({ name, plan, email }: { name: string; plan: string; email?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label="Account menu"
        className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-semibold text-white ring-2 ring-white dark:ring-slate-950">
        {(name.trim().charAt(0) || "?").toUpperCase()}
      </button>
      {open && (
        <div role="menu" className="card absolute right-0 mt-2 w-64 p-2 shadow-lg">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold">{name}</p>
            {email && <p className="truncate text-xs text-slate-500">{email}</p>}
            <span className="badge mt-2 inline-block">{plan} plan</span>
          </div>
          <div className="my-1 h-px bg-slate-200 dark:bg-slate-800" />
          <button role="menuitem" onClick={() => signOut({ callbackUrl: "/" })} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
