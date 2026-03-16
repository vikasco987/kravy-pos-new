import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import { ChevronLeft, BarChart3, TrendingUp, Wallet, IndianRupee, Zap, Calendar, ArrowUpRight, ArrowDownRight, Clock, User, Download, Share2, Sparkles, Target, FileText } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function WeeklySalesReportPage() {
  const effectiveId = await getEffectiveClerkId();
  if (!effectiveId) redirect("/sign-in");

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const bills = await prisma.billManager.findMany({
    where: { clerkUserId: effectiveId, isDeleted: false, createdAt: { gte: startOfWeek } },
    orderBy: { createdAt: "desc" }
  });

  const totalRevenue = bills.reduce((s, b) => s + b.total, 0);
  const totalBills = bills.length;
  
  // Calculate Avg Daily
  const dayIndex = now.getDay(); // 0 is Sunday
  const daysPassed = dayIndex + 1;
  const avgDaily = totalRevenue / daysPassed;

  // Day breakdown
  const dayStats: Record<string, number> = {};
  bills.forEach(b => {
    const day = new Date(b.createdAt).toLocaleDateString('en-IN', { weekday: 'long' });
    dayStats[day] = (dayStats[day] || 0) + b.total;
  });

  const maxDailyRev = Math.max(...Object.values(dayStats), 1);
  const weeklyGoal = 50000;
  const goalProgress = Math.min((totalRevenue / weeklyGoal) * 100, 100);

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
            <h1 style={{ fontSize: "2.5rem", fontWeight: 950, color: "var(--kravy-text-primary)", letterSpacing: "-2.2px", lineHeight: 1, marginBottom: "8px" }}>Weekly Pulse</h1>
            <div style={{ fontSize: "0.95rem", color: "var(--kravy-text-muted)", display: "flex", alignItems: "center", gap: "10px" }}>
              <Calendar size={16} />
              <span>Current Week Cycle: {startOfWeek.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – Present</span>
              <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--kravy-border)" }} />
              <span style={{ fontWeight: 800, color: "var(--kravy-brand)" }}>7-DAY WINDOW</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
           <button style={{ padding: "12px 24px", background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", borderRadius: "16px", fontWeight: 800, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "10px" }}><Download size={18} /> Export Results</button>
        </div>
      </div>

      {/* ── Weekly Momentum Banner ── */}
      <div style={{ 
        background: "rgba(139, 92, 246, 0.05)", border: "1px solid rgba(139, 92, 246,0.2)", 
        borderRadius: "24px", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px"
      }}>
         <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#8B5CF6", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={24} /></div>
            <div>
               <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "1px" }}>Momentum Insight</div>
               <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--kravy-text-primary)" }}>
                  You are averaging <span style={{ color: "#8B5CF6" }}>₹{format(avgDaily)}</span> per day. Speed is consistent!
               </div>
            </div>
         </div>
         <div style={{ display: "flex", gap: "16px" }}>
             <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--kravy-text-muted)", textTransform: "uppercase" }}>Best Day</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 950, color: "var(--kravy-text-primary)" }}>{Object.entries(dayStats).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A'}</div>
             </div>
         </div>
      </div>

      {/* ── Main Analytics Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "32px" }} className="grid-cols-1 md:grid-cols-2">
         {/* Total Revenue & Goal */}
         <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div style={{ 
               background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)", 
               borderRadius: "44px", padding: "48px", color: "white", boxShadow: "0 30px 60px rgba(49, 46, 129, 0.2)",
               position: "relative", overflow: "hidden"
            }}>
               <div style={{ position: "absolute", top: "-40px", right: "-40px", opacity: 0.1 }}><IndianRupee size={240} /></div>
               <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, opacity: 0.6, textTransform: "uppercase", letterSpacing: "3px", marginBottom: "16px" }}>CUMULATIVE WEEKLY REVENUE</div>
                  <div style={{ fontSize: "5rem", fontWeight: 950, letterSpacing: "-4px", lineHeight: 0.82, marginBottom: "32px" }}>₹{format(totalRevenue)}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.1)", padding: "12px 24px", borderRadius: "18px", width: "max-content" }}>
                     <Zap size={20} style={{ color: "#F59E0B" }} />
                     <span style={{ fontSize: "0.95rem", fontWeight: 800 }}>{totalBills} Transactions Audited</span>
                  </div>
               </div>
            </div>

            {/* Weekly Goal Card */}
            <div style={{ background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", borderRadius: "40px", padding: "40px", boxShadow: "var(--kravy-card-shadow)" }}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                     <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(16, 185, 129, 0.1)", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}><Target size={24} /></div>
                     <h3 style={{ fontWeight: 950, fontSize: "1.25rem", letterSpacing: "-0.5px" }}>Weekly Goal Progress</h3>
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 950 }}>{Math.round(goalProgress)}%</div>
               </div>
               <div style={{ width: "100%", height: "20px", background: "var(--kravy-bg-2)", borderRadius: "12px", overflow: "hidden", marginBottom: "20px" }}>
                  <div style={{ width: `${goalProgress}%`, height: "100%", background: "linear-gradient(90deg, #10B981 0%, #059669 100%)", borderRadius: "12px", transition: "width 1s ease" }} />
               </div>
               <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", fontWeight: 800 }}>
                  <span style={{ color: "var(--kravy-text-muted)" }}>Current Revenue: ₹{format(totalRevenue)}</span>
                  <span style={{ color: "var(--kravy-text-primary)" }}>Target: ₹{format(weeklyGoal)}</span>
               </div>
            </div>
         </div>

         {/* Right Sidebar Stats */}
         <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {/* Day breakdown listing */}
            <div style={{ background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", borderRadius: "40px", padding: "40px", boxShadow: "var(--kravy-card-shadow)", flex: 1 }}>
               <h3 style={{ fontWeight: 950, fontSize: "1.25rem", marginBottom: "32px", letterSpacing: "-0.5px" }}>Daily Breakdown</h3>
               <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
                     const rev = dayStats[day] || 0;
                     const height = (rev / maxDailyRev) * 100;
                     return (
                        <div key={day} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--kravy-text-secondary)" }}>{day}</span>
                              <span style={{ fontSize: "1rem", fontWeight: 950, color: "var(--kravy-text-primary)" }}>₹{format(rev)}</span>
                           </div>
                           <div style={{ width: "100%", height: "6px", background: "var(--kravy-bg-2)", borderRadius: "10px", overflow: "hidden" }}>
                              <div style={{ width: `${height}%`, height: "100%", background: rev === maxDailyRev ? "#8B5CF6" : "var(--kravy-brand)", borderRadius: "10px", transition: "width 0.5s" }} />
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

            {/* Run Rate Stat */}
            <div style={{ background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", borderRadius: "40px", padding: "32px", display: "flex", alignItems: "center", gap: "24px", boxShadow: "var(--kravy-card-shadow)" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "rgba(245, 158, 11, 0.1)", color: "#F59E0B", display: "flex", alignItems: "center", justifyContent: "center" }}><BarChart3 size={32} /></div>
                <div>
                   <div style={{ fontSize: "2rem", fontWeight: 950, color: "var(--kravy-text-primary)", letterSpacing: "-1px" }}>₹{format(avgDaily)}</div>
                   <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--kravy-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Current Run Rate</div>
                </div>
            </div>
         </div>
      </div>

      {/* ── Transaction Feed ── */}
      <div style={{ background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", borderRadius: "44px", overflow: "hidden", boxShadow: "var(--kravy-card-shadow)" }}>
         <div style={{ padding: "40px 52px", borderBottom: "1px solid var(--kravy-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontWeight: 950, fontSize: "1.5rem", color: "var(--kravy-text-primary)", letterSpacing: "-1.2px" }}>Weekly Activity Feed</h3>
            <div style={{ padding: "10px 24px", borderRadius: "14px", background: "var(--kravy-bg-2)", border: "1px solid var(--kravy-border)", fontSize: "0.85rem", fontWeight: 800 }}>
               {totalBills} EVENTS TRACKED
            </div>
         </div>
         <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderSpacing: 0 }}>
               <thead>
                  <tr style={{ background: "rgba(0,0,0,0.01)" }}>
                     <th style={{ padding: "24px 24px 24px 52px", textAlign: "left", fontSize: "0.8rem", fontWeight: 900, color: "var(--kravy-text-muted)", textTransform: "uppercase", letterSpacing: "1.5px", width: "80px" }}>Sr.</th>
                     <th style={{ padding: "24px 52px", textAlign: "left", fontSize: "0.8rem", fontWeight: 900, color: "var(--kravy-text-muted)", textTransform: "uppercase", letterSpacing: "1.5px" }}>Identification</th>
                     <th style={{ padding: "24px 52px", textAlign: "left", fontSize: "0.8rem", fontWeight: 900, color: "var(--kravy-text-muted)", textTransform: "uppercase", letterSpacing: "1.5px" }}>Account Verification</th>
                     <th style={{ padding: "24px 52px", textAlign: "right", fontSize: "0.8rem", fontWeight: 900, color: "var(--kravy-text-muted)", textTransform: "uppercase", letterSpacing: "1.5px" }}>Creation Info</th>
                     <th style={{ padding: "24px 52px", textAlign: "right", fontSize: "0.8rem", fontWeight: 900, color: "var(--kravy-text-muted)", textTransform: "uppercase", letterSpacing: "1.5px" }}>Cycle Revenue</th>
                  </tr>
               </thead>
               <tbody>
                  {bills.slice(0, 15).map((b, idx) => (
                     <tr key={b.id} style={{ borderTop: "1px solid var(--kravy-border)", transition: "background 0.2s" }}>
                        <td style={{ padding: "28px 24px 28px 52px", fontSize: "0.9rem", fontWeight: 900, color: "var(--kravy-text-faint)" }}>{String(idx + 1).padStart(2, '0')}</td>
                        <td style={{ padding: "28px 52px" }}>
                           <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "var(--kravy-bg-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--kravy-brand)" }}><FileText size={22} /></div>
                              <div>
                                 <div style={{ fontWeight: 950, fontFamily: "monospace", color: "var(--kravy-text-primary)", fontSize: "1.1rem" }}>#{b.billNumber}</div>
                                 <div style={{ fontSize: "0.75rem", color: "var(--kravy-text-faint)", marginTop: "2px" }}>W-TXID: {b.id.slice(-6).toUpperCase()}</div>
                              </div>
                           </div>
                        </td>
                        <td style={{ padding: "28px 52px" }}>
                           <div style={{ fontWeight: 800, color: "var(--kravy-text-primary)", fontSize: "1rem" }}>{b.customerName || "CASUAL GUEST"}</div>
                           <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                              <span style={{ fontSize: "0.65rem", fontWeight: 950, padding: "3px 10px", borderRadius: "6px", background: b.paymentMode === "UPI" ? "#8B5CF615" : "#10B98115", color: b.paymentMode === "UPI" ? "#8B5CF6" : "#10B981", border: "1px solid currentColor" }}>{b.paymentMode.toUpperCase()}</span>
                           </div>
                        </td>
                        <td style={{ padding: "28px 52px", textAlign: "right" }}>
                           <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>{new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                           <div style={{ fontSize: "0.75rem", color: "var(--kravy-text-faint)", marginTop: "4px" }}><Clock size={12} style={{ display: "inline", marginRight: "4px" }} />{new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td style={{ padding: "28px 52px", textAlign: "right" }}>
                           <div style={{ fontSize: "1.65rem", fontWeight: 950, color: "var(--kravy-text-primary)", letterSpacing: "-1.8px" }}>₹{format(b.total)}</div>
                           <div style={{ fontSize: "0.7rem", fontWeight: 900, color: "#10B981" }}>CYCLE CLEARED</div>
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
