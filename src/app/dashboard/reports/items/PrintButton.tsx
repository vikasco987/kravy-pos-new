"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      style={{
        padding: "10px 16px",
        borderRadius: "12px",
        background: "white",
        color: "var(--kravy-brand)",
        border: "1px solid var(--kravy-brand)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "0.85rem",
        fontWeight: 800,
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
      }}
      className="hover:bg-orange-50 transition-all print:hidden"
    >
      <Printer size={18} />
      <span>Print</span>
    </button>
  );
}
