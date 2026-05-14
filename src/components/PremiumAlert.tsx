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
    CheckCircle2
} from "lucide-react";

interface PremiumAlertProps {
    profile: any;
}

export default function PremiumAlert({ profile }: PremiumAlertProps) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!profile) return;

        // Logic: Show if NOT premium AND (forced by admin OR 3+ days passed) AND NOT explicitly hidden by admin
        const trialDate = new Date(profile.trialStartedAt || profile.createdAt);
        const diffTime = Math.abs(new Date().getTime() - trialDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const isPremium = profile.isPremium === true;
        const forceShow = profile.showPremiumPopup === true;
        const forceHide = profile.showPremiumPopup === false;

        if (!isPremium && !forceHide && (forceShow || diffDays >= 3)) {
            // Check session storage so it only pops up once per session
            const dismissed = sessionStorage.getItem("premium_dismissed");
            if (!dismissed) {
                setIsOpen(true);
            }
        }
    }, [profile]);

    const handleDismiss = () => {
        setIsOpen(false);
        sessionStorage.setItem("premium_dismissed", "true");
    };

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
                                Trial Period Ended
                            </div>

                            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Upgrade to Premium</h2>
                            <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
                                Your free trial has expired. Upgrade now to keep using premium features and take your business to the next level.
                            </p>

                            <div className="grid grid-cols-1 gap-3 mb-8 text-left max-w-xs mx-auto">
                                {[
                                    "Unlimited Orders & KOTs",
                                    "Advanced Sales Analytics",
                                    "WhatsApp Report Automation",
                                    "Multi-User & Role Management"
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => window.open('https://kravy.in/pricing', '_blank')}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 group"
                                >
                                    Activate Premium Account
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                
                                <button
                                    onClick={handleDismiss}
                                    className="w-full py-3 text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors"
                                >
                                    Maybe Later
                                </button>
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
