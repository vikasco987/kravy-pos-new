"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Percent, ChevronLeft, Save, AlertCircle,
    CheckCircle2, Info, Loader2, Settings2
} from "lucide-react";
import toast from "react-hot-toast";

export default function TaxSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [taxEnabled, setTaxEnabled] = useState(true);
    const [taxRate, setTaxRate] = useState(5.0);
    const [businessProfile, setBusinessProfile] = useState<any>(null);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch("/api/profile", { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to fetch profile");
                const data = await res.json();
                setBusinessProfile(data);
                if (data) {
                    setTaxEnabled(data.taxEnabled ?? true);
                    setTaxRate(data.taxRate ?? 5.0);
                }
            } catch (err) {
                toast.error("Error loading settings");
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

    async function handleSave() {
        setSaving(true);
        try {
            // Prepare full profile data to send back to upsert
            const payload = {
                ...businessProfile,
                taxEnabled,
                taxRate: Number(taxRate)
            };

            const res = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to save settings");

            toast.success("Tax settings updated successfully!");
        } catch (err) {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-[var(--kravy-brand)] animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 kravy-page-fade">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 rounded-xl bg-[var(--kravy-surface)] border border-[var(--kravy-border)] text-[var(--kravy-text-muted)] hover:text-[var(--kravy-brand)] hover:border-[var(--kravy-brand)]/50 transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-[var(--kravy-text-primary)] tracking-tight">Tax Management</h1>
                        <p className="text-xs font-mono text-[var(--kravy-text-muted)]">Configure GST and billing tax rates</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-[var(--kravy-brand)] text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[var(--kravy-brand)]/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            <div className="space-y-6">
                {/* Toggle Card */}
                <div className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-[32px] p-8 shadow-xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--kravy-brand)]/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-[var(--kravy-brand)]/10 transition-all" />

                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-[var(--kravy-brand)]/10 flex items-center justify-center text-[var(--kravy-brand)]">
                                <Percent size={28} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-[var(--kravy-text-primary)]">Enable GST Billing</h3>
                                <p className="text-sm text-[var(--kravy-text-muted)] font-medium">Toggle Tax application on total bill</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setTaxEnabled(!taxEnabled)}
                            className={`w-16 h-8 rounded-full transition-all relative ${taxEnabled ? 'bg-[var(--kravy-brand)]' : 'bg-[var(--kravy-border)]'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${taxEnabled ? 'left-9' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                {/* Rate Configuration */}
                {taxEnabled && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-[32px] p-8 shadow-xl"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <Settings2 size={18} className="text-[var(--kravy-brand)]" />
                            <h3 className="text-sm font-black uppercase tracking-[2px] text-[var(--kravy-text-primary)]">Rate Configuration</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-muted)] ml-1">GST Percentage (%)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(Number(e.target.value))}
                                        className="w-full bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] rounded-2xl px-5 py-4 text-xl font-black text-[var(--kravy-text-primary)] focus:ring-2 focus:ring-[var(--kravy-brand)]/20 focus:border-[var(--kravy-brand)] transition-all outline-none"
                                        placeholder="5.0"
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-lg font-black text-[var(--kravy-brand)]">%</div>
                                </div>
                                <p className="text-[10px] text-[var(--kravy-text-muted)] font-bold uppercase tracking-wider px-1">Common rates: 5%, 12%, 18% or 28%</p>
                            </div>

                            <div className="bg-[var(--kravy-bg-2)] rounded-2xl p-6 border border-[var(--kravy-border)] flex flex-col justify-center">
                                <div className="flex items-start gap-4 text-amber-500">
                                    <Info size={20} className="shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest mb-1.5">Note</h4>
                                        <p className="text-xs text-[var(--kravy-text-muted)] leading-relaxed font-medium">
                                            Updating this rate will immediately reflect on all new orders in the POS interface.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Live Preview */}
                <div className="bg-[var(--kravy-brand)]/5 border border-[var(--kravy-brand)]/10 rounded-[32px] p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <CheckCircle2 size={18} className="text-[var(--kravy-brand)]" />
                        <h3 className="text-sm font-black uppercase tracking-[2px] text-[var(--kravy-text-primary)]">Summary Preview</h3>
                    </div>

                    <div className="space-y-4 max-w-sm">
                        <div className="flex justify-between text-sm font-bold text-[var(--kravy-text-muted)]">
                            <span>Sample Subtotal</span>
                            <span>₹1,000.00</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-[var(--kravy-brand)]">
                            <span>{taxEnabled ? `GST (${taxRate}%)` : 'Tax Disabled'}</span>
                            <span>₹{taxEnabled ? (1000 * taxRate / 100).toFixed(2) : '0.00'}</span>
                        </div>
                        <div className="h-px bg-[var(--kravy-brand)]/20" />
                        <div className="flex justify-between text-lg font-black text-[var(--kravy-text-primary)]">
                            <span>Final Total</span>
                            <span>₹{taxEnabled ? (1000 + (1000 * taxRate / 100)).toFixed(2) : '1,000.00'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
