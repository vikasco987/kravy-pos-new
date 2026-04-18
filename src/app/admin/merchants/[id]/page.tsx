"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft,
  Calendar,
  IndianRupee,
  Receipt,
  History as HistoryIcon,
  Store,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  BarChart,
  ChevronRight,
  Clock,
  Printer
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

export default function MerchantDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/reports/sellers/${params.id}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse">Loading Merchant DNA...</p>
      </div>
    </div>
  );

  if (!data?.seller) return <div className="p-20 text-center font-black text-red-500">Merchant not found</div>;

  const { seller, stats, bills, timeline } = data;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Background Banner */}
      <div className="h-48 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute top-8 left-8">
           <Link href="/admin/merchants" className="flex items-center gap-2 text-white/80 hover:text-white font-bold transition-all">
             <ArrowLeft size={18} /> Back to Ecosystem
           </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-16 pb-20">
        
        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8 flex flex-col md:flex-row gap-8 mb-8 relative z-10">
          <div className="w-32 h-32 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-4xl font-black shadow-inner">
            {seller.businessName[0]}
          </div>
          
          <div className="flex-1">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">{seller.businessName}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6">
               <div className="flex items-center gap-2 text-slate-500 font-bold">
                 <Mail size={16} className="text-indigo-400" /> {seller.email}
               </div>
               <div className="flex items-center gap-2 text-slate-500 font-bold">
                 <Phone size={16} className="text-indigo-400" /> {seller.contactPhone || "No Phone"}
               </div>
               <div className="flex items-center gap-2 text-slate-500 font-bold">
                 <MapPin size={16} className="text-indigo-400" /> {seller.businessAddress || "No Address"}
               </div>
            </div>
          </div>

          <div className="flex flex-row md:flex-col justify-end gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total GTV</p>
                <p className="text-2xl font-black text-emerald-600">₹{stats.totalRevenue.toLocaleString()}</p>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bills</p>
                <p className="text-2xl font-black text-indigo-600">{stats.totalBills}</p>
             </div>
          </div>
        </div>

        {/* Charts & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
           {/* Activity Timeline Chart */}
           <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-lg shadow-slate-100/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <BarChart className="text-indigo-500" size={24} /> Activity Timeline
                </h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeline}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 800, color: '#1e293b' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Health Stats Card */}
           <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-500/20">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-white/10 rounded-full blur-3xl"></div>
              <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                <TrendingUp size={24} /> Merchant Health
              </h3>
              
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2 text-white/60">Target Achievement</div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-400 w-3/4 rounded-full"></div>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                       <p className="text-[10px] font-bold text-white/60 uppercase">Avg Bill Value</p>
                       <p className="text-xl font-black">₹{(stats.totalRevenue / (stats.totalBills || 1)).toFixed(0)}</p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                       <p className="text-[10px] font-bold text-white/60 uppercase">Consistency</p>
                       <p className="text-xl font-black">84%</p>
                    </div>
                 </div>

                 <div className="pt-4">
                    <p className="text-xs font-bold text-white/80 leading-relaxed italic">
                      "This merchant is highly active during weekends. Suggest focusing on weekday combos to increase consistency."
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Bill History Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
           <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <HistoryIcon className="text-indigo-500" size={28} /> Last 100 Invoices
              </h3>
              <div className="flex items-center gap-2">
                 <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                   Real-Time Ledger
                 </span>
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full">
                 <thead>
                    <tr className="text-left bg-slate-50/50">
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill #</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</th>
                       <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {bills.map((bill: any) => (
                      <tr key={bill.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-8 py-4">
                           <div className="text-sm font-black text-slate-700">#{bill.billNumber}</div>
                        </td>
                        <td className="px-8 py-4">
                           <div className="text-sm font-bold text-slate-600">{bill.customerName || "Walk-in"}</div>
                        </td>
                        <td className="px-8 py-4">
                           <div className="text-sm font-black text-indigo-600">₹{bill.total.toLocaleString()}</div>
                        </td>
                        <td className="px-8 py-4">
                           <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              bill.paymentMode === "CASH" ? "bg-orange-50 text-orange-600 border border-orange-100" :
                              bill.paymentMode === "UPI" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                              "bg-slate-50 text-slate-600 border border-slate-100"
                           }`}>
                              {bill.paymentMode}
                           </span>
                        </td>
                        <td className="px-8 py-4">
                           <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                              <Clock size={12} className="text-slate-400" /> {new Date(bill.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                           </div>
                        </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

      </div>
    </div>
  );
}
