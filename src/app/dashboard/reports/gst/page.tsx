"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  ArrowRight, 
  ChevronRight, 
  Printer, 
  Filter,
  RefreshCcw,
  AlertCircle,
  TrendingUp,
  Receipt,
  PieChart,
  Grid,
  Check,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { toast } from "sonner";

type GSTReportData = {
  gstr1: any[];
  gstr3b: {
    taxable: number;
    cgst: number;
    sgst: number;
    totalGst: number;
  };
  hsnSummary: any[];
  dailyTax: any[];
};

export default function GSTReportPage() {
  const [activeTab, setActiveTab] = useState<"GSTR-1" | "GSTR-3B" | "HSN" | "Daily">("GSTR-1");
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GSTReportData | null>(null);
  const [gstEnabled, setGstEnabled] = useState<boolean | null>(null);
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "billNumber", "date", "customerName", "buyerGSTIN", "placeOfSupply", 
    "taxable", "cgst", "sgst", "igst", "grandTotal", "type"
  ]);

  const allColumns = [
    { key: "billNumber", label: "Invoice No" },
    { key: "date", label: "Date" },
    { key: "customerName", label: "Buyer Name" },
    { key: "buyerGSTIN", label: "Buyer GSTIN" },
    { key: "placeOfSupply", label: "Place of Supply" },
    { key: "taxable", label: "Taxable (₹)" },
    { key: "cgst", label: "CGST (₹)" },
    { key: "sgst", label: "SGST (₹)" },
    { key: "igst", label: "IGST (₹)" },
    { key: "grandTotal", label: "Total (₹)" },
    { key: "type", label: "Type" },
  ];

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => 
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    );
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/gst?startDate=${startDate}&endDate=${endDate}`);
      if (res.status === 403) {
        setGstEnabled(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch report");
      const result = await res.json();
      setData(result);
      setGstEnabled(true);
    } catch (err) {
      console.error(err);
      toast.error("Error loading GST report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const exportToCSV = (reportData: any[], filename: string) => {
    if (!reportData || reportData.length === 0) return;
    
    const headers = Object.keys(reportData[0]);
    const csvContent = [
      headers.join(","),
      ...reportData.map(row => headers.map(header => JSON.stringify(row[header])).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${startDate}_to_${endDate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (gstEnabled === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 text-rose-500">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-black text-[var(--kravy-text-primary)] mb-4">GST Not Enabled</h2>
        <p className="text-[var(--kravy-text-muted)] max-w-md mb-8 italic">
          GST Reports are only available when Tax Calculation is enabled in your Business Profile.
        </p>
        <button 
          onClick={() => window.location.href = "/dashboard/profile"}
          className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
        >
          Enable GST in Profile
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[var(--kravy-text-primary)] tracking-tight">
            GST <span className="text-indigo-600">Reports</span> Center
          </h1>
          <p className="text-sm text-[var(--kravy-text-muted)] italic mt-1 uppercase tracking-widest font-black opacity-60">
            Professional Tax Auditing & Filing Reports
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl px-4 py-2 gap-3 shadow-sm">
            <Calendar size={18} className="text-indigo-500" />
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-[var(--kravy-text-primary)]"
              />
              <ArrowRight size={14} className="text-[var(--kravy-text-muted)]" />
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-[var(--kravy-text-primary)]"
              />
            </div>
          </div>
          <button 
            onClick={() => {
              if (activeTab === "GSTR-1") exportToCSV(data?.gstr1 || [], "GSTR-1");
              if (activeTab === "HSN") exportToCSV(data?.hsnSummary || [], "HSN_Summary");
              if (activeTab === "Daily") exportToCSV(data?.dailyTax || [], "Daily_GST_Report");
              if (activeTab === "GSTR-3B") exportToCSV([data?.gstr3b], "GSTR-3B_Summary");
            }}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white dark:bg-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-200 dark:shadow-none"
          >
            <Download size={16} /> Export
          </button>

          {activeTab === "GSTR-1" && (
            <div className="relative">
              <button 
                onClick={() => setShowColumnToggle(!showColumnToggle)}
                className="flex items-center gap-2 px-4 py-3 bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-indigo-500 transition-all text-[var(--kravy-text-secondary)] shadow-sm"
              >
                <Settings size={14} className={showColumnToggle ? "animate-spin-slow rotate-45" : ""} />
                Columns
              </button>
              
              <AnimatePresence>
                {showColumnToggle && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-3xl shadow-2xl z-[60] p-4 overflow-hidden"
                  >
                    <div className="text-[9px] font-black uppercase tracking-widest text-[var(--kravy-text-muted)] mb-3 px-2 flex justify-between items-center">
                      Toggle Columns
                      <button onClick={() => setVisibleColumns(allColumns.map(c => c.key))} className="text-indigo-500 hover:underline">All</button>
                    </div>
                    <div className="space-y-1 max-h-[300px] overflow-y-auto no-scrollbar">
                      {allColumns.map(col => (
                        <button
                          key={col.key}
                          onClick={() => toggleColumn(col.key)}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all group"
                        >
                          <span className={`text-[11px] font-bold ${visibleColumns.includes(col.key) ? "text-indigo-500" : "text-[var(--kravy-text-muted)] group-hover:text-[var(--kravy-text-secondary)]"}`}>
                            {col.label}
                          </span>
                          {visibleColumns.includes(col.key) && <Check size={12} className="text-indigo-500" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar">
        {[
          { id: "GSTR-1", icon: <FileText size={16} />, label: "GSTR-1 (Invoices)" },
          { id: "GSTR-3B", icon: <TrendingUp size={16} />, label: "GSTR-3B (Summary)" },
          { id: "HSN", icon: <Grid size={16} />, label: "HSN Summary" },
          { id: "Daily", icon: <Receipt size={16} />, label: "Daily Tax" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shrink-0 border-2
              ${activeTab === tab.id 
                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20" 
                : "bg-[var(--kravy-surface)] text-[var(--kravy-text-muted)] border-[var(--kravy-border)] hover:border-indigo-600/30"}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[400px]"
          >
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--kravy-text-muted)] mt-6 animate-pulse">Calculating Tax Data...</p>
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-[32px] overflow-hidden shadow-2xl"
          >
            <div className="overflow-x-auto">
              {activeTab === "GSTR-1" && (
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="bg-[var(--kravy-bg)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--kravy-text-muted)] border-b border-[var(--kravy-border)]">
                      {allColumns.map(col => visibleColumns.includes(col.key) && (
                        <th key={col.key} className={`px-6 py-5 ${["taxable", "cgst", "sgst", "igst", "grandTotal"].includes(col.key) ? "text-right" : ""}`}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--kravy-border)]">
                    {data?.gstr1.map((bill, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/10 transition-all group border-b border-[var(--kravy-border)]/20 last:border-0">
                        {visibleColumns.includes("billNumber") && <td className="px-6 py-4 text-xs font-black text-[var(--kravy-text-primary)]">{bill.billNumber}</td>}
                        {visibleColumns.includes("date") && <td className="px-6 py-4 text-[11px] font-bold text-[var(--kravy-text-muted)] whitespace-nowrap">{format(new Date(bill.date), "dd/MM/yyyy")}</td>}
                        {visibleColumns.includes("customerName") && <td className="px-6 py-4 text-xs font-bold text-[var(--kravy-text-secondary)]">{bill.customerName}</td>}
                        {visibleColumns.includes("buyerGSTIN") && <td className="px-6 py-4 text-xs font-mono font-bold text-indigo-500">{bill.buyerGSTIN}</td>}
                        {visibleColumns.includes("placeOfSupply") && <td className="px-6 py-4 text-xs font-bold text-[var(--kravy-text-muted)] whitespace-nowrap">{bill.placeOfSupply}</td>}
                        {visibleColumns.includes("taxable") && <td className="px-6 py-4 text-xs font-bold text-right">₹{bill.taxable.toFixed(2)}</td>}
                        {visibleColumns.includes("cgst") && <td className="px-6 py-4 text-xs font-bold text-right text-indigo-600/70">₹{bill.cgst.toFixed(2)}</td>}
                        {visibleColumns.includes("sgst") && <td className="px-6 py-4 text-xs font-bold text-right text-emerald-600/70">₹{bill.sgst.toFixed(2)}</td>}
                        {visibleColumns.includes("igst") && <td className="px-6 py-4 text-xs font-bold text-right text-rose-600/70">₹{bill.igst.toFixed(2)}</td>}
                        {visibleColumns.includes("grandTotal") && <td className="px-6 py-4 text-sm font-black text-right text-[var(--kravy-text-primary)]">₹{bill.grandTotal.toFixed(2)}</td>}
                        {visibleColumns.includes("type") && (
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${bill.type === "B2B" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-100 dark:bg-white/10 text-[var(--kravy-text-muted)]"}`}>
                              {bill.type}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === "GSTR-3B" && data && (
                <div className="p-10 space-y-12">
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {[
                        { label: "Total Taxable", value: data.gstr3b.taxable, color: "indigo" },
                        { label: "CGST", value: data.gstr3b.cgst, color: "emerald" },
                        { label: "SGST", value: data.gstr3b.sgst, color: "emerald" },
                        { label: "Total GST", value: data.gstr3b.totalGst, color: "rose" },
                      ].map((card, i) => (
                        <div key={i} className={`p-8 rounded-3xl bg-${card.color}-500/5 border border-${card.color}-500/20`}>
                           <div className="text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-muted)] mb-3">{card.label}</div>
                           <div className={`text-3xl font-black text-${card.color}-600 tracking-tighter`}>₹{card.value.toFixed(2)}</div>
                        </div>
                      ))}
                   </div>

                   <div className="bg-[var(--kravy-bg)] rounded-[2rem] p-10 border border-[var(--kravy-border)] space-y-6">
                      <h3 className="text-xl font-black text-[var(--kravy-text-primary)] leading-none mb-4">Summary Conclusion</h3>
                      <div className="grid md:grid-cols-2 gap-10">
                         <div className="space-y-4">
                            <p className="text-sm font-medium text-[var(--kravy-text-muted)] leading-relaxed underline decoration-indigo-500/30 decoration-4 underline-offset-4">
                               During this period, you generated a total taxable value of <span className="text-[var(--kravy-text-primary)] font-black">₹{data.gstr3b.taxable.toFixed(2)}</span> with a net GST liability of <span className="text-[var(--kravy-text-primary)] font-black">₹{data.gstr3b.totalGst.toFixed(2)}</span>.
                            </p>
                            <div className="p-6 bg-white dark:bg-black/20 rounded-2xl border border-[var(--kravy-border)]">
                               <div className="text-[10px] font-black uppercase text-[var(--kravy-text-muted)] mb-4">Tax Division (50/50 Internal split)</div>
                               <div className="flex items-center gap-6">
                                  <div className="flex-1">
                                     <div className="h-2 bg-indigo-500 rounded-full" style={{ width: '100%' }}></div>
                                     <div className="mt-2 text-[10px] font-bold">CENTRAL (CGST): ₹{data.gstr3b.cgst.toFixed(2)}</div>
                                  </div>
                                  <div className="flex-1">
                                     <div className="h-2 bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                                     <div className="mt-2 text-[10px] font-bold">STATE (SGST): ₹{data.gstr3b.sgst.toFixed(2)}</div>
                                  </div>
                               </div>
                            </div>
                         </div>
                         <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
                            <Receipt size={100} className="absolute -bottom-4 -right-4 opacity-10" />
                            <h4 className="text-lg font-black mb-2">Ready for Filing?</h4>
                            <p className="text-sm font-medium text-white/70 mb-6 italic">You can export this summary as a CSV and send it directly to your CA for 3B filing.</p>
                            <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-white/10 active:scale-95 transition-all">
                               Download Summary PDF
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === "HSN" && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--kravy-bg)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--kravy-text-muted)] border-b border-[var(--kravy-border)]">
                      <th className="px-6 py-5">HSN / SAC Code</th>
                      <th className="px-6 py-5 text-center">Total Qty sold</th>
                      <th className="px-6 py-5 text-right">Taxable Value</th>
                      <th className="px-6 py-5 text-right">CGST</th>
                      <th className="px-6 py-5 text-right">SGST</th>
                      <th className="px-6 py-5 text-right font-black text-indigo-600">Total GST</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--kravy-border)]">
                    {data?.hsnSummary.map((hsn, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/10 transition-all">
                        <td className="px-6 py-4 text-xs font-black text-[var(--kravy-text-primary)]">Code: {hsn.hsn}</td>
                        <td className="px-6 py-4 text-xs font-bold text-center">{hsn.qty}</td>
                        <td className="px-6 py-4 text-xs font-bold text-right">₹{hsn.taxable.toFixed(2)}</td>
                        <td className="px-6 py-4 text-xs font-bold text-right">₹{hsn.cgst.toFixed(2)}</td>
                        <td className="px-6 py-4 text-xs font-bold text-right">₹{hsn.sgst.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm font-black text-right text-indigo-600">₹{hsn.totalGst.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === "Daily" && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--kravy-bg)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--kravy-text-muted)] border-b border-[var(--kravy-border)]">
                      <th className="px-6 py-5">Accounting Date</th>
                      <th className="px-6 py-5 text-center">Bills Generated</th>
                      <th className="px-6 py-5 text-right">Daily Sales (Gross)</th>
                      <th className="px-6 py-5 text-right">Taxable Amount</th>
                      <th className="px-6 py-5 text-right font-black text-emerald-500">Daily GST</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--kravy-border)]">
                    {data?.dailyTax.map((day, idx) => (
                      <tr key={idx} className="hover:bg-emerald-50/10 transition-all">
                        <td className="px-6 py-4 text-xs font-black text-[var(--kravy-text-primary)]">{format(new Date(day.date), "dd MMMM yyyy")}</td>
                        <td className="px-6 py-4 text-xs font-bold text-center">
                          <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-lg border border-[var(--kravy-border)]">
                            {day.bills} Invoices
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-right">₹{day.gross.toFixed(2)}</td>
                        <td className="px-6 py-4 text-xs font-bold text-right">₹{day.taxable.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm font-black text-right text-emerald-600">₹{day.totalGst.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {(!data || (activeTab === "GSTR-1" && data.gstr1.length === 0) || (activeTab === "HSN" && data.hsnSummary.length === 0) || (activeTab === "Daily" && data.dailyTax.length === 0)) && (
               <div className="p-32 flex flex-col items-center justify-center text-center">
                  <PieChart size={64} className="text-slate-100 dark:text-white/5 mb-6" />
                  <div className="text-xl font-black text-[var(--kravy-text-muted)] uppercase tracking-widest italic opacity-50">No Data Found for this Range</div>
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
