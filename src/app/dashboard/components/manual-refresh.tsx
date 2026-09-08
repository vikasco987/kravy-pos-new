"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";

export default function ManualRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
      disabled={isPending}
      className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white/80 text-sm font-semibold hover:bg-white/10 transition-all"
    >
      {isPending ? (
        <Loader2 size={16} className="animate-spin text-[#FF6B35]" />
      ) : (
        <RefreshCw size={16} />
      )}
      {isPending ? "Syncing..." : "Sync Now"}
    </button>
  );
}
