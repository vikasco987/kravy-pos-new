"use client";

import { useEffect, useRef, useState } from "react";
import { useTerminalContext } from "@/components/TerminalContext";
import { kravy } from "@/lib/sounds";
import { ShoppingBag, Check, X, Clock, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function IncomingOrderModal() {
    const { orders, setOrders } = useTerminalContext();
    const [isAccepting, setIsAccepting] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Get the oldest pending order
    const pendingOrders = orders
        .filter(o => o.status === "PENDING" && !o.isDeleted)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const currentOrder = pendingOrders.length > 0 ? pendingOrders[0] : null;

    useEffect(() => {
        if (currentOrder) {
            // Start looping alarm if not already started
            if (!intervalRef.current) {
                kravy.alertLoop();
                intervalRef.current = setInterval(() => {
                    kravy.alertLoop();
                }, 1800); // 1.8s loop
            }
        } else {
            // Stop looping if no pending orders
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [currentOrder?.id]);

    if (!currentOrder) return null;

    const handleAccept = async () => {
        setIsAccepting(true);
        kravy.click();
        
        try {
            const res = await fetch("/api/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: currentOrder.id, status: "ACCEPTED" })
            });

            if (res.ok) {
                kravy.orderAccept();
                toast.success("Order Accepted 🧑‍🍳");
                // Optimistic local update
                setOrders(prev => prev.map(o => o.id === currentOrder.id ? { ...o, status: "ACCEPTED" } : o));
            } else {
                throw new Error("Failed to accept");
            }
        } catch (err) {
            kravy.error();
            toast.error("Update failed");
        } finally {
            setIsAccepting(false);
        }
    };

    const handleReject = async () => {
        if (!confirm("Are you sure you want to reject this order? It will be deleted.")) return;
        setIsAccepting(true);
        kravy.click();
        
        try {
            const res = await fetch("/api/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: currentOrder.id, isDeleted: true })
            });

            if (res.ok) {
                kravy.orderCancel();
                toast.error("Order Rejected");
                setOrders(prev => prev.filter(o => o.id !== currentOrder.id));
            } else {
                throw new Error("Failed to reject");
            }
        } catch (err) {
            kravy.error();
            toast.error("Reject failed");
        } finally {
            setIsAccepting(false);
        }
    };

    const diffMins = Math.floor((Date.now() - new Date(currentOrder.createdAt).getTime()) / 60000);

    return (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
            {/* Full screen backdrop blur */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />

            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border-4 border-rose-500 overflow-hidden flex flex-col max-h-full">
                
                {/* Header */}
                <div className="bg-rose-500 text-white p-6 sm:p-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
                            <AlertTriangle size={32} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">New Order Received!</h2>
                            <p className="text-rose-100 font-bold text-sm sm:text-base mt-1 flex items-center gap-2">
                                <Clock size={16} /> 
                                {diffMins === 0 ? "Just now" : `${diffMins} min ago`}
                                {pendingOrders.length > 1 && (
                                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                                        + {pendingOrders.length - 1} more waiting
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 sm:p-8 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white capitalize">
                                {currentOrder.customerName || "Walk-in Guest"}
                            </p>
                            {currentOrder.table?.name && (
                                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                                    📍 {currentOrder.table.name}
                                </p>
                            )}
                            {currentOrder.customerPhone && (
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mt-1">
                                    📞 {currentOrder.customerPhone}
                                </p>
                            )}
                            {currentOrder.customerAddress && (
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mt-1 max-w-xs">
                                    🏠 {currentOrder.customerAddress}
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                            <p className="text-4xl font-black text-emerald-500">
                                ₹{currentOrder.total}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ShoppingBag size={14} /> 
                            Order Items ({currentOrder.items.length})
                        </p>
                        <div className="space-y-3">
                            {currentOrder.items.map((it, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-slate-600 dark:text-slate-300">
                                            {it.quantity}x
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{it.name}</p>
                                            {it.variants && it.variants.length > 0 && (
                                                <p className="text-xs font-medium text-slate-500 mt-0.5">
                                                    {it.variants.map((v: any) => v.name).join(", ")}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="font-black text-slate-900 dark:text-white">
                                        ₹{(it.price * it.quantity).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {currentOrder.notes && (
                        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                            <p className="text-xs font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1">Cooking Instructions</p>
                            <p className="text-sm font-bold text-amber-900 dark:text-amber-100">{currentOrder.notes}</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 shrink-0">
                    <button 
                        onClick={handleReject}
                        disabled={isAccepting}
                        className="flex-1 py-4 px-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-500 font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                        <X size={20} strokeWidth={3} /> Reject
                    </button>
                    <button 
                        onClick={handleAccept}
                        disabled={isAccepting}
                        className="flex-[2] py-4 px-6 rounded-2xl bg-emerald-500 text-white font-black text-lg uppercase tracking-widest hover:bg-emerald-600 active:scale-95 transition-all shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-3"
                    >
                        {isAccepting ? "Accepting..." : (
                            <>
                                <Check size={24} strokeWidth={4} /> Accept Order
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
