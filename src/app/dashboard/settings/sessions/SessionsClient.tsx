"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { 
  Laptop, Smartphone, Monitor, ShieldAlert,
  Settings2, Save, Trash2, ArrowLeft,
  Loader2, Globe
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function SessionsClient() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [maxSessions, setMaxSessions] = useState<number>(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setMaxSessions(data.maxSessions || 15);
      }
    } catch (err) {
      toast.error("Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  };

  const saveMaxSessions = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/auth/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxSessions: Number(maxSessions) })
      });
      if (res.ok) {
        toast.success("Login limit updated successfully");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update limit");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const revokeSession = async (jtiHash: string) => {
    try {
      setRevokingId(jtiHash);
      const res = await fetch("/api/auth/sessions/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jtiHash })
      });
      if (res.ok) {
        toast.success("Device logged out");
        setSessions(prev => prev.filter(s => s.jtiHash !== jtiHash));
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to log out device");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setRevokingId(null);
    }
  };

  const getDeviceIcon = (deviceType: string, os: string) => {
    if (deviceType === "mobile" || os === "iOS" || os === "Android") return <Smartphone size={20} className="text-blue-500" />;
    if (os === "macOS" || os === "Windows" || os === "Linux") return <Laptop size={20} className="text-purple-500" />;
    return <Monitor size={20} className="text-slate-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 pt-20 lg:pt-8 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/settings" className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Active Sessions</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your active devices and login limits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Limit Settings */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60"></div>
            
            <div className="flex items-center gap-3 mb-5 relative z-10">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Settings2 size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Login Limits</h2>
            </div>
            
            <div className="space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Max Allowed Devices
                </label>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    min="1"
                    max="50"
                    value={maxSessions}
                    onChange={(e) => setMaxSessions(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                  <button 
                    onClick={saveMaxSessions}
                    disabled={saving}
                    className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[80px]"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : "Save"}
                  </button>
                </div>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <ShieldAlert size={16} className="text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800 leading-relaxed font-medium">
                  When you reach this limit, the oldest session is automatically logged out to make room for new logins.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Devices */}
        <div className="md:col-span-2">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[400px]">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">
                {sessions.length}
              </span>
              Connected Devices
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-4 text-slate-400">
                <Loader2 size={32} className="animate-spin text-indigo-500" />
                <p className="text-sm font-medium">Loading sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Monitor size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium">No active sessions found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session, idx) => (
                  <div key={session.jtiHash || idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center">
                        {getDeviceIcon(session.deviceType, session.os)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          {session.browser || "Unknown Browser"} on {session.os || "Unknown OS"}
                          {idx === 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider">Current</span>
                          )}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-slate-500">
                          <span className="flex items-center gap-1">
                            <Globe size={12} /> {session.ipAddress || "Unknown IP"}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span>Logged in {session.createdAt ? formatDistanceToNow(session.createdAt, { addSuffix: true }) : "Unknown"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => revokeSession(session.jtiHash)}
                      disabled={revokingId === session.jtiHash}
                      className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {revokingId === session.jtiHash ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <Trash2 size={14} />
                          Log out
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
