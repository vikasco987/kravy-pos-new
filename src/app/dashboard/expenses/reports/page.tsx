"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
    ChevronLeft, Calendar, TrendingDown, 
    PieChart, ArrowLeft, Download,
    Filter, ShoppingCart, Wallet,
    Lightbulb, Rocket,
    MoreHorizontal, IndianRupee,
    ChevronRight, Users, ArrowUpRight,
    BarChart3, History, Zap,
    Clock, Search, Utensils, Tag, CreditCard, Banknote
} from "lucide-react";
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
    eachDayOfInterval, startOfDay, endOfDay
} from "date-fns";
import { kravy } from "@/lib/sounds";

const ICON_MAP: any = {
    ShoppingCart, Wallet, Users, Lightbulb, Rocket, MoreHorizontal, Utensils, Tag, CreditCard, Banknote
};

type FilterMode = 'Day' | 'Week' | 'Month' | 'Year';

export default function ExpenseReportsPage() {
    const router = useRouter();
    const [filterMode, setFilterMode] = useState<FilterMode>('Month');
    const [currentDate, setCurrentDate] = useState(new Date());
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
        return { start: startOfYear(currentDate), end: endOfYear(currentDate) };
    }, [filterMode, currentDate]);

    const filtered = useMemo(() => {
        return expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= range.start && expDate <= range.end;
        });
    }, [expenses, range]);

    const totalAmount = filtered.reduce((acc, curr) => acc + curr.amount, 0);

    const navigate = (direction: 'prev' | 'next') => {
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
        if (filterMode === 'Week' || filterMode === 'Month') intervals = eachDayOfInterval({ start: range.start, end: range.end });
        if (filterMode === 'Year') intervals = eachMonthOfInterval({ start: range.start, end: range.end });

        return intervals.map(interval => {
            const amount = expenses
                .filter(exp => {
                    const d = new Date(exp.date);
                    if (filterMode === 'Year') return isSameMonth(d, interval);
                    return isSameDay(d, interval);
                })
                .reduce((acc, curr) => acc + curr.amount, 0);
            return {
                name: format(interval, filterMode === 'Year' ? "MMM" : "dd MMM"),
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
                    <div className="bg-slate-100 dark:bg-black/20 p-1.5 rounded-2xl flex items-center shadow-inner">
                        {(['Day', 'Week', 'Month', 'Year'] as FilterMode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => { kravy.toggle(); setFilterMode(m); }}
                                className={`px-5 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    filterMode === m 
                                    ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-md" 
                                    : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 bg-white dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                        <button onClick={() => navigate('prev')} className="w-10 h-10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-center text-slate-400 transition-all">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="px-4 min-w-[140px] text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Time Period</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white whitespace-nowrap">
                                {filterMode === 'Day' && format(currentDate, "dd MMM yyyy")}
                                {filterMode === 'Week' && `${format(range.start, "dd MMM")} - ${format(range.end, "dd MMM")}`}
                                {filterMode === 'Month' && format(currentDate, "MMMM yyyy")}
                                {filterMode === 'Year' && format(currentDate, "yyyy")}
                            </p>
                        </div>
                        <button onClick={() => navigate('next')} className="w-10 h-10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-center text-slate-400 transition-all">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <button className="h-14 px-8 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20">
                        <Download size={18} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Outflow", value: `₹${totalAmount.toLocaleString()}`, icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-500/10", trend: "+12.5%", trendColor: "text-rose-500" },
                    { label: "Top Category", value: topCategory?.name || "N/A", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10", trend: topCategory ? `${((topCategory.value / totalAmount) * 100).toFixed(0)}% weight` : "No Data", trendColor: "text-slate-400" },
                    { label: "Records", value: filtered.length, icon: History, color: "text-indigo-500", bg: "bg-indigo-500/10", trend: "Processed", trendColor: "text-indigo-500" },
                    { label: "Period Avg", value: filtered.length > 0 ? `₹${(totalAmount / filtered.length).toFixed(0)}` : "₹0", icon: BarChart3, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "Balanced", trendColor: "text-emerald-500" },
                ].map((stat, i) => (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={stat.label} className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-sm group hover:shadow-xl hover:-translate-y-1 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <stat.icon size={22} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${stat.trendColor}`}>{stat.trend}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Trend Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-white/5 p-10 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Spending Curve</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Expense flow for the selected {filterMode}</p>
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
                            <p className="text-sm text-slate-400 max-w-xs font-medium">Trends are shown for Week, Month or Year views.</p>
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
                                <p className="text-[10px] font-black uppercase tracking-widest mt-4">No Data for this range</p>
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
