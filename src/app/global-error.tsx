"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Application Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-slate-50 dark:bg-zinc-950 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-rose-100 dark:border-rose-900/30 text-center">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            Connection Lost
          </h1>
          
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            We lost connection to the server. This usually happens if your device went to sleep or your network dropped.
          </p>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={18} />
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
