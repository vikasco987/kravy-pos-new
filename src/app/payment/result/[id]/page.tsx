"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Download, 
  Printer, 
  Home, 
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function PaymentResultPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const id = params.id;
  const [status, setStatus] = useState("CHECKING");
  const [order, setOrder] = useState<any>(null);
  const router = useRouter();

  const invoiceUrl = `/api/invoice/${id}`;

  useEffect(() => {
    if (!id) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/phonepe/status/${id}`);
        const data = await res.json();
        
        if (data.status) {
          setStatus(data.status);
          if (data.order) setOrder(data.order);
        }

        if (data.status !== "PENDING" && data.status !== "CHECKING") {
          return true; // Stop polling
        }
      } catch (err) {
        console.error("Status check error:", err);
      }
      return false;
    };

    // Initial check
    checkStatus().then((done) => {
      if (done) return;

      const interval = setInterval(async () => {
        const isDone = await checkStatus();
        if (isDone) clearInterval(interval);
      }, 3000);

      return () => clearInterval(interval);
    });
  }, [id]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] flex flex-col items-center justify-center p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/5"
      >
        <div className="p-10 md:p-16">
          {/* Status Icon & Title */}
          <div className="text-center mb-12">
            {status === "CHECKING" || status === "PENDING" ? (
              <div className="flex flex-col items-center">
                <div className="relative mb-8">
                    <Loader2 className="w-20 h-20 text-indigo-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-full animate-pulse" />
                    </div>
                </div>
                <h1 className="text-3xl font-black dark:text-white tracking-tight">Verifying Payment...</h1>
                <p className="text-slate-400 mt-3 font-medium text-sm">Please do not refresh this page. We are confirming your transaction with PhonePe.</p>
              </div>
            ) : status === "SUCCESS" ? (
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 100 }}
                  className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-emerald-500/20"
                >
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </motion.div>
                <h1 className="text-4xl font-black dark:text-white tracking-tighter">Payment Successful</h1>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 rounded-full text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-[2px]">
                   Order Confirmed <Zap size={14} fill="currentColor" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-red-500/20">
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
                <h1 className="text-4xl font-black dark:text-white tracking-tighter">Payment Failed</h1>
                <p className="text-red-500 mt-3 font-bold uppercase tracking-widest text-[10px]">Something went wrong with the transaction</p>
              </div>
            )}
          </div>

          {/* Details Card */}
          {order && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-50 dark:bg-zinc-950 rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-8 mb-12 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-400">Transaction ID</label>
                  <p className="font-mono text-xs dark:text-neutral-200 truncate">{order.merchantOrderId}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-400">Invoice Number</label>
                  <p className="font-mono text-xs dark:text-neutral-200">{order.invoiceNumber || (status === "SUCCESS" ? "Generating..." : "N/A")}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-400">Amount Paid</label>
                  <p className="font-black text-neutral-900 dark:text-white text-3xl">₹{order.amount.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-400">Business</label>
                  <p className="font-bold text-neutral-800 dark:text-neutral-200 truncate">{order.customer.name}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-5">
            {status === "SUCCESS" ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Link
                    href={invoiceUrl}
                    className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-700 text-white transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-600/20 text-xs uppercase tracking-widest"
                  >
                    <Download size={18} />
                    Download Invoice
                  </Link>
                  <button
                    onClick={() => {
                      const win = window.open(invoiceUrl);
                      setTimeout(() => win?.print(), 500);
                    }}
                    className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-black border-2 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all dark:text-white transform hover:scale-[1.02] active:scale-95 text-xs uppercase tracking-widest"
                  >
                    <Printer size={18} />
                    Print Invoice
                  </button>
                </div>
                <a
                  href="https://billing.kravy.in/dashboard"
                  className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-black bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-all transform hover:scale-[1.01] shadow-2xl text-xs uppercase tracking-[3px]"
                >
                  Return to Dashboard
                  <ArrowRight size={18} />
                </a>
              </>
            ) : status === "FAILED" ? (
              <>
                <Link
                  href={`/checkout?retry=${id}`}
                  className="flex items-center justify-center gap-3 px-8 py-6 rounded-2xl font-black bg-red-600 hover:bg-red-700 text-white transition-all transform hover:scale-[1.02] shadow-xl shadow-red-500/20 text-xs uppercase tracking-[2px]"
                >
                  <ShoppingCart size={20} />
                  Try Payment Again
                </Link>
                <Link
                  href="/upgrade"
                  className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-black border-2 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all dark:text-white transform hover:scale-[1.01] text-xs uppercase tracking-[2px]"
                >
                  <Home size={18} />
                  Back to Plans
                </Link>
              </>
            ) : (
                <div className="h-20" />
            )}
          </div>
        </div>

        {/* Status Line */}
        <div className={`h-2 w-full transition-colors duration-1000 ${status === "SUCCESS" ? "bg-emerald-500" : status === "FAILED" ? "bg-red-500" : "bg-indigo-500"}`} />
      </motion.div>
      
      <div className="mt-12 flex items-center gap-6 opacity-30">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck size={14} /> PCI Compliant
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <CheckCircle2 size={14} /> Secured by PhonePe
        </div>
      </div>
    </div>
  );
}
