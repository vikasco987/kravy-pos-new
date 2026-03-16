"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  User,
  Terminal,
  Clock,
  History,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Search
} from "lucide-react";

type Log = {
  id: string;
  action: string;
  meta?: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
};

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastTimeRef = useRef<string | null>(null);

  const fetchLogs = async (isInitial = false) => {
    if (!isInitial) setIsRefreshing(true);
    try {
      const url = lastTimeRef.current
        ? `/api/admin/activity?since=${lastTimeRef.current}`
        : "/api/admin/activity";

      const res = await fetch(url);
      if (!res.ok) throw new Error("Forbidden");

      const data: Log[] = await res.json();

      if (data.length > 0) {
        lastTimeRef.current = data[0].createdAt;
        setLogs((prev) => [...data, ...prev]);
        if (!isInitial) toast.success(`New activity detected`, { duration: 2000 });
      }
    } catch (err) {
      if (isInitial) toast.error("Access denied");
    } finally {
      if (isInitial) setLoading(false);
      setIsRefreshing(false);
    }
  };

  /* initial load */
  useEffect(() => {
    fetchLogs(true);
  }, []);

  /* 🔁 realtime polling */
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs().catch(() => { });
    }, 10000); // every 10 seconds for better performance

    return () => clearInterval(interval);
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes("DELETE")) return "text-red-500 bg-red-500/10 border-red-500/20";
    if (action.includes("UPDATE") || action.includes("EDIT")) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    if (action.includes("CREATE") || action.includes("ADD")) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    return "text-indigo-500 bg-indigo-500/10 border-indigo-500/20 text-blue-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
            <RefreshCw className="w-10 h-10 text-indigo-600" />
          </motion.div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Synchronizing Logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                <Activity className="w-6 h-6" />
              </div>
              Activity Pulse
            </h1>
            <p className="text-slate-500 font-medium text-lg flex items-center gap-2">
              Real-time system monitoring <Clock className="w-4 h-4 animate-pulse text-rose-500" />
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <div className={`w-2 h-2 rounded-full ${isRefreshing ? "bg-amber-500 animate-ping" : "bg-emerald-500"}`} />
              {isRefreshing ? "Polling..." : "Stream Live"}
            </div>
            <button
              onClick={() => fetchLogs()}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Quick Stats Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Pulse Strength", value: "99.9%", icon: Activity, color: "text-emerald-500" },
            { label: "Active Sessions", value: logs.length.toString(), icon: User, color: "text-blue-500" },
            { label: "Alert Level", value: "Normal", icon: AlertCircle, color: "text-indigo-500" }
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-slate-200 p-5 rounded-3xl flex items-center gap-4 shadow-sm">
              <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${stat.color} border border-slate-100`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Feed */}
        <div className="bg-white border border-slate-200 rounded-[40px] shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Operator</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Operation</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Descriptor</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {logs.map((l, i) => (
                    <motion.tr
                      initial={i < 5 ? { opacity: 0, x: -20 } : false}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={l.id}
                      className="group hover:bg-slate-50/50 transition-all cursor-default"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-xs shadow-md">
                            {l.user.name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-sm text-slate-900 truncate">{l.user.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                              {l.user.email} <span className="opacity-30">•</span> {l.user.role}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getActionColor(l.action)}`}>
                          {l.action.includes("CREATE") ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Terminal className="w-2.5 h-2.5" />}
                          {l.action}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-semibold text-slate-500 group-hover:text-slate-900 transition-colors max-w-xs truncate italic">
                          {l.meta || "—"}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-[11px] font-black text-slate-900 whitespace-nowrap flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-300" />
                          {new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          <span className="text-slate-200 ml-1 font-medium">{new Date(l.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {logs.length === 0 && (
              <div className="p-20 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-4xl grayscale opacity-30">🗂️</div>
                <h3 className="text-lg font-black text-slate-400">No system events detected yet</h3>
                <p className="text-sm font-medium text-slate-300">Activity logs will populate here once system operations occur.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
            Pulse System Version 2.0.4.Beta
          </p>
        </div>

      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}