"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Websites" },
  { href: "/studio", label: "Studio" },
] as const;

export function AppNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="App" className="hidden items-center gap-1 sm:flex">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${active ? "bg-slate-100 dark:bg-slate-800" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
