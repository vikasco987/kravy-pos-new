"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
    Users, CheckCircle2, AlertCircle, Save, ArrowLeft, 
    User, Phone, MapPin, Check, Zap, Clock
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { kravy } from "@/lib/sounds";

export default function CustomerDataSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        collectCustomerName: true,
        requireCustomerName: false,
        collectCustomerPhone: true,
        requireCustomerPhone: false,
        collectCustomerAddress: false,
        requireCustomerAddress: false,
        isOnline: true,
        openingTime: "00:00",
        closingTime: "23:59",
        offlineMessage: "Restaurant is currently closed or not accepting orders.",
    });

    useEffect(() => {
        fetch(`/api/profile`)
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setSettings({
                        collectCustomerName: data.collectCustomerName ?? true,
                        requireCustomerName: data.requireCustomerName ?? false,
                        collectCustomerPhone: data.collectCustomerPhone ?? true,
                        requireCustomerPhone: data.requireCustomerPhone ?? false,
                        collectCustomerAddress: data.collectCustomerAddress ?? false,
                        requireCustomerAddress: data.requireCustomerAddress ?? false,
                        isOnline: data.isOnline ?? true,
                        openingTime: data.openingTime ?? "00:00",
                        closingTime: data.closingTime ?? "23:59",
                        offlineMessage: data.offlineMessage ?? "Restaurant is currently closed or not accepting orders.",
                    });
                }
            })
            .catch(() => toast.error("Failed to load settings"))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                kravy.success();
                toast.success("Settings updated successfully");
            } else {
                toast.error("Failed to save settings");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const toggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (loading) return <div className="p-10 text-center opacity-50">Loading Configuration...</div>;

    const FieldOption = ({ 
        icon: Icon, 
        label, 
        collectKey, 
        requireKey 
    }: { 
        icon: any, 
        label: string, 
        collectKey: keyof typeof settings, 
        requireKey: keyof typeof settings 
    }) => (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 transition-all hover:border-blue-500/30">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Icon size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white capitalize">{label}</h3>
                    <p className="text-xs text-white/40 font-mono">Configure how you collect {label} from QR Menu</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Collect Toggle */}
                <button 
                    onClick={() => toggle(collectKey)}
                    className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all text-left ${
                        settings[collectKey] 
                        ? "bg-blue-600/10 border-blue-500/50 text-blue-400" 
                        : "bg-white/5 border-white/5 text-white/40"
                    }`}
                >
                    <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] uppercase font-black tracking-widest">Visibility</span>
                        {settings[collectKey] ? <Check size={14} /> : null}
                    </div>
                    <span className="text-sm font-bold">{settings[collectKey] ? "Visible (Enabled)" : "Hidden (Disabled)"}</span>
                </button>

                {/* Mandatory Toggle */}
                <button 
                    disabled={!settings[collectKey]}
                    onClick={() => toggle(requireKey)}
                    className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all text-left ${
                        !settings[collectKey] 
                        ? "opacity-30 cursor-not-allowed bg-black/20 border-white/5" 
                        : settings[requireKey] 
                            ? "bg-emerald-600/10 border-emerald-500/50 text-emerald-400" 
                            : "bg-white/5 border-white/5 text-white/40"
                    }`}
                >
                    <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] uppercase font-black tracking-widest">Requirement</span>
                        {settings[requireKey] ? <Check size={14} /> : null}
                    </div>
                    <span className="text-sm font-bold">{settings[requireKey] ? "Mandatory (Required)" : "Optional"}</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 kravy-page-fade">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/settings" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Customer Setup</h1>
                        <p className="text-xs text-white/40 font-mono uppercase tracking-widest">QR Menu Data Collection Rules</p>
                    </div>
                </div>

                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 shadow-xl shadow-blue-600/20 disabled:opacity-50 transition-all active:scale-95"
                >
                    <Save size={18} />
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-3xl flex gap-4 items-start">
                <AlertCircle size={20} className="text-blue-400 mt-1 shrink-0" />
                <div className="space-y-1">
                    <p className="text-sm font-bold text-white">Why configure this?</p>
                    <p className="text-xs text-white/60 leading-relaxed font-mono">
                        Har restaurant ki zaroorat alag hoti hai. Agar aap chahte hain ki orders se pehle customers apna <b>Address</b> bhi dein, to niche toggles ka istemal karein. Mandatory karne pe customer bina detail bhare order nahi kar payega.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <FieldOption icon={User} label="Customer Name" collectKey="collectCustomerName" requireKey="requireCustomerName" />
                <FieldOption icon={Phone} label="Customer Phone" collectKey="collectCustomerPhone" requireKey="requireCustomerPhone" />
                <FieldOption icon={MapPin} label="Customer Address" collectKey="collectCustomerAddress" requireKey="requireCustomerAddress" />
            </div>

            {/* ✅ RESTAURANT TIMING & ONLINE STATUS */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Ordering Status & Timing</h3>
                            <p className="text-xs text-white/40 font-mono">Set when customers can place orders via QR</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => toggle("isOnline")}
                        className={`h-12 px-6 rounded-2xl border transition-all font-bold flex items-center gap-2 ${
                            settings.isOnline 
                            ? "bg-emerald-600/10 border-emerald-500/50 text-emerald-400" 
                            : "bg-rose-600/10 border-rose-500/50 text-rose-400"
                        }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${settings.isOnline ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                        {settings.isOnline ? "ONLINE (Accepting Orders)" : "OFFLINE (Closed)"}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-[10px] uppercase font-black tracking-widest text-white/40 block">Operational Hours (24H Format)</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <span className="text-[10px] text-white/20 font-black uppercase">Open At</span>
                                <input 
                                    type="time" 
                                    value={settings.openingTime}
                                    onChange={(e) => setSettings(prev => ({ ...prev, openingTime: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-black text-xl focus:border-orange-500/50 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <span className="text-[10px] text-white/20 font-black uppercase">Close At</span>
                                <input 
                                    type="time" 
                                    value={settings.closingTime}
                                    onChange={(e) => setSettings(prev => ({ ...prev, closingTime: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-black text-xl focus:border-orange-500/50 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-white/30 italic">Note: Customers can only order within these hours.</p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] uppercase font-black tracking-widest text-white/40 block">Offline Notice Message</label>
                        <textarea 
                            value={settings.offlineMessage}
                            onChange={(e) => setSettings(prev => ({ ...prev, offlineMessage: e.target.value }))}
                            rows={4}
                            placeholder="Restaurant is closed..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white/80 focus:border-orange-500/50 outline-none transition-all resize-none"
                        />
                        <p className="text-[10px] text-white/30 italic">Visible to customers when ordering is disabled.</p>
                    </div>
                </div>
            </div>

            <div className="pt-10 border-t border-white/5 text-center">
                <p className="text-[10px] text-white/20 uppercase tracking-[4px] font-black italic">
                    Kravy POS · Customer Experience Configuration
                </p>
            </div>
        </div>
    );
}
