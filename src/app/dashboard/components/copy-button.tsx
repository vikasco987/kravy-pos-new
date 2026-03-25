"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-1 p-1 hover:bg-slate-200 rounded transition-all active:scale-90"
      title="Copy User ID"
    >
      {copied ? (
        <Check size={10} className="text-emerald-500" />
      ) : (
        <Copy size={10} className="text-slate-400" />
      )}
    </button>
  );
}
