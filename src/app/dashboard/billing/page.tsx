"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { formatWhatsAppNumber } from "@/lib/whatsapp";
import { useSearch } from "@/components/SearchContext";
import {
  Receipt, Plus, Trash2, Eye, Printer, MessageCircle,
  Play, MoreVertical, IndianRupee, Calendar, User, Phone,
  CreditCard, Smartphone, Banknote, Clock, FileText, CheckCircle2, UtensilsCrossed, ChefHat, 
  ChevronLeft, ChevronRight, Settings2, Check, LayoutGrid, Filter, Search
} from "lucide-react";

type BillManager = {
  id: string;
  billNumber: string;
  createdAt: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentMode: string;
  paymentStatus: string;
  customerName?: string | null;
  customerPhone?: string | null;
  isHeld?: boolean;
  pdfUrl?: string | null;
  items?: any;
  clerkUserId?: string | null;
  tableName?: string | null;
  isOrder?: boolean;
  orderStatus?: string;
};

export default function BillingPage() {
  const [bills, setBills] = useState<BillManager[]>([]);
  const [clerkId, setClerkId] = useState<string | null>(null);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();
  const { query } = useSearch();
  const [showColPicker, setShowColPicker] = useState(false);
  const [visibleCols, setVisibleCols] = useState({
    sno: true,
    billInfo: true,
    source: true,
    customer: true,
    customerPhone: true,
    subtotal: true,
    gst: true,
    discount: true,
    total: true,
    timeline: true,
    payment: true
  });

  const [colFilters, setColFilters] = useState({
    billNumber: "",
    tableName: "",
    customerName: "",
    customerPhone: "",
    paymentStatus: "",
    paymentMode: "",
  });
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Load preferences
  useEffect(() => {
    const saved = localStorage.getItem("billing_table_cols");
    if (saved) {
      try { setVisibleCols(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const toggleCol = (key: keyof typeof visibleCols) => {
    const next = { ...visibleCols, [key]: !visibleCols[key] };
    setVisibleCols(next);
    localStorage.setItem("billing_table_cols", JSON.stringify(next));
  };

  async function fetchProfile() {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setBusiness(data);
      }
    } catch (e) {
      console.error("Failed to fetch profile:", e);
    }
  }

  async function fetchBills() {
    try {
      setLoading(true);
      const [billsRes, ordersRes] = await Promise.all([
        fetch("/api/bill-manager", { cache: "no-store" }),
        fetch("/api/orders", { cache: "no-store" })
      ]);

      if (!billsRes.ok) throw new Error("Failed to fetch bills");
      const billsData = await billsRes.json();
      
      let combinedData: BillManager[] = (billsData.bills ?? []).map((b: any) => ({
        ...b,
        isOrder: false
      }));

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        const activeOrders = ordersData
          .filter((o: any) => o.status !== "COMPLETED") // Completed ones are already in bills
          .map((o: any) => ({
            id: o.id,
            billNumber: `ORD-${o.id.slice(-4).toUpperCase()}`,
            createdAt: o.createdAt,
            total: o.total,
            paymentMode: "Pending",
            paymentStatus: "Pending",
            customerName: o.customerName || "Walk-in",
            customerPhone: o.customerPhone,
            isHeld: false,
            tableName: o.table?.name || "Counter",
            isOrder: true,
            orderStatus: o.status,
            items: o.items
          }));
        combinedData = [...combinedData, ...activeOrders];
      }

      // Sort by date desc
      combinedData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setBills(combinedData);
      if (billsData.clerkUserId) setClerkId(billsData.clerkUserId);
    } catch (err) {
      console.error("FETCH BILLS ERROR:", err);
      setError("Failed to load records");
    } finally {
      setLoading(false);
    }
  }

  const isFilterActive = !!(query || colFilters.billNumber || colFilters.tableName || colFilters.customerName || colFilters.customerPhone || colFilters.paymentStatus || colFilters.paymentMode);

  const clearFilters = () => {
    setColFilters({
      billNumber: "",
      tableName: "",
      customerName: "",
      customerPhone: "",
      paymentStatus: "",
      paymentMode: "",
    });
    // Global search is handled by the SearchContext, usually cleared there
  };

  useEffect(() => { 
    fetchBills(); 
    fetchProfile();
  }, []);

  const filteredBills = bills.filter(b => {
    const matchesGlobal = !query || (
      (b.billNumber?.toLowerCase() || "").includes(query.toLowerCase()) ||
      (b.customerName?.toLowerCase() || "").includes(query.toLowerCase()) ||
      (b.customerPhone || "").includes(query) ||
      (b.tableName?.toLowerCase() || "").includes(query.toLowerCase())
    );

    const matchesColFilters = 
      (b.billNumber?.toLowerCase() || "").includes(colFilters.billNumber.toLowerCase()) &&
      (b.tableName?.toLowerCase() || "").includes(colFilters.tableName.toLowerCase()) &&
      (b.customerName?.toLowerCase() || "").includes(colFilters.customerName.toLowerCase()) &&
      (b.customerPhone || "").includes(colFilters.customerPhone) &&
      (b.paymentStatus?.toLowerCase() || "").includes(colFilters.paymentStatus.toLowerCase()) &&
      (b.paymentMode?.toLowerCase() || "").includes(colFilters.paymentMode.toLowerCase());

    return !!(matchesGlobal && matchesColFilters);
  });

  const totalPages = Math.ceil(filteredBills.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBills = filteredBills.slice(startIndex, startIndex + itemsPerPage);

  const format = (num: number) =>
    new Intl.NumberFormat("en-IN").format(Math.round(num));

  const totalRevenue = bills.filter(b => !b.isOrder && b.paymentStatus?.toLowerCase() === "paid").reduce((s, b) => s + b.total, 0);
  const paidBills = bills.filter(b => !b.isOrder && b.paymentStatus?.toLowerCase() === "paid").length;
  const heldBills = bills.filter(b => b.isHeld).length;
  const activeOrderCount = bills.filter(b => b.isOrder).length;

  if (error) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "60px", color: "#EF4444", flexDirection: "column", gap: "12px"
    }}>
      <div style={{ fontSize: "2rem" }}>⚠️</div>
      <div style={{ fontFamily: "monospace" }}>{error}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="kravy-page-fade">

      {/* ── Page Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{
              width: "6px", height: "32px",
              background: "var(--kravy-brand)",
              borderRadius: "10px",
              boxShadow: "0 0 15px rgba(79, 70, 229, 0.4)"
            }} />
            <h1 style={{
              fontSize: "1.75rem", fontWeight: 900,
              color: "var(--kravy-text-primary)", letterSpacing: "-1px"
            }}>
              Bill Manager
            </h1>
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--kravy-text-muted)", marginLeft: "16px", fontFamily: "monospace" }}>
            {isFilterActive 
              ? `Showing ${filteredBills.length} of ${bills.length} records`
              : `All transactions · ${bills.length} total records`
            }
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {isFilterActive && (
            <button
              onClick={clearFilters}
              style={{
                fontSize: "0.75rem", fontWeight: 800, color: "#f43f5e",
                background: "rgba(244, 63, 94, 0.05)", border: "1px solid rgba(244, 63, 94, 0.1)",
                padding: "8px 14px", borderRadius: "10px", cursor: "pointer"
              }}
            >
              Clear Filters
            </button>
          )}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowColPicker(!showColPicker)}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 18px", borderRadius: "12px", border: "1px solid var(--kravy-border)",
                background: "var(--kravy-surface)", color: "var(--kravy-text-secondary)",
                fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
              }}
            >
              <Settings2 size={16} />
              Columns
            </button>
            {showColPicker && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setShowColPicker(false)} />
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)",
                  width: "220px", background: "var(--kravy-bg)", borderRadius: "16px",
                  border: "1px solid var(--kravy-border-strong)", boxShadow: "var(--kravy-card-shadow)",
                  padding: "8px", zIndex: 101, display: "flex", flexDirection: "column", gap: "2px"
                }}>
                  <div style={{ padding: "8px 12px", fontSize: "0.65rem", fontWeight: 900, color: "var(--kravy-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Manage Table Columns</div>
                  {[
                    { key: "sno", label: "S.No" },
                    { key: "billInfo", label: "Bill Info" },
                    { key: "source", label: "Source" },
                    { key: "customer", label: "Customer Name" },
                    { key: "customerPhone", label: "Phone Number" },
                    { key: "subtotal", label: "Subtotal" },
                    { key: "gst", label: "GST" },
                    { key: "discount", label: "Discount" },
                    { key: "total", label: "Net Total" },
                    { key: "timeline", label: "Timeline" },
                    { key: "payment", label: "Payment & Status" },
                  ].map(col => (
                    <button
                      key={col.key}
                      onClick={() => toggleCol(col.key as any)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 12px", borderRadius: "10px", border: "none",
                        background: (visibleCols as any)[col.key] ? "rgba(99, 102, 241, 0.05)" : "transparent",
                        color: (visibleCols as any)[col.key] ? "var(--kravy-brand)" : "var(--kravy-text-muted)",
                        fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s"
                      }}
                    >
                      {col.label}
                      {(visibleCols as any)[col.key] && <Check size={14} strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={async () => {
              const res = await fetch("/api/bill-manager/export");
              if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Kravy_Bills_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
              } else {
                alert("Export failed");
              }
            }}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 18px", borderRadius: "12px", border: "1px solid var(--kravy-border)",
              background: "var(--kravy-surface)", color: "#10B981",
              fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
            }}
          >
            <FileText size={16} />
            Export Excel
          </button>

          <Link href="/dashboard/billing/deleted" style={{ textDecoration: "none" }}>
            <button style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 18px", borderRadius: "12px", border: "1px solid var(--kravy-border)",
              background: "var(--kravy-surface)", color: "var(--kravy-text-secondary)",
              fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
            }}>
              <Trash2 size={16} />
              Deleted Bills
            </button>
          </Link>
          <Link href="/dashboard/billing/checkout" style={{ textDecoration: "none" }}>
            <button style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 20px", borderRadius: "14px", border: "none",
              background: "var(--kravy-brand)",
              color: "white", fontSize: "0.85rem", fontWeight: 800,
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 4px 20px rgba(79, 70, 229, 0.3)"
            }}>
              <Plus size={16} />
              New Order
            </button>
          </Link>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
        {[
          { label: "Total Revenue", value: `₹${format(totalRevenue)}`, icon: <IndianRupee size={18} />, color: "rgb(16 185 129)" },
          { label: "Total Bills", value: bills.length.toString(), icon: <Receipt size={18} />, color: "rgb(99 102 241)" },
          { label: "Paid Bills", value: paidBills.toString(), icon: <CreditCard size={18} />, color: "rgb(139 92 246)" },
          { label: "On Hold", value: heldBills.toString(), icon: <Clock size={18} />, color: "rgb(245 158 11)" },
          { label: "Active Orders", value: activeOrderCount.toString(), icon: <UtensilsCrossed size={18} />, color: "rgb(239 68 68)" },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="kravy-card"
            style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}
          >
            <div style={{
              width: "44px", height: "44px", borderRadius: "14px",
              background: `${s.color}15`, border: `1px solid ${s.color}25`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: s.color, flexShrink: 0
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--kravy-text-primary)", letterSpacing: "-0.5px" }}>
                {s.value}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--kravy-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {s.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Loading Skeleton ── */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="kravy-skeleton" style={{ height: "60px", borderRadius: "14px" }} />
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && filteredBills.length === 0 && (
        <div className="kravy-card" style={{
          padding: "60px 40px", textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "16px"
        }}>
          <div style={{ fontSize: "3rem", opacity: 0.5 }}>🧾</div>
          <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--kravy-text-primary)" }}>
            {query ? `No bills matching "${query}"` : "No bills yet"}
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--kravy-text-muted)" }}>
            Create your first order to get started
          </div>
          <Link href="/dashboard/billing/checkout">
            <button style={{
              marginTop: "8px", padding: "10px 24px", borderRadius: "14px", border: "none",
              background: "var(--kravy-brand)", color: "white",
              fontSize: "0.88rem", fontWeight: 800, cursor: "pointer",
              boxShadow: "0 4px 20px rgba(79, 70, 229, 0.2)"
            }}>
              + Create First Bill
            </button>
          </Link>
        </div>
      )}

      {/* ── Desktop Table ── */}
      {!loading && filteredBills.length > 0 && (
        <div className="kravy-card hidden md:block" style={{ overflowX: "auto", padding: 0 }}>
          <table className="kravy-table" style={{ minWidth: "1200px", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                {/* S.No */}
                {visibleCols.sno && <th style={{ textAlign: "left", padding: "16px 20px", width: "60px" }}>S.No</th>}

                {/* Identification */}
                {visibleCols.billInfo && (
                  <th style={{ textAlign: "left", padding: "16px 20px", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>Bill Info</span>
                      <button 
                        onClick={() => setActiveFilter(activeFilter === 'bill' ? null : 'bill')}
                        style={{ background: "none", border: "none", color: colFilters.billNumber ? "var(--kravy-brand)" : "var(--kravy-text-muted)", cursor: "pointer", padding: "2px" }}
                      >
                        <Filter size={12} strokeWidth={colFilters.billNumber ? 3 : 2} />
                      </button>
                    </div>
                    {activeFilter === 'bill' && (
                      <div style={{ position: "absolute", top: "100%", left: "16px", zIndex: 10, background: "white", padding: "8px", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid var(--kravy-border)", width: "180px" }}>
                        <input 
                          autoFocus
                          placeholder="Filter bill no..."
                          value={colFilters.billNumber}
                          onChange={e => setColFilters(f => ({ ...f, billNumber: e.target.value }))}
                          style={{ width: "100%", padding: "6px 10px", fontSize: "0.75rem", borderRadius: "6px", border: "1px solid var(--kravy-border)", outline: "none" }}
                          onBlur={() => setTimeout(() => setActiveFilter(null), 200)}
                        />
                      </div>
                    )}
                  </th>
                )}
                
                {/* Source */}
                {visibleCols.source && (
                  <th style={{ textAlign: "left", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>Source</span>
                      <button 
                        onClick={() => setActiveFilter(activeFilter === 'source' ? null : 'source')}
                        style={{ background: "none", border: "none", color: colFilters.tableName ? "var(--kravy-brand)" : "var(--kravy-text-muted)", cursor: "pointer", padding: "2px" }}
                      >
                        <Filter size={12} strokeWidth={colFilters.tableName ? 3 : 2} />
                      </button>
                    </div>
                    {activeFilter === 'source' && (
                      <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 10, background: "white", padding: "8px", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid var(--kravy-border)", width: "120px" }}>
                        <input 
                          autoFocus
                          placeholder="POS/Table..."
                          value={colFilters.tableName}
                          onChange={e => setColFilters(f => ({ ...f, tableName: e.target.value }))}
                          style={{ width: "100%", padding: "6px 10px", fontSize: "0.75rem", borderRadius: "6px", border: "1px solid var(--kravy-border)", outline: "none" }}
                          onBlur={() => setTimeout(() => setActiveFilter(null), 200)}
                        />
                      </div>
                    )}
                  </th>
                )}

                {/* Customer */}
                {visibleCols.customer && (
                  <th style={{ textAlign: "left", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>Customer</span>
                      <button 
                        onClick={() => setActiveFilter(activeFilter === 'customer' ? null : 'customer')}
                        style={{ background: "none", border: "none", color: colFilters.customerName ? "var(--kravy-brand)" : "var(--kravy-text-muted)", cursor: "pointer", padding: "2px" }}
                      >
                        <Filter size={12} strokeWidth={colFilters.customerName ? 3 : 2} />
                      </button>
                    </div>
                    {activeFilter === 'customer' && (
                      <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 10, background: "white", padding: "8px", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid var(--kravy-border)", width: "180px" }}>
                        <input 
                          autoFocus
                          placeholder="Filter name..."
                          value={colFilters.customerName}
                          onChange={e => setColFilters(f => ({ ...f, customerName: e.target.value }))}
                          style={{ width: "100%", padding: "6px 10px", fontSize: "0.75rem", borderRadius: "6px", border: "1px solid var(--kravy-border)", outline: "none" }}
                          onBlur={() => setTimeout(() => setActiveFilter(null), 200)}
                        />
                      </div>
                    )}
                  </th>
                )}

                {/* Phone */}
                {visibleCols.customerPhone && (
                  <th style={{ textAlign: "left", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>Phone</span>
                      <button 
                        onClick={() => setActiveFilter(activeFilter === 'phone' ? null : 'phone')}
                        style={{ background: "none", border: "none", color: colFilters.customerPhone ? "var(--kravy-brand)" : "var(--kravy-text-muted)", cursor: "pointer", padding: "2px" }}
                      >
                        <Filter size={12} strokeWidth={colFilters.customerPhone ? 3 : 2} />
                      </button>
                    </div>
                    {activeFilter === 'phone' && (
                      <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 10, background: "white", padding: "8px", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid var(--kravy-border)", width: "160px" }}>
                        <input 
                          autoFocus
                          placeholder="Filter phone..."
                          value={colFilters.customerPhone}
                          onChange={e => setColFilters(f => ({ ...f, customerPhone: e.target.value }))}
                          style={{ width: "100%", padding: "6px 10px", fontSize: "0.75rem", borderRadius: "6px", border: "1px solid var(--kravy-border)", outline: "none" }}
                          onBlur={() => setTimeout(() => setActiveFilter(null), 200)}
                        />
                      </div>
                    )}
                  </th>
                )}
                
                {/* Financial Breakdown - Modern Visual Grouping */}
                {visibleCols.subtotal && <th style={{ textAlign: "right", background: "rgba(99, 102, 241, 0.03)", color: "var(--kravy-text-muted)" }}>Subtotal</th>}
                {visibleCols.gst && <th style={{ textAlign: "right", background: "rgba(99, 102, 241, 0.03)", color: "#f59e0b" }}>GST</th>}
                {visibleCols.discount && <th style={{ textAlign: "right", background: "rgba(99, 102, 241, 0.03)", color: "#ef4444" }}>Disc.</th>}
                {visibleCols.total && <th style={{ textAlign: "right", background: "rgba(16, 185, 129, 0.05)", borderRight: "1px solid var(--kravy-border)" }}>Net Total</th>}
                
                {/* Status & Timing */}
                {visibleCols.timeline && <th style={{ textAlign: "left", paddingLeft: "15px" }}>Timeline</th>}
                {visibleCols.payment && (
                  <th style={{ textAlign: "left", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>Payment</span>
                      <button 
                        onClick={() => setActiveFilter(activeFilter === 'payment' ? null : 'payment')}
                        style={{ background: "none", border: "none", color: colFilters.paymentStatus ? "var(--kravy-brand)" : "var(--kravy-text-muted)", cursor: "pointer", padding: "2px" }}
                      >
                        <Filter size={12} strokeWidth={colFilters.paymentStatus ? 3 : 2} />
                      </button>
                    </div>
                    {activeFilter === 'payment' && (
                      <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 10, background: "white", padding: "8px", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid var(--kravy-border)", width: "150px" }}>
                        <select
                          autoFocus
                          value={colFilters.paymentStatus}
                          onChange={e => setColFilters(f => ({ ...f, paymentStatus: e.target.value }))}
                          style={{ width: "100%", padding: "6px 4px", fontSize: "0.75rem", borderRadius: "6px", border: "1px solid var(--kravy-border)", background: "white", outline: "none" }}
                          onBlur={() => setTimeout(() => setActiveFilter(null), 200)}
                        >
                          <option value="">All Status</option>
                          <option value="paid">Paid</option>
                          <option value="pending">Pending</option>
                          <option value="held">Held</option>
                        </select>
                      </div>
                    )}
                  </th>
                )}
                <th style={{ textAlign: "right", paddingRight: "20px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBills.map((bill, idx) => (
                <motion.tr
                  key={bill.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  {/* S.No */}
                  {visibleCols.sno && (
                    <td style={{ padding: "16px 20px", fontSize: "0.75rem", fontWeight: 700, color: "var(--kravy-text-faint)", fontFamily: "monospace" }}>
                      {startIndex + idx + 1}
                    </td>
                  )}

                  {/* Bill Info */}
                  {visibleCols.billInfo && (
                    <td style={{ padding: "16px 20px" }}>
                      <div className="flex flex-col">
                        <span style={{ fontFamily: "monospace", fontWeight: 900, fontSize: "0.85rem", color: "var(--kravy-brand)" }}>
                          #{bill.billNumber}
                        </span>
                        <span style={{ 
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          fontSize: "0.6rem", fontWeight: 800, marginTop: "4px",
                          color: bill.isOrder ? "#D97706" : "#059669"
                        }}>
                          {bill.isOrder ? <Clock size={10} /> : <CheckCircle2 size={10} />}
                          {bill.isOrder ? bill.orderStatus : "SETTLED"}
                        </span>
                      </div>
                    </td>
                  )}

                  {/* Source */}
                  {visibleCols.source && (
                    <td>
                      <span style={{
                        padding: "4px 8px", borderRadius: "8px",
                        background: bill.tableName === "POS" ? "rgba(79, 70, 229, 0.1)" : "rgba(245, 158, 11, 0.1)",
                        color: bill.tableName === "POS" ? "var(--kravy-brand)" : "#D97706",
                        fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>
                        {bill.tableName || "POS"}
                      </span>
                    </td>
                  )}

                  {/* Customer */}
                  {visibleCols.customer && (
                    <td>
                      <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--kravy-text-primary)" }}>{bill.customerName || "Walk-in"}</span>
                    </td>
                  )}

                  {/* Customer Phone */}
                  {visibleCols.customerPhone && (
                    <td>
                      <span style={{ fontSize: "0.75rem", color: "var(--kravy-text-muted)", fontFamily: "monospace", fontWeight: 600 }}>{bill.customerPhone || "—"}</span>
                    </td>
                  )}

                  {/* Financial Group */}
                  {visibleCols.subtotal && (
                    <td style={{ textAlign: "right", background: "rgba(99, 102, 241, 0.02)", fontWeight: 600, fontSize: "0.85rem" }}>
                      ₹{format(bill.subtotal || (bill.total - (bill.tax || 0)))}
                    </td>
                  )}
                  {visibleCols.gst && (
                    <td style={{ textAlign: "right", background: "rgba(99, 102, 241, 0.02)", color: "#d97706", fontWeight: 700, fontSize: "0.85rem" }}>
                      ₹{format(bill.tax || 0)}
                    </td>
                  )}
                  {visibleCols.discount && (
                    <td style={{ textAlign: "right", background: "rgba(99, 102, 241, 0.02)", color: "#dc2626", fontWeight: 700, fontSize: "0.85rem" }}>
                      ₹0
                    </td>
                  )}
                  {visibleCols.total && (
                    <td style={{ 
                      textAlign: "right", background: "rgba(16, 185, 129, 0.04)", 
                      fontWeight: 900, color: "var(--kravy-text-primary)", fontSize: "1rem",
                      borderRight: "1px solid var(--kravy-border)"
                    }}>
                      ₹{format(bill.total)}
                    </td>
                  )}

                  {/* Timeline */}
                  {visibleCols.timeline && (
                    <td style={{ paddingLeft: "15px" }}>
                      <div className="flex flex-col">
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--kravy-text-secondary)" }}>
                          {new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                        <span style={{ fontSize: "0.65rem", color: "var(--kravy-text-faint)", fontFamily: "monospace" }}>
                          {new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                  )}

                  {/* Payment */}
                  {visibleCols.payment && (
                    <td>
                      <div className="flex flex-col gap-1.5 items-start">
                        <PaymentBadge mode={bill.paymentMode} />
                        <StatusBadge status={bill.paymentStatus} isHeld={bill.isHeld} />
                      </div>
                    </td>
                  )}

                  <td style={{ textAlign: "right", paddingRight: "20px" }}>
                    <BillActions bill={bill} refresh={fetchBills} clerkId={clerkId} business={business} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination Controls ── */}
      {!loading && filteredBills.length > itemsPerPage && (
        <div style={{
          display: "flex", justifyContent: "flex-end", alignItems: "center",
          gap: "8px", marginTop: "16px", padding: "0 4px"
        }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              width: "36px", height: "36px", borderRadius: "12px", 
              border: "1px solid var(--kravy-border)",
              background: "white", color: currentPage === 1 ? "#ccc" : "var(--kravy-brand)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}
          >
            <ChevronLeft size={18} />
          </button>

          <div style={{ 
            height: "36px", padding: "0 16px", background: "rgba(0,0,0,0.03)", 
            borderRadius: "12px", display: "flex", alignItems: "center",
            fontSize: "0.75rem", fontWeight: 900, color: "var(--kravy-text-muted)", fontFamily: "monospace" 
          }}>
            {currentPage} / {totalPages}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              width: "36px", height: "36px", borderRadius: "12px", 
              border: "1px solid var(--kravy-border)",
              background: "white", color: currentPage === totalPages ? "#ccc" : "var(--kravy-brand)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* ── Mobile Cards ── */}
      {!loading && paginatedBills.length > 0 && (
        <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {paginatedBills.map((bill, idx) => (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="kravy-card"
              style={{ padding: "16px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontFamily: "monospace", fontWeight: 800, color: "var(--kravy-accent)", fontSize: "0.9rem" }}>
                    #{bill.billNumber}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--kravy-text-secondary)", marginTop: "2px" }}>
                    {bill.customerName || "Walk-in Customer"}
                  </div>
                </div>
                <BillActions bill={bill} refresh={fetchBills} clerkId={clerkId} business={business} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                {[
                  { label: "Subtotal", value: `₹${format(bill.subtotal || (bill.total - (bill.tax || 0)))}` },
                  { label: "GST", value: `₹${format(bill.tax || 0)}` },
                  { label: "Net Amount", value: `₹${format(bill.total)}`, bold: true, color: "var(--kravy-brand)" },
                  { label: "Source", value: bill.tableName || "POS" },
                  { label: "Status", value: bill.isOrder ? bill.orderStatus : "SETTLED", isStatus: true },
                  { label: "Payment", badge: true, bill },
                ].map((row, i) => (
                  <div key={i} style={{
                    background: row.bold ? "rgba(99, 102, 241, 0.03)" : "var(--kravy-surface)",
                    border: row.bold ? "1px solid rgba(99, 102, 241, 0.1)" : "1px solid var(--kravy-border)",
                    borderRadius: "12px", padding: "10px 12px",
                  }}>
                    <div style={{ fontSize: "0.55rem", color: "var(--kravy-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>
                      {row.label}
                    </div>
                    {row.badge
                      ? <StatusBadge status={bill.paymentStatus} isHeld={bill.isHeld} />
                      : row.isStatus 
                        ? <span style={{
                            fontSize: "0.75rem", fontWeight: 900,
                            color: row.value === "SETTLED" ? "#059669" : "#D97706"
                          }}>{row.value}</span>
                        : <div style={{ 
                            fontWeight: row.bold ? 900 : 700, 
                            color: row.color || "var(--kravy-text-primary)", 
                            fontSize: row.bold ? "1rem" : "0.85rem",
                            fontFamily: "monospace"
                          }}>
                            {row.value}
                          </div>
                    }
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "8px", borderTop: "1px dashed var(--kravy-border)" }}>
                <span style={{ fontSize: "0.65rem", color: "var(--kravy-text-faint)", fontFamily: "monospace" }}>
                  {new Date(bill.createdAt).toLocaleString('en-IN')}
                </span>
                <PaymentBadge mode={bill.paymentMode} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Payment Badge ─── */
function PaymentBadge({ mode }: { mode: string }) {
  const lower = mode?.toLowerCase() || "";
  const isUPI = lower.includes("upi");
  const color = isUPI ? "rgb(139 92 246)" : "rgb(16 185 129)";
  const Icon = isUPI ? Smartphone : Banknote;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      fontSize: "0.65rem", fontWeight: 800, padding: "4px 10px",
      borderRadius: "20px", fontFamily: "monospace",
      background: `${color}15`, color: color, border: `1px solid ${color}25`
    }}>
      <Icon size={12} />{mode?.toUpperCase()}
    </span>
  );
}

/* ─── Status Badge ─── */
function StatusBadge({ status, isHeld }: { status: string; isHeld?: boolean }) {
  if (isHeld || status?.toLowerCase() === "held") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        fontSize: "0.65rem", fontWeight: 800, padding: "4px 10px",
        borderRadius: "20px", background: "rgba(245, 158, 11, 0.1)",
        color: "rgb(245 158 11)", border: "1px solid rgba(245, 158, 11, 0.2)"
      }}>
        ⏸ HELD
      </span>
    );
  }
  if (status?.toLowerCase() === "paid") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        fontSize: "0.65rem", fontWeight: 800, padding: "4px 10px",
        borderRadius: "20px", background: "rgba(16, 185, 129, 0.1)",
        color: "rgb(16 185 129)", border: "1px solid rgba(16, 185, 129, 0.2)"
      }}>
        ✓ PAID
      </span>
    );
  }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      fontSize: "0.65rem", fontWeight: 800, padding: "4px 10px",
      borderRadius: "20px", background: "rgba(244, 63, 94, 0.1)",
      color: "rgb(244 63 94)", border: "1px solid rgba(244, 63, 94, 0.2)"
    }}>
      ◌ PENDING
    </span>
  );
}

/* ─── Bill Actions ─── */
function BillActions({ bill, refresh, clerkId, business }: { bill: BillManager; refresh: () => void; clerkId?: string | null; business?: any }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleWhatsApp = async () => {
    let pdfUrl = bill.pdfUrl;
    const origin = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;

    // 1. Try to fetch Cloudinary URL if missing
    if (!pdfUrl) {
      try {
        const res = await fetch(`/api/bill-manager/${bill.id}/pdf${clerkId ? `?clerkId=${clerkId}` : ""}&json=true`);
        const data = await res.json();
        if (data && data.url) {
          pdfUrl = data.url;
        }
      } catch (err) {
        console.error("Failed to get PDF URL:", err);
      }
    }

    // 3. Prepare Items Summary
    const billItems = Array.isArray(bill.items) ? bill.items : [];
    const itemsList = billItems
      .map((i: any) => `• ${i.name} ×${i.qty ?? i.quantity} – ₹${((i.qty ?? i.quantity) * (i.rate ?? i.price)).toFixed(2)}`)
      .join("\n");

    // 4. Construct Premium Message
    const restaurantName = business?.businessName || "Kravy POS";
    // origin is already declared above at line 414
    const menuUrl = `${origin}/menu/${clerkId || bill.clerkUserId}`;
    const phone = formatWhatsAppNumber(bill.customerPhone);
    const showMenu = business?.menuLinkEnabled !== false;
    
    // Using string concatenation to ensure best emoji compatibility
    const message = encodeURIComponent(
      "🙏 *Thank you for shopping with us!*\n\n" +
      `Hello *${bill.customerName || "Customer"}*,\n\n` +
      `Here is your invoice from *${restaurantName}*:\n\n` +
      "🧾 *Bill No:* " + bill.billNumber + "\n" +
      "💰 *Amount Paid:* Rs. " + bill.total + "\n\n" +
      "📄 *Download Invoice:*\n" +
      pdfUrl + "\n\n" +
      (showMenu ? ("🍴 *View Our Menu:*\n" + menuUrl + "\n\n") : "") +
      "We look forward to serving you again! 😊"
    );
    window.open(phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`, "_blank");
  };

  const actions = bill.isOrder ? [
    {
      label: "Go to Kitchen",
      icon: <ChefHat size={14} />,
      color: "rgb(99 102 241)",
      onClick: () => router.push(`/dashboard/workflow`)
    },
    {
      label: "View Items",
      icon: <Eye size={14} />,
      color: "var(--kravy-text-muted)",
      onClick: () => alert(`Items:\n${bill.items?.map((i: any) => `${i.name} x${i.quantity}`).join('\n')}`)
    }
  ] : [
    {
      label: "View Details",
      icon: <Eye size={14} />,
      color: "rgb(99 102 241)",
      onClick: () => router.push(`/dashboard/billing/${bill.id}`)
    },
    {
      label: "Print Bill",
      icon: <Printer size={14} />,
      color: "var(--kravy-text-muted)",
      onClick: () => window.open(`/dashboard/billing/${bill.id}`, "_blank")
    },
    {
      label: "WhatsApp",
      icon: <MessageCircle size={14} />,
      color: "rgb(37 211 102)",
      onClick: handleWhatsApp
    },
    ...(bill.isHeld ? [{
      label: "Resume Order",
      icon: <Play size={14} />,
      color: "rgb(245 158 11)",
      onClick: () => router.push(`/dashboard/billing/checkout?resumeBillId=${bill.id}`)
    }] : []),
    {
      label: bill.paymentStatus?.toLowerCase() === "paid" ? "Mark as Pending" : "Mark as Paid",
      icon: <Clock size={14} />,
      color: bill.paymentStatus?.toLowerCase() === "paid" ? "rgb(244 63 94)" : "rgb(16 185 129)",
      onClick: async () => {
        const newStatus = bill.paymentStatus?.toLowerCase() === "paid" ? "Pending" : "Paid";
        try {
          const res = await fetch(`/api/bill-manager/${bill.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentStatus: newStatus })
          });
          if (res.ok) refresh();
          else alert("Failed to update status");
        } catch (err) {
          console.error("Status update error:", err);
          alert("Something went wrong");
        }
      }
    },
    {
      label: "Delete",
      icon: <Trash2 size={14} />,
      color: "rgb(244 63 94)",
      onClick: async () => {
        if (!confirm("Delete this bill? You can view it later in Deleted Bills.")) return;
        const res = await fetch(`/api/bill-manager/${bill.id}`, { method: "DELETE" });
        if (res.ok) refresh();
        else alert("Failed to delete bill");
      }
    }
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <button
        onClick={handleWhatsApp}
        style={{
          width: "34px", height: "34px", borderRadius: "9px",
          background: "rgba(37, 211, 102, 0.1)", border: "1px solid rgba(37, 211, 102, 0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "rgb(37, 211, 102)", transition: "all 0.2s"
        }}
        title="Share on WhatsApp"
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(37, 211, 102, 0.2)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(37, 211, 102, 0.1)"}
      >
        <MessageCircle size={16} />
      </button>

      <div style={{ position: "relative" }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: "34px", height: "34px", borderRadius: "9px",
            background: "var(--kravy-surface)", border: "1px solid var(--kravy-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "var(--kravy-text-muted)", transition: "all 0.2s"
          }}
        >
          <MoreVertical size={16} />
        </button>

        {open && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 50 }} onClick={() => setOpen(false)} />
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)",
              minWidth: "180px", borderRadius: "14px", padding: "6px",
              background: "var(--kravy-bg)",
              border: "1px solid var(--kravy-border-strong)",
              boxShadow: "var(--kravy-card-shadow)",
              zIndex: 51
            }}>
              {actions.map((a, i) => (
                <button
                  key={i}
                  onClick={() => { setOpen(false); a.onClick(); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "10px",
                    padding: "9px 12px", borderRadius: "10px", border: "none",
                    background: "transparent", color: a.color || "var(--kravy-text-secondary)",
                    fontSize: "0.85rem", fontWeight: 500, cursor: "pointer",
                    transition: "all 0.15s", textAlign: "left"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--kravy-surface)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ color: a.color }}>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}