import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

import StatsGrid from "./components/stats-grid";
import RevenueChart from "./components/revenue-chart";
import RecentBills from "./components/recent-bills";
import TopItems from "./components/top-items";
import DateFilter from "./components/date-filter";
import PaymentModeChart from "./components/payment-mode-chart";
import DashboardSoundAlerts from "./components/dashboard-sound-alerts";
import { Sparkles, Tag, Fingerprint, Copy, ShieldCheck, Zap, Smartphone } from "lucide-react";
import CopyButton from "./components/copy-button";

export const revalidate = 0;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const effectiveId = await getEffectiveClerkId();

  if (!effectiveId) redirect("/sign-in");

  const { range: rangeParam } = await searchParams;
  const range = Number(rangeParam || 30);

  const endDate = new Date();
  const startDate = new Date();
  
  if (range === 1) {
    // Today: From 00:00 AM to Now
    startDate.setHours(0, 0, 0, 0);
  } else if (range === 2) {
    // Yesterday: From 00:00 AM yesterday to 11:59 PM yesterday
    startDate.setDate(startDate.getDate() - 1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Last X days
    startDate.setDate(endDate.getDate() - range);
  }

  const previousStart = new Date(startDate);
  previousStart.setDate(previousStart.getDate() - range);

  const [allBills, previousBills, deletedBillsData, activeCombosCount, activeOffersCount] = await Promise.all([
    prisma.billManager.findMany({
      where: {
        clerkUserId: effectiveId,
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.billManager.findMany({
      where: {
        clerkUserId: effectiveId,
        isDeleted: false,
        createdAt: {
          gte: previousStart,
          lt: startDate,
        },
      },
    }),
    prisma.billManager.findMany({
      where: { clerkUserId: effectiveId, isDeleted: true },
      orderBy: { deletedAt: "desc" },
      take: 5,
    }),
    prisma.combo.count({ where: { clerkUserId: effectiveId, isActive: true } }),
    prisma.offer.count({ where: { clerkUserId: effectiveId, isActive: true } })
  ]);

  // ── Filter bills for the selected RANGE (for charts/revenue/recent) ──
  const bills = allBills.filter(b => 
    new Date(b.createdAt) >= startDate && new Date(b.createdAt) <= endDate
  );

  const totalRevenue = bills.reduce((sum: number, b: any) => sum + b.total, 0);
  const totalBills = bills.length;

  let cash = 0;
  let upi = 0;

  bills.forEach((bill: any) => {
    const mode = (bill.paymentMode || "").toLowerCase();
    if (mode.includes("cash")) cash += bill.total;
    if (mode.includes("upi")) upi += bill.total;
  });

  const previousRevenue = previousBills.reduce((sum: number, b: any) => sum + b.total, 0);
  const growth = previousRevenue === 0 ? 100 : ((totalRevenue - previousRevenue) / previousRevenue) * 100;

  // Chart Mapping
  const chartMap: Record<string, { revenue: number; bills: number }> = {};
  bills.forEach((bill: any) => {
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

  const recentBills = bills.slice(0, 5).map((bill: any) => ({
    billNumber: bill.billNumber,
    customerName: bill.customerName ?? undefined,
    paymentMode: bill.paymentMode,
    total: bill.total,
    createdAt: bill.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
  }));

  const deletedBills = deletedBillsData.map((bill: any) => ({
    billNumber: bill.billNumber,
    customerName: bill.customerName,
    paymentMode: bill.paymentMode,
    total: bill.total,
    createdAt: bill.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
  }));

  const itemMap: Record<string, { totalSold: number; totalRevenue: number }> = {};
  bills.forEach((bill: any) => {
    let items: any = bill.items;
    if (typeof items === "string") {
      try { items = JSON.parse(items); } catch { items = []; }
    }
    if (items && !Array.isArray(items) && items.items) items = items.items;

    if (Array.isArray(items)) {
      items.forEach((item: any) => {
        const name = item?.name || "Unknown";
        const quantity = Number(item?.quantity ?? item?.qty ?? 0);
        
        // Robust price detection to match Quick POS logic
        const sPrice = Number(item?.sellingPrice);
        const bPrice = Number(item?.price);
        const rPrice = Number(item?.rate);
        
        const price = !isNaN(sPrice) && item.sellingPrice !== null ? sPrice 
                   : !isNaN(rPrice) && item.rate !== null ? rPrice
                   : !isNaN(bPrice) ? bPrice : 0;

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
    .slice(0, 8);

  const isGrowthPositive = growth > 0;
  const avgOrderValue = totalBills > 0 ? totalRevenue / totalBills : 0;
  const format = (num: number) => new Intl.NumberFormat("en-IN").format(Math.round(num));

  // ── Calculate Day, Week, and Month Sales ──
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const daySale = allBills
    .filter((b: any) => new Date(b.createdAt) >= startOfDay)
    .reduce((s: number, b: any) => s + b.total, 0);

  const weekSale = allBills
    .filter((b: any) => new Date(b.createdAt) >= startOfWeek)
    .reduce((s: number, b: any) => s + b.total, 0);

  const monthSale = allBills
    .filter((b: any) => new Date(b.createdAt) >= startOfMonth)
    .reduce((s: number, b: any) => s + b.total, 0);

  // ── Calculate Dynamic Customer Stats (New vs Repeat for the selected RANGE) ──
  const currentRangeBills = bills;
  const preRangeBills = allBills.filter(b => new Date(b.createdAt) < startDate);

  const preRangePhones = new Set(preRangeBills.map(b => b.customerPhone).filter(Boolean));
  const currentRangeIdentifiableBills = currentRangeBills.filter(b => b.customerPhone);
  const currentRangeUniquePhones = new Set(currentRangeIdentifiableBills.map(b => b.customerPhone));
  const currentRangeAnonymousCount = currentRangeBills.filter(b => !b.customerPhone).length;

  let rangeRepeatCount = 0;
  let rangeNewCount = 0;

  currentRangeUniquePhones.forEach(phone => {
    if (preRangePhones.has(phone)) {
      rangeRepeatCount++;
    } else {
      rangeNewCount++;
    }
  });

  const totalRangeCustomers = currentRangeUniquePhones.size + currentRangeAnonymousCount;

  // ── Calculate Peak Hour Today (Keep this for Today specifically or for the Range) ──
  // User asked for "today" specifically in previous step, but let's make it for the range if needed? 
  // Usually Peak Hour is most useful for 'Today'. I'll keep it for the selected 'bills'.
  const hourMap: Record<number, number> = {};
  currentRangeBills.forEach(b => {
    const hour = new Date(b.createdAt).getHours();
    hourMap[hour] = (hourMap[hour] || 0) + 1;
  });
  
  let peakHour = -1;
  let maxOrders = 0;
  Object.entries(hourMap).forEach(([hour, count]) => {
    if (count > maxOrders) {
      maxOrders = count;
      peakHour = Number(hour);
    }
  });

  const peakHourStr = peakHour === -1 
    ? "No data" 
    : `${peakHour % 12 || 12} ${peakHour >= 12 ? 'PM' : 'AM'}`;

  // ── Calculate Peak Day Matrix (Weekly Distribution) ──
  const dayNameMap: Record<string, number> = { 
    'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0, 'Friday': 0, 'Saturday': 0 
  };
  
  // Use last 30 days for a better matrix
  const last30DaysBills = allBills.filter(b => new Date(b.createdAt) >= startDate);
  last30DaysBills.forEach(b => {
    const dayName = new Date(b.createdAt).toLocaleDateString('en-IN', { weekday: 'long' });
    dayNameMap[dayName] = (dayNameMap[dayName] || 0) + b.total;
  });

  const peakDayEntry = Object.entries(dayNameMap).sort((a,b) => b[1] - a[1])[0];
  const peakDayName = peakDayEntry[1] > 0 ? peakDayEntry[0] : "No data";

  // ── Fetch Live Orders (QR Orders) ──
  const liveOrders = await prisma.order.findMany({
    where: { clerkUserId: effectiveId, status: { not: "COMPLETED" } }
  });

  const activeOrderCount = liveOrders.length;
  const completedTodayCount = allBills.filter(b => b.createdAt >= startOfDay).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <DashboardSoundAlerts activeOrders={activeOrderCount} />

      {/* ── Header Row ── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        {/* ... existing header code ... */}
        <div className="flex flex-col gap-2">
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <div style={{
              width: "42px",
              height: "42px",
              background: "linear-gradient(135deg, #FF6B35, #F59E0B)",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              boxShadow: "0 10px 15px -3px rgba(245, 158, 11, 0.3)"
            }}>
              <Zap size={20} fill="white" />
            </div>
            <div>
              <h1 style={{
                fontSize: "1.75rem",
                fontWeight: 900,
                color: "var(--kravy-text-primary)",
                letterSpacing: "-1.2px",
                lineHeight: 1
              }}>
                Performance Dashboard
              </h1>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "6px"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                  background: "var(--kravy-surface)",
                  border: "1px solid var(--kravy-border)",
                  borderRadius: "8px",
                  fontSize: "0.65rem",
                  color: "var(--kravy-text-muted)",
                  fontWeight: 800,
                  fontFamily: "monospace",
                  textTransform: "uppercase"
                }}>
                  <Fingerprint size={10} className="text-orange-500" />
                  ID: <span style={{ color: "var(--kravy-text-primary)" }}>{effectiveId}</span>
                  <CopyButton text={effectiveId} />
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  borderRadius: "8px",
                  fontSize: "0.6rem",
                  color: "#10B981",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  <ShieldCheck size={10} />
                  Admin Verified
                </div>
              </div>
            </div>
          </div>
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
          daySale,
          weekSale,
          monthSale,
          todayCustomers: totalRangeCustomers,
          newCustomers: rangeNewCount,
          repeatCustomers: rangeRepeatCount,
          walkInCustomers: currentRangeAnonymousCount,
          peakHour: peakHourStr,
          peakDay: peakDayName,
          activeOrders: activeOrderCount,
          completedOrders: completedTodayCount,
          avgOrderValue: avgOrderValue
        }}
        range={range}
      />

      {/* ── API & SCRAPER INTEGRATION (Admin Central) ── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.02), rgba(30, 41, 59, 0.05))",
        border: "1px solid var(--kravy-border)",
        borderRadius: "28px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: "-20px",
          right: "-20px",
          width: "140px",
          height: "140px",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.1), transparent)",
          borderRadius: "50%",
          filter: "blur(30px)"
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            background: "var(--kravy-surface)",
            border: "1px solid var(--kravy-border)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--kravy-brand)"
          }}>
            <Smartphone size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 900, color: "var(--kravy-text-primary)", letterSpacing: "-0.5px" }}>
              API & External Integration
            </h2>
            <p style={{ fontSize: "0.68rem", color: "var(--kravy-text-muted)", fontFamily: "monospace", textTransform: "uppercase" }}>
              Automate your menu enrichment & scraping
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Admin Clerk ID", value: effectiveId, icon: <Fingerprint size={14} />, color: "#6366F1" },
            { label: "Scraper Secret", value: "********", type: "secret", icon: <ShieldCheck size={14} />, color: "#10B981" },
            { label: "Menu Fetch Endpoint", value: `/api/external/menu/${effectiveId}`, icon: <Copy size={14} />, color: "#F59E0B" },
            { label: "API Base URL", value: "billing.kravy.in", icon: <Copy size={14} />, color: "#8B5CF6" }
          ].map((item, idx) => (
            <div key={idx} style={{
              background: "var(--kravy-surface)",
              border: "1px solid var(--kravy-border)",
              borderRadius: "18px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: item.color }}>{item.icon}</span>
                <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "var(--kravy-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {item.label}
                </span>
              </div>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                background: "var(--kravy-bg-2)",
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid var(--kravy-border)"
              }}>
                <span style={{ 
                  fontSize: "0.72rem", 
                  fontWeight: 900, 
                  color: "var(--kravy-text-primary)",
                  fontFamily: "monospace",
                  maxWidth: "140px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                  {item.value}
                </span>
                <CopyButton text={item.value === "********" ? "kravy_scraper_secret_2026" : (item.value.startsWith("/") ? `https://billing.kravy.in${item.value}` : item.value)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RevenueChart data={chartData} />
        </div>
        <PaymentModeChart 
          paymentSplit={{ Cash: cash, UPI: upi }} 
          range={range}
        />
      </div>

      {/* ── Bills Row ── */}
      <RecentBills 
        recentBills={recentBills} 
        deletedBills={deletedBills} 
        range={range}
      />

      {/* ── Marketing Hub Section ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <a href="/dashboard/combos" className="group p-6 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[32px] text-white shadow-xl shadow-indigo-200 block transition-all hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Sparkles size={24} className="text-white" />
            </div>
            <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
              Live Preview Active
            </div>
          </div>
          <h3 className="text-2xl font-black mb-1">Combo Deals</h3>
          <p className="text-white/70 text-sm font-medium mb-4">Create & edit meal bundles with real-time customer view preview</p>
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-white text-indigo-700 rounded-xl text-xs font-black uppercase tracking-wider">
              {activeCombosCount} Active Deals
            </div>
            <div className="text-white/40 font-black">→</div>
          </div>
        </a>

        <a href="/dashboard/offers" className="group p-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-[32px] text-white shadow-xl shadow-amber-200 block transition-all hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Tag size={24} className="text-white" />
            </div>
            <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
              Campaigns
            </div>
          </div>
          <h3 className="text-2xl font-black mb-1">Offers & Coupons</h3>
          <p className="text-white/70 text-sm font-medium mb-4">Manage discount codes and seasonal promotions logic</p>
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-white text-amber-700 rounded-xl text-xs font-black uppercase tracking-wider">
              {activeOffersCount} Active Coupons
            </div>
            <div className="text-white/40 font-black">→</div>
          </div>
        </a>
      </div>

      {/* ── Bottom Row: Top Items + Insight Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <TopItems items={topItems} range={range} />
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