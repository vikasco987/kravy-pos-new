"use client";

import { Receipt, History, User, Banknote, Smartphone, Maximize2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface Bill {
  billNumber: string;
  customerName?: string | null;
  paymentMode: string;
  total: number;
  createdAt: string;
}

interface Props {
  recentBills?: Bill[];
  deletedBills?: Bill[];
  range?: number;
}

export default function RecentBills({
  recentBills = [],
  deletedBills = [],
  range = 30,
}: Props) {
  const router = useRouter();
  const format = (num: number) =>
    new Intl.NumberFormat("en-IN").format(Math.round(num));

  const PaymentBadge = ({ mode }: { mode: string }) => {
    const lower = mode?.toLowerCase() || "";
    const isUPI = lower.includes("upi");
    const color = isUPI ? "var(--kravy-brand)" : "#10B981";
    const Icon = isUPI ? Smartphone : Banknote;

    return (
      <span style={{
        fontSize: "0.6rem",
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: "20px",
        fontFamily: "monospace",
        background: isUPI ? "rgba(139, 92, 246, 0.1)" : "rgba(16, 185, 129, 0.1)",
        color: color,
        border: `1px solid ${isUPI ? "rgba(139, 92, 246, 0.2)" : "rgba(16, 185, 129, 0.2)"}`,
        display: "flex",
        alignItems: "center",
        gap: "3px"
      }}>
        <Icon size={9} />
        {mode.toUpperCase()}
      </span>
    );
  };

  const BillCard = ({
    title,
    bills,
    icon,
    accentColor,
    deleted = false,
  }: {
    title: string;
    bills: Bill[];
    icon: React.ReactNode;
    accentColor: string;
    deleted?: boolean;
  }) => (
    <div style={{
      background: "var(--kravy-surface)",
      border: "1px solid var(--kravy-border)",
      borderRadius: "24px",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      position: "relative",
      overflow: "hidden",
      boxShadow: "var(--kravy-card-shadow)"
    }}>
      {/* Top accent line */}
      <div style={{
        position: "absolute",
        top: 0,
        left: "24px",
        right: "24px",
        height: "2px",
        background: `linear-gradient(90deg, ${accentColor}, transparent)`,
        borderRadius: "0 0 8px 8px"
      }} />

      {/* Glow */}
      <div style={{
        position: "absolute",
        top: "-40px",
        right: "-40px",
        width: "140px",
        height: "140px",
        background: `${accentColor}10`,
        borderRadius: "50%",
        filter: "blur(50px)",
        pointerEvents: "none"
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accentColor
          }}>
            {icon}
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--kravy-text-primary)" }}>{title}</h3>
            <div style={{ fontSize: "0.68rem", color: "var(--kravy-text-muted)", fontFamily: "monospace" }}>
              {bills.length} record{bills.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        <button 
          onClick={() => router.push(`/dashboard/reports/payments?range=${range}&status=${deleted ? "Deleted" : "Active"}`)}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--kravy-bg-2)",
            border: "1px solid var(--kravy-border)",
            cursor: "pointer",
            color: "var(--kravy-text-muted)",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = accentColor;
            e.currentTarget.style.color = accentColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--kravy-border)";
            e.currentTarget.style.color = "var(--kravy-text-muted)";
          }}
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Bills List */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        maxHeight: "320px",
        overflowY: "auto",
        overflowX: "hidden",
        paddingRight: "4px"
      }}>
        {bills.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "40px 0",
            color: "var(--kravy-text-muted)",
            fontSize: "0.82rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px"
          }}>
            <div style={{ fontSize: "2rem", opacity: 0.5 }}>📭</div>
            No records found
          </div>
        ) : (
          bills.map((bill, idx) => (
            <motion.div
              key={bill.billNumber}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              style={{
                padding: "14px 16px",
                background: "var(--kravy-bg-2)",
                border: "1px solid var(--kravy-border)",
                borderRadius: "14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "all 0.2s"
              }}
              onHoverStart={(e) => {
                (e.target as HTMLElement).style?.setProperty?.("background", "var(--kravy-surface-hover)");
              }}
              onHoverEnd={(e) => {
                (e.target as HTMLElement).style?.setProperty?.("background", "var(--kravy-bg-2)");
              }}
            >
              {/* Left */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: `${accentColor}12`,
                  border: `1px solid ${accentColor}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: accentColor,
                  fontSize: "0.65rem",
                  fontWeight: 900,
                  fontFamily: "monospace"
                }}>
                  #{bill.billNumber.slice(-2)}
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--kravy-text-primary)" }}>
                    Bill #{bill.billNumber}
                  </div>
                  <div style={{
                    fontSize: "0.7rem",
                    color: "var(--kravy-text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    marginTop: "2px"
                  }}>
                    <User size={9} />
                    {bill.customerName || "Walk-in Customer"}
                  </div>
                </div>
              </div>

              {/* Right */}
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontSize: "1rem",
                  fontWeight: 800,
                  color: deleted ? "#EF4444" : "var(--kravy-text-primary)",
                  letterSpacing: "-0.3px",
                  marginBottom: "4px"
                }}>
                  ₹{format(bill.total)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                  <PaymentBadge mode={bill.paymentMode} />
                  <span style={{
                    fontSize: "0.6rem",
                    color: "var(--kravy-text-faint)",
                    fontFamily: "monospace",
                    whiteSpace: "nowrap"
                  }}>
                    {bill.createdAt}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
      gap: "20px"
    }}>
      <BillCard
        title="Recent Sales"
        bills={recentBills}
        icon={<Receipt size={20} />}
        accentColor="#2563EB"
      />
      <BillCard
        title="Deleted History"
        bills={deletedBills}
        icon={<History size={20} />}
        accentColor="#EF4444"
        deleted
      />
    </div>
  );
}