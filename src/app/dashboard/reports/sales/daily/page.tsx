import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import { ChevronLeft, Wallet, TrendingUp, TrendingDown, Clock, Package, IndianRupee, FileText, Calendar, Zap, Download, Info, Target, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export const revalidate = 0;

export default async function DailySalesReportPage() {
  const effectiveId = await getEffectiveClerkId();
  if (!effectiveId) redirect("/sign-in");

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Yesterday comparison
  const startOfYesterday = new Date(startOfDay);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const endOfYesterday = new Date(endOfDay);
  endOfYesterday.setDate(endOfYesterday.getDate() - 1);

  const [todayBills, yesterdayBills] = await Promise.all([
    prisma.billManager.findMany({
      where: { clerkUserId: effectiveId, isDeleted: false, createdAt: { gte: startOfDay, lte: endOfDay } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.billManager.findMany({
      where: { clerkUserId: effectiveId, isDeleted: false, createdAt: { gte: startOfYesterday, lte: endOfYesterday } }
    })
  ]);

  const todayRevenue = todayBills.reduce((s, b) => s + b.total, 0);
  const yesterdayRevenue = yesterdayBills.reduce((s, b) => s + b.total, 0);
  const growth = yesterdayRevenue === 0 ? 100 : ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;

  // Hourly stats
  const hourly = Array(24).fill(0);
  todayBills.forEach(b => hourly[new Date(b.createdAt).getHours()] += b.total);
  const maxHourlyValue = Math.max(...hourly, 1);

  // Item Breakdown
  const itemMap: Record<string, number> = {};
  let totalItemsSold = 0;
  todayBills.forEach(b => {
    let items: any = b.items;
    if (typeof items === "string") try { items = JSON.parse(items); } catch { items = []; }
    if (items && !Array.isArray(items) && items.items) items = items.items;
    if (Array.isArray(items)) {
      items.forEach((it: any) => {
        const name = it.name || "Unknown";
        const q = Number(it.quantity || it.qty || 0);
        itemMap[name] = (itemMap[name] || 0) + q;
        totalItemsSold += q;
      });
    }
  });

  const topItems = Object.entries(itemMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const avgTicketSize = todayBills.length > 0 ? todayRevenue / todayBills.length : 0;
  const peakHour = hourly.indexOf(Math.max(...hourly));

  // Goal tracking logic (Dynamic goal based on previous day or fixed)
  const dailyGoal = 15000; 
  const goalProgress = Math.min((todayRevenue / dailyGoal) * 100, 100);

  const format = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", padding: "12px", background: "var(--kravy-bg)", minHeight: "100vh" }}>
      {/* ── Header Section ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link href="/dashboard" style={{
            width: "52px", height: "52px", borderRadius: "18px", background: "var(--kravy-surface)",
            border: "1px solid var(--kravy-border)", display: "flex", alignItems: "center", justifyContent: "center", 
            color: "var(--kravy-text-primary)", boxShadow: "0 8px 16px rgba(0,0,0,0.06)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          }}>
            <ChevronLeft size={28} />
          </Link>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
               <h1 style={{ fontSize: "2.5rem", fontWeight: 950, color: "var(--kravy-text-primary)", letterSpacing: "-2px", lineHeight: 0.9 }}>
                 Daily Insights
               </h1>
               <div style={{ padding: "4px 10px", borderRadius: "8px", background: "rgba(139, 92, 246, 0.1)", color: "#8B5CF6", fontSize: "0.65rem", fontWeight: 900, border: "1px solid rgba(139, 92, 246, 0.2)" }}>BETA</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.9rem", color: "var(--kravy-text-muted)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><Calendar size={16} /> {now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--kravy-border)" }} />
              <div style={{ fontWeight: 700, color: "var(--kravy-brand)", display: "flex", alignItems: "center", gap: "4px" }}><Sparkles size={14} /> LIVE TRACKING ACTIVE</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button style={{ 
            padding: "12px 24px", background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", 
            borderRadius: "16px", display: "flex", alignItems: "center", gap: "10px", fontWeight: 800, 
            color: "var(--kravy-text-primary)", fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
          }}>
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      {/* ── Key Insight Banner ── */}
      <div style={{ 
        background: "rgba(16, 185, 129, 0.05)", border: "1px dashed rgba(16, 185, 129, 0.3)", 
        borderRadius: "24px", padding: "20px 28px", display: "flex", alignItems: "center", gap: "16px"
      }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#10B981", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <TrendingUp size={20} />
        </div>
        <div>
           <span style={{ fontWeight: 800, color: "#065F46", fontSize: "0.95rem" }}>
             {growth >= 0 ? "Performance Peak!" : "Steady Pace."} 
           </span>
           <span style={{ color: "#374151", fontSize: "0.9rem", marginLeft: "6px" }}>
             Your sales are {growth >= 0 ? "up by" : "down by"} {Math.abs(growth).toFixed(1)}% compared to yesterday. {peakHour > 18 ? "Late night traffic is driving your revenue today!" : "Daytime business is consistent."}
           </span>
        </div>
      </div>

      {/* ── Main Analytics Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "32px" }} className="grid-cols-1 md:grid-cols-2">
        {/* Revenue & Goal Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
           {/* Big Revenue Hero */}
           <div style={{ 
              background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)", 
              borderRadius: "40px", padding: "40px", color: "white", position: "relative", overflow: "hidden",
              boxShadow: "0 30px 60px rgba(0,0,0,0.15)"
           }}>
              <div style={{ position: "absolute", top: "-40px", right: "-40px", opacity: 0.1 }}><IndianRupee size={240} /></div>
              <div style={{ position: "relative", zIndex: 1 }}>
                 <div style={{ fontSize: "0.8rem", fontWeight: 800, opacity: 0.6, textTransform: "uppercase", letterSpacing: "3px", marginBottom: "12px" }}>DAILY REVENUE TRAJECTORY</div>
                 <div style={{ fontSize: "5rem", fontWeight: 950, letterSpacing: "-4px", lineHeight: 0.8, marginBottom: "24px" }}>₹{format(todayRevenue)}</div>
                 
                 <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ padding: "8px 16px", borderRadius: "14px", background: growth >= 0 ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)", color: growth >= 0 ? "#4ADE80" : "#F87171", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontWeight: 900 }}>
                       {growth >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                       {Math.abs(growth).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, opacity: 0.6 }}>vs ₹{format(yesterdayRevenue)} yesterday</div>
                 </div>
              </div>
           </div>

           {/* Hourly Pulse Chart (Simple CSS) */}
           <div style={{ background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", borderRadius: "32px", padding: "32px", boxShadow: "var(--kravy-card-shadow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                 <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.1)", color: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}><Clock size={20} /></div>
                    <h3 style={{ fontWeight: 900, fontSize: "1.1rem" }}>Hourly Traffic Pulse</h3>
                 </div>
                 <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--kravy-text-muted)" }}>PEAK AT {peakHour}:00</div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", height: "120px", gap: "4px", width: "100%" }}>
                 {hourly.map((val, h) => (
                   <div key={h} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", height: "100%", justifyContent: "flex-end" }}>
                      <div style={{ 
                        width: "100%", height: `${(val / maxHourlyValue) * 100}%`, 
                        background: val === Math.max(...hourly) ? "var(--kravy-brand)" : "rgba(139, 92, 246, 0.15)",
                        borderRadius: "3px", minHeight: "2px", transition: "all 0.4s"
                      }} />
                      {h % 4 === 0 && <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "var(--kravy-text-faint)" }}>{h}:00</span>}
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Goal & Product Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
           {/* Daily Goal Card */}
           <div style={{ background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", borderRadius: "40px", padding: "32px", boxShadow: "var(--kravy-card-shadow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                 <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.1)", color: "#F59E0B", display: "flex", alignItems: "center", justifyContent: "center" }}><Target size={20} /></div>
                    <h3 style={{ fontWeight: 900, fontSize: "1.1rem" }}>Revenue Target</h3>
                 </div>
                 <div style={{ fontSize: "1.25rem", fontWeight: 950 }}>{Math.round(goalProgress)}%</div>
              </div>
              <div style={{ width: "100%", height: "16px", background: "var(--kravy-bg-2)", borderRadius: "10px", overflow: "hidden", marginBottom: "16px" }}>
                 <div style={{ width: `${goalProgress}%`, height: "100%", background: "linear-gradient(90deg, #F59E0B 0%, #D97706 100%)", borderRadius: "10px", transition: "width 1s ease-out" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700 }}>
                 <span style={{ color: "var(--kravy-text-muted)" }}>Current: ₹{format(todayRevenue)}</span>
                 <span style={{ color: "var(--kravy-text-primary)" }}>Goal: ₹{format(dailyGoal)}</span>
              </div>
           </div>

           {/* Top Items List */}
           <div style={{ background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", borderRadius: "40px", padding: "32px", boxShadow: "var(--kravy-card-shadow)", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                 <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(139, 92, 246, 0.1)", color: "#8B5CF6", display: "flex", alignItems: "center", justifyContent: "center" }}><Zap size={20} /></div>
                    <h3 style={{ fontWeight: 900, fontSize: "1.1rem" }}>Bestsellers</h3>
                 </div>
                 <Link href="/dashboard/menu/view" style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--kravy-brand)", textDecoration: "none" }}>MENU PERFORMANCE</Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {topItems.length > 0 ? topItems.map(([name, qty], idx) => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "var(--kravy-bg-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 950, color: "var(--kravy-text-primary)" }}>{idx + 1}</div>
                    <div style={{ flex: 1 }}>
                       <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--kravy-text-primary)" }}>{name}</div>
                       <div style={{ fontSize: "0.75rem", color: "var(--kravy-text-muted)", marginTop: "2px" }}>{qty} units sold today</div>
                    </div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 950, color: "var(--kravy-brand)" }}>{qty}</div>
                  </div>
                )) : <div style={{ textAlign: "center", padding: "40px", color: "var(--kravy-text-faint)" }}>No sales data available.</div>}
              </div>
           </div>
        </div>
      </div>

      {/* ── Transaction Table Section ── */}
      <div style={{ background: "rgba(255, 107, 53, 0.012)", border: "1px solid var(--kravy-border)", borderRadius: "40px", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "32px 40px", borderBottom: "1px solid var(--kravy-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
             <h2 style={{ fontSize: "1.5rem", fontWeight: 950, color: "var(--kravy-text-primary)", letterSpacing: "-1px" }}>Transaction Ledger</h2>
             <p style={{ fontSize: "0.8rem", color: "var(--kravy-text-muted)", marginTop: "4px" }}>Detailed breakdown of all invoices generated today</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255, 107, 53, 0.05)", padding: "10px 20px", borderRadius: "16px", border: "1px solid rgba(255, 107, 53, 0.1)" }}>
             <Info size={16} style={{ color: "#FF6B35" }} />
             <span style={{ fontSize: "0.80rem", fontWeight: 900, color: "#FF6B35" }}>{todayBills.length} RECORDS SYNCED</span>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: "rgba(255, 107, 53, 0.04)" }}>
                <th style={{ padding: "20px 40px", textAlign: "left", fontSize: "0.75rem", fontWeight: 950, color: "rgba(255, 107, 53, 0.6)", textTransform: "uppercase", letterSpacing: "1.5px" }}>Identification</th>
                <th style={{ padding: "20px 40px", textAlign: "left", fontSize: "0.75rem", fontWeight: 950, color: "rgba(255, 107, 53, 0.6)", textTransform: "uppercase", letterSpacing: "1.5px" }}>Guest Details</th>
                <th style={{ padding: "20px 40px", textAlign: "center", fontSize: "0.75rem", fontWeight: 950, color: "rgba(255, 107, 53, 0.6)", textTransform: "uppercase", letterSpacing: "1.5px" }}>Settlement</th>
                <th style={{ padding: "20px 40px", textAlign: "right", fontSize: "0.75rem", fontWeight: 950, color: "rgba(255, 107, 53, 0.6)", textTransform: "uppercase", letterSpacing: "1.5px" }}>Net Collection</th>
              </tr>
            </thead>
            <tbody>
              {todayBills.map((b) => {
                let items: any = b.items;
                if (typeof items === "string") try { items = JSON.parse(items); } catch { items = []; }
                if (items && !Array.isArray(items) && items.items) items = items.items;
                const count = Array.isArray(items) ? items.reduce((s: number, it: any) => s + Number(it.quantity || it.qty || 0), 0) : 0;
                const isPaid = (b.paymentStatus || "Paid") === "Paid";

                return (
                  <tr key={b.id} className="table-row" style={{ 
                    borderTop: "1px solid var(--kravy-border)", 
                    transition: "background 0.2s",
                    background: todayBills.indexOf(b) % 2 === 0 ? "transparent" : "rgba(255, 107, 53, 0.005)"
                  }}>
                    <td style={{ padding: "24px 40px" }}>
                       <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(255, 107, 53, 0.08)", border: "1px solid rgba(255, 107, 53, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FF6B35" }}>
                             <FileText size={20} />
                          </div>
                          <div>
                             <div style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 950, color: "var(--kravy-text-primary)" }}>#{b.billNumber}</div>
                             <div style={{ fontSize: "0.75rem", color: "var(--kravy-text-faint)", marginTop: "2px" }}>Synced at {new Date(b.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                       </div>
                    </td>
                    <td style={{ padding: "24px 40px" }}>
                       <div style={{ fontWeight: 800, color: "var(--kravy-text-primary)", fontSize: "1rem" }}>{b.customerName || "Casual Guest"}</div>
                       <div style={{ fontSize: "0.75rem", color: "var(--kravy-brand)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>{count} ITEMS ORDERED</div>
                    </td>
                    <td style={{ padding: "24px 40px", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                         <span style={{ 
                            padding: "6px 14px", borderRadius: "10px", 
                            background: b.paymentMode === "UPI" ? "#8B5CF615" : b.paymentMode === "Cash" ? "#10B98115" : "#F59E0B15",
                            color: b.paymentMode === "UPI" ? "#8B5CF6" : b.paymentMode === "Cash" ? "#10B981" : "#F59E0B",
                            fontSize: "0.7rem", fontWeight: 950, border: "1px solid currentColor"
                         }}>
                           {b.paymentMode.toUpperCase()}
                         </span>
                         <span style={{ fontSize: "0.65rem", fontWeight: 800, color: isPaid ? "#10B981" : "#EF4444" }}>
                            {isPaid ? "● SETTLED" : "○ PENDING"}
                         </span>
                      </div>
                    </td>
                    <td style={{ padding: "24px 40px", textAlign: "right" }}>
                       <div style={{ fontSize: "1.25rem", fontWeight: 950, color: "var(--kravy-text-primary)", letterSpacing: "-1px" }}>₹{format(b.total)}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
