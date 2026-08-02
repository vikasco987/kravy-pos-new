"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  ShieldCheck,
  Lock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PlusCircle,
  FileText,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  Calendar,
  Briefcase,
  Award,
  Trash2,
  X,
  Sparkles,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard
} from "lucide-react";
import Link from "next/link";
import { kravy } from "@/lib/sounds";

export default function StaffProfitLossReportPage() {
  const [loading, setLoading] = useState(true);
  const [isMaster, setIsMaster] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [summary, setSummary] = useState<any>({
    totalStaff: 0,
    totalBusinessRevenue: 0,
    totalStaffExpenses: 0,
    totalNetBusinessProfit: 0
  });

  const [staffList, setStaffList] = useState<any[]>([]);
  const [staffReportList, setStaffReportList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal States for Adding Staff Expense
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [selectedStaffForExpense, setSelectedStaffForExpense] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("SALARY");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNote, setExpenseNote] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State for Viewing Detailed Expenses
  const [viewingStaffExpenses, setViewingStaffExpenses] = useState<any | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/staff-pnl");
      if (res.status === 403) {
        setIsMaster(false);
        setErrorMessage("Access Denied. This report is strictly restricted to Masters & Owners.");
        return;
      }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch staff report");
      }
      const data = await res.json();
      if (data.success) {
        setIsMaster(true);
        setSummary(data.summary || {});
        setStaffList(data.staffList || []);
        setStaffReportList(data.staffReportList || []);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    const today = new Date().toISOString().split("T")[0];
    setExpenseDate(today);
  }, []);

  const handleOpenAddExpense = (staffId?: string) => {
    kravy.click();
    if (staffId) {
      setSelectedStaffForExpense(staffId);
    } else if (staffList.length > 0) {
      setSelectedStaffForExpense(staffList[0].id);
    }
    setShowAddExpenseModal(true);
  };

  const handleCreateExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForExpense || !expenseAmount || parseFloat(expenseAmount) <= 0) {
      alert("Please select a staff member and enter a valid amount!");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedStaffObj = staffList.find(s => s.id === selectedStaffForExpense);

      const res = await fetch("/api/reports/staff-pnl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: selectedStaffForExpense,
          staffName: selectedStaffObj ? selectedStaffObj.name : "Staff Member",
          category: expenseCategory,
          amount: parseFloat(expenseAmount),
          note: expenseNote,
          date: expenseDate
        })
      });

      if (res.ok) {
        kravy.success();
        setShowAddExpenseModal(false);
        setExpenseAmount("");
        setExpenseNote("");
        fetchReport();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to add expense");
      }
    } catch (err: any) {
      alert("Error adding expense: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense entry?")) return;

    try {
      const res = await fetch(`/api/reports/staff-pnl?id=${expenseId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        kravy.click();
        if (viewingStaffExpenses) {
          setViewingStaffExpenses((prev: any) => ({
            ...prev,
            expensesList: prev.expensesList.filter((e: any) => e.id !== expenseId)
          }));
        }
        fetchReport();
      }
    } catch (err) {}
  };

  const format = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n || 0));

  // Filtered Staff List
  const filteredStaffReports = staffReportList.filter(sp => {
    const matchesSearch =
      sp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sp.email && sp.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sp.role && sp.role.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "SURPLUS" && sp.netProfit >= 0) ||
      (statusFilter === "DEFICIT" && sp.netProfit < 0);

    return matchesSearch && matchesStatus;
  });

  if (!isMaster) {
    return (
      <div className="min-h-screen p-8 bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto text-3xl border border-rose-500/20">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black text-white">Master Access Restricted</h2>
          <p className="text-sm text-slate-400 font-medium leading-relaxed">
            {errorMessage || "The Staff Task Profitability & Expense Report is strictly restricted to Masters and Business Owners."}
          </p>
          <div className="pt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl transition-all shadow-lg shadow-indigo-600/30"
            >
              <ChevronLeft size={16} /> Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-950 text-slate-100 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center border border-slate-700 transition-all"
            >
              <ChevronLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  Staff Task Profit & Loss Audit
                </h1>
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-full flex items-center gap-1">
                  <ShieldCheck size={12} /> Master Only Report
                </span>
              </div>
              <p className="text-xs md:text-sm font-medium text-slate-400 mt-1">
                Track staff task revenue generation, direct task profits, salary & incentive expenses, and net ROI per employee.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenAddExpense()}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
            >
              <PlusCircle size={16} />
              + Add Salary / Incentive Expense
            </button>
            <button
              onClick={fetchReport}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title="Refresh Report"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* METRICS STATS SUMMARY */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xl border border-blue-500/20">
              👥
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Staff</p>
              <p className="text-2xl font-black text-white mt-0.5">{summary.totalStaff || 0}</p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/80 border border-indigo-500/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-500/20">
              💼
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Task Revenue</p>
              <p className="text-2xl font-black text-white mt-0.5">₹{format(summary.totalBusinessRevenue)}</p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/80 border border-amber-500/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xl border border-amber-500/20">
              💳
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Staff Expenses Paid</p>
              <p className="text-2xl font-black text-white mt-0.5">₹{format(summary.totalStaffExpenses)}</p>
            </div>
          </div>

          <div className={`p-5 rounded-3xl border flex items-center gap-4 transition-all ${
            summary.totalNetBusinessProfit >= 0
              ? "bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20"
              : "bg-slate-900/90 border-rose-500/40 shadow-lg shadow-rose-950/20"
          }`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl border ${
              summary.totalNetBusinessProfit >= 0
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}>
              {summary.totalNetBusinessProfit >= 0 ? "📈" : "📉"}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Staff PnL</p>
              <p className={`text-2xl font-black mt-0.5 ${
                summary.totalNetBusinessProfit >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}>
                ₹{format(summary.totalNetBusinessProfit)}
              </p>
            </div>
          </div>
        </div>

        {/* SEARCH & STATUS FILTER BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search Staff Name, Role, Email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-indigo-500 font-medium transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800">
              {[
                { id: "ALL", label: "All Staff" },
                { id: "SURPLUS", label: "🟢 Net Profitable" },
                { id: "DEFICIT", label: "🔴 Net Deficit" }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    statusFilter === st.id
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* STAFF PROFITABILITY LEDGER TABLE */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Staff Task Profitability Matrix</h3>
              <p className="text-xs text-slate-400 mt-0.5">Calculated as: Task Gross Profit - Staff Expenses (Salary/Incentive/Travel)</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-slate-800 border border-slate-700 text-indigo-300 rounded-xl">
              {filteredStaffReports.length} Staff Records
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 font-bold animate-pulse text-xs">
              Calculating Staff Task Revenues & Expenses...
            </div>
          ) : filteredStaffReports.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-bold text-sm">
              No staff records match the filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-4 px-6">Staff Member</th>
                    <th className="py-4 px-4 text-center">Tasks Handled</th>
                    <th className="py-4 px-4 text-right">Task Revenue (₹)</th>
                    <th className="py-4 px-4 text-right">Gross Task Profit (₹)</th>
                    <th className="py-4 px-4 text-right">Staff Expenses (₹)</th>
                    <th className="py-4 px-4 text-right">Net Profit / Loss (₹)</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredStaffReports.map(sp => {
                    const isNetProfit = sp.netProfit >= 0;

                    return (
                      <tr key={sp.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-sm">
                              {sp.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-white text-sm">{sp.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {sp.role} • {sp.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center font-black text-slate-300">
                          <span className="px-2.5 py-1 bg-slate-800 rounded-lg text-xs border border-slate-700">
                            {sp.totalTasks} Tasks
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right font-black text-indigo-400">
                          ₹{format(sp.totalRevenue)}
                        </td>

                        <td className="py-4 px-4 text-right font-black text-emerald-400">
                          ₹{format(sp.grossProfit)}
                        </td>

                        <td className="py-4 px-4 text-right font-bold text-amber-400">
                          ₹{format(sp.staffExpensesAmount)}
                        </td>

                        <td className={`py-4 px-4 text-right font-black text-sm ${
                          isNetProfit ? "text-emerald-400" : "text-rose-400"
                        }`}>
                          {isNetProfit ? "+" : ""}₹{format(sp.netProfit)}
                        </td>

                        <td className="py-4 px-6 text-center">
                          <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                            isNetProfit
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          }`}>
                            {isNetProfit ? "🟢 Surplus" : "🔴 Deficit"}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenAddExpense(sp.id)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl transition-all shadow-sm"
                              title="Add Expense for this Staff"
                            >
                              + Expense
                            </button>
                            <button
                              onClick={() => setViewingStaffExpenses(sp)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded-xl border border-slate-700 transition-all"
                              title="View Logged Expenses"
                            >
                              Details ({sp.expensesList?.length || 0})
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ADD STAFF EXPENSE MODAL */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddExpenseModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl">
                💳
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Add Staff Expense</h3>
                <p className="text-xs text-slate-400">Record Salary, Incentive, Travel, or Bonus</p>
              </div>
            </div>

            <form onSubmit={handleCreateExpenseSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Select Staff Member *
                </label>
                <select
                  value={selectedStaffForExpense}
                  onChange={e => setSelectedStaffForExpense(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
                  required
                >
                  {staffList.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Expense Category
                </label>
                <select
                  value={expenseCategory}
                  onChange={e => setExpenseCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
                >
                  <option value="SALARY">Salary Payment</option>
                  <option value="INCENTIVE">Incentive / Commission</option>
                  <option value="TRAVEL">Travel / Conveyance</option>
                  <option value="BONUS">Bonus / Reward</option>
                  <option value="REFRESHMENT">Refreshment / Food</option>
                  <option value="OTHER">Other Expense</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Amount Paid (₹) *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-emerald-400 rounded-xl px-3 py-2.5 text-sm font-black outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Notes / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. July month salary payout"
                  value={expenseNote}
                  onChange={e => setExpenseNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs font-medium outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg"
                >
                  {isSubmitting ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW LOGGED EXPENSES DETAILS MODAL */}
      {viewingStaffExpenses && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setViewingStaffExpenses(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                💳
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {viewingStaffExpenses.name} Expense History
                </h3>
                <p className="text-xs text-slate-400">Total Expenses: ₹{format(viewingStaffExpenses.staffExpensesAmount)}</p>
              </div>
            </div>

            {viewingStaffExpenses.expensesList?.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-bold">
                No custom expenses logged for this staff member yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {viewingStaffExpenses.expensesList.map((exp: any) => (
                  <div key={exp.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded-md text-[10px]">
                          {exp.category}
                        </span>
                        <span className="font-bold text-white">₹{exp.amount}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{exp.note || "No note"}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{new Date(exp.date).toLocaleDateString()}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                      title="Delete Entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 mt-2">
              <button
                onClick={() => setViewingStaffExpenses(null)}
                className="w-full py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
