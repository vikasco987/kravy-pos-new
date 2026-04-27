"use client";

import React, { useEffect, useState } from "react";
import { 
  Ticket, 
  Calendar, 
  ChevronLeft, 
  BarChart3, 
  TrendingUp,
  Clock
} from "lucide-react";
import Link from "next/link";

export default function TokenHistoryPage() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/reports/tokens");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch token stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/reports/gst" 
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all text-slate-500"
            >
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Token Printing History</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Daily Token Consumption Report</p>
            </div>
          </div>
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Ticket size={20} />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-500">Generating report...</p>
          </div>
        ) : stats.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No Token Data Yet</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">Once you start printing bills with tokens, your daily history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4 text-emerald-600">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <TrendingUp size={18} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Latest Count</span>
                </div>
                <div className="text-3xl font-black text-slate-900">{stats[0]?.totalTokens || 0}</div>
                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Tokens on {stats[0]?.date}</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4 text-indigo-600">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <BarChart3 size={18} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Avg Daily</span>
                </div>
                <div className="text-3xl font-black text-slate-900">
                  {Math.round(stats.reduce((acc, curr) => acc + curr.totalTokens, 0) / stats.length)}
                </div>
                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Across last {stats.length} days</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4 text-amber-600">
                  <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Calendar size={18} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Best Day</span>
                </div>
                <div className="text-3xl font-black text-slate-900">
                  {Math.max(...stats.map(s => s.totalTokens))}
                </div>
                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Highest daily token peak</p>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Daily Breakdown</h3>
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase">Max Token Used</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total Orders</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Last Token No.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                              <Calendar size={14} />
                            </div>
                            <span className="font-black text-slate-700 text-sm">{row.date}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            {row.orders} Orders
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xl font-black text-slate-900">#{row.totalTokens}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
