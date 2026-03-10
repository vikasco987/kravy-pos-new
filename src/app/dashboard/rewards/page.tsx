"use client";

import { useState, useEffect } from "react";
import {
    Gift,
    Plus,
    Search,
    Trash2,
    Edit2,
    Sparkles,
    ChevronRight,
    Clock,
    CheckCircle2,
    Star,
    Info,
    History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Reward = {
    id: string;
    title: string;
    description: string;
    pointsRequired: number;
    isActive: boolean;
};

export default function RewardsPage() {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editingReward, setEditingReward] = useState<Reward | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        pointsRequired: "0",
        isActive: true,
    });

    useEffect(() => {
        fetchRewards();
    }, []);

    const fetchRewards = async () => {
        try {
            const res = await fetch("/api/admin/rewards");
            const data = await res.json();
            setRewards(data);
        } catch (error) {
            toast.error("Failed to load rewards");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingReward ? `/api/admin/rewards/${editingReward.id}` : "/api/admin/rewards";
        const method = editingReward ? "PATCH" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success(editingReward ? "Reward updated" : "Reward created");
                setIsOpen(false);
                setEditingReward(null);
                setFormData({ title: "", description: "", pointsRequired: "0", isActive: true });
                fetchRewards();
            }
        } catch (error) {
            toast.error("Process failed");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this reward?")) return;
        try {
            const res = await fetch(`/api/admin/rewards/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Reward deleted");
                fetchRewards();
            }
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    const openEdit = (reward: Reward) => {
        setEditingReward(reward);
        setFormData({
            title: reward.title,
            description: reward.description || "",
            pointsRequired: reward.pointsRequired.toString(),
            isActive: reward.isActive,
        });
        setIsOpen(true);
    };

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-2xl border border-amber-100">
                            <Gift className="text-amber-500" size={32} />
                        </div>
                        Loyalty Rewards
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Design incentives to keep your customers coming back.</p>
                </div>

                <Sheet open={isOpen} onOpenChange={(open) => {
                    setIsOpen(open);
                    if (!open) {
                        setEditingReward(null);
                        setFormData({ title: "", description: "", pointsRequired: "0", isActive: true });
                    }
                }}>
                    <SheetTrigger asChild>
                        <Button className="rounded-2xl h-14 px-8 bg-black hover:bg-gray-800 text-white font-black text-lg shadow-xl shadow-gray-200 transition-all active:scale-95 gap-2">
                            <Plus size={24} /> Create Reward
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-4xl overflow-y-auto no-scrollbar flex flex-col md:flex-row p-0 border-l-0">
                        {/* Form Side */}
                        <div className="flex-1 p-8 space-y-8">
                            <SheetHeader>
                                <SheetTitle className="text-3xl font-black">
                                    {editingReward ? 'Edit Reward' : 'New Reward'}
                                </SheetTitle>
                                <p className="text-gray-500 font-medium">Configure redemption requirements.</p>
                            </SheetHeader>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-base font-bold">Reward Name</Label>
                                        <Input
                                            placeholder="e.g. Free Butter Chicken"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-base font-bold">Description</Label>
                                        <Input
                                            placeholder="e.g. 1 plate complimentary - worth ₹380"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="h-12 rounded-xl border-gray-200"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-base font-bold">Points Needed</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={formData.pointsRequired}
                                                    onChange={(e) => setFormData({ ...formData, pointsRequired: e.target.value })}
                                                    className="h-12 rounded-xl border-gray-200 pl-10"
                                                />
                                                <Star className="absolute left-3 top-3.5 text-amber-500" size={18} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-base font-bold">Status</Label>
                                            <select
                                                value={formData.isActive.toString()}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                                                className="w-full h-12 rounded-xl border border-gray-200 px-4 font-bold"
                                            >
                                                <option value="true">Active</option>
                                                <option value="false">Paused</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-lg shadow-lg shadow-amber-100">
                                    {editingReward ? 'Update Reward' : 'Create Reward'}
                                </Button>
                            </form>
                        </div>

                        {/* Live Preview Side */}
                        <div className="w-full md:w-[380px] bg-slate-50 flex flex-col items-center justify-center p-6 shrink-0 relative overflow-hidden group border-l">
                            <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 flex items-center gap-2">
                                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                Mobile App Preview
                            </div>

                            {/* Mobile Frame Container */}
                            <div className="w-full aspect-[9/18.5] bg-white rounded-[3rem] border-[8px] border-gray-900 shadow-2xl relative overflow-hidden flex flex-col">
                                <div className="h-6 w-full bg-gray-900 flex justify-center items-end pb-1 gap-1">
                                    <div className="w-12 h-2.5 bg-gray-800 rounded-full" />
                                </div>

                                <div className="flex-1 bg-[#F4F4F4] p-4 flex flex-col">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                                            <ChevronRight size={14} className="rotate-180" />
                                        </div>
                                        <div className="text-[0.7rem] font-black uppercase tracking-wider">Loyalty Rewards</div>
                                    </div>

                                    {/* Points Card */}
                                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-5 mb-6 shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-10 -mt-10" />
                                        <div className="relative z-10">
                                            <div className="text-[0.6rem] text-gray-400 font-black uppercase tracking-widest">Available Balance</div>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-4xl font-black text-white">850</span>
                                                <span className="text-[0.7rem] font-black text-amber-500">pts</span>
                                            </div>
                                            <div className="mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-500" style={{ width: '85%' }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Redemption Section */}
                                    <div className="space-y-4">
                                        <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Redeem Rewards</div>

                                        {/* Dynamic Preview Card */}
                                        <div className={`bg-white rounded-2xl p-4 border flex items-center gap-3 shadow-sm transition-all ${formData.isActive ? 'border-amber-100' : 'border-gray-200 opacity-60'}`}>
                                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl ${formData.isActive ? 'bg-amber-50' : 'bg-gray-100'}`}>
                                                🎁
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[0.8rem] font-black text-gray-900">{formData.title || "Reward Name"}</div>
                                                <div className="text-[0.6rem] font-bold text-gray-400 mt-0.5">{formData.description || "Short description here"}</div>
                                                <div className="text-[0.65rem] font-black text-amber-600 mt-1">{formData.pointsRequired} pts required</div>
                                            </div>
                                            <div className={`px-3 py-1.5 rounded-xl text-[0.65rem] font-black uppercase tracking-wider ${Number(formData.pointsRequired) <= 850 && formData.isActive ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' : 'bg-gray-100 text-gray-400'}`}>
                                                {formData.isActive ? 'Redeem' : 'Paused'}
                                            </div>
                                        </div>

                                        {/* Mock Other Items */}
                                        <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3 opacity-40 grayscale">
                                            <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl text-gray-300">🍹</div>
                                            <div className="flex-1 h-10 bg-gray-50 rounded-lg" />
                                        </div>
                                    </div>
                                </div>

                                <div className="h-4 w-full bg-white flex justify-center items-center pb-1">
                                    <div className="w-16 h-1 bg-gray-200 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Main Stats/Search Area */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6 mb-8 justify-between">
                    <div className="flex gap-4">
                        <div className="bg-amber-50 rounded-3xl p-4 border border-amber-100 min-w-[140px]">
                            <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Active</div>
                            <div className="text-3xl font-black">{rewards.filter(r => r.isActive).length}</div>
                        </div>
                        <div className="bg-gray-50 rounded-3xl p-4 border border-gray-100 min-w-[140px]">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Rewards</div>
                            <div className="text-3xl font-black">{rewards.length}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rewards.map((reward, idx) => (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            key={reward.id}
                        >
                            <Card className="rounded-[32px] overflow-hidden border-gray-100 bg-white shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all group">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                            <Gift size={28} />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEdit(reward)}
                                                className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-black hover:bg-white border border-transparent hover:border-gray-100 transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(reward.id)}
                                                className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600 border border-transparent hover:border-red-100 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-gray-900 leading-tight mb-2">{reward.title}</h3>
                                    <p className="text-sm text-gray-500 font-medium mb-4 line-clamp-2">{reward.description}</p>

                                    <div className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 rounded-2xl text-amber-600 w-fit mb-4">
                                        <Star size={16} fill="currentColor" />
                                        <span className="text-[13px] font-black tracking-tighter">{reward.pointsRequired} Points Required</span>
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                                    <span className={`${reward.isActive ? 'text-emerald-500' : 'text-gray-400'} text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5`}>
                                        <div className={`w-2 h-2 rounded-full ${reward.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                                        {reward.isActive ? 'Active' : 'Paused'}
                                    </span>
                                    <ChevronRight size={14} className="text-gray-300" />
                                </div>
                            </Card>
                        </motion.div>
                    ))}

                    {rewards.length === 0 && !loading && (
                        <div className="col-span-full py-20 text-center flex flex-col items-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <Sparkles size={32} className="text-gray-200" />
                            </div>
                            <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">No Rewards Defined</h3>
                            <p className="text-sm text-gray-500 font-medium mt-2">Create rewards to award points for purchases!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
