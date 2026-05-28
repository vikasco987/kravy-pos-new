"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
    Mail, 
    CheckCircle2, 
    XCircle, 
    RefreshCw, 
    Power, 
    ShieldCheck, 
    FileText, 
    TrendingUp, 
    Info, 
    ChevronRight,
    AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useConfirm } from "@/components/ConfirmContext";


interface GmailStatus {
    isConnected: boolean;
    connectedEmail?: string;
    lastSynced?: string;
    lastEmailId?: string;
}

function GmailIntegrationContent() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<GmailStatus>({ isConnected: false });
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Sandbox & Tab states
    const [activeTab, setActiveTab] = useState<"auto" | "sandbox">("auto");
    const [sandboxPlatform, setSandboxPlatform] = useState<"zomato" | "swiggy">("zomato");
    const [sandboxContent, setSandboxContent] = useState("");
    const [sandboxSaveDb, setSandboxSaveDb] = useState(true);
    const [sandboxDate, setSandboxDate] = useState(new Date().toISOString().split("T")[0]);
    const [sandboxTesting, setSandboxTesting] = useState(false);
    const [sandboxResult, setSandboxResult] = useState<any>(null);

    const loadSample = (platform: "zomato" | "swiggy") => {
  const { confirm } = useConfirm();
        if (platform === "zomato") {
            setSandboxContent(
`Dear Partner,

Here is your restaurant daily performance summary report for 2026-05-20:
Total orders: 47 orders
Total revenue collected: Rs. 18,450.00 (exclusive of taxes)
Cancelled orders: 2 orders
Customer feedback rating: 4.8 / 5 stars

Thank you,
Zomato Merchant Team`
            );
        } else {
            setSandboxContent(
`Swiggy Daily Sales Performance Summary for Your Kitchen
Date: 20-May-2026

We delivered 53 successful orders today!
Total Net revenue generated: Rs. 21,980.00
Customer cancellations: 1
Store feedback rating: 4.6/5

Regards,
Swiggy Business Team`
            );
        }
    };

    const fetchStatus = async () => {
        try {
            const res = await fetch("/api/gmail/status");
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (err) {
            console.error("Failed to fetch Gmail status:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();

        // Handle URL parameters for success/error redirect feedback
        const success = searchParams.get("success");
        const error = searchParams.get("error");
        
        if (success === "true") {
            toast.success("Gmail connected successfully!");
            // Clean up url parameters
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (success === "false") {
            toast.error(`Connection failed: ${error || "Unknown error"}`);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [searchParams]);

    const handleConnect = async () => {
        setActionLoading(true);
        try {
            const origin = window.location.origin;
            const res = await fetch(`/api/gmail/auth?origin=${encodeURIComponent(origin)}`);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to start Google OAuth");
            }
            const { url } = await res.json();
            // Redirect to Google Consent screen
            window.location.href = url;
        } catch (err: any) {
            toast.error(err.message || "Failed to initiate Gmail connection");
            setActionLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!await confirm("Are you sure you want to disconnect your Gmail integration? Daily Swiggy/Zomato email parsing will stop.")) {
            return;
        }
        setActionLoading(true);
        try {
            const res = await fetch("/api/gmail/status", { method: "POST" });
            if (res.ok) {
                toast.success("Gmail integration disconnected.");
                setStatus({ isConnected: false });
            } else {
                throw new Error("Failed to disconnect");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to disconnect Gmail account");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch("/api/gmail/sync", { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                toast.success(`Sync completed! ${data.savedCount} new platform sales records imported.`);
                fetchStatus();
            } else {
                const errData = await res.json();
                throw new Error(errData.error || "Sync failed");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to sync emails");
        } finally {
            setSyncing(false);
        }
    };

    const handleSandboxTest = async () => {
        if (!sandboxContent.trim()) {
            toast.error("Please paste email content or load a sample first.");
            return;
        }
        setSandboxTesting(true);
        setSandboxResult(null);
        try {
            const res = await fetch("/api/gmail/test-parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform: sandboxPlatform,
                    content: sandboxContent,
                    saveToDb: sandboxSaveDb,
                    date: sandboxDate
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    toast.success("Email parsed successfully!");
                    setSandboxResult(data.parsed);
                } else {
                    toast.error(data.error || "Parsing failed. Email format didn't match.");
                }
            } else {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to process test request");
            }
        } catch (err: any) {
            toast.error(err.message || "Something went wrong during dry run");
        } finally {
            setSandboxTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Mail className="w-7 h-7 text-violet-500" />
                        Gmail Sales Integration
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Automatically fetch and parse daily summary emails from Zomato and Swiggy for a combined sales view.
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-white/10 gap-6">
                <button
                    onClick={async () => setActiveTab("auto")}
                    className={`pb-3 font-semibold text-sm transition-all duration-200 cursor-pointer ${
                        activeTab === "auto"
                            ? "text-violet-400 border-b-2 border-violet-500"
                            : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                    Automatic Gmail Sync
                </button>
                <button
                    onClick={async () => setActiveTab("sandbox")}
                    className={`pb-3 font-semibold text-sm transition-all duration-200 cursor-pointer ${
                        activeTab === "sandbox"
                            ? "text-violet-400 border-b-2 border-violet-500"
                            : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                    Developer Sandbox (Tester)
                </button>
            </div>

            {/* Tab contents */}
            {activeTab === "auto" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#0f0f23]/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden"
                        >
                            {/* Status badge */}
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Connection Status</span>
                                {status.isConnected ? (
                                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        Connected
                                    </span>
                                ) : (
                                    <span className="bg-slate-500/10 text-slate-400 border border-white/5 px-3 py-1 rounded-full text-xs font-medium">
                                        Not Connected
                                    </span>
                                )}
                            </div>

                            {status.isConnected ? (
                                <div className="space-y-6">
                                    <div>
                                        <div className="text-slate-400 text-xs">Connected Google Account</div>
                                        <div className="text-lg font-semibold text-white mt-0.5">{status.connectedEmail}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-4">
                                        <div>
                                            <div className="text-slate-400 text-xs">Last Synced</div>
                                            <div className="text-sm font-medium text-slate-200 mt-0.5">
                                                {status.lastSynced ? new Date(status.lastSynced).toLocaleString("en-IN", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                }) : "Never"}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-slate-400 text-xs">Sync Frequency</div>
                                            <div className="text-sm font-medium text-slate-200 mt-0.5">Every 15 Minutes</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 pt-2">
                                        <button
                                            onClick={handleSync}
                                            disabled={syncing || actionLoading}
                                            className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                                            {syncing ? "Syncing..." : "Sync Now"}
                                        </button>
                                        <button
                                            onClick={handleDisconnect}
                                            disabled={syncing || actionLoading}
                                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            <Power className="w-4 h-4" />
                                            Disconnect
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        Unlock combined reporting for Swiggy, Zomato, and Offline sales in one place. By securely connecting your Gmail, our system will read and automatically parse your platform daily performance reports.
                                    </p>

                                    <button
                                        onClick={handleConnect}
                                        disabled={actionLoading}
                                        className="bg-violet-600 hover:bg-violet-700 text-white w-full md:w-auto px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <Mail className="w-4 h-4" />
                                        {actionLoading ? "Connecting..." : "Connect Your Gmail Account"}
                                    </button>
                                </div>
                            )}
                        </motion.div>

                        {/* How it works info card */}
                        <div className="bg-[#0f0f23]/40 border border-white/5 rounded-2xl p-6 space-y-4">
                            <h3 className="text-md font-semibold text-white flex items-center gap-2">
                                <Info className="w-5 h-5 text-violet-400" />
                                How Auto-Sync Works
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-2">
                                <div className="p-4 bg-white/5 rounded-xl space-y-2 border border-white/5">
                                    <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center font-bold text-violet-400">1</div>
                                    <div className="font-semibold text-white">OAuth Connect</div>
                                    <p className="text-slate-400 leading-relaxed">Securely grant read-only access to search and view emails containing Zomato and Swiggy reports.</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl space-y-2 border border-white/5">
                                    <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center font-bold text-violet-400">2</div>
                                    <div className="font-semibold text-white">Daily Summaries</div>
                                    <p className="text-slate-400 leading-relaxed">Gmail receives daily summary performance emails directly from Swiggy & Zomato partner portals.</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl space-y-2 border border-white/5">
                                    <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center font-bold text-violet-400">3</div>
                                    <div className="font-semibold text-white">AI / Regex Parsing</div>
                                    <p className="text-slate-400 leading-relaxed">System pulls order counts, revenues, and ratings, automatically populating your sales reports.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar details */}
                    <div className="space-y-6">
                        <div className="bg-[#0f0f23]/60 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-md">
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Features Included</h3>
                            
                            <div className="space-y-3.5">
                                <div className="flex gap-3 text-sm">
                                    <ShieldCheck className="w-5 h-5 text-violet-400 flex-shrink-0" />
                                    <div>
                                        <div className="font-medium text-slate-200">100% Free & Secure</div>
                                        <p className="text-slate-400 text-xs mt-0.5">We request Gmail read-only access to scan messages. We never see or store your Google password.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 text-sm">
                                    <FileText className="w-5 h-5 text-violet-400 flex-shrink-0" />
                                    <div>
                                        <div className="font-medium text-slate-200">Smart Aggregation</div>
                                        <p className="text-slate-400 text-xs mt-0.5">Filters and parses Zomato performance updates and Swiggy daily summaries.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 text-sm">
                                    <TrendingUp className="w-5 h-5 text-violet-400 flex-shrink-0" />
                                    <div>
                                        <div className="font-medium text-slate-200">Unified Analytics</div>
                                        <p className="text-slate-400 text-xs mt-0.5">Offline POS Sales combined with Zomato/Swiggy orders in beautiful graphics and charts.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex gap-3 text-xs text-amber-300 leading-relaxed">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <div>
                                <span className="font-semibold block mb-0.5">Important Setup Tip</span>
                                Make sure the Gmail account you connect is the one registered in your Zomato Partner Portal & Swiggy Partner Portal to receive daily performance report emails.
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#0f0f23]/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-6"
                        >
                            <div className="flex flex-col gap-2">
                                <h3 className="text-lg font-semibold text-white">Manual Email Parser Sandbox</h3>
                                <p className="text-slate-400 text-xs">
                                    Test the parsing algorithm immediately by pasting an email body or loading a sample preset.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 text-xs font-semibold mb-2">Target Platform</label>
                                        <select
                                            value={sandboxPlatform}
                                            onChange={(e) => setSandboxPlatform(e.target.value as "zomato" | "swiggy")}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500"
                                        >
                                            <option value="zomato">Zomato Report</option>
                                            <option value="swiggy">Swiggy Report</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-slate-400 text-xs font-semibold mb-2">Report Date</label>
                                        <input
                                            type="date"
                                            value={sandboxDate}
                                            onChange={(e) => setSandboxDate(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-slate-400 text-xs font-semibold">Email Content Body</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async () => loadSample("zomato")}
                                                className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold bg-violet-500/10 px-2.5 py-1 rounded-md cursor-pointer"
                                            >
                                                Load Zomato Sample
                                            </button>
                                            <button
                                                onClick={async () => loadSample("swiggy")}
                                                className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold bg-violet-500/10 px-2.5 py-1 rounded-md cursor-pointer"
                                            >
                                                Load Swiggy Sample
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        value={sandboxContent}
                                        onChange={(e) => setSandboxContent(e.target.value)}
                                        rows={8}
                                        placeholder="Paste Zomato/Swiggy daily performance report summary email text here..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-mono text-slate-300 outline-none focus:border-violet-500"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="saveDb"
                                        checked={sandboxSaveDb}
                                        onChange={(e) => setSandboxSaveDb(e.target.checked)}
                                        className="rounded border-white/10 text-violet-600 bg-white/5 focus:ring-violet-500"
                                    />
                                    <label htmlFor="saveDb" className="text-slate-300 text-xs select-none">
                                        Save parsed record to Sales Database (simulates sync insertion)
                                    </label>
                                </div>

                                <button
                                    onClick={handleSandboxTest}
                                    disabled={sandboxTesting}
                                    className="bg-violet-600 hover:bg-violet-700 text-white w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <RefreshCw className={`w-4 h-4 ${sandboxTesting ? 'animate-spin' : ''}`} />
                                    {sandboxTesting ? "Running parsing algorithms..." : "Run Parser Test"}
                                </button>
                            </div>
                        </motion.div>
                    </div>

                    <div className="space-y-6">
                        {sandboxResult ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-[#0f0f23]/60 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-md"
                            >
                                <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 border-b border-white/5 pb-3">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                    Parsed Results
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs py-1 border-b border-white/5">
                                        <span className="text-slate-400">Total Orders</span>
                                        <span className="font-semibold text-white">{sandboxResult.totalOrders}</span>
                                    </div>
                                    <div className="flex justify-between text-xs py-1 border-b border-white/5">
                                        <span className="text-slate-400">Total Revenue</span>
                                        <span className="font-semibold text-white">₹{sandboxResult.totalRevenue.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex justify-between text-xs py-1 border-b border-white/5">
                                        <span className="text-slate-400">Cancelled Orders</span>
                                        <span className="font-semibold text-white">{sandboxResult.cancelledOrders}</span>
                                    </div>
                                    <div className="flex justify-between text-xs py-1 border-b border-white/5">
                                        <span className="text-slate-400">Average Order Value</span>
                                        <span className="font-semibold text-white">₹{Math.round(sandboxResult.avgOrderValue).toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex justify-between text-xs py-1 border-b border-white/5">
                                        <span className="text-slate-400">Average Rating</span>
                                        <span className="font-semibold text-white">⭐ {sandboxResult.rating || "N/A"}</span>
                                    </div>
                                </div>

                                {sandboxSaveDb && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl p-3.5 leading-relaxed">
                                        <strong>Database Synced:</strong> This record has been saved successfully. Go to your <strong>Daily Sales Report</strong> to view it!
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <div className="bg-[#0f0f23]/40 border border-white/5 rounded-2xl p-6 text-center text-slate-500 text-xs py-12">
                                Run the parser test on raw email summary text to see the JSON results.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function GmailIntegrationPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        }>
            <GmailIntegrationContent />
        </Suspense>
    );
}
