"use client";

import { motion } from "framer-motion";
import { Flame, Trophy } from "lucide-react";

interface Item {
  name: string;
  totalSold: number;
  totalRevenue: number;
}

interface Props {
  items?: Item[];
  allBills?: any[];
}

export default function TopItems({
  items = [],
}: Props) {
  const format = (num: number) =>
    new Intl.NumberFormat("en-IN").format(Math.round(num));

  const maxRevenue =
    items.length > 0
      ? Math.max(...items.map((i) => i.totalRevenue))
      : 1;

  const colors = [
    { primary: "#F59E0B", glow: "rgba(245,158,11,0.4)" },
    { primary: "#9CA3AF", glow: "rgba(156,163,175,0.3)" },
    { primary: "#CD7F32", glow: "rgba(205,127,50,0.3)" },
    { primary: "#8B5CF6", glow: "rgba(139,92,246,0.3)" },
    { primary: "#10B981", glow: "rgba(16,185,129,0.3)" },
  ];

  const rankLabels = ["🥇", "🥈", "🥉", "4th", "5th"];

  return (
    <div style={{
      background: "var(--kravy-surface)",
      border: "1px solid var(--kravy-border)",
      borderRadius: "24px",
      padding: "24px",
      height: "100%",
      position: "relative",
      overflow: "hidden",
      boxShadow: "var(--kravy-card-shadow)"
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute",
        top: "-50px",
        right: "-50px",
        width: "180px",
        height: "180px",
        background: "rgba(245,158,11,0.08)",
        borderRadius: "50%",
        filter: "blur(60px)",
        pointerEvents: "none"
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #F59E0B, #D97706)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(245,158,11,0.4)"
          }}>
            <Flame size={20} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#F1F0EC" }}>Top Sellers</h3>
            <p style={{ fontSize: "0.72rem", color: "#6B7280", fontFamily: "monospace" }}>
              Best performing dishes
            </p>
          </div>
        </div>
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(245,158,11,0.12)",
          border: "1px solid rgba(245,158,11,0.2)"
        }}>
          <Trophy size={16} color="#F59E0B" />
        </div>
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {items.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "40px 0",
            color: "#4A5568",
            fontSize: "0.82rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px"
          }}>
            <div style={{ fontSize: "2rem", opacity: 0.5 }}>🍽️</div>
            No sales data available
          </div>
        ) : (
          items.map((item, index) => {
            const progress = (item.totalRevenue / maxRevenue) * 100;
            const color = colors[index % colors.length];

            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
              >
                {/* Item row */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* Rank badge */}
                    <div style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background: index < 3
                        ? `${color.primary}18`
                        : "rgba(255,255,255,0.04)",
                      border: `1px solid ${color.primary}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: index < 3 ? "0.9rem" : "0.62rem",
                      fontWeight: 800,
                      color: color.primary,
                      fontFamily: "monospace",
                      flexShrink: 0
                    }}>
                      {rankLabels[index]}
                    </div>
                    <div style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--kravy-text-secondary)",
                      maxWidth: "110px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {item.name}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      color: "#F1F0EC",
                      letterSpacing: "-0.3px"
                    }}>
                      ₹{format(item.totalRevenue)}
                    </div>
                    <div style={{
                      fontSize: "0.62rem",
                      color: "#6B7280",
                      fontFamily: "monospace"
                    }}>
                      {item.totalSold} units
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{
                  height: "5px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "10px",
                  overflow: "hidden"
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: index * 0.1 }}
                    style={{
                      height: "100%",
                      background: `linear-gradient(90deg, ${color.primary}, ${color.primary}99)`,
                      borderRadius: "10px",
                      boxShadow: `0 0 8px ${color.glow}`
                    }}
                  />
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}