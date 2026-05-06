"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Shield, Search, Filter, 
  ArrowLeft, RefreshCw, BarChart3, 
  CheckCircle2, XCircle, TrendingUp,
  Receipt, Zap, Activity, Globe,
  CreditCard, LayoutDashboard, Utensils,
  Eye, MoreVertical, Settings, Link2,
  Copy, Check, PieChart, Calendar,
  ExternalLink, ChevronRight, AlertCircle
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell
} from 'recharts';

type Seller = {
  id: string;
  name: string;
  email: string;
  clerkId: string;
  createdAt: string;
  isDisabled: boolean;
  businessName: string;
  billCount: number;
  totalRevenue: number;
  lastBillDate: string | null;
  features: {
    upi: boolean;
    qrMenu: boolean;
    tax: boolean;
    kot: boolean;
    ai: boolean;
    excel: boolean;
    slug: string | null;
    publicId: string | null;
  };
};

type SellerDetail = {
  seller: { name: string; email: string; createdAt: string };
  profile: any;
    totalBills: number;
    totalRevenue: number;
    avgTicketSize: number;
    trends: { date: string; count: number }[];
    paymentDistribution: { name: string; value: number }[];
    recentBills: { id: string; total: number; paymentMode: string; createdAt: string }[];
  };
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<{ stats: any; sellers: Seller[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Detail & Config State
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [sellerDetail, setSellerDetail] = useState<SellerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [updating, setUpdating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(7);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard-stats");
      if (!res.ok) throw new Error("Forbidden");
      const result = await res.json();
      setData(result);
    } catch (err) {
      toast.error("Failed to load platform data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerDetail = async (seller: Seller, days: number = timeRange) => {
    setSelectedSeller(seller);
    setNewSlug(seller.features.slug || "");
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/seller-detail?sellerId=${seller.clerkId}&days=${days}`);
      if (!res.ok) throw new Error();
      const result = await res.json();
      setSellerDetail(result);
    } catch (err) {
      toast.error("Could not fetch seller insights");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleTimeRangeChange = (days: 7 | 30 | 90) => {
    setTimeRange(days);
    if (selectedSeller) {
      fetchSellerDetail(selectedSeller, days);
    }
  };

  const updateConfig = async (action: "UPDATE_SLUG" | "REFRESH_PUBLIC_ID", payload?: any) => {
    if (!selectedSeller) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/dashboard-stats/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          targetUserId: selectedSeller.clerkId, 
          action,
          ...payload
        })
      });
      const result = await res.json();
      if (res.ok) {
        toast.success("Identity updated");
        fetchStats();
        if (action === "REFRESH_PUBLIC_ID") {
          setSellerDetail(prev => prev ? { ...prev, profile: { ...prev.profile, publicId: result.publicId } } : null);
        }
      } else {
        toast.error(result.error);
      }
    } finally {
      setUpdating(false);
    }
  };

  const filteredSellers = useMemo(() => {
    if (!data) return [];
    return data.sellers.filter(s => {
      const nameMatch = s.businessName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       s.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isActuallyActive = s.lastBillDate && (new Date().getTime() - new Date(s.lastBillDate).getTime()) < 24 * 60 * 60 * 1000;
      const statusMatch = statusFilter === "ALL" || 
                         (statusFilter === "ACTIVE" && isActuallyActive) ||
                         (statusFilter === "INACTIVE" && !isActuallyActive);

      return nameMatch && statusMatch;
    });
  }, [data, searchQuery, statusFilter]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="animate-spin text-indigo-600 w-12 h-12" />
        <p className="text-slate-400 font-black tracking-widest text-[10px] uppercase">Booting Intelligence...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em]">
               <Shield size={16} /> Admin Repository
            </div>
            <h1 className="text-6xl font-black text-slate-900 tracking-tight">System Funnel</h1>
            <p className="text-slate-500 font-medium max-w-xl">Centralized node for multi-tenant POS monitoring, seller activity audits, and system-wide scaling metrics.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard" className="px-8 py-4 bg-white border border-slate-200 rounded-3xl font-black text-xs text-slate-600 hover:bg-slate-50 transition-all shadow-sm">EXIT PORTAL</Link>
            <button onClick={fetchStats} className="px-8 py-4 bg-indigo-600 text-white rounded-3xl font-black text-xs shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all">REFRESH DATA</button>
          </div>
        </div>

        {/* TOP METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Total Vendors" value={data?.stats.totalSellers} icon={Users} color="indigo" />
          <StatCard label="Live Pulse" value={data?.stats.activeToday} icon={Activity} color="emerald" sub="Sellers billing today" pulse />
          <StatCard label="System Volume" value={data?.stats.totalBills} icon={Receipt} color="blue" sub="Total bills processed" />
          <StatCard label="Network GMV" value={`₹${data?.stats.totalRevenue.toLocaleString()}`} icon={TrendingUp} color="rose" />
        </div>

        {/* SELLER DIRECTORY */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Locate merchant via name, business, or credentials..."
                className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:bg-white focus:ring-4 focus:ring-indigo-600/5 transition-all font-medium text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select 
                className="flex-1 md:flex-none px-6 py-4 bg-slate-50 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="ALL">All States</option>
                <option value="ACTIVE">Active (24h)</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-2xl shadow-slate-200/50">
             <table className="w-full">
               <thead>
                 <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-10 py-6 text-left font-black text-[10px] text-slate-400 uppercase tracking-widest">Client Node</th>
                    <th className="px-10 py-6 text-center font-black text-[10px] text-slate-400 uppercase tracking-widest">Engagement</th>
                    <th className="px-10 py-6 text-center font-black text-[100px] text-slate-400 uppercase tracking-widest invisible">V</th>
                    <th className="px-10 py-6 text-center font-black text-[10px] text-slate-400 uppercase tracking-widest">Volume Metrics</th>
                    <th className="px-10 py-6 text-right font-black text-[10px] text-slate-400 uppercase tracking-widest">Status / Activity</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {filteredSellers.map(s => {
                    const isActive = s.lastBillDate && (Date.now() - new Date(s.lastBillDate).getTime()) < 24 * 60 * 60 * 1000;
                    return (
                      <tr key={s.id} onClick={() => fetchSellerDetail(s)} className="group cursor-pointer hover:bg-slate-50/80 transition-all">
                        <td className="px-10 py-8">
                           <div className="flex items-center gap-5">
                             <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                               {s.businessName[0]}
                             </div>
                             <div>
                               <div className="font-black text-slate-900 leading-tight flex items-center gap-2">
                                 {s.businessName}
                                 {s.features.slug && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black rounded uppercase tracking-wider">{s.features.slug}</span>}
                               </div>
                               <div className="text-[11px] font-bold text-slate-400 mt-0.5">{s.name} • {s.email}</div>
                             </div>
                           </div>
                        </td>
                        <td className="px-10 py-8 text-center">
                           <div className="flex items-center justify-center gap-1.5 bg-white border border-slate-100 px-4 py-2 rounded-xl shadow-sm inline-flex">
                              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                              <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {isActive ? 'Live Now' : 'Stationary'}
                              </span>
                           </div>
                        </td>
                        <td />
                        <td className="px-10 py-8 text-center">
                           <div className="font-black text-slate-900 text-xl">{s.billCount}</div>
                           <div className="text-[10px] font-bold text-indigo-600">₹{s.totalRevenue.toLocaleString()}</div>
                        </td>
                        <td className="px-10 py-8 text-right">
                           <div className="text-xs font-black text-slate-800">
                             {s.lastBillDate ? `Last: ${new Date(s.lastBillDate).toLocaleDateString()}` : 'No Transactions'}
                           </div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1 hover:text-indigo-600 transition-colors">
                              Click to analyze <ChevronRight size={10} className="inline ml-1" />
                           </div>
                        </td>
                      </tr>
                    )
                 })}
               </tbody>
             </table>
          </div>
        </div>
      </div>

      {/* SELLER INSIGHTS MODAL (Admin Only) */}
      <AnimatePresence>
        {selectedSeller && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setSelectedSeller(null); setSellerDetail(null); }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl h-full bg-white shadow-[-20px_0_60px_rgba(15,23,42,0.1)] flex flex-col pt-20"
            >
              {loadingDetail ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <RefreshCw className="animate-spin text-indigo-600" size={32} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Aggregating Merchant Data...</p>
                </div>
              ) : sellerDetail ? (
                <div className="flex-1 overflow-y-auto p-12 space-y-12">
                   {/* MODAL HEADER */}
                   <div className="flex justify-between items-start">
                     <div className="space-y-2">
                       <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{selectedSeller.businessName}</h2>
                       <div className="flex items-center gap-3">
                         <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-widest">{selectedSeller.clerkId}</span>
                         <span className="text-slate-400 font-bold text-xs">{sellerDetail.seller.email}</span>
                       </div>
                     </div>
                     <Link href={`/dashboard/billing/checkout?asUserId=${selectedSeller.clerkId}`} target="_blank" className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all">
                       <Eye size={20} />
                     </Link>
                   </div>

                   {/* PERFORMANCE STRIP */}
                   <div className="grid grid-cols-3 gap-6">
                      <div className="p-6 bg-slate-50 rounded-3xl space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total GTV</p>
                        <p className="text-2xl font-black text-slate-900">₹{sellerDetail.stats.totalRevenue.toLocaleString()}</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Bill</p>
                        <p className="text-2xl font-black text-slate-900">₹{Math.round(sellerDetail.stats.avgTicketSize)}</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retention</p>
                        <p className="text-2xl font-black text-emerald-600">{sellerDetail.stats.totalBills > 50 ? 'Strong' : 'Newborn'}</p>
                      </div>
                   </div>

                   {/* CHART SECTION */}
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <div className="space-y-1">
                           <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Activity Trend</h3>
                           <p className="text-[10px] font-bold text-slate-400">Transactions over selected period</p>
                         </div>
                         <div className="flex p-1 bg-slate-100 rounded-xl">
                            {[7, 30, 90].map((d) => (
                               <button 
                                 key={d} 
                                 onClick={() => handleTimeRangeChange(d as any)}
                                 className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${timeRange === d ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                               >
                                 {d}D
                               </button>
                            ))}
                         </div>
                      </div>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sellerDetail.stats.trends}>
                            <defs>
                              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                            <YAxis hide />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontSize: '10px', fontWeight: 900 }} />
                            <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                   </div>

                   {/* IDENTITY & CONFIG (ADMIN ONLY) */}
                   <div className="p-8 bg-indigo-50/50 border border-indigo-100 rounded-[32px] space-y-6">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <Settings size={16} />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em]">Merchant Configuration</h3>
                      </div>
                      
                      <div className="space-y-4">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Public Domain Slug</p>
                         <div className="flex gap-2">
                           <input 
                              type="text" 
                              value={newSlug} 
                              onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                              placeholder="e.g. creative-minds"
                              className="flex-1 px-5 py-3 bg-white border border-indigo-100 rounded-xl outline-none font-black text-xs text-indigo-600"
                           />
                           <button onClick={() => updateConfig("UPDATE_SLUG", { slug: newSlug })} disabled={updating} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all">
                             {updating ? 'Saving...' : 'Lock Slug'}
                           </button>
                         </div>
                      </div>

                      <div className="space-y-3 pt-4">
                         <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Public Fetch Key</p>
                            <button onClick={() => updateConfig("REFRESH_PUBLIC_ID")} className="text-[10px] font-black text-indigo-600 hover:underline">Regenerate</button>
                         </div>
                         <div className="p-4 bg-white border border-indigo-50 rounded-xl flex items-center justify-between">
                            <code className="text-[10px] font-mono font-bold text-slate-500">{sellerDetail.profile?.publicId || 'None'}</code>
                            <button onClick={() => { navigator.clipboard.writeText(sellerDetail.profile?.publicId || ''); toast.success("Copied Key") }} className="text-slate-400 hover:text-indigo-600 transition-colors"><Copy size={14} /></button>
                         </div>
                      </div>
                   </div>

                   {/* RECENT BILLS TABLE */}
                   <div className="space-y-6">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Real-time Stream (Recent 5)</h3>
                      <div className="space-y-3">
                         {sellerDetail.stats.recentBills.map(b => (
                           <div key={b.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm"><Receipt size={16} className="text-slate-400" /></div>
                                <div>
                                  <div className="font-black text-xs text-slate-900">₹{b.total}</div>
                                  <div className="text-[10px] font-bold text-slate-400">{new Date(b.createdAt).toLocaleTimeString()}</div>
                                </div>
                              </div>
                              <span className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black uppercase text-indigo-600 tracking-widest">{b.paymentMode}</span>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="pt-6">
                      <button 
                        onClick={() => { setSelectedSeller(null); setSellerDetail(null); }}
                        className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase text-xs tracking-[0.3em] hover:bg-slate-800 transition-all"
                      >
                         Dismiss Report
                      </button>
                   </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, sub, pulse = false }: any) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    rose: "bg-rose-50 text-rose-600"
  };

  return (
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden hover:shadow-xl hover:shadow-slate-200/40 transition-all cursor-default group">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 opacity-10 ${(colors as any)[color]}`} />
      <div className="relative space-y-5">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${(colors as any)[color]} group-hover:scale-110 transition-transform`}>
           <Icon size={24} className={pulse ? "animate-pulse" : ""} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
          <h3 className="text-4xl font-black text-slate-900 tracking-tighter mt-1">{value}</h3>
          {sub && <p className="text-[10px] font-bold text-slate-400 mt-2">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
