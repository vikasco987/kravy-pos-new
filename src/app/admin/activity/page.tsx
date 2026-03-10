// "use client";

// import { useEffect, useRef, useState } from "react";
// import { toast } from "sonner";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Activity,
//   User,
//   Terminal,
//   Clock,
//   History,
//   AlertCircle,
//   CheckCircle2,
//   ChevronRight,
//   RefreshCw,
//   Search
// } from "lucide-react";

// type Log = {
//   id: string;
//   action: string;
//   meta?: string;
//   createdAt: string;
//   user: {
//     name: string;
//     email: string;
//     role: string;
//   };
// };

// export default function AdminActivityPage() {
//   const [logs, setLogs] = useState<Log[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const lastTimeRef = useRef<string | null>(null);

//   const fetchLogs = async (isInitial = false) => {
//     if (!isInitial) setIsRefreshing(true);
//     try {
//       const url = lastTimeRef.current
//         ? `/api/admin/activity?since=${lastTimeRef.current}`
//         : "/api/admin/activity";

//       const res = await fetch(url);
//       if (!res.ok) throw new Error("Forbidden");

//       const data: Log[] = await res.json();

//       if (data.length > 0) {
//         lastTimeRef.current = data[0].createdAt;
//         setLogs((prev) => [...data, ...prev]);
//         if (!isInitial) toast.success(`New activity detected`, { duration: 2000 });
//       }
//     } catch (err) {
//       if (isInitial) toast.error("Access denied");
//     } finally {
//       if (isInitial) setLoading(false);
//       setIsRefreshing(false);
//     }
//   };

//   /* initial load */
//   useEffect(() => {
//     fetchLogs(true);
//   }, []);

//   /* 🔁 realtime polling */
//   useEffect(() => {
//     const interval = setInterval(() => {
//       fetchLogs().catch(() => { });
//     }, 10000); // every 10 seconds for better performance

//     return () => clearInterval(interval);
//   }, []);

//   const getActionColor = (action: string) => {
//     if (action.includes("DELETE")) return "text-red-500 bg-red-500/10 border-red-500/20";
//     if (action.includes("UPDATE") || action.includes("EDIT")) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
//     if (action.includes("CREATE") || action.includes("ADD")) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
//     return "text-indigo-500 bg-indigo-500/10 border-indigo-500/20 text-blue-500";
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[var(--kravy-bg)] flex items-center justify-center">
//         <div className="flex flex-col items-center gap-4">
//           <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
//             <RefreshCw className="w-10 h-10 text-indigo-600" />
//           </motion.div>
//           <p className="text-[var(--kravy-text-muted)] font-black uppercase tracking-widest text-xs">Synchronizing Logs...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-4 md:p-8 bg-[var(--kravy-bg)] min-h-screen">
//       <div className="max-w-7xl mx-auto space-y-8">

//         {/* Header Area */}
//         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
//           <div className="space-y-2">
//             <h1 className="text-4xl font-black text-[var(--kravy-text-primary)] tracking-tight flex items-center gap-4">
//               <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
//                 <Activity className="w-6 h-6" />
//               </div>
//               Activity Pulse
//             </h1>
//             <p className="text-[var(--kravy-text-muted)] font-medium text-lg flex items-center gap-2">
//               Real-time system monitoring <Clock className="w-4 h-4 animate-pulse" />
//             </p>
//           </div>

//           <div className="flex items-center gap-3">
//             <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl px-4 py-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-muted)]">
//               <div className={`w-2 h-2 rounded-full ${isRefreshing ? "bg-amber-500 animate-ping" : "bg-emerald-500"}`} />
//               {isRefreshing ? "Polling..." : "Stream Live"}
//             </div>
//             <button
//               onClick={() => fetchLogs()}
//               className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
//             >
//               <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
//             </button>
//           </div>
//         </div>

//         {/* Quick Stats Panel */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           {[
//             { label: "Pulse Strength", value: "99.9%", icon: Activity, color: "text-emerald-500" },
//             { label: "Active Sessions", value: "14", icon: User, color: "text-blue-500" },
//             { label: "Alert Level", value: "Normal", icon: AlertCircle, color: "text-indigo-500" }
//           ].map((stat, i) => (
//             <div key={i} className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] p-5 rounded-3xl flex items-center gap-4 shadow-sm">
//               <div className={`w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center ${stat.color} border border-gray-100`}>
//                 <stat.icon className="w-6 h-6" />
//               </div>
//               <div>
//                 <p className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest">{stat.label}</p>
//                 <p className="text-xl font-black text-[var(--kravy-text-primary)] tracking-tight">{stat.value}</p>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Main Feed */}
//         <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-[40px] shadow-2xl overflow-hidden">
//           <div className="overflow-x-auto no-scrollbar">
//             <table className="w-full text-left border-collapse">
//               <thead>
//                 <tr className="bg-gray-50/50">
//                   <th className="px-8 py-5 text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest border-b border-[var(--kravy-border)]">Operator</th>
//                   <th className="px-8 py-5 text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest border-b border-[var(--kravy-border)]">Operation</th>
//                   <th className="px-8 py-5 text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest border-b border-[var(--kravy-border)]">Descriptor</th>
//                   <th className="px-8 py-5 text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest border-b border-[var(--kravy-border)]">Timestamp</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-[var(--kravy-border)]">
//                 <AnimatePresence>
//                   {logs.map((l, i) => (
//                     <motion.tr
//                       initial={i < 5 ? { opacity: 0, x: -20 } : false}
//                       animate={{ opacity: 1, x: 0 }}
//                       transition={{ delay: i * 0.05 }}
//                       key={l.id}
//                       className="group hover:bg-gray-50/50 transition-all cursor-default"
//                     >
//                       <td className="px-8 py-6">
//                         <div className="flex items-center gap-4">
//                           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-xs shadow-md">
//                             {l.user.name[0]}
//                           </div>
//                           <div className="min-w-0">
//                             <div className="font-black text-sm text-[var(--kravy-text-primary)] truncate">{l.user.name}</div>
//                             <div className="text-[10px] text-[var(--kravy-text-muted)] font-bold flex items-center gap-1">
//                               {l.user.email} <span className="opacity-30">•</span> {l.user.role}
//                             </div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-8 py-6">
//                         <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getActionColor(l.action)}`}>
//                           {l.action.includes("CREATE") ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Terminal className="w-2.5 h-2.5" />}
//                           {l.action}
//                         </span>
//                       </td>
//                       <td className="px-8 py-6">
//                         <div className="text-sm font-semibold text-[var(--kravy-text-muted)] group-hover:text-[var(--kravy-text-primary)] transition-colors max-w-xs truncate italic">
//                           {l.meta || "—"}
//                         </div>
//                       </td>
//                       <td className="px-8 py-6">
//                         <div className="text-[11px] font-black text-[var(--kravy-text-primary)] whitespace-nowrap flex items-center gap-2">
//                           <Clock className="w-3.5 h-3.5 text-gray-300" />
//                           {new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
//                           <span className="text-gray-200 ml-1 font-medium">{new Date(l.createdAt).toLocaleDateString()}</span>
//                         </div>
//                       </td>
//                     </motion.tr>
//                   ))}
//                 </AnimatePresence>
//               </tbody>
//             </table>

//             {logs.length === 0 && (
//               <div className="p-20 text-center space-y-4">
//                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-4xl grayscale opacity-30">🗂️</div>
//                 <h3 className="text-lg font-black text-[var(--kravy-text-muted)]">No system events detected yet</h3>
//                 <p className="text-sm font-medium text-gray-300">Activity logs will populate here once system operations occur.</p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Footer info */}
//         <div className="text-center">
//           <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
//             Pulse System Version 2.0.4.Beta
//           </p>
//         </div>

//       </div>

//       <style jsx global>{`
//         .no-scrollbar::-webkit-scrollbar { display: none; }
//         .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
//       `}</style>
//     </div>
//   );
// }












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
  Receipt,
  History,
  ArrowLeft,
  Flame,
  Sparkles
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
  table?: { name: string };
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  PENDING: {
    icon: Clock,
    label: "Order Received",
    color: "#F59E0B",
    bg: "#FFFBEB",
    ring: "#FDE68A",
    emoji: "🕐",
    description: "We've received your order and it's being reviewed"
  },
  ACCEPTING: {
    icon: UtensilsCrossed,
    label: "Order Confirmed",
    color: "#3B82F6",
    bg: "#EFF6FF",
    ring: "#BFDBFE",
    emoji: "✅",
    description: "Your order has been confirmed by the restaurant"
  },
  ACCEPTED: {
    icon: CheckCircle,
    label: "Getting Ready",
    color: "#F97316",
    bg: "#FFF7ED",
    ring: "#FED7AA",
    emoji: "🔥",
    description: "The kitchen is preparing your delicious food"
  },
  PREPARING: {
    icon: ChefHat,
    label: "Cooking Now",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    ring: "#DDD6FE",
    emoji: "👨‍🍳",
    description: "Your food is being cooked with love and care"
  },
  READY: {
    icon: Truck,
    label: "Ready to Serve!",
    color: "#10B981",
    bg: "#ECFDF5",
    ring: "#A7F3D0",
    emoji: "🍽️",
    description: "Your order is ready and will be served shortly"
  },
  SERVED: {
    icon: CheckCircle,
    label: "Served & Enjoyed",
    color: "#059669",
    bg: "#ECFDF5",
    ring: "#6EE7B7",
    emoji: "😋",
    description: "Your order has been served. Enjoy!"
  },
  COMPLETED: {
    icon: CheckCircle,
    label: "Completed",
    color: "#6B7280",
    bg: "#F9FAFB",
    ring: "#E5E7EB",
    emoji: "🎉",
    description: "Order completed. Thank you for dining with us!"
  }
};

const statusOrder = ['PENDING', 'ACCEPTING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'];

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

  const getStatusStep = (currentStatus: string) => statusOrder.indexOf(currentStatus);

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FFF8F0 0%, #FFF3E8 50%, #FFEEDD 100%)" }}>
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-[#F97316]/20 border-t-[#F97316] animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center text-2xl">🍜</span>
          </div>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#C2410C", fontWeight: 700, letterSpacing: "0.05em", fontSize: "0.85rem" }}>
            Fetching your order...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center" style={{ background: "linear-gradient(135deg, #FFF8F0 0%, #FFEEDD 100%)" }}>
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full border border-orange-100">
          <div className="text-6xl mb-4">🏮</div>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 900, color: "#1C1C1C", marginBottom: "0.5rem" }}>Order Not Found</p>
          <p style={{ color: "#9CA3AF", fontSize: "0.85rem", marginBottom: "1.5rem" }}>This order doesn't exist or may have expired.</p>
          <button
            onClick={() => window.location.href = "/"}
            style={{ width: "100%", background: "linear-gradient(135deg, #F97316, #EF4444)", color: "white", border: "none", borderRadius: "1rem", height: "3.2rem", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer" }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const cfg = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.PENDING;
  const StatusIcon = cfg.icon;
  const currentStep = getStatusStep(order.status);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #FFF8F0 0%, #FFF3E8 40%, #FFEEDD 100%)", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: "#1C1C1C" }}>
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');
                
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

                .status-glow {
                    box-shadow: 0 0 0 6px var(--ring), 0 20px 60px -10px rgba(0,0,0,0.15), 0 8px 24px -4px rgba(0,0,0,0.1);
                }

                @keyframes breathe {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 0 6px var(--ring), 0 20px 60px -10px rgba(0,0,0,0.15); }
                    50% { transform: scale(1.03); box-shadow: 0 0 0 10px var(--ring), 0 24px 70px -8px rgba(0,0,0,0.2); }
                }

                @keyframes ripple {
                    0% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(2.2); opacity: 0; }
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }

                .card { background: white; border-radius: 2rem; border: 1px solid rgba(249,115,22,0.08); box-shadow: 0 2px 20px rgba(0,0,0,0.04), 0 0 0 1px rgba(255,255,255,0.8); }
                .anim-1 { animation: slideUp 0.5s ease forwards; }
                .anim-2 { animation: slideUp 0.5s 0.1s ease both; }
                .anim-3 { animation: slideUp 0.5s 0.2s ease both; }
                .anim-4 { animation: slideUp 0.5s 0.3s ease both; }
                .anim-5 { animation: slideUp 0.5s 0.4s ease both; }

                .add-btn {
                    background: linear-gradient(135deg, #F97316 0%, #EF4444 100%);
                    box-shadow: 0 8px 32px rgba(249,115,22,0.4), 0 2px 8px rgba(0,0,0,0.1);
                    transition: all 0.2s ease;
                }
                .add-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(249,115,22,0.5); }
                .add-btn:active { transform: scale(0.97); }

                .dot-active { background: #F97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.25); }
                .dot-done { background: #F97316; }
                .dot-future { background: #E5E7EB; }

                .loyalty-card {
                    background: linear-gradient(135deg, #FFF8F0 0%, #FFF0E0 50%, #FFE8CC 100%);
                    border: 1px solid rgba(249,115,22,0.15);
                    position: relative;
                    overflow: hidden;
                }

                .loyalty-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(ellipse at 80% 20%, rgba(251,191,36,0.2) 0%, transparent 60%);
                }

                .rupee-pill {
                    background: linear-gradient(135deg, #F97316, #EF4444);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .veg-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex-shrink: 0; margin-top: 3px; }
            `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", position: "relative" }}>

        {/* ── NAVBAR ── */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(255,248,240,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(249,115,22,0.1)",
          padding: "0.875rem 1rem",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={() => window.location.href = `/menu/${order.clerkUserId}`}
              style={{ width: 38, height: 38, borderRadius: "50%", background: "white", border: "1px solid rgba(249,115,22,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            >
              <ArrowLeft size={16} color="#F97316" strokeWidth={2.5} />
            </button>
            <div>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "1rem", color: "#1C1C1C", lineHeight: 1.2 }}>
                Order Tracking
              </div>
              <div style={{ fontSize: "0.62rem", color: "#F97316", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>
                Table {order.table?.name || "Counter"} · #{order.id.slice(-6).toUpperCase()}
              </div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ width: 38, height: 38, borderRadius: "50%", background: "white", border: "1px solid rgba(249,115,22,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "transform 0.3s", transform: refreshing ? "rotate(360deg)" : "none" }}
          >
            <RefreshCw size={15} color={refreshing ? "#F97316" : "#9CA3AF"} className={refreshing ? "animate-spin" : ""} />
          </button>
        </nav>

        <main style={{ padding: "1rem", paddingBottom: "10rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* ── STATUS HERO CARD ── */}
          <div className="card anim-1" style={{ padding: "2rem 1.5rem", textAlign: "center" }}>

            {/* Emoji Status Badge */}
            <div style={{ position: "relative", display: "inline-flex", marginBottom: "1.5rem" }}>
              {/* Ripple */}
              <div style={{
                position: "absolute", inset: -8,
                borderRadius: "50%",
                background: cfg.bg,
                animation: "ripple 2s ease-out infinite",
                "--ring": cfg.ring
              } as any} />
              <div style={{
                width: 96, height: 96, borderRadius: "50%",
                background: cfg.bg,
                border: `3px solid ${cfg.ring}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "2.4rem",
                animation: "breathe 3s ease-in-out infinite",
                "--ring": cfg.ring,
                position: "relative", zIndex: 1
              } as any}>
                {cfg.emoji}
              </div>
            </div>

            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "2rem", fontWeight: 900, color: "#1C1C1C", lineHeight: 1.1, marginBottom: "0.5rem" }}>
              {cfg.label}
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#6B7280", fontWeight: 500, maxWidth: 260, margin: "0 auto" }}>
              {cfg.description}
            </p>

            {/* Progress Steps */}
            <div style={{ marginTop: "2rem", padding: "0 0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {statusOrder.slice(0, 6).map((status, idx) => {
                  const isDone = idx < currentStep;
                  const isCurrent = status === order.status;
                  const isFuture = idx > currentStep;
                  return (
                    <div key={status} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                      <div style={{
                        width: 12, height: 12, borderRadius: "50%",
                        background: isFuture ? "#E5E7EB" : "#F97316",
                        boxShadow: isCurrent ? "0 0 0 4px rgba(249,115,22,0.2)" : "none",
                        transform: isCurrent ? "scale(1.3)" : "scale(1)",
                        transition: "all 0.4s ease",
                        zIndex: 2, position: "relative"
                      }} />
                      {idx < 5 && (
                        <div style={{
                          position: "absolute", left: "50%", top: 5,
                          width: "100%", height: 2,
                          background: isDone ? "#F97316" : "#F3F4F6",
                          transition: "background 0.6s ease"
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.6rem" }}>
                <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "#F97316", textTransform: "uppercase", letterSpacing: "0.05em" }}>Placed</span>
                <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>Served</span>
              </div>
            </div>
          </div>

          {/* ── LOYALTY BANNER ── */}
          <div className="loyalty-card anim-2" style={{ borderRadius: "2rem", padding: "1.25rem 1.5rem" }}>
            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                <div style={{ fontSize: "2rem", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}>👑</div>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "0.9rem", color: "#92400E" }}>Loyalty Member</div>
                  <div style={{ fontSize: "0.68rem", color: "#B45309", fontWeight: 600, marginTop: 2 }}>
                    Order total · ₹{order.total}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontSize: "1.6rem", color: "#D97706" }}>
                  +{Math.floor(order.total / 10)}
                </div>
                <div style={{ fontSize: "0.55rem", fontWeight: 900, color: "#B45309", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Points Earned
                </div>
              </div>
            </div>
          </div>

          {/* ── BILL CARD ── */}
          <div className="card anim-3" style={{ overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #FFF3E8", background: "#FFFAF6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FFF3E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Receipt size={15} color="#F97316" />
                </div>
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "0.95rem" }}>Bill Breakdown</span>
              </div>
              <button
                onClick={() => setShowAddMore(true)}
                style={{ fontSize: "0.7rem", fontWeight: 800, color: "#F97316", background: "#FFF3E8", border: "none", borderRadius: "2rem", padding: "0.3rem 0.75rem", cursor: "pointer" }}
              >
                + Add More
              </button>
            </div>

            <div style={{ padding: "1.5rem" }}>
              {/* Combined session note */}
              {sessionData && sessionData.orders.length > 1 && (
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "1rem", padding: "1rem", marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#3B82F6", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                    <History size={11} /> Multiple Orders Combined
                  </div>
                  {sessionData.orders.map((o: any, idx: number) => (
                    <div key={o.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, marginTop: 4 }}>
                      <span style={{ color: "#6B7280" }}>Order #{idx + 1}</span>
                      <span>₹{o.total}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: 2 }}>
                        <div style={{
                          width: 12, height: 12, border: `1.5px solid ${item.quantity > 0 ? "#22C55E" : "#EF4444"}`,
                          borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                        }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.quantity > 0 ? "#22C55E" : "#EF4444" }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                        {item.isNew && (
                          <span style={{ background: "linear-gradient(135deg, #F97316, #EF4444)", color: "white", fontSize: "0.5rem", fontWeight: 900, padding: "2px 6px", borderRadius: "2rem", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>New</span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#9CA3AF", fontWeight: 500 }}>
                        {item.quantity} qty · ₹{item.price} each
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#1C1C1C", flexShrink: 0 }}>₹{item.price * item.quantity}</div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px dashed #FED7AA" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600, color: "#6B7280", marginBottom: "0.5rem" }}>
                  <span>Subtotal</span>
                  <span>₹{order.total}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600, color: "#6B7280", marginBottom: "0.75rem" }}>
                  <span>Taxes & GST (5%)</span>
                  <span>₹{Math.round(order.total * 0.05)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.75rem", borderTop: "2px solid #FFF3E8" }}>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontSize: "1.1rem", color: "#1C1C1C" }}>
                    Total to Pay
                  </div>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontSize: "1.5rem", background: "linear-gradient(135deg, #F97316, #EF4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    ₹{Math.round(order.total * 1.05)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── INFO CARDS ── */}
          <div className="anim-4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <div className="card" style={{ padding: "1.25rem" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#FFF3E8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
                <User size={15} color="#F97316" />
              </div>
              <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "#D1D5DB", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Customer</div>
              <div style={{ fontWeight: 800, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.customerName}</div>
              <div style={{ fontSize: "0.72rem", fontWeight: 500, color: "#9CA3AF", marginTop: 2 }}>{order.customerPhone || "Guest"}</div>
            </div>
            <div className="card" style={{ padding: "1.25rem" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#FFF3E8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
                <Clock size={15} color="#F97316" />
              </div>
              <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "#D1D5DB", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Time</div>
              <div style={{ fontWeight: 800, fontSize: "0.88rem" }}>{formatTime(order.createdAt)}</div>
              <div style={{ fontSize: "0.72rem", fontWeight: 500, color: "#9CA3AF", marginTop: 2 }}>{formatDate(order.createdAt)}</div>
            </div>
          </div>

          {/* ── COMPLETED RATING ── */}
          {order.status === 'COMPLETED' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="anim-5"
              style={{ background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)", border: "1px solid #A7F3D0", borderRadius: "2rem", padding: "1.75rem", textAlign: "center" }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⭐</div>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.2rem", fontWeight: 900, color: "#065F46", marginBottom: "0.4rem" }}>Enjoyed your meal?</h3>
              <p style={{ fontSize: "0.8rem", color: "#047857", marginBottom: "1.25rem" }}>Rate us 5 stars & earn 50 bonus points!</p>
              <button style={{ width: "100%", background: "linear-gradient(135deg, #10B981, #059669)", color: "white", border: "none", borderRadius: "1rem", height: "3rem", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}>
                Rate Now ⭐
              </button>
            </motion.div>
          )}
        </main>

        {/* ── STICKY ADD MORE ── */}
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "1.25rem 1rem 1.5rem", background: "linear-gradient(to top, rgba(255,248,240,1) 70%, transparent)", pointerEvents: "none", zIndex: 100 }}>
          <button
            className="add-btn"
            onClick={() => setShowAddMore(true)}
            style={{ width: "100%", pointerEvents: "auto", color: "white", border: "none", borderRadius: "1.25rem", height: "3.75rem", fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontSize: "1.1rem", letterSpacing: "0.02em", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}
          >
            <Plus size={20} strokeWidth={3} />
            Kuch Aur Mangwao?
          </button>
        </div>

        {/* ── ADD MORE OVERLAY ── */}
        <AnimatePresence>
          {showAddMore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                style={{ background: "white", width: "100%", maxWidth: 480, borderRadius: "2.5rem 2.5rem 0 0", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)", position: "relative", height: "92vh", overflow: "hidden" }}
              >
                <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", width: 48, height: 5, background: "#E5E7EB", borderRadius: 999, zIndex: 210 }} />
                <button
                  onClick={() => setShowAddMore(false)}
                  style={{ position: "absolute", top: 20, right: 20, zIndex: 210, background: "#F4F4F4", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <Plus size={20} style={{ transform: "rotate(45deg)", color: "#1C1C1C" }} />
                </button>
                <div className="no-scrollbar" style={{ height: "100%", overflowY: "auto", paddingTop: "1rem" }}>
                  <MenuQRAddMoreFlow
                    clerkUserId={order.clerkUserId}
                    onClose={() => { setShowAddMore(false); fetchOrder(); }}
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
      </div>
    </div>
  );
}