"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ChevronLeft, Calendar, TrendingDown, 
    PieChart, ArrowLeft, Download,
    Filter, ShoppingCart, Wallet,
    UserGroup, Lightbulb, Rocket,
    MoreHorizontal, IndianRupee,
    ChevronRight, Users
} from "lucide-react";
import { useRouter } from "next/navigation";
import { 
    PieChart as RePieChart, Pie, Cell, 
    ResponsiveContainer, Tooltip 
} from "recharts";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths, subYears } from "date-fns";
import { kravy } from "@/lib/sounds";

const CATEGORIES = [
    { name: "Ingredients", color: "#F59E0B" }, // amber-500
    { name: "Rent", color: "#3B82F6" },        // blue-500
    { name: "Salaries", color: "#6366F1" },    // indigo-500
    { name: "Utilities", color: "#10B981" },   // emerald-500
    { name: "Marketing", color: "#F43F5E" },   // rose-500
    { name: "Others", color: "#64748B" },      // slate-500
];

export default function ExpenseReportsPage() {
    const router = useRouter();
    const [timeFrame, setTimeFrame] = useState<'Week' | 'Month' | 'Year'>('Month');
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

    // If no data, show a placeholder
    const finalChartData = chartData.length > 0 ? chartData : [{ name: "No Data", value: 1, color: "#E2E8F0" }];

    return (
        <div className="max-w-4xl mx-auto min-h-screen bg-white dark:bg-slate-900 pb-20 kravy-page-fade">
            {/* Header - App Style */}
            <div className="bg-[var(--kravy-brand)] p-6 pt-12 pb-12 rounded-b-[3rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <PieChart size={120} className="text-white" />
                </div>

                <div className="flex items-center justify-between relative z-10">
                    <button 
                        onClick={() => { kravy.click(); router.back(); }}
                        className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all"
                    >
                        <ArrowLeft size={20} strokeWidth={3} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-xl font-black text-white tracking-tight">Expense Analytics</h1>
                        <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-0.5">Visual Reports</p>
                    </div>
                    <button className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                        <Calendar size={20} />
                    </button>
                </div>

                {/* Timeframe Toggle */}
                <div className="mt-8 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl flex items-center relative z-10 border border-white/10">
                    {(['Week', 'Month', 'Year'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => { kravy.toggle(); setTimeFrame(t); }}
                            className={`flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                timeFrame === t 
                                ? "bg-slate-900 text-white shadow-lg" 
                                : "text-white/80 hover:text-white"
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Date Range Label */}
            <div className="px-8 mt-8 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                    <ChevronLeft size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {timeFrame === 'Week' ? "This Week" : timeFrame === 'Month' ? "This Month" : "This Year"}
                    </span>
                    <ChevronRight size={16} />
                </div>
                <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full">
                    Live Data
                </div>
            </div>

            {/* Donut Chart Section */}
            <div className="flex flex-col items-center justify-center py-12 relative">
                <div className="w-full h-[300px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                            <Pie
                                data={finalChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={110}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {finalChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                itemStyle={{ fontWeight: '900', fontSize: '12px' }}
                            />
                        </RePieChart>
                    </ResponsiveContainer>
                </div>

                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                        ₹{totalAmount.toLocaleString()}
                    </h2>
                </div>
            </div>

            {/* Category Breakdown List */}
            <div className="px-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Breakdown by Category</h3>
                    <button className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                        <Download size={12} /> Export CSV
                    </button>
                </div>

                <div className="space-y-5">
                    {CATEGORIES.map((cat) => {
                        const amount = filtered
                            .filter(exp => exp.category === cat.name)
                            .reduce((acc, curr) => acc + curr.amount, 0);
                        const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;

                        if (amount === 0) return null;

                        return (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={cat.name} 
                                className="space-y-2"
                            >
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-white/5">
                                            {cat.name === "Ingredients" && <ShoppingCart size={14} className="text-amber-500" />}
                                            {cat.name === "Rent" && <Wallet size={14} className="text-blue-500" />}
                                            {cat.name === "Salaries" && <Users size={14} className="text-indigo-500" />}
                                            {cat.name === "Utilities" && <Lightbulb size={14} className="text-emerald-500" />}
                                            {cat.name === "Marketing" && <Rocket size={14} className="text-rose-500" />}
                                            {cat.name === "Others" && <MoreHorizontal size={14} className="text-slate-500" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 dark:text-white/80">{cat.name}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
                                                {percentage.toFixed(1)}% of total
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-900 dark:text-white">₹{amount.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                                        style={{ backgroundColor: cat.color }}
                                    />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Floating Summary */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md">
                <div className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-xl bg-opacity-90">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                            <TrendingDown size={20} className="text-rose-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Net Outflow</p>
                            <h4 className="text-xl font-black tracking-tighter">₹{totalAmount.toLocaleString()}</h4>
                        </div>
                    </div>
                    <button 
                        onClick={() => router.push('/dashboard/expenses')}
                        className="bg-white text-black h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                    >
                        View Logs
                    </button>
                </div>
            </div>
        </div>
    );
}
