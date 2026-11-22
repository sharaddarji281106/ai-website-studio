import { Check } from "lucide-react";
import { Logo } from "./logo";

const POINTS = ["Describe your site and get every page generated", "Edit visually or ask AI for one change", "Publish with one click or export the code"];

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="relative font-semibold tracking-tight">AI Website Studio</div>
        <div className="relative max-w-md">
          <h2 className="font-[Poppins] text-4xl font-bold leading-tight">Your next website is one prompt away.</h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-indigo-50">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20"><Check size={13} /></span>{p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-indigo-100/80">© 2026 AI Website Studio</p>
      </aside>

      <div className="grid place-items-center bg-white px-6 py-10 dark:bg-slate-950">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden"><Logo /></div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">{subtitle}</p>
          {children}
        </div>
      </div>
    </main>
  );
}
