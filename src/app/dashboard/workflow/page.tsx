"use client";
import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { kravy } from "@/lib/sounds";
import {
    LayoutDashboard, ChefHat, MapPin, CreditCard,
    Clock, Bell, TrendingUp, ArrowRight, Check,
    Flame, UtensilsCrossed, Plus, Trash2, Eye,
    Printer, X, Filter, Search, User, ChevronRight,
    Edit3, LogOut, Table as TableIcon, History,
    RotateCcw, MoreHorizontal, Zap, Star, ShieldCheck, Layers, CheckCircle2,
    Wifi, Battery, Signal
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

// --- TYPES ---
type OrderItem = {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    isVeg?: boolean;
    isNew?: boolean;
    instruction?: string;
};

type Order = {
    id: string;
    items: OrderItem[];
    total: number;
    status: "PENDING" | "PREPARING" | "READY" | "COMPLETED";
    table?: { id: string; name: string };
    customerName?: string;
    customerPhone?: string;
    createdAt: string;
    caseType?: string;
    parentOrderId?: string;
    isMerged?: boolean;
};

type TableStatus = {
    id: string;
    name: string;
    isOccupied: boolean;
    activeOrderId?: string;
    status: "FREE" | "PENDING" | "PREPARING" | "READY";
};

const TABS = [
    { key: "dashboard", label: "Terminal", icon: LayoutDashboard },
    { key: "kitchen", label: "Kitchen", icon: ChefHat },
    { key: "payment", label: "Cashier", icon: CreditCard },
    { key: "track", label: "Tracking", icon: MapPin },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function KravyPOS() {
    const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
    const [orders, setOrders] = useState<Order[]>([]);
    const [tablesList, setTablesList] = useState<TableStatus[]>([]);
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [payMethod, setPayMethod] = useState("upi");
    const [tableSearch, setTableSearch] = useState("");
    const [tableFilter, setTableFilter] = useState<"ALL" | "RUNNING" | "READY">("ALL");
    const [clock, setClock] = useState("");
    const [dateStr, setDateStr] = useState("");
    const [business, setBusiness] = useState<any>(null);

    const fetchData = async () => {
        try {
            const [ordersRes, tablesRes] = await Promise.all([
                fetch("/api/orders"),
                fetch("/api/tables")
            ]);
            if (ordersRes.ok && tablesRes.ok) {
                const ordersData: Order[] = await ordersRes.json();
                const rawTables = await tablesRes.json();
                setOrders(ordersData);
                const processed = rawTables.map((t: any) => {
                    const liveOrder = ordersData.find(o => o.table?.id === t.id && o.status !== "COMPLETED");
                    let status: "FREE" | "PENDING" | "PREPARING" | "READY" = "FREE";
                    if (liveOrder) {
                        if (liveOrder.status === "PENDING") status = "PENDING";
                        else if (liveOrder.status === "PREPARING") status = "PREPARING";
                        else if (liveOrder.status === "READY") status = "READY";
                    }
                    return { id: t.id, name: t.name, isOccupied: !!liveOrder, activeOrderId: liveOrder?.id, status };
                });
                setTablesList(processed);
            }
        } catch (err) { console.error("Polling failed", err); }
    };

    const fetchBusiness = async () => {
        try {
            const res = await fetch("/api/profile");
            if (res.ok) {
                const data = await res.json();
                setBusiness(data);
            }
        } catch (err) { console.error("Profile fetch failed", err); }
    };

    useEffect(() => {
        fetchData();
        fetchBusiness();
        const i = setInterval(fetchData, 8000);
        return () => clearInterval(i);
    }, []);
    useEffect(() => {
        const tick = () => setClock(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
        tick(); const i = setInterval(tick, 60000); return () => clearInterval(i);
    }, []);
    useEffect(() => {
        setDateStr(new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }));
    }, []);

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const res = await fetch("/api/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, status: newStatus }) });
            if (res.ok) { kravy.success(); fetchData(); toast.success(`Order → ${newStatus}`); }
        } catch { kravy.error(); toast.error("Update failed"); }
    };

    const handleCheckout = async (targetOrderId: string) => {
        const order = orders.find(o => o.id === targetOrderId);
        if (!order) return;
        try {
            const billData = { items: order.items.map(it => ({ name: it.name, price: it.price, quantity: it.quantity, total: it.price * it.quantity })), subtotal: order.total / 1.05, total: order.total, paymentMode: payMethod.toUpperCase(), paymentStatus: "Paid", customerName: order.customerName || "Walk-in" };
            const res = await fetch("/api/bill-manager", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(billData) });
            if (!res.ok) throw new Error("fail");
            await fetch("/api/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: targetOrderId, status: "COMPLETED" }) });
            kravy.payment(); toast.success("Transaction Finalized! 💰"); fetchData(); setSelectedTableId(null); setActiveTab("dashboard");
        } catch { kravy.error(); toast.error("Checkout failed"); }
    };

    const selectedTable = tablesList.find(t => t.id === selectedTableId);
    const activeOrderForSelected = orders.find(o => o.id === selectedTable?.activeOrderId);
    const filteredTables = useMemo(() => tablesList.filter(t => {
        const matchSearch = t.name.toLowerCase().includes(tableSearch.toLowerCase());
        const matchFilter = tableFilter === "ALL" || (tableFilter === "RUNNING" && t.status === "PREPARING") || (tableFilter === "READY" && t.status === "READY");
        return matchSearch && matchFilter;
    }), [tablesList, tableSearch, tableFilter]);

    const stats = {
        running: tablesList.filter(t => t.status === "PREPARING").length,
        pending: tablesList.filter(t => t.status === "PENDING").length,
        ready: tablesList.filter(t => t.status === "READY").length,
        sales: orders.filter(o => o.status === "COMPLETED").reduce((s, o) => s + o.total, 0)
    };

    const statusConfig = {
        FREE: { bg: "bg-[#F0FDF4]", text: "text-[#16A34A]", dot: "bg-[#22C55E]", ring: "ring-[#BBF7D0]", label: "Free" },
        PENDING: { bg: "bg-[#FFFBEB]", text: "text-[#D97706]", dot: "bg-[#F59E0B]", ring: "ring-[#FDE68A]", label: "Waiting" },
        PREPARING: { bg: "bg-[#FFF1F2]", text: "text-[#E11D48]", dot: "bg-[#F43F5E]", ring: "ring-[#FECDD3]", label: "Cooking" },
        READY: { bg: "bg-[#EFF6FF]", text: "text-[#2563EB]", dot: "bg-[#3B82F6]", ring: "ring-[#BFDBFE]", label: "Ready" }
    };

    return (
        <div className="kravy-root flex flex-col h-screen overflow-hidden">
            {/* ── HEADER ── */}
            <header className="kravy-header flex items-center justify-between px-8 h-[64px] shrink-0">
                {/* Brand */}
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-3">
                        <div className="kravy-logo-badge">
                            <span>K</span>
                        </div>
                        <div>
                            <div className="kravy-brand-name">Kravy <em>POS</em></div>
                            <div className="kravy-brand-sub">Restaurant Management</div>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex items-center gap-1">
                        {TABS.map(t => {
                            const Icon = t.icon;
                            const isActive = activeTab === t.key;
                            return (
                                <button
                                    key={t.key}
                                    onClick={() => { kravy.click(); setActiveTab(t.key); }}
                                    className={`kravy-nav-btn ${isActive ? "active" : ""}`}
                                >
                                    <Icon size={15} />
                                    <span>{t.label}</span>
                                    {t.key === "kitchen" && stats.pending > 0 && (
                                        <span className="kravy-nav-badge">{stats.pending}</span>
                                    )}
                                    {isActive && <div className="kravy-nav-indicator" />}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-5">
                    <div className="kravy-status-pill">
                        <span className="kravy-live-dot" />
                        <span>Live</span>
                    </div>
                    <div className="kravy-clock">
                        <div className="kravy-clock-time">{clock}</div>
                        <div className="kravy-clock-date">{dateStr}</div>
                    </div>
                    <div className="kravy-divider-v" />
                    <button className="kravy-avatar"><User size={16} /></button>
                    <button
                        onClick={() => { kravy.click(); setActiveTab("dashboard"); }}
                        className="kravy-cta-btn"
                    >
                        <Plus size={15} />
                        <span>New Order</span>
                    </button>
                </div>
            </header>

            {/* ═══ MAIN ═══ */}
            <main className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">

                    {/* ── TERMINAL TAB ── */}
                    {activeTab === "dashboard" && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex h-full gap-3 p-3"
                        >
                            {/* LEFT PANEL */}
                            <div className="kravy-panel w-[340px] shrink-0 flex flex-col overflow-hidden">
                                {/* Panel Header */}
                                <div className="p-5 border-b border-[var(--border)]">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="kravy-section-label">
                                            <Layers size={12} />
                                            Dining Tables
                                        </span>
                                        <button onClick={fetchData} className="kravy-icon-btn"><RotateCcw size={13} /></button>
                                    </div>

                                    {/* Search */}
                                    <div className="kravy-search-wrap mb-3">
                                        <Search size={13} className="kravy-search-icon" />
                                        <input
                                            type="text"
                                            placeholder="Search table..."
                                            className="kravy-search-input"
                                            value={tableSearch}
                                            onChange={e => setTableSearch(e.target.value)}
                                        />
                                    </div>

                                    {/* Filter Pills */}
                                    <div className="kravy-filter-row">
                                        {(["ALL", "RUNNING", "READY"] as const).map(f => (
                                            <button
                                                key={f}
                                                onClick={() => { kravy.click(); setTableFilter(f); }}
                                                className={`kravy-filter-btn ${tableFilter === f ? "active" : ""}`}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Tables Grid */}
                                <div className="flex-1 overflow-y-auto p-4 kravy-scrollbar">
                                    <div className="grid grid-cols-3 gap-2.5">
                                        {filteredTables.map(t => {
                                            const cfg = statusConfig[t.status];
                                            const isActive = selectedTableId === t.id;
                                            return (
                                                <motion.button
                                                    layout
                                                    key={t.id}
                                                    onClick={() => { kravy.click(); setSelectedTableId(t.id); }}
                                                    className={`kravy-table-card ${isActive ? "selected" : ""}`}
                                                    whileHover={{ y: -2 }}
                                                    whileTap={{ scale: 0.96 }}
                                                >
                                                    <div className={`kravy-table-inner ${cfg.bg} ${cfg.text} ${isActive ? `ring-2 ${cfg.ring}` : ""}`}>
                                                        <span className="kravy-table-label">TAB</span>
                                                        <span className="kravy-table-num">
                                                            {t.name?.startsWith("T-") ? t.name.slice(2) : t.name}
                                                        </span>
                                                    </div>
                                                    <span className={`kravy-table-status ${cfg.text}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                        {cfg.label}
                                                    </span>
                                                    {t.isOccupied && <span className="kravy-occupied-ring" />}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                    {filteredTables.length === 0 && (
                                        <div className="kravy-empty-state mt-16">
                                            <TableIcon size={36} strokeWidth={1.2} />
                                            <p>Sab kuch khali hai!</p>
                                        </div>
                                    )}
                                </div>

                                {/* Stats Footer */}
                                <div className="p-4 border-t border-[var(--border)]">
                                    <div className="kravy-stats-bar">
                                        <div className="kravy-stat">
                                            <span className="kravy-stat-num cooking">{stats.running}</span>
                                            <span className="kravy-stat-lbl">Cooking</span>
                                        </div>
                                        <div className="kravy-stat-divider" />
                                        <div className="kravy-stat">
                                            <span className="kravy-stat-num waiting">{stats.pending}</span>
                                            <span className="kravy-stat-lbl">Waiting</span>
                                        </div>
                                        <div className="kravy-stat-divider" />
                                        <div className="kravy-stat">
                                            <span className="kravy-stat-num done">{stats.ready}</span>
                                            <span className="kravy-stat-lbl">Done</span>
                                        </div>
                                        <div className="kravy-stat-divider" />
                                        <div className="kravy-stat">
                                            <span className="kravy-stat-num sales">₹{stats.sales}</span>
                                            <span className="kravy-stat-lbl">Sales</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT PANEL */}
                            <div className="kravy-panel flex-1 flex flex-col overflow-hidden">
                                {selectedTable ? (
                                    <motion.div
                                        key={selectedTable.id}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="h-full flex flex-col"
                                    >
                                        {/* Order Header */}
                                        <div className="kravy-order-header">
                                            <div className="flex items-center gap-4">
                                                <motion.div
                                                    initial={{ rotate: -10, scale: 0.8 }}
                                                    animate={{ rotate: 0, scale: 1 }}
                                                    className="kravy-table-avatar"
                                                >
                                                    {selectedTable.name}
                                                </motion.div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h2 className="kravy-order-title">
                                                            {activeOrderForSelected?.customerName || "Walk-in Customer"}
                                                        </h2>
                                                        <span className="kravy-live-tag">● Live</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 kravy-order-meta">
                                                        <span><User size={11} /> 4 Guests</span>
                                                        <span className="kravy-meta-dot" />
                                                        <span><ShieldCheck size={11} /> Rahul S.</span>
                                                        {activeOrderForSelected && (
                                                            <>
                                                                <span className="kravy-meta-dot" />
                                                                <span>{activeOrderForSelected.items.length} items</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="kravy-icon-btn"><MoreHorizontal size={18} /></button>
                                                <button className="kravy-icon-btn"><Edit3 size={16} /></button>
                                                <div className="kravy-divider-v h-8" />
                                                <button className="kravy-cta-btn"><Plus size={14} /> Add Item</button>
                                            </div>
                                        </div>

                                        {/* Items */}
                                        <div className="flex-1 overflow-y-auto px-6 py-4 kravy-scrollbar">
                                            {activeOrderForSelected ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between px-2 mb-3">
                                                        <span className="kravy-section-label"><Zap size={11} /> Order Breakdown</span>
                                                        <span className="kravy-priority-tag">Kitchen Priority: HIGH</span>
                                                    </div>
                                                    {activeOrderForSelected.items.map((item, idx) => (
                                                        <motion.div
                                                            key={idx}
                                                            initial={{ opacity: 0, y: 8 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: idx * 0.04 }}
                                                            className="kravy-item-row group"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`kravy-item-icon ${item.isVeg === false ? "nonveg" : "veg"}`}>
                                                                    {item.isVeg === false ? "🍗" : "🥗"}
                                                                </div>
                                                                <div>
                                                                    <p className="kravy-item-name">{item.name}</p>
                                                                    <p className="kravy-item-meta">
                                                                        ₹{item.price}
                                                                        {item.instruction && <span> · {item.instruction}</span>}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-6">
                                                                <div className="kravy-qty-ctrl">
                                                                    <button>−</button>
                                                                    <span>{item.quantity}</span>
                                                                    <button>+</button>
                                                                </div>
                                                                <span className="kravy-item-total">₹{item.price * item.quantity}</span>
                                                                <button className="kravy-delete-btn opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="kravy-empty-state h-full">
                                                    <UtensilsCrossed size={64} strokeWidth={0.8} />
                                                    <p>Table selected. No active order.</p>
                                                    <button className="kravy-cta-btn mt-4">Start Dining Session</button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="kravy-order-footer">
                                            <div className="flex gap-3 mb-3">
                                                <div className="flex-1 kravy-workflow-box">
                                                    <span className="kravy-section-label mb-3 block"><Clock size={11} /> Workflow</span>
                                                    <div className="flex gap-2">
                                                        {[
                                                            { s: "PREPARING", label: "Start Cooking", icon: <ChefHat size={13} />, active: activeOrderForSelected?.status === "PENDING" },
                                                            { s: "READY", label: "Mark Ready", icon: <Check size={13} />, active: activeOrderForSelected?.status === "PREPARING" },
                                                        ].map((btn, i) => (
                                                            <button
                                                                key={i}
                                                                disabled={!activeOrderForSelected || !btn.active}
                                                                onClick={() => updateOrderStatus(activeOrderForSelected!.id, btn.s)}
                                                                className={`kravy-workflow-btn ${btn.active ? "active" : "disabled"}`}
                                                            >
                                                                {btn.icon} {btn.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="kravy-total-box">
                                                    <span>Total</span>
                                                    <strong>₹{activeOrderForSelected?.total ?? "—"}</strong>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => window.print()}
                                                    className="kravy-secondary-btn flex-1"
                                                >
                                                    <Printer size={15} /> KOT Token
                                                </button>
                                                <button
                                                    disabled={!activeOrderForSelected}
                                                    onClick={() => { kravy.payment(); setActiveTab("payment"); }}
                                                    className="kravy-primary-btn flex-[2]"
                                                >
                                                    <CreditCard size={16} /> Proceed to Billing
                                                    <ArrowRight size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="kravy-empty-state h-full">
                                        <div className="kravy-empty-icon">
                                            <TableIcon size={32} strokeWidth={1.2} />
                                        </div>
                                        <p className="kravy-empty-title">Select a Table</p>
                                        <p className="kravy-empty-sub">Click any table to view active orders</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ── KITCHEN (KDS) TAB ── */}
                    {activeTab === "kitchen" && (
                        <motion.div
                            key="kitchen"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col p-5 gap-5"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="kravy-page-title">Kitchen Display</h2>
                                    <div className="kravy-page-sub">
                                        <span className="kravy-live-dot" /> Live from Chef Hub
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="kravy-info-chip">
                                        <Flame size={15} className="text-[var(--accent)]" />
                                        <span>{stats.running} Active</span>
                                    </div>
                                    <button onClick={fetchData} className="kravy-icon-btn"><RotateCcw size={16} /></button>
                                </div>
                            </div>

                            <div className="flex-1 flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                                {[
                                    { status: "PENDING", title: "New Orders", emoji: "🔔", next: "PREPARING", btnLabel: "Start Cooking", color: "rose" },
                                    { status: "PREPARING", title: "In Preparation", emoji: "🍳", next: "READY", btnLabel: "Mark Ready", color: "amber" },
                                    { status: "READY", title: "Ready to Serve", emoji: "✅", next: "COMPLETED", btnLabel: "Handed Over", color: "emerald" },
                                ].map(col => {
                                    const colOrders = orders.filter(o => o.status === col.status);
                                    return (
                                        <div key={col.status} className={`kravy-kds-col kds-${col.color} flex-shrink-0 w-[320px] flex flex-col`}>
                                            <div className="kravy-kds-col-header">
                                                <div className="flex items-center gap-2">
                                                    <span>{col.emoji}</span>
                                                    <span className="kravy-section-label">{col.title}</span>
                                                </div>
                                                <span className={`kravy-count-badge count-${col.color}`}>{colOrders.length}</span>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-3 space-y-3 kravy-scrollbar">
                                                {colOrders.map(o => (
                                                    <motion.div
                                                        key={o.id}
                                                        initial={{ opacity: 0, scale: 0.96 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="kravy-kds-card"
                                                    >
                                                        <div className="kravy-kds-card-head">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`kravy-kds-table badge-${col.color}`}>{o.table?.name}</div>
                                                                <div>
                                                                    <p className="kravy-order-id">#{o.id.slice(-4).toUpperCase()}</p>
                                                                    <p className="kravy-time-ago">5m ago</p>
                                                                </div>
                                                            </div>
                                                            <span className="kravy-items-count">{o.items.length} items</span>
                                                        </div>
                                                        <div className="kravy-kds-items">
                                                            {o.items.map((it, idx) => (
                                                                <div key={idx} className="kravy-kds-item">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`kravy-dot ${it.isVeg === false ? "dot-red" : "dot-green"}`} />
                                                                        <span>{it.name}</span>
                                                                    </div>
                                                                    <span className="kravy-kds-qty">×{it.quantity}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <button
                                                            onClick={() => updateOrderStatus(o.id, col.next)}
                                                            className={`kravy-kds-action-btn action-${col.color}`}
                                                        >
                                                            {col.btnLabel}
                                                        </button>
                                                    </motion.div>
                                                ))}
                                                {colOrders.length === 0 && (
                                                    <div className="kravy-empty-state py-16">
                                                        <ChefHat size={48} strokeWidth={0.8} />
                                                        <p>Chill Mode 😌</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* ── CASHIER / BILLING TAB ── */}
                    {activeTab === "payment" && (
                        <motion.div
                            key="payment"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex items-center justify-center p-8"
                        >
                            {selectedTable && activeOrderForSelected ? (
                                <div className="kravy-billing-grid">
                                    {/* Receipt */}
                                    <div className="kravy-receipt thermal-receipt">
                                        <div className="kravy-receipt-header">
                                            {business?.logoUrl && <img src={business.logoUrl} alt="Logo" className="w-10 h-10 object-contain mx-auto mb-2 hidden print:block" />}
                                            <div className="kravy-receipt-logo print:hidden"><Printer size={22} /></div>
                                            <h3 className="print:text-sm print:font-bold">{business?.businessName || "Kravy Receipt"}</h3>
                                            <p className="print:text-[9px]">Table {selectedTable.name} · #{activeOrderForSelected.id.slice(-6).toUpperCase()}</p>
                                            {business?.businessAddress && <p className="hidden print:block text-[8px] opacity-70">{business.businessAddress}</p>}
                                        </div>

                                        <div className="flex-1 overflow-y-auto kravy-scrollbar py-4 space-y-3 print:overflow-visible print:py-2">
                                            {activeOrderForSelected.items.map((it, idx) => (
                                                <div key={idx} className="kravy-receipt-item print:flex print:justify-between print:text-[11px] print:mb-1">
                                                    <div className="print:flex-1">
                                                        <p className="kravy-receipt-item-name print:font-bold">{it.name}</p>
                                                        <p className="kravy-receipt-item-meta print:text-[10px]">{it.quantity} × ₹{it.price}</p>
                                                    </div>
                                                    <span className="kravy-receipt-item-price print:font-bold">₹{it.price * it.quantity}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="kravy-receipt-totals print:mt-2 print:pt-2 print:border-t print:border-dashed print:border-black">
                                            <div className="kravy-total-row print:flex print:justify-between print:text-[10px] print:mb-1">
                                                <span>Subtotal</span>
                                                <span>₹{(activeOrderForSelected.total / 1.05).toFixed(0)}</span>
                                            </div>
                                            <div className="kravy-total-row print:flex print:justify-between print:text-[10px] print:mb-1">
                                                <span>GST 5%</span>
                                                <span>₹{(activeOrderForSelected.total - activeOrderForSelected.total / 1.05).toFixed(0)}</span>
                                            </div>
                                            <div className="kravy-total-final print:flex print:justify-between print:items-center print:mt-1 print:pt-1 print:border-t print:border-black">
                                                <span className="print:text-[11px] print:font-bold">Total</span>
                                                <span className="print:text-[16px] print:font-bold">₹{activeOrderForSelected.total}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Panel */}
                                    <div className="kravy-payment-panel">
                                        <h3 className="kravy-page-title mb-1">Payment</h3>
                                        <p className="kravy-page-sub mb-6">Choose payment method to close this order</p>

                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            {[
                                                { id: "upi", label: "UPI Scan", emoji: "📱", desc: "GPay / PhonePe" },
                                                { id: "cash", label: "Cash", emoji: "💵", desc: "Hand to staff" },
                                                { id: "card", label: "Card", emoji: "💳", desc: "Chip & Pin" },
                                                { id: "split", label: "Split", emoji: "✂️", desc: "Multiple ways" },
                                            ].map(m => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => { kravy.click(); setPayMethod(m.id); }}
                                                    className={`kravy-pay-method ${payMethod === m.id ? "active" : ""}`}
                                                >
                                                    {payMethod === m.id && <CheckCircle2 size={14} className="absolute top-3 right-3 text-[var(--accent)]" />}
                                                    <span className="text-2xl mb-1">{m.emoji}</span>
                                                    <span className="kravy-pay-label">{m.label}</span>
                                                    <span className="kravy-pay-desc">{m.desc}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="kravy-pay-info">
                                            {payMethod === "upi" ? (
                                                <div className="flex items-center gap-5">
                                                    <div className="kravy-qr-box">💎</div>
                                                    <div>
                                                        <p className="font-semibold text-[var(--text-primary)] mb-1">Scan to pay ₹{activeOrderForSelected.total}</p>
                                                        <p className="text-sm text-[var(--text-muted)]">Open GPay / PhonePe and scan QR</p>
                                                        <div className="kravy-listening">
                                                            <span className="kravy-live-dot" /> Listening for payment...
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p className="font-semibold text-[var(--text-primary)]">Collect {payMethod.toUpperCase()} payment</p>
                                                    <p className="text-sm text-[var(--text-muted)] mt-1">Confirm once bill is settled.</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <button
                                                onClick={() => window.print()}
                                                className="kravy-secondary-btn flex-1"
                                            >
                                                <Printer size={15} /> Print Bill
                                            </button>
                                            <button
                                                onClick={() => handleCheckout(activeOrderForSelected.id)}
                                                className="kravy-primary-btn flex-[2]"
                                            >
                                                Close Table <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="kravy-empty-state text-center max-w-xs">
                                    <div className="kravy-empty-icon mx-auto mb-4"><CreditCard size={28} strokeWidth={1.2} /></div>
                                    <p className="kravy-empty-title">Billing Vault</p>
                                    <p className="kravy-empty-sub mb-6">Select an active table from Terminal to process billing.</p>
                                    <button onClick={() => setActiveTab("dashboard")} className="kravy-primary-btn">
                                        <LayoutDashboard size={15} /> Go to Terminal
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── TRACKING TAB ── */}
                    {activeTab === "track" && (
                        <motion.div
                            key="track"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex gap-8 p-8 items-start"
                        >
                            <div className="max-w-xs pt-8">
                                <div className="kravy-track-icon mb-6"><MapPin size={24} /></div>
                                <h2 className="kravy-page-title text-4xl mb-3">Order Tracking</h2>
                                <p className="text-[var(--text-muted)] leading-relaxed">
                                    Saare running aur upcoming orders ka live timeline. Real-time updates from kitchen.
                                </p>
                                <div className="flex gap-4 mt-8">
                                    <div className="kravy-track-stat">
                                        <strong>{stats.pending}</strong>
                                        <span>Pending</span>
                                    </div>
                                    <div className="kravy-track-stat">
                                        <strong>{stats.running}</strong>
                                        <span>Cooking</span>
                                    </div>
                                    <div className="kravy-track-stat">
                                        <strong>{stats.ready}</strong>
                                        <span>Ready</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto kravy-scrollbar pt-4 max-h-full">
                                <div className="space-y-3 max-w-[560px]">
                                    {orders.filter(o => o.status !== "COMPLETED").map((o, idx) => (
                                        <motion.div
                                            key={o.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.07 }}
                                            className="kravy-track-card"
                                        >
                                            <div className={`kravy-track-badge badge-${o.status.toLowerCase()}`}>
                                                {o.table?.name}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-[var(--text-primary)] text-sm">
                                                    {o.customerName || "Walk-in"} · #{o.id.slice(-4).toUpperCase()}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`kravy-status-tag status-${o.status.toLowerCase()}`}>{o.status}</span>
                                                    <span className="text-xs text-[var(--text-muted)]">{o.items.length} items</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => window.location.href = `/order-tracking/${o.id}`}
                                                className="kravy-icon-btn"
                                            >
                                                <ArrowRight size={16} />
                                            </button>
                                        </motion.div>
                                    ))}
                                    {orders.filter(o => o.status !== "COMPLETED").length === 0 && (
                                        <div className="kravy-empty-state py-20">
                                            <span className="text-5xl">😌</span>
                                            <p>Sab kuch serve ho gaya!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* ═══ STYLES ═══ */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400;1,9..40,600&family=DM+Mono:wght@400;500&display=swap');

                @media print {
                    @page {
                        size: 58mm auto;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        width: 58mm;
                        background: white !important;
                    }
                    /* Hide everything except the receipt */
                    .kravy-root > *:not(main),
                    main > *:not(.kravy-billing-grid),
                    .kravy-billing-grid > *:not(.kravy-receipt),
                    header, nav, .kravy-panel, .kravy-page-title, .kravy-page-sub, .kravy-payment-panel {
                        display: none !important;
                    }
                    .kravy-receipt {
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 58mm !important;
                        height: auto !important;
                        max-height: none !important;
                        padding: 4mm 2mm !important;
                        margin: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        visibility: visible !important;
                        background: white !important;
                        font-family: 'DM Mono', monospace !important;
                        color: black !important;
                    }
                    .kravy-receipt * {
                        visibility: visible !important;
                        color: black !important;
                        border-color: black !important;
                        background: transparent !important;
                    }
                    .kravy-scrollbar { overflow: visible !important; }
                    .kravy-receipt-header { border-bottom: 1px dashed black !important; padding-bottom: 2mm !important; }
                    .kravy-receipt-totals { border-top: 1px dashed black !important; }
                    .kravy-total-final span:last-child { color: black !important; font-size: 18px !important; font-weight: bold !important; }
                    img { filter: grayscale(100%) contrast(200%); }
                }

                :root {
                    --accent:       #E8490F;
                    --accent-light: #FFF0EB;
                    --accent-hover: #C93D09;
                    --bg:           #F6F4F1;
                    --surface:      #FFFFFF;
                    --surface-2:    #FAFAF9;
                    --border:       #EBEBEB;
                    --border-hover: #D4D4D4;
                    --text-primary: #1A1A1A;
                    --text-sec:     #4A4A4A;
                    --text-muted:   #8A8A8A;
                    --shadow-sm:    0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
                    --shadow-md:    0 4px 12px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04);
                    --shadow-lg:    0 8px 32px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04);
                    --radius-sm:    10px;
                    --radius-md:    16px;
                    --radius-lg:    22px;
                    --radius-xl:    32px;
                }

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                .kravy-root {
                    font-family: 'DM Sans', -apple-system, sans-serif;
                    background: var(--bg);
                    color: var(--text-primary);
                    -webkit-font-smoothing: antialiased;
                }

                /* ── HEADER ── */
                .kravy-header {
                    background: var(--surface);
                    border-bottom: 1px solid var(--border);
                    box-shadow: var(--shadow-sm);
                    position: relative;
                    z-index: 100;
                }

                .kravy-logo-badge {
                    width: 34px; height: 34px;
                    background: var(--accent);
                    border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    font-family: 'DM Mono', monospace;
                    font-size: 16px; font-weight: 700;
                    color: white;
                    box-shadow: 0 4px 12px rgba(232,73,15,0.3);
                    flex-shrink: 0;
                }

                .kravy-brand-name {
                    font-size: 15px; font-weight: 700;
                    color: var(--text-primary); letter-spacing: -0.3px;
                    line-height: 1.1;
                }
                .kravy-brand-name em { color: var(--accent); font-style: normal; }
                .kravy-brand-sub {
                    font-size: 10px; font-weight: 500;
                    color: var(--text-muted); letter-spacing: 0.4px;
                    text-transform: uppercase; margin-top: 1px;
                }

                /* Nav */
                .kravy-nav-btn {
                    position: relative;
                    display: flex; align-items: center; gap: 6px;
                    padding: 6px 14px;
                    border: none; background: transparent;
                    font-family: inherit; font-size: 12px; font-weight: 600;
                    color: var(--text-muted);
                    border-radius: var(--radius-sm);
                    cursor: pointer; transition: color 0.15s;
                    white-space: nowrap;
                }
                .kravy-nav-btn:hover { color: var(--text-primary); background: var(--surface-2); }
                .kravy-nav-btn.active { color: var(--accent); }
                .kravy-nav-indicator {
                    position: absolute; bottom: -17px; left: 14px; right: 14px;
                    height: 2px; background: var(--accent);
                    border-radius: 2px 2px 0 0;
                }
                .kravy-nav-badge {
                    width: 16px; height: 16px;
                    background: #EF4444; color: white;
                    border-radius: 50%;
                    font-size: 9px; font-weight: 700;
                    display: flex; align-items: center; justify-content: center;
                    animation: pulse 2s infinite;
                }

                /* Header right */
                .kravy-status-pill {
                    display: flex; align-items: center; gap: 5px;
                    padding: 4px 10px;
                    background: #F0FDF4; border: 1px solid #BBF7D0;
                    border-radius: 99px;
                    font-size: 11px; font-weight: 600; color: #16A34A;
                }
                .kravy-live-dot {
                    width: 6px; height: 6px;
                    background: #22C55E; border-radius: 50%;
                    display: inline-block;
                    animation: pulse 1.5s infinite;
                }
                .kravy-clock { text-align: right; }
                .kravy-clock-time { font-family: 'DM Mono', monospace; font-size: 14px; font-weight: 500; color: var(--text-primary); line-height: 1; }
                .kravy-clock-date { font-size: 10px; color: var(--text-muted); margin-top: 2px; }
                .kravy-divider-v { width: 1px; background: var(--border); align-self: stretch; }
                .kravy-avatar {
                    width: 32px; height: 32px;
                    background: var(--surface-2); border: 1px solid var(--border);
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    color: var(--text-muted); cursor: pointer;
                    transition: border-color 0.15s;
                }
                .kravy-avatar:hover { border-color: var(--accent); color: var(--accent); }

                /* Buttons */
                .kravy-cta-btn {
                    display: flex; align-items: center; gap: 6px;
                    padding: 8px 16px;
                    background: var(--accent); color: white;
                    border: none; border-radius: var(--radius-sm);
                    font-family: inherit; font-size: 12px; font-weight: 600;
                    cursor: pointer; transition: all 0.15s;
                    box-shadow: 0 2px 8px rgba(232,73,15,0.25);
                    white-space: nowrap;
                }
                .kravy-cta-btn:hover { background: var(--accent-hover); box-shadow: 0 4px 12px rgba(232,73,15,0.3); }
                .kravy-cta-btn:active { transform: scale(0.97); }
                .kravy-cta-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

                .kravy-primary-btn {
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    padding: 0 20px; height: 44px;
                    background: var(--accent); color: white;
                    border: none; border-radius: var(--radius-md);
                    font-family: inherit; font-size: 13px; font-weight: 600;
                    cursor: pointer; transition: all 0.15s;
                    box-shadow: 0 4px 12px rgba(232,73,15,0.25);
                }
                .kravy-primary-btn:hover { background: var(--accent-hover); }
                .kravy-primary-btn:active { transform: scale(0.98); }
                .kravy-primary-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

                .kravy-secondary-btn {
                    display: flex; align-items: center; justify-content: center; gap: 7px;
                    padding: 0 16px; height: 44px;
                    background: var(--surface); color: var(--text-sec);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    font-family: inherit; font-size: 13px; font-weight: 500;
                    cursor: pointer; transition: all 0.15s;
                }
                .kravy-secondary-btn:hover { border-color: var(--border-hover); background: var(--surface-2); }

                .kravy-icon-btn {
                    width: 34px; height: 34px;
                    background: var(--surface-2); border: 1px solid var(--border);
                    border-radius: var(--radius-sm);
                    display: flex; align-items: center; justify-content: center;
                    color: var(--text-muted); cursor: pointer;
                    transition: all 0.15s;
                }
                .kravy-icon-btn:hover { border-color: var(--border-hover); color: var(--text-primary); }

                /* ── PANEL ── */
                .kravy-panel {
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-xl);
                    box-shadow: var(--shadow-sm);
                    overflow: hidden;
                }

                /* ── SECTION LABEL ── */
                .kravy-section-label {
                    display: flex; align-items: center; gap: 5px;
                    font-size: 10px; font-weight: 700;
                    color: var(--text-muted);
                    text-transform: uppercase; letter-spacing: 0.8px;
                }

                /* ── SEARCH ── */
                .kravy-search-wrap {
                    position: relative;
                    display: flex; align-items: center;
                }
                .kravy-search-icon {
                    position: absolute; left: 11px;
                    color: var(--text-muted); pointer-events: none;
                }
                .kravy-search-input {
                    width: 100%;
                    background: var(--surface-2); border: 1px solid var(--border);
                    border-radius: var(--radius-sm);
                    padding: 8px 12px 8px 32px;
                    font-family: inherit; font-size: 12px; font-weight: 500;
                    color: var(--text-primary);
                    outline: none; transition: border-color 0.15s;
                }
                .kravy-search-input::placeholder { color: var(--text-muted); }
                .kravy-search-input:focus { border-color: var(--accent); }

                /* ── FILTER ── */
                .kravy-filter-row {
                    display: flex; gap: 3px;
                    background: var(--surface-2);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-sm);
                    padding: 3px;
                }
                .kravy-filter-btn {
                    flex: 1; padding: 5px 8px;
                    border: none; background: transparent;
                    border-radius: 7px;
                    font-family: inherit; font-size: 10px; font-weight: 700;
                    color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;
                    cursor: pointer; transition: all 0.15s;
                }
                .kravy-filter-btn.active {
                    background: var(--surface); color: var(--text-primary);
                    box-shadow: var(--shadow-sm);
                }

                /* ── TABLE CARD ── */
                .kravy-table-card {
                    position: relative;
                    aspect-ratio: 1;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center; gap: 5px;
                    border: 2px solid transparent;
                    border-radius: var(--radius-md);
                    background: var(--surface-2);
                    cursor: pointer; transition: all 0.15s;
                    padding: 8px;
                }
                .kravy-table-card:hover { background: var(--surface); border-color: var(--border); box-shadow: var(--shadow-sm); }
                .kravy-table-card.selected { border-color: var(--accent); background: var(--accent-light); box-shadow: 0 0 0 3px rgba(232,73,15,0.08); }

                .kravy-table-inner {
                    width: 48px; height: 48px;
                    border-radius: 12px;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    border: 1.5px solid transparent;
                    transition: all 0.15s;
                }
                .kravy-table-label { font-size: 7px; font-weight: 700; opacity: 0.5; text-transform: uppercase; line-height: 1; margin-bottom: 1px; }
                .kravy-table-num { font-family: 'DM Mono', monospace; font-size: 18px; font-weight: 700; line-height: 1; }
                .kravy-table-status {
                    font-size: 8px; font-weight: 700;
                    text-transform: uppercase; letter-spacing: 0.5px;
                    display: flex; align-items: center; gap: 3px;
                }
                .kravy-occupied-ring {
                    position: absolute; top: 6px; right: 6px;
                    width: 7px; height: 7px;
                    background: #F43F5E; border-radius: 50%;
                    box-shadow: 0 0 0 2px white;
                    animation: pulse 1.5s infinite;
                }

                /* ── STATS BAR ── */
                .kravy-stats-bar {
                    display: flex; align-items: center;
                    background: var(--text-primary);
                    border-radius: var(--radius-md);
                    padding: 12px 16px;
                }
                .kravy-stat { flex: 1; text-align: center; }
                .kravy-stat-num { display: block; font-family: 'DM Mono', monospace; font-size: 16px; font-weight: 600; line-height: 1; margin-bottom: 3px; }
                .kravy-stat-num.cooking { color: #FB7185; }
                .kravy-stat-num.waiting { color: #FCD34D; }
                .kravy-stat-num.done    { color: #4ADE80; }
                .kravy-stat-num.sales   { color: var(--accent); font-size: 12px; }
                .kravy-stat-lbl { font-size: 9px; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
                .kravy-stat-divider { width: 1px; height: 28px; background: rgba(255,255,255,0.08); }

                /* ── ORDER HEADER ── */
                .kravy-order-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--border);
                    display: flex; align-items: center; justify-content: space-between;
                    background: var(--surface);
                }
                .kravy-table-avatar {
                    width: 52px; height: 52px;
                    background: var(--accent); color: white;
                    border-radius: var(--radius-md);
                    display: flex; align-items: center; justify-content: center;
                    font-family: 'DM Mono', monospace;
                    font-size: 18px; font-weight: 700;
                    box-shadow: 0 4px 12px rgba(232,73,15,0.25);
                    flex-shrink: 0;
                }
                .kravy-order-title {
                    font-size: 18px; font-weight: 700;
                    color: var(--text-primary); letter-spacing: -0.3px;
                }
                .kravy-live-tag {
                    font-size: 10px; font-weight: 700;
                    color: #16A34A; background: #F0FDF4;
                    border: 1px solid #BBF7D0;
                    padding: 2px 8px; border-radius: 99px;
                }
                .kravy-order-meta {
                    display: flex; align-items: center;
                    font-size: 11px; font-weight: 500; color: var(--text-muted);
                }
                .kravy-order-meta svg { opacity: 0.6; }
                .kravy-meta-dot { width: 3px; height: 3px; background: var(--border); border-radius: 50%; margin: 0 4px; }
                .kravy-priority-tag {
                    font-size: 10px; font-weight: 700;
                    color: var(--accent); background: var(--accent-light);
                    padding: 3px 8px; border-radius: 6px;
                    text-transform: uppercase; letter-spacing: 0.5px;
                }

                /* ── ITEM ROW ── */
                .kravy-item-row {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 12px 14px;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    background: var(--surface);
                    transition: all 0.15s;
                }
                .kravy-item-row:hover { border-color: var(--border-hover); box-shadow: var(--shadow-sm); }
                .kravy-item-icon {
                    width: 40px; height: 40px;
                    border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 18px; flex-shrink: 0;
                }
                .kravy-item-icon.veg    { background: #F0FDF4; }
                .kravy-item-icon.nonveg { background: #FFF1F2; }
                .kravy-item-name { font-size: 13px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.2px; }
                .kravy-item-meta { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
                .kravy-qty-ctrl {
                    display: flex; align-items: center; gap: 10px;
                    background: var(--surface-2); border: 1px solid var(--border);
                    border-radius: var(--radius-sm);
                    padding: 5px 10px;
                }
                .kravy-qty-ctrl button { font-size: 16px; color: var(--text-muted); background: none; border: none; cursor: pointer; line-height: 1; transition: color 0.1s; }
                .kravy-qty-ctrl button:hover { color: var(--accent); }
                .kravy-qty-ctrl span { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 600; color: var(--text-primary); min-width: 16px; text-align: center; }
                .kravy-item-total { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 600; color: var(--text-primary); min-width: 64px; text-align: right; }
                .kravy-delete-btn {
                    width: 30px; height: 30px;
                    background: #FFF1F2; border: none; border-radius: 8px;
                    color: #F43F5E; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.15s;
                }
                .kravy-delete-btn:hover { background: #F43F5E; color: white; }

                /* ── ORDER FOOTER ── */
                .kravy-order-footer {
                    padding: 16px 24px;
                    border-top: 1px solid var(--border);
                    background: var(--surface);
                }
                .kravy-workflow-box {
                    flex: 1;
                    background: var(--surface-2); border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    padding: 14px 16px;
                }
                .kravy-workflow-btn {
                    flex: 1; height: 38px;
                    border-radius: var(--radius-sm);
                    border: 1px solid var(--border);
                    background: var(--surface);
                    display: flex; align-items: center; justify-content: center; gap: 5px;
                    font-family: inherit; font-size: 11px; font-weight: 600;
                    color: var(--text-muted);
                    cursor: pointer; transition: all 0.15s;
                }
                .kravy-workflow-btn.active {
                    background: var(--text-primary); color: white;
                    border-color: var(--text-primary);
                    box-shadow: var(--shadow-sm);
                }
                .kravy-workflow-btn.active:hover { background: var(--accent); border-color: var(--accent); }
                .kravy-workflow-btn.disabled { opacity: 0.4; cursor: not-allowed; }
                .kravy-total-box {
                    width: 130px;
                    background: var(--text-primary);
                    border-radius: var(--radius-md);
                    padding: 14px 18px;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    color: white;
                }
                .kravy-total-box span { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #666; margin-bottom: 4px; }
                .kravy-total-box strong { font-family: 'DM Mono', monospace; font-size: 22px; font-weight: 600; color: white; letter-spacing: -0.5px; }

                /* ── EMPTY STATE ── */
                .kravy-empty-state {
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    gap: 8px; color: var(--text-muted);
                    font-size: 12px; font-weight: 500;
                }
                .kravy-empty-icon {
                    width: 56px; height: 56px;
                    background: var(--surface-2); border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    display: flex; align-items: center; justify-content: center;
                    color: #CCCCC5;
                }
                .kravy-empty-title { font-size: 16px; font-weight: 700; color: var(--text-sec); }
                .kravy-empty-sub { font-size: 12px; color: var(--text-muted); text-align: center; }

                /* ── PAGE TITLE ── */
                .kravy-page-title { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; color: var(--text-primary); }
                .kravy-page-sub { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 5px; }
                .kravy-info-chip {
                    display: flex; align-items: center; gap: 6px;
                    background: var(--surface); border: 1px solid var(--border);
                    border-radius: var(--radius-sm);
                    padding: 6px 12px;
                    font-size: 12px; font-weight: 600; color: var(--text-sec);
                }

                /* ── KDS ── */
                .kravy-kds-col {
                    border-radius: var(--radius-xl);
                    border: 1px solid var(--border);
                    background: var(--surface);
                    overflow: hidden;
                }
                .kravy-kds-col-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 14px 16px;
                    border-bottom: 1px solid var(--border);
                }
                .kravy-count-badge {
                    padding: 2px 10px; border-radius: 99px;
                    font-size: 11px; font-weight: 700; color: white;
                }
                .count-rose    { background: #F43F5E; }
                .count-amber   { background: #F59E0B; }
                .count-emerald { background: #10B981; }

                .kravy-kds-card {
                    background: var(--surface-2); border: 1px solid var(--border);
                    border-radius: var(--radius-lg);
                    overflow: hidden; transition: all 0.15s;
                }
                .kravy-kds-card:hover { box-shadow: var(--shadow-md); border-color: var(--border-hover); }
                .kravy-kds-card-head {
                    padding: 12px 14px;
                    border-bottom: 1px solid var(--border);
                    display: flex; align-items: center; justify-content: space-between;
                    background: var(--surface);
                }
                .kravy-kds-table {
                    width: 38px; height: 38px;
                    border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    font-family: 'DM Mono', monospace;
                    font-size: 15px; font-weight: 700; color: white;
                    flex-shrink: 0;
                }
                .badge-rose    { background: #F43F5E; }
                .badge-amber   { background: #F59E0B; }
                .badge-emerald { background: #10B981; }
                .badge-pending   { background: #F59E0B; }
                .badge-preparing { background: #F43F5E; }
                .badge-ready     { background: #3B82F6; }

                .kravy-order-id { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--text-muted); }
                .kravy-time-ago { font-size: 10px; color: var(--accent); font-weight: 600; }
                .kravy-items-count { font-size: 10px; font-weight: 600; color: var(--text-muted); }

                .kravy-kds-items { padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; }
                .kravy-kds-item {
                    display: flex; align-items: center; justify-content: space-between;
                    font-size: 12px; font-weight: 500; color: var(--text-sec);
                }
                .kravy-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
                .dot-green { background: #22C55E; }
                .dot-red   { background: #F43F5E; }
                .kravy-kds-qty {
                    font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 600;
                    background: var(--bg); color: var(--text-sec);
                    padding: 2px 7px; border-radius: 6px;
                }
                .kravy-kds-action-btn {
                    display: block; width: calc(100% - 28px);
                    margin: 0 14px 14px;
                    padding: 10px;
                    border: none; border-radius: var(--radius-sm);
                    font-family: inherit; font-size: 11px; font-weight: 700;
                    text-transform: uppercase; letter-spacing: 0.5px;
                    color: white; cursor: pointer; transition: all 0.15s;
                }
                .action-rose    { background: #F43F5E; }
                .action-rose:hover { background: #E11D48; }
                .action-amber   { background: #F59E0B; }
                .action-amber:hover { background: #D97706; }
                .action-emerald { background: #10B981; }
                .action-emerald:hover { background: #059669; }
                .kravy-kds-action-btn:active { transform: scale(0.98); }

                /* ── BILLING ── */
                .kravy-billing-grid {
                    display: grid; grid-template-columns: 400px 1fr;
                    gap: 40px; max-width: 960px; width: 100%;
                }
                .kravy-receipt {
                    background: var(--surface); border: 1px solid var(--border);
                    border-radius: var(--radius-xl); padding: 28px;
                    display: flex; flex-direction: column;
                    max-height: calc(100vh - 160px); overflow: hidden;
                    box-shadow: var(--shadow-lg);
                }
                .kravy-receipt-header { text-align: center; padding-bottom: 20px; border-bottom: 2px dashed var(--border); margin-bottom: 4px; }
                .kravy-receipt-logo {
                    width: 52px; height: 52px;
                    background: var(--accent); color: white;
                    border-radius: var(--radius-md);
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 12px;
                    box-shadow: 0 4px 12px rgba(232,73,15,0.25);
                }
                .kravy-receipt-header h3 { font-size: 20px; font-weight: 700; letter-spacing: -0.3px; color: var(--text-primary); }
                .kravy-receipt-header p { font-size: 11px; color: var(--text-muted); margin-top: 3px; font-family: 'DM Mono', monospace; }
                .kravy-receipt-item { display: flex; justify-content: space-between; align-items: flex-start; }
                .kravy-receipt-item-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
                .kravy-receipt-item-meta { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
                .kravy-receipt-item-price { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; }
                .kravy-receipt-totals { border-top: 1px solid var(--border); padding-top: 16px; margin-top: 4px; space-y: 8px; }
                .kravy-total-row { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); padding: 4px 0; }
                .kravy-total-final {
                    display: flex; justify-content: space-between; align-items: center;
                    border-top: 1px solid var(--border); margin-top: 10px; padding-top: 14px;
                }
                .kravy-total-final span:first-child { font-size: 13px; font-weight: 600; color: var(--text-sec); }
                .kravy-total-final span:last-child { font-family: 'DM Mono', monospace; font-size: 28px; font-weight: 700; color: var(--accent); }

                .kravy-payment-panel { display: flex; flex-direction: column; justify-content: center; }
                .kravy-pay-method {
                    position: relative;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    padding: 16px 12px;
                    border: 2px solid var(--border);
                    border-radius: var(--radius-lg);
                    background: var(--surface); cursor: pointer; transition: all 0.15s;
                }
                .kravy-pay-method:hover { border-color: var(--border-hover); box-shadow: var(--shadow-sm); }
                .kravy-pay-method.active { border-color: var(--accent); background: var(--accent-light); box-shadow: 0 0 0 3px rgba(232,73,15,0.08); }
                .kravy-pay-label { font-size: 12px; font-weight: 700; color: var(--text-primary); margin-top: 4px; }
                .kravy-pay-desc  { font-size: 10px; color: var(--text-muted); margin-top: 1px; }
                .kravy-pay-info {
                    background: var(--surface-2); border: 1px solid var(--border);
                    border-radius: var(--radius-lg); padding: 20px;
                }
                .kravy-qr-box {
                    width: 80px; height: 80px; flex-shrink: 0;
                    background: var(--surface); border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 36px;
                }
                .kravy-listening { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; color: #16A34A; margin-top: 8px; }

                /* ── TRACKING ── */
                .kravy-track-icon {
                    width: 52px; height: 52px;
                    background: var(--accent-light); border: 1px solid rgba(232,73,15,0.15);
                    border-radius: var(--radius-md);
                    display: flex; align-items: center; justify-content: center;
                    color: var(--accent);
                }
                .kravy-track-stat {
                    background: var(--surface); border: 1px solid var(--border);
                    border-radius: var(--radius-md); padding: 12px 16px; text-align: center;
                    box-shadow: var(--shadow-sm);
                }
                .kravy-track-stat strong { display: block; font-family: 'DM Mono', monospace; font-size: 22px; font-weight: 700; color: var(--text-primary); line-height: 1; }
                .kravy-track-stat span { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-top: 3px; display: block; }
                .kravy-track-card {
                    display: flex; align-items: center; gap: 14px;
                    background: var(--surface); border: 1px solid var(--border);
                    border-radius: var(--radius-lg); padding: 14px 16px;
                    box-shadow: var(--shadow-sm); transition: all 0.15s;
                }
                .kravy-track-card:hover { border-color: var(--border-hover); box-shadow: var(--shadow-md); }
                .kravy-track-badge {
                    width: 40px; height: 40px; flex-shrink: 0;
                    border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    font-family: 'DM Mono', monospace; font-size: 14px; font-weight: 700;
                    color: white;
                }
                .kravy-status-tag {
                    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
                    padding: 2px 8px; border-radius: 99px;
                }
                .status-pending   { background: #FFFBEB; color: #D97706; }
                .status-preparing { background: #FFF1F2; color: #E11D48; }
                .status-ready     { background: #EFF6FF; color: #2563EB; }

                /* ── SCROLLBAR ── */
                .kravy-scrollbar::-webkit-scrollbar { width: 3px; }
                .kravy-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .kravy-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }

                /* ── ANIMATIONS ── */
                @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

                /* ── TRANSITIONS ── */
                * { transition-property: background-color, border-color, color, box-shadow, transform, opacity; transition-duration: 0.15s; transition-timing-function: ease; }
                button { font-family: 'DM Sans', sans-serif; }
            `}</style>
        </div>
    );
}