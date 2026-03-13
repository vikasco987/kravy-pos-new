"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { formatWhatsAppNumber } from "@/lib/whatsapp";
import { useSearch } from "@/components/SearchContext";
import {
  Receipt, Plus, Trash2, Eye, Printer, MessageCircle,
  Play, MoreVertical, IndianRupee, Calendar, User, Phone,
  CreditCard, Smartphone, Banknote, Clock, FileText
} from "lucide-react";

type BillManager = {
  id: string;
  billNumber: string;
  createdAt: string;
  total: number;
  paymentMode: string;
  paymentStatus: string;
  customerName?: string | null;
  customerPhone?: string | null;
  isHeld?: boolean;
  pdfUrl?: string | null;
  items?: any;
  clerkUserId?: string | null;
};

export default function BillingPage() {
  const [bills, setBills] = useState<BillManager[]>([]);
  const [clerkId, setClerkId] = useState<string | null>(null);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const { query } = useSearch();

  async function fetchProfile() {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setBusiness(data);
      }
    } catch (e) {
      console.error("Failed to fetch profile:", e);
    }
  }

  async function fetchBills() {
    try {
      setLoading(true);
      const res = await fetch("/api/bill-manager", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch bills");
      const data = await res.json();
      setBills(data.bills ?? []);
      if (data.clerkUserId) setClerkId(data.clerkUserId);
    } catch (err) {
      console.error("FETCH BILLS ERROR:", err);
      setError("Failed to load bills");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    fetchBills(); 
    fetchProfile();
  }, []);

  const filteredBills = query
    ? bills.filter(b =>
      b.billNumber?.toLowerCase().includes(query.toLowerCase()) ||
      b.customerName?.toLowerCase().includes(query.toLowerCase()) ||
      b.customerPhone?.includes(query)
    )
    : bills;

  const format = (num: number) =>
    new Intl.NumberFormat("en-IN").format(Math.round(num));

  const totalRevenue = bills.reduce((s, b) => s + b.total, 0);
  const paidBills = bills.filter(b => b.paymentStatus?.toLowerCase() === "paid").length;
  const heldBills = bills.filter(b => b.isHeld).length;

  if (error) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "60px", color: "#EF4444", flexDirection: "column", gap: "12px"
    }}>
      <div style={{ fontSize: "2rem" }}>⚠️</div>
      <div style={{ fontFamily: "monospace" }}>{error}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="kravy-page-fade">

      {/* ── Page Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{
              width: "6px", height: "32px",
              background: "var(--kravy-brand)",
              borderRadius: "10px",
              boxShadow: "0 0 15px rgba(79, 70, 229, 0.4)"
            }} />
            <h1 style={{
              fontSize: "1.75rem", fontWeight: 900,
              color: "var(--kravy-text-primary)", letterSpacing: "-1px"
            }}>
              Bill Manager
            </h1>
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--kravy-text-muted)", marginLeft: "16px", fontFamily: "monospace" }}>
            All transactions · {bills.length} total records
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={async () => {
              const res = await fetch("/api/bill-manager/export");
              if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Kravy_Bills_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
              } else {
                alert("Export failed");
              }
            }}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 18px", borderRadius: "12px", border: "1px solid var(--kravy-border)",
              background: "var(--kravy-surface)", color: "#10B981",
              fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
            }}
          >
            <FileText size={16} />
            Export Excel
          </button>

          <Link href="/dashboard/billing/deleted" style={{ textDecoration: "none" }}>
            <button style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 18px", borderRadius: "12px", border: "1px solid var(--kravy-border)",
              background: "var(--kravy-surface)", color: "var(--kravy-text-secondary)",
              fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
            }}>
              <Trash2 size={16} />
              Deleted Bills
            </button>
          </Link>
          <Link href="/dashboard/billing/checkout" style={{ textDecoration: "none" }}>
            <button style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 20px", borderRadius: "14px", border: "none",
              background: "var(--kravy-brand)",
              color: "white", fontSize: "0.85rem", fontWeight: 800,
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 4px 20px rgba(79, 70, 229, 0.3)"
            }}>
              <Plus size={16} />
              New Order
            </button>
          </Link>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
        {[
          { label: "Total Revenue", value: `₹${format(totalRevenue)}`, icon: <IndianRupee size={18} />, color: "rgb(16 185 129)" },
          { label: "Total Bills", value: bills.length.toString(), icon: <Receipt size={18} />, color: "rgb(99 102 241)" },
          { label: "Paid Bills", value: paidBills.toString(), icon: <CreditCard size={18} />, color: "rgb(139 92 246)" },
          { label: "On Hold", value: heldBills.toString(), icon: <Clock size={18} />, color: "rgb(245 158 11)" },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="kravy-card"
            style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}
          >
            <div style={{
              width: "44px", height: "44px", borderRadius: "14px",
              background: `${s.color}15`, border: `1px solid ${s.color}25`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: s.color, flexShrink: 0
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--kravy-text-primary)", letterSpacing: "-0.5px" }}>
                {s.value}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--kravy-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {s.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Loading Skeleton ── */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="kravy-skeleton" style={{ height: "60px", borderRadius: "14px" }} />
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && filteredBills.length === 0 && (
        <div className="kravy-card" style={{
          padding: "60px 40px", textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "16px"
        }}>
          <div style={{ fontSize: "3rem", opacity: 0.5 }}>🧾</div>
          <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--kravy-text-primary)" }}>
            {query ? `No bills matching "${query}"` : "No bills yet"}
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--kravy-text-muted)" }}>
            Create your first order to get started
          </div>
          <Link href="/dashboard/billing/checkout">
            <button style={{
              marginTop: "8px", padding: "10px 24px", borderRadius: "14px", border: "none",
              background: "var(--kravy-brand)", color: "white",
              fontSize: "0.88rem", fontWeight: 800, cursor: "pointer",
              boxShadow: "0 4px 20px rgba(79, 70, 229, 0.2)"
            }}>
              + Create First Bill
            </button>
          </Link>
        </div>
      )}

      {/* ── Desktop Table ── */}
      {!loading && filteredBills.length > 0 && (
        <div className="kravy-card hidden md:block" style={{ overflow: "hidden", padding: 0 }}>
          <table className="kravy-table">
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                {/* Identification Group */}
                <th style={{ textAlign: "left", background: "rgba(99, 102, 241, 0.05)", borderRight: "1px solid var(--kravy-border)" }}>Bill No</th>
                
                {/* Customer Group - Blueish */}
                <th style={{ textAlign: "left", background: "rgba(59, 130, 246, 0.03)" }}>Customer</th>
                <th style={{ textAlign: "left", background: "rgba(59, 130, 246, 0.03)", borderRight: "1px solid var(--kravy-border)" }}>Phone</th>
                
                {/* Timeline & Money - Greenish */}
                <th style={{ textAlign: "left", background: "rgba(16, 185, 129, 0.03)" }}>Date & Time</th>
                <th style={{ textAlign: "left", background: "rgba(16, 185, 129, 0.03)", borderRight: "1px solid var(--kravy-border)" }}>Amount</th>
                
                {/* Status Group - Amber/Purple */}
                <th style={{ textAlign: "left", background: "rgba(139, 92, 246, 0.03)" }}>Payment</th>
                <th style={{ textAlign: "left", background: "rgba(139, 92, 246, 0.03)", borderRight: "1px solid var(--kravy-border)" }}>Status</th>
                
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill, idx) => (
                <motion.tr
                  key={bill.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <td style={{ background: "rgba(99, 102, 241, 0.02)", borderRight: "1px solid var(--kravy-border)" }}>
                    <span style={{
                      fontFamily: "monospace", fontWeight: 800,
                      fontSize: "0.82rem", color: "var(--kravy-accent)"
                    }}>
                      #{bill.billNumber}
                    </span>
                  </td>
                  <td style={{ background: "rgba(59, 130, 246, 0.01)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{
                        width: "30px", height: "30px", borderRadius: "8px",
                        background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--kravy-text-muted)", fontSize: "0.7rem", fontWeight: 800
                      }}>
                        {(bill.customerName?.[0] || "W").toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{bill.customerName || "Walk-in"}</span>
                    </div>
                  </td>
                  <td className="muted" style={{ background: "rgba(59, 130, 246, 0.01)", borderRight: "1px solid var(--kravy-border)" }}>{bill.customerPhone || "—"}</td>
                  <td className="muted" style={{ fontSize: "0.78rem", fontFamily: "monospace", background: "rgba(16, 185, 129, 0.01)" }}>
                    {new Date(bill.createdAt).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td style={{ fontWeight: 800, color: "var(--kravy-text-primary)", background: "rgba(16, 185, 129, 0.01)", borderRight: "1px solid var(--kravy-border)" }}>
                    ₹{format(bill.total)}
                  </td>
                  <td style={{ background: "rgba(139, 92, 246, 0.01)" }}><PaymentBadge mode={bill.paymentMode} /></td>
                  <td style={{ background: "rgba(139, 92, 246, 0.01)", borderRight: "1px solid var(--kravy-border)" }}><StatusBadge status={bill.paymentStatus} isHeld={bill.isHeld} /></td>
                  <td style={{ textAlign: "right" }}>
                    <BillActions bill={bill} refresh={fetchBills} clerkId={clerkId} business={business} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Mobile Cards ── */}
      {!loading && filteredBills.length > 0 && (
        <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredBills.map((bill, idx) => (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="kravy-card"
              style={{ padding: "16px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontFamily: "monospace", fontWeight: 800, color: "var(--kravy-accent)", fontSize: "0.9rem" }}>
                    #{bill.billNumber}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--kravy-text-secondary)", marginTop: "2px" }}>
                    {bill.customerName || "Walk-in Customer"}
                  </div>
                </div>
                <BillActions bill={bill} refresh={fetchBills} clerkId={clerkId} business={business} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { label: "Amount", value: `₹${format(bill.total)}`, bold: true },
                  { label: "Payment", value: bill.paymentMode },
                  { label: "Phone", value: bill.customerPhone || "—" },
                  { label: "Status", badge: true, bill },
                ].map((row, i) => (
                  <div key={i} style={{
                    background: "var(--kravy-surface)",
                    border: "1px solid var(--kravy-border)",
                    borderRadius: "10px", padding: "10px 12px"
                  }}>
                    <div style={{ fontSize: "0.62rem", color: "var(--kravy-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                      {row.label}
                    </div>
                    {row.badge
                      ? <StatusBadge status={bill.paymentStatus} isHeld={bill.isHeld} />
                      : <div style={{ fontWeight: row.bold ? 800 : 500, color: "var(--kravy-text-primary)", fontSize: "0.88rem" }}>
                        {row.value}
                      </div>
                    }
                  </div>
                ))}
              </div>
              <div style={{ fontSize: "0.65rem", color: "var(--kravy-text-faint)", fontFamily: "monospace", marginTop: "10px" }}>
                {new Date(bill.createdAt).toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Payment Badge ─── */
function PaymentBadge({ mode }: { mode: string }) {
  const lower = mode?.toLowerCase() || "";
  const isUPI = lower.includes("upi");
  const color = isUPI ? "rgb(139 92 246)" : "rgb(16 185 129)";
  const Icon = isUPI ? Smartphone : Banknote;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      fontSize: "0.65rem", fontWeight: 800, padding: "4px 10px",
      borderRadius: "20px", fontFamily: "monospace",
      background: `${color}15`, color: color, border: `1px solid ${color}25`
    }}>
      <Icon size={12} />{mode?.toUpperCase()}
    </span>
  );
}

/* ─── Status Badge ─── */
function StatusBadge({ status, isHeld }: { status: string; isHeld?: boolean }) {
  if (isHeld || status?.toLowerCase() === "held") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        fontSize: "0.65rem", fontWeight: 800, padding: "4px 10px",
        borderRadius: "20px", background: "rgba(245, 158, 11, 0.1)",
        color: "rgb(245 158 11)", border: "1px solid rgba(245, 158, 11, 0.2)"
      }}>
        ⏸ HELD
      </span>
    );
  }
  if (status?.toLowerCase() === "paid") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        fontSize: "0.65rem", fontWeight: 800, padding: "4px 10px",
        borderRadius: "20px", background: "rgba(16, 185, 129, 0.1)",
        color: "rgb(16 185 129)", border: "1px solid rgba(16, 185, 129, 0.2)"
      }}>
        ✓ PAID
      </span>
    );
  }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      fontSize: "0.65rem", fontWeight: 800, padding: "4px 10px",
      borderRadius: "20px", background: "rgba(244, 63, 94, 0.1)",
      color: "rgb(244 63 94)", border: "1px solid rgba(244, 63, 94, 0.2)"
    }}>
      ◌ PENDING
    </span>
  );
}

/* ─── Bill Actions ─── */
function BillActions({ bill, refresh, clerkId, business }: { bill: BillManager; refresh: () => void; clerkId?: string | null; business?: any }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleWhatsApp = async () => {
    let pdfUrl = bill.pdfUrl;
    const origin = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;

    // 1. Try to fetch Cloudinary URL if missing
    if (!pdfUrl) {
      try {
        const res = await fetch(`/api/bill-manager/${bill.id}/pdf${clerkId ? `?clerkId=${clerkId}` : ""}&json=true`);
        const data = await res.json();
        if (data && data.url) {
          pdfUrl = data.url;
        }
      } catch (err) {
        console.error("Failed to get PDF URL:", err);
      }
    }

    // 3. Prepare Items Summary
    const billItems = Array.isArray(bill.items) ? bill.items : [];
    const itemsList = billItems
      .map((i: any) => `• ${i.name} ×${i.qty ?? i.quantity} – ₹${((i.qty ?? i.quantity) * (i.rate ?? i.price)).toFixed(2)}`)
      .join("\n");

    // 4. Construct Premium Message
    const restaurantName = business?.businessName || "Kravy POS";
    // origin is already declared above at line 414
    const menuUrl = `${origin}/menu/${clerkId || bill.clerkUserId}`;
    const phone = formatWhatsAppNumber(bill.customerPhone);
    const showMenu = business?.menuLinkEnabled !== false;
    
    // Using string concatenation to ensure best emoji compatibility
    const message = encodeURIComponent(
      "🙏 *Thank you for shopping with us!*\n\n" +
      `Hello *${bill.customerName || "Customer"}*,\n\n` +
      `Here is your invoice from *${restaurantName}*:\n\n` +
      "🧾 *Bill No:* " + bill.billNumber + "\n" +
      "💰 *Amount Paid:* Rs. " + bill.total + "\n\n" +
      "📄 *Download Invoice:*\n" +
      pdfUrl + "\n\n" +
      (showMenu ? ("🍴 *View Our Menu:*\n" + menuUrl + "\n\n") : "") +
      "We look forward to serving you again! 😊"
    );
    window.open(phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`, "_blank");
  };

  const actions = [
    {
      label: "View Details",
      icon: <Eye size={14} />,
      color: "rgb(99 102 241)",
      onClick: () => router.push(`/dashboard/billing/${bill.id}`)
    },
    {
      label: "Print Bill",
      icon: <Printer size={14} />,
      color: "var(--kravy-text-muted)",
      onClick: () => window.open(`/dashboard/billing/${bill.id}`, "_blank")
    },
    {
      label: "WhatsApp",
      icon: <MessageCircle size={14} />,
      color: "rgb(37 211 102)",
      onClick: handleWhatsApp
    },
    ...(bill.isHeld ? [{
      label: "Resume Order",
      icon: <Play size={14} />,
      color: "rgb(245 158 11)",
      onClick: () => router.push(`/dashboard/billing/checkout?resumeBillId=${bill.id}`)
    }] : []),
    {
      label: bill.paymentStatus?.toLowerCase() === "paid" ? "Mark as Pending" : "Mark as Paid",
      icon: <Clock size={14} />,
      color: bill.paymentStatus?.toLowerCase() === "paid" ? "rgb(244 63 94)" : "rgb(16 185 129)",
      onClick: async () => {
        const newStatus = bill.paymentStatus?.toLowerCase() === "paid" ? "Pending" : "Paid";
        try {
          const res = await fetch(`/api/bill-manager/${bill.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentStatus: newStatus })
          });
          if (res.ok) refresh();
          else alert("Failed to update status");
        } catch (err) {
          console.error("Status update error:", err);
          alert("Something went wrong");
        }
      }
    },
    {
      label: "Delete",
      icon: <Trash2 size={14} />,
      color: "rgb(244 63 94)",
      onClick: async () => {
        if (!confirm("Delete this bill? You can view it later in Deleted Bills.")) return;
        const res = await fetch(`/api/bill-manager/${bill.id}`, { method: "DELETE" });
        if (res.ok) refresh();
        else alert("Failed to delete bill");
      }
    }
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <button
        onClick={handleWhatsApp}
        style={{
          width: "34px", height: "34px", borderRadius: "9px",
          background: "rgba(37, 211, 102, 0.1)", border: "1px solid rgba(37, 211, 102, 0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "rgb(37, 211, 102)", transition: "all 0.2s"
        }}
        title="Share on WhatsApp"
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(37, 211, 102, 0.2)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(37, 211, 102, 0.1)"}
      >
        <MessageCircle size={16} />
      </button>

      <div style={{ position: "relative" }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: "34px", height: "34px", borderRadius: "9px",
            background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "var(--kravy-text-muted)", transition: "all 0.2s"
          }}
        >
          <MoreVertical size={16} />
        </button>

        {open && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 50 }} onClick={() => setOpen(false)} />
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)",
              minWidth: "180px", borderRadius: "14px", padding: "6px",
              background: "var(--kravy-bg)",
              border: "1px solid var(--kravy-border-strong)",
              boxShadow: "var(--kravy-card-shadow)",
              zIndex: 51
            }}>
              {actions.map((a, i) => (
                <button
                  key={i}
                  onClick={() => { setOpen(false); a.onClick(); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "10px",
                    padding: "9px 12px", borderRadius: "10px", border: "none",
                    background: "transparent", color: a.color || "var(--kravy-text-secondary)",
                    fontSize: "0.85rem", fontWeight: 500, cursor: "pointer",
                    transition: "all 0.15s", textAlign: "left"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--kravy-surface)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ color: a.color }}>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}