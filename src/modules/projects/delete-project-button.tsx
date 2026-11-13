"use client";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteProjectButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function del() {
    if (!confirm(`Delete "${name}" permanently?`)) return;
    setBusy(true);
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.refresh();
  }
  return (
    <button onClick={del} disabled={busy} className="icon-btn text-red-500" aria-label="Delete website" title="Delete website"><Trash2 size={16} /></button>
  );
}
