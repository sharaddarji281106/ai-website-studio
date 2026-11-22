import { ArrowRight, Check, Cpu, Download, Globe, LayoutTemplate, Layers, MousePointerClick, Rocket, ShieldCheck, Smartphone, Sparkles, Pencil } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const STEPS = [
  { icon: Sparkles, title: "Describe it", text: "Tell the AI what you need in plain English. No code, no design skills." },
  { icon: LayoutTemplate, title: "Get a full site", text: "Pages, sections, copy and a matching theme are generated in one go." },
  { icon: MousePointerClick, title: "Edit visually", text: "Click anything, reorder sections, change colors, or ask the AI to change one thing." },
  { icon: Rocket, title: "Publish", text: "Go live on a free address, or export clean static files." },
];

const FEATURES = [
  { icon: Layers, title: "Complete multi-page sites", text: "Home, about, services, contact and more, with consistent navigation and branding." },
  { icon: MousePointerClick, title: "Visual editor", text: "Edit text, reorder sections and change the theme without touching code." },
  { icon: Pencil, title: "Ask AI for one change", text: "Say “add a testimonials section” and only that part changes." },
  { icon: Smartphone, title: "Responsive by default", text: "Every site adapts to phones, tablets and desktops automatically." },
  { icon: Globe, title: "One-click publish", text: "Get a live link in seconds and share it with anyone." },
  { icon: Download, title: "Export your code", text: "Download clean HTML, CSS and JavaScript and host it anywhere." },
];

const ENGINES = [
  { icon: Sparkles, name: "Claude", tag: "Hosted", text: "High-quality layouts and copy from the Claude API. Works from any host, no GPU needed." },
  { icon: Cpu, name: "OpenAI", tag: "Hosted", text: "Use your OpenAI key if that is already part of your stack." },
  { icon: ShieldCheck, name: "Ollama", tag: "Local & private", text: "Run models on your own machine or server. Prompts never leave your infrastructure." },
];

function HeroMock() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl">
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-fuchsia-500/20 blur-2xl" />
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-indigo-900/10 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <span className="h-3 w-3 rounded-full bg-red-400" /><span className="h-3 w-3 rounded-full bg-amber-400" /><span className="h-3 w-3 rounded-full bg-emerald-400" />
          <div className="mx-auto hidden rounded-md bg-slate-100 px-4 py-1 text-xs text-slate-500 dark:bg-slate-800 sm:block">studio / crumb-and-co</div>
        </div>
        <div className="grid md:grid-cols-[17rem_1fr]">
          <aside className="border-b border-slate-200 p-5 text-left dark:border-slate-800 md:border-b-0 md:border-r">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Prompt</p>
            <div className="mt-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
              A bakery in Ahmedabad with online ordering, menu and a contact form.
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Pages</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {["Home", "Menu", "About", "Contact"].map((p, i) => (
                <li key={p} className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 ${i === 0 ? "bg-slate-100 font-medium dark:bg-slate-800" : "text-slate-500"}`}>
                  <Check size={14} className="text-emerald-500" /> {p}
                </li>
              ))}
            </ul>
          </aside>
          <div className="bg-slate-50 p-5 dark:bg-slate-950">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between px-5 py-3 text-sm font-bold"><span>Crumb &amp; Co.</span><span className="hidden text-xs font-medium text-slate-500 sm:block">Menu · Order · Visit</span></div>
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 px-6 py-10 dark:from-amber-500/20 dark:to-orange-500/10">
                <p className="text-3xl font-extrabold tracking-tight text-amber-950 dark:text-amber-100 sm:text-4xl">Fresh bread, baked at dawn.</p>
                <p className="mt-2 text-sm text-amber-900/70 dark:text-amber-200/70">Ahmedabad’s neighbourhood bakery.</p>
                <span className="mt-4 inline-block rounded-full bg-orange-700 px-4 py-1.5 text-xs font-semibold text-white">Order online</span>
              </div>
              <div className="grid grid-cols-3 gap-3 p-5">
                {["Sourdough", "Croissants", "Cakes"].map((n, i) => (
                  <div key={n} className="rounded-lg p-3 pt-10 text-xs font-bold" style={{ background: ["#f3e3c3", "#ebcb93", "#e0b877"][i], color: "#5b3a12" }}>{n}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
            <a href="#how" className="hover:text-slate-900 dark:hover:text-white">How it works</a>
            <a href="#features" className="hover:text-slate-900 dark:hover:text-white">Features</a>
            <a href="#ai" className="hover:text-slate-900 dark:hover:text-white">AI engines</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="btn-ghost hidden sm:inline-flex">Log in</Link>
            <Link href="/register" className="btn-primary">Get started</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-6 pb-24 pt-20 text-center">
          <div className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-[28rem] max-w-3xl rounded-full bg-gradient-to-r from-indigo-400/25 via-violet-400/25 to-fuchsia-400/25 blur-3xl" />
          <div className="relative mx-auto max-w-4xl">
            <span className="badge inline-flex items-center gap-1.5"><Sparkles size={13} /> Choose your AI: Claude, OpenAI or local Ollama</span>
            <h1 className="mt-6 font-[Poppins] text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Describe it.<br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">AI builds the website.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              Turn one sentence into a complete multi-page website. Fine-tune it in a visual studio, then publish it with a single click.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/register" className="btn-primary gap-2 px-6 py-3 text-base">Start building free <ArrowRight size={18} /></Link>
              <a href="#how" className="btn-ghost px-6 py-3 text-base">See how it works</a>
            </div>
            <p className="mt-4 text-sm text-slate-500">No code. No design skills. Free to start.</p>
          </div>
          <HeroMock />
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-[Poppins] text-3xl font-bold tracking-tight sm:text-4xl">From prompt to published in four steps</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">Each step builds on the last, so you always know what happens next.</p>
          </div>
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"><Icon size={20} /></div>
                  <span className="text-sm font-semibold text-slate-300 dark:text-slate-600">0{i + 1}</span>
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="features" className="scroll-mt-20 bg-slate-50 py-24 dark:bg-slate-900/40">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="font-[Poppins] text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to launch</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
                  <Icon size={22} className="text-indigo-600 dark:text-indigo-400" />
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="ai" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-[Poppins] text-3xl font-bold tracking-tight sm:text-4xl">Bring the AI you trust</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">Switch the engine behind your studio with one setting. Your sites and editor stay exactly the same.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {ENGINES.map(({ icon: Icon, name, tag, text }) => (
              <div key={name} className="card p-6">
                <div className="flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"><Icon size={20} /></div>
                  <span className="badge">{tag}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{name}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-16 text-center text-white shadow-xl shadow-indigo-900/20">
            <h2 className="font-[Poppins] text-3xl font-bold tracking-tight sm:text-4xl">Your website is one sentence away</h2>
            <p className="mx-auto mt-3 max-w-xl text-indigo-100">Create a free account and build your first site in minutes.</p>
            <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50">Start building free <ArrowRight size={18} /></Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 text-sm text-slate-500">
          <span>© 2026 AI Website Studio</span>
          <span className="flex gap-5"><Link href="/login" className="hover:text-slate-900 dark:hover:text-white">Log in</Link><Link href="/register" className="hover:text-slate-900 dark:hover:text-white">Sign up</Link></span>
        </div>
      </footer>
    </div>
  );
}
