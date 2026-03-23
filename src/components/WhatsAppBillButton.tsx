// ─── WhatsApp Send Button Component ──────────────────────────────────────
// Bill print screen mein yeh button add karo
"use client";

import { useState } from "react";

interface WhatsAppBillButtonProps {
  billId: string;
  defaultPhone?: string;
  onSent?: () => void;
}

export function WhatsAppBillButton({
  billId,
  defaultPhone = "",
  onSent,
}: WhatsAppBillButtonProps) {
  const [phone, setPhone] = useState(defaultPhone);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showInput, setShowInput] = useState(!defaultPhone);

  async function handleSend() {
    const finalPhone = phone.trim();

    // Basic validation
    if (!finalPhone || finalPhone.replace(/\D/g, "").length < 10) {
      setErrorMsg("Valid 10-digit phone number daalo");
      return;
    }

    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/whatsapp/send-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId, phone: finalPhone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Send failed");
        return;
      }

      setStatus("sent");
      onSent?.();

      // 3 sec baad reset karo
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setErrorMsg("Network error — retry karo");
    }
  }

  // ── Styles ──────────────────────────────────────────────────────────────
  const btnBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 18px",
    borderRadius: 10,
    border: "none",
    fontSize: 13,
    fontWeight: 600,
    cursor: status === "sending" ? "not-allowed" : "pointer",
    transition: "all .15s",
    width: "100%",
    justifyContent: "center",
  };

  const btnColor: React.CSSProperties =
    status === "sent"
      ? { background: "#E1F5EE", color: "#085041" }
      : status === "error"
      ? { background: "#FCEBEB", color: "#791F1F" }
      : status === "sending"
      ? { background: "#9FE1CB", color: "#085041" }
      : { background: "#25D366", color: "#fff" }; // WhatsApp green

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Phone input — agar default phone nahi hai */}
      {showInput && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--color-text-secondary)",
              marginBottom: 4,
              letterSpacing: ".5px",
            }}
          >
            CUSTOMER PHONE
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <div
              style={{
                padding: "9px 10px",
                borderRadius: "10px 0 0 10px",
                border: "0.5px solid var(--color-border-secondary)",
                background: "var(--color-background-secondary)",
                fontSize: 12,
                color: "var(--color-text-secondary)",
              }}
            >
              +91
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="9876543210"
              maxLength={10}
              style={{
                flex: 1,
                padding: "9px 12px",
                borderRadius: "0 10px 10px 0",
                border: "0.5px solid var(--color-border-secondary)",
                borderLeft: "none",
                background: "var(--color-background-secondary)",
                color: "var(--color-text-primary)",
                fontSize: 13,
                fontFamily: "monospace",
                letterSpacing: 1,
                outline: "none",
              }}
            />
          </div>
        </div>
      )}

      {/* Send button */}
      <button
        style={{ ...btnBase, ...btnColor }}
        onClick={handleSend}
        disabled={status === "sending" || status === "sent"}
      >
        {status === "sending" && (
          <span
            style={{
              width: 14,
              height: 14,
              border: "2px solid #085041",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              display: "inline-block",
            }}
          />
        )}
        {status === "idle" && <span style={{ fontSize: 16 }}>📱</span>}
        {status === "sent" && <span>✅</span>}
        {status === "error" && <span>❌</span>}

        {status === "idle" && "WhatsApp par Bill Bhejo"}
        {status === "sending" && "Bhej raha hai..."}
        {status === "sent" && "Bill Bhej Diya! ✅"}
        {status === "error" && "Error — Retry Karo"}
      </button>

      {/* Error message */}
      {status === "error" && errorMsg && (
        <div
          style={{
            fontSize: 11,
            color: "#A32D2D",
            background: "#FCEBEB",
            borderRadius: 8,
            padding: "6px 10px",
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Toggle phone input */}
      {defaultPhone && (
        <button
          onClick={() => setShowInput(!showInput)}
          style={{
            border: "none",
            background: "none",
            fontSize: 11,
            color: "var(--color-text-secondary)",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          {showInput ? "Default number use karo" : "Alag number pe bhejo"}
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
