// src/components/profile/CollapsibleSection.tsx
"use client";
import React, { useState } from "react";

export default function CollapsibleSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean; }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="pp-collapsible">
      <button type="button" className="pp-collapsible-btn" onClick={() => setOpen(o => !o)}>
        <span>{title}</span>
        <span className={`chev ${open ? "open" : ""}`}>▾</span>
      </button>
      {open && <div className="pp-collapsible-body">{children}</div>}
    </div>
  );
}
