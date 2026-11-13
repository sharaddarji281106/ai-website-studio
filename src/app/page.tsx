import { ArrowRight, LayoutTemplate, MousePointerClick, Rocket, Sparkles } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const STEPS = [
  { icon: Sparkles, title: "Describe it", text: "Tell the AI what you need in plain English. No code, no design skills." },
  { icon: LayoutTemplate, title: "Get a full site", text: "Pages, sections, copy and a matching theme are generated in one go." },
  { icon: MousePointerClick, title: "Edit visually", text: "Click anything, drag sections, tweak colors, or ask the AI to change just one thing." },
  { icon: Rocket, title: "Publish", text: "Go live on a free address, or export clean static files." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="btn-ghost">Log in</Link>
          <Link href="/register" className="btn-primary">Get started</Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-[28rem] max-w-3xl rounded-full bg-gradient-to-r from-indigo-400/30 via-violet-400/30 to-fuchsia-400/30 blur-3xl" />
          <div className="relative mx-auto max-w-4xl px-6 pb-24 pt-20 text-center">
            <span className="badge">Runs on your own local AI (Ollama)</span>
            <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl">
              Build any website with <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              Describe your idea, get a complete multi-page website, then fine-tune it in a visual studio. Responsive by default.
            </p>
            <div className="mt-9 flex justify-center gap-3">
              <Link href="/register" className="btn-primary gap-2 px-6 py-3 text-base">Start building free <ArrowRight size={18} /></Link>
              <Link href="/login" className="btn-ghost px-6 py-3 text-base">Log in</Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tight">From prompt to published in four steps</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="card p-6">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"><Icon size={20} /></div>
                <p className="text-xs font-semibold text-slate-400">Step {i + 1}</p>
                <h3 className="mt-1 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-800">© 2026 AI Website Studio</footer>
    </div>
  );
}
