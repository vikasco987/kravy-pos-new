"use client";

import { SignUp } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { UtensilsCrossed, Rocket, Globe, BarChart3 } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0F0F23] flex flex-col lg:flex-row-reverse relative overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      {/* LEFT: BRANDING (Visible on LG up) */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex flex-1 flex-col justify-center p-20 relative z-10"
      >
        <div className="space-y-8 max-w-lg">
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-emerald-600/40">
                <UtensilsCrossed size={32} />
             </div>
             <div>
                <h1 className="text-4xl font-black text-white tracking-tighter">kravy<span className="text-emerald-500">POS</span></h1>
                <p className="text-emerald-400 font-bold tracking-[0.3em] text-[10px] uppercase">Scalable Business Cloud</p>
             </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
              Start your digital <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">outlet journey.</span>
            </h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              Join the ecosystem of elite restaurants scaling their operations with modern intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-8">
             <div className="flex items-center gap-4 p-6 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 flex items-center justify-center text-emerald-400"><Rocket size={24} /></div>
                <div>
                   <h4 className="text-white font-black text-sm uppercase">10 Min Setup</h4>
                   <p className="text-slate-500 text-xs font-medium">Auto-generate your menu and get live in minutes.</p>
                </div>
             </div>
             <div className="flex items-center gap-4 p-6 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="w-12 h-12 rounded-2xl bg-blue-400/20 flex items-center justify-center text-blue-400"><BarChart3 size={24} /></div>
                <div>
                   <h4 className="text-white font-black text-sm uppercase">Smart Analytics</h4>
                   <p className="text-slate-500 text-xs font-medium">Predictive sales insights and inventory tracking.</p>
                </div>
             </div>
          </div>
        </div>

        <div className="absolute bottom-12 right-20">
           <p className="text-slate-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <Globe size={14} className="text-emerald-400" /> Multi-outlet Support Ready
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
             <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-2xl flex items-center justify-center text-white mb-4">
                <UtensilsCrossed size={24} />
             </div>
             <h2 className="text-2xl font-black text-white">kravyPOS</h2>
          </div>

          <SignUp 
            appearance={{
              elements: {
                rootBox: "w-full mx-auto",
                card: "bg-white dark:bg-[#1A1A2E] border-0 shadow-2xl rounded-[32px] p-8",
                headerTitle: "text-2xl font-black text-slate-900 dark:text-white tracking-tight",
                headerSubtitle: "text-slate-500 dark:text-slate-400 font-medium",
                formButtonPrimary: "bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-xs tracking-widest py-3 rounded-2xl transition-all shadow-xl shadow-emerald-600/20",
                formFieldInput: "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 rounded-2xl py-3 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium",
                footerActionLink: "text-emerald-600 hover:text-emerald-700 font-black",
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
