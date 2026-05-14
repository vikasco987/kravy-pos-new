"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Zap, 
    Check, 
    ChevronRight, 
    Sparkles, 
    X,
    Lock,
    Crown,
    CheckCircle2,
    Phone
} from "lucide-react";

interface PremiumAlertProps {
    profile: any;
}

export default function PremiumAlert({ profile }: PremiumAlertProps) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!profile) return;

        // Logic: Show if NOT premium AND (forced by admin OR 3+ days passed) AND NOT explicitly hidden by admin
        const isPremium = profile.isPremium === true;
        const forceShow = profile.showPremiumPopup === true;

        if (!isPremium && forceShow) {
            setIsOpen(true);
        }
    }, [profile]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl relative border border-white/20"
                    >
                        {/* Premium Header Decoration */}
                        <div className="h-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-500 relative flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
                            </div>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className="absolute -bottom-12 -left-12 w-48 h-48 bg-rose-400/10 rounded-full blur-3xl"
                            />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border border-white/30 shadow-lg">
                                    <Crown size={32} />
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 pt-10 text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-4">
                                <Sparkles size={12} />
                                Account Subscription Required
                            </div>

                            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Upgrade to Premium</h2>
                            <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
                                Select a plan to continue using Kravy POS. Activate instantly via WhatsApp or call our support.
                            </p>

                            {/* Plans Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                {[
                                    { name: "1 Year", price: "3,999", printer: "5,999", original: "7,000", off: "43%", color: "bg-slate-50", text: "text-slate-900" },
                                    { name: "2 Year", price: "5,999", printer: "7,999", original: "14,000", off: "57%", color: "bg-slate-900", text: "text-white", popular: true },
                                    { name: "3 Year", price: "7,499", printer: "9,499", original: "21,000", off: "64%", color: "bg-indigo-600", text: "text-white", best: true }
                                ].map((plan, i) => (
                                    <div 
                                        key={i} 
                                        className={`${plan.color} ${plan.text} rounded-3xl p-5 border border-black/5 relative flex flex-col items-center justify-center transition-transform hover:scale-[1.02] shadow-lg overflow-hidden`}
                                    >
                                        {plan.best && (
                                            <div className="absolute -top-3 bg-amber-400 text-amber-950 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-wider">Best Value</div>
                                        )}
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{plan.name} Plan</p>
                                        
                                        <div className="mb-3 text-center">
                                            <div className="flex items-baseline justify-center gap-1">
                                                <span className="text-[10px] font-bold opacity-60">₹</span>
                                                <span className="text-2xl font-black">{plan.price}</span>
                                            </div>
                                            <p className="text-[8px] font-bold uppercase tracking-tight opacity-40">Software Only</p>
                                        </div>

                                        <div className="w-full h-[1px] bg-black/5 mb-3"></div>

                                        <div className="mb-3 text-center">
                                            <div className="flex items-baseline justify-center gap-1 text-emerald-500">
                                                <span className="text-[10px] font-bold">₹</span>
                                                <span className="text-xl font-black">{plan.printer}</span>
                                            </div>
                                            <p className="text-[8px] font-black uppercase tracking-tight text-emerald-500/80">+ Thermal Printer</p>
                                        </div>

                                        <p className="text-[9px] line-through opacity-40 mb-2">Was ₹{plan.original}</p>
                                        <div className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-500 text-[8px] font-black italic">Upto {plan.off} OFF</div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="text-left">
                                    <p className="text-amber-800 text-[10px] font-black uppercase tracking-[2px] mb-1">Activation Support</p>
                                    <a href="tel:9289507882" className="text-amber-950 font-black text-2xl hover:scale-105 transition-transform inline-block">9289507882</a>
                                </div>
                                <div className="h-10 w-[1px] bg-amber-200 hidden md:block"></div>
                                <button
                                    onClick={() => window.open('https://wa.me/919289507882', '_blank')}
                                    className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                                >
                                    Activate via WhatsApp <ChevronRight size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-left max-w-md mx-auto">
                                {[
                                    "Unlimited Invoices",
                                    "Analytics Dashboard",
                                    "Inventory Tracking",
                                    "WhatsApp Automation"
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="bg-slate-50 p-4 flex items-center justify-center gap-4 border-t border-slate-100">
                            <div className="flex -space-x-2">
                                {[1,2,3].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm" />
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trusted by 500+ restaurants</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
