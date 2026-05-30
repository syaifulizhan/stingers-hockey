"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

// Butang padam ringkas — sahkan dahulu, kemudian DELETE ke endpoint dengan ?id=.
export default function DeleteButton({
  endpoint,
  id,
  confirmMsg = "Padam item ini?",
}: {
  endpoint: string;
  id: string;
  confirmMsg?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onDelete = async () => {
    if (!window.confirm(confirmMsg)) return;
    setBusy(true);
    try {
      const res = await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
    } catch {
      setBusy(false);
      window.alert("Gagal padam. Cuba lagi.");
      return;
    }
    setBusy(false);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      aria-label="Padam"
      className="shrink-0 rounded-md p-1.5 text-muted transition-colors hover:bg-amber/10 hover:text-amber disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
