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
  CreditCard, Smartphone, Banknote, Clock
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
};

export default function BillingPage() {
  const [bills, setBills] = useState<BillManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const { query } = useSearch();

  async function fetchBills() {
    try {
      setLoading(true);
      const res = await fetch("/api/bill-manager", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch bills");
      const data = await res.json();
      setBills(data.bills ?? []);
    } catch (err) {
      console.error("FETCH BILLS ERROR:", err);
      setError("Failed to load bills");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchBills(); }, []);

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
              background: "linear-gradient(180deg, #FF6B35, #F59E0B)",
              borderRadius: "10px"
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
              padding: "10px 20px", borderRadius: "12px", border: "none",
              background: "linear-gradient(135deg, #FF6B35, #F59E0B)",
              color: "white", fontSize: "0.85rem", fontWeight: 700,
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 4px 16px rgba(255,107,53,0.35)"
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
          { label: "Total Revenue", value: `₹${format(totalRevenue)}`, icon: <IndianRupee size={18} />, color: "#10B981" },
          { label: "Total Bills", value: bills.length.toString(), icon: <Receipt size={18} />, color: "#FF6B35" },
          { label: "Paid Bills", value: paidBills.toString(), icon: <CreditCard size={18} />, color: "#8B5CF6" },
          { label: "On Hold", value: heldBills.toString(), icon: <Clock size={18} />, color: "#F59E0B" },
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
              width: "40px", height: "40px", borderRadius: "12px",
              background: `${s.color}18`, border: `1px solid ${s.color}30`,
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
              marginTop: "8px", padding: "10px 24px", borderRadius: "12px", border: "none",
              background: "linear-gradient(135deg, #FF6B35, #F59E0B)", color: "white",
              fontSize: "0.88rem", fontWeight: 700, cursor: "pointer"
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
              <tr>
                {["Bill No", "Customer", "Phone", "Date & Time", "Amount", "Payment", "Status", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: h === "Actions" ? "right" : "left" }}>{h}</th>
                ))}
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
                  <td>
                    <span style={{
                      fontFamily: "monospace", fontWeight: 800,
                      fontSize: "0.82rem", color: "var(--kravy-accent)"
                    }}>
                      #{bill.billNumber}
                    </span>
                  </td>
                  <td>
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
                  <td className="muted">{bill.customerPhone || "—"}</td>
                  <td className="muted" style={{ fontSize: "0.78rem", fontFamily: "monospace" }}>
                    {new Date(bill.createdAt).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td style={{ fontWeight: 800, color: "var(--kravy-text-primary)" }}>
                    ₹{format(bill.total)}
                  </td>
                  <td><PaymentBadge mode={bill.paymentMode} /></td>
                  <td><StatusBadge status={bill.paymentStatus} isHeld={bill.isHeld} /></td>
                  <td style={{ textAlign: "right" }}>
                    <BillActions bill={bill} refresh={fetchBills} />
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
                <BillActions bill={bill} refresh={fetchBills} />
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
  const color = isUPI ? "#8B5CF6" : "#10B981";
  const Icon = isUPI ? Smartphone : Banknote;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      fontSize: "0.62rem", fontWeight: 700, padding: "3px 9px",
      borderRadius: "20px", fontFamily: "monospace",
      background: `${color}15`, color: color, border: `1px solid ${color}35`
    }}>
      <Icon size={10} />{mode?.toUpperCase()}
    </span>
  );
}

/* ─── Status Badge ─── */
function StatusBadge({ status, isHeld }: { status: string; isHeld?: boolean }) {
  if (isHeld || status?.toLowerCase() === "held") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "4px",
        fontSize: "0.62rem", fontWeight: 700, padding: "3px 9px",
        borderRadius: "20px", background: "rgba(245,158,11,0.15)",
        color: "#F59E0B", border: "1px solid rgba(245,158,11,0.35)"
      }}>
        ⏸ HELD
      </span>
    );
  }
  if (status?.toLowerCase() === "paid") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "4px",
        fontSize: "0.62rem", fontWeight: 700, padding: "3px 9px",
        borderRadius: "20px", background: "rgba(16,185,129,0.15)",
        color: "#10B981", border: "1px solid rgba(16,185,129,0.35)"
      }}>
        ✓ PAID
      </span>
    );
  }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      fontSize: "0.62rem", fontWeight: 700, padding: "3px 9px",
      borderRadius: "20px", background: "rgba(239,68,68,0.15)",
      color: "#EF4444", border: "1px solid rgba(239,68,68,0.35)"
    }}>
      ◌ PENDING
    </span>
  );
}

/* ─── Bill Actions ─── */
function BillActions({ bill, refresh }: { bill: BillManager; refresh: () => void }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const actions = [
    {
      label: "View Details",
      icon: <Eye size={14} />,
      color: "#8B5CF6",
      onClick: () => router.push(`/billing/${bill.id}`)
    },
    {
      label: "Print Bill",
      icon: <Printer size={14} />,
      color: "#6B7280",
      onClick: () => window.open(`/billing/${bill.id}`, "_blank")
    },
    {
      label: "WhatsApp",
      icon: <MessageCircle size={14} />,
      color: "#25D366",
      onClick: () => {
        const phone = formatWhatsAppNumber(bill.customerPhone);
        const pdfUrl = `${window.location.origin}/api/bill-manager/${bill.id}/pdf`;
        const message = encodeURIComponent(
          `🙏 Thank you for shopping with us!\n\nHello ${bill.customerName || "Customer"},\n\nHere is your invoice:\n🧾 Bill No: ${bill.billNumber}\n💰 Amount Paid: ₹${bill.total}\n\n📄 Download Invoice:\n${pdfUrl}\n\nWe look forward to serving you again 😊`
        );
        window.open(phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`, "_blank");
      }
    },
    ...(bill.isHeld ? [{
      label: "Resume Order",
      icon: <Play size={14} />,
      color: "#F59E0B",
      onClick: () => router.push(`/billing/checkout?resumeBillId=${bill.id}`)
    }] : []),
    {
      label: "Delete",
      icon: <Trash2 size={14} />,
      color: "#EF4444",
      onClick: async () => {
        if (!confirm("Delete this bill? You can view it later in Deleted Bills.")) return;
        const res = await fetch(`/api/bill-manager/${bill.id}`, { method: "DELETE" });
        if (res.ok) refresh();
        else alert("Failed to delete bill");
      }
    }
  ];

  return (
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
                  background: "transparent", color: a.color === "#EF4444" ? "#EF4444" : "var(--kravy-text-secondary)",
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
  );
}