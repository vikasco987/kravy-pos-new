"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface RevenueChartProps {
  data: any[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "linear-gradient(135deg, #0D0F1A, #111827)",
        border: "1px solid rgba(139,92,246,0.3)",
        borderRadius: "14px",
        padding: "14px 18px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        color: "var(--kravy-text-primary)"
      }}>
        <div style={{ fontSize: "0.72rem", color: "#6B7280", fontFamily: "monospace", marginBottom: "6px" }}>{label}</div>
        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#8B5CF6" }}>
          ₹{new Intl.NumberFormat("en-IN").format(Math.round(payload[0]?.value || 0))}
        </div>
        {payload[1] && (
          <div style={{ fontSize: "0.78rem", color: "#FF6B35", marginTop: "4px" }}>
            {payload[1].value} bills
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function RevenueChart({ data }: RevenueChartProps) {
  const maxRevenue = data.length ? Math.max(...data.map(d => d.revenue || 0)) : 0;

  return (
    <div style={{
      background: "var(--kravy-surface)",
      border: "1px solid var(--kravy-border)",
      borderRadius: "24px",
      padding: "28px",
      height: "400px",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
      boxShadow: "var(--kravy-card-shadow)"
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute",
        top: "-60px",
        right: "-60px",
        width: "200px",
        height: "200px",
        background: "rgba(139,92,246,0.12)",
        borderRadius: "50%",
        filter: "blur(60px)",
        pointerEvents: "none"
      }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(139,92,246,0.4)"
            }}>
              <TrendingUp size={18} color="white" />
            </div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#F1F0EC" }}>Revenue Analytics</h3>
          </div>
          <p style={{ fontSize: "0.72rem", color: "#6B7280", fontFamily: "monospace", paddingLeft: "46px" }}>
            Sales performance over selected period
          </p>
        </div>
        {maxRevenue > 0 && (
          <div style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            padding: "6px 12px",
            borderRadius: "20px",
            background: "rgba(139,92,246,0.12)",
            color: "#8B5CF6",
            border: "1px solid rgba(139,92,246,0.25)",
            fontFamily: "monospace"
          }}>
            Peak: ₹{new Intl.NumberFormat("en-IN").format(Math.round(maxRevenue))}
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#4A5568",
          gap: "12px"
        }}>
          <div style={{ fontSize: "2rem" }}>📊</div>
          <div style={{ fontSize: "0.85rem", fontFamily: "monospace" }}>No revenue data for this period</div>
        </div>
      ) : (
        <div style={{ flex: 1, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBills" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#4A5568", fontSize: 10, fontFamily: "monospace" }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#4A5568", fontSize: 10, fontFamily: "monospace" }}
                tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRev)"
                dot={{ fill: "#8B5CF6", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#8B5CF6" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}