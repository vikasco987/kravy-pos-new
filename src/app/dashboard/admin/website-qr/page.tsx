"use client";

import React, { useState, useRef } from "react";
import { Loader2, Save, DownloadCloud, FileDown, Link as LinkIcon, Edit2, X, Search, QrCode } from "lucide-react";
import { toast } from "react-hot-toast";
import { saveAs } from "file-saver";
import QRCode from "react-qr-code";
import { domToPng } from "modern-screenshot";

export default function WebsiteQRManagerPage() {
    const [qrType, setQrType] = useState<"STATIC" | "DYNAMIC">("STATIC");
    const [destinationUrl, setDestinationUrl] = useState("https://www.chickenextension.com");
    
    const [generating, setGenerating] = useState(false);
    const [generatedQr, setGeneratedQr] = useState<{ type: "STATIC" | "DYNAMIC", url: string, code?: string } | null>(null);

    const printContainerRef = useRef<HTMLDivElement>(null);

    const handleGenerate = async () => {
        if (!destinationUrl) {
            toast.error("Please enter a destination URL");
            return;
        }

        if (!destinationUrl.startsWith("http://") && !destinationUrl.startsWith("https://")) {
            toast.error("URL must start with http:// or https://");
            return;
        }

        setGenerating(true);
        try {
            if (qrType === "STATIC") {
                // For static, the QR code value is exactly the destination URL.
                setGeneratedQr({ type: "STATIC", url: destinationUrl });
                toast.success("Static QR Code Generated!");
            } else {
                // For dynamic, generate 1 shortcode via API and immediately set destination URL
                const res = await fetch("/api/dashboard/google-review-qr", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ count: 1 })
                });
                const data = await res.json();
                
                if (data.success) {
                    // Fetch the latest generated QR to get its ID
                    const fetchRes = await fetch("/api/dashboard/google-review-qr");
                    const fetchData = await fetchRes.json();
                    
                    if (fetchData.qrs && fetchData.qrs.length > 0) {
                        const newQr = fetchData.qrs[0]; // The newest one
                        
                        // Now update it with the destination URL
                        const updateRes = await fetch("/api/dashboard/google-review-qr", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: newQr.id, shopName: "Chicken Extension Website", destinationUrl })
                        });
                        
                        const updateData = await updateRes.json();
                        if (updateData.success) {
                            const dynamicUrl = `${window.location.origin}/qr/${newQr.code}`;
                            setGeneratedQr({ type: "DYNAMIC", url: dynamicUrl, code: newQr.code });
                            toast.success("Dynamic QR Code Generated!");
                        } else {
                            toast.error("Failed to set destination URL");
                        }
                    }
                } else {
                    toast.error(data.error || "Failed to generate dynamic QR");
                }
            }
        } catch (err) {
            toast.error("An error occurred during generation");
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = async () => {
        if (!generatedQr) return;
        const node = document.querySelector('.qr-download-item') as HTMLElement;
        if (!node) return;
        
        const toastId = toast.loading("Generating high-res image...");
        try {
            const dataUrl = await domToPng(node, { scale: 3, backgroundColor: "#ffffff" });
            saveAs(dataUrl, `Website-QR-${generatedQr.type}.png`);
            toast.success("Downloaded!", { id: toastId });
        } catch (err) {
            toast.error("Failed to download image", { id: toastId });
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Website QR Generator</h1>
                <p className="text-slate-500 mt-1">Generate a high-quality QR code that redirects to your website.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
                
                {/* Options */}
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setQrType("STATIC")}
                        className={`p-4 border rounded-xl flex flex-col items-start gap-2 transition-all ${qrType === "STATIC" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200 hover:border-slate-300"}`}
                    >
                        <div className="flex items-center gap-2">
                            <QrCode className={`w-5 h-5 ${qrType === "STATIC" ? "text-primary" : "text-slate-400"}`} />
                            <span className="font-semibold">Static QR Code</span>
                        </div>
                        <p className="text-sm text-slate-500 text-left">Directly links to your URL. Cannot be changed after printing.</p>
                    </button>
                    
                    <button 
                        onClick={() => setQrType("DYNAMIC")}
                        className={`p-4 border rounded-xl flex flex-col items-start gap-2 transition-all ${qrType === "DYNAMIC" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200 hover:border-slate-300"}`}
                    >
                        <div className="flex items-center gap-2">
                            <LinkIcon className={`w-5 h-5 ${qrType === "DYNAMIC" ? "text-primary" : "text-slate-400"}`} />
                            <span className="font-semibold">Dynamic QR Code</span>
                        </div>
                        <p className="text-sm text-slate-500 text-left">Links to a short URL that redirects to your website. Can be updated anytime.</p>
                    </button>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Target Website URL</label>
                    <input 
                        type="url"
                        placeholder="https://www.chickenextension.com"
                        value={destinationUrl}
                        onChange={(e) => setDestinationUrl(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-primary transition-colors"
                    />
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={generating || !destinationUrl}
                    className="w-full bg-indigo-500 text-white px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors disabled:opacity-50"
                >
                    {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />} 
                    Generate QR Code
                </button>
            </div>

            {generatedQr && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm flex flex-col items-center gap-6">
                    <h2 className="text-lg font-semibold">Your QR Code is Ready</h2>
                    
                    <div className="relative bg-white p-4 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-slate-100 flex items-center justify-center">
                        <QRCode 
                            value={generatedQr.url} 
                            size={200}
                            level="H"
                        />
                        {/* Centered Logo over QR Code */}
                        <div className="absolute flex items-center justify-center bg-white rounded-xl shadow p-2 overflow-hidden z-10" style={{ width: '60px', height: '60px' }}>
                            <img src="/chicken-logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                    </div>

                    <div className="text-center space-y-1">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {generatedQr.type === "STATIC" ? "Direct URL:" : "Dynamic Short URL:"}
                        </p>
                        <a href={generatedQr.url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-mono text-sm break-all">
                            {generatedQr.url}
                        </a>
                    </div>

                    <button 
                        onClick={handleDownload}
                        className="bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-600 transition-colors"
                    >
                        <FileDown className="w-5 h-5" /> Download High-Res Print
                    </button>
                </div>
            )}

            {/* Hidden Templates for rendering high-res QRs */}
            {generatedQr && (
                <div className="fixed -top-[9999px] -left-[9999px] opacity-0 pointer-events-none" ref={printContainerRef}>
                    <div 
                        className="qr-download-item bg-white p-12 w-[500px] border border-gray-100 shadow-2xl rounded-[2.5rem]"
                        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    >
                        <div className="flex justify-center mb-8">
                            <img src="/chicken-logo.png" alt="Chicken Extension" className="h-20 object-contain drop-shadow-md" />
                        </div>
                        
                        <div style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <h2 className="text-4xl font-extrabold text-slate-900 mb-4 text-center leading-[1.3] tracking-tight px-4">
                                Chicken Extension
                            </h2>
                            <p className="text-slate-500 mb-8 font-medium text-xl text-center px-4">
                                Scan to visit our Website
                            </p>
                        </div>
                        
                        <div className="flex justify-center mb-10">
                            <div className="relative bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 flex items-center justify-center">
                                <QRCode 
                                    value={generatedQr.url} 
                                    size={260}
                                    level="H"
                                />
                                {/* Centered Logo over QR Code */}
                                <div className="absolute flex items-center justify-center bg-white rounded-2xl shadow-xl p-2.5 overflow-hidden z-10" style={{ width: '75px', height: '75px' }}>
                                    <img src="/chicken-logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-sm" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-center mb-6">
                            <div className="text-2xl font-bold text-slate-800 flex items-center gap-3 bg-slate-50 px-8 py-4 rounded-full border border-slate-200 whitespace-nowrap">
                                Thank You <span className="text-red-500 text-3xl">❤️</span>
                            </div>
                        </div>
                        
                        <div className="text-center text-sm text-slate-400 font-mono tracking-wider font-semibold">
                            {generatedQr.type === "DYNAMIC" ? `ID: ${generatedQr.code}` : "STATIC QR"}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
