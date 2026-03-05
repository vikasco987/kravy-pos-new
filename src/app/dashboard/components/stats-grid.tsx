"use client";

import { TrendingUp, TrendingDown, IndianRupee, FileText, Banknote, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  data: {
    monthlyRevenue?: { revenue: number }[];
    totalBills?: number;
    growth?: number;
    paymentSplit?: { Cash?: number; UPI?: number };
  };
}

export default function StatsGrid({ data }: Props) {
  const totalRevenue = data.monthlyRevenue?.reduce((s, m) => s + (m.revenue || 0), 0) || 0;
  const totalBills = data.totalBills || 0;
  const growth = data.growth || 0;
  const isPositive = growth >= 0;
  const cash = data.paymentSplit?.Cash || 0;
  const upi = data.paymentSplit?.UPI || 0;

  const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n));

  const stats = [
    {
      label: "Total Revenue",
      value: `₹${fmt(totalRevenue)}`,
      sub: `${isPositive ? "+" : ""}${growth.toFixed(1)}% vs last period`,
      icon: <IndianRupee size={20} strokeWidth={2.5} />,
      accent: "#10B981",
      gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      glow: "rgba(16,185,129,0.35)",
      trend: isPositive,
      showTrend: true,
    },
    {
      label: "Total Bills",
      value: fmt(totalBills),
      sub: "All transactions",
      icon: <FileText size={20} strokeWidth={2.5} />,
      accent: "#FF6B35",
      gradient: "linear-gradient(135deg, #FF6B35 0%, #F59E0B 100%)",
      glow: "rgba(255,107,53,0.3)",
      trend: true,
      showTrend: false,
    },
    {
      label: "Cash Collected",
      value: `₹${fmt(cash)}`,
      sub: "Physical payments",
      icon: <Banknote size={20} strokeWidth={2.5} />,
      accent: "#F59E0B",
      gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
      glow: "rgba(245,158,11,0.3)",
      trend: true,
      showTrend: false,
    },
    {
      label: "UPI Payments",
      value: `₹${fmt(upi)}`,
      sub: "Digital transactions",
      icon: <Smartphone size={20} strokeWidth={2.5} />,
      accent: "#8B5CF6",
      gradient: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
      glow: "rgba(139,92,246,0.3)",
      trend: true,
      showTrend: false,
    },
  ];

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } }
  };
  const card = {
    hidden: { opacity: 0, y: 24, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: "easeOut" as const } }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px",
      }}
    >
      {stats.map((s, i) => (
        <motion.div
          key={i}
          variants={card}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="kravy-stat-card"
        >
          {/* Colored accent top bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height: "2px",
            background: s.gradient,
            borderRadius: "22px 22px 0 0",
          }} />

          {/* Glow orb */}
          <div className="kravy-stat-glow" style={{
            width: "130px", height: "130px",
            top: "-40px", right: "-40px",
            background: s.glow,
          }} />

          {/* Second subtle orb */}
          <div className="kravy-stat-glow" style={{
            width: "60px", height: "60px",
            bottom: "-10px", left: "-10px",
            background: s.glow,
            opacity: 0.25,
          }} />

          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            {/* Icon */}
            <div style={{
              width: "46px", height: "46px",
              borderRadius: "14px",
              background: s.gradient,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white",
              boxShadow: `0 6px 20px ${s.glow}`,
              position: "relative",
              zIndex: 1,
            }}>
              {s.icon}
            </div>

            {/* Trend / rank badge */}
            {s.showTrend ? (
              <div style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "5px 10px",
                borderRadius: "999px",
                background: s.trend ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                border: `1px solid ${s.trend ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                fontSize: "0.68rem", fontWeight: 700,
                color: s.trend ? "#10B981" : "#EF4444",
              }}>
                {s.trend ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {growth.toFixed(1)}%
              </div>
            ) : (
              <div style={{
                fontSize: "0.62rem", fontWeight: 700,
                padding: "4px 10px", borderRadius: "999px",
                background: `${s.accent}14`,
                color: s.accent,
                border: `1px solid ${s.accent}30`,
              }}>
                {i === 1 ? "📋" : i === 2 ? "💵" : "📱"} {i === 1 ? "Bills" : i === 2 ? "Cash" : "UPI"}
              </div>
            )}
          </div>

          {/* Value */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07, duration: 0.4 }}
            style={{
              fontSize: "1.85rem",
              fontWeight: 900,
              color: "var(--kravy-text-primary)",
              letterSpacing: "-1.5px",
              lineHeight: 1,
              marginBottom: "8px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {s.value}
          </motion.div>

          {/* Separator */}
          <div style={{
            height: "1px",
            background: `linear-gradient(90deg, ${s.accent}30, transparent)`,
            marginBottom: "10px",
          }} />

          {/* Label + sub */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "var(--kravy-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "3px",
            }}>
              {s.label}
            </div>
            <div style={{
              fontSize: "0.72rem",
              color: s.showTrend ? (s.trend ? "#10B981" : "#EF4444") : "var(--kravy-text-faint)",
              fontWeight: 500,
              display: "flex", alignItems: "center", gap: "4px",
            }}>
              {s.showTrend && (s.trend ? <TrendingUp size={11} /> : <TrendingDown size={11} />)}
              {s.sub}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}