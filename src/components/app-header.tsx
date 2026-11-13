import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function AppHeader({ name, plan }: { name: string; plan: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo href="/dashboard" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu name={name} plan={plan} />
        </div>
      </div>
    </header>
  );
}
