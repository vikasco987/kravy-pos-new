"use client";

import React, { useState, useEffect } from "react";
import { 
  Building, 
  Clock, 
  IndianRupee, 
  BarChart, 
  ChevronLeft,
  Settings,
  CalendarDays
} from "lucide-react";
import Link from "next/link";
import { kravy } from "@/lib/sounds";
import { useTheme } from "next-themes";

export default function HotelReportsPage() {
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const isDark = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`min-h-screen p-4 md:p-8 font-sans transition-colors duration-300 ${
      isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border shadow-xl backdrop-blur-xl transition-all ${
          isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200/80 shadow-slate-200/50"
        }`}>
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/rooms" 
              onClick={() => kravy.click()}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-center ${
                isDark ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-slate-100 border-slate-200 hover:bg-slate-200"
              }`}
            >
              <ChevronLeft size={20} />
            </Link>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20 text-white font-black text-2xl">
              📊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  Room Operations Center
                </h1>
                <span className="px-3 py-1 bg-violet-500/10 border border-violet-500/30 text-violet-600 dark:text-violet-300 text-xs font-bold rounded-full uppercase tracking-widest">
                  PMS
                </span>
              </div>
              <p className={`text-xs md:text-sm font-medium mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Hotel Property Management System: Reports, Financials & Operations
              </p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className={`flex items-center gap-2 p-2 rounded-2xl overflow-x-auto border ${
          isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"
        }`}>
          {[
            { id: "OVERVIEW", label: "Overview", icon: <BarChart size={16} /> },
            { id: "STAY_HISTORY", label: "Stay History", icon: <Clock size={16} /> },
            { id: "FINANCIALS", label: "Financials", icon: <IndianRupee size={16} /> },
            { id: "ROOM_MANAGEMENT", label: "Room Management", icon: <Settings size={16} /> },
            { id: "CALENDAR", label: "Calendar (Pro)", icon: <CalendarDays size={16} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                kravy.click();
                setActiveTab(tab.id);
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                  : isDark
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT AREA */}
        <div className={`rounded-3xl border p-8 min-h-[500px] ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          {activeTab === "OVERVIEW" && (
            <div className="flex flex-col items-center justify-center h-full opacity-50 py-20">
              <BarChart size={64} className="mb-4 text-violet-500" />
              <h2 className="text-xl font-bold">Overview Dashboard (Coming Soon)</h2>
              <p className="text-sm">Phase 1 development in progress...</p>
            </div>
          )}
          {activeTab === "STAY_HISTORY" && (
            <div className="flex flex-col items-center justify-center h-full opacity-50 py-20">
              <Clock size={64} className="mb-4 text-emerald-500" />
              <h2 className="text-xl font-bold">Stay History (Coming Soon)</h2>
              <p className="text-sm">Phase 1 development in progress...</p>
            </div>
          )}
          {activeTab === "FINANCIALS" && (
            <div className="flex flex-col items-center justify-center h-full opacity-50 py-20">
              <IndianRupee size={64} className="mb-4 text-rose-500" />
              <h2 className="text-xl font-bold">Financial Reports (Coming Soon)</h2>
              <p className="text-sm">Phase 1 development in progress...</p>
            </div>
          )}
          {activeTab === "ROOM_MANAGEMENT" && (
            <div className="flex flex-col items-center justify-center h-full opacity-50 py-20">
              <Settings size={64} className="mb-4 text-amber-500" />
              <h2 className="text-xl font-bold">Room Management (Coming Soon)</h2>
              <p className="text-sm">Phase 1 development in progress...</p>
            </div>
          )}
          {activeTab === "CALENDAR" && (
            <div className="flex flex-col items-center justify-center h-full opacity-50 py-20">
              <CalendarDays size={64} className="mb-4 text-indigo-500" />
              <h2 className="text-xl font-bold">Booking Calendar (Phase 2)</h2>
              <p className="text-sm">This feature will be available in Phase 2.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
