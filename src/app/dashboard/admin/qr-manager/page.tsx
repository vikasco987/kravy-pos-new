"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, Plus, RefreshCcw, Save, Download, DownloadCloud, FileDown, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import QRCode from "react-qr-code";
import { domToPng } from "modern-screenshot";

export default function QRManagerPage() {
    const [qrs, setQrs] = useState<any[]>([]);
    const [googleReviewUrl, setGoogleReviewUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [downloading, setDownloading] = useState(false);
    
    const [customQty, setCustomQty] = useState(100);

    // Hidden container to render all QRs for zip downloading
    const printContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchQRs();
    }, []);

    const fetchQRs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/dashboard/google-review-qr");
            const data = await res.json();
            if (data.qrs) {
                setQrs(data.qrs);
            }
            if (data.googleReviewUrl) {
                setGoogleReviewUrl(data.googleReviewUrl);
            }
        } catch (err) {
            toast.error("Failed to load QR codes");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveUrl = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/dashboard/business-profile/google-review-url", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ googleReviewUrl })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Google Review URL saved!");
            } else {
                toast.error(data.error || "Failed to save URL");
            }
        } catch (err) {
            toast.error("Failed to save URL");
        } finally {
            setSaving(false);
        }
    };

    const handleGenerate = async () => {
        if (customQty <= 0 || customQty > 1000) {
            toast.error("Quantity must be between 1 and 1000");
            return;
        }

        setGenerating(true);
        try {
            const res = await fetch("/api/dashboard/google-review-qr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ count: customQty })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Successfully generated ${data.count} QR Codes`);
                fetchQRs();
            } else {
                toast.error(data.error || "Failed to generate QR codes");
            }
        } catch (err) {
            toast.error("Failed to generate QR codes");
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadAll = async () => {
        if (qrs.length === 0) {
            toast.error("No QR codes to download");
            return;
        }

        setDownloading(true);
        const toastId = toast.loading("Preparing ZIP file... this may take a moment.");
        
        try {
            const zip = new JSZip();
            const qrNodes = document.querySelectorAll('.qr-download-item');
            
            for (let i = 0; i < qrNodes.length; i++) {
                const node = qrNodes[i] as HTMLElement;
                const code = node.getAttribute('data-code');
                
                // domToPng gives base64
                const dataUrl = await domToPng(node, {
                    scale: 2, // High quality
                    backgroundColor: "#ffffff",
                    filter: (n) => !n.classList?.contains('ignore-print')
                });
                
                // Convert base64 to blob
                const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
                zip.file(`Review-QR-${code}.png`, base64Data, { base64: true });
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "Google-Review-QRs.zip");
            toast.success("Download complete!", { id: toastId });
        } catch (err) {
            console.error("Download failed:", err);
            toast.error("Failed to generate zip file", { id: toastId });
        } finally {
            setDownloading(false);
        }
    };

    const handleDownloadSingle = async (code: string) => {
        const node = document.querySelector(`.qr-download-item[data-code="${code}"]`) as HTMLElement;
        if (!node) return;
        
        const toastId = toast.loading("Generating image...");
        try {
            const dataUrl = await domToPng(node, {
                scale: 2,
                backgroundColor: "#ffffff"
            });
            saveAs(dataUrl, `Review-QR-${code}.png`);
            toast.success("Downloaded!", { id: toastId });
        } catch (err) {
            toast.error("Failed to download image", { id: toastId });
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Google Review QR Manager</h1>
                <p className="text-slate-500 mt-1">Manage and generate dynamic Google Review QR codes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Master URL Section */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-2">Google Review URL</h2>
                    <p className="text-sm text-slate-500 mb-4">Set the master URL. All printed QR codes will redirect here.</p>
                    
                    <div className="flex gap-3">
                        <input 
                            type="url"
                            value={googleReviewUrl}
                            onChange={(e) => setGoogleReviewUrl(e.target.value)}
                            placeholder="https://g.page/r/YOUR_ID/review"
                            className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <button 
                            onClick={handleSaveUrl}
                            disabled={saving}
                            className="bg-primary text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save
                        </button>
                    </div>
                </div>

                {/* Generator Section */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-2">Generate QR Codes</h2>
                    <p className="text-sm text-slate-500 mb-4">Bulk generate unique dynamic QR codes for printing.</p>
                    
                    <div className="flex gap-3 items-center">
                        <div className="relative">
                            <input 
                                type="number"
                                min="1"
                                max="1000"
                                value={customQty}
                                onChange={(e) => setCustomQty(parseInt(e.target.value) || 0)}
                                className="w-32 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">Qty</span>
                        </div>
                        <button 
                            onClick={handleGenerate}
                            disabled={generating || customQty <= 0}
                            className="bg-emerald-500 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50"
                        >
                            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Generate
                        </button>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold">Generated QR Codes</h2>
                        <p className="text-sm text-slate-500">Total: {qrs.length} codes</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={fetchQRs}
                            className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors"
                            title="Refresh"
                        >
                            <RefreshCcw className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={handleDownloadAll}
                            disabled={downloading || qrs.length === 0}
                            className="bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-600 transition-colors disabled:opacity-50"
                        >
                            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                            Download All (ZIP)
                        </button>
                    </div>
                </div>

                {qrs.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        No QR codes generated yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800">
                                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Preview</th>
                                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Short Code</th>
                                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Link</th>
                                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Scans</th>
                                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {qrs.slice(0, 50).map((qr) => (
                                    <tr key={qr.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                        <td className="py-3 px-4">
                                            <div className="w-12 h-12 bg-white p-1 rounded border overflow-hidden">
                                                <QRCode value={`${window.location.origin}/qr/${qr.code}`} size={128} style={{ width: '100%', height: '100%' }} />
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-sm">{qr.code}</td>
                                        <td className="py-3 px-4 text-sm text-blue-500">
                                            <a href={`/qr/${qr.code}`} target="_blank" rel="noreferrer">
                                                /qr/{qr.code}
                                            </a>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                                                {qr.scanCount}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button 
                                                onClick={() => handleDownloadSingle(qr.code)}
                                                className="text-slate-500 hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium"
                                            >
                                                <FileDown className="w-4 h-4" /> Download
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {qrs.length > 50 && (
                            <div className="py-4 text-center text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-b-xl border-t border-slate-100 dark:border-slate-800">
                                Showing top 50 out of {qrs.length}. Download ZIP to get all.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Hidden Templates for rendering high-res QRs */}
            <div className="fixed -top-[9999px] -left-[9999px] opacity-0 pointer-events-none" ref={printContainerRef}>
                {qrs.map(qr => (
                    <div 
                        key={qr.id} 
                        data-code={qr.code} 
                        className="qr-download-item bg-white flex flex-col items-center justify-center p-8 w-[400px] border border-gray-100 rounded-2xl shadow-sm"
                        style={{ fontFamily: 'sans-serif' }}
                    >
                        <div className="flex gap-1 text-yellow-400 mb-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <svg key={i} className="w-8 h-8 fill-current" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Enjoyed our service?</h2>
                        <p className="text-gray-500 mb-6 font-medium text-lg">Scan to leave a Google Review</p>
                        
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                            <QRCode 
                                value={`${typeof window !== 'undefined' ? window.location.origin : 'https://kravy.in'}/qr/${qr.code}`} 
                                size={200}
                                level="H"
                            />
                        </div>
                        
                        <div className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            Thank You <span className="text-red-500">❤️</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-4 font-mono">ID: {qr.code}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
