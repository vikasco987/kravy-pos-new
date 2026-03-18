"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Calendar, Clock, AlertCircle, Edit2, Check, X, Watch, AlertTriangle, Monitor, Download, UserCircle
} from "lucide-react";
import { toast } from "sonner";

type AttendanceRecord = {
  id: string;
  staff: {
    name: string;
  };
  date: string;
  checkIn: string;
  checkOut: string | null;
  lateByMins: number;
  reason: string | null;
  status: string;
  workingMins: number;
  overtimeMins: number;
  remarks: string | null;
};

export default function AttendanceDashboard() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date filter (default to today)
  const [filterDate, setFilterDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  // Edit Modal
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCheckOutTime, setEditCheckOutTime] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterDate]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?date=${filterDate}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "-";
    return format(new Date(isoString), "hh:mm a");
  };

  const formatMins = (mins: number) => {
    if (!mins || mins <= 0) return "-";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h} hr ${m} min`;
    if (h > 0) return `${h} hr`;
    return `${m} min`;
  };

  const handleSavePunchOut = async () => {
    if (!editingId || !editCheckOutTime) return;
    setSaving(true);
    
    // Convert time input to full Date string
    const targetRecord = records.find(r => r.id === editingId);
    if (!targetRecord) return;
    
    // editCheckOutTime is "HH:mm"
    const [h, m] = editCheckOutTime.split(":");
    const outDate = new Date(targetRecord.checkIn);
    outDate.setHours(parseInt(h), parseInt(m), 0, 0);

    // If user selected a time earlier than checkIn (night shift issue or mistake), just add 1 day
    if (outDate <= new Date(targetRecord.checkIn)) {
      outDate.setDate(outDate.getDate() + 1);
    }

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceId: editingId,
          checkOutTime: outDate.toISOString()
        })
      });
      if (res.ok) {
        toast.success("Manual Punch Out successful");
        setEditingId(null);
        setEditCheckOutTime("");
        fetchData(); // reload
      } else {
        const err = await res.text();
        toast.error(err || "Save failed");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8 font-sans">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-3">
            <Watch size={14} /> Master Control
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
            Attendance Dashboard <span className="text-2xl">📅</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Monitor staff punch-in/out and edit missing check-outs
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="date" 
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
          <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
            <Download size={16} /> Export
          </button>
        </div>
      </header>

      {/* Main Table Container */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="px-6 py-4">EMPLOYEE</th>
                <th className="px-6 py-4">DATE</th>
                <th className="px-6 py-4">CHECK IN</th>
                <th className="px-6 py-4 text-center">CHECK OUT</th>
                <th className="px-6 py-4">LATE BY</th>
                <th className="px-6 py-4">REASON</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4">WORKING HOURS</th>
                <th className="px-6 py-4">OVERTIME</th>
                <th className="px-6 py-4">REMARKS</th>
                <th className="px-6 py-4">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-12 text-center text-slate-400 font-medium">
                    <Monitor className="animate-pulse mx-auto mb-3" size={32} />
                    Loading Attendance Data...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-12 text-center text-slate-400 font-medium">
                    <AlertCircle className="mx-auto mb-3 text-slate-300" size={32} />
                    No attendance records found for this date.
                  </td>
                </tr>
              ) : (
                records.map((row, idx) => (
                  <tr key={row.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-6 py-4 text-sm font-black text-slate-800">
                      <div className="flex items-center gap-2">
                        <UserCircle className="text-indigo-400" size={16} />
                        {row.staff.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {format(new Date(row.checkIn), "EEE, MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 text-emerald-600">
                      {formatTime(row.checkIn)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 text-center">
                      {row.checkOut ? (
                        <span className="text-rose-600">{formatTime(row.checkOut)}</span>
                      ) : (
                        <span className="text-slate-300 text-lg">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-amber-600">
                      {formatMins(row.lateByMins)}
                      {row.lateByMins > 0 && <br/>}
                      {row.lateByMins > 0 && <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Late</span>}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-[150px] truncate">
                      {row.reason || "."}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                        row.status === "On Time" ? "bg-emerald-100 text-emerald-700" :
                        row.status === "Late" ? "bg-orange-100 text-orange-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-700">
                      {formatMins(row.workingMins)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-500">
                      {row.overtimeMins > 0 ? formatMins(row.overtimeMins) : "-"}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {row.remarks || "-"}
                    </td>
                    <td className="px-6 py-4">
                      {!row.checkOut && (
                        <button
                          onClick={() => {
                            setEditingId(row.id);
                            setEditCheckOutTime(format(new Date(), "HH:mm")); // Default to current time
                          }}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors"
                        >
                          <Edit2 size={12} /> Edit Out
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit CheckOut Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white max-w-sm w-full rounded-[2rem] p-6 shadow-2xl relative">
            <button 
              onClick={() => setEditingId(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
              <Clock size={24} />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-1">Manual Punch Out</h3>
            <p className="text-xs font-medium text-slate-500 mb-6">Set the exit time for this staff member.</p>
            
            <div className="space-y-4 mb-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Select Check Out Time
                </label>
                <input 
                  type="time" 
                  value={editCheckOutTime}
                  onChange={(e) => setEditCheckOutTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <button 
              onClick={handleSavePunchOut}
              disabled={saving || !editCheckOutTime}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? "Saving..." : <><Check size={18} /> Update Check Out</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
