"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Download, 
  RefreshCw, 
  Mail, 
  Calendar,
  IndianRupee,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ChevronRight,
  History as HistoryIcon,
  Store,
  Settings as SettingsIcon,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Seller {
  clerkId: string;
  businessName: string;
  email: string;
  totalBills: number;
  totalRevenue: number;
  lastBill: string | null;
  status: "ACTIVE" | "INACTIVE";
}

interface Stats {
  totalMerchants: number;
  activeMerchants: number;
  inactiveMerchants: number;
  totalRevenue: number;
  totalBills: number;
}

export default function AdminMerchantsPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [trialDays, setTrialDays] = useState(3);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports/sellers");
      const data = await res.json();
      if (data.sellers) {
        setSellers(data.sellers);
        setStats(data.stats);
      }
    } catch (err) {
      toast.error("Failed to load merchant data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Fetch global settings
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        if (data.defaultTrialDays) setTrialDays(data.defaultTrialDays);
      });
  }, []);

  const saveGlobalSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify({ defaultTrialDays: trialDays })
      });
      if (res.ok) {
        toast.success("Global trial settings updated!");
        setShowSettings(false);
      } else {
        toast.error("Failed to update settings");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/reports/sellers/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Merchant_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("Excel report downloaded!");
      } else {
        toast.error("Export failed");
      }
    } catch (err) {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const filteredSellers = sellers.filter(s => 
    s.businessName.toLowerCase().includes(search.toLowerCase()) || 
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#1E293B] tracking-tight flex items-center gap-3">
            <Store className="text-[#4F46E5]" size={32} />
            Merchant <span className="text-[#4F46E5]">Ecosystem</span>
          </h1>
          <p className="text-slate-500 font-bold mt-1">Real-time business activity and merchant health tracking</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-600 shadow-sm"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-lg shadow-slate-900/20 transition-all"
          >
            <SettingsIcon size={18} />
            SAAS SETTINGS
          </button>
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            {exporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
            EXPORT EXCEL
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Businesses" 
          value={stats?.totalMerchants || 0} 
          icon={<Users size={24} />} 
          color="#4F46E5" 
          trend="Lifetime"
        />
        <StatCard 
          title="Active (7 Days)" 
          value={stats?.activeMerchants || 0} 
          icon={<Activity size={24} />} 
          color="#10B981" 
          trend={`${((stats?.activeMerchants || 0) / (stats?.totalMerchants || 1) * 100).toFixed(1)}% Usage`}
        />
        <StatCard 
          title="Total Global Sales" 
          value={`₹${stats?.totalRevenue.toLocaleString() || 0}`} 
          icon={<IndianRupee size={24} />} 
          color="#F59E0B" 
          trend="Across all POS"
        />
        <StatCard 
          title="Total Bills Printed" 
          value={stats?.totalBills || 0} 
          icon={<TrendingUp size={24} />} 
          color="#EF4444" 
          trend="Bill Volume"
        />
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Table Search & Filter Bar */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by business, email or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Showing {filteredSellers.length} Merchants
            </div>
          </div>
        </div>

        {/* Merchants Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-left">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Merchant</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Bill Count</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Sales</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Active</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : filteredSellers.map((seller) => (
                <tr key={seller.clerkId} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                        {seller.businessName[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-800">{seller.businessName}</div>
                        <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <Mail size={10} /> {seller.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {seller.status === "ACTIVE" ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase border border-emerald-100">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[10px] font-black uppercase border border-slate-100">
                        <XCircle size={12} /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-slate-700">{seller.totalBills.toLocaleString()}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoices</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-indigo-600">₹{seller.totalRevenue.toLocaleString()}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net GTV</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-600">
                      {seller.lastBill ? new Date(seller.lastBill).toLocaleDateString() : "Never"}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar size={10} /> {seller.lastBill ? new Date(seller.lastBill).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/admin/merchants/${seller.clerkId}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                    >
                      <HistoryIcon size={14} /> Full Ledger <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SaaS Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-slate-200"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Clock size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800">Global SaaS Settings</h2>
                <p className="text-xs text-slate-500 font-bold">Auto-lock configuration for new merchants</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Default Trial Period (Days)
                </label>
                <div className="flex items-center gap-4">
                  <input 
                    type="number" 
                    value={trialDays}
                    onChange={(e) => setTrialDays(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-black text-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <span className="text-slate-400 font-bold">Days</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 italic font-medium leading-relaxed">
                  * All new accounts will automatically see the premium popup after these many days from registration.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveGlobalSettings}
                  disabled={savingSettings}
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {savingSettings ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color, trend }: { title: string, value: any, icon: any, color: string, trend: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-lg shadow-slate-100/50 relative overflow-hidden group"
    >
      <div 
        className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all"
        style={{ color }}
      >
        {icon}
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
        >
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-lg bg-slate-50 text-[9px] font-black text-slate-500 border border-slate-100 uppercase tracking-tighter">
          {trend}
        </span>
      </div>
    </motion.div>
  );
}
