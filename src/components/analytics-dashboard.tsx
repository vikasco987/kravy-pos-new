"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const COLORS = ["#2563eb", "#16a34a"];

export function AnalyticsDashboard({ data }: any) {
  const [dailyData, setDailyData] = useState<any>(null);

  if (!data) return <p>Loading analytics...</p>;

  // Drilldown
  const handleMonthClick = (e: any) => {
    const month = e?.activeLabel;
    if (!month) return;

    const daily = data.dailyRevenue?.[month];
    if (!daily) return;

    const formatted = Object.entries(daily).map(
      ([day, revenue]) => ({
        day,
        revenue,
      })
    );

    setDailyData(formatted);
  };

  // Excel Export
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.monthlyRevenue || []
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Analytics");

    const buffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([buffer], {
      type: "application/octet-stream",
    });

    saveAs(blob, "KRAVY_Analytics.xlsx");
  };

  return (
    <div className="analytics-wrapper">

      {/* HEADER */}
      <div className="analytics-header">
        <h2>Business Analytics</h2>
        <div className="analytics-actions">
          <span className="growth">
            Growth: {data.growth?.toFixed(2) || 0}%
          </span>
          <button onClick={exportToExcel}>
            Export Excel
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className="analytics-grid">

        {/* Monthly Revenue */}
        <div className="card large">
          <h3>Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={data.monthlyRevenue || []}
              onClick={handleMonthClick}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                fill="#93c5fd"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Split */}
        <div className="card">
          <h3>Payment Mode</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  {
                    name: "Cash",
                    value: data.paymentSplit?.Cash || 0,
                  },
                  {
                    name: "UPI",
                    value: data.paymentSplit?.UPI || 0,
                  },
                ]}
                dataKey="value"
                outerRadius={100}
              >
                {COLORS.map((color, index) => (
                  <Cell key={index} fill={color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Items */}
        <div className="card">
          <h3>Top Selling Items</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topItems || []}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="qty" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="card">
        <h3>Recent Bills</h3>

        <div className="recent-list">
            {data.recentBills?.map((bill: any) => (
            <div key={bill.billNumber} className="recent-item">
                <div>
                <strong>#{bill.billNumber}</strong>
                <p className="recent-name">
                    {bill.customerName || "Walk-in"}
                </p>
                </div>

                <div className="recent-right">
                <span className="payment">
                    {bill.paymentMode}
                </span>
                <span className="amount">
                    ₹ {bill.total.toLocaleString()}
                </span>
                <span className="time">
                    {bill.createdAt}
                </span>
                </div>
            </div>
            ))}
        </div>
        </div>
        {/* Daily Drilldown */}
        {dailyData && (
          <div className="card large">
            <h3>Daily Revenue</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    </div>
  );
}