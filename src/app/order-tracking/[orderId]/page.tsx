"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    CheckCircle,
    UtensilsCrossed,
    ChefHat,
    Truck,
    Star,
    IndianRupee,
    Phone,
    User,
    RefreshCw,
    Plus,
    ChevronLeft,
    Receipt,
    History,
    MapPin,
    ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import MenuQRAddMoreFlow from "@/components/MenuQRAddMoreFlow";

interface OrderItem {
    name: string;
    price: number;
    quantity: number;
    itemId: string;
    addedAt: string;
    addedInCase?: string;
    isNew?: boolean;
}

interface Order {
    id: string;
    items: OrderItem[];
    total: number;
    status: string;
    customerName: string;
    customerPhone?: string;
    clerkUserId: string;
    table?: {
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

const statusConfig = {
    PENDING: {
        icon: Clock,
        label: "Order Received",
        color: "bg-yellow-500",
        description: "We've received your order and it's being reviewed"
    },
    ACCEPTING: {
        icon: UtensilsCrossed,
        label: "Order Confirmed",
        color: "bg-blue-500",
        description: "Your order has been confirmed by the restaurant"
    },
    ACCEPTED: {
        icon: CheckCircle,
        label: "Preparing",
        color: "bg-orange-500",
        description: "The kitchen is preparing your delicious food"
    },
    PREPARING: {
        icon: ChefHat,
        label: "Cooking",
        color: "bg-purple-500",
        description: "Your food is being cooked with care"
    },
    READY: {
        icon: Truck,
        label: "Ready to Serve",
        color: "bg-green-500",
        description: "Your order is ready and will be served soon"
    },
    SERVED: {
        icon: CheckCircle,
        label: "Served",
        color: "bg-green-600",
        description: "Your order has been served"
    },
    COMPLETED: {
        icon: CheckCircle,
        label: "Completed",
        color: "bg-gray-500",
        description: "Order completed. Enjoy your meal!"
    }
};

export default function OrderTrackingPage() {
    const params = useParams();
    const orderId = params.orderId as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddMore, setShowAddMore] = useState(false);
    const [sessionData, setSessionData] = useState<any>(null);

    useEffect(() => {
        if (orderId) {
            fetchOrder();
            // Set up auto-refresh every 30 seconds
            const interval = setInterval(fetchOrder, 30000);
            return () => clearInterval(interval);
        }
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const response = await fetch(`/api/public/orders?id=${orderId}`);
            if (response.ok) {
                const orderData = await response.json();
                setOrder(orderData);

                // Also fetch combined session data for aggregate bill
                const sessionRes = await fetch(`/api/public/orders/${orderId}/combined-bill`);
                if (sessionRes.ok) {
                    const sData = await sessionRes.json();
                    setSessionData(sData);
                }
            } else {
                toast.error("Order not found");
            }
        } catch (error) {
            toast.error("Failed to fetch order status");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchOrder();
    };

    const getStatusStep = (currentStatus: string) => {
        const statusOrder = ['PENDING', 'ACCEPTING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'];
        return statusOrder.indexOf(currentStatus);
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E23744]"></div>
                    <p className="text-[#696969] font-bold text-sm tracking-widest uppercase">Fetching Order Status...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-6 text-center">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full border border-red-50">
                    <div className="text-4xl mb-4">🏮</div>
                    <p className="text-gray-900 text-xl font-black mb-2">Order Not Found</p>
                    <p className="text-gray-500 text-sm mb-6">Seems like this table or order doesn't exist anymore.</p>
                    <Button
                        onClick={() => window.location.href = "/"}
                        className="w-full bg-[#E23744] hover:bg-[#c42f3a] rounded-xl h-12 font-bold"
                    >
                        Go to Home
                    </Button>
                </div>
            </div>
        );
    }

    const currentStatusConfig = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.PENDING;
    const StatusIcon = currentStatusConfig.icon;
    const currentStep = getStatusStep(order.status);

    return (
        <div className="min-h-screen bg-[#F4F4F4] font-sans text-[#1C1C1C]">
            <div className="max-w-[480px] mx-auto min-h-screen bg-[#F4F4F4] relative">

                {/* ── TOP NAVIGATION ── */}
                <nav className="sticky top-0 z-[100] bg-white border-b border-[#EBEBEB] px-4 py-3.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.location.href = `/menu/${order.clerkUserId}`}
                            className="w-9 h-9 rounded-full bg-[#F4F4F4] flex items-center justify-center text-[#1C1C1C]"
                        >
                            <ArrowLeft size={18} strokeWidth={2.5} />
                        </button>
                        <div>
                            <div className="text-[0.95rem] font-[900] leading-none">Order Tracking</div>
                            <div className="text-[0.65rem] text-[#ABABAB] font-[800] uppercase tracking-wider mt-1">
                                Table {order.table?.name || "Counter"} · #{order.id.slice(-6).toUpperCase()}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className={`w-9 h-9 rounded-full bg-[#F4F4F4] flex items-center justify-center transition-all ${refreshing ? "rotate-180" : ""}`}
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin text-[#E23744]' : 'text-[#696969]'} />
                    </button>
                </nav>

                <main className="pb-36 p-4 space-y-4">

                    {/* ── MAIN STATUS CARD ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-[#EBEBEB] text-center"
                    >
                        <div className="relative inline-block mb-6">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl mb-1 ${currentStatusConfig.color} border-4 border-white animate-pulse-slow`}>
                                <StatusIcon size={40} className="text-white" strokeWidth={2.5} />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#22C55E] border-4 border-white flex items-center justify-center text-[0.8rem]">⚡</div>
                        </div>

                        <h2 className="text-[1.8rem] font-[900] tracking-tight text-[#1C1C1C] mb-1 leading-tight">
                            {currentStatusConfig.label}
                        </h2>
                        <p className="text-[0.85rem] text-[#696969] font-[600] px-4">
                            {currentStatusConfig.description}
                        </p>

                        {/* Status Progress Bar */}
                        <div className="mt-8 flex items-center justify-between w-full px-2">
                            {Object.entries(statusConfig).map(([status, config]: [string, any], index: number) => {
                                const isActive = index <= currentStep;
                                const isCurrent = status === order.status;
                                return (
                                    <div key={status} className="flex-1 flex flex-col items-center relative">
                                        <div className={`w-3 h-3 rounded-full z-10 border-2 transition-all duration-700 ${isActive ? "bg-[#E23744] border-[#E23744] scale-125" : "bg-white border-[#EBEBEB]"
                                            }`} />
                                        {isCurrent && (
                                            <div className="absolute -top-1 w-5 h-5 bg-[#E23744]/20 rounded-full animate-ping" />
                                        )}
                                        {index < 6 && (
                                            <div className={`absolute left-1/2 top-1.5 w-full h-[2px] transition-all duration-1000 ${index < currentStep ? "bg-[#E23744]" : "bg-[#EBEBEB]"
                                                }`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between mt-3 px-2">
                            <span className="text-[0.6rem] font-[900] text-[#E23744] uppercase tracking-tighter">Placed</span>
                            <span className="text-[0.6rem] font-[900] text-[#696969] uppercase tracking-tighter">Served</span>
                        </div>
                    </motion.div>

                    {/* ── LOYALTY PROGRESS (MASALA HOUSE SPECIAL) ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-[#1a0a00] to-[#2d1500] rounded-[2rem] p-5 shadow-lg relative overflow-hidden"
                    >
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="text-3xl">👑</div>
                                <div>
                                    <div className="text-[0.85rem] font-[800] text-[#F0EAD6]">Loyalty Member</div>
                                    <div className="text-[0.68rem] text-[#F0EAD6]/60">Order total: ₹{order.total}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[#D4A353] font-[Syne] font-[900] text-xl">+{Math.floor(order.total / 10)}</div>
                                <div className="text-[0.55rem] font-[900] text-[#D4A353] uppercase">Points Earned</div>
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(212,163,83,0.15),transparent)] pointer-events-none" />
                    </motion.div>

                    {/* ── ORDER ITEMS & BILL ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-[#EBEBEB]"
                    >
                        <div className="px-6 py-5 border-b border-[#F7F7F7] flex items-center justify-between bg-[#FCFCFC]">
                            <h3 className="font-[900] text-[0.95rem] flex items-center gap-2">
                                <Receipt size={18} className="text-[#E23744]" />
                                Final Bill Breakdown
                            </h3>
                            <button className="text-[0.7rem] font-[800] text-[#3B82F6] underline decoration-blue-200" onClick={() => setShowAddMore(true)}>Naya Item Add Karein +</button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* If there's a session (case 1/2), show combined summary */}
                            {sessionData && sessionData.orders.length > 1 ? (
                                <div className="mb-6 bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
                                    <div className="text-[0.7rem] font-[900] text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <History size={12} /> Multiple Orders Combined
                                    </div>
                                    <div className="space-y-2">
                                        {sessionData.orders.map((o: any, idx: number) => (
                                            <div key={o.id} className="flex justify-between items-center text-[0.8rem] font-[700]">
                                                <span className="text-[#696969]">Order #{idx + 1}</span>
                                                <span>₹{o.total}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            <div className="space-y-3.5">
                                {order.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <div className={`w-3 h-3 border-[1.5px] rounded-sm flex items-center justify-center shrink-0 ${item.quantity > 0 ? "border-[#22C55E]" : "border-[#E23744]"}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${item.quantity > 0 ? "bg-[#22C55E]" : "bg-[#E23744]"}`} />
                                                </div>
                                                <span className="font-[800] text-[0.9rem] leading-tight truncate">{item.name}</span>
                                                {item.isNew && (
                                                    <span className="bg-[#E23744] text-white text-[0.55rem] font-[900] px-1.5 py-0.5 rounded uppercase tracking-tighter">Naya</span>
                                                )}
                                            </div>
                                            <div className="text-[0.7rem] text-[#696969] space-x-2">
                                                <span>{item.quantity} Quantity</span>
                                                <span>·</span>
                                                <span>₹{item.price} each</span>
                                            </div>
                                        </div>
                                        <div className="font-[900] text-[0.9rem] text-[#1C1C1C]">₹{item.price * item.quantity}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-5 border-t border-dashed border-[#EBEBEB] space-y-2">
                                <div className="flex justify-between text-[0.85rem] font-[700] text-[#696969]">
                                    <span>Subtotal</span>
                                    <span>₹{order.total}</span>
                                </div>
                                <div className="flex justify-between text-[0.85rem] font-[700] text-[#696969]">
                                    <span>Taxes & GST</span>
                                    <span>₹{Math.round(order.total * 0.05)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 mt-1 text-[1.2rem] font-[900] text-[#1C1C1C] italic tracking-tighter translate-x-[-1px]">
                                    <span className="flex items-center gap-2">To Pay <IndianRupee size={16} /></span>
                                    <span className="text-[#E23744] text-[1.4rem]">₹{Math.round(order.total * 1.05)}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── CUSTOMER & ORDER INFO ── */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-[#EBEBEB]">
                            <div className="w-8 h-8 rounded-full bg-[#F4F4F4] flex items-center justify-center mb-3">
                                <User size={16} className="text-[#696969]" />
                            </div>
                            <div className="text-[0.65rem] font-[800] text-[#ABABAB] uppercase tracking-wider mb-1">Customer</div>
                            <div className="text-[0.85rem] font-[900] truncate">{order.customerName}</div>
                            <div className="text-[0.7rem] font-[700] text-[#696969] mt-0.5">{order.customerPhone || "Guest"}</div>
                        </div>
                        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-[#EBEBEB]">
                            <div className="w-8 h-8 rounded-full bg-[#F4F4F4] flex items-center justify-center mb-3">
                                <Clock size={16} className="text-[#696969]" />
                            </div>
                            <div className="text-[0.65rem] font-[800] text-[#ABABAB] uppercase tracking-wider mb-1">Time</div>
                            <div className="text-[0.85rem] font-[900] truncate">{formatTime(order.createdAt)}</div>
                            <div className="text-[0.7rem] font-[700] text-[#696969] mt-0.5">{formatDate(order.createdAt)}</div>
                        </div>
                    </div>

                    {/* Finish Action */}
                    {order.status === 'COMPLETED' && (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-6 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-3xl text-center">
                            <Star className="mx-auto mb-2 text-[#22C55E]" size={32} />
                            <h3 className="font-black text-lg text-[#166534]">Enjoyed your meal?</h3>
                            <p className="text-sm text-[#166534] mb-4">Rate us 5 stars to earn 50 bonus points!</p>
                            <Button className="w-full bg-[#22C55E] hover:bg-[#16a34a] rounded-xl font-bold h-12 shadow-lg shadow-green-100">Rate Now ⭐</Button>
                        </motion.div>
                    )}

                </main>

                {/* ── STICKY ADD MORE BAR ── */}
                <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-6 z-[100] pointer-events-none">
                    <motion.button
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="w-full pointer-events-auto bg-[#E23744] text-white h-16 rounded-[1.2rem] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-lg font-black italic tracking-tight"
                        onClick={() => setShowAddMore(true)}
                    >
                        <Plus size={24} strokeWidth={3} />
                        KUCH AUR MANGWAO?
                    </motion.button>
                </div>

                {/* ── ADD MORE FLOW OVERLAY ── */}
                <AnimatePresence>
                    {showAddMore && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-end justify-center"
                        >
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="bg-white w-full max-w-[480px] rounded-t-[3rem] shadow-2xl relative overflow-hidden h-[92vh]"
                            >
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-[#EBEBEB] rounded-full z-[210]" />
                                <button
                                    onClick={() => setShowAddMore(false)}
                                    className="absolute top-6 right-6 z-[210] bg-[#F4F4F4]/80 backdrop-blur p-2 rounded-full text-[#1C1C1C]"
                                >
                                    <Plus className="h-6 w-6 rotate-45" />
                                </button>

                                <div className="h-full overflow-y-auto pt-4 no-scrollbar">
                                    <MenuQRAddMoreFlow
                                        clerkUserId={order.clerkUserId}
                                        onClose={() => {
                                            setShowAddMore(false);
                                            fetchOrder();
                                        }}
                                        orderData={{
                                            orderId: order.id,
                                            tableId: order.table?.name || "Counter",
                                            status: (order.status.toLowerCase() as any) || "received",
                                            items: order.items.map((i: any) => ({ name: i.name, qty: i.quantity, price: i.price })),
                                            createdAt: formatTime(order.createdAt),
                                            currentTotal: order.total,
                                            customerName: order.customerName,
                                            customerPhone: order.customerPhone || ""
                                        }}
                                    />
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <style jsx global>{`
                    .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.95; transform: scale(1.02); } }
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
            </div>
        </div>
    );
}
