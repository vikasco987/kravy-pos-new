"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Bell, ExternalLink } from "lucide-react";
import { kravy } from "@/lib/sounds";

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderNotification {
    id: string;
    customerName: string;
    total: number;
    tableName?: string;
    itemCount?: number;
    createdAt: string;
}

interface ReviewNotification {
    id: string;
    customerName: string;
    rating: number;
    comment?: string;
}

// ─── Main Hook + Provider ─────────────────────────────────────────────────────
function OrderPopup({ order, onClose }: { order: OrderNotification; onClose: () => void }) {
    useEffect(() => {
        const t = setTimeout(onClose, 8000);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-80 bg-white rounded-2xl shadow-2xl border border-orange-100 overflow-hidden"
            style={{ boxShadow: "0 20px 60px rgba(255,107,53,0.2), 0 4px 20px rgba(0,0,0,0.1)" }}
        >
            {/* Top bar */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                    >
                        <Bell size={14} className="text-white" />
                    </motion.div>
                    <span className="text-white text-[0.65rem] font-black uppercase tracking-widest">🚨 New QR Order!</span>
                </div>
                <button onClick={onClose} className="text-white/70 hover:text-white transition">
                    <X size={14} />
                </button>
            </div>

            {/* Body */}
            <div className="px-4 py-3">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                        <ShoppingBag size={20} className="text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-black text-sm text-gray-900 truncate">{order.customerName || "Guest Customer"}</div>
                        {order.tableName && (
                            <div className="text-[0.65rem] font-bold text-gray-500 mt-0.5">🪑 {order.tableName}</div>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-lg font-black text-orange-600">₹{order.total}</span>
                            {order.itemCount && (
                                <span className="text-[0.6rem] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100">
                                    {order.itemCount} items
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                    <a
                        href="/dashboard/qr-orders"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-orange-500 text-white rounded-xl text-xs font-black hover:bg-orange-600 transition shadow-md shadow-orange-200"
                    >
                        View Orders <ExternalLink size={11} />
                    </a>
                    <button onClick={onClose} className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-black text-gray-400 hover:bg-gray-50 transition">
                        Dismiss
                    </button>
                </div>
            </div>

            {/* Auto-dismiss progress bar */}
            <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 8, ease: "linear" }}
                className="h-0.5 bg-orange-400"
            />
        </motion.div>
    );
}

// ─── Main Hook + Provider ─────────────────────────────────────────────────────
export function OrderNotificationProvider() {
    const { userId } = useAuth();
    const [popups, setPopups] = useState<OrderNotification[]>([]);
    const seenOrderIds = useRef<Set<string>>(new Set());
    const seenReviewIds = useRef<Set<string>>(new Set());
    const eventSourceRef = useRef<EventSource | null>(null);

    const removePopup = useCallback((id: string) => {
        setPopups(prev => prev.filter(p => p.id !== id));
    }, []);

    useEffect(() => {
        if (!userId) return;

        // Load already-seen IDs from sessionStorage on first load
        const storedSeen = sessionStorage.getItem("kravy_seen_orders");
        if (storedSeen) {
            JSON.parse(storedSeen).forEach((id: string) => seenOrderIds.current.add(id));
        }

        function connect() {
            const es = new EventSource("/api/notifications");
            eventSourceRef.current = es;

            es.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === "new_orders" && Array.isArray(data.orders)) {
                        const newOrders = data.orders.filter(
                            (o: any) => !seenOrderIds.current.has(o.id)
                        );

                        if (newOrders.length > 0) {
                            kravy.orderBell();

                            newOrders.forEach((order: any) => {
                                seenOrderIds.current.add(order.id);

                                // Count items
                                let itemCount = 0;
                                try {
                                    const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || "[]");
                                    itemCount = items.reduce((s: number, i: any) => s + (i.quantity || 1), 0);
                                } catch { }

                                const notification: OrderNotification = {
                                    id: order.id,
                                    customerName: order.customerName || "Guest",
                                    total: order.total,
                                    tableName: order.table?.name || order.tableName,
                                    itemCount,
                                    createdAt: order.createdAt,
                                };

                                setPopups(prev => [notification, ...prev].slice(0, 3)); // max 3 popups

                                // Also fire a toast (in case popup is missed)
                                toast.success(`🛎️ New order — ₹${order.total}`, {
                                    duration: 4000,
                                    position: "top-center",
                                });
                            });

                            // Persist seen IDs
                            sessionStorage.setItem("kravy_seen_orders",
                                JSON.stringify(Array.from(seenOrderIds.current).slice(-100))
                            );
                        }
                    }

                    if (data.type === "new_reviews" && Array.isArray(data.reviews)) {
                        const newReviews = data.reviews.filter(
                            (r: any) => !seenReviewIds.current.has(r.id)
                        );

                        if (newReviews.length > 0) {
                            kravy.review();
                            newReviews.forEach((r: any) => {
                                seenReviewIds.current.add(r.id);
                                toast(`⭐ New ${r.rating}-star review from ${r.customerName || "a customer"}`, {
                                    duration: 5000,
                                    icon: "🌟",
                                });
                            });
                        }
                    }
                } catch (e) {
                    console.error("Notification parse error:", e);
                }
            };

            es.onerror = () => {
                es.close();
                // Auto-reconnect after 10s
                setTimeout(connect, 10000);
            };
        }

        connect();

        return () => {
            eventSourceRef.current?.close();
        };
    }, [userId]);

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {popups.map(order => (
                    <div key={order.id} className="pointer-events-auto">
                        <OrderPopup
                            order={order}
                            onClose={() => removePopup(order.id)}
                        />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
}
