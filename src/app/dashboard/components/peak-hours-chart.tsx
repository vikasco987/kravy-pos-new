"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  data: { hour: number; count: number; label: string }[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "var(--kravy-surface-hover)",
        border: "1px solid var(--kravy-border-strong)",
        borderRadius: "12px",
        padding: "8px 12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        color: "var(--kravy-text-primary)"
      }}>
        <div style={{ fontSize: "0.7rem", color: "var(--kravy-text-muted)", marginBottom: "2px" }}>{payload[0].payload.label}</div>
        <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#F59E0B" }}>
          {payload[0].value} Orders
        </div>
      </div>
    );
  }
  return null;
};

export default function PeakHoursChart({ data }: Props) {
  // Show only even hours or specific intervals for cleaner X axis
  const displayData = data.filter((_, index) => index % 2 === 0);

  return (
    <div style={{
      background: "var(--kravy-surface)",
      border: "1px solid var(--kravy-border)",
      borderRadius: "24px",
      padding: "28px",
      height: "400px",
      display: "flex",
      flexDirection: "column",
      boxShadow: "var(--kravy-card-shadow)",
      position: "relative",
      overflow: "hidden"
    }}>
      <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--kravy-text-primary)", marginBottom: "24px" }}>Peak hours today</h3>

      <div style={{ flex: 1, width: "100%", minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--kravy-border)" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "var(--kravy-text-muted)", fontSize: 10, fontWeight: 700 }}
              interval={1}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "var(--kravy-text-muted)", fontSize: 10, fontWeight: 700 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(245, 158, 11, 0.05)" }} />
            <Bar 
              dataKey="count" 
              radius={[6, 6, 0, 0]}
              barSize={24}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill="#F59E0B" 
                  fillOpacity={entry.count === 0 ? 0.2 : 0.9}
                  style={{ filter: entry.count > 0 ? "drop-shadow(0 4px 8px rgba(245, 158, 11, 0.3))" : "none" }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
