"use client";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Edit3, Check, Sparkles, Coffee, Pizza, Utensils, Zap } from "lucide-react";
import { domToPng } from "modern-screenshot";

interface QRMenuTemplateProps {
    isOpen: boolean;
    onClose: () => void;
    businessName: string;
    qrUrl: string;
    tableId?: string;
    tableName?: string;
}

const QRMenuTemplate: React.FC<QRMenuTemplateProps> = ({ isOpen, onClose, businessName, qrUrl, tableId, tableName }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    
    // Dynamic Fields
    const [customName, setCustomName] = useState(businessName);
    const [tagline, setTagline] = useState("A Place to Feel at Home");
    const [logoEmoji, setLogoEmoji] = useState("☕");
    const [customTableNo, setCustomTableNo] = useState(tableName || "00");
    const [showTableNo, setShowTableNo] = useState(true);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsDownloading(true);
        try {
            const dataUrl = await domToPng(cardRef.current, {
                scale: 3,
                quality: 1,
                features: {
                    // Disable complex features that might cause issues if needed
                    // but modern-screenshot usually handles oklab fine
                }
            });
            const link = document.createElement("a");
            link.download = `${customName}_Table_${customTableNo || "Menu"}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Download failed:", err);
        } finally {
            setIsDownloading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col lg:flex-row gap-8 max-w-5xl w-full"
                >
                    {/* PREVIEW CARD */}
                    <div className="flex-1 flex justify-center items-center py-10">
                        <div 
                            ref={cardRef}
                            style={{
                                background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
                            }}
                            className="relative w-full max-w-[400px] rounded-[32px] p-10 text-center shadow-2xl overflow-hidden border border-white/10"
                        >
                            {/* Inner Glow/Sparkle CSS Logic */}
                            <div className="absolute top-[-60%] left-[-30%] w-[160%] h-[160%] bg-[radial-gradient(circle,rgba(255,200,80,0.08)_0%,transparent_60%)] pointer-events-none" />
                            <div className="absolute top-5 right-6 text-2xl animate-pulse text-yellow-400">✨</div>

                            {/* Header */}
                            <div className="mb-2">
                                <span className="text-5xl block mb-2 drop-shadow-[0_0_12px_rgba(255,200,80,0.6)] animate-bounce">{logoEmoji}</span>
                                <h1 className="font-playfair text-3xl font-black tracking-widest uppercase mb-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent drop-shadow-sm">
                                    {customName}
                                </h1>
                                <p className="text-[10px] text-white/50 uppercase tracking-[0.3em] font-medium">{tagline}</p>
                            </div>

                            <div className="flex items-center gap-3 my-6">
                                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />
                                <div className="text-yellow-400 text-sm">❋</div>
                                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />
                            </div>

                            <div className="text-[11px] font-black text-white/70 uppercase tracking-[0.2em] mb-5">📱 Scan to View Our Menu</div>

                            {/* QR Section */}
                            <div className="relative inline-block mb-6">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] border-2 border-yellow-400/30 rounded-full animate-ping pointer-events-none" />
                                <div className="bg-white rounded-3xl p-4 shadow-[0_0_40px_rgba(255,165,0,0.2)] relative z-10 border-4 border-yellow-400/20">
                                    {/* Corner Accents */}
                                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-yellow-400 rounded-tl-xl" />
                                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-yellow-400 rounded-tr-xl" />
                                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-yellow-400 rounded-bl-xl" />
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-yellow-400 rounded-br-xl" />
                                    <img src={qrUrl} alt="Menu QR" className="w-[200px] h-[200px] rounded-xl" />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-full py-2.5 px-6 mb-6 inline-flex items-center gap-2 mx-auto">
                                <span className="text-lg">📷</span>
                                <span className="text-[10px] text-white/90 font-bold uppercase tracking-widest">Point camera to order</span>
                            </div>

                            {/* Features */}
                            <div className="grid grid-cols-4 gap-4 mb-8">
                                {[
                                    { i: "🍵", l: "CHAI" },
                                    { i: "🍕", l: "PIZZA" },
                                    { i: "🍜", l: "SNACKS" },
                                    { i: "🍽️", l: "THALI" }
                                ].map((f, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1 opacity-60">
                                        <span className="text-xl">{f.i}</span>
                                        <span className="text-[7px] font-black text-white/50 tracking-tighter">{f.l}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />

                            <div className="text-[9px] text-white/30 tracking-widest uppercase">
                                Powered by <span className="text-yellow-400/60 font-black">{customName}</span> {showTableNo && `• Table ${customTableNo}`}
                            </div>
                        </div>
                    </div>

                    {/* EDITOR SIDEBAR */}
                    <div className="w-full lg:w-[400px] bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col shadow-2xl h-fit self-center">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">QR Template Editor</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Customize your menu card</p>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6 flex-1">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Restaurant Name</label>
                                <input 
                                    type="text" 
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Table Number</label>
                                    <input 
                                        type="text" 
                                        value={customTableNo}
                                        onChange={(e) => setCustomTableNo(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                                        placeholder="e.g. 01"
                                    />
                                </div>
                                <div className="flex flex-col justify-end">
                                    <button 
                                        onClick={() => setShowTableNo(!showTableNo)}
                                        className={`h-11 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${showTableNo ? "bg-yellow-400 border-yellow-400 text-slate-900 shadow-lg shadow-yellow-400/10" : "bg-slate-800 border-slate-700 text-slate-400"}`}
                                    >
                                        {showTableNo ? "Hide Table" : "Show Table"}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Slogan / Tagline</label>
                                <input 
                                    type="text" 
                                    value={tagline}
                                    onChange={(e) => setTagline(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Logo Emoji</label>
                                <div className="flex gap-2">
                                    {["☕", "🍔", "🍕", "🥘", "🍦", "🍗"].map(e => (
                                        <button 
                                            key={e}
                                            onClick={() => setLogoEmoji(e)}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${logoEmoji === e ? "bg-yellow-400 shadow-lg shadow-yellow-400/20 scale-110" : "bg-slate-800 hover:bg-slate-700"}`}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-10 flex flex-col gap-3">
                            <button 
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="w-full h-14 bg-yellow-400 text-slate-900 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-yellow-400/10 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                {isDownloading ? "Generating Image..." : <><Download size={18} /> Download Menu Card</>}
                            </button>
                            <button 
                                onClick={onClose}
                                className="w-full h-12 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
                            >
                                Close Editor
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default QRMenuTemplate;
