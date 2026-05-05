"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ChevronLeft, Calendar, TrendingDown, TrendingUp,
    PieChart, ArrowLeft, Download,
    Filter, ShoppingCart, Wallet,
    Lightbulb, Rocket,
    MoreHorizontal, IndianRupee,
    ChevronRight, Users, ArrowUpRight,
    BarChart3, History, Zap,
    Clock, Search, Utensils, Tag, CreditCard, Banknote,
    X, ArrowDownRight, Scale
} from "lucide-react";
import { useRouter } from "next/navigation";
import { 
    ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, 
    CartesianGrid, BarChart, Bar, Cell, Legend
} from "recharts";
import { 
    format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
    startOfYear, endOfYear, eachMonthOfInterval, isSameMonth,
    addDays, addWeeks, addMonths, addYears, isSameDay,
    eachDayOfInterval, startOfDay, endOfDay, parseISO
} from "date-fns";
import { kravy } from "@/lib/sounds";
import { toast } from "react-hot-toast";

type FilterMode = 'Day' | 'Week' | 'Month' | 'Year' | 'Custom';

export default function ProfitLossPage() {
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
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [expRes, billRes] = await Promise.all([
                fetch("/api/expenses"),
                fetch("/api/bill-manager")
            ]);
            const expData = await expRes.json();
            const billData = await billRes.json();
            
            setExpenses(expData);
            setOrders(billData.bills || []); // Using bills as the source of revenue
        } catch (error) {
            console.error("Failed to fetch data");
            toast.error("Failed to load financial data");
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

    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= range.start && expDate <= range.end;
        });
    }, [expenses, range]);

    const filteredOrders = useMemo(() => {
        return orders.filter(ord => {
            const ordDate = new Date(ord.createdAt);
            return ordDate >= range.start && ordDate <= range.end;
        });
    }, [orders, range]);

    const totalSales = filteredOrders.reduce((acc, curr) => acc + curr.total, 0);
    const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const netProfit = totalSales - totalExpenses;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

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
            if (intervals.length > 62) {
                intervals = eachMonthOfInterval({ start: range.start, end: range.end });
            }
        } else if (filterMode === 'Year') {
            intervals = eachMonthOfInterval({ start: range.start, end: range.end });
        }

        return intervals.map(interval => {
            const sales = orders
                .filter(ord => {
                    const d = new Date(ord.createdAt);
                    return intervals.length > 31 ? isSameMonth(d, interval) : isSameDay(d, interval);
                })
                .reduce((acc, curr) => acc + curr.total, 0);

            const exp = expenses
                .filter(e => {
                    const d = new Date(e.date);
                    return intervals.length > 31 ? isSameMonth(d, interval) : isSameDay(d, interval);
                })
                .reduce((acc, curr) => acc + curr.amount, 0);
            
            return {
                name: format(interval, intervals.length > 31 ? "MMM" : "dd MMM"),
                sales,
                expenses: exp,
                profit: sales - exp
            };
        });
    }, [expenses, orders, range, filterMode]);

    const exportToCSV = () => {
        kravy.click();
        const headers = ["Type", "Date", "Category/Status", "Description/Order", "Amount"];
        const rows: any[] = [];

        filteredOrders.forEach(ord => {
            rows.push(["SALES", format(new Date(ord.createdAt), "yyyy-MM-dd"), ord.status, `Order #${ord.tokenNumber}`, ord.total]);
        });
        filteredExpenses.forEach(exp => {
            rows.push(["EXPENSE", format(new Date(exp.date), "yyyy-MM-dd"), exp.category, exp.description || "", -exp.amount]);
        });

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `PnL_Report_${format(range.start, "yyyyMMdd")}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-[1600px] mx-auto p-6 md:p-10 space-y-8 min-h-screen bg-[#F8FAFC] dark:bg-slate-950 kravy-page-fade">
            {/* Header */}
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
                            <span>Analytics</span>
                            <ChevronRight size={10} />
                            <span className="text-emerald-500">Profit & Loss Statement</span>
                        </nav>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Financial Performance</h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
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

                    <div className="flex items-center gap-3 bg-white dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm relative group">
                        {filterMode !== 'Custom' && (
                            <button onClick={() => navigate('prev')} className="w-10 h-10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-center text-slate-400 transition-all">
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        <div 
                            onClick={() => (filterMode === 'Day' || filterMode === 'Month' || filterMode === 'Year') && dateInputRef.current?.showPicker()}
                            className="px-4 min-w-[140px] text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all py-1"
                        >
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 flex items-center justify-center gap-1">Period Selection <Calendar size={10} /></p>
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
                            <input ref={dateInputRef} type={filterMode === 'Year' ? 'number' : filterMode === 'Month' ? 'month' : 'date'} className="absolute opacity-0 pointer-events-none" onChange={(e) => e.target.value && setCurrentDate(new Date(e.target.value))} />
                            <input ref={startRangeRef} type="date" className="absolute opacity-0 pointer-events-none" onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })} />
                            <input ref={endRangeRef} type="date" className="absolute opacity-0 pointer-events-none" onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })} />
                        </div>
                        {filterMode !== 'Custom' && (
                            <button onClick={() => navigate('next')} className="w-10 h-10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-center text-slate-400 transition-all">
                                <ChevronRight size={20} />
                            </button>
                        )}
                    </div>

                    <button onClick={exportToCSV} className="h-14 px-8 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20">
                        <Download size={18} /> Export Statement
                    </button>
                </div>
            </div>

            {/* P&L Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Gross Sales", value: `₹${totalSales.toLocaleString()}`, icon: ShoppingCart, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "Realized", trendColor: "text-emerald-500" },
                    { label: "Operational Costs", value: `₹${totalExpenses.toLocaleString()}`, icon: Wallet, color: "text-rose-500", bg: "bg-rose-500/10", trend: "Paid Out", trendColor: "text-rose-500" },
                    { label: "Net Profit", value: `₹${netProfit.toLocaleString()}`, icon: netProfit >= 0 ? TrendingUp : TrendingDown, color: netProfit >= 0 ? "text-indigo-500" : "text-rose-600", bg: netProfit >= 0 ? "bg-indigo-500/10" : "bg-rose-600/10", trend: netProfit >= 0 ? "SURPLUS" : "DEFICIT", trendColor: netProfit >= 0 ? "text-indigo-500" : "text-rose-600" },
                    { label: "Profit Margin", value: `${profitMargin.toFixed(1)}%`, icon: Scale, color: "text-amber-500", bg: "bg-amber-500/10", trend: "Efficiency", trendColor: "text-amber-500" },
                ].map((stat, i) => (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={stat.label} className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-sm group hover:shadow-xl hover:-translate-y-1 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <stat.icon size={22} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${stat.trendColor}`}>{stat.trend}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className={`text-3xl font-black tracking-tighter ${stat.label === "Net Profit" ? (netProfit >= 0 ? "text-emerald-500" : "text-rose-500") : "text-slate-900 dark:text-white"}`}>{stat.value}</h3>
                    </motion.div>
                ))}
            </div>

            {/* Comparison Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales vs Expenses Comparison */}
                <div className="bg-white dark:bg-white/5 p-10 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Sales vs Expenses</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Comparison of inflows and outflows</p>
                        </div>
                    </div>
                    
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} dy={10}/>
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', background: '#111827', color: '#fff' }} />
                                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
                                <Bar dataKey="sales" name="Sales" fill="#10B981" radius={[10, 10, 0, 0]} />
                                <Bar dataKey="expenses" name="Expenses" fill="#F43F5E" radius={[10, 10, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Profit Trend Chart */}
                <div className="bg-white dark:bg-white/5 p-10 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Profitability Curve</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Net income trend line</p>
                        </div>
                    </div>
                    
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={netProfit >= 0 ? "#10B981" : "#F43F5E"} stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor={netProfit >= 0 ? "#10B981" : "#F43F5E"} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} dy={10}/>
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} />
                                <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', background: '#111827', color: '#fff' }} />
                                <Area type="monotone" dataKey="profit" name="Net Profit" stroke={netProfit >= 0 ? "#10B981" : "#F43F5E"} strokeWidth={5} fillOpacity={1} fill="url(#colorProfit)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="bg-white dark:bg-white/5 p-12 rounded-[4rem] border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-8">Performance Breakdown</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-white/5">
                                <th className="py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Interval</th>
                                <th className="py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Gross Sales</th>
                                <th className="py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Expenses</th>
                                <th className="py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net Profit</th>
                                <th className="py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Efficiency</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {trendData.slice().reverse().map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                    <td className="py-6 font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-widest">{row.name}</td>
                                    <td className="py-6 text-right font-black text-emerald-500">₹{row.sales.toLocaleString()}</td>
                                    <td className="py-6 text-right font-black text-rose-500">₹{row.expenses.toLocaleString()}</td>
                                    <td className={`py-6 text-right font-black ${row.profit >= 0 ? "text-indigo-500" : "text-rose-600"}`}>₹{row.profit.toLocaleString()}</td>
                                    <td className="py-6 text-center">
                                        <div className="flex items-center justify-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${row.profit >= row.sales * 0.3 ? "bg-emerald-100 text-emerald-600" : row.profit >= 0 ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-600"}`}>
                                                {row.sales > 0 ? ((row.profit / row.sales) * 100).toFixed(0) : 0}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
