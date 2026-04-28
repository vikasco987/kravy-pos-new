"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Calendar } from "lucide-react";

export default function CustomDateSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fromVal = formData.get("from");
    const toVal = formData.get("to");
    if (!fromVal || !toVal) return;
    router.push(`/dashboard/reports/analytics/order-type?range=custom&from=${fromVal}&to=${toVal}`);
  };

  return (
    <form 
      onSubmit={handleSearch} 
      style={{ 
        display: "flex", 
        gap: "24px", 
        alignItems: "center", 
        background: "var(--kravy-surface)", 
        padding: "16px 32px", 
        borderRadius: "24px", 
        border: "1px solid var(--kravy-border)",
        boxShadow: "var(--kravy-shadow-sm)",
        marginTop: "8px",
        width: "fit-content"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Calendar size={18} color="var(--kravy-purple)" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "0.65rem", fontWeight: 900, color: "var(--kravy-text-muted)", textTransform: "uppercase" }}>Start Date</span>
          <input 
            type="date" 
            name="from" 
            required
            defaultValue={from} 
            style={{ 
              background: "transparent", 
              border: "none", 
              color: "var(--kravy-text-primary)", 
              fontWeight: 900, 
              fontSize: "0.95rem",
              outline: "none",
              padding: "4px 0"
            }} 
          />
        </div>
      </div>

      <div style={{ width: "1px", height: "30px", background: "var(--kravy-border)" }} />

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Calendar size={18} color="var(--kravy-purple)" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "0.65rem", fontWeight: 900, color: "var(--kravy-text-muted)", textTransform: "uppercase" }}>End Date</span>
          <input 
            type="date" 
            name="to" 
            required
            defaultValue={to} 
            style={{ 
              background: "transparent", 
              border: "none", 
              color: "var(--kravy-text-primary)", 
              fontWeight: 900, 
              fontSize: "0.95rem",
              outline: "none",
              padding: "4px 0"
            }} 
          />
        </div>
      </div>

      <button 
        type="submit" 
        style={{ 
          padding: "14px 28px", 
          background: "var(--kravy-purple)", 
          color: "white", 
          border: "none", 
          borderRadius: "16px", 
          fontWeight: 950, 
          cursor: "pointer", 
          display: "flex", 
          alignItems: "center", 
          gap: "10px",
          marginLeft: "12px",
          boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
          transition: "transform 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        <Search size={18} /> ANALYZE DATA
      </button>
    </form>
  );
}
