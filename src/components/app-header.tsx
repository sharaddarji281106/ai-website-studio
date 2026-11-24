import { AppNav } from "./app-nav";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function AppHeader({ name, plan, email }: { name: string; plan: string; email?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Logo href="/dashboard" />
          <AppNav />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu name={name} plan={plan} email={email} />
        </div>
      </div>
    </header>
  );
}
