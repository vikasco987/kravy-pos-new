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
        <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-2 mb-8">
                <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 drop-shadow-sm">Website QR Generator</h1>
                <p className="text-slate-500 font-medium text-lg">Generate a high-quality QR code that redirects to your website.</p>
            </div>

            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-8 shadow-[0_8px_40px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.2)] space-y-8 relative overflow-hidden">
                {/* Decorative background glows */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none"></div>

                
                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <button 
                        onClick={() => setQrType("STATIC")}
                        className={`group relative p-6 rounded-2xl flex flex-col items-start gap-4 transition-all duration-300 overflow-hidden text-left ${qrType === "STATIC" ? "bg-indigo-50/50 dark:bg-indigo-900/20 border-2 border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.2)] scale-[1.02]" : "bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg hover:-translate-y-1"}`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 ${qrType === "STATIC" ? "opacity-100" : "group-hover:opacity-100"}`}></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={`p-3 rounded-xl transition-colors duration-300 ${qrType === "STATIC" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/40" : "bg-slate-100 dark:bg-slate-700 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:group-hover:bg-indigo-900/50"}`}>
                                <QrCode className="w-6 h-6" />
                            </div>
                            <span className={`font-bold text-xl transition-colors ${qrType === "STATIC" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-200"}`}>Static QR Code</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 relative z-10 leading-relaxed font-medium">Directly links to your URL. Simple and reliable, but cannot be changed after printing.</p>
                    </button>
                    
                    <button 
                        onClick={() => setQrType("DYNAMIC")}
                        className={`group relative p-6 rounded-2xl flex flex-col items-start gap-4 transition-all duration-300 overflow-hidden text-left ${qrType === "DYNAMIC" ? "bg-purple-50/50 dark:bg-purple-900/20 border-2 border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.2)] scale-[1.02]" : "bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg hover:-translate-y-1"}`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 transition-opacity duration-300 ${qrType === "DYNAMIC" ? "opacity-100" : "group-hover:opacity-100"}`}></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={`p-3 rounded-xl transition-colors duration-300 ${qrType === "DYNAMIC" ? "bg-purple-500 text-white shadow-lg shadow-purple-500/40" : "bg-slate-100 dark:bg-slate-700 text-slate-500 group-hover:bg-purple-100 group-hover:text-purple-600 dark:group-hover:bg-purple-900/50"}`}>
                                <LinkIcon className="w-6 h-6" />
                            </div>
                            <span className={`font-bold text-xl transition-colors ${qrType === "DYNAMIC" ? "text-purple-600 dark:text-purple-400" : "text-slate-700 dark:text-slate-200"}`}>Dynamic QR Code</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 relative z-10 leading-relaxed font-medium">Links to a smart short-URL. Update the destination anytime without changing the printed QR!</p>
                    </button>
                </div>

                <div className="space-y-3 relative z-10">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                        Target Website URL <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <LinkIcon className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input 
                            type="url"
                            placeholder="https://www.yourwebsite.com"
                            value={destinationUrl}
                            onChange={(e) => setDestinationUrl(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-sm focus:shadow-[0_0_20px_rgba(99,102,241,0.15)] text-lg"
                        />
                    </div>
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={generating || !destinationUrl}
                    className="relative w-full overflow-hidden rounded-2xl font-bold text-white group disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(99,102,241,0.4)] z-10 bg-gradient-to-r from-indigo-500 to-purple-600"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                    <div className="relative px-6 py-4 flex items-center justify-center gap-3">
                        {generating ? <Loader2 className="w-6 h-6 animate-spin" /> : <QrCode className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />} 
                        <span className="text-lg tracking-wide">{generating ? "Generating..." : "Generate Magic QR"}</span>
                    </div>
                </button>
            </div>

            {generatedQr && (
                <div className="animate-in slide-in-from-bottom-8 fade-in duration-700 relative">
                    {/* Floating glow behind result card */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-400/10 rounded-[3rem] blur-[80px] pointer-events-none"></div>
                    
                    <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-[2.5rem] p-10 sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.08)] flex flex-col items-center gap-8 overflow-hidden z-10">
                        
                        <div className="text-center space-y-3 relative z-10">
                            <div className="inline-flex items-center justify-center p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl mb-2 shadow-inner animate-bounce">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-300">Your QR Code is Ready!</h2>
                        </div>
                        
                        <div className="relative bg-white p-6 rounded-[2rem] shadow-[0_15px_40px_rgb(0,0,0,0.12)] border border-slate-100 flex items-center justify-center transform transition-all duration-500 hover:scale-[1.03] hover:rotate-1 hover:shadow-[0_25px_50px_rgb(16,185,129,0.2)] z-10 group">
                            <div className="absolute inset-0 rounded-[2rem] ring-4 ring-emerald-500/20 scale-[1.08] opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 pointer-events-none"></div>
                            <QRCode 
                                value={generatedQr.url} 
                                size={220}
                                level="H"
                            />
                            {/* Centered Logo over QR Code */}
                            <div className="absolute flex items-center justify-center bg-white rounded-[1rem] shadow-xl p-2.5 overflow-hidden z-10 transform group-hover:scale-110 transition-transform duration-500" style={{ width: '65px', height: '65px' }}>
                                <img src="/chicken-logo.png?v=2" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                        </div>

                        <div className="text-center space-y-2 relative z-10 bg-slate-50 dark:bg-slate-800/80 px-8 py-5 rounded-2xl border border-slate-100 dark:border-slate-700 w-full max-w-md shadow-inner">
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                                {generatedQr.type === "STATIC" ? "Direct URL Destination" : "Dynamic Short URL"}
                            </p>
                            <a href={generatedQr.url} target="_blank" rel="noreferrer" className="block text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 hover:underline font-mono text-base break-all font-semibold transition-colors">
                                {generatedQr.url}
                            </a>
                        </div>

                        <button 
                            onClick={handleDownload}
                            className="relative overflow-hidden bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_15px_30px_rgba(255,255,255,0.15)] group z-10 w-full sm:w-auto justify-center"
                        >
                            <div className="absolute inset-0 bg-white/20 dark:bg-slate-900/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                            <FileDown className="w-6 h-6 group-hover:-translate-y-1 transition-transform duration-300" /> 
                            <span className="relative z-10 text-lg">Download High-Res</span>
                        </button>
                    </div>
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
                            <img src="/chicken-logo.png?v=2" alt="Chicken Extension" className="h-20 object-contain drop-shadow-md" />
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
                                    <img src="/chicken-logo.png?v=2" alt="Logo" className="w-full h-full object-contain drop-shadow-sm" />
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
