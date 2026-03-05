"use client";
import React, { useState, useEffect } from "react";
import Head from "next/head";
import { toast } from "sonner";
import "./workflow.css";

// --- TYPES ---
type OrderItem = { itemId: string; name: string; price: number; quantity: number; isVeg?: boolean };
type Order = {
    id: string;
    items: OrderItem[];
    total: number;
    status: "PENDING" | "PREPARING" | "READY" | "COMPLETED";
    table?: { id: string; name: string };
    customerName?: string;
    createdAt: string;
};
type Stats = {
    todaySales: number;
    totalOrders: number;
    activeOrders: number;
    avgOrder: number;
};
type TableStatus = { id: string; name: string; isOccupied: boolean };

export default function CompleteWorkflow() {
    const [activeTab, setActiveTab] = useState<"track" | "kitchen" | "dashboard" | "payment">("dashboard");
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

    // Real Data states
    const [stats, setStats] = useState<Stats>({ todaySales: 0, totalOrders: 0, activeOrders: 0, avgOrder: 0 });
    const [tablesList, setTablesList] = useState<TableStatus[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Stats derived from orders
    const computeStats = (allOrders: Order[]) => {
        let sales = 0;
        let active = 0;
        allOrders.forEach(o => {
            sales += o.total;
            if (o.status !== "COMPLETED") active++;
        });
        setStats({
            todaySales: sales,
            totalOrders: allOrders.length,
            activeOrders: active,
            avgOrder: allOrders.length ? sales / allOrders.length : 0
        });
    };

    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/orders");
            if (!res.ok) throw new Error("Failed to fetch");
            const data: Order[] = await res.json();
            setOrders(data);
            computeStats(data);

            // Select the first order by default for tracking/payment preview
            if (data.length > 0 && !selectedOrder) {
                setSelectedOrder(data[0]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000); // Polling every 10s for live feel
        return () => clearInterval(interval);
    }, []);

    // Compute table status based on active orders
    useEffect(() => {
        const fetchTables = async () => {
            try {
                const res = await fetch('/api/tables');
                if (!res.ok) throw new Error('failed');
                const data: { id: string; name: string }[] = await res.json();

                const ts: TableStatus[] = data.map((t) => {
                    // check occupancy by order.table id (orders include table via prisma.include)
                    const hasOrder = orders.some(
                        (o) => o.table?.id === t.id && o.status !== 'COMPLETED'
                    );
                    return { id: t.id, name: t.name, isOccupied: hasOrder };
                });

                setTablesList(ts);
            } catch (err) {
                console.error('could not fetch tables', err);
            }
        };
        fetchTables();
    }, [orders]);


    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const res = await fetch("/api/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, status: newStatus })
            });
            if (res.ok) {
                fetchOrders();
                toast.success(`Order status updated to ${newStatus}`);
            }
        } catch (e) {
            toast.error("Error updating status");
        }
    };

    // Clock
    const [clock, setClock] = useState("--:-- --");
    useEffect(() => {
        const tick = () => {
            setClock(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };
        tick();
        const t = setInterval(tick, 1000);
        return () => clearInterval(t);
    }, []);

    const [dateStr, setDateStr] = useState("");
    useEffect(() => {
        setDateStr(new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' · Main Branch');
    }, []);


    const newOrders = orders.filter(o => o.status === "PENDING" || !o.status);
    const prepOrders = orders.filter(o => o.status === "PREPARING");
    const readyOrders = orders.filter(o => o.status === "READY");
    const liveOrders = orders.filter(o => o.status !== "COMPLETED");

    const [payMethod, setPayMethod] = useState("upi");
    const [paid, setPaid] = useState(false);

    return (
        <div className="wf-body">
            {/* NAV TABS */}
            <div className="nav-bar">
                <div className="nav-inner">
                    <button className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                        <span>📊</span> Staff Dashboard
                    </button>
                    <button className={`nav-tab ${activeTab === 'kitchen' ? 'active' : ''}`} onClick={() => setActiveTab('kitchen')}>
                        <span>👨🍳</span> Kitchen Display
                    </button>
                    <button className={`nav-tab ${activeTab === 'track' ? 'active' : ''}`} onClick={() => setActiveTab('track')}>
                        <span>📍</span> Order Tracking
                    </button>
                    <button className={`nav-tab ${activeTab === 'payment' ? 'active' : ''}`} onClick={() => setActiveTab('payment')}>
                        <span>💳</span> Payment & Bill
                    </button>
                </div>
            </div>

            {/* =======================
          SCREEN 1: TRACKING 
          ======================= */}
            <div className={`screen track-screen ${activeTab === 'track' ? 'active' : ''}`}>
                {!selectedOrder ? (
                    <div className="p-8 text-center text-slate-500 font-bold">No active orders to track. Select from Dashboard API.</div>
                ) : (
                    <>
                        <div className="track-hero">
                            <div className="track-order-id">ORD-{selectedOrder.id.slice(-6).toUpperCase()}</div>
                            <div className="track-status-icon">
                                {selectedOrder.status === 'PENDING' ? '✅' : selectedOrder.status === 'PREPARING' ? '🔥' : '🍽️'}
                            </div>
                            <div className="track-status-title">
                                {selectedOrder.status === 'PENDING' ? 'Order Received!' : selectedOrder.status === 'PREPARING' ? 'Khana Ban Raha Hai...' : 'Ready to Serve!'}
                            </div>
                            <div className="track-status-sub">
                                {selectedOrder.status === 'PENDING' ? 'Please wait, checking with kitchen' : selectedOrder.status === 'PREPARING' ? 'Kitchen is preparing your delicious meal' : 'Your meal is arriving in minutes'}
                            </div>
                            <div className="track-table-pill"><span>🪑 {selectedOrder.table?.name || 'T-?'} &nbsp;·&nbsp; {selectedOrder.items?.length || 0} Items &nbsp;·&nbsp; ₹{selectedOrder.total}</span></div>
                        </div>

                        <div className="progress-wrap">
                            <div className="prog-title">Order Progress</div>
                            <div className="stepper">
                                <div className="stepper-line"></div>
                                <div className="stepper-progress" style={{ height: selectedOrder.status === 'READY' ? '88%' : selectedOrder.status === 'PREPARING' ? '62%' : '12%' }}></div>

                                <div className="step-item">
                                    <div className="step-dot done">✅</div>
                                    <div className="step-info"><div className="step-name">Order Received</div></div>
                                </div>

                                <div className="step-item">
                                    <div className={`step-dot ${['PREPARING', 'READY'].includes(selectedOrder.status) ? 'done' : 'active'}`}>👨🍳</div>
                                    <div className="step-info"><div className="step-name">Kitchen Confirmed</div></div>
                                </div>

                                <div className="step-item">
                                    <div className={`step-dot ${selectedOrder.status === 'READY' ? 'done' : selectedOrder.status === 'PREPARING' ? 'active' : 'pending'}`}>🔥</div>
                                    <div className="step-info"><div className="step-name">Preparing Your Order</div></div>
                                </div>

                                <div className="step-item">
                                    <div className={`step-dot ${selectedOrder.status === 'READY' ? 'active' : 'pending'}`}>🍽️</div>
                                    <div className="step-info"><div className="step-name">Ready to Serve</div></div>
                                </div>
                            </div>
                        </div>

                        <div className="order-summary">
                            <div className="os-title">Your Items</div>
                            {selectedOrder.items?.map((it, idx) => (
                                <div className="os-item" key={idx}>
                                    <div className="os-left"><div className={`os-vdot ${it.isVeg === false ? 'nv' : 'v'}`}></div><span className="os-name">{it.name}</span><span className="os-qty">×{it.quantity}</span></div>
                                    <span className="os-price">₹{it.price * it.quantity}</span>
                                </div>
                            ))}
                        </div>

                        <div className="bill-card">
                            <div className="os-title">Bill Summary</div>
                            <div className="bill-row2"><span>Subtotal</span><span>₹{(selectedOrder.total / 1.05).toFixed(2)}</span></div>
                            <div className="bill-row2"><span>GST (5%)</span><span>₹{(selectedOrder.total - (selectedOrder.total / 1.05)).toFixed(2)}</span></div>
                            <div className="bill-row2 total"><span>Total Payable</span><span>₹{selectedOrder.total}</span></div>
                        </div>

                        <button className="add-more-btn">+ Add More Items</button>
                    </>)}
            </div>

            {/* =======================
          SCREEN 2: KITCHEN 
          ======================= */}
            <div className={`screen kds-screen ${activeTab === 'kitchen' ? 'active' : ''}`}>
                <div className="kds-header">
                    <div>
                        <div className="kds-title">🍳 Kitchen Display</div>
                        <div className="kds-clock">{clock}</div>
                    </div>
                    <div className="kds-live"><div className="kds-live-dot"></div>Live</div>
                </div>

                <div className="kds-cols">
                    {/* NEW */}
                    <div>
                        <div className="kds-col-header new"><span>🔴 New</span><span className="kds-count">{newOrders.length}</span></div>
                        {newOrders.map((o) => (
                            <div className="kds-card new-order" key={o.id}>
                                <div className="kds-card-head"><span className="kds-table">{o.table?.name || 'T-?'}</span><span className="kds-timer">NEW</span></div>
                                <div className="kds-items">
                                    {o.items?.map((it, i) => (
                                        <div className="kds-item" key={i}><div className="kds-item-left"><div className="kds-item-dot v"></div><span className="kds-item-name">{it.name}</span></div><span className="kds-item-qty">×{it.quantity}</span></div>
                                    ))}
                                </div>
                                <div className="kds-action"><button className="kds-btn confirm" onClick={() => updateOrderStatus(o.id, 'PREPARING')}>Confirm Order →</button></div>
                            </div>
                        ))}
                    </div>

                    {/* PREPARING */}
                    <div>
                        <div className="kds-col-header prep"><span>🔥 Preparing</span><span className="kds-count">{prepOrders.length}</span></div>
                        {prepOrders.map((o) => (
                            <div className="kds-card preparing" key={o.id}>
                                <div className="kds-card-head"><span className="kds-table">{o.table?.name || 'T-?'}</span><span className="kds-timer">COOKING</span></div>
                                <div className="kds-items">
                                    {o.items?.map((it, i) => (
                                        <div className="kds-item" key={i}><div className="kds-item-left"><div className="kds-item-dot v"></div><span className="kds-item-name">{it.name}</span></div><span className="kds-item-qty">×{it.quantity}</span></div>
                                    ))}
                                </div>
                                <div className="kds-action"><button className="kds-btn start" onClick={() => updateOrderStatus(o.id, 'READY')}>Mark as Ready →</button></div>
                            </div>
                        ))}
                    </div>

                    {/* READY */}
                    <div>
                        <div className="kds-col-header ready"><span>✅ Ready</span><span className="kds-count">{readyOrders.length}</span></div>
                        {readyOrders.map((o) => (
                            <div className="kds-card ready-order" key={o.id}>
                                <div className="kds-card-head"><span className="kds-table">{o.table?.name || 'T-?'}</span><span className="kds-timer">SERVE</span></div>
                                <div className="kds-items">
                                    {o.items?.map((it, i) => (
                                        <div className="kds-item" key={i}><div className="kds-item-left"><div className="kds-item-dot v"></div><span className="kds-item-name">{it.name}</span></div><span className="kds-item-qty">×{it.quantity}</span></div>
                                    ))}
                                </div>
                                <div className="kds-action"><button className="kds-btn done-btn" onClick={() => updateOrderStatus(o.id, 'COMPLETED')}>Served ✓</button></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* =======================
          SCREEN 3: DASHBOARD 
          ======================= */}
            <div className={`screen dash-screen ${activeTab === 'dashboard' ? 'active' : ''}`}>
                <div className="dash-topbar">
                    <div><div className="dash-greeting">Good Evening 👋</div><div className="dash-date">{dateStr}</div></div>
                    <div className="dash-alert-btn"><span>🔔</span><div className="alert-badge">{liveOrders.length}</div></div>
                </div>

                <div className="stat-grid">
                    <div className="stat-card" style={{ "--c": "#22C55E" } as any}><div className="stat-val">₹{(stats.todaySales / 1000).toFixed(1)}K</div><div className="stat-lbl">Today's Sales</div></div>
                    <div className="stat-card" style={{ "--c": "#F97316" } as any}><div className="stat-val">{stats.totalOrders}</div><div className="stat-lbl">Total Orders</div></div>
                    <div className="stat-card" style={{ "--c": "#EF4444" } as any}><div className="stat-val">{stats.activeOrders}</div><div className="stat-lbl">Active Orders</div></div>
                    <div className="stat-card" style={{ "--c": "#D4A353" } as any}><div className="stat-val">₹{(stats.avgOrder).toFixed(0)}</div><div className="stat-lbl">Avg Order</div></div>
                </div>

                <div className="section-hd"><h2>🔴 Live Orders</h2><span className="see-all">See All →</span></div>
                {liveOrders.map(o => (
                    <div className="order-card" key={o.id} onClick={() => { setSelectedOrder(o); }}>
                        <div className="oc-head">
                            <div className="oc-table-badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}>{o.table?.name || 'T-?'}</div>
                            <div className="oc-info"><div className="oc-id">ORD-{o.id.slice(-6).toUpperCase()}</div><div className="oc-meta">{o.items.length} items · Realtime</div></div>
                            <span className="oc-status" style={{ background: 'rgba(249,115,22,0.15)', color: '#F97316' }}>{o.status}</span>
                            <span className="oc-amount">₹{o.total}</span>
                        </div>
                        <div className="oc-footer">
                            {o.status === "PENDING" && <button className="oc-action" onClick={() => updateOrderStatus(o.id, 'PREPARING')}>Confirm</button>}
                            {o.status === "PREPARING" && <button className="oc-action" onClick={() => updateOrderStatus(o.id, 'READY')}>Mark Ready</button>}
                            {o.status === "READY" && <button className="oc-action" onClick={() => updateOrderStatus(o.id, 'COMPLETED')}>Mark Served</button>}
                            <button className="oc-action" onClick={() => { setSelectedOrder(o); setActiveTab('track'); }}>Track View</button>
                            <button className="oc-action" onClick={() => { setSelectedOrder(o); setActiveTab('payment'); }}>Checkout</button>
                        </div>
                    </div>
                ))}

                <div className="table-map">
                    <div className="section-hd" style={{ padding: 0, marginBottom: '10px' }}><h2>🪑 Table Status</h2></div>
                    <div className="table-grid">
                        {tablesList.map(t => (
                            <div key={t.id} className={`table-cell ${t.isOccupied ? 'occ' : 'free'}`}>
                                <div className="tc-num">{t.name}</div>
                                <div className="tc-status">{t.isOccupied ? 'Occupied' : 'Free'}</div>
                                <div className="tc-dot"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* =======================
          SCREEN 4: PAYMENT 
          ======================= */}
            <div className={`screen pay-screen ${activeTab === 'payment' ? 'active' : ''}`}>
                {!selectedOrder ? (
                    <div className="p-8 text-center text-slate-500 font-bold">No order selected for checkout.</div>
                ) : (
                    <>
                        <div className="pay-header">
                            <div className="pay-header-content">
                                <button className="pay-back" onClick={() => setActiveTab('dashboard')}>←</button>
                                <div className="pay-header-info">
                                    <div className="pay-header-title">Payment & Bill</div>
                                    <div className="pay-header-sub">Table {selectedOrder.table?.name || 'T-?'} · Order ORD-{selectedOrder.id.slice(-6).toUpperCase()}</div>
                                </div>
                            </div>
                        </div>

                        <div className="receipt">
                            <div className="receipt-header">
                                <div className="receipt-restaurant">🍽️ Kravy System</div>
                                <div class="receipt-address">Realtime Web API Based</div>
                            </div>
                            <div className="receipt-meta"><span>Date: {new Date().toLocaleDateString('en-IN')}</span><span>Time: {new Date().toLocaleTimeString('en-IN')}</span></div>
                            <hr className="receipt-divider" />
                            <div className="receipt-items">
                                {selectedOrder.items?.map((it, idx) => (
                                    <div className="ri-row" key={idx}>
                                        <div className="ri-left"><span className="ri-name">{it.name}</span><span className="ri-qty">×{it.quantity}</span></div>
                                        <span className="ri-price">₹{it.price * it.quantity}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="bill-totals">
                                <div className="bt-row"><span>Subtotal</span><span>₹{(selectedOrder.total / 1.05).toFixed(2)}</span></div>
                                <div className="bt-row"><span>GST (5%)</span><span>₹{(selectedOrder.total - (selectedOrder.total / 1.05)).toFixed(2)}</span></div>
                                <div className="bt-row grand"><span>Total</span><span>₹{selectedOrder.total}</span></div>
                            </div>
                        </div>

                        <div className="pay-options-section">
                            <div className="pos-title">Choose Payment Method</div>
                            <div className={`pay-method-card ${payMethod === 'upi' ? 'selected' : ''}`} onClick={() => setPayMethod('upi')}>
                                <div className="pmc-icon">📱</div>
                                <div className="pmc-info"><div className="pmc-name">UPI / QR Code</div><div className="pmc-desc">GPay, PhonePe, Paytm</div></div>
                                <div className="pmc-radio"></div>
                            </div>
                            <div className={`pay-method-card ${payMethod === 'cash' ? 'selected' : ''}`} onClick={() => setPayMethod('cash')}>
                                <div className="pmc-icon">💵</div>
                                <div className="pmc-info"><div className="pmc-name">Cash</div><div className="pmc-desc">Pay cash to waiter</div></div>
                                <div className="pmc-radio"></div>
                            </div>
                        </div>

                        {payMethod === 'upi' && (
                            <div className="upi-pay-box">
                                <div className="upi-qr-big">📲</div>
                                <div className="upi-pay-id">business@upi</div>
                                <div className="upi-pay-amount">₹{selectedOrder.total}</div>
                            </div>
                        )}

                        {!paid ? (
                            <button className="pay-now-btn" onClick={() => setPaid(true)}>✅ Confirm Payment — ₹{selectedOrder.total}</button>
                        ) : (
                            <div className="paid-success show">
                                <span className="paid-icon">🎉</span>
                                <div className="paid-title">Payment Successful!</div>
                                <div className="paid-sub">₹{selectedOrder.total} received. Order Completed.</div>
                            </div>
                        )}
                    </>)}
            </div>

        </div>
    );
}
