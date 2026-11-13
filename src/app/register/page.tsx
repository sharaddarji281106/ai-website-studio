"use client";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = { name: fd.get("name"), email: fd.get("email"), password: fd.get("password") };
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }
    await signIn("credentials", { email: body.email, password: body.password, callbackUrl: "/dashboard" });
  }

  return (
    <AuthShell title="Create your account" subtitle="Free to start. No credit card.">
      <form onSubmit={onSubmit} className="grid gap-3">
        <input name="name" required placeholder="Name" className="input" />
        <input name="email" type="email" required placeholder="Email" className="input" />
        <input name="password" type="password" required minLength={8} placeholder="Password (8+ characters)" className="input" />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button disabled={loading} className="btn-primary gap-2 py-2.5">{loading && <Loader2 size={15} className="animate-spin" />} Sign up</button>
      </form>
      <div className="my-4 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />or<span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /></div>
      <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="btn-ghost w-full py-2.5">Continue with Google</button>
      <p className="mt-5 text-center text-sm text-slate-500">Already have an account? <Link href="/login" className="font-medium text-indigo-600">Log in</Link></p>
    </AuthShell>
  );
}
