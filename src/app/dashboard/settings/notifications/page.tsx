"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
    Bell, Check, ArrowLeft, Save, 
    Volume2, Smartphone, MessageSquare, AlertCircle, Sparkles
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { kravy } from "@/lib/sounds";

export default function NotificationSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        newOrderPopup: true,
        newOrderSound: true,
        newOrderToast: true,
        reviewToast: true,
    });

    useEffect(() => {
        // 1. Try reading from localStorage first for fast load
        const stored = localStorage.getItem("kravy_notification_prefs");
        if (stored) {
            try {
                setSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
            } catch (e) {}
        }

        // 2. Fetch fresh values from user profile DB
        fetch(`/api/user/me`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (data && data.uiPreferences) {
                    const dbPrefs = {
                        newOrderPopup: data.uiPreferences.newOrderPopup !== false,
                        newOrderSound: data.uiPreferences.newOrderSound !== false,
                        newOrderToast: data.uiPreferences.newOrderToast !== false,
                        reviewToast: data.uiPreferences.reviewToast !== false,
                    };
                    setSettings(dbPrefs);
                    localStorage.setItem("kravy_notification_prefs", JSON.stringify(dbPrefs));
                }
            })
            .catch(() => toast.error("Failed to load settings"))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (customSettings = settings) => {
        setSaving(true);
        try {
            // Write to local storage immediately
            localStorage.setItem("kravy_notification_prefs", JSON.stringify(customSettings));

            // Sync with backend database profile
            const res = await fetch(`/api/user/me`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uiPreferences: customSettings }),
            });
            if (res.ok) {
                toast.success("Preferences updated successfully!", { id: "autosave" });
            } else {
                toast.error("Failed to sync settings with server");
            }
        } catch (error) {
            toast.error("Offline: Saved locally");
        } finally {
            setSaving(false);
        }
    };

    const toggle = (key: keyof typeof settings) => {
        setSettings(prev => {
            const next = { ...prev, [key]: !prev[key] };
            // Play sound preview if sound was turned on
            if (key === "newOrderSound" && next.newOrderSound) {
                try {
                    kravy.orderBell();
                } catch (e) {}
            }
            // Auto-save immediately upon click
            handleSave(next);
            return next;
        });
    };

    if (loading) return <div className="p-10 text-center opacity-50 font-bold">Loading Preferences...</div>;

    const OptionToggle = ({ 
        icon: Icon, 
        label, 
        sKey,
        desc,
        colorClass = "bg-orange-500"
    }: { 
        icon: any, 
        label: string, 
        sKey: keyof typeof settings,
        desc: string,
        colorClass?: string
    }) => (
        <button 
            onClick={() => toggle(sKey)}
            className={`flex items-center gap-4 p-5 rounded-[2rem] border transition-all text-left group ${
                settings[sKey] 
                ? "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10" 
                : "bg-slate-50 dark:bg-black/20 border-slate-100 dark:border-white/5 opacity-65"
            }`}
        >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                settings[sKey] 
                ? `${colorClass} text-white shadow-lg` 
                : "bg-slate-200 dark:bg-white/5 text-slate-400"
            }`}>
                <Icon size={22} />
            </div>
            
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h3 className={`font-bold transition-all ${settings[sKey] ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>{label}</h3>
                    {settings[sKey] && <div className={`w-1.5 h-1.5 rounded-full ${colorClass} animate-pulse`} />}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-white/30 font-bold uppercase tracking-widest mt-0.5">{desc}</p>
            </div>

            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                settings[sKey] 
                ? "bg-orange-50 border-orange-100 text-orange-600 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400" 
                : "bg-white dark:bg-transparent border-slate-200 dark:border-white/10 text-slate-300"
            }`}>
                {settings[sKey] ? <Check size={18} strokeWidth={3} /> : null}
            </div>
        </button>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 kravy-page-fade pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <Link href="/dashboard/settings" className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center hover:scale-110 transition-all shadow-sm">
                        <ArrowLeft size={20} className="text-slate-600 dark:text-white" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Notification Center</h1>
                        <p className="text-xs text-slate-400 dark:text-white/40 font-bold uppercase tracking-[0.2em] mt-1">Manage order alerts & sound signals</p>
                    </div>
                </div>

                <div 
                    className={`h-14 px-8 rounded-[1.5rem] flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                        saving 
                        ? "bg-slate-100 text-slate-400 dark:bg-white/5" 
                        : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    }`}
                >
                    {saving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                            Syncing...
                        </>
                    ) : (
                        <>
                            <Check size={16} strokeWidth={3} />
                            Saved to Cloud
                        </>
                    )}
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-orange-500/5 border border-orange-500/20 p-8 rounded-[2.5rem] flex gap-6 items-start">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                    <AlertCircle size={24} />
                </div>
                <div className="space-y-2">
                    <p className="text-lg font-black text-slate-900 dark:text-white leading-none">Smart Alert Routing</p>
                    <p className="text-sm text-slate-500 dark:text-white/60 leading-relaxed font-medium">
                        Aap apne QR code menu ke new orders aur customer reviews ke alerts ko yahan se setup kar sakte hain. Toggles ko custom requirements ke hisab se <b>On</b> ya <b>Off</b> rakhein.
                    </p>
                </div>
            </div>

            {/* Settings Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* New Order Alerts */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-4">
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">New Order Alerts</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <OptionToggle 
                            icon={Smartphone} 
                            label="New Order Popup" 
                            sKey="newOrderPopup" 
                            desc="Display beautiful bottom-right full popup window" 
                            colorClass="bg-orange-500"
                        />
                        <OptionToggle 
                            icon={Volume2} 
                            label="Sound Notification" 
                            sKey="newOrderSound" 
                            desc="Play order bell sound on new orders" 
                            colorClass="bg-indigo-500"
                        />
                        <OptionToggle 
                            icon={Bell} 
                            label="Toast Alert Banner" 
                            sKey="newOrderToast" 
                            desc="Show status message toasts on screens" 
                            colorClass="bg-pink-500"
                        />
                    </div>
                </div>

                {/* Rating & Engagement */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-4">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Reviews & Engagement</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <OptionToggle 
                            icon={MessageSquare} 
                            label="Review Alert Banners" 
                            sKey="reviewToast" 
                            desc="Display banner alert when customers leave feedback" 
                            colorClass="bg-amber-500"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-10 border-t border-slate-100 dark:border-white/5 text-center">
                <p className="text-[10px] text-slate-300 dark:text-white/10 uppercase tracking-[6px] font-black italic">
                    Kravy POS · Alert & Signal Engine
                </p>
            </div>
        </div>
    );
}
