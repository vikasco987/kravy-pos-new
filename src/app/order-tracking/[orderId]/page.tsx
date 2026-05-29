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
    ArrowLeft,
    MessageCircle
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
    customerAddress?: string;
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
            // Set up auto-refresh every 15 seconds
            const interval = setInterval(fetchOrder, 15000);
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
        <div className="min-h-screen bg-[#F8F8F8] font-sans text-[#1C1C1C] overflow-x-hidden w-full" style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
            <div className="max-w-[480px] mx-auto min-h-screen bg-[#F8F8F8] relative overflow-x-hidden w-full flex flex-col">

                {/* ── COMPACT TOP NAVIGATION ── */}
                <nav className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b border-[#EBEBEB] px-4 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.location.href = `/menu/${order.clerkUserId}`}
                            className="w-8 h-8 rounded-full bg-[#F8F8F8] flex items-center justify-center text-[#1C1C1C] hover:bg-[#EBEBEB] transition-colors"
                        >
                            <ArrowLeft size={16} strokeWidth={2.5} />
                        </button>
                        <div className="min-w-0 flex-1">
                            <div className="text-[0.9rem] font-[800] leading-none truncate tracking-tight">{order.table?.name ? `Table ${order.table.name}` : "Order Tracking"}</div>
                            <div className="text-[0.65rem] text-[#696969] font-[700] mt-1 flex items-center gap-1.5 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse shrink-0" />
                                <span className="truncate">Live • #{order.id.slice(-6).toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                </nav>

                <main className="pb-40 p-4 flex-1">

                    {/* ── MAIN STATUS CARD ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-5 shadow-sm border border-[#EBEBEB] mb-6"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm bg-[#EF4F5F]/10 text-[#EF4F5F] relative`}>
                                <StatusIcon size={28} strokeWidth={2.5} />
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#22C55E] border-2 border-white flex items-center justify-center text-[10px]">⚡</div>
                            </div>
                            <div className="flex-1 text-left">
                                <h2 className="text-[1.35rem] font-[900] tracking-tight text-[#1C1C1C] leading-tight">
                                    {currentStatusConfig.label}
                                </h2>
                                <p className="text-[0.8rem] text-[#696969] font-[600] mt-0.5">
                                    {currentStatusConfig.description}
                                </p>
                            </div>
                        </div>

                        {/* Minimal Horizontal Stepper */}
                        <div className="relative pt-2 pb-2 w-full">
                            <div className="absolute top-[12px] left-4 right-4 h-[3px] bg-[#F4F4F4] rounded-full" />
                            <div className="flex items-start justify-between relative z-10">
                                {Object.entries(statusConfig).map(([status, config]: [string, any], index: number) => {
                                    const statusOrder = ['PENDING', 'ACCEPTING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'];
                                    const stepIndex = statusOrder.indexOf(status);
                                    const isActive = stepIndex <= currentStep;
                                    const isCurrent = status === order.status;
                                    const Icon = config.icon;

                                    return (
                                        <div key={status} className="flex flex-col items-center relative z-10 w-12 shrink-0">
                                            {/* Progress line overlay */}
                                            {index > 0 && index <= currentStep && (
                                                <div className="absolute top-[12px] right-[50%] w-full h-[3px] bg-[#EF4F5F]" />
                                            )}
                                            
                                            {/* Dot Container */}
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm relative z-20 ${
                                                isCurrent ? "bg-[#EF4F5F] border-2 border-white scale-110 shadow-md" : 
                                                isActive ? "bg-[#EF4F5F] border-2 border-white" : "bg-white border-2 border-[#EBEBEB]"
                                            }`}>
                                                <Icon size={12} className={isActive ? "text-white" : "text-[#ABABAB]"} />
                                                {isCurrent && (
                                                    <div className="absolute inset-0 rounded-full border-2 border-[#EF4F5F] animate-ping opacity-20" />
                                                )}
                                            </div>
                                            
                                            {/* Label */}
                                            <div className="mt-2 text-center w-full">
                                                <span className={`block text-[0.55rem] font-[800] uppercase tracking-tighter leading-tight transition-all duration-500 break-words ${
                                                    isCurrent ? "text-[#EF4F5F]" : isActive ? "text-[#1C1C1C]" : "text-[#ABABAB]"
                                                }`}>
                                                    {config.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>

                    {/* ── LOYALTY PROGRESS (MASALA HOUSE SPECIAL) ── */}
                    <div className="mb-6">
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
                        <div className="mt-3 px-3 text-center">
                            <p className="text-[0.75rem] font-[600] text-[#696969]">
                                You earn <span className="text-[#E23744] font-bold">10%</span> of your bill as loyalty points. Use them on your next visit!
                            </p>
                        </div>
                    </div>

                    {/* ── ORDER ITEMS & BILL ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#EBEBEB] mb-6"
                    >
                        <div className="px-5 py-4 border-b border-dashed border-[#EBEBEB] flex items-center justify-between">
                            <h3 className="font-[800] text-[0.95rem] flex items-center gap-2 tracking-tight text-[#1C1C1C]">
                                <Receipt size={16} className="text-[#696969]" />
                                Bill Details
                            </h3>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* If there's a session (case 1/2), show combined summary */}
                            {sessionData && sessionData.orders.length > 1 ? (
                                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
                                    <div className="text-[0.7rem] font-[800] text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <History size={12} /> Combined Orders
                                    </div>
                                    <div className="space-y-2">
                                        {sessionData.orders.map((o: any, idx: number) => (
                                            <div key={o.id} className="flex justify-between items-center text-[0.8rem] font-[700]">
                                                <span className="text-[#696969]">Order #{idx + 1}</span>
                                                <span className="text-[#1C1C1C]">₹{o.total}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            <div className="space-y-4">
                                {order.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0 flex items-start gap-2.5">
                                            <div className={`mt-[3px] w-[13px] h-[13px] border-[1.5px] rounded-[3px] flex items-center justify-center shrink-0 ${item.quantity > 0 ? "border-[#22C55E]" : "border-[#EF4F5F]"}`}>
                                                <div className={`w-[7px] h-[7px] rounded-full ${item.quantity > 0 ? "bg-[#22C55E]" : "bg-[#EF4F5F]"}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-[600] text-[0.9rem] leading-snug text-[#1C1C1C] break-words">
                                                    {item.name} <span className="text-[#696969] ml-1 font-[500]">×{item.quantity}</span>
                                                </div>
                                                {item.isNew && (
                                                    <span className="bg-[#FC8019]/10 text-[#FC8019] text-[0.55rem] font-[800] px-1.5 py-0.5 rounded uppercase tracking-tighter mt-1 inline-block">New</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="font-[600] text-[0.9rem] text-[#1C1C1C] shrink-0">₹{item.price * item.quantity}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-dashed border-[#EBEBEB] space-y-3">
                                <div className="flex justify-between items-center text-[0.8rem] font-[500] text-[#696969]">
                                    <span>Subtotal</span>
                                    <span className="text-[#1C1C1C] font-[600]">₹{order.total}</span>
                                </div>
                                <div className="flex justify-between items-center text-[0.8rem] font-[500] text-[#696969]">
                                    <span>Taxes & GST</span>
                                    <span className="text-[#1C1C1C] font-[600]">₹{Math.round(order.total * 0.05)}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[#EBEBEB] flex justify-between items-center">
                                <span className="font-[800] text-[1.05rem] text-[#1C1C1C]">Total Payable</span>
                                <span className="font-[900] text-[1.15rem] text-[#1C1C1C]">₹{Math.round(order.total * 1.05)}</span>
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

                    {/* ── DELIVERY ADDRESS ── */}
                    {order.customerAddress && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[2rem] p-5 shadow-sm border border-[#EBEBEB] flex items-start gap-4"
                        >
                            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                                <MapPin size={20} className="text-orange-500" />
                            </div>
                            <div className="flex-1">
                                <div className="text-[0.65rem] font-[800] text-[#ABABAB] uppercase tracking-wider mb-1 text-left">Delivery Address</div>
                                <div className="text-[0.85rem] font-[900] text-left leading-snug">{order.customerAddress}</div>
                            </div>
                        </motion.div>
                    )}

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

                {/* ── FLOATING SUPPORT ACTION ── */}
                <div className="fixed bottom-24 right-4 z-[90] max-w-[480px] w-full mx-auto pointer-events-none flex justify-end px-4 left-1/2 -translate-x-1/2">
                    <motion.a
                        href="https://wa.me/"
                        target="_blank"
                        rel="noreferrer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xl shadow-[#25D366]/30 pointer-events-auto border-2 border-white"
                    >
                        <MessageCircle size={26} strokeWidth={2} />
                    </motion.a>
                </div>

                {/* ── STICKY TOTAL & ADD MORE BAR ── */}
                <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/85 backdrop-blur-xl border-t border-white/40 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] px-5 py-4 z-[100]">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <span className="text-[0.65rem] font-[800] text-[#696969] uppercase tracking-widest">Total Payable</span>
                            <span className="text-[1.3rem] font-[900] text-[#1C1C1C] leading-none mt-0.5">₹{Math.round(order.total * 1.05)}</span>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-[#FC8019] flex-1 text-white h-12 rounded-[1rem] shadow-lg shadow-[#FC8019]/20 flex items-center justify-center gap-2 font-[800] text-[0.95rem] tracking-tight"
                            onClick={() => setShowAddMore(true)}
                        >
                            <Plus size={18} strokeWidth={3} />
                            Order More
                        </motion.button>
                    </div>
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
