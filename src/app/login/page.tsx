"use client";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";

/** Only same-site paths are allowed, so a crafted ?callbackUrl= can never send people to another website. */
function safeCallback(): string {
  const raw = new URLSearchParams(window.location.search).get("callbackUrl");
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\") ? raw : "/dashboard";
}

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", { email: fd.get("email"), password: fd.get("password"), redirect: false });
    setLoading(false);
    if (res?.error) setError("Invalid email or password");
    else window.location.href = safeCallback();
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your studio.">
      <form onSubmit={onSubmit} className="grid gap-3">
        <input name="email" type="email" required placeholder="Email" className="input" />
        <input name="password" type="password" required placeholder="Password" className="input" />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button disabled={loading} className="btn-primary gap-2 py-2.5">{loading && <Loader2 size={15} className="animate-spin" />} Log in</button>
      </form>
      <div className="my-4 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />or<span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /></div>
      <button onClick={() => signIn("google", { callbackUrl: safeCallback() })} className="btn-ghost w-full py-2.5">Continue with Google</button>
      <p className="mt-5 text-center text-sm text-slate-500">New here? <Link href="/register" className="font-medium text-indigo-600">Create an account</Link></p>
    </AuthShell>
  );
}
