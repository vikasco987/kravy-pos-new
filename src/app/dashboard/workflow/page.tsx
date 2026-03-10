"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { kravy } from "@/lib/sounds";
import {
    LayoutDashboard, ChefHat, MapPin, CreditCard,
    Clock, Bell, TrendingUp, ArrowRight, Check,
    Flame, UtensilsCrossed, Plus, Trash2, Eye
} from "lucide-react";

// --- TYPES ---
type OrderItem = { itemId: string; name: string; price: number; quantity: number; isVeg?: boolean; isNew?: boolean };
type Order = {
    id: string;
    items: OrderItem[];
    total: number;
    status: "PENDING" | "PREPARING" | "READY" | "COMPLETED";
    table?: { id: string; name: string };
    customerName?: string;
    createdAt: string;
    caseType?: string;
    parentOrderId?: string;
    isMerged?: boolean;
};
type TableStatus = { id: string; name: string; isOccupied: boolean };

const TABS = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "kitchen", label: "Kitchen Display", icon: ChefHat },
    { key: "track", label: "Order Tracking", icon: MapPin },
    { key: "payment", label: "Payment & Bill", icon: CreditCard },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function CompleteWorkflow() {
    const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
    const [orders, setOrders] = useState<Order[]>([]);
    const [tablesList, setTablesList] = useState<TableStatus[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [payMethod, setPayMethod] = useState("upi");
    const [paid, setPaid] = useState(false);
    const [clock, setClock] = useState("");
    const [dateStr, setDateStr] = useState("");

    // Fetch orders
    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/orders");
            if (!res.ok) throw new Error("fail");
            const data: Order[] = await res.json();
            setOrders(data);
            if (data.length > 0 && !selectedOrder) setSelectedOrder(data[0]);
        } catch { }
    };

    // Fetch real tables from DB
    const fetchTables = async () => {
        try {
            const res = await fetch("/api/tables");
            if (!res.ok) throw new Error("fail");
            setTablesList(
                (await res.json()).map((t: any) => ({
                    id: t.id, name: t.name,
                    isOccupied: orders.some(o => o.table?.id === t.id && o.status !== "COMPLETED")
                }))
            );
        } catch { }
    };

    useEffect(() => { fetchOrders(); const i = setInterval(fetchOrders, 10000); return () => clearInterval(i); }, []);
    useEffect(() => { fetchTables(); }, [orders]);
    useEffect(() => {
        const tick = () => setClock(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        tick(); const i = setInterval(tick, 1000); return () => clearInterval(i);
    }, []);
    useEffect(() => {
        setDateStr(new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    }, []);

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const res = await fetch("/api/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, status: newStatus }) });
            if (res.ok) { kravy.success(); fetchOrders(); toast.success(`Status → ${newStatus}`); }
        } catch { kravy.error(); toast.error("Error updating status"); }
    };

    const handleAddTable = async () => {
        const name = window.prompt("Enter new table name (e.g., T-15):");
        if (!name) return;
        try {
            const res = await fetch("/api/tables", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
            if (res.ok) { kravy.success(); toast.success("Table added"); fetchTables(); } else { kravy.error(); toast.error("Failed"); }
        } catch { kravy.error(); toast.error("Error"); }
    };
    const handleDeleteTable = async (id: string, name: string) => {
        if (!confirm(`Delete table ${name}?`)) return;
        try {
            const res = await fetch(`/api/tables?id=${id}`, { method: "DELETE" });
            if (res.ok) { kravy.trash(); toast.success("Table deleted"); fetchTables(); } else { kravy.error(); toast.error("Failed"); }
        } catch { kravy.error(); toast.error("Error"); }
    };

    // Computed
    const newOrders = orders.filter(o => o.status === "PENDING");
    const prepOrders = orders.filter(o => o.status === "PREPARING");
    const readyOrders = orders.filter(o => o.status === "READY");
    const liveOrders = orders.filter(o => o.status !== "COMPLETED");
    const todaySales = orders.reduce((s, o) => s + o.total, 0);
    const avgOrder = orders.length ? todaySales / orders.length : 0;

    // Session combining
    const sessionOrders = selectedOrder?.table
        ? liveOrders.filter(o => o.table?.id === selectedOrder.table?.id)
        : selectedOrder ? [selectedOrder] : [];
    const isCombinedBill = sessionOrders.length > 1;
    const sessionTotal = sessionOrders.reduce((s, o) => s + o.total, 0);
    const sessionSubtotal = sessionTotal / 1.05;
    const sessionGst = sessionTotal - sessionSubtotal;

    // Status helpers
    const statusColor = (s: string) => {
        if (s === "PENDING") return "bg-rose-500/10 text-rose-500 border-rose-500/20";
        if (s === "PREPARING") return "bg-orange-500/10 text-orange-500 border-orange-500/20";
        if (s === "READY") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    };

    return (
        <div className="min-h-screen bg-[var(--kravy-bg)]">
            {/* ═══ TAB BAR ═══ */}
            <div className="sticky top-0 z-50 bg-[var(--kravy-navbar-bg)] backdrop-blur-md border-b border-[var(--kravy-border)] shadow-sm">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {TABS.map(t => {
                            const Icon = t.icon;
                            const isActive = activeTab === t.key;
                            return (
                                <button key={t.key} onClick={() => setActiveTab(t.key)}
                                    className={`flex items-center gap-2 px-5 py-4 text-sm font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${isActive ? "text-[var(--kravy-brand)] border-[var(--kravy-brand)]" : "text-[var(--kravy-text-muted)] border-transparent hover:text-[var(--kravy-text-primary)]"}`}>
                                    <Icon className="w-4 h-4" />
                                    {t.label}
                                    {t.key === "kitchen" && newOrders.length > 0 && (
                                        <span className="ml-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-black">{newOrders.length}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 sm:p-6">

                {/* ═══════════════════════════
                   SCREEN 1: STAFF DASHBOARD
                ═══════════════════════════ */}
                {activeTab === "dashboard" && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-black text-[var(--kravy-text-primary)] tracking-tight">Good Evening 👋</h1>
                                <p className="text-xs text-[var(--kravy-text-muted)] font-black uppercase tracking-widest mt-1 opacity-70">{dateStr}</p>
                            </div>
                            <button className="relative w-10 h-10 rounded-xl bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)] flex items-center justify-center">
                                <Bell className="w-5 h-5 text-rose-500" />
                                {liveOrders.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-black">{liveOrders.length}</span>}
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: "Today's Sales", value: `₹${(todaySales / 1000).toFixed(1)}K`, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                                { label: "Total Orders", value: orders.length, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
                                { label: "Active Orders", value: liveOrders.length, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
                                { label: "Avg Order", value: `₹${avgOrder.toFixed(0)}`, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
                            ].map((s, i) => (
                                <div key={i} className={`${s.bg} ${s.border} border-2 rounded-2xl p-5 shadow-sm`}>
                                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                                    <p className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest mt-1 opacity-80">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Live Orders */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-black text-[var(--kravy-text-primary)] uppercase tracking-widest">🔴 Live Orders</h2>
                                <span className="text-xs font-black text-[var(--kravy-brand)] uppercase tracking-widest cursor-pointer hover:underline">See All →</span>
                            </div>
                            {liveOrders.length === 0 ? (
                                <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl p-12 text-center shadow-sm">
                                    <UtensilsCrossed className="w-12 h-12 text-[var(--kravy-text-faint)] mx-auto mb-3 opacity-20" />
                                    <p className="font-bold text-[var(--kravy-text-muted)]">No active orders right now</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {liveOrders.map(o => (
                                        <div key={o.id} className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-colors shadow-sm">
                                            <div className="p-4 flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black ${statusColor(o.status)}`}>
                                                    {o.table?.name || "T-?"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-extrabold text-[var(--kravy-text-primary)] font-mono">ORD-{o.id.slice(-6).toUpperCase()}</p>
                                                        {o.isMerged && <span className="bg-emerald-500/20 text-emerald-500 text-[10px] font-black px-1.5 py-1 rounded-md">🔀 MERGED</span>}
                                                        {o.caseType === 'round2' && <span className="bg-blue-500/20 text-blue-500 text-[10px] font-black px-1.5 py-1 rounded-md">🔄 ROUND 2</span>}
                                                        {o.caseType === 'separate' && <span className="bg-orange-500/20 text-orange-500 text-[10px] font-black px-1.5 py-1 rounded-md">📋 SEPARATE</span>}
                                                    </div>
                                                    <p className="text-xs text-[var(--kravy-text-muted)] font-medium">{o.items?.length} items</p>
                                                </div>
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full border-2 uppercase tracking-widest ${statusColor(o.status)}`}>{o.status}</span>
                                                <span className="text-base font-black text-[var(--kravy-text-primary)]">₹{o.total}</span>
                                            </div>
                                            <div className="px-4 pb-3 flex gap-2 flex-wrap">
                                                {o.status === "PENDING" && <ActionBtn label="Confirm" onClick={() => updateOrderStatus(o.id, "PREPARING")} variant="red" />}
                                                {o.status === "PREPARING" && <ActionBtn label="Mark Ready" onClick={() => updateOrderStatus(o.id, "READY")} variant="orange" />}
                                                {o.status === "READY" && <ActionBtn label="Mark Served" onClick={() => updateOrderStatus(o.id, "COMPLETED")} variant="green" />}
                                                <ActionBtn label="Track" onClick={() => { setSelectedOrder(o); setActiveTab("track"); }} variant="slate" />
                                                <ActionBtn label="Checkout" onClick={() => { setSelectedOrder(o); setPaid(false); setActiveTab("payment"); }} variant="brand" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Table Status */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-black text-[var(--kravy-text-primary)] uppercase tracking-widest">🪑 Table Status</h2>
                                <button onClick={handleAddTable} className="flex items-center gap-1 text-xs font-black text-[var(--kravy-brand)] uppercase tracking-widest hover:underline transition-colors">
                                    <Plus className="w-4 h-4" /> Add Table
                                </button>
                            </div>
                            {tablesList.length === 0 ? (
                                <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl p-12 text-center shadow-sm">
                                    <p className="font-bold text-[var(--kravy-text-muted)]">No tables yet. Add your first table!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                    {tablesList.map(t => (
                                        <div key={t.id} className={`relative rounded-2xl p-4 text-center border-2 transition-all ${t.isOccupied ? "bg-orange-500/10 border-orange-500/30" : "bg-emerald-500/10 border-emerald-500/30"}`}>
                                            <button onClick={() => handleDeleteTable(t.id, t.name)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity" style={{ opacity: 0.6 }}>×</button>
                                            <p className={`text-lg font-black ${t.isOccupied ? "text-orange-500" : "text-emerald-500"}`}>{t.name}</p>
                                            <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${t.isOccupied ? "text-orange-500/60" : "text-emerald-500/60"}`}>{t.isOccupied ? "Occupied" : "Free"}</p>
                                            <div className={`w-2 h-2 rounded-full mx-auto mt-2 ${t.isOccupied ? "bg-orange-500" : "bg-emerald-500"}`} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {/* ═══════════════════════════
                   SCREEN 2: KITCHEN DISPLAY
                ═══════════════════════════ */}
                {activeTab === "kitchen" && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl p-4 shadow-sm">
                            <div>
                                <h1 className="text-xl font-extrabold text-[var(--kravy-text-primary)]">🍳 Kitchen Display</h1>
                                <p className="text-sm font-mono text-[var(--kravy-text-muted)]">{clock}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-sm font-bold text-emerald-500">Live</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* NEW */}
                            <KdsColumn title="🔴 New" count={newOrders.length} color="red" orders={newOrders}
                                actionLabel="Confirm →" onAction={(id) => updateOrderStatus(id, "PREPARING")} />
                            {/* PREPARING */}
                            <KdsColumn title="🔥 Preparing" count={prepOrders.length} color="orange" orders={prepOrders}
                                actionLabel="Mark Ready →" onAction={(id) => updateOrderStatus(id, "READY")} />
                            {/* READY */}
                            <KdsColumn title="✅ Ready" count={readyOrders.length} color="green" orders={readyOrders}
                                actionLabel="Served ✓" onAction={(id) => updateOrderStatus(id, "COMPLETED")} />
                        </div>
                    </div>
                )}


                {/* ═══════════════════════════
                   SCREEN 3: ORDER TRACKING
                ═══════════════════════════ */}
                {activeTab === "track" && (
                    <div className="max-w-lg mx-auto space-y-4 animate-in fade-in duration-300">
                        {!selectedOrder ? (
                            <EmptyState msg="Select an order from the Dashboard to track it." />
                        ) : (
                            <>
                                {/* Hero */}
                                <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-3xl p-8 text-center shadow-lg">
                                    <p className="text-xs font-bold tracking-widest text-amber-500 mb-3 bg-amber-500/10 inline-block px-3 py-1 rounded-full">
                                        ORD-{selectedOrder.id.slice(-6).toUpperCase()}
                                    </p>
                                    <p className="text-5xl mb-3">{selectedOrder.status === "PENDING" ? "✅" : selectedOrder.status === "PREPARING" ? "🔥" : "🍽️"}</p>
                                    <h2 className="text-xl font-extrabold text-[var(--kravy-text-primary)]">
                                        {selectedOrder.status === "PENDING" ? "Order Received!" : selectedOrder.status === "PREPARING" ? "Being Prepared..." : "Ready to Serve!"}
                                    </h2>
                                    <p className="text-sm text-[var(--kravy-text-muted)] mt-1 font-medium">
                                        {selectedOrder.status === "PENDING" ? "Waiting for kitchen confirmation" : selectedOrder.status === "PREPARING" ? "Chef is cooking your food" : "Waiter is on the way"}
                                    </p>
                                    <div className="mt-4 inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-4 py-2">
                                        <span className="text-sm font-black text-orange-500">🪑 {selectedOrder.table?.name || "T-?"} · {selectedOrder.items?.length || 0} Items · ₹{selectedOrder.total}</span>
                                    </div>
                                </div>

                                {/* Stepper */}
                                <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl p-6 shadow-sm">
                                    <p className="text-xs font-black text-[var(--kravy-text-muted)] uppercase tracking-widest mb-5">Order Progress</p>
                                    {[
                                        { label: "Order Received", icon: "✅", done: true },
                                        { label: "Kitchen Confirmed", icon: "👨‍🍳", done: ["PREPARING", "READY"].includes(selectedOrder.status) },
                                        { label: "Preparing", icon: "🔥", done: selectedOrder.status === "READY", active: selectedOrder.status === "PREPARING" },
                                        { label: "Ready to Serve", icon: "🍽️", active: selectedOrder.status === "READY" },
                                    ].map((step, i, arr) => (
                                        <div key={i} className="flex items-start gap-4 mb-0">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 ${step.done ? "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20" : step.active ? "bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/20 animate-pulse" : "bg-[var(--kravy-bg-2)] border-[var(--kravy-border)]"}`}>
                                                    {step.icon}
                                                </div>
                                                {i < arr.length - 1 && <div className={`w-0.5 h-8 ${step.done ? "bg-emerald-500/50" : "bg-[var(--kravy-border)]"}`} />}
                                            </div>
                                            <div className="pt-2">
                                                <p className={`text-sm font-bold ${step.done || step.active ? "text-[var(--kravy-text-primary)]" : "text-[var(--kravy-text-faint)]"}`}>{step.label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Items */}
                                <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl p-6 shadow-sm">
                                    <p className="text-xs font-black text-[var(--kravy-text-muted)] uppercase tracking-widest mb-4">Your Items</p>
                                    {selectedOrder.items?.map((it, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-3 border-b border-[var(--kravy-border)] last:border-0 opacity-80 hover:opacity-100 transition-opacity">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-sm border-2 ${it.isVeg === false ? "border-rose-500" : "border-emerald-500"}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full m-auto mt-[1px] ${it.isVeg === false ? "bg-rose-500" : "bg-emerald-500"}`} />
                                                </div>
                                                <span className="font-bold text-[var(--kravy-text-primary)]">{it.name}</span>
                                                <span className="text-xs text-[var(--kravy-text-muted)] font-medium">×{it.quantity}</span>
                                            </div>
                                            <span className="font-black text-[var(--kravy-text-primary)]">₹{it.price * it.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Bill */}
                                <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl p-6 shadow-sm">
                                    <p className="text-xs font-black text-[var(--kravy-text-muted)] uppercase tracking-widest mb-4">Bill Summary</p>
                                    <div className="flex justify-between text-sm text-[var(--kravy-text-muted)] font-semibold py-1"><span>Subtotal</span><span>₹{(selectedOrder.total / 1.05).toFixed(2)}</span></div>
                                    <div className="flex justify-between text-sm text-[var(--kravy-text-muted)] font-semibold py-1"><span>GST (5%)</span><span>₹{(selectedOrder.total - selectedOrder.total / 1.05).toFixed(2)}</span></div>
                                    <div className="flex justify-between text-base font-black text-[var(--kravy-text-primary)] border-t border-dashed border-[var(--kravy-border)] mt-3 pt-3"><span>Total</span><span className="text-rose-500">₹{selectedOrder.total}</span></div>
                                </div>
                            </>
                        )}
                    </div>
                )}


                {/* ═══════════════════════════
                   SCREEN 4: PAYMENT & BILL
                ═══════════════════════════ */}
                {activeTab === "payment" && (
                    <div className="max-w-lg mx-auto space-y-4 animate-in fade-in duration-300">
                        {!selectedOrder ? (
                            <EmptyState msg="Select an order from the Dashboard to checkout." />
                        ) : (
                            <>
                                {/* Header */}
                                <div className="bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)] rounded-3xl p-6 flex items-center gap-4 shadow-sm">
                                    <button onClick={() => setActiveTab("dashboard")} className="w-10 h-10 rounded-full bg-[var(--kravy-surface)] border border-[var(--kravy-border)] flex items-center justify-center text-[var(--kravy-text-primary)] text-lg shrink-0 shadow-sm">←</button>
                                    <div>
                                        <h2 className="text-lg font-extrabold text-[var(--kravy-text-primary)]">Payment & Bill</h2>
                                        <p className="text-sm text-[var(--kravy-text-muted)] font-medium">Table {selectedOrder.table?.name || "T-?"} · ORD-{selectedOrder.id.slice(-6).toUpperCase()}</p>
                                    </div>
                                </div>

                                {/* Receipt */}
                                <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl overflow-hidden shadow-sm">
                                    <div className="p-6 text-center border-b border-dashed border-[var(--kravy-border)]">
                                        <p className="text-xl font-extrabold text-[var(--kravy-text-primary)]">🍽️ Kravy System</p>
                                        <p className="text-xs text-[var(--kravy-text-muted)] font-medium mt-1">Realtime Web API Based</p>
                                    </div>
                                    <div className="px-6 py-3 flex justify-between text-[10px] text-[var(--kravy-text-faint)] font-bold uppercase tracking-wider">
                                        <span>Date: {new Date().toLocaleDateString("en-IN")}</span>
                                        <span>Time: {new Date().toLocaleTimeString("en-IN")}</span>
                                    </div>
                                    <div className="px-6 pb-4">
                                        {isCombinedBill && (
                                            <div className="mb-3 px-3 py-2 bg-indigo-500/10 text-indigo-500 text-xs font-bold rounded-lg border border-indigo-500/20 flex items-center justify-between">
                                                <span>📋 Unified Bill</span>
                                                <span>{sessionOrders.length} Orders</span>
                                            </div>
                                        )}
                                        {sessionOrders.map((order, oIdx) => (
                                            <div key={order.id} className={oIdx > 0 ? "mt-4" : ""}>
                                                {isCombinedBill && <p className="text-[10px] font-black tracking-widest text-[var(--kravy-text-faint)] mb-2">ORD-{order.id.slice(-6).toUpperCase()}</p>}
                                                {order.items?.map((it, idx) => (
                                                    <div key={idx} className="flex justify-between py-2 border-b border-[var(--kravy-border)] last:border-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-[var(--kravy-text-primary)]">{it.name}</span>
                                                            <span className="text-xs text-[var(--kravy-text-muted)]">×{it.quantity}</span>
                                                        </div>
                                                        <span className="font-black text-[var(--kravy-text-primary)]">₹{it.price * it.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="px-6 py-4 border-t border-dashed border-[var(--kravy-border)] bg-[var(--kravy-bg-2)] mt-2">
                                        <div className="flex justify-between text-sm text-[var(--kravy-text-muted)] font-semibold py-1"><span>Subtotal</span><span>₹{sessionSubtotal.toFixed(2)}</span></div>
                                        <div className="flex justify-between text-sm text-[var(--kravy-text-muted)] font-semibold py-1"><span>GST (5%)</span><span>₹{sessionGst.toFixed(2)}</span></div>
                                        <div className="flex justify-between text-lg font-black text-[var(--kravy-text-primary)] border-t-2 border-[var(--kravy-text-primary)] mt-3 pt-3"><span>Session Total</span><span className="text-rose-500">₹{sessionTotal.toFixed(2)}</span></div>
                                    </div>
                                </div>

                                {/* Payment Methods */}
                                <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl p-6 shadow-sm">
                                    <p className="text-xs font-black text-[var(--kravy-text-muted)] uppercase tracking-widest mb-4">Payment Method</p>
                                    {[
                                        { key: "upi", icon: "📱", title: "UPI / QR Code", desc: "GPay, PhonePe, Paytm" },
                                        { key: "cash", icon: "💵", title: "Cash", desc: "Pay cash to waiter" },
                                        { key: "card", icon: "💳", title: "Card", desc: "Visa, Mastercard, RuPay" },
                                    ].map(m => (
                                        <button key={m.key} onClick={() => setPayMethod(m.key)}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 mb-3 last:mb-0 transition-all ${payMethod === m.key ? "border-rose-500 bg-rose-500/10" : "border-[var(--kravy-border)] hover:border-indigo-500/30"}`}>
                                            <span className="text-2xl">{m.icon}</span>
                                            <div className="text-left flex-1">
                                                <p className={`font-bold ${payMethod === m.key ? "text-rose-500" : "text-[var(--kravy-text-primary)]"}`}>{m.title}</p>
                                                <p className="text-xs text-[var(--kravy-text-muted)] font-medium">{m.desc}</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${payMethod === m.key ? "border-rose-500 bg-rose-500" : "border-[var(--kravy-border)]"}`}>
                                                {payMethod === m.key && <div className="w-2 h-2 rounded-full bg-white" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {payMethod === "upi" && (
                                    <div className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl p-6 text-center shadow-sm">
                                        <div className="w-28 h-28 bg-[var(--kravy-surface)] rounded-2xl border border-[var(--kravy-border)] flex items-center justify-center text-5xl mx-auto mb-3 shadow-inner">📲</div>
                                        <p className="font-black text-[var(--kravy-text-primary)] font-mono">business@upi</p>
                                        <p className="text-2xl font-black text-emerald-500 mt-1">₹{sessionTotal}</p>
                                        <p className="text-xs text-[var(--kravy-text-muted)] mt-1">Scan or enter UPI ID in app</p>
                                    </div>
                                )}

                                {!paid ? (
                                    <button onClick={() => {
                                        setPaid(true);
                                        sessionOrders.forEach(o => updateOrderStatus(o.id, "COMPLETED"));
                                    }}
                                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white text-lg font-black shadow-lg shadow-rose-500/30 active:scale-[0.98] transition-all hover:brightness-110">
                                        ✅ Confirm Payment — ₹{sessionTotal}
                                    </button>
                                ) : (
                                    <div className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl p-8 text-center shadow-lg animate-in zoom-in duration-500">
                                        <p className="text-5xl mb-2">🎉</p>
                                        <p className="text-xl font-black text-emerald-500">Payment Successful!</p>
                                        <p className="text-sm text-[var(--kravy-text-muted)] mt-1">₹{sessionTotal} received. Session Completed.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── HELPER COMPONENTS ────────────────────────────────────

function ActionBtn({ label, onClick, variant }: { label: string; onClick: () => void; variant: string }) {
    const styles: Record<string, string> = {
        red: "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20",
        orange: "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20",
        green: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20",
        brand: "bg-[var(--kravy-brand)]/10 text-[var(--kravy-brand)] border-[var(--kravy-brand)]/20 hover:bg-[var(--kravy-brand)]/20",
        slate: "bg-[var(--kravy-bg-2)] text-[var(--kravy-text-muted)] border-[var(--kravy-border)] hover:bg-[var(--kravy-surface-hover)]",
    };
    return (
        <button onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${styles[variant] || styles.slate}`}>
            {label}
        </button>
    );
}

function KdsColumn({ title, count, color, orders, actionLabel, onAction }: {
    title: string; count: number; color: string; orders: Order[];
    actionLabel: string; onAction: (id: string) => void;
}) {
    const colors: Record<string, { header: string; card: string; btn: string }> = {
        red: { header: "bg-rose-500/10 text-rose-500 border-rose-500/20", card: "border-t-rose-500", btn: "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20" },
        orange: { header: "bg-orange-500/10 text-orange-500 border-orange-500/20", card: "border-t-orange-500", btn: "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20" },
        green: { header: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", card: "border-t-emerald-500", btn: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20" },
    };
    const c = colors[color] || colors.red;

    return (
        <div>
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${c.header} mb-3 shadow-sm`}>
                <span className="text-sm font-black">{title}</span>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white ${color === "red" ? "bg-rose-500" : color === "orange" ? "bg-orange-500" : "bg-emerald-500"}`}>{count}</span>
            </div>
            {orders.length === 0 ? (
                <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl p-8 text-center shadow-sm">
                    <p className="text-sm text-[var(--kravy-text-faint)] font-bold">No orders</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map(o => (
                        <div key={o.id} className={`bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl overflow-hidden border-t-4 ${c.card} shadow-sm transition-transform hover:scale-[1.01]`}>
                            <div className="p-4 flex items-center justify-between border-b border-[var(--kravy-border)]">
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-[var(--kravy-text-primary)]">{o.table?.name || "T-?"}</span>
                                    {o.isMerged && <span className="bg-emerald-500/20 text-emerald-500 text-[10px] font-black px-1.5 py-1 rounded-md">🔀 MERGED</span>}
                                    {o.caseType === 'round2' && <span className="bg-blue-500/20 text-blue-500 text-[10px] font-black px-1.5 py-1 rounded-md">🔄 R2</span>}
                                </div>
                                <span className="text-xs font-mono text-[var(--kravy-text-faint)]">ORD-{o.id.slice(-6).toUpperCase()}</span>
                            </div>
                            <div className="p-4 space-y-2">
                                {o.items?.map((it, i) => (
                                    <div key={i} className={`flex items-center justify-between p-1 rounded ${it.isNew ? 'bg-emerald-500/10 border border-emerald-500/20' : ''}`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${it.isVeg === false ? "bg-rose-500" : "bg-emerald-500"}`} />
                                            <span className={`text-sm font-semibold ${it.isNew ? 'text-emerald-500' : 'text-[var(--kravy-text-primary)]'}`}>{it.name}</span>
                                            {it.isNew && <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none ml-1">NEW</span>}
                                        </div>
                                        <span className={`text-xs font-black px-2 py-0.5 rounded-md ${it.isNew ? 'text-emerald-500 bg-emerald-500/20' : 'text-[var(--kravy-text-muted)] bg-[var(--kravy-bg-2)]'}`}>×{it.quantity}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="p-3 border-t border-[var(--kravy-border)]">
                                <button onClick={() => onAction(o.id)}
                                    className={`w-full py-2.5 rounded-xl border text-sm font-black transition-colors ${c.btn}`}>
                                    {actionLabel}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function EmptyState({ msg }: { msg: string }) {
    return (
        <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl p-16 text-center shadow-sm">
            <UtensilsCrossed className="w-16 h-16 text-[var(--kravy-text-faint)] mx-auto mb-4 opacity-20" />
            <p className="font-bold text-[var(--kravy-text-muted)]">{msg}</p>
        </div>
    );
}
