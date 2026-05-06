"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ChevronLeft, Calendar, TrendingDown, 
    PieChart, ArrowLeft, Download,
    Filter, ShoppingCart, Wallet,
    Lightbulb, Rocket,
    MoreHorizontal, IndianRupee,
    ChevronRight, Users, ArrowUpRight,
    BarChart3, History, Zap,
    Clock, Search, Utensils, Tag, CreditCard, Banknote,
    X, Scale
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { 
    PieChart as RePieChart, Pie, Cell, 
    ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, 
    CartesianGrid
} from "recharts";
import { 
    format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
    startOfYear, endOfYear, eachMonthOfInterval, isSameMonth,
    addDays, addWeeks, addMonths, addYears, isSameDay,
    eachDayOfInterval, startOfDay, endOfDay, parseISO, isWithinInterval
} from "date-fns";
import { kravy } from "@/lib/sounds";

const ICON_MAP: any = {
    ShoppingCart, Wallet, Users, Lightbulb, Rocket, MoreHorizontal, Utensils, Tag, CreditCard, Banknote
};

type FilterMode = 'Day' | 'Week' | 'Month' | 'Year' | 'Custom';

export default function ExpenseReportsPage() {
    const router = useRouter();
    const dateInputRef = useRef<HTMLInputElement>(null);
    const startRangeRef = useRef<HTMLInputElement>(null);
    const endRangeRef = useRef<HTMLInputElement>(null);

    const [filterMode, setFilterMode] = useState<FilterMode>('Month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [customRange, setCustomRange] = useState({ 
        start: format(new Date(), "yyyy-MM-dd"), 
        end: format(new Date(), "yyyy-MM-dd") 
    });
    
    const [expenses, setExpenses] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [expRes, catRes] = await Promise.all([
                fetch("/api/expenses"),
                fetch("/api/expenses/categories")
            ]);
            setExpenses(await expRes.json());
            setCategories(await catRes.json());
        } catch (error) {
            console.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    const range = useMemo(() => {
        if (filterMode === 'Day') return { start: startOfDay(currentDate), end: endOfDay(currentDate) };
        if (filterMode === 'Week') return { start: startOfWeek(currentDate), end: endOfWeek(currentDate) };
        if (filterMode === 'Month') return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
        if (filterMode === 'Year') return { start: startOfYear(currentDate), end: endOfYear(currentDate) };
        return { start: startOfDay(parseISO(customRange.start)), end: endOfDay(parseISO(customRange.end)) };
    }, [filterMode, currentDate, customRange]);

    const filtered = useMemo(() => {
        return expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= range.start && expDate <= range.end;
        });
    }, [expenses, range]);

    const totalAmount = filtered.reduce((acc, curr) => acc + curr.amount, 0);

    const navigate = (direction: 'prev' | 'next') => {
        if (filterMode === 'Custom') return;
        kravy.click();
        const factor = direction === 'next' ? 1 : -1;
        if (filterMode === 'Day') setCurrentDate(addDays(currentDate, factor));
        if (filterMode === 'Week') setCurrentDate(addWeeks(currentDate, factor));
        if (filterMode === 'Month') setCurrentDate(addMonths(currentDate, factor));
        if (filterMode === 'Year') setCurrentDate(addYears(currentDate, factor));
    };

    const trendData = useMemo(() => {
        if (filterMode === 'Day') return [];
        let intervals: Date[] = [];
        
        if (filterMode === 'Week' || filterMode === 'Month' || filterMode === 'Custom') {
            intervals = eachDayOfInterval({ start: range.start, end: range.end });
            // Cap custom interval intervals to avoid performance issues
            if (intervals.length > 60) {
                // Show monthly if more than 60 days
                intervals = eachMonthOfInterval({ start: range.start, end: range.end });
            }
        } else if (filterMode === 'Year') {
            intervals = eachMonthOfInterval({ start: range.start, end: range.end });
        }

        return intervals.map(interval => {
            const amount = expenses
                .filter(exp => {
                    const d = new Date(exp.date);
                    if (filterMode === 'Year' || intervals.length <= 60 && intervals.some(i => isSameMonth(i, interval) && intervals.length > 31)) {
                        if (intervals.length > 31) return isSameMonth(d, interval);
                    }
                    return isSameDay(d, interval);
                })
                .reduce((acc, curr) => acc + curr.amount, 0);
            
            return {
                name: format(interval, intervals.length > 31 ? "MMM" : "dd MMM"),
                amount: amount
            };
        });
    }, [expenses, range, filterMode]);

    const chartData = useMemo(() => {
        return categories.map(cat => {
            const amount = filtered
                .filter(exp => exp.category === cat.name)
                .reduce((acc, curr) => acc + curr.amount, 0);
            return {
                name: cat.name,
                value: amount,
                color: cat.color
            };
        }).filter(d => d.value > 0);
    }, [categories, filtered]);

    const topCategory = useMemo(() => [...chartData].sort((a, b) => b.value - a.value)[0], [chartData]);

    const exportToCSV = () => {
        kravy.click();
        if (filtered.length === 0) {
            toast.error("No data to export");
            return;
        }

        const headers = ["Date", "Category", "Description", "Mode", "Amount"];
        const rows = filtered.map(exp => [
            format(new Date(exp.date), "yyyy-MM-dd"),
            exp.category,
            exp.description || "",
            exp.paymentMode || "Cash",
            exp.amount
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Expenses_${format(range.start, "yyyyMMdd")}_${format(range.end, "yyyyMMdd")}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-[1600px] mx-auto p-6 md:p-10 space-y-8 min-h-screen bg-[#F8FAFC] dark:bg-slate-950 kravy-page-fade">
            {/* Professional Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 bg-white dark:bg-white/5 p-8 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-5">
                    <button 
                        onClick={() => { kravy.click(); router.back(); }}
                        className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-all shadow-inner"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                            <span>Kravy POS</span>
                            <ChevronRight size={10} />
                            <span className="text-rose-500">Analytics Dashboard</span>
                        </nav>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Expense Reporting</h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* View Mode Selector */}
                    <div className="bg-slate-100 dark:bg-black/20 p-1.5 rounded-2xl flex items-center shadow-inner overflow-x-auto scrollbar-hide">
                        {(['Day', 'Week', 'Month', 'Year', 'Custom'] as FilterMode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => { kravy.toggle(); setFilterMode(m); }}
                                className={`px-4 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    filterMode === m 
                                    ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-md" 
                                    : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>

                    {/* Date Navigator & Picker */}
                    <div className="flex items-center gap-3 bg-white dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm relative group">
                        {filterMode !== 'Custom' && (
                            <button onClick={() => navigate('prev')} className="w-10 h-10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-center text-slate-400 transition-all">
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        
                        <div 
                            onClick={() => {
                                if (filterMode === 'Day' || filterMode === 'Month' || filterMode === 'Year') {
                                    dateInputRef.current?.showPicker();
                                }
                            }}
                            className="px-4 min-w-[140px] text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all py-1"
                        >
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 flex items-center justify-center gap-1">
                                {filterMode === 'Custom' ? 'Select Range' : 'Click to Pick'}
                                <Calendar size={10} />
                            </p>
                            <p className="text-sm font-black text-slate-900 dark:text-white whitespace-nowrap">
                                {filterMode === 'Day' && format(currentDate, "dd MMM yyyy")}
                                {filterMode === 'Week' && `${format(range.start, "dd MMM")} - ${format(range.end, "dd MMM")}`}
                                {filterMode === 'Month' && format(currentDate, "MMMM yyyy")}
                                {filterMode === 'Year' && format(currentDate, "yyyy")}
                                {filterMode === 'Custom' && (
                                    <span className="flex items-center gap-2">
                                        <span onClick={(e) => { e.stopPropagation(); startRangeRef.current?.showPicker(); }}>{format(parseISO(customRange.start), "dd MMM")}</span>
                                        <ChevronRight size={12} className="text-slate-300" />
                                        <span onClick={(e) => { e.stopPropagation(); endRangeRef.current?.showPicker(); }}>{format(parseISO(customRange.end), "dd MMM")}</span>
                                    </span>
                                )}
                            </p>
                            {/* Hidden Inputs for Direct Selection */}
                            <input 
                                ref={dateInputRef} 
                                type={filterMode === 'Year' ? 'number' : filterMode === 'Month' ? 'month' : 'date'} 
                                className="absolute opacity-0 pointer-events-none" 
                                onChange={(e) => {
                                    if (!e.target.value) return;
                                    if (filterMode === 'Year') {
                                        const year = parseInt(e.target.value);
                                        const d = new Date(currentDate);
                                        d.setFullYear(year);
                                        setCurrentDate(d);
                                    } else {
                                        setCurrentDate(new Date(e.target.value));
                                    }
                                }}
                            />
                            <input ref={startRangeRef} type="date" className="absolute opacity-0 pointer-events-none" onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })} />
                            <input ref={endRangeRef} type="date" className="absolute opacity-0 pointer-events-none" onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })} />
                        </div>

                        {filterMode !== 'Custom' && (
                            <button onClick={() => navigate('next')} className="w-10 h-10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-center text-slate-400 transition-all">
                                <ChevronRight size={20} />
                            </button>
                        )}
                    </div>

                    <button 
                        onClick={() => { kravy.click(); router.push("/dashboard/expenses/pnl"); }}
                        className="h-14 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
                    >
                        <Scale size={18} /> P&L Statement
                    </button>
                    <button 
                        onClick={exportToCSV}
                        className="h-14 px-8 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20"
                    >
                        <Download size={18} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Outflow", value: `₹${totalAmount.toLocaleString()}`, icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-500/10", trend: "Processed", trendColor: "text-rose-500" },
                    { label: "Top Category", value: topCategory?.name || "N/A", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10", trend: topCategory ? `${((topCategory.value / totalAmount) * 100).toFixed(0)}% weight` : "No Data", trendColor: "text-slate-400" },
                    { label: "Records", value: filtered.length, icon: History, color: "text-indigo-500", bg: "bg-indigo-500/10", trend: "Volume", trendColor: "text-indigo-500" },
                    { label: "Period Avg", value: filtered.length > 0 ? `₹${(totalAmount / filtered.length).toFixed(0)}` : "₹0", icon: BarChart3, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "Balanced", trendColor: "text-emerald-500" },
                ].map((stat, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: i * 0.1 }} 
                        key={stat.label} 
                        className="bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm group hover:shadow-xl hover:-translate-y-1 transition-all"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <stat.icon size={18} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${stat.trendColor}`}>{stat.trend}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Trend Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-white/5 p-10 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Spending Curve</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Expense flow for the selected period</p>
                        </div>
                        {filterMode !== 'Day' && (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {filterMode === 'Day' ? (
                        <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300">
                                <Clock size={40} />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Single Day View</h4>
                            <p className="text-sm text-slate-400 max-w-xs font-medium">Trends are shown for ranges. For a single day, check the distribution on the right.</p>
                        </div>
                    ) : (
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} dy={10}/>
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} />
                                    <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', background: '#111827', color: '#fff' }} itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '900' }}/>
                                    <Area type="monotone" dataKey="amount" stroke="#F43F5E" strokeWidth={5} fillOpacity={1} fill="url(#colorAmt)" animationDuration={2000} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Distribution Chart */}
                <div className="bg-white dark:bg-white/5 p-10 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col">
                    <div className="mb-10 text-center lg:text-left">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Distribution</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Share per Category</p>
                    </div>
                    <div className="h-[280px] w-full relative mb-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie data={chartData.length > 0 ? chartData : [{ value: 1, color: '#E2E8F0' }]} innerRadius={80} outerRadius={110} paddingAngle={10} dataKey="value" stroke="none">
                                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip />
                            </RePieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outflow</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">₹{totalAmount.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {chartData.length > 0 ? chartData.map((cat) => (
                            <div key={cat.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/5 group hover:scale-[1.02] transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: cat.color }}></div>
                                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{cat.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-black text-slate-900 dark:text-white">₹{cat.value.toLocaleString()}</span>
                                    <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-lg">
                                        {((cat.value / totalAmount) * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                                <Search size={40} />
                                <p className="text-[10px] font-black uppercase tracking-widest mt-4">No Data</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Category Deep-Dive */}
            <div className="bg-white dark:bg-white/5 p-12 rounded-[4rem] border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <PieChart size={200} className="text-slate-900 dark:text-white" />
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Category Intelligence</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Deep analysis of operational costs</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    {categories.map((cat) => {
                        const amount = filtered.filter(exp => exp.category === cat.name).reduce((acc, curr) => acc + curr.amount, 0);
                        const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
                        const Icon = ICON_MAP[cat.icon] || MoreHorizontal;

                        return (
                            <div key={cat.id} className="group space-y-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-[1.5rem] bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner">
                                            <Icon size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{cat.name}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{percentage.toFixed(1)}% contribution</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">₹{amount.toLocaleString()}</p>
                                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Outflow</p>
                                    </div>
                                </div>
                                <div className="relative h-4 w-full bg-slate-100 dark:bg-black/20 rounded-full overflow-hidden shadow-inner border border-slate-200/50 dark:border-white/5">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1.5, ease: "circOut" }} className="h-full rounded-full relative" style={{ backgroundColor: cat.color, boxShadow: `0 0 25px ${cat.color}40` }}>
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                                    </motion.div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
