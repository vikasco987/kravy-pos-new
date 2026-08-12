"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
    LayoutGrid, Check, ArrowLeft, Save, Eye, EyeOff, RotateCcw, AlertCircle, Sparkles,
    Home, ShoppingCart, LayoutDashboard, Activity, Building, Receipt, Zap,
    UtensilsCrossed, Layers, PlusCircle, Upload, Settings, Users, UserPlus,
    Package, IndianRupee, QrCode, Camera, TrendingUp, PieChart, FileText,
    BarChart3, UserCircle, Mail, Printer, Trash2,
    Building2,
    Calendar,
    Hash,
    ShieldCheck,
    Loader2,
    History,
    ChevronLeft,
    CheckCircle2,
    Lock, Shield, Archive, HelpCircle
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { kravy } from "@/lib/kravy";
import { useAuthContext } from "@/components/AuthContext";

// Complete list of sidebar groups & items mirroring Sidebar.tsx
const allSidebarGroups = [
  {
    group: "OPERATIONS",
    items: [
      { icon: Home, label: "Store Dashboard", href: "/dashboard" },
      { icon: ShoppingCart, label: "Quick POS Billing", href: "/dashboard/billing/checkout" },
      { icon: Zap, label: "Fuel Billing", href: "/dashboard/fuel" },
      { icon: LayoutDashboard, label: "Floor Management", href: "/dashboard/terminal" },
      { icon: Activity, label: "Kitchen Workflow", href: "/dashboard/kitchen" },
      { icon: LayoutGrid, label: "Table Status", href: "/dashboard/tables" },
      { icon: Building, label: "Hotel Room Stay", href: "/dashboard/rooms" },
      { icon: Receipt, label: "Past Bills / History", href: "/dashboard/billing" },
      { icon: Zap, label: "Go to Billing Panel", href: "https://billing.kravy.in" },
    ]
  },
  {
    group: "STORE CATALOG",
    items: [
      { icon: UtensilsCrossed, label: "Browse Products", href: "/dashboard/menu/view" },
      { icon: Sparkles, label: "Interactive Editor", href: "/dashboard/menu-editor" },
      { icon: Layers, label: "Add-on clusters", href: "/dashboard/menu/addons" },
      { icon: Zap, label: "AI Menu Scraper", href: "/dashboard/ai-scraper" },
      { icon: Sparkles, label: "Auto Apply Images", href: "/dashboard/auto-apply" },
      { icon: PlusCircle, label: "Add Single Item", href: "/dashboard/menu/upload" },
      { icon: Upload, label: "Excel Bulk Import", href: "/dashboard/store-item-upload" },
      { icon: Settings, label: "Category & Editor", href: "/dashboard/menu/edit" },
    ]
  },
  {
    group: "RESOURCES",
    items: [
      { icon: Users, label: "Customer Parties", href: "/dashboard/parties" },
      { icon: UserPlus, label: "Staff Management", href: "/dashboard/staff" },
      { icon: Package, label: "Inventory Stock", href: "/dashboard/inventory" },
      { icon: IndianRupee, label: "Restaurant Expenses", href: "/dashboard/expenses" },
      { icon: QrCode, label: "QR Order Terminal", href: "/dashboard/qr-orders" },
    ]
  },
  {
    group: "MARKETING",
    items: [
      { icon: Sparkles, label: "Marketing Hub", href: "/dashboard/combos" },
      { icon: Camera, label: "Gallery Manager", href: "/dashboard/gallery" },
    ]
  },
  {
    group: "REPORTS & ANALYTICS",
    items: [
      { icon: TrendingUp, label: "Daily Sales Report", href: "/dashboard/reports/sales/daily" },
      { icon: PieChart, label: "GST Reports", href: "/dashboard/reports/gst" },
      { icon: FileText, label: "Manual Invoice", href: "/dashboard/admin/invoice-generator" },
    ]
  },
  {
    group: "INSIGHTS",
    items: [
      { icon: BarChart3, label: "Revenue Analysis", href: "/dashboard/reports/sales/revenue" },
      { icon: PieChart, label: "Mode of Payment", href: "/dashboard/reports/payments" },
      { icon: TrendingUp, label: "Business Growth", href: "/dashboard/reports/performance" },
    ]
  },
  {
    group: "ADMINISTRATION",
    items: [
      { icon: UserCircle, label: "Business Profile", href: "/dashboard/profile" },
      { icon: Mail, label: "Gmail Integration", href: "/dashboard/integration/gmail" },
      { icon: Settings, label: "POS Settings", href: "/dashboard/settings" },
      { icon: Printer, label: "Printing Setup", href: "/dashboard/settings/printing" },
      { icon: Zap, label: "Advanced Controls", href: "/dashboard/settings/advanced" },
      { icon: Lock, label: "Access Control", href: "/admin/users" },
      { icon: Shield, label: "Manage Platform", href: "/admin/dashboard" },
      { icon: Shield, label: "Security & Backup", href: "/dashboard/backup" },
      { icon: Archive, label: "Archive & Trash", href: "/dashboard/billing/deleted" },
      { icon: HelpCircle, label: "Help & Support", href: "/dashboard/help" },
    ]
  }
];

export default function SidebarSettingsPage() {
    const { user: authUser, loading: authLoading, refresh: refreshUser } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hiddenHrefs, setHiddenHrefs] = useState<string[]>([]);

    const userRole = authUser?.type || "USER";
    const allowedPaths = authUser?.permissions || [];

    useEffect(() => {
        if (authLoading) return;
        
        // Use user's own hidden items from AuthContext
        if (authUser && authUser.hiddenSidebarItems) {
            setHiddenHrefs(authUser.hiddenSidebarItems);
            localStorage.setItem("kravy_hidden_sidebar_items", JSON.stringify(authUser.hiddenSidebarItems));
        } else {
            try {
                const local = localStorage.getItem("kravy_hidden_sidebar_items");
                if (local) setHiddenHrefs(JSON.parse(local));
            } catch (e) {}
        }
        setLoading(false);
    }, [authUser, authLoading]);

    const hasRole = (roles?: string[]) => {
        if (!roles) return true;
        return roles.includes(userRole);
    };

    const hasPermission = (href: string) => {
        if (userRole === "OWNER" || userRole === "ADMIN" || userRole === "SELLER") return true;
        if (href === "/dashboard") return true; // Always allow dashboard home
        return allowedPaths.some(p => href.startsWith(p));
    };

    const filteredGroups = allSidebarGroups.map(group => {
        // Filter items within the group
        const items = group.items.filter(item => {
            if (!hasRole(item.roles)) return false;
            if (!hasPermission(item.href)) return false;
            return true;
        });
        return { ...group, items };
    }).filter(group => group.items.length > 0); // Remove empty groups


    const toggleItem = (href: string) => {
        if (href === "/dashboard/settings" || href === "/dashboard/profile") {
            toast.error("Critical settings link cannot be hidden");
            return;
        }
        kravy.toggle();
        setHiddenHrefs(prev => 
            prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
        );
    };

    const handleReset = () => {
        kravy.click();
        setHiddenHrefs([]);
        toast.success("Reset all sidebar items to visible");
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save to localStorage
            localStorage.setItem("kravy_hidden_sidebar_items", JSON.stringify(hiddenHrefs));

            // Notify Sidebar dynamically in same tab
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'kravy_hidden_sidebar_items',
                newValue: JSON.stringify(hiddenHrefs)
            }));

            // Save to Database (User Preferences)
            const res = await fetch(`/api/user/preferences`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hiddenSidebarItems: hiddenHrefs }),
            });

            if (res.ok) {
                kravy.success();
                refreshUser(); // Update AuthContext in memory
                toast.success("Sidebar configuration updated!");
            } else {
                toast.error("Failed to sync configuration with server");
            }
        } catch (error) {
            toast.error("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center opacity-50">Loading Navigation Controls...</div>;

    // Calculate based on visible filtered groups instead of all
    const totalItems = filteredGroups.reduce((acc, g) => acc + g.items.length, 0);
    const hiddenCount = filteredGroups.reduce((acc, g) => {
        return acc + g.items.filter(i => hiddenHrefs.includes(i.href)).length;
    }, 0);
    const visibleCount = totalItems - hiddenCount;

    return (
        <div className="max-w-5xl mx-auto space-y-8 kravy-page-fade pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <Link href="/dashboard/settings" className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center hover:scale-110 transition-all shadow-sm">
                        <ArrowLeft size={20} className="text-slate-600 dark:text-white" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Sidebar Menu Controls</h1>
                        <p className="text-xs text-slate-400 dark:text-white/40 font-bold uppercase tracking-[0.2em] mt-1">Hide unnecessary sidebar items & simplify navigation</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleReset}
                        className="h-14 px-6 rounded-[1.5rem] bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider text-xs flex items-center gap-2 transition-all active:scale-95 border border-slate-200 dark:border-white/10"
                    >
                        <RotateCcw size={16} />
                        Show All
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="h-14 px-8 rounded-[1.5rem] bg-violet-600 hover:bg-violet-500 text-white font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-violet-600/20 disabled:opacity-50 transition-all active:scale-95"
                    >
                        <Save size={18} />
                        {saving ? "Saving Menu..." : "Save Customization"}
                    </button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-violet-600/10 via-purple-600/5 to-transparent border border-violet-500/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex gap-5 items-start">
                    <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center text-violet-500 shrink-0 shadow-inner">
                        <AlertCircle size={24} />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Clean & Customized Sidebar</h3>
                        <p className="text-sm text-slate-500 dark:text-white/60 leading-relaxed font-medium">
                            Turn off unnecessary links to keep your sidebar distraction-free. Changes apply instantly across your device and sync to your account.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-white dark:bg-white/5 px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 shrink-0">
                    <div className="text-center border-r border-slate-200 dark:border-white/10 pr-4">
                        <div className="text-xl font-black text-emerald-500">{visibleCount}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visible</div>
                    </div>
                    <div className="text-center pl-2">
                        <div className="text-xl font-black text-rose-500">{hiddenCount}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hidden</div>
                    </div>
                </div>
            </div>

            {/* Groups Grid */}
            <div className="space-y-10">
                {filteredGroups.map((group) => (
                    <div key={group.group} className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-sm shadow-violet-500/50" />
                            <h2 className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 dark:text-white/40">{group.group}</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.items.map((item) => {
                                const isHidden = hiddenHrefs.includes(item.href);
                                const isProtected = item.href === "/dashboard/settings" || item.href === "/dashboard/profile";
                                const Icon = item.icon;

                                return (
                                    <div
                                        key={item.href}
                                        onClick={() => toggleItem(item.href)}
                                        className={`p-4 rounded-[1.8rem] border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                                            !isHidden 
                                            ? "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 shadow-sm hover:border-violet-300 dark:hover:border-violet-500/30" 
                                            : "bg-slate-50 dark:bg-black/30 border-slate-100 dark:border-white/5 opacity-50 grayscale"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                                                !isHidden 
                                                ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400" 
                                                : "bg-slate-200 dark:bg-white/5 text-slate-400"
                                            }`}>
                                                <Icon size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className={`text-sm font-bold truncate transition-colors ${!isHidden ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-white/40"}`}>
                                                    {item.label}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono truncate opacity-60">
                                                    {item.href}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="shrink-0">
                                            {isProtected ? (
                                                <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-1 rounded-lg">
                                                    Always Show
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                                                        !isHidden 
                                                        ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400" 
                                                        : "bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400"
                                                    }`}
                                                >
                                                    {!isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-6 z-50">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span className="text-violet-600 font-black">{hiddenCount}</span> items hidden from sidebar
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-11 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black uppercase tracking-wider text-xs flex items-center gap-2 shadow-lg shadow-violet-600/30 disabled:opacity-50 transition-all active:scale-95"
                >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save Sidebar Layout"}
                </button>
            </div>
        </div>
    );
}
