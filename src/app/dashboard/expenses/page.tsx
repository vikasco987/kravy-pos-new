"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Plus, Search, Filter, Calendar, 
    Trash2, Edit3, IndianRupee, Tag, 
    FileText, CreditCard, Banknote, 
    LayoutDashboard, ArrowUpRight, 
    ArrowDownRight, PieChart, 
    MoreVertical, Download, X,
    ChevronLeft, ChevronRight,
    Utensils, Wallet, ShoppingCart, 
    Lightbulb, Users, Rocket,
    MoreHorizontal
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { kravy } from "@/lib/sounds";

const CATEGORIES = [
    { name: "Ingredients", icon: ShoppingCart, color: "text-amber-500", bg: "bg-amber-50" },
    { name: "Rent", icon: Wallet, color: "text-blue-500", bg: "bg-blue-50" },
    { name: "Salaries", icon: Users, color: "text-indigo-500", bg: "bg-indigo-50" },
    { name: "Utilities", icon: Lightbulb, color: "text-emerald-500", bg: "bg-emerald-50" },
    { name: "Marketing", icon: Rocket, color: "text-rose-500", bg: "bg-rose-50" },
    { name: "Others", icon: MoreHorizontal, color: "text-slate-500", bg: "bg-slate-50" },
];

export default function ExpensesPage() {
    const router = useRouter();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");

    const [formData, setFormData] = useState({
        amount: "",
        category: "Ingredients",
        description: "",
        date: format(new Date(), "yyyy-MM-dd"),
        paymentMode: "Cash",
    });

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/expenses");
            const data = await res.json();
            setExpenses(data);
        } catch (error) {
            toast.error("Failed to fetch expenses");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingExpense ? `/api/expenses/${editingExpense.id}` : "/api/expenses";
        const method = editingExpense ? "PATCH" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                kravy.success();
                toast.success(editingExpense ? "Expense updated" : "Expense added");
                setShowAddModal(false);
                setEditingExpense(null);
                setFormData({
                    amount: "",
                    category: "Ingredients",
                    description: "",
                    date: format(new Date(), "yyyy-MM-dd"),
                    paymentMode: "Cash",
                });
                fetchExpenses();
            } else {
                toast.error("Something went wrong");
            }
        } catch (error) {
            toast.error("Failed to save expense");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
            if (res.ok) {
                kravy.ping();
                toast.success("Expense deleted");
                fetchExpenses();
            }
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const filteredExpenses = expenses.filter(exp => {
        const matchesSearch = exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             exp.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === "All" || exp.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const totalExpense = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 min-h-screen pb-24 kravy-page-fade">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                        <IndianRupee className="w-8 h-8 text-rose-500" />
                        Restaurant Expenses
                    </h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Track your daily operational costs</p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => { kravy.click(); router.push("/dashboard/expenses/reports"); }}
                        className="h-14 px-8 rounded-[1.5rem] bg-indigo-500 hover:bg-indigo-400 text-white font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-indigo-500/20 transition-all active:scale-95"
                    >
                        <PieChart size={18} strokeWidth={3} />
                        View Reports
                    </button>
                    <button 
                        onClick={() => { kravy.toggle(); setShowAddModal(true); }}
                        className="h-14 px-8 rounded-[1.5rem] bg-rose-500 hover:bg-rose-400 text-white font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-rose-500/20 transition-all active:scale-95"
                    >
                        <Plus size={18} strokeWidth={3} />
                        Add New Expense
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-sm relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <ArrowUpRight size={80} className="text-rose-500" />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Total Spending</p>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                        ₹{totalExpense.toLocaleString()}
                    </h3>
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-2 flex items-center gap-1">
                        <PieChart size={12} /> View Details
                    </p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-8 rounded-[2.5rem] bg-indigo-500 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 transition-transform">
                        <ShoppingCart size={80} />
                    </div>
                    <p className="text-xs font-black opacity-60 uppercase tracking-widest mb-4">Entries Count</p>
                    <h3 className="text-4xl font-black tracking-tighter">
                        {filteredExpenses.length} Records
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80">Tracked Operations</p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-8 rounded-[2.5rem] bg-slate-900 dark:bg-white/10 text-white shadow-2xl relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:-rotate-12 transition-transform text-emerald-500">
                        <Banknote size={80} />
                    </div>
                    <p className="text-xs font-black opacity-40 uppercase tracking-widest mb-4">Primary Mode</p>
                    <h3 className="text-4xl font-black tracking-tighter">
                        Cash Only
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-2 text-emerald-400 italic font-mono">Real-time sync active</p>
                </motion.div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-white/5 p-4 rounded-[2rem] border border-slate-100 dark:border-white/10 shadow-sm">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={18} />
                    <input 
                        type="text"
                        placeholder="Search by description or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-black/20 border-transparent rounded-2xl text-sm focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-rose-500/20 transition-all outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
                    {["All", ...CATEGORIES.map(c => c.name)].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => { kravy.toggle(); setFilterCategory(cat); }}
                            className={`h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                filterCategory === cat 
                                ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg" 
                                : "bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-black/20 border-b border-slate-100 dark:border-white/5">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-8 py-6 h-16 bg-slate-50/10 dark:bg-white/5"></td>
                                    </tr>
                                ))
                            ) : filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300">
                                                <PieChart size={32} />
                                            </div>
                                            <p className="font-bold uppercase tracking-widest text-xs">No records found matching your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map((exp) => {
                                    const catInfo = CATEGORIES.find(c => c.name === exp.category) || CATEGORIES[5];
                                    const Icon = catInfo.icon;
                                    return (
                                        <motion.tr 
                                            key={exp.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700 dark:text-white/80">{format(new Date(exp.date), "dd MMM yyyy")}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono italic">{format(new Date(exp.date), "hh:mm a")}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight ${catInfo.bg} ${catInfo.color}`}>
                                                    <Icon size={12} />
                                                    {exp.category}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 max-w-xs">
                                                <p className="text-sm text-slate-600 dark:text-slate-400 truncate font-medium">{exp.description || "—"}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                    {exp.paymentMode === "Cash" ? <Banknote size={14} /> : <CreditCard size={14} />}
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{exp.paymentMode || "Cash"}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">₹{exp.amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => {
                                                            kravy.open();
                                                            setEditingExpense(exp);
                                                            setFormData({
                                                                amount: exp.amount.toString(),
                                                                category: exp.category,
                                                                description: exp.description || "",
                                                                date: format(new Date(exp.date), "yyyy-MM-dd"),
                                                                paymentMode: exp.paymentMode || "Cash",
                                                            });
                                                            setShowAddModal(true);
                                                        }}
                                                        className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:scale-110 transition-all"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(exp.id)}
                                                        className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:scale-110 transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddModal(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                        {editingExpense ? "Edit Expense" : "New Expense"}
                                    </h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Fill in the operational details</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount (₹)</label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500" size={20} />
                                        <input 
                                            required
                                            type="number"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            placeholder="0.00"
                                            className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-black/40 border-2 border-transparent focus:border-rose-500/30 rounded-2xl text-xl font-black outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                        <select 
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full h-12 px-4 bg-slate-50 dark:bg-black/40 border-2 border-transparent focus:border-rose-500/30 rounded-2xl text-sm font-bold outline-none transition-all"
                                        >
                                            {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                                        <input 
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full h-12 px-4 bg-slate-50 dark:bg-black/40 border-2 border-transparent focus:border-rose-500/30 rounded-2xl text-sm font-bold outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                    <textarea 
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="What was this expense for?"
                                        rows={3}
                                        className="w-full p-4 bg-slate-50 dark:bg-black/40 border-2 border-transparent focus:border-rose-500/30 rounded-2xl text-sm font-bold outline-none transition-all resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Mode</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {["Cash", "UPI"].map(mode => (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() => { kravy.toggle(); setFormData({ ...formData, paymentMode: mode }); }}
                                                className={`h-12 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 ${
                                                    formData.paymentMode === mode 
                                                    ? "bg-rose-500 border-rose-500 text-white shadow-lg" 
                                                    : "bg-white dark:bg-black/20 border-slate-100 dark:border-white/10 text-slate-400 hover:border-rose-500/30"
                                                }`}
                                            >
                                                {mode === "Cash" ? <Banknote size={14} /> : <CreditCard size={14} />}
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-xs shadow-2xl transition-all active:scale-95 mt-4"
                                >
                                    {editingExpense ? "Save Changes" : "Create Expense Entry"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
