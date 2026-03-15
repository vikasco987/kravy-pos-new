import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import { ChevronLeft, BarChart2, TrendingUp, Calendar, Package, IndianRupee, PieChart, Users, ArrowUpRight, Target, Share2, Sparkles, TrendingDown, Download } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function MonthlySalesReportPage() {
  const effectiveId = await getEffectiveClerkId();
  if (!effectiveId) redirect("/sign-in");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();

  const bills = await prisma.billManager.findMany({
    where: { clerkUserId: effectiveId, isDeleted: false, createdAt: { gte: startOfMonth } },
    orderBy: { createdAt: "desc" }
  });

  const totalRevenue = bills.reduce((s, b) => s + b.total, 0);
  const totalBills = bills.length;
  
  // Group by day for insights
  const dayMap: Record<number, number> = {};
  const customerSet = new Set();
  const paymentMethodMap: Record<string, number> = {};

  bills.forEach(b => {
    const d = new Date(b.createdAt).getDate();
    dayMap[d] = (dayMap[d] || 0) + b.total;
    if (b.customerPhone) customerSet.add(b.customerPhone);
    const mode = (b.paymentMode || "Cash").toUpperCase();
    paymentMethodMap[mode] = (paymentMethodMap[mode] || 0) + b.total;
  });

  const avgOrderValue = totalBills > 0 ? totalRevenue / totalBills : 0;
  const uniqueCustomers = customerSet.size;
  const currentDailyAvg = totalRevenue / currentDay;
  const projectedRevenue = currentDailyAvg * daysInMonth;

  const format = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", padding: "16px", background: "var(--kravy-bg)", minHeight: "100vh" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link href="/dashboard" style={{
            width: "52px", height: "52px", borderRadius: "18px", background: "var(--kravy-surface)",
            border: "1px solid var(--kravy-border)", display: "flex", alignItems: "center", justifyContent: "center", 
            color: "var(--kravy-text-primary)", boxShadow: "0 8px 16px rgba(0,0,0,0.06)"
          }}>
            <ChevronLeft size={28} />
          </Link>
          <div>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 950, color: "var(--kravy-text-primary)", letterSpacing: "-2px", lineHeight: 1, marginBottom: "8px" }}>Monthly Analytics</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem", color: "var(--kravy-text-muted)" }}>
              <Calendar size={16} /> 
              <span>Performance for {now.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--kravy-border)" }} />
              <span style={{ fontWeight: 800, color: "#10B981" }}>MONTHLY CYCLE ACTIVE</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
           <button style={{ 
             padding: "12px 24px", background: "var(--kravy-brand)", border: "none", 
             borderRadius: "16px", color: "white", fontWeight: 800, fontSize: "0.85rem", 
             display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", boxShadow: "0 10px 20px rgba(139, 92, 246, 0.2)" 
           }}>
             <Share2 size={18} /> Share Dashboard
           </button>
        </div>
      </div>

      {/* ── Projected Performance Banner ── */}
      <div style={{ 
        background: "linear-gradient(90deg, rgba(14, 165, 233, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)", 
        border: "1px solid rgba(14, 165, 233, 0.2)", borderRadius: "24px", padding: "24px 32px",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px"
      }}>
         <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#0EA5E9", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
               <Sparkles size={24} />
            </div>
            <div>
               <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0369A1", textTransform: "uppercase", letterSpacing: "1px" }}>End of Month Forecast</div>
               <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--kravy-text-primary)" }}>
                  Projected Revenue: <span style={{ color: "#0284C7" }}>₹{format(projectedRevenue)}</span>
               </div>
            </div>
         </div>
         <div style={{ background: "white", padding: "10px 20px", borderRadius: "14px", border: "1px solid rgba(14, 165, 233, 0.1)", fontSize: "0.85rem", fontWeight: 700 }}>
            {((totalRevenue / projectedRevenue) * 100).toFixed(0)}% of Projected Revenue Reached
         </div>
      </div>

      {/* ── Main Hero Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "32px" }} className="grid-cols-1 md:grid-cols-2">
         {/* Main Revenue Card */}
         <div style={{ 
           background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", 
           borderRadius: "40px", padding: "48px", color: "white", boxShadow: "0 30px 60px rgba(0,0,0,0.1)",
           position: "relative", overflow: "hidden"
         }}>
            <div style={{ position: "absolute", top: "-20px", right: "-20px", opacity: 0.1 }}><IndianRupee size={220} /></div>
            <div style={{ position: "relative", zIndex: 1 }}>
               <div style={{ fontSize: "0.85rem", fontWeight: 800, opacity: 0.6, textTransform: "uppercase", letterSpacing: "3px", marginBottom: "16px" }}>NET ACCUMULATED REVENUE</div>
               <div style={{ fontSize: "5rem", fontWeight: 950, margin: "16px 0", letterSpacing: "-4px", lineHeight: 0.85 }}>₹{format(totalRevenue)}</div>
               
               <div style={{ display: "flex", gap: "40px", marginTop: "48px" }}>
                  <div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 950 }}>{totalBills}</div>
                    <div style={{ fontSize: "0.7rem", fontWeight: 800, opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px" }}>Total Invoices</div>
                  </div>
                  <div style={{ width: "1px", height: "50px", background: "rgba(255,255,255,0.2)" }} />
                  <div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 950 }}>₹{format(avgOrderValue)}</div>
                    <div style={{ fontSize: "0.7rem", fontWeight: 800, opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px" }}>Avg Order Value</div>
                  </div>
               </div>
            </div>
         </div>

         {/* Sub Stats Stack */}
         <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
            <div style={{ background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", borderRadius: "32px", padding: "32px", display: "flex", alignItems: "center", gap: "24px", boxShadow: "var(--kravy-card-shadow)" }}>
               <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "rgba(16, 185, 129, 0.1)", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}><Users size={32} /></div>
               <div>
                  <div style={{ fontSize: "2rem", fontWeight: 950, color: "var(--kravy-text-primary)", letterSpacing: "-1px" }}>{uniqueCustomers}</div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--kravy-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Returning Visitors</div>
               </div>
            </div>
            
            {/* Week-wise Breakdown */}
            <div style={{ background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", borderRadius: "32px", padding: "32px", boxShadow: "var(--kravy-card-shadow)" }}>
               <h4 style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--kravy-text-muted)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "24px" }}>Week-Wise Performance</h4>
               <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {[1, 2, 3, 4, 5].map(weekNum => {
                     const weekBills = bills.filter(b => {
                        const d = new Date(b.createdAt).getDate();
                        return d > (weekNum-1)*7 && d <= weekNum*7;
                     });
                     const weekRev = weekBills.reduce((s, b) => s + b.total, 0);
                     if (weekRev === 0 && weekNum * 7 > currentDay + 7) return null;
                     
                     return (
                        <div key={weekNum}>
                           <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                              <span style={{ fontSize: "0.9rem", fontWeight: 800 }}>Week {weekNum}</span>
                              <span style={{ fontSize: "0.95rem", fontWeight: 950 }}>₹{format(weekRev)}</span>
                           </div>
                           <div style={{ width: "100%", height: "6px", background: "var(--kravy-bg-2)", borderRadius: "10px" }}>
                              <div style={{ 
                                 width: `${Math.min((weekRev / (totalRevenue / (currentDay/7) || 1)) * 100, 100)}%`, 
                                 height: "100%", 
                                 background: "var(--kravy-brand)", 
                                 borderRadius: "10px" 
                              }} />
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

            <div style={{ background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", borderRadius: "32px", padding: "32px", boxShadow: "var(--kravy-card-shadow)" }}>
               <h4 style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--kravy-text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>Revenue Split by Method</h4>
               <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {Object.entries(paymentMethodMap).map(([mode, amt]) => (
                     <div key={mode}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 800, marginBottom: "6px" }}>
                           <span>{mode}</span>
                           <span style={{ color: "var(--kravy-text-primary)" }}>₹{format(amt)}</span>
                        </div>
                        <div style={{ width: "100%", height: "6px", background: "var(--kravy-bg-2)", borderRadius: "10px" }}>
                           <div style={{ width: `${(amt / totalRevenue) * 100}%`, height: "100%", background: mode === "CASH" ? "#10B981" : "#8B5CF6", borderRadius: "10px" }} />
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* ── Daily Revenue Pulse ── */}
      <div style={{ background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", borderRadius: "40px", padding: "40px", boxShadow: "var(--kravy-card-shadow)" }}>
         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
            <h3 style={{ fontWeight: 950, fontSize: "1.5rem", letterSpacing: "-1px", display: "flex", alignItems: "center", gap: "16px" }}>
               <BarChart2 size={28} style={{ color: "var(--kravy-brand)" }} /> Daily Revenue Pulse
            </h3>
            <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--kravy-text-muted)" }}>{now.toLocaleString('default', { month: 'long' })} DISTRIBUTION</div>
         </div>
         <div style={{ display: "flex", alignItems: "flex-end", height: "240px", gap: "6px", width: "100%", paddingBottom: "30px" }}>
            {Array.from({ length: currentDay }, (_, i) => i + 1).map(day => {
               const value = dayMap[day] || 0;
               const max = Math.max(...Object.values(dayMap), 1);
               const height = (value / max) * 100;
               const isPeak = value === max && value > 0;
               
               return (
                  <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", height: "100%", justifyContent: "flex-end" }}>
                     <div style={{ 
                        width: "100%", height: `${height}%`, minHeight: "2px",
                        background: isPeak ? "var(--kravy-brand)" : "rgba(139, 92, 246, 0.15)", 
                        borderRadius: "4px", position: "relative", transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
                     }}>
                        {isPeak && <div style={{ position: "absolute", top: "-28px", left: "50%", transform: "translateX(-50%)", background: "var(--kravy-text-primary)", color: "white", padding: "4px 8px", borderRadius: "6px", fontSize: "0.6rem", fontWeight: 900, whiteSpace: "nowrap" }}>PEAK</div>}
                     </div>
                     <span style={{ fontSize: "0.65rem", fontWeight: 900, color: "var(--kravy-text-faint)" }}>{day}</span>
                  </div>
               )
            })}
         </div>
      </div>

      {/* ── Performance Table ── */}
      <div style={{ background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", borderRadius: "40px", overflow: "hidden", boxShadow: "var(--kravy-card-shadow)" }}>
         <div style={{ padding: "32px 40px", borderBottom: "1px solid var(--kravy-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontWeight: 950, fontSize: "1.25rem", color: "var(--kravy-text-primary)", letterSpacing: "-0.5px" }}>Elite Transactions</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", fontWeight: 800, color: "var(--kravy-brand)" }}>
               HIGHEST VALUE FIRST <ArrowUpRight size={16} />
            </div>
         </div>
         <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderSpacing: 0 }}>
               <thead>
                  <tr style={{ background: "rgba(0,0,0,0.01)" }}>
                     <th style={{ padding: "20px 20px 20px 40px", textAlign: "left", fontSize: "0.75rem", fontWeight: 900, color: "var(--kravy-text-muted)", textTransform: "uppercase", width: "60px" }}>Sr.</th>
                     <th style={{ padding: "20px 40px", textAlign: "left", fontSize: "0.75rem", fontWeight: 900, color: "var(--kravy-text-muted)", textTransform: "uppercase" }}>Bill Tracking</th>
                     <th style={{ padding: "20px 40px", textAlign: "left", fontSize: "0.75rem", fontWeight: 900, color: "var(--kravy-text-muted)", textTransform: "uppercase" }}>Guest Identification</th>
                     <th style={{ padding: "20px 40px", textAlign: "right", fontSize: "0.75rem", fontWeight: 900, color: "var(--kravy-text-muted)", textTransform: "uppercase" }}>Cycle Date</th>
                     <th style={{ padding: "20px 40px", textAlign: "right", fontSize: "0.75rem", fontWeight: 900, color: "var(--kravy-text-muted)", textTransform: "uppercase" }}>Net Value</th>
                  </tr>
               </thead>
               <tbody>
                  {bills.sort((a,b) => b.total - a.total).slice(0, 10).map((b, idx) => (
                     <tr key={b.id} style={{ borderTop: "1px solid var(--kravy-border)", transition: "background 0.2s" }}>
                        <td style={{ padding: "24px 20px 24px 40px", fontSize: "0.85rem", fontWeight: 900, color: "var(--kravy-text-faint)" }}>{String(idx + 1).padStart(2, '0')}</td>
                        <td style={{ padding: "24px 40px" }}>
                           <div style={{ fontWeight: 950, fontFamily: "monospace", color: "var(--kravy-text-primary)", fontSize: "1.1rem" }}>#{b.billNumber}</div>
                           <div style={{ fontSize: "0.7rem", color: "var(--kravy-text-faint)", marginTop: "2px" }}>Cycle Asset ID: {b.id.slice(-6).toUpperCase()}</div>
                        </td>
                        <td style={{ padding: "24px 40px" }}>
                           <div style={{ fontWeight: 800, color: "var(--kravy-text-primary)", fontSize: "1rem" }}>{b.customerName || "V.I.P. Guest"}</div>
                           <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                              <span style={{ fontSize: "0.6rem", fontWeight: 900, padding: "3px 8px", background: "var(--kravy-bg-2)", borderRadius: "99px" }}>{b.paymentMode.toUpperCase()}</span>
                           </div>
                        </td>
                        <td style={{ padding: "24px 40px", textAlign: "right" }}>
                           <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>{new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                           <div style={{ fontSize: "0.75rem", color: "var(--kravy-text-faint)" }}>{new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td style={{ padding: "24px 40px", textAlign: "right" }}>
                           <div style={{ fontSize: "1.5rem", fontWeight: 950, color: "var(--kravy-text-primary)", letterSpacing: "-1.5px" }}>₹{format(b.total)}</div>
                           <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#10B981" }}>PROFESSIONAL CLEARANCE</div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
