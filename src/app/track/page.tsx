"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Search,
    ChevronLeft,
    Clock,
    ArrowRight,
    History,
    Phone,
    Hash,
    AlertCircle,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

type Order = {
    id: string;
    total: number;
    status: string;
    createdAt: string;
    table?: { name: string };
    clerkUserId: string;
};

function TrackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [phone, setPhone] = useState("");
    const [orderId, setOrderId] = useState("");
    const [results, setResults] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [clerkId, setClerkId] = useState<string | null>(null);

    useEffect(() => {
        setClerkId(searchParams.get("clerkUserId"));
    }, [searchParams]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResults([]);

        try {
            let url = "/api/public/orders/track?";
            if (phone) url += `phone=${phone}`;
            if (orderId) url += `${phone ? '&' : ''}orderId=${orderId}`;
            if (clerkId) url += `&clerkUserId=${clerkId}`;

            const res = await fetch(url);
            const data = await res.json();

            if (res.ok) {
                if (Array.isArray(data)) {
                    setResults(data);
                } else if (data && data.id) {
                    setResults([data]);
                }
            }
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F4F4]">
            {/* Header */}
            <div className="bg-white px-4 py-8 border-b border-gray-100 shadow-sm text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h1 className="text-2xl font-[Syne] font-[900] text-gray-900 tracking-tight">Find My Order</h1>
                <p className="text-sm text-gray-500 font-bold mt-2">Enter your phone or order ID to track progress.</p>
            </div>

            <div className="p-4 max-w-md mx-auto">
                {/* Search Form */}
                <form onSubmit={handleSearch} className="space-y-4 bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                                <Input
                                    placeholder="98765 43210"
                                    className="h-12 rounded-[16px] pl-11 bg-gray-50 border-gray-100 font-bold"
                                    value={phone}
                                    onChange={(e) => {
                                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                                        if (e.target.value) setOrderId("");
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="h-[1px] flex-1 bg-gray-100"></div>
                            <span className="text-[10px] font-black text-gray-300 uppercase">OR</span>
                            <div className="h-[1px] flex-1 bg-gray-100"></div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Order ID</label>
                            <div className="relative">
                                <Hash className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                                <Input
                                    placeholder="Order ID number"
                                    className="h-12 rounded-[16px] pl-11 bg-gray-50 border-gray-100 font-bold"
                                    value={orderId}
                                    onChange={(e) => {
                                        setOrderId(e.target.value);
                                        if (e.target.value) setPhone("");
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        disabled={loading || (!phone && !orderId)}
                        className="w-full h-14 rounded-[20px] bg-black hover:bg-gray-800 text-white font-black text-sm uppercase tracking-widest mt-2 shadow-xl shadow-gray-200"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Track My Orders"}
                    </Button>
                </form>

                {/* Results List */}
                <div className="mt-8 space-y-4">
                    <AnimatePresence mode="popLayout">
                        {results.length > 0 && (
                            <div className="space-y-3">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-2">Active Orders Found</div>
                                {results.map((order, idx) => (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        onClick={() => router.push(`/order-tracking/${order.id}`)}
                                        className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl">
                                                🍱
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-gray-900 leading-none">Order Tracking</div>
                                                <div className="text-[11px] font-bold text-gray-400 mt-1.5">
                                                    Table: {order.table?.name || "Counter"} · ₹{order.total}
                                                </div>
                                                <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-2">
                                                    {order.status}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                                            <ArrowRight size={20} />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {results.length === 0 && !loading && (phone || orderId) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12"
                            >
                                <div className="text-4xl mb-3">😕</div>
                                <h3 className="font-bold text-gray-900">No active orders found</h3>
                                <p className="text-sm text-gray-400 font-medium">Please check the details or scan again.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Nav Helper */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xs px-4">
                <button
                    onClick={() => router.back()}
                    className="w-full bg-white/50 backdrop-blur-md border border-white h-12 rounded-full flex items-center justify-center gap-2 text-sm font-black text-gray-600 shadow-sm"
                >
                    <ChevronLeft size={18} /> Go Back to Menu
                </button>
            </div>
        </div>
    );
}

export default function TrackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TrackContent />
        </Suspense>
    );
}
