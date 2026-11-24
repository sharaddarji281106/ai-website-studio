"use client";
import { Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Creates an empty website (Manual Build Mode) and opens it in the studio. */
export function StartBlankButton({
  label = "Start with a blank page",
  className = "btn-ghost gap-2",
  disabled = false,
}: {
  label?: string;
  className?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/projects/blank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not create the page. Please try again.");
      router.push(`/studio/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={start} disabled={disabled || busy} className={className}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Pencil size={16} />} {label}
      </button>
      {error && (
        <p role="alert" className="mt-2 w-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}
    </>
  );
}
