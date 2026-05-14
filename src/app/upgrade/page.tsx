"use client";

import { motion } from "framer-motion";
import { 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  Phone, 
  ShieldCheck, 
  Zap, 
  Clock, 
  ArrowLeft,
  LayoutDashboard,
  Smartphone,
  BarChart3,
  Receipt
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UpgradePage() {
    const router = useRouter();

    const plans = [
        { 
            name: "1 Year Plan", 
            price: "3,999", 
            printerPrice: "5,999",
            original: "7,000", 
            off: "43% OFF", 
            color: "from-slate-800 to-slate-900",
            border: "border-slate-700",
            text: "text-slate-300",
            icon: <Clock className="text-slate-400" size={24} />
        },
        { 
            name: "2 Year Plan", 
            price: "5,999", 
            printerPrice: "7,999",
            original: "14,000", 
            off: "57% OFF", 
            color: "from-indigo-600 to-purple-700",
            border: "border-indigo-400/30",
            text: "text-indigo-100",
            popular: true,
            icon: <Zap className="text-amber-400" size={24} />
        },
        { 
            name: "3 Year Plan", 
            price: "7,499", 
            printerPrice: "9,499",
            original: "21,000", 
            off: "64% OFF", 
            color: "from-emerald-600 to-teal-700",
            border: "border-emerald-400/30",
            text: "text-emerald-100",
            best: true,
            icon: <Sparkles className="text-amber-300" size={24} />
        }
    ];

    const features = [
        { title: "Unlimited Invoices", desc: "No limits on bill generation", icon: <Receipt size={18} /> },
        { title: "Inventory Tracking", desc: "Manage stock and alerts", icon: <Smartphone size={18} /> },
        { title: "Advanced Analytics", desc: "Daily sales & growth reports", icon: <BarChart3 size={18} /> },
        { title: "WhatsApp Support", desc: "Direct 24/7 priority help", icon: <Phone size={18} /> }
    ];

    return (
        <div className="min-h-screen bg-[#0F172A] text-white selection:bg-indigo-500/30 overflow-x-hidden">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-purple-600/10 blur-[100px] rounded-full" />
                <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-emerald-600/10 blur-[100px] rounded-full" />
            </div>

            <nav className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto">
                <Link href="/dashboard" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-all">
                        <ArrowLeft size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-sm font-black tracking-widest text-slate-400 group-hover:text-white transition-colors uppercase">Back to POS</span>
                </Link>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live Activation</span>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-20">
                <div className="text-center mb-16">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[3px] mb-6"
                    >
                        <Sparkles size={14} />
                        Premium Experience
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black mb-6 tracking-tighter"
                    >
                        Scale Your Business <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">Without Limits</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium"
                    >
                        Upgrade to Kravy POS Premium and unlock powerful tools designed to help your restaurant grow faster and smarter.
                    </motion.p>
                </div>

                {/* Plans Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + (i * 0.1) }}
                            className={`relative group rounded-[2.5rem] p-8 bg-gradient-to-b ${plan.color} border ${plan.border} shadow-2xl overflow-hidden flex flex-col`}
                        >
                            {plan.popular && (
                                <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Popular</span>
                                </div>
                            )}
                            {plan.best && (
                                <div className="absolute top-6 right-6 bg-amber-400 px-3 py-1 rounded-full border border-amber-300">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-950">Best Value</span>
                                </div>
                            )}

                            <div className="mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                                    {plan.icon}
                                </div>
                                <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-4xl font-black">₹{plan.price}</span>
                                    <span className="text-sm font-bold opacity-50 line-through">₹{plan.original}</span>
                                </div>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${plan.text} mb-4`}>Software Only Subscription</p>
                                <div className="inline-block px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-black italic">
                                    {plan.off}
                                </div>
                            </div>

                            <div className="mt-auto pt-8 border-t border-white/10">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Bundle Offer</p>
                                        <p className="text-xl font-black">₹{plan.printerPrice}</p>
                                        <p className="text-[10px] font-bold text-emerald-400">+ Thermal Printer Included</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                        <Receipt size={20} className="text-white/30" />
                                    </div>
                                </div>

                                <button 
                                    onClick={() => window.open('https://wa.me/919289507882', '_blank')}
                                    className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2 group/btn shadow-xl shadow-white/5"
                                >
                                    Select This Plan
                                    <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Features Section */}
                <div className="bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 p-8 md:p-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                        {features.map((f, i) => (
                            <div key={i} className="flex flex-col gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    {f.icon}
                                </div>
                                <div>
                                    <h4 className="font-black text-lg mb-1">{f.title}</h4>
                                    <p className="text-sm text-slate-400 font-medium leading-relaxed">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 pt-16 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-[2rem] bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/20">
                                <Phone size={28} className="text-amber-950" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Direct Activation Support</p>
                                <a href="tel:9289507882" className="text-3xl font-black hover:text-indigo-400 transition-colors tracking-tighter">9289507882</a>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right hidden md:block">
                                <p className="font-bold text-sm">Instant Activation</p>
                                <p className="text-xs text-slate-500 font-medium">Get started in less than 5 minutes</p>
                            </div>
                            <button 
                                onClick={() => window.open('https://wa.me/919289507882', '_blank')}
                                className="px-8 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-black flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-indigo-500/20"
                            >
                                <Smartphone size={20} />
                                ACTIVATE VIA WHATSAPP
                            </button>
                        </div>
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-20 flex flex-wrap justify-center items-center gap-10 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                   <div className="flex items-center gap-2 font-black tracking-widest uppercase text-xs">
                      <ShieldCheck size={20} /> Secure Payments
                   </div>
                   <div className="flex items-center gap-2 font-black tracking-widest uppercase text-xs">
                      <Zap size={20} /> Instant Setup
                   </div>
                   <div className="flex items-center gap-2 font-black tracking-widest uppercase text-xs">
                      <LayoutDashboard size={20} /> Lifetime Support
                   </div>
                </div>
            </main>

            <footer className="p-10 text-center text-slate-600 text-xs font-black uppercase tracking-widest">
                © 2026 Kravy Technologies • Made for Incredible Businesses
            </footer>
        </div>
    );
}
