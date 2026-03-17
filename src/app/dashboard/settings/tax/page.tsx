"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Percent, ChevronLeft, Save, Loader2, Settings2,
    Tag, CheckCircle2, Info, ToggleLeft, ToggleRight,
    Gift, Flame, ShieldCheck, BadgePercent, Trash2, Plus,
    PackageOpen, ReceiptText, AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";
import { kravy } from "@/lib/sounds";

type Offer = {
    id: string;
    title: string;
    description?: string;
    code?: string;
    discountType: string;
    discountValue: number;
    minOrderValue?: number;
    isActive: boolean;
};

export default function PricingSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Tax settings
    const [taxEnabled, setTaxEnabled] = useState(true);
    const [taxRate, setTaxRate] = useState(5.0);
    const [businessProfile, setBusinessProfile] = useState<any>(null);

    // Offers
    const [offers, setOffers] = useState<Offer[]>([]);
    const [offersLoading, setOffersLoading] = useState(true);

    // New offer form
    const [showNewOffer, setShowNewOffer] = useState(false);
    const [newOffer, setNewOffer] = useState({
        title: "",
        code: "",
        discountType: "PERCENTAGE",
        discountValue: 10,
        minOrderValue: 0,
    });
    const [savingOffer, setSavingOffer] = useState(false);

    useEffect(() => {
        async function fetchAll() {
            try {
                const [profileRes, offerRes] = await Promise.all([
                    fetch("/api/profile", { cache: "no-store" }),
                    fetch("/api/admin/offers", { cache: "no-store" }),
                ]);
                const profileData = await profileRes.json();
                const offerData = await offerRes.json();
                setBusinessProfile(profileData);
                setTaxEnabled(profileData?.taxEnabled ?? true);
                setTaxRate(profileData?.taxRate ?? 5.0);
                setOffers(Array.isArray(offerData) ? offerData : []);
            } catch {
                kravy.error();
                toast.error("Error loading settings");
            } finally {
                setLoading(false);
                setOffersLoading(false);
            }
        }
        fetchAll();
    }, []);

    async function handleSaveTax() {
        setSaving(true);
        try {
            const payload = { ...businessProfile, taxEnabled, taxRate: Number(taxRate) };
            const res = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error();
            kravy.success();
            toast.success("Tax settings saved! ✅");
        } catch {
            kravy.error();
            toast.error("Failed to save tax settings");
        } finally {
            setSaving(false);
        }
    }

    async function handleCreateOffer() {
        kravy.error();
        if (!newOffer.title) { toast.error("Offer title required"); return; }
        kravy.error();
        if (newOffer.discountValue <= 0) { toast.error("Discount must be > 0"); return; }
        setSavingOffer(true);
        try {
            const res = await fetch("/api/admin/offers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newOffer),
            });
            if (!res.ok) throw new Error();
            const created = await res.json();
            setOffers(prev => [created, ...prev]);
            setShowNewOffer(false);
            setNewOffer({ title: "", code: "", discountType: "PERCENTAGE", discountValue: 10, minOrderValue: 0 });
            kravy.success();
            toast.success("Offer created! 🎉");
        } catch {
            kravy.error();
            toast.error("Failed to create offer");
        } finally {
            setSavingOffer(false);
        }
    }

    async function handleDeleteOffer(id: string) {
        try {
            const res = await fetch(`/api/admin/offers?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            setOffers(prev => prev.filter(o => o.id !== id));
            kravy.success();
            toast.success("Offer deleted");
        } catch {
            kravy.error();
            toast.error("Failed to delete offer");
        }
    }

    async function handleToggleOffer(offer: Offer) {
        try {
            const res = await fetch("/api/admin/offers", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: offer.id, isActive: !offer.isActive }),
            });
            if (!res.ok) throw new Error();
            setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, isActive: !o.isActive } : o));
        } catch {
            kravy.error();
            toast.error("Failed to update offer");
        }
    }

    const PRESET_RATES = [5, 12, 18, 28];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-[var(--kravy-brand)] animate-spin" />
            </div>
        );
    }

    // Live preview calculation
    const sampleSubtotal = 1000;
    const sampleTax = taxEnabled ? (sampleSubtotal * taxRate / 100) : 0;
    const sampleTotal = sampleSubtotal + sampleTax;

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 kravy-page-fade space-y-8">

            {/* ── HEADER ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 rounded-xl bg-[var(--kravy-surface)] border border-[var(--kravy-border)] text-[var(--kravy-text-muted)] hover:text-[var(--kravy-brand)] hover:border-[var(--kravy-brand)]/50 transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-[var(--kravy-text-primary)] tracking-tight">Pricing & Tax</h1>
                        <p className="text-xs font-mono text-[var(--kravy-text-muted)]">Control GST, discount offers · affects catalog & billing</p>
                    </div>
                </div>
            </div>

            {/* ── SECTION 1: GST SETTINGS ── */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-[var(--kravy-brand)]/10 rounded-lg flex items-center justify-center">
                        <Percent size={14} className="text-[var(--kravy-brand)]" />
                    </div>
                    <h2 className="text-[11px] font-black uppercase tracking-[2px] text-[var(--kravy-text-muted)]">GST / Tax Settings</h2>
                </div>

                <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl overflow-hidden shadow-sm">
                    {/* Toggle Row */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--kravy-border)]">
                        <div className="flex items-center gap-3.5">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${taxEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <div className="font-black text-[0.9rem] text-[var(--kravy-text-primary)]">Enable Global GST System</div>
                                <div className="text-xs text-[var(--kravy-text-muted)] font-medium">
                                    {taxEnabled ? `${taxRate}% GST will be added to every order` : "No tax will be charged to customers"}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setTaxEnabled(!taxEnabled)} className="shrink-0">
                            {taxEnabled
                                ? <ToggleRight size={36} className="text-green-500" />
                                : <ToggleLeft size={36} className="text-gray-300" />
                            }
                        </button>
                    </div>

                    {/* Preset Rate Chips */}
                    <AnimatePresence>
                        {taxEnabled && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="px-5 py-4 space-y-4"
                            >
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-muted)] mb-2 block">Quick Select Rate</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {PRESET_RATES.map(r => (
                                            <button
                                                key={r}
                                                onClick={() => setTaxRate(r)}
                                                className={`px-4 py-2 rounded-xl text-sm font-black border-2 transition-all ${taxRate === r
                                                    ? 'bg-[var(--kravy-brand)] text-white border-[var(--kravy-brand)] shadow-md shadow-[var(--kravy-brand)]/20'
                                                    : 'bg-[var(--kravy-surface)] text-[var(--kravy-text-muted)] border-[var(--kravy-border)] hover:border-[var(--kravy-brand)]/40'
                                                    }`}
                                            >
                                                {r}%
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-muted)] mb-2 block">Custom Rate (%)</label>
                                    <div className="relative max-w-[180px]">
                                        <input
                                            type="number"
                                            value={taxRate}
                                            onChange={e => setTaxRate(Number(e.target.value))}
                                            min={0} max={100} step={0.5}
                                            className="w-full bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] rounded-xl px-4 py-3 text-lg font-black text-[var(--kravy-text-primary)] focus:ring-2 focus:ring-[var(--kravy-brand)]/20 focus:border-[var(--kravy-brand)] transition-all outline-none pr-10"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--kravy-brand)] font-black text-lg">%</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Live Preview */}
                <div className="mt-3 bg-[var(--kravy-brand)]/5 border border-[var(--kravy-brand)]/10 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <ReceiptText size={14} className="text-[var(--kravy-brand)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-muted)]">Live Preview (₹1,000 order)</span>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-sm font-bold text-[var(--kravy-text-muted)]"><span>Items Total</span><span>₹{sampleSubtotal.toFixed(2)}</span></div>
                        {taxEnabled && <div className="flex justify-between text-sm font-bold text-[var(--kravy-brand)]"><span>GST ({taxRate}%)</span><span>+₹{sampleTax.toFixed(2)}</span></div>}
                        {!taxEnabled && <div className="flex justify-between text-sm font-bold text-gray-400 line-through"><span>GST (disabled)</span><span>₹0.00</span></div>}
                        <div className="h-px bg-[var(--kravy-brand)]/20 my-1" />
                        <div className="flex justify-between text-base font-black text-[var(--kravy-text-primary)]"><span>Customer Pays</span><span>₹{sampleTotal.toFixed(2)}</span></div>
                    </div>
                </div>

                {/* Save Tax Button */}
                <button
                    onClick={handleSaveTax}
                    disabled={saving}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--kravy-brand)] text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-[var(--kravy-brand)]/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? "Saving..." : "Save Tax Settings"}
                </button>
            </section>

            {/* ── SECTION 2: OFFERS & DISCOUNTS ── */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Tag size={14} className="text-orange-500" />
                        </div>
                        <h2 className="text-[11px] font-black uppercase tracking-[2px] text-[var(--kravy-text-muted)]">Offers & Coupons</h2>
                    </div>
                    <button
                        onClick={() => setShowNewOffer(!showNewOffer)}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors shadow-md shadow-orange-200"
                    >
                        <Plus size={14} /> New Offer
                    </button>
                </div>

                {/* Info banner */}
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3.5 mb-4">
                    <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[0.72rem] font-[600] text-blue-700 leading-relaxed">
                        Active offers appear on the customer&apos;s <strong>QR Menu</strong> page and in the cart. Customers can copy the code and apply it at checkout.
                    </p>
                </div>

                {/* New Offer Form */}
                <AnimatePresence>
                    {showNewOffer && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-[var(--kravy-surface)] border-2 border-orange-200 rounded-2xl p-5 mb-4 space-y-4"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Gift size={16} className="text-orange-500" />
                                <h3 className="font-black text-sm text-[var(--kravy-text-primary)]">Create New Offer</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-muted)] mb-1 block">Offer Title *</label>
                                    <input
                                        value={newOffer.title}
                                        onChange={e => setNewOffer(p => ({ ...p, title: e.target.value }))}
                                        placeholder="e.g. Weekend Special"
                                        className="w-full bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-orange-400 transition"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-muted)] mb-1 block">Coupon Code</label>
                                    <input
                                        value={newOffer.code}
                                        onChange={e => setNewOffer(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                        placeholder="e.g. SAVE20"
                                        className="w-full bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] rounded-xl px-4 py-2.5 text-sm font-bold font-mono outline-none focus:border-orange-400 transition"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-muted)] mb-1 block">Discount Type</label>
                                    <div className="flex gap-2">
                                        {[{ v: "PERCENTAGE", l: "% Off" }, { v: "FLAT", l: "₹ Flat" }].map(opt => (
                                            <button
                                                key={opt.v}
                                                onClick={() => setNewOffer(p => ({ ...p, discountType: opt.v }))}
                                                className={`flex-1 py-2.5 rounded-xl text-sm font-black border-2 transition ${newOffer.discountType === opt.v
                                                    ? 'bg-orange-500 text-white border-orange-500'
                                                    : 'bg-transparent text-[var(--kravy-text-muted)] border-[var(--kravy-border)]'
                                                    }`}
                                            >
                                                {opt.l}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-muted)] mb-1 block">
                                        Discount Value {newOffer.discountType === "PERCENTAGE" ? "(%)" : "(₹)"}
                                    </label>
                                    <input
                                        type="number"
                                        value={newOffer.discountValue}
                                        onChange={e => setNewOffer(p => ({ ...p, discountValue: Number(e.target.value) }))}
                                        min={1}
                                        className="w-full bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-orange-400 transition"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-muted)] mb-1 block">Min Order Value (₹) <span className="normal-case font-normal text-gray-400">— optional</span></label>
                                    <input
                                        type="number"
                                        value={newOffer.minOrderValue}
                                        onChange={e => setNewOffer(p => ({ ...p, minOrderValue: Number(e.target.value) }))}
                                        min={0}
                                        placeholder="0 = no minimum"
                                        className="w-full bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-orange-400 transition"
                                    />
                                </div>
                            </div>

                            {/* Preview chip */}
                            {newOffer.title && (
                                <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white shrink-0">
                                        <Tag size={16} />
                                    </div>
                                    <div>
                                        <div className="font-black text-sm text-gray-800">
                                            {newOffer.discountType === "PERCENTAGE" ? `${newOffer.discountValue}% OFF` : `₹${newOffer.discountValue} OFF`}
                                        </div>
                                        {newOffer.code && <div className="text-[0.65rem] font-black text-orange-600 mt-0.5">CODE: {newOffer.code}</div>}
                                    </div>
                                    <div className="ml-auto text-[0.65rem] text-gray-400 font-bold italic">Preview on QR Menu</div>
                                </div>
                            )}

                            <div className="flex gap-2 pt-1">
                                <button onClick={() => setShowNewOffer(false)} className="flex-1 py-2.5 rounded-xl border border-[var(--kravy-border)] text-sm font-black text-[var(--kravy-text-muted)] hover:bg-gray-50 transition">Cancel</button>
                                <button
                                    onClick={handleCreateOffer}
                                    disabled={savingOffer}
                                    className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-black hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {savingOffer ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                    {savingOffer ? "Creating..." : "Create Offer"}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Offers List */}
                {offersLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[var(--kravy-brand)]" /></div>
                ) : offers.length === 0 ? (
                    <div className="text-center py-12 bg-[var(--kravy-surface)] border border-dashed border-[var(--kravy-border)] rounded-2xl">
                        <PackageOpen size={32} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-sm font-bold text-[var(--kravy-text-muted)]">No offers yet</p>
                        <p className="text-xs text-gray-400 mt-1">Click &quot;New Offer&quot; to create your first discount</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {offers.map((offer, i) => (
                            <motion.div
                                key={offer.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`bg-[var(--kravy-surface)] border rounded-2xl px-4 py-4 flex items-center gap-3 transition-all ${offer.isActive ? 'border-orange-200' : 'border-[var(--kravy-border)] opacity-60'}`}
                            >
                                {/* Icon */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${offer.isActive ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-400'}`}>
                                    <BadgePercent size={20} />
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-black text-[0.88rem] text-[var(--kravy-text-primary)]">{offer.title}</span>
                                        {offer.isActive
                                            ? <span className="text-[0.55rem] font-black bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full uppercase">Live</span>
                                            : <span className="text-[0.55rem] font-black bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full uppercase">Paused</span>
                                        }
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                        <span className="text-[0.72rem] font-black text-orange-600">
                                            {offer.discountType === "PERCENTAGE" ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                                        </span>
                                        {offer.code && (
                                            <span className="text-[0.62rem] font-black bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-md text-orange-700 font-mono">{offer.code}</span>
                                        )}
                                        {offer.minOrderValue && offer.minOrderValue > 0 && (
                                            <span className="text-[0.6rem] text-gray-400 font-bold">Min ₹{offer.minOrderValue}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <button onClick={() => handleToggleOffer(offer)} title={offer.isActive ? "Pause offer" : "Activate offer"}>
                                        {offer.isActive
                                            ? <ToggleRight size={28} className="text-green-500" />
                                            : <ToggleLeft size={28} className="text-gray-300" />
                                        }
                                    </button>
                                    <button
                                        onClick={() => handleDeleteOffer(offer.id)}
                                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── FOOTER NOTE ── */}
            <div className="flex items-start gap-3 bg-amber-50/60 border border-amber-100 rounded-2xl p-4 text-[0.72rem] font-[600] text-amber-700 leading-relaxed">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-500" />
                <span>
                    All changes above are <strong>immediately reflected on your QR Menu</strong>. GST changes apply to new orders only. Paused offers will stop showing to customers.
                </span>
            </div>

        </div>
    );
}
