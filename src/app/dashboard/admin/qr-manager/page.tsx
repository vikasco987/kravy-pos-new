"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, Plus, RefreshCcw, Save, DownloadCloud, FileDown, CheckCircle2, Upload, Trash2, Edit2, X } from "lucide-react";
import { toast } from "react-hot-toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import QRCode from "react-qr-code";
import { domToPng } from "modern-screenshot";
import * as XLSX from "xlsx";

export default function QRManagerPage() {
    const [qrs, setQrs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [downloading, setDownloading] = useState(false);
    
    const [customQty, setCustomQty] = useState(10);
    const [editingQrId, setEditingQrId] = useState<string | null>(null);
    const [editShopName, setEditShopName] = useState("");
    const [editDestUrl, setEditDestUrl] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const printContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchQRs();
    }, []);

    const fetchQRs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/dashboard/google-review-qr");
            const data = await res.json();
            if (data.qrs) setQrs(data.qrs);
        } catch (err) {
            toast.error("Failed to load QR codes");
        } finally {
            setLoading(false);
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

    const handleSaveInline = async (qrId: string) => {
        try {
            const res = await fetch("/api/dashboard/google-review-qr", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: qrId, shopName: editShopName, destinationUrl: editDestUrl })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Updated successfully!");
                setQrs(qrs.map(q => q.id === qrId ? { ...q, shopName: editShopName, destinationUrl: editDestUrl } : q));
                setEditingQrId(null);
            } else {
                toast.error(data.error || "Failed to update");
            }
        } catch (err) {
            toast.error("Failed to update QR");
        }
    };

    const handleDelete = async (qrId: string) => {
        if (!confirm("Are you sure you want to delete this QR code? It will break if printed.")) return;
        try {
            const res = await fetch(`/api/dashboard/google-review-qr?id=${qrId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                toast.success("Deleted");
                setQrs(qrs.filter(q => q.id !== qrId));
            } else {
                toast.error(data.error || "Failed to delete");
            }
        } catch (err) {
            toast.error("Failed to delete QR");
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    toast.error("File is empty");
                    return;
                }

                // Map to required structure
                const items = data.map((row: any) => ({
                    code: row['QR Code'] || row['code'] || row['Short Code'] || null,
                    shopName: row['Shop Name'] || row['shopName'] || row['Name'] || null,
                    destinationUrl: row['Google Review URL'] || row['destinationUrl'] || row['URL'] || row['Link'] || null,
                })).filter(i => i.code);

                if (items.length === 0) {
                    toast.error("No valid QR Codes found in file. Ensure you have a 'QR Code' column.");
                    return;
                }

                const res = await fetch("/api/dashboard/google-review-qr/import", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ items })
                });

                const result = await res.json();
                if (result.success) {
                    toast.success(`Imported! Updated: ${result.updatedCount}, Not Found: ${result.notFoundCount}`);
                    fetchQRs();
                } else {
                    toast.error(result.error || "Import failed");
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to parse file");
            }
        };
        reader.readAsBinaryString(file);
        // reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDownloadAll = async () => {
        if (qrs.length === 0) return toast.error("No QR codes to download");
        setDownloading(true);
        const toastId = toast.loading("Preparing ZIP file... this may take a moment.");
        
        try {
            const zip = new JSZip();
            const qrNodes = document.querySelectorAll('.qr-download-item');
            
            for (let i = 0; i < qrNodes.length; i++) {
                const node = qrNodes[i] as HTMLElement;
                const code = node.getAttribute('data-code');
                const name = node.getAttribute('data-name')?.replace(/[^a-zA-Z0-9]/g, '_') || 'QR';
                
                const dataUrl = await domToPng(node, {
                    scale: 2, 
                    backgroundColor: "#ffffff"
                });
                
                const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
                zip.file(`${name}-${code}.png`, base64Data, { base64: true });
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "Google-Review-QRs.zip");
            toast.success("Download complete!", { id: toastId });
        } catch (err) {
            toast.error("Failed to generate zip", { id: toastId });
        } finally {
            setDownloading(false);
        }
    };

    const handleDownloadSingle = async (code: string, shopName: string) => {
        const node = document.querySelector(`.qr-download-item[data-code="${code}"]`) as HTMLElement;
        if (!node) return;
        const toastId = toast.loading("Generating image...");
        try {
            const dataUrl = await domToPng(node, { scale: 2, backgroundColor: "#ffffff" });
            const name = (shopName || 'QR').replace(/[^a-zA-Z0-9]/g, '_');
            saveAs(dataUrl, `${name}-${code}.png`);
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
        <div className="p-6 max-w-[1400px] mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Dynamic QR Manager</h1>
                    <p className="text-slate-500 mt-1">Manage individual QR codes for multiple shops/clients.</p>
                </div>
                <div className="flex gap-3">
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx" onChange={handleFileUpload} />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Upload className="w-4 h-4" /> Bulk Import
                    </button>
                    <button 
                        onClick={handleDownloadAll}
                        disabled={downloading || qrs.length === 0}
                        className="bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-600 transition-colors disabled:opacity-50"
                    >
                        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                        Download ZIP
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex items-center gap-4">
                <div className="flex-1">
                    <h2 className="text-lg font-semibold">Generate Empty QR Codes</h2>
                    <p className="text-sm text-slate-500">Create unused dynamic shortcodes that you can configure later.</p>
                </div>
                <div className="flex items-center gap-3">
                    <input 
                        type="number" min="1" max="500" value={customQty}
                        onChange={(e) => setCustomQty(parseInt(e.target.value) || 0)}
                        className="w-24 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                    />
                    <button 
                        onClick={handleGenerate}
                        disabled={generating || customQty <= 0}
                        className="bg-emerald-500 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Generate
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">All QR Codes ({qrs.length})</h2>
                    <button onClick={fetchQRs} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        <RefreshCcw className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr className="border-b border-slate-200 dark:border-slate-800">
                                <th className="py-3 px-4 text-sm font-medium text-slate-500 w-24">QR</th>
                                <th className="py-3 px-4 text-sm font-medium text-slate-500 w-32">Short Code</th>
                                <th className="py-3 px-4 text-sm font-medium text-slate-500 w-1/4">Shop Name</th>
                                <th className="py-3 px-4 text-sm font-medium text-slate-500">Destination URL</th>
                                <th className="py-3 px-4 text-sm font-medium text-slate-500 text-center w-24">Scans</th>
                                <th className="py-3 px-4 text-sm font-medium text-slate-500 text-right w-48">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {qrs.map((qr) => (
                                <tr key={qr.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                    <td className="py-2 px-4">
                                        <div className="w-10 h-10 bg-white p-1 rounded border">
                                            <QRCode value={`${window.location.origin}/qr/${qr.code}`} size={128} style={{ width: '100%', height: '100%' }} />
                                        </div>
                                    </td>
                                    <td className="py-2 px-4 font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                                        <a href={`/qr/${qr.code}`} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">{qr.code}</a>
                                    </td>
                                    <td className="py-2 px-4">
                                        {editingQrId === qr.id ? (
                                            <input 
                                                autoFocus
                                                value={editShopName} 
                                                onChange={e => setEditShopName(e.target.value)} 
                                                placeholder="e.g. Raju Dhaba"
                                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded outline-none focus:border-primary"
                                            />
                                        ) : (
                                            <span className={`text-sm ${!qr.shopName ? 'text-slate-400 italic' : 'font-medium'}`}>
                                                {qr.shopName || "Unnamed Shop"}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-2 px-4">
                                        {editingQrId === qr.id ? (
                                            <input 
                                                value={editDestUrl} 
                                                onChange={e => setEditDestUrl(e.target.value)} 
                                                placeholder="https://g.page/r/..."
                                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded outline-none focus:border-primary"
                                            />
                                        ) : (
                                            <span className={`text-sm truncate max-w-[200px] inline-block ${!qr.destinationUrl ? 'text-rose-400 font-medium' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {qr.destinationUrl || "Not Configured"}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-2 px-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-bold">{qr.scanCount}</span>
                                            {qr.lastScannedAt && <span className="text-[9px] text-slate-400 mt-0.5" title={new Date(qr.lastScannedAt).toLocaleString()}>Active</span>}
                                        </div>
                                    </td>
                                    <td className="py-2 px-4 text-right">
                                        {editingQrId === qr.id ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleSaveInline(qr.id)} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded" title="Save">
                                                    <Save className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setEditingQrId(null)} className="p-1.5 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded" title="Cancel">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => {
                                                        setEditingQrId(qr.id);
                                                        setEditShopName(qr.shopName || "");
                                                        setEditDestUrl(qr.destinationUrl || "");
                                                    }} 
                                                    className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDownloadSingle(qr.code, qr.shopName)} className="p-1.5 text-slate-500 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" title="Download">
                                                    <FileDown className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(qr.id)} className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {qrs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-500">
                                        No QR Codes found. Generate some to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hidden Templates for rendering high-res QRs */}
            <div className="fixed -top-[9999px] -left-[9999px] opacity-0 pointer-events-none" ref={printContainerRef}>
                {qrs.map(qr => (
                    <div 
                        key={qr.id} 
                        data-code={qr.code} 
                        data-name={qr.shopName}
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
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{qr.shopName || "Enjoyed our service?"}</h2>
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
