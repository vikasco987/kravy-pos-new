// src/components/profile/Toast.tsx
"use client";
import React, { useEffect } from "react";

export default function Toast({ message, kind = "success", onClose, duration = 2800 } : { message: string; kind?: "success" | "error"; onClose?: ()=>void; duration?: number }) {
  useEffect(() => {
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return (
    <div className={`pp-toast pp-toast--${kind}`} role="status" aria-live="polite">
      {message}
      <button className="pp-toast-close" onClick={onClose} aria-label="close">✕</button>
    </div>
  );
}
