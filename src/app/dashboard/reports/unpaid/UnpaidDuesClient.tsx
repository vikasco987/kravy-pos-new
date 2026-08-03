"use client";

import { useState } from "react";
import { ChevronLeft, AlertCircle, Search, Check, Clock, User, Phone, Calendar, ArrowRight, UserCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { kravy } from "@/lib/sounds";

interface Bill {
  id: string;
  billNumber: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: string;
  createdAt: string;
  tableName: string;
}

interface CustomerDue {
  customerName: string;
  customerPhone: string;
  totalUnpaid: number;
  billsCount: number;
  lastBillDate: Date;
  bills: Bill[];
}

interface TrendItem {
  date?: string;
  week?: string;
  amount: number;
  count: number;
}

interface Props {
  initialDuesList: CustomerDue[];
  businessName: string;
  dailyTrend: TrendItem[];
  weeklyTrend: TrendItem[];
  initStartDate: string;
  initEndDate: string;
}

export default function UnpaidDuesClient({ 
  initialDuesList, 
  businessName,
  dailyTrend,
  weeklyTrend,
  initStartDate,
  initEndDate,
}: Props) {
  const router = useRouter();
  const [duesList, setDuesList] = useState<CustomerDue[]>(initialDuesList);
  const [searchQuery, setSearchQuery] = useState("");
  const [settlingBillId, setSettlingBillId] = useState<string | null>(null);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  // Date states
  const [startDate, setStartDate] = useState(initStartDate);
  const [endDate, setEndDate] = useState(initEndDate);

  const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n));

  // Compute metrics dynamically
  const totalOutstanding = duesList.reduce((sum, c) => sum + c.totalUnpaid, 0);
  const totalDebtors = duesList.length;
  const totalPendingBills = duesList.reduce((sum, c) => sum + c.billsCount, 0);

  const filteredDues = duesList.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.customerName.toLowerCase().includes(q) ||
      c.customerPhone.toLowerCase().includes(q)
    );
  });

  const applyDateRange = () => {
    kravy.click();
    const q = new URLSearchParams();
    if (startDate) q.set("startDate", startDate);
    if (endDate) q.set("endDate", endDate);
    router.push(`/dashboard/reports/unpaid?${q.toString()}`);
  };

  const clearDateRange = () => {
    kravy.click();
    setStartDate("");
    setEndDate("");
    router.push("/dashboard/reports/unpaid");
  };

  const handleSettleBill = async (billId: string, customerKey: string) => {
    kravy.click();
    setSettlingBillId(billId);
    try {
      const res = await fetch(`/api/bill-manager/${billId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "Paid" }),
      });
      if (res.ok) {
        kravy.success?.();
        // Update local state
        setDuesList((prev) => {
          return prev
            .map((c) => {
              const matches = (c.customerPhone && c.customerPhone === customerKey) ||
                (!c.customerPhone && `name:${c.customerName}` === customerKey) ||
                (!c.customerPhone && `bill:${c.bills[0]?.id}` === customerKey);
              if (matches) {
                const remainingBills = c.bills.filter((b) => b.id !== billId);
                const unpaidSum = remainingBills.reduce((s, b) => s + b.balanceDue, 0);
                return {
                  ...c,
                  bills: remainingBills,
                  totalUnpaid: unpaidSum,
                  billsCount: remainingBills.length,
                };
              }
              return c;
            })
            .filter((c) => c.billsCount > 0);
        });
        router.refresh();
      } else {
        alert("Failed to settle bill.");
      }
    } catch (e) {
      console.error(e);
      alert("Error settling bill.");
    } finally {
      setSettlingBillId(null);
    }
  };

  const handleSettleAllForCustomer = async (customer: CustomerDue, customerKey: string) => {
    if (!confirm(`Mark all ${customer.billsCount} pending bills as Paid for ${customer.customerName}?`)) return;
    
    kravy.click();
    for (const b of customer.bills) {
      setSettlingBillId(b.id);
      try {
        await fetch(`/api/bill-manager/${b.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentStatus: "Paid" }),
        });
      } catch (e) {
        console.error("Failed to settle bill", b.id, e);
      }
    }
    
    kravy.success?.();
    setDuesList((prev) => prev.filter((c) => {
      const matches = (c.customerPhone && c.customerPhone === customerKey) ||
        (!c.customerPhone && `name:${c.customerName}` === customerKey) ||
        (!c.customerPhone && `bill:${c.bills[0]?.id}` === customerKey);
      return !matches;
    }));
    setSettlingBillId(null);
    router.refresh();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", padding: "16px", background: "var(--kravy-bg)", minHeight: "100vh" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link href="/dashboard" style={{
            width: "52px", height: "52px", borderRadius: "18px", background: "var(--kravy-surface)",
            border: "1px solid var(--kravy-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--kravy-text-primary)",
            boxShadow: "0 8px 16px rgba(0,0,0,0.06)"
          }}>
            <ChevronLeft size={28} />
          </Link>
          <div>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 950, color: "var(--kravy-text-primary)", letterSpacing: "-2.2px", lineHeight: 1, marginBottom: "8px" }}>Outstanding Udhaar</h1>
            <p style={{ fontSize: "0.9rem", color: "var(--kravy-text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={16} style={{ color: "#EF4444" }} /> Customer dues ledger for {businessName}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ padding: "10px 20px", background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", borderRadius: "16px", fontSize: "0.85rem", fontWeight: 800 }}>
            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ── Metrics Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
        <div style={{ background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", borderRadius: "24px", padding: "28px" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--kravy-text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Total Outstanding dues</div>
          <div style={{ fontSize: "2.25rem", fontWeight: 950, color: "#EF4444", lineHeight: 1 }}>₹{fmt(totalOutstanding)}</div>
        </div>
        <div style={{ background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", borderRadius: "24px", padding: "28px" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--kravy-text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Debtors Count</div>
          <div style={{ fontSize: "2.25rem", fontWeight: 950, color: "var(--kravy-text-primary)", lineHeight: 1 }}>{totalDebtors}</div>
        </div>
        <div style={{ background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", borderRadius: "24px", padding: "28px" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--kravy-text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Unpaid Bills</div>
          <div style={{ fontSize: "2.25rem", fontWeight: 950, color: "var(--kravy-text-primary)", lineHeight: 1 }}>{totalPendingBills}</div>
        </div>
      </div>

      {/* ── Dues Trend Funnel Dashboard ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        {/* Daily Trend */}
        <div style={{ background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", borderRadius: "28px", padding: "28px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--kravy-text-primary)", marginBottom: "4px" }}>Day-on-Day Dues Created</h3>
          <p style={{ fontSize: "0.75rem", color: "var(--kravy-text-muted)", marginBottom: "20px" }}>New outstanding balances generated daily</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "250px", overflowY: "auto" }} className="no-scrollbar">
            {dailyTrend.length === 0 ? (
              <div style={{ fontSize: "0.75rem", color: "var(--kravy-text-muted)", fontStyle: "italic", textAlign: "center", padding: "20px" }}>No dues trend data in this period.</div>
            ) : (
              dailyTrend.map((d, i) => {
                const maxVal = Math.max(...dailyTrend.map(x => x.amount), 1);
                const pct = (d.amount / maxVal) * 100;
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
                      <span style={{ fontWeight: 800, color: "var(--kravy-text-secondary)" }}>
                        {new Date(d.date!).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      <span style={{ fontWeight: 900, color: "#EF4444" }}>₹{fmt(d.amount)} <span style={{ color: "var(--kravy-text-muted)", fontWeight: 500 }}>({d.count} bill{d.count > 1 ? "s" : ""})</span></span>
                    </div>
                    <div style={{ height: "8px", background: "var(--kravy-bg-2)", borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #EF4444 0%, #DC2626 100%)", borderRadius: "999px" }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Weekly Trend */}
        <div style={{ background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", borderRadius: "28px", padding: "28px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--kravy-text-primary)", marginBottom: "4px" }}>Week-on-Week Dues Funnel</h3>
          <p style={{ fontSize: "0.75rem", color: "var(--kravy-text-muted)", marginBottom: "20px" }}>Cumulative dues aggregated week-by-week</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "250px", overflowY: "auto" }} className="no-scrollbar">
            {weeklyTrend.length === 0 ? (
              <div style={{ fontSize: "0.75rem", color: "var(--kravy-text-muted)", fontStyle: "italic", textAlign: "center", padding: "20px" }}>No weekly trend data.</div>
            ) : (
              weeklyTrend.map((w, i) => {
                const maxVal = Math.max(...weeklyTrend.map(x => x.amount), 1);
                const pct = (w.amount / maxVal) * 100;
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
                      <span style={{ fontWeight: 800, color: "var(--kravy-text-secondary)" }}>{w.week}</span>
                      <span style={{ fontWeight: 900, color: "#EF4444" }}>₹{fmt(w.amount)} <span style={{ color: "var(--kravy-text-muted)", fontWeight: 500 }}>({w.count} bill{w.count > 1 ? "s" : ""})</span></span>
                    </div>
                    <div style={{ height: "8px", background: "var(--kravy-bg-2)", borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #8B5CF6 0%, #7C3AED 100%)", borderRadius: "999px" }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div style={{
        background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)",
        borderRadius: "20px", padding: "16px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px"
      }}>
        <div style={{ position: "relative", flex: "2 1 300px" }}>
          <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--kravy-text-muted)" }} />
          <input
            type="text"
            placeholder="Search debtors by name or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%", padding: "12px 14px 12px 46px",
              borderRadius: "14px", border: "1px solid var(--kravy-border)",
              background: "var(--kravy-bg-2)", color: "var(--kravy-text-primary)",
              fontSize: "0.9rem", outline: "none"
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 auto", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", background: "var(--kravy-bg-2)", border: "1px solid var(--kravy-border)", borderRadius: "14px", padding: "6px 12px", gap: "8px" }}>
            <Calendar size={14} style={{ color: "var(--kravy-text-muted)" }} />
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", fontSize: "0.75rem", fontWeight: 700, color: "var(--kravy-text-primary)" }}
            />
            <span style={{ color: "var(--kravy-text-muted)", fontSize: "0.75rem" }}>to</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", fontSize: "0.75rem", fontWeight: 700, color: "var(--kravy-text-primary)" }}
            />
          </div>
          <button
            onClick={applyDateRange}
            style={{
              padding: "10px 18px", borderRadius: "14px", background: "var(--kravy-text-primary)", color: "var(--kravy-surface)",
              fontSize: "0.75rem", fontWeight: 850, border: "none", cursor: "pointer"
            }}
          >
            Apply Filter
          </button>
          {(initStartDate || initEndDate) && (
            <button
              onClick={clearDateRange}
              style={{
                padding: "10px 18px", borderRadius: "14px", background: "transparent", border: "1px solid var(--kravy-border)", color: "#EF4444",
                fontSize: "0.75rem", fontWeight: 850, cursor: "pointer"
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Ledger Section ── */}
      <div style={{ background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)", borderRadius: "32px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
        <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--kravy-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 900, color: "var(--kravy-text-primary)", margin: 0 }}>Debtor Accounts Ledger</h2>
          <span style={{ fontSize: "0.8rem", color: "var(--kravy-text-muted)", fontWeight: 700 }}>{filteredDues.length} entries matching</span>
        </div>

        <div style={{ padding: "24px 32px" }}>
          {filteredDues.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "var(--kravy-text-muted)" }}>
              <AlertCircle size={48} style={{ margin: "0 auto 16px", color: "var(--kravy-text-muted)" }} />
              <p style={{ fontWeight: 800 }}>No outstanding customer dues found matching search.</p>
            </div>
          ) : (
            filteredDues.map((customer) => {
              const cKey = customer.customerPhone || (customer.bills[0] ? `bill:${customer.bills[0].id}` : `name:${customer.customerName}`);
              const isExpanded = expandedCustomer === cKey;
              return (
                <div key={cKey} style={{
                  border: "1px solid var(--kravy-border)",
                  borderRadius: "24px",
                  background: isExpanded ? "var(--kravy-bg-2)" : "var(--kravy-surface)",
                  marginBottom: "16px",
                  overflow: "hidden",
                  transition: "all 0.25s ease"
                }}>
                  {/* Row Summary */}
                  <div 
                    onClick={() => setExpandedCustomer(isExpanded ? null : cKey)}
                    style={{
                      padding: "20px 24px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{
                        width: "48px", height: "48px", borderRadius: "14px",
                        background: "rgba(239, 68, 68, 0.08)", color: "#EF4444",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <User size={22} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--kravy-text-primary)", margin: 0 }}>{customer.customerName}</h4>
                        <div style={{ display: "flex", gap: "12px", marginTop: "4px", fontSize: "0.75rem", color: "var(--kravy-text-muted)" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: "monospace" }}><Phone size={12} /> {customer.customerPhone || "Walk-in Guest"}</span>
                          <span>•</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Calendar size={12} /> Last bill: {new Date(customer.lastBillDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.25rem", fontWeight: 950, color: "#EF4444" }}>₹{fmt(customer.totalUnpaid)}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--kravy-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>{customer.billsCount} unpaid bill{customer.billsCount > 1 ? "s" : ""}</div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSettleAllForCustomer(customer, cKey);
                          }}
                          style={{
                            padding: "8px 16px", borderRadius: "10px",
                            background: "rgba(16, 185, 129, 0.12)", color: "#10B981",
                            border: "none", fontSize: "0.75rem", fontWeight: 900,
                            cursor: "pointer"
                          }}
                        >
                          Settle All
                        </button>
                        <span style={{ color: "var(--kravy-text-muted)", fontSize: "1.2rem", transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
                          →
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Bills Details */}
                  {isExpanded && (
                    <div style={{
                      padding: "0 24px 24px",
                      borderTop: "1px solid var(--kravy-border)",
                      background: "var(--kravy-surface)",
                      animation: "slideDown 0.2s ease-out"
                    }}>
                      <div style={{ overflowX: "auto", marginTop: "16px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid var(--kravy-border)" }}>
                              <th style={{ padding: "12px 8px", fontSize: "0.75rem", fontWeight: 800, color: "var(--kravy-text-muted)" }}>Bill No</th>
                              <th style={{ padding: "12px 8px", fontSize: "0.75rem", fontWeight: 800, color: "var(--kravy-text-muted)" }}>Date</th>
                              <th style={{ padding: "12px 8px", fontSize: "0.75rem", fontWeight: 800, color: "var(--kravy-text-muted)" }}>Table/Source</th>
                              <th style={{ padding: "12px 8px", fontSize: "0.75rem", fontWeight: 800, color: "var(--kravy-text-muted)" }}>Total</th>
                              <th style={{ padding: "12px 8px", fontSize: "0.75rem", fontWeight: 800, color: "var(--kravy-text-muted)" }}>Amount Paid</th>
                              <th style={{ padding: "12px 8px", fontSize: "0.75rem", fontWeight: 800, color: "var(--kravy-text-muted)" }}>Balance Due</th>
                              <th style={{ padding: "12px 8px", fontSize: "0.75rem", fontWeight: 800, color: "var(--kravy-text-muted)", textAlign: "right" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customer.bills.map((bill) => (
                              <tr key={bill.id} style={{ borderBottom: "1px solid var(--kravy-border)" }}>
                                <td style={{ padding: "14px 8px", fontSize: "0.8rem", fontWeight: 800, fontFamily: "monospace" }}>#{bill.billNumber}</td>
                                <td style={{ padding: "14px 8px", fontSize: "0.75rem", color: "var(--kravy-text-muted)" }}>
                                  {new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </td>
                                <td style={{ padding: "14px 8px", fontSize: "0.75rem" }}>
                                  <span style={{ padding: "3px 8px", background: "var(--kravy-bg-2)", borderRadius: "6px" }}>{bill.tableName}</span>
                                </td>
                                <td style={{ padding: "14px 8px", fontSize: "0.8rem", fontWeight: 700 }}>₹{fmt(bill.total)}</td>
                                <td style={{ padding: "14px 8px", fontSize: "0.8rem", color: "#10B981" }}>₹{fmt(bill.amountPaid)}</td>
                                <td style={{ padding: "14px 8px", fontSize: "0.85rem", fontWeight: 900, color: "#EF4444" }}>₹{fmt(bill.balanceDue)}</td>
                                <td style={{ padding: "14px 8px", textAlign: "right" }}>
                                  <button
                                    onClick={() => handleSettleBill(bill.id, cKey)}
                                    disabled={settlingBillId === bill.id}
                                    style={{
                                      padding: "6px 12px", borderRadius: "8px",
                                      background: "#10B981", color: "white",
                                      border: "none", fontSize: "0.7rem", fontWeight: 850,
                                      cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px",
                                      opacity: settlingBillId === bill.id ? 0.7 : 1
                                    }}
                                  >
                                    {settlingBillId === bill.id ? (
                                      <div style={{ width: "10px", height: "10px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                    ) : (
                                      <>
                                        <Check size={10} strokeWidth={3} />
                                        Mark Paid
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
