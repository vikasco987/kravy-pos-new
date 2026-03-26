"use client";

import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { UtensilsCrossed, Sparkles, ShieldCheck, Zap } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0F0F23] flex flex-col lg:flex-row relative overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      {/* LEFT: BRANDING (Visible on LG up) */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex flex-1 flex-col justify-center p-20 relative z-10"
      >
        <div className="space-y-8 max-w-lg">
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40">
                <UtensilsCrossed size={32} />
             </div>
             <div>
                <h1 className="text-4xl font-black text-white tracking-tighter">kravy<span className="text-indigo-500">POS</span></h1>
                <p className="text-indigo-400 font-bold tracking-[0.3em] text-[10px] uppercase">Smart Billing Intelligence</p>
             </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
              One dashboard for <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">your entire outlet.</span>
            </h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              Experience the fastest POS & QR menu system designed for modern scale restaurants.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-8">
             <div className="space-y-2 p-6 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="text-indigo-400 mb-2"><Zap size={24} fill="currentColor" /></div>
                <h4 className="text-white font-black text-sm uppercase">Cloud Realtime</h4>
                <p className="text-slate-500 text-xs font-medium">Instant sync across all your kitchen and service terminals.</p>
             </div>
             <div className="space-y-2 p-6 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="text-purple-400 mb-2"><ShieldCheck size={24} fill="currentColor" /></div>
                <h4 className="text-white font-black text-sm uppercase">Secure Auth</h4>
                <p className="text-slate-500 text-xs font-medium">Enterprise grade security for your business data.</p>
             </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-20">
           <p className="text-slate-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-400" /> Trusted by 500+ Outlets
           </p>
        </div>
      </motion.div>

      {/* RIGHT: AUTH FORM */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10 bg-white/5 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="flex lg:hidden flex-col items-center mb-8">
             <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white mb-4">
                <UtensilsCrossed size={24} />
             </div>
             <h2 className="text-2xl font-black text-white">kravyPOS</h2>
          </div>

          <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full mx-auto",
                card: "bg-white dark:bg-[#1A1A2E] border-0 shadow-2xl rounded-[32px] p-8",
                headerTitle: "text-2xl font-black text-slate-900 dark:text-white tracking-tight",
                headerSubtitle: "text-slate-500 dark:text-slate-400 font-medium",
                formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-xs tracking-widest py-3 rounded-2xl transition-all shadow-xl shadow-indigo-600/20",
                formFieldInput: "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 rounded-2xl py-3 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium",
                footerActionLink: "text-indigo-600 hover:text-indigo-700 font-black",
                dividerLine: "bg-slate-100 dark:bg-slate-800",
                dividerText: "text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white dark:bg-[#1A1A2E] px-4",
                socialButtonsBlockButton: "rounded-2xl border-slate-100 dark:border-slate-700/50 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all",
                socialButtonsBlockButtonText: "font-black text-xs uppercase tracking-widest",
              }
            }}
          />
        </motion.div>
      </div>

    </div>
  );
}
