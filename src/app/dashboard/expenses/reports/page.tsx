"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
    ChevronLeft, Calendar, TrendingDown, 
    PieChart, ArrowLeft, Download,
    Filter, ShoppingCart, Wallet,
    Lightbulb, Rocket,
    MoreHorizontal, IndianRupee,
    ChevronRight, Users, ArrowUpRight,
    ArrowDownRight, BarChart3,
    History, Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { 
    PieChart as RePieChart, Pie, Cell, 
    ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, 
    CartesianGrid, Legend, BarChart, Bar
} from "recharts";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachMonthOfInterval, isSameMonth } from "date-fns";
import { kravy } from "@/lib/sounds";

const CATEGORIES = [
    { name: "Ingredients", color: "#F59E0B", icon: ShoppingCart }, 
    { name: "Rent", color: "#3B82F6", icon: Wallet },        
    { name: "Salaries", color: "#6366F1", icon: Users },    
    { name: "Utilities", color: "#10B981", icon: Lightbulb },   
    { name: "Marketing", color: "#F43F5E", icon: Rocket },   
    { name: "Others", color: "#64748B", icon: MoreHorizontal },      
];

export default function ExpenseReportsPage() {
    const router = useRouter();
    const [timeFrame, setTimeFrame] = useState<'Week' | 'Month' | 'Year'>('Year');
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
            console.error("Failed to fetch expenses");
        } finally {
            setLoading(false);
        }
    };

    const getFilteredExpenses = () => {
        const now = new Date();
        let start, end;

        if (timeFrame === 'Week') {
            start = startOfWeek(now);
            end = endOfWeek(now);
        } else if (timeFrame === 'Month') {
            start = startOfMonth(now);
            end = endOfMonth(now);
        } else {
            start = startOfYear(now);
            end = endOfYear(now);
        }

        return expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= start && expDate <= end;
        });
    };

    const filtered = getFilteredExpenses();
    const totalAmount = filtered.reduce((acc, curr) => acc + curr.amount, 0);

    // Trend Data for Area Chart (Monthly for Year view)
    const getTrendData = () => {
        if (timeFrame !== 'Year') return [];
        const now = new Date();
        const months = eachMonthOfInterval({
            start: startOfYear(now),
            end: endOfYear(now)
        });

        return months.map(month => {
            const monthTotal = expenses
                .filter(exp => isSameMonth(new Date(exp.date), month))
                .reduce((acc, curr) => acc + curr.amount, 0);
            return {
                name: format(month, "MMM"),
                amount: monthTotal
            };
        });
    };

    const trendData = getTrendData();

    const chartData = CATEGORIES.map(cat => {
        const amount = filtered
            .filter(exp => exp.category === cat.name)
            .reduce((acc, curr) => acc + curr.amount, 0);
        return {
            name: cat.name,
            value: amount,
            color: cat.color
        };
    }).filter(d => d.value > 0);

    const topCategory = [...chartData].sort((a, b) => b.value - a.value)[0];

    return (
        <div className="max-w-[1600px] mx-auto p-6 md:p-10 space-y-10 min-h-screen bg-[#F8FAFC] dark:bg-slate-950 kravy-page-fade">
            {/* Professional Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => { kravy.click(); router.back(); }}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                            <span>Expenses</span>
                            <ChevronRight size={10} />
                            <span className="text-rose-500">Analytics & Reports</span>
                        </nav>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Financial Insights</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 flex shadow-sm">
                        {(['Week', 'Month', 'Year'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => { kravy.toggle(); setTimeFrame(t); }}
                                className={`px-6 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    timeFrame === t 
                                    ? "bg-slate-900 text-white shadow-lg" 
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <button className="h-12 px-6 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Outflow", value: `₹${totalAmount.toLocaleString()}`, icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-500/10", trend: "+12.5%", trendColor: "text-rose-500" },
                    { label: "Top Category", value: topCategory?.name || "N/A", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10", trend: topCategory ? `${((topCategory.value / totalAmount) * 100).toFixed(0)}% of total` : "No Data", trendColor: "text-slate-400" },
                    { label: "Entries", value: filtered.length, icon: History, color: "text-indigo-500", bg: "bg-indigo-500/10", trend: "Processed", trendColor: "text-indigo-500" },
                    { label: "Avg / Transaction", value: filtered.length > 0 ? `₹${(totalAmount / filtered.length).toFixed(0)}` : "₹0", icon: BarChart3, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "Balanced", trendColor: "text-emerald-500" },
                ].map((stat, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label} 
                        className="bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm group hover:shadow-xl hover:-translate-y-1 transition-all"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <stat.icon size={22} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${stat.trendColor}`}>{stat.trend}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
                    </motion.div>
                ))}
            </div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Trend Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Spending Trends</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Monthly expense flow over the year</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</span>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} 
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', background: '#111827', color: '#fff' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '900' }}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#F43F5E" strokeWidth={4} fillOpacity={1} fill="url(#colorAmt)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution Chart */}
                <div className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col">
                    <div className="mb-8">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Distribution</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Expenses by Category</p>
                    </div>
                    <div className="h-[250px] w-full relative mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={chartData.length > 0 ? chartData : [{ value: 1, color: '#E2E8F0' }]}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RePieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">₹{totalAmount.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {chartData.map((cat) => (
                            <div key={cat.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{cat.name}</span>
                                </div>
                                <span className="text-xs font-black text-slate-900 dark:text-white">{((cat.value / totalAmount) * 100).toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Category Breakdown */}
            <div className="bg-white dark:bg-white/5 p-10 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Category Deep-Dive</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Detailed analysis of every expense group</p>
                    </div>
                    <button className="h-10 px-6 rounded-xl bg-slate-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-all">
                        View All Categories
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {CATEGORIES.map((cat) => {
                        const amount = filtered
                            .filter(exp => exp.category === cat.name)
                            .reduce((acc, curr) => acc + curr.amount, 0);
                        const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
                        const Icon = cat.icon;

                        return (
                            <div key={cat.name} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors shadow-inner">
                                            <Icon size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{cat.name}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{percentage.toFixed(1)}% weightage</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">₹{amount.toLocaleString()}</p>
                                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Net Outflow</p>
                                    </div>
                                </div>
                                <div className="relative h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 1.5, ease: "circOut" }}
                                        className="h-full rounded-full"
                                        style={{ 
                                            backgroundColor: cat.color,
                                            boxShadow: `0 0 15px ${cat.color}40`
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
