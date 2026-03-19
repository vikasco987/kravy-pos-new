"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Tag,
    Calendar,
    Percent,
    IndianRupee,
    Trash2,
    Edit2,
    History,
    Ticket,
    ChevronRight,
    Search,
    AlertCircle,
    X,
    CheckCircle2,
    Gift
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { kravy } from "@/lib/sounds";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface Offer {
    id: string;
    title: string;
    description: string | null;
    code: string | null;
    discountType: string;
    discountValue: number;
    minOrderValue: number | null;
    maxDiscount: number | null;
    startDate: string | null;
    endDate: string | null;
    usageLimit: number | null;
    currentUsage: number;
    buyItemId: string | null;
    buyQty: number | null;
    getItemOffId: string | null;
    getQty: number | null;
    getDiscount: number | null;
    isActive: boolean;
}

export default function OffersPage() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        code: "",
        discountType: "PERCENTAGE",
        discountValue: "",
        minOrderValue: "",
        maxDiscount: "",
        startDate: "",
        endDate: "",
        usageLimit: "",
        buyItemId: "",
        buyQty: 1,
        getItemOffId: "",
        getQty: 1,
        getDiscount: 100,
        isActive: true,
    });

    const [menuItems, setMenuItems] = useState<any[]>([]);

    const fetchOffers = async () => {
        try {
            const res = await fetch("/api/admin/offers");
            const data = await res.json();
            setOffers(data);
        } catch (error) {
            kravy.error();
            toast.error("Failed to load offers");
        } finally {
            setLoading(false);
        }
    };

    const fetchMenu = async () => {
        try {
            const res = await fetch("/api/menu");
            const data = await res.json();
            setMenuItems(data.items || data);
        } catch (error) {
            console.error("Failed to load menu items");
        }
    };

    useEffect(() => {
        fetchOffers();
        fetchMenu();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        const method = editingOffer ? "PATCH" : "POST";
        const url = editingOffer ? `/api/admin/offers/${editingOffer.id}` : "/api/admin/offers";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                kravy.success();
                toast.success(editingOffer ? "Offer updated" : "Offer created");
                setIsSheetOpen(false);
                setEditingOffer(null);
                setFormData({
                    title: "",
                    description: "",
                    code: "",
                    discountType: "PERCENTAGE",
                    discountValue: "",
                    minOrderValue: "",
                    maxDiscount: "",
                    startDate: "",
                    endDate: "",
                    usageLimit: "",
                    buyItemId: "",
                    buyQty: 1,
                    getItemOffId: "",
                    getQty: 1,
                    getDiscount: 100,
                    isActive: true,
                });
                fetchOffers();
            } else {
                const err = await res.json();
                kravy.error();
                toast.error(err.error || "Something went wrong");
            }
        } catch (error) {
            kravy.error();
            toast.error("Failed to save offer");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this offer?")) return;
        try {
            const res = await fetch(`/api/admin/offers/${id}`, { method: "DELETE" });
            if (res.ok) {
                kravy.success();
                toast.success("Offer deleted");
                fetchOffers();
            }
        } catch (error) {
            kravy.error();
            toast.error("Delete failed");
        }
    };

    const filteredOffers = offers.filter(o =>
        o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.code && o.code.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-8 p-1 md:p-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[var(--kravy-text-primary)] flex items-center gap-3 tracking-tight">
                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                            <Ticket className="w-6 h-6" />
                        </div>
                        Offers & Coupons
                    </h1>
                    <p className="text-[var(--kravy-text-muted)] font-medium mt-1">Manage discounts and seasonal promotions</p>
                </div>

                <Sheet open={isSheetOpen} onOpenChange={(open) => {
                    setIsSheetOpen(open);
                    if (!open) {
                        setEditingOffer(null);
                        setFormData({
                            title: "",
                            description: "",
                            code: "",
                            discountType: "PERCENTAGE",
                            discountValue: "",
                            minOrderValue: "",
                            maxDiscount: "",
                            startDate: "",
                            endDate: "",
                            usageLimit: "",
                            buyItemId: "",
                            buyQty: 1,
                            getItemOffId: "",
                            getQty: 1,
                            getDiscount: 100,
                            isActive: true,
                        });
                    }
                }}>
                    <SheetTrigger asChild>
                        <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-2xl px-6 h-12 font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-2">
                            <Plus size={20} /> Create New Offer
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-4xl bg-[var(--kravy-surface)] border-[var(--kravy-border)] p-0 overflow-hidden flex flex-col md:flex-row">
                        {/* Editor Side */}
                        <div className="flex-1 overflow-y-auto p-6 border-r border-[var(--kravy-border)]">
                            <SheetHeader>
                                <SheetTitle className="text-2xl font-black">{editingOffer ? "Edit Offer" : "New Promotion"}</SheetTitle>
                                <SheetDescription className="font-medium text-[var(--kravy-text-muted)]">
                                    Define discount rules and codes for your customers.
                                </SheetDescription>
                            </SheetHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                                <div className="space-y-2">
                                    <Label className="font-black text-xs uppercase tracking-widest opacity-60">Offer Title</Label>
                                    <Input
                                        placeholder="e.g. Diwali Dhamaka 25%"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        className="rounded-xl border-[var(--kravy-border)] h-12 font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="font-black text-xs uppercase tracking-widest opacity-60">Coupon Code</Label>
                                        <Input
                                            placeholder="SAVE25"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            className="rounded-xl border-[var(--kravy-border)] h-12 font-black uppercase"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-black text-xs uppercase tracking-widest opacity-60">Type</Label>
                                        <select
                                            value={formData.discountType}
                                            onChange={e => setFormData({ ...formData, discountType: e.target.value })}
                                            className="w-full h-12 rounded-xl border-[var(--kravy-border)] bg-transparent px-3 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                                        >
                                            <option value="PERCENTAGE">Percentage (%)</option>
                                            <option value="FLAT">Flat Amount (₹)</option>
                                            <option value="BOGO">BOGO (Buy X Get Y)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {formData.discountType !== "BOGO" && (
                                        <div className="space-y-2">
                                            <Label className="font-black text-xs uppercase tracking-widest opacity-60">Value</Label>
                                            <Input
                                                type="number"
                                                placeholder="25"
                                                value={formData.discountValue}
                                                onChange={e => setFormData({ ...formData, discountValue: e.target.value })}
                                                required
                                                className="rounded-xl border-[var(--kravy-border)] h-12 font-bold"
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label className="font-black text-xs uppercase tracking-widest opacity-60">Min. Billing</Label>
                                        <Input
                                            type="number"
                                            placeholder="500"
                                            value={formData.minOrderValue}
                                            onChange={e => setFormData({ ...formData, minOrderValue: e.target.value })}
                                            className="rounded-xl border-[var(--kravy-border)] h-12 font-bold"
                                        />
                                    </div>
                                </div>

                                {formData.discountType === "BOGO" && (
                                    <div className="space-y-6 p-5 bg-amber-50/50 rounded-2xl border border-amber-200">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">BOGO Configuration</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="font-black text-[10px] uppercase opacity-60">Customer Buys</Label>
                                                <select
                                                    value={formData.buyItemId}
                                                    onChange={e => setFormData({ ...formData, buyItemId: e.target.value })}
                                                    className="w-full h-11 rounded-xl border border-amber-200 bg-white px-3 text-xs font-bold outline-none"
                                                >
                                                    <option value="">Select Item...</option>
                                                    {menuItems.map(item => (
                                                        <option key={item.id} value={item.id}>{item.name}</option>
                                                    ))}
                                                </select>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[9px] font-bold text-amber-600/60 uppercase">Qty:</span>
                                                    <Input
                                                        type="number"
                                                        value={formData.buyQty}
                                                        onChange={e => setFormData({ ...formData, buyQty: parseInt(e.target.value) })}
                                                        className="w-20 h-8 text-xs font-bold rounded-lg"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="font-black text-[10px] uppercase opacity-60">Customer Gets</Label>
                                                <select
                                                    value={formData.getItemOffId}
                                                    onChange={e => setFormData({ ...formData, getItemOffId: e.target.value })}
                                                    className="w-full h-11 rounded-xl border border-amber-200 bg-white px-3 text-xs font-bold outline-none"
                                                >
                                                    <option value="">Select Item...</option>
                                                    {menuItems.map(item => (
                                                        <option key={item.id} value={item.id}>{item.name}</option>
                                                    ))}
                                                </select>
                                                <div className="flex items-center justify-between gap-2 mt-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-bold text-amber-600/60 uppercase">Qty:</span>
                                                        <Input
                                                            type="number"
                                                            value={formData.getQty}
                                                            onChange={e => setFormData({ ...formData, getQty: parseInt(e.target.value) })}
                                                            className="w-16 h-8 text-xs font-bold rounded-lg"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-bold text-amber-600/60 uppercase">Off:</span>
                                                        <Input
                                                            type="number"
                                                            value={formData.getDiscount}
                                                            onChange={e => setFormData({ ...formData, getDiscount: parseFloat(e.target.value) })}
                                                            placeholder="100%"
                                                            className="w-16 h-8 text-xs font-bold rounded-lg"
                                                        />
                                                        <span className="text-[9px] font-black">%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="font-black text-xs uppercase tracking-widest opacity-60">Valid From</Label>
                                        <Input
                                            type="date"
                                            value={formData.startDate.split('T')[0]}
                                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                            className="rounded-xl border-[var(--kravy-border)] h-12 font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-black text-xs uppercase tracking-widest opacity-60">Valid Until</Label>
                                        <Input
                                            type="date"
                                            value={formData.endDate.split('T')[0]}
                                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                            className="rounded-xl border-[var(--kravy-border)] h-12 font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="font-black text-xs uppercase tracking-widest opacity-60">Max Uses</Label>
                                        <Input
                                            type="number"
                                            placeholder="Unlimited"
                                            value={formData.usageLimit}
                                            onChange={e => setFormData({ ...formData, usageLimit: e.target.value })}
                                            className="rounded-xl border-[var(--kravy-border)] h-12 font-bold"
                                        />
                                    </div>
                                    {formData.discountType === "PERCENTAGE" && (
                                        <div className="space-y-2">
                                            <Label className="font-black text-xs uppercase tracking-widest opacity-60">Max Discount (₹)</Label>
                                            <Input
                                                type="number"
                                                placeholder="150"
                                                value={formData.maxDiscount}
                                                onChange={e => setFormData({ ...formData, maxDiscount: e.target.value })}
                                                className="rounded-xl border-[var(--kravy-border)] h-12 font-bold"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-black text-xs uppercase tracking-widest opacity-60">Offer Status</Label>
                                    <Button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                        variant="outline"
                                        className={`w-full h-12 rounded-xl border-[var(--kravy-border)] font-bold flex justify-between px-4 ${formData.isActive ? 'bg-amber-50 text-amber-600 border-amber-200' : ''}`}
                                    >
                                        {formData.isActive ? 'Active on Store' : 'Draft / Paused'}
                                        <div className={`w-3 h-3 rounded-full ${formData.isActive ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'}`} />
                                    </Button>
                                </div>

                                <Button type="submit" disabled={submitting} className="w-full bg-amber-500 hover:bg-amber-600 text-white h-14 rounded-2xl font-black text-lg shadow-xl shadow-amber-500/20 disabled:opacity-50">
                                    {submitting ? "Launching..." : (editingOffer ? "Update Offer" : "Launch Promotion 🚀")}
                                </Button>
                            </form>
                        </div>

                        {/* Live Preview Side */}
                        <div className="w-[380px] bg-gray-50 flex flex-col items-center justify-center p-6 shrink-0 relative overflow-hidden group">
                            <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 flex items-center gap-2">
                                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                Customer View Preview
                            </div>

                            {/* Mobile Frame */}
                            <div className="w-full aspect-[9/18.5] bg-white rounded-[3rem] border-[8px] border-gray-900 shadow-2xl relative overflow-hidden flex flex-col">
                                <div className="h-6 w-full bg-gray-900" />

                                <div className="flex-1 overflow-y-auto no-scrollbar bg-gray-50/50 p-4 space-y-6">
                                    {/* Cart Coupon Section Preview */}
                                    <div className="space-y-3">
                                        <div className="text-[0.6rem] font-black uppercase text-gray-300">Cart Coupon Preview</div>
                                        <div className="bg-white rounded-2xl border-2 border-dashed border-amber-500/20 p-4 flex flex-col items-center justify-center gap-1 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/5 -mr-4 -mt-4 rounded-full" />
                                            <div className="text-amber-500 font-black text-[0.85rem] tracking-tighter uppercase">
                                                {formData.code || "SAVE25"}
                                            </div>
                                            <div className="text-[0.55rem] font-bold text-gray-400">
                                                {formData.discountType === 'PERCENTAGE' ? `${formData.discountValue || '0'}% OFF` : `₹${formData.discountValue || '0'} OFF`}
                                            </div>
                                            <div className="text-[0.45rem] font-black text-emerald-500 mt-1 italic">
                                                {formData.minOrderValue ? `Valid on orders above ₹${formData.minOrderValue}` : 'No minimum order'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Banner Preview */}
                                    <div className="space-y-3 pt-4 border-t border-dashed border-gray-200">
                                        <div className="text-[0.6rem] font-black uppercase text-gray-300 italic">Menu Promo Bar</div>
                                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-3 text-white flex items-center justify-between shadow-lg shadow-amber-200">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                                                    <Tag size={12} className="text-white" />
                                                </div>
                                                <div>
                                                    <div className="text-[0.65rem] font-black leading-tight truncate max-w-[120px]">
                                                        {formData.title || "Offer Title"}
                                                    </div>
                                                    <div className="text-[0.5rem] font-bold opacity-80 italic">Use code: {formData.code || "----"}</div>
                                                </div>
                                            </div>
                                            <ChevronRight size={14} className="opacity-60" />
                                        </div>
                                    </div>

                                    {/* Mock Order Summary */}
                                    <div className="space-y-2 mt-4 opacity-40">
                                        <div className="h-2 w-1/2 bg-gray-200 rounded" />
                                        <div className="bg-white p-3 rounded-xl border border-gray-100 space-y-2">
                                            <div className="flex justify-between"><div className="w-12 h-1.5 bg-gray-100 rounded" /><div className="w-8 h-1.5 bg-gray-100 rounded" /></div>
                                            <div className="flex justify-between border-t pt-2 border-gray-50">
                                                <div className="w-10 h-2 bg-amber-100 rounded" />
                                                <div className="w-6 h-2 bg-amber-500 rounded" />
                                            </div>
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

            {/* Search & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--kravy-text-muted)]" size={18} />
                    <Input
                        placeholder="Search by title or coupon code..."
                        className="pl-12 h-14 rounded-2xl bg-[var(--kravy-surface)] border-[var(--kravy-border)] font-bold italic shadow-sm"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl px-6 flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                        <History size={20} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-50">Active</div>
                        <div className="text-xl font-black">{offers.filter(o => o.isActive).length} Promotions</div>
                    </div>
                </div>
            </div>

            {/* Offer Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredOffers.map((offer, idx) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.05 }}
                            key={offer.id}
                        >
                            <Card className="group overflow-hidden rounded-[32px] border-[var(--kravy-border)] bg-[var(--kravy-surface)] shadow-sm hover:shadow-xl transition-all duration-300 relative">

                                {/* Visual Accent */}
                                <div className={`absolute top-0 left-0 w-full h-2 ${offer.isActive ? 'bg-amber-500' : 'bg-gray-300'}`} />

                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-amber-50 rounded-2xl text-amber-500">
                                            {offer.discountType === 'PERCENTAGE' ? <Percent size={24} /> : <IndianRupee size={24} />}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditingOffer(offer);
                                                    setFormData({
                                                        title: offer.title,
                                                        description: offer.description || "",
                                                        code: offer.code || "",
                                                        discountType: offer.discountType,
                                                        discountValue: offer.discountValue?.toString() || "",
                                                        minOrderValue: offer.minOrderValue?.toString() || "",
                                                        maxDiscount: offer.maxDiscount?.toString() || "",
                                                        startDate: offer.startDate || "",
                                                        endDate: offer.endDate || "",
                                                        usageLimit: offer.usageLimit?.toString() || "",
                                                        buyItemId: offer.buyItemId || "",
                                                        buyQty: offer.buyQty || 1,
                                                        getItemOffId: offer.getItemOffId || "",
                                                        getQty: offer.getQty || 1,
                                                        getDiscount: offer.getDiscount || 100,
                                                        isActive: offer.isActive,
                                                    });
                                                    setIsSheetOpen(true);
                                                }}
                                                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-indigo-600 transition-colors"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(offer.id)}
                                                className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-[var(--kravy-text-primary)] leading-tight">{offer.title}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        {offer.code && (
                                            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                CODE: {offer.code}
                                            </div>
                                        )}
                                        <div className={`px-3 py-1 ${offer.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'} rounded-lg text-[10px] font-black uppercase tracking-widest`}>
                                            {offer.isActive ? 'Active' : 'Paused'}
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-[var(--kravy-border)] flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest mb-1">Benefit</p>
                                            <p className="text-2xl font-black text-[var(--kravy-text-primary)]">
                                                {offer.discountType === 'PERCENTAGE' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest mb-1">Conditions</p>
                                            <p className="text-xs font-bold text-[var(--kravy-text-primary)] italic">
                                                Min order ₹{offer.minOrderValue || 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative Bottom */}
                                <div className="bg-gray-50/80 px-6 py-3 border-t border-[var(--kravy-border)] flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-wider">
                                        <Calendar size={12} /> 
                                        {offer.startDate ? (
                                            <>
                                                {new Date(offer.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} 
                                                {' - '}
                                                {offer.endDate ? new Date(offer.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}
                                            </>
                                        ) : 'No expiry set'}
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-amber-600 font-bold hover:bg-white text-[10px] p-0 h-auto">
                                        View Details <ChevronRight size={14} />
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredOffers.length === 0 && (
                    <div className="col-span-full py-20 bg-[var(--kravy-surface)] rounded-[40px] border-2 border-dashed border-[var(--kravy-border)] flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <Gift className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-black text-[var(--kravy-text-primary)] mb-2">No Promotions Found</h3>
                        <p className="text-[var(--kravy-text-muted)] font-medium max-w-sm">
                            Create your first coupon or offer to attract more customers and boost your sales!
                        </p>
                        <Button
                            onClick={() => setIsSheetOpen(true)}
                            className="mt-8 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl px-8 h-12 font-bold shadow-lg"
                        >
                            Launch First Offer 🚀
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
