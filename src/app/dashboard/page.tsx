import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

import StatsGrid from "./components/stats-grid";
import RevenueChart from "./components/revenue-chart";
import RecentBills from "./components/recent-bills";
import TopItems from "./components/top-items";
import DateFilter from "./components/date-filter";
import PaymentModeChart from "./components/payment-mode-chart";

export const revalidate = 0;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await currentUser();

  if (!user) redirect("/sign-in");

  const { range: rangeParam } = await searchParams;
  const range = Number(rangeParam || 30);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - range);

  const bills = await prisma.billManager.findMany({
    where: {
      clerkUserId: user.id,
      isDeleted: false,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = bills.reduce((sum, b) => sum + b.total, 0);
  const totalBills = bills.length;

  let cash = 0;
  let upi = 0;

  bills.forEach((bill) => {
    const mode = (bill.paymentMode || "").toLowerCase();
    if (mode.includes("cash")) cash += bill.total;
    if (mode.includes("upi")) upi += bill.total;
  });

  // Growth calculation
  const previousStart = new Date(startDate);
  previousStart.setDate(previousStart.getDate() - range);

  const previousBills = await prisma.billManager.findMany({
    where: {
      clerkUserId: user.id,
      isDeleted: false,
      createdAt: {
        gte: previousStart,
        lt: startDate,
      },
    },
  });

  const previousRevenue = previousBills.reduce((sum, b) => sum + b.total, 0);
  const growth = previousRevenue === 0 ? 100 : ((totalRevenue - previousRevenue) / previousRevenue) * 100;

  // Chart Mapping
  const chartMap: Record<string, { revenue: number; bills: number }> = {};
  bills.forEach((bill) => {
    const date = bill.createdAt.toISOString().split("T")[0];
    if (!chartMap[date]) chartMap[date] = { revenue: 0, bills: 0 };
    chartMap[date].revenue += bill.total;
    chartMap[date].bills += 1;
  });

  const chartData = Object.keys(chartMap)
    .sort()
    .map((date) => ({
      date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      revenue: chartMap[date].revenue,
      bills: chartMap[date].bills,
    }));

  const recentBills = bills.slice(0, 5).map((bill) => ({
    billNumber: bill.billNumber,
    customerName: bill.customerName ?? undefined,
    paymentMode: bill.paymentMode,
    total: bill.total,
    createdAt: bill.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
  }));

  const deletedBillsData = await prisma.billManager.findMany({
    where: { clerkUserId: user.id, isDeleted: true },
    orderBy: { deletedAt: "desc" },
    take: 5,
  });

  const deletedBills = deletedBillsData.map((bill) => ({
    billNumber: bill.billNumber,
    customerName: bill.customerName,
    paymentMode: bill.paymentMode,
    total: bill.total,
    createdAt: bill.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
  }));

  const itemMap: Record<string, { totalSold: number; totalRevenue: number }> = {};
  bills.forEach((bill) => {
    let items: any = bill.items;
    if (typeof items === "string") {
      try { items = JSON.parse(items); } catch { items = []; }
    }
    if (items && !Array.isArray(items) && items.items) items = items.items;

    if (Array.isArray(items)) {
      items.forEach((item: any) => {
        const name = item?.name || "Unknown";
        const quantity = Number(item?.quantity ?? item?.qty ?? 0);
        const price = Number(item?.sellingPrice ?? item?.price ?? 0);
        if (!itemMap[name]) itemMap[name] = { totalSold: 0, totalRevenue: 0 };
        itemMap[name].totalSold += quantity;
        itemMap[name].totalRevenue += (quantity * price);
      });
    }
  });

  const topItems = Object.keys(itemMap)
    .map((name) => ({
      name,
      totalSold: itemMap[name].totalSold,
      totalRevenue: itemMap[name].totalRevenue,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  const isGrowthPositive = growth > 0;
  const avgOrderValue = totalBills > 0 ? totalRevenue / totalBills : 0;
  const format = (num: number) => new Intl.NumberFormat("en-IN").format(Math.round(num));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

      {/* ── Header Row ── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "6px"
          }}>
            <div style={{
              width: "6px",
              height: "32px",
              background: "linear-gradient(180deg, #FF6B35, #F59E0B)",
              borderRadius: "10px"
            }} />
            <h1 style={{
              fontSize: "1.75rem",
              fontWeight: 900,
              color: "var(--kravy-text-primary)",
              letterSpacing: "-1px",
              lineHeight: 1
            }}>
              Performance Overview
            </h1>
          </div>
          <p style={{
            fontSize: "0.8rem",
            color: "var(--kravy-text-muted)",
            marginLeft: "16px",
            fontFamily: "monospace"
          }}>
            Real-time business analytics · Last {range} days
          </p>
        </div>
        <DateFilter />
      </div>

      {/* ── Stats Grid ── */}
      <StatsGrid
        data={{
          monthlyRevenue: chartData,
          totalBills: totalBills,
          growth: growth,
          paymentSplit: { Cash: cash, UPI: upi },
        }}
      />

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RevenueChart data={chartData} />
        </div>
        <PaymentModeChart paymentSplit={{ Cash: cash, UPI: upi }} />
      </div>

      {/* ── Bills Row ── */}
      <RecentBills recentBills={recentBills} deletedBills={deletedBills} />

      {/* ── Bottom Row: Top Items + Insight Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <TopItems items={topItems} allBills={bills} />
        </div>

        {/* Business Insight Card */}
        <div className="lg:col-span-2" style={{
          background: "var(--kravy-surface)",
          border: "1px solid var(--kravy-border)",
          borderRadius: "24px",
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          boxShadow: "var(--kravy-card-shadow)"
        }}>
          {/* Background decoration */}
          <div style={{
            position: "absolute",
            bottom: "-60px",
            right: "-60px",
            width: "240px",
            height: "240px",
            background: isGrowthPositive
              ? "radial-gradient(circle, rgba(16,185,129,0.12), transparent)"
              : "radial-gradient(circle, rgba(239,68,68,0.1), transparent)",
            borderRadius: "50%",
            filter: "blur(40px)",
            pointerEvents: "none"
          }} />

          <div>
            {/* Insight Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
              <div style={{
                width: "50px",
                height: "50px",
                borderRadius: "16px",
                background: isGrowthPositive
                  ? "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))"
                  : "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))",
                border: `1px solid ${isGrowthPositive ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem"
              }}>
                {isGrowthPositive ? "📈" : "📊"}
              </div>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--kravy-text-primary)" }}>Business Insights</h3>
                <p style={{ fontSize: "0.72rem", color: "var(--kravy-text-muted)", fontFamily: "monospace" }}>
                  AI-powered analysis for your store
                </p>
              </div>
            </div>

            {/* Insight Text */}
            <p style={{
              fontSize: "0.9rem",
              color: "var(--kravy-text-muted)",
              lineHeight: "1.7",
              marginBottom: "24px"
            }}>
              {isGrowthPositive
                ? `🎉 Excellent! Your revenue grew by ${growth.toFixed(1)}% compared to last period. Focus on your top-selling items to maintain this momentum. Consider expanding your menu with similar dishes.`
                : `Track your sales patterns to identify peak hours and popular items. Promoting top-selling dishes and offering combos can help boost your average order value significantly.`}
            </p>

            {/* Mini Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
              {[
                {
                  label: "Avg. Order",
                  value: `₹${format(avgOrderValue)}`,
                  color: "#8B5CF6"
                },
                {
                  label: "Revenue Growth",
                  value: `${growth > 0 ? "+" : ""}${growth.toFixed(1)}%`,
                  color: isGrowthPositive ? "#10B981" : "#EF4444"
                },
                {
                  label: "UPI Ratio",
                  value: totalRevenue > 0 ? `${Math.round((upi / totalRevenue) * 100)}%` : "0%",
                  color: "#F59E0B"
                }
              ].map((stat, i) => (
                <div key={i} style={{
                  background: "var(--kravy-bg-2)",
                  border: "1px solid var(--kravy-border)",
                  borderRadius: "14px",
                  padding: "14px",
                  textAlign: "center"
                }}>
                  <div style={{
                    fontSize: "1.1rem",
                    fontWeight: 900,
                    color: stat.color,
                    letterSpacing: "-0.5px"
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: "0.65rem",
                    color: "var(--kravy-text-muted)",
                    fontFamily: "monospace",
                    marginTop: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["#KravyPOS", "#SalesAnalytics", isGrowthPositive ? "#GrowthMode" : "#StaySteady", "#BusinessInsight"].map(tag => (
              <span key={tag} style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                padding: "5px 12px",
                background: "var(--kravy-bg-2)",
                border: "1px solid var(--kravy-border)",
                borderRadius: "20px",
                color: "var(--kravy-text-muted)",
                fontFamily: "monospace"
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}