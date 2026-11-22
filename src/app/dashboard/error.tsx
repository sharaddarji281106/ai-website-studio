"use client";
import Link from "next/link";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-screen max-w-md place-items-center px-6 text-center">
      <div className="card p-8">
        <h1 className="text-xl font-bold">We couldn’t load your dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">
          This is usually a temporary problem reaching the database. Your websites are safe. Try again in a moment.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset} className="btn-primary">Try again</button>
          <Link href="/" className="btn-ghost">Home</Link>
        </div>
      </div>
    </main>
  );
}
