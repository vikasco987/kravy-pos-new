"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Settings, 
  ArrowRight, 
  CheckCircle2, 
  Info,
  Zap,
  Layout,
  Receipt,
  HelpCircle,
  Eye,
  Check,
  BarChart3,
  Layers,
  Trash2,
  Lock,
  Search,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function GSTCategoryProDocsPage() {
  const router = useRouter();

  const sections = [
    {
      title: "1. Advanced Category Overhaul",
      icon: <Layers className="text-indigo-500" size={24} />,
      content: "Ab aap apni categories ko kisi bhi waqt Rename ya Delete kar sakte hain.",
      hinglish: "Browse Products mein side rail par Pencil icon se rename karein aur Trash icon se delete. Delete karne par items automatic 'Uncategorized' ho jayenge, kuch bhi loss nahi hoga!",
      image: "/docs/cat_mgmt.png",
      points: [
        "Smart Rename: Pura menu update karne ki zaroorat nahi, bas name badlein.",
        "Safe Delete: Items 'Uncategorized' group mein shift ho jayenge.",
        "Quick Access: Sidebar se hi direct control."
      ]
    },
    {
      title: "2. Precision GST Priority System",
      icon: <Zap className="text-amber-500" size={24} />,
      content: "Agar product ka apna GST set hai, to wo Global Settings se upar rahega.",
      hinglish: "Rule simple hai: Product GST > Global GST. Isse aap different tax rates wale items (jaise 5% and 18%) ko ek hi bill mein handle kar sakte hain.",
      image: "/docs/gst_priority.png",
      points: [
        "Product Level Control: Har item ka tax independently set karein.",
        "Automatic Fallback: Agar item ka tax 'Default' hai, to Profile settings apply hongi.",
        "Error Free Billing: CA audits ke liye perfect workflow."
      ]
    },
    {
      title: "3. Professional GSTR-1 & Audit Center",
      icon: <BarChart3 className="text-violet-500" size={24} />,
      content: "Naya advanced report center jisme aap columns ko apni marzi se hide ya show kar sakte hain.",
      hinglish: "GSTR-1 mein ab Invoice No, Date, Buyer Name, GSTIN aur Place of Supply (State) sab dikhta hai. 'Columns' button se zaroorat ke hisab se fields on-off karein.",
      image: "/docs/gst_report_advanced.png",
      points: [
        "IGST Support: Inter-state sales ke liye automatic tax calculation.",
        "B2B vs B2C: Buyer GSTIN ke basis par automatic classification.",
        "Custom Columns: Sirf vahi dikhayiye jo zaroori hai."
      ]
    },
    {
      title: "4. Checkout & Tax Details",
      icon: <Receipt className="text-emerald-500" size={24} />,
      content: "Billing karte waqt hi Customer ka GSTIN aur Place of Supply add karein.",
      hinglish: "Checkout mein 'Customer Details' expand karein aur Buyer GSTIN aur State bharein. Ye data seedhe aapki GST report mein sync ho jayega for 100% accuracy.",
      points: [
        "One-Time Entry: Customer details local CRM mein save ho jati hain.",
        "State Selection: IGST vs CGT/SGST automatic decide ho jayega.",
        "Client Branding: Bill print par bhi ye details dikhayi jayengi."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      <div className="max-w-6xl mx-auto px-4 md:px-10 space-y-20 pt-16">
        
        {/* Animated Hero Header */}
        <header className="relative py-12 text-center space-y-8 overflow-hidden rounded-[3rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-100">
           <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse delay-700"></div>
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xl px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em]"
           >
             <Zap size={14} className="text-amber-300" /> New Category & GST Audit Update
           </motion.div>
           
           <div className="space-y-4 px-6 relative z-10">
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none italic">
                SMART <span className="text-amber-300">UTILITY</span> PRO
              </h1>
              <p className="text-xl md:text-2xl text-indigo-100 font-medium max-w-3xl mx-auto leading-relaxed">
                Management ko banayein super easy aur Tax Reporting ko 100% Professional.
              </p>
           </div>
           
           <div className="flex justify-center gap-4 relative z-10">
              <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                 <ShieldCheck size={16} className="text-emerald-300" /> Secure Logging
              </div>
              <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                 <Settings size={16} className="text-indigo-200" /> CA-Ready
              </div>
           </div>
        </header>

        {/* Feature Sections with Mockups */}
        <div className="space-y-32">
           {sections.map((section, idx) => (
             <motion.div 
               key={idx}
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className={`flex flex-col ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-16 items-center`}
             >
                {/* Text Content */}
                <div className="lg:w-1/2 space-y-8">
                   <div className="space-y-4">
                      <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                         {section.icon}
                      </div>
                      <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                         {section.title}
                      </h2>
                      <p className="text-lg text-slate-500 font-medium leading-relaxed italic">
                         {section.content}
                      </p>
                   </div>
                   
                   <div className="p-8 bg-indigo-50 border-l-8 border-indigo-600 rounded-3xl space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Easy Samjhein (Hinglish)</div>
                      <p className="text-base text-slate-800 font-bold leading-relaxed">{section.hinglish}</p>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.points.map((pt, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-xs font-black text-slate-700 uppercase tracking-tight">
                           <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                           {pt}
                        </div>
                      ))}
                   </div>
                </div>

                {/* Visual Mockup Container */}
                <div className="lg:w-1/2 relative group">
                   <div className="absolute -inset-4 bg-indigo-600/5 rounded-[3rem] blur-2xl group-hover:bg-indigo-600/10 transition-colors"></div>
                   <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white transform group-hover:scale-[1.02] transition-transform duration-500 bg-slate-200">
                      {section.image ? (
                        <img 
                          src={section.image} 
                          alt={section.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-black uppercase tracking-widest text-lg">
                           Visual Preview
                        </div>
                      )}
                   </div>
                </div>
             </motion.div>
           ))}
        </div>

        {/* Footer CTAs */}
        <section className="bg-slate-900 rounded-[4rem] p-12 md:p-20 text-center space-y-12 relative overflow-hidden shadow-2xl">
           <Zap size={300} className="absolute -bottom-40 -left-40 text-white opacity-5 pointer-events-none" />
           <BarChart3 size={300} className="absolute -top-40 -right-40 text-indigo-500 opacity-5 pointer-events-none" />
           
           <div className="space-y-4 relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter">Mission Accomplished! 🚀</h2>
              <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
                 Ab aapka business pehle se zyada smart aur professional hai. Ready for the next challenge?
              </p>
           </div>
           
           <div className="flex flex-col md:flex-row gap-6 justify-center relative z-10">
              <button 
                onClick={() => router.push("/dashboard/billing/checkout")}
                className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-500/30 hover:bg-white hover:text-black hover:scale-105 active:scale-95 transition-all"
              >
                Go to Billing Now <ArrowRight className="inline-block ml-2" size={16} />
              </button>
              <button 
                onClick={() => router.push("/dashboard/reports/gst")}
                className="px-10 py-5 bg-white text-slate-900 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-emerald-500 hover:text-white hover:scale-105 active:scale-95 transition-all"
              >
                <Eye className="inline-block mr-2" size={16} /> View GST Reports
              </button>
           </div>
        </section>

      </div>
    </div>
  );
}
