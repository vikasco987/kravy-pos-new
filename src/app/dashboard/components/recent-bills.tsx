"use client";

import { Receipt, History, User, Banknote, Smartphone, Maximize2, Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface Bill {
  id: string;
  billNumber: string;
  customerName?: string | null;
  paymentMode: string;
  total: number;
  createdAt: string;
  items?: any;
  tokenNumber?: number | null;
  tableName?: string | null;
  isOrder?: boolean;
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
    const color = isUPI ? "#6366F1" : "#10B981";
    const Icon = isUPI ? Smartphone : Banknote;

    return (
      <span style={{
        fontSize: "0.6rem",
        fontWeight: 800,
        padding: "3px 8px",
        borderRadius: "20px",
        background: isUPI ? "rgba(99, 102, 241, 0.1)" : "rgba(16, 185, 129, 0.1)",
        color: color,
        border: `1px solid ${isUPI ? "rgba(99, 102, 241, 0.2)" : "rgba(16, 185, 129, 0.2)"}`,
        display: "flex",
        alignItems: "center",
        gap: "4px"
      }}>
        <Icon size={10} />
        {mode.toUpperCase()}
      </span>
    );
  };

  const BillCardContainer = ({
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
      background: "white",
      border: "1px solid #F3F4F6",
      borderRadius: "24px",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: `${accentColor}10`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accentColor
          }}>
            {icon}
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 900, color: "#111827" }}>{title}</h3>
            <div style={{ fontSize: "0.68rem", color: "#9CA3AF", fontWeight: 700 }}>
              {bills.length} record{bills.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        <button 
          onClick={() => router.push(`/dashboard/billing`)}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#F9FAFB",
            border: "1px solid #E5E7EB",
            cursor: "pointer",
            color: "#9CA3AF"
          }}
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Bills List */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxHeight: "350px",
        overflowY: "auto",
        paddingRight: "4px"
      }}>
        {bills.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF", fontSize: "0.82rem" }}>📭 No records found</div>
        ) : (
          bills.map((bill, idx) => (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{
                padding: "16px",
                background: "#F9FAFB",
                border: "1px solid #F3F4F6",
                borderRadius: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 900, color: "#6366F1", fontFamily: "monospace" }}>#{bill.billNumber}</div>
                  {bill.tokenNumber && (
                    <div style={{ fontSize: "0.65rem", fontWeight: 900, color: "#10B981", background: "#ECFDF5", padding: "2px 6px", borderRadius: "4px" }}>T-{String(bill.tokenNumber).padStart(2, '0')}</div>
                  )}
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 900, color: deleted ? "#EF4444" : "#111827" }}>₹{format(bill.total)}</div>
              </div>

              {/* Items in Card */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {bill.items?.map((it: any, i: number) => (
                  <span key={i} style={{ fontSize: "0.6rem", padding: "2px 6px", background: "white", border: "1px solid #E5E7EB", borderRadius: "4px", color: "#6B7280", fontWeight: 700 }}>
                    {it.name} x{it.quantity || it.qty}
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E5E7EB", paddingTop: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                   <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#374151" }}>{bill.customerName || "Walk-in"}</div>
                   <PaymentBadge mode={bill.paymentMode} />
                </div>
                <div style={{ fontSize: "0.65rem", color: "#9CA3AF", fontWeight: 600 }}>{new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
      <BillCardContainer
        title="Recent Sales"
        bills={recentBills}
        icon={<Receipt size={20} />}
        accentColor="#6366F1"
      />
      <BillCardContainer
        title="Deleted History"
        bills={deletedBills}
        icon={<History size={20} />}
        accentColor="#EF4444"
        deleted
      />
    </div>
  );
}