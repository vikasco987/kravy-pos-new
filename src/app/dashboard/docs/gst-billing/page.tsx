"use client";

import React from "react";
import { 
  ShieldCheck, 
  FileText, 
  Settings, 
  ShoppingBag, 
  ArrowRight, 
  CheckCircle2, 
  Info,
  Zap,
  Layout,
  Receipt,
  Share2,
  Calculator,
  Percent,
  Hash,
  HelpCircle,
  Eye,
  Check,
  BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function GSTBillingDocsPage() {
  const router = useRouter();

  const sections = [
    {
      title: "1. GST aur HSN Enable Kaise Karein?",
      icon: <Settings className="text-indigo-500" size={24} />,
      content: "Sabse pehle aapko settings se GST aur HSN options ko on karna hoga taaki wo bill par dikhe.",
      hinglish: "Udaharan: Dashboard > Profile mein jaiye. Wahan 'Enable Tax' ko ON karein aur 'Enable HSN on Bill' checkbox ko tick karein. Isse calculate kiya gaya Tax aur HSN code bill par print hona shuru ho jayega.",
      points: [
        "Global Toggle: Ek click mein pura GST system on ya off karein.",
        "HSN Option: Agar aap HSN code nahi dikhana chahte, to use yahan se band kar sakte hain.",
        "Automatic Sync: Settings save karte hi billing system update ho jata hai."
      ]
    },
    {
      title: "2. Items mein HSN Code kaise dalein?",
      icon: <Hash className="text-orange-500" size={24} />,
      content: "Har product ka apna ek HSN code hota hai. Aap ise do jagah se add kar sakte hain.",
      hinglish: "Browse Products (Menu View) mein edit modal kholiye, wahan GST % select kijiye aur HSN/SAC Code box mein code (jaise: 9963) likh diye. Aap Inventory section se bhi ise update kar sakte hain.",
      points: [
        "Quick Edit: Menu Hub se turant bina page refresh kiye update karein.",
        "Tax Selection: GST 5%, 12%, 18%, ya 28% categories mein se select karein.",
        "Flexible HSN: Agar kisi item ka HSN nahi hai, to use khali chod dein."
      ]
    },
    {
      title: "3. Profesionally Designed Smart Bill",
      icon: <Receipt className="text-emerald-500" size={24} />,
      content: "Naya bill design ab industry standards ke mutabik hai, jisme tax breakup aur words mein total amount dikhta hai.",
      hinglish: "Bill par ab har item ke neeche uska GST % aur HSN code dikhta hai. Niche ek 'GST TAX BREAKUP' table hoti hai jo sarkari rules ke hisab se CGST aur SGST ko alag-alag dikhati hai.",
      points: [
        "Tax Breakup Table: Detailed calculation jo customer aur CA dono ke liye easy ho.",
        "Amount in Words: Auto-generated words (e.g. Five Hundred Rupees Only).",
        "Multi-Tax Support: Ek hi bill mein alag-alag GST rate wale items support hote hain."
      ]
    },
    {
      title: "4. Powerful GST Reports (CA Ready)",
      icon: <BarChart3 className="text-violet-500" size={24} />,
      content: "Month end par ab reports ke liye pareshaan hone ki zaroorat nahi. Saari reports 1-click mein ready hain.",
      hinglish: "Reports > GST Reports section mein jaiye. Wahan aapko GSTR-1, GSTR-3B Summary, aur HSN Summary mil jayegi. Aap use Excel mein download karke seedhe apne CA ko bhej sakte hain.",
      points: [
        "GSTR-1: Invoice-wise details filing ke liye.",
        "GSTR-3B: Monthly tax summary matching ke liye.",
        "HSN Summary: HSN code ke mutabik kitna maal bika.",
        "Daily Tax: Rozana kitna tax jama ho raha hai."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header Section */}
        <header className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-200"
          >
            <ShieldCheck size={14} /> New Billing Feature
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">
              GST & HSN <span className="text-emerald-600">Billing Guide</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-3xl leading-relaxed italic">
              Kravy POS mein smart GST billing setup karein aur apne customers ko professional bills dein.
            </p>
          </div>
        </header>

        {/* Quick Summary Section */}
        <div className="grid lg:grid-cols-2 gap-10">
           <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                <Calculator size={120} />
              </div>
              
              <h2 className="text-3xl font-black mb-6 flex items-center gap-4">
                 <Zap className="text-emerald-400" />
                 Smart Tax Engine
              </h2>
              
              <p className="text-slate-400 font-medium mb-8 leading-relaxed">
                 Hamaara naya tax engine 'Inclusive' (with tax) aur 'Exclusive' (without tax) dono calculations ko item-wise handle karta hai. Iska matlab calculation hamesha accurate rahegi.
              </p>

              <div className="space-y-6">
                 <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                    <div className="text-xs font-black uppercase text-emerald-400 mb-2">Setup Karne ka Tareeka</div>
                    <ol className="space-y-3 text-sm font-bold">
                       <li className="flex gap-3"><span className="text-white/30">01</span> Profile se GST aur HSN options ON karein.</li>
                       <li className="flex gap-3"><span className="text-white/30">02</span> Products mein Tax Rate aur HSN code bharein.</li>
                       <li className="flex gap-3"><span className="text-white/30">03</span> Billing checkout mein items add karein.</li>
                       <li className="flex gap-3"><span className="text-white/30">04</span> Bill Print/Preview mein Smart Breakdown dekhein.</li>
                    </ol>
                 </div>
                 
                 <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <Info className="text-emerald-400 shrink-0" size={20} />
                    <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-tight">
                      CA NOTE: Naya bill structure GST compliance ke saare basic rules ko follow karta hai, jisse accounting mein help milti hai.
                    </p>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 flex flex-col justify-center shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                <Receipt size={150} />
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-6 flex items-center gap-4">
                 <Eye className="text-indigo-500" />
                 Bill Preview Details
              </h2>
              <div className="space-y-6 text-slate-600">
                 <p className="font-bold text-lg leading-relaxed">
                   Jab aap bill print karenge, to ye advanced details automatic dikhengi:
                 </p>
                 <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                       <div>
                          <div className="text-[10px] font-black uppercase text-emerald-500 mb-1">Item-wise detail</div>
                          <div className="text-sm font-black text-slate-900">Name + Price + GST % + HSN Code</div>
                       </div>
                       <Check className="text-emerald-500" size={20} />
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                       <div>
                          <div className="text-[10px] font-black uppercase text-indigo-500 mb-1">Tax Table</div>
                          <div className="text-sm font-black text-slate-900">Taxable Amt, CGST (Half), SGST (Half)</div>
                       </div>
                       <Check className="text-indigo-500" size={20} />
                    </div>
                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between">
                       <div>
                          <div className="text-[10px] font-black uppercase text-orange-500 mb-1">Amount Words</div>
                          <div className="text-sm font-black text-slate-900">Example: "One Hundred and Twelve Rupees Only"</div>
                       </div>
                       <Check className="text-orange-500" size={20} />
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Detailed Sections Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {sections.map((section, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm hover:shadow-2xl transition-all group"
            >
              <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-500">
                 {section.icon}
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">{section.title}</h3>
              <p className="text-sm text-slate-500 font-medium mb-4 leading-relaxed">
                {section.content}
              </p>
              <div className="p-4 bg-emerald-50/50 rounded-2xl mb-8">
                 <div className="text-[10px] font-black uppercase text-emerald-400 mb-2">Udaharan kaisa dikhega?</div>
                 <p className="text-xs text-emerald-900 font-bold leading-relaxed">{section.hinglish}</p>
              </div>
              <ul className="space-y-4">
                 {section.points.map((pt, j) => (
                    <li key={j} className="flex items-start gap-3 text-[11px] font-black text-slate-700 leading-tight">
                       <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                       {pt}
                    </li>
                 ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Documentation Footer */}
        <footer className="pt-20 pb-10 flex flex-col items-center text-center space-y-8 border-t border-slate-200">
           <div className="w-16 h-16 rounded-[2rem] bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-200">
              <ShieldCheck size={32} />
           </div>
           <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">Sab kuch set ho gaya?</h3>
              <p className="text-slate-500 font-medium">Abhi jaake settings badlein aur apne business ko naya GST look dein!</p>
           </div>
           <div className="flex gap-4">
              <button 
                onClick={() => router.push("/dashboard/profile")} 
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-slate-200 group flex items-center gap-2 hover:bg-emerald-700 transition-all active:scale-95"
              >
                Go to Profile Settings <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => router.push("/dashboard/help")} 
                className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <HelpCircle size={14} /> Back to Help
              </button>
           </div>
        </footer>

      </div>
    </div>
  );
}
