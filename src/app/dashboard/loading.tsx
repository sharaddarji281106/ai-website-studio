export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading your dashboard">
      <div className="h-16 border-b border-slate-200 dark:border-slate-800" />
      <main className="mx-auto max-w-6xl animate-pulse px-6 py-10">
        <div className="mb-2 h-7 w-64 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="mb-8 h-4 w-80 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />)}
        </div>
        <div className="mb-10 h-56 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-52 rounded-2xl bg-slate-200 dark:bg-slate-800" />)}
        </div>
      </main>
    </div>
  );
}
