"use client";

import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  ArrowRight, 
  Phone, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  LayoutDashboard,
  ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export const plans = [
  {
    key: "trial",
    name: "Free Trial",
    price: 0,
    originalPrice: null,
    description: "Explore the billing platform with a full feature trial.",
    features: [
      "3 Day full access trial",
      "Unlimited invoices during trial",
      "Analytics dashboard",
      "Customer management",
      "Invoice with logo & QR",
      "3 click billing system",
      "Basic inventory management",
      "Chat support",
    ],
  },
  {
    key: "year1",
    name: "1 Year Plan",
    price: 3999,
    originalPrice: 7000,
    description: "Perfect for restaurants and small businesses.",
    features: [
      "Unlimited invoices",
      "Analytics dashboard",
      "3 click billing system",
      "Customer management",
      "Inventory management",
      "Tax / GST management",
      "Invoice with logo & QR",
      "Table QR ordering",
      "Bulk item uploading",
      "Chat & Email support",
    ],
  },
  {
    key: "year2",
    name: "2 Year Plan",
    price: 5999,
    originalPrice: 14000,
    description: "Best choice for growing businesses.",
    features: [
      "Everything in 1 Year plan",
      "Advanced analytics dashboard",
      "Kitchen workflow system",
      "Coupons, loyalty & offers management",
      "Table QR ordering system",
      "Inventory tracking with alerts",
      "Bulk menu uploading",
      "Priority support",
      "Customer insights reports",
      "Chat & Email support",
    ],
  },
  {
    key: "year3",
    name: "3 Year Plan",
    price: 7499,
    originalPrice: 21000,
    description: "Maximum savings for long-term businesses.",
    features: [
      "Everything in 2 Year plan",
      "Advanced analytics dashboard",
      "Kitchen workflow automation",
      "Inventory smart tracking",
      "Coupons, loyalty & offers management",
      "Table QR ordering system",
      "Bulk uploading system",
      "Advanced tax / GST reports",
      "Priority support",
      "Chat & Email support",
    ],
    highlight: true,
  },
];

export default function UpgradePage() {
    const router = useRouter();
    const supportPhone = "+91 9289507882";

    const handleWhatsApp = (planName: string) => {
        const message = encodeURIComponent(`Hi, I'm interested in the ${planName} of Kravy POS. Please help me with the activation.`);
        window.open(`https://wa.me/919289507882?text=${message}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#09090b] text-slate-900 dark:text-white font-sans selection:bg-indigo-500/10">
            {/* Nav */}
            <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
                <Link href="/dashboard" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-white/10 transition-all">
                        <ArrowLeft size={16} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">Back</span>
                </Link>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Active Support</span>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
                        Choose Your Plan
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-neutral-400 max-w-xl mx-auto font-medium leading-relaxed">
                        Simple, transparent pricing designed for restaurants and food businesses. <br className="hidden md:block" /> No hidden fees, instant activation.
                    </p>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                    {plans.map((plan) => {
                        const saving = plan.originalPrice && plan.originalPrice - plan.price;
                        const savePercent = plan.originalPrice && Math.round((saving / plan.originalPrice) * 100);

                        return (
                            <motion.div
                                key={plan.key}
                                whileHover={{ y: -5 }}
                                className={`relative flex flex-col rounded-[2.5rem] p-8 border transition-all duration-300 shadow-sm
                                ${
                                    plan.highlight
                                    ? "bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none shadow-xl shadow-indigo-500/20"
                                    : "bg-white dark:bg-zinc-900 border-neutral-200 dark:border-white/5"
                                }`}
                            >
                                {plan.highlight && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full border border-white/10">
                                        Best Value
                                    </span>
                                )}

                                <div className="mb-6">
                                    {savePercent ? (
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${plan.highlight ? 'text-indigo-200' : 'text-indigo-600'}`}>
                                            Save {savePercent}% Today
                                        </div>
                                    ) : (
                                        <div className="h-[18px] mb-2" />
                                    )}

                                    <h3 className="text-xl font-black">{plan.name}</h3>
                                    
                                    <div className="mt-4 flex items-baseline gap-2">
                                        <div className="text-4xl font-black">₹{plan.price.toLocaleString()}</div>
                                        {plan.originalPrice && (
                                            <div className="text-sm font-bold line-through opacity-50">₹{plan.originalPrice.toLocaleString()}</div>
                                        )}
                                    </div>
                                    <p className="text-xs font-medium opacity-70 mt-3 leading-relaxed h-10 overflow-hidden">
                                        {plan.description}
                                    </p>
                                </div>

                                <ul className="space-y-3 text-left mb-8 flex-1">
                                    {plan.features.map((f, i) => (
                                        <li key={i} className="flex gap-2.5 items-start">
                                            <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? 'text-indigo-300' : 'text-indigo-500'}`} />
                                            <span className="text-[13px] font-semibold leading-tight">{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleWhatsApp(plan.name)}
                                    className={`mt-auto py-4 rounded-2xl font-black text-xs uppercase tracking-[2px] flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg
                                    ${
                                        plan.highlight
                                        ? "bg-white text-indigo-900 hover:bg-slate-100"
                                        : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90"
                                    }`}
                                >
                                    Select Plan
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Support Section */}
                <div className="max-w-4xl mx-auto">
                    <div className="bg-slate-50 dark:bg-white/5 rounded-[3rem] p-8 md:p-12 border border-slate-200 dark:border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
                        
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-[2rem] bg-white dark:bg-white/10 flex items-center justify-center shadow-xl border border-slate-100 dark:border-white/5">
                                    <Phone size={28} className="text-indigo-500" />
                                </div>
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-1">Activation Support</p>
                                    <a href={`tel:${supportPhone}`} className="text-3xl font-black tracking-tighter hover:text-indigo-500 transition-colors">
                                        {supportPhone}
                                    </a>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="text-right hidden lg:block mr-2">
                                    <p className="font-black text-sm uppercase">24/7 Priority Support</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">For Premium Merchants</p>
                                </div>
                                <button 
                                    onClick={() => window.open(`https://wa.me/919289507882`, '_blank')}
                                    className="px-8 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-[2px] flex items-center gap-3 transition-all shadow-xl shadow-indigo-600/20"
                                >
                                    <Zap size={18} fill="currentColor" />
                                    Instant Activation
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="mt-12 flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-30">
                        <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                            <ShieldCheck size={16} /> Secure Payment
                        </div>
                        <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                            <Zap size={16} /> Instant Setup
                        </div>
                        <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                            <LayoutDashboard size={16} /> 24/7 Support
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-12 text-center">
                <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">
                    © 2026 Kravy POS • Empowering Small Businesses
                </p>
            </footer>
        </div>
    );
}
