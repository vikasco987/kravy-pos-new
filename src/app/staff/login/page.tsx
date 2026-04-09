"use client";

import React, { useState } from "react";
import { 
  Users, 
  Lock, 
  Mail, 
  Loader2, 
  ChevronRight, 
  ArrowLeft,
  ShieldCheck,
  Smartphone
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Welcome back, ${data.data.name}!`);
        // Store user info in localStorage for UI purposes (optional)
        localStorage.setItem("staff_user", JSON.stringify(data.data));
        
        // Redirect to their first allowed path, or dashboard if none
        const allowedPaths = data.data.permissions || [];
        const targetPath = allowedPaths.length > 0 ? allowedPaths[0] : "/dashboard";

        // Wait a bit for toast and then hard redirect to clear Clerk state
        setTimeout(() => {
            window.location.href = targetPath;
        }, 500);
      } else {
        toast.error(data.message || "Invalid credentials");
      }
    } catch (err) {
      toast.error("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      {/* Background purely aesthetic blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-100 blur-[100px] opacity-60" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-100 blur-[100px] opacity-60" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white shadow-xl border border-slate-100 text-indigo-600 mb-4">
            <Users size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff Terminal</h1>
          <p className="text-slate-500 font-medium mt-2">Enter your credentials to access the POS dashboard.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 md:p-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Work Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  required
                  type="email"
                  placeholder="name@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Security Code</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 group h-14"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Connect to Dashboard
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400">
               <div className="flex items-center gap-1">
                  <ShieldCheck size={14} className="text-green-500" />
                  <span>Secure Session</span>
               </div>
               <div className="flex items-center gap-1">
                  <Smartphone size={14} className="text-blue-500" />
                  <span>Mobile Compatible</span>
               </div>
            </div>
          </div>
        </div>

        <button 
            onClick={() => router.push("/")}
            className="w-full mt-8 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors group"
        >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
        </button>
      </motion.div>
    </div>
  );
}
