"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import {
    QrCode,
    Link as LinkIcon,
    Download,
    Share2,
    UtensilsCrossed,
    Smartphone,
    Table as TableIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { kravy } from "@/lib/sounds";

type MenuItem = {
    id: string;
    name: string;
    price: number | null;
    sellingPrice: number | null;
    category?: { name: string };
    imageUrl?: string | null;
    isVeg?: boolean;
};

type BusinessProfile = {
    businessName: string;
    logoUrl?: string;
};

export default function QROrdersPage() {
    const { userId } = useAuth();

    // Data states
    const [items, setItems] = useState<MenuItem[]>([]);
    const [profile, setProfile] = useState<BusinessProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // QR Configuration
    const [tableId, setTableId] = useState("");
    const qrRef = useRef<HTMLDivElement>(null);

    // Fetch REAL menu and profile
    useEffect(() => {
        async function fetchRealData() {
            try {
                const [menuRes, profileRes] = await Promise.all([
                    fetch("/api/menu/items"),
                    fetch("/api/profile")
                ]);

                if (menuRes.ok) {
                    const data = await menuRes.json();
                    setItems(Array.isArray(data) ? data : []); // Items come from /api/menu/items directly
                }

                if (profileRes.ok) {
                    const pData = await profileRes.json();
                    setProfile(pData);
                }
            } catch (err) {
                console.error("Failed to fetch real data:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchRealData();
    }, []);

    // Generate Final URL
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const publicMenuUrl = userId ? `${baseUrl}/menu/${userId}${tableId ? `?tableId=${encodeURIComponent(tableId)}` : ""}` : "";

    const handleCopyLink = () => {
        navigator.clipboard.writeText(publicMenuUrl);
        kravy.success();
        toast.success("Public menu link copied to clipboard!");
    };

    const handleDownloadQR = () => {
        if (!qrRef.current) return;
        const svg = qrRef.current.querySelector("svg");
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width + 80;
            canvas.height = img.height + 120;
            if (ctx) {
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 40, 40);

                // Add text
                ctx.fillStyle = "black";
                ctx.font = "bold 24px Arial";
                ctx.textAlign = "center";
                const bname = profile?.businessName || "Our Menu";
                ctx.fillText(bname, canvas.width / 2, 30);

                if (tableId) {
                    ctx.font = "bold 18px Arial";
                    ctx.fillText(`Table: ${tableId}`, canvas.width / 2, canvas.height - 20);
                } else {
                    ctx.font = "bold 18px Arial";
                    ctx.fillText(`Scan to Order`, canvas.width / 2, canvas.height - 20);
                }
            }

            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `QR_${profile?.businessName || 'Menu'}${tableId ? `_Table_${tableId}` : ''}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    const handleSaveQR = async () => {
        if (!tableId.trim()) {
            kravy.error();
            toast.error("Please enter a table name to save.");
            return;
        }
        try {
            const res = await fetch("/api/tables", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: tableId.trim() }),
            });
            if (!res.ok) throw new Error(await res.text());
            kravy.success();
            toast.success(`QR code for table "${tableId}" saved successfully!`);
            setTableId(""); // clear input
        } catch (err) {
            console.error(err);
            kravy.error();
            toast.error("Failed to save QR code.");
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <p className="text-slate-500 animate-pulse">Loading real menu and QR setup...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-6 transition-colors">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-[var(--kravy-text-primary)] tracking-tight">QR Menu Builder</h1>
                    <p className="text-[var(--kravy-text-muted)] mt-1 font-medium">Generate table-wise QR codes & view your live public menu.</p>
                </div>
                <Button
                    onClick={() => window.location.href = '/dashboard/tables'}
                    className="bg-[var(--kravy-brand)] hover:bg-indigo-700 text-white rounded-2xl px-8 py-6 font-black flex items-center gap-3 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all w-full md:w-auto"
                >
                    <TableIcon className="w-5 h-5" />
                    View All QR Codes
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT: QR CODE MAKER */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-[var(--kravy-surface)] rounded-[32px] border border-[var(--kravy-border)] p-8 shadow-xl">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--kravy-brand)]/10 flex items-center justify-center">
                                <QrCode className="w-6 h-6 text-[var(--kravy-brand)]" />
                            </div>
                            <h2 className="text-xl font-black text-[var(--kravy-text-primary)] tracking-tight">Create QR Code</h2>
                        </div>

                        <div className="space-y-4 mb-8">
                            <label className="block text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest ml-1">Table Number (Optional)</label>
                            <div className="relative">
                                <TableIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--kravy-text-muted)] w-5 h-5" />
                                <Input
                                    type="text"
                                    placeholder="e.g. 05, VIP-1, T-12..."
                                    className="pl-14 py-7 bg-[var(--kravy-bg-2)] border-[var(--kravy-border)] rounded-2xl text-xl font-black text-[var(--kravy-text-primary)] focus:ring-4 focus:ring-[var(--kravy-brand)]/10 transition-all placeholder:font-normal placeholder:opacity-40"
                                    value={tableId}
                                    onChange={(e) => setTableId(e.target.value)}
                                />
                            </div>
                            <p className="text-sm text-[var(--kravy-text-muted)] ml-1">Leaving this blank creates a generic "Express Order" QR code.</p>
                        </div>

                        {/* DISPLAY QR */}
                        <div className="bg-[var(--kravy-bg-2)]/50 border-2 border-dashed border-[var(--kravy-border)] rounded-[40px] p-10 flex flex-col items-center justify-center relative">
                            <p className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest mb-8">{profile?.businessName || "Your Menu"}</p>

                            <div
                                ref={qrRef}
                                className="bg-white p-6 rounded-[32px] shadow-2xl border border-black/5 mb-8 transition-transform hover:scale-105 duration-300 ring-8 ring-white/10"
                            >
                                {publicMenuUrl ? (
                                    <QRCode value={publicMenuUrl} size={200} />
                                ) : (
                                    <div className="w-[200px] h-[200px] bg-slate-50 flex items-center justify-center rounded-2xl">
                                        <QrCode className="w-16 h-16 text-slate-200" />
                                    </div>
                                )}
                            </div>

                            {tableId ? (
                                <div className="px-6 py-2 bg-[var(--kravy-brand)]/10 border border-[var(--kravy-brand)]/20 rounded-full">
                                    <p className="font-black text-[var(--kravy-brand)] text-xs tracking-widest uppercase">TABLE {tableId}</p>
                                </div>
                            ) : (
                                <div className="px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                    <p className="font-black text-emerald-500 text-xs tracking-widest uppercase">LIVE MENU</p>
                                </div>
                            )}
                        </div>

                        {/* ACTIONS */}
                        <div className="flex flex-col gap-3 mt-8">
                            <Button
                                onClick={handleDownloadQR}
                                className="w-full bg-[var(--kravy-brand)] hover:bg-indigo-700 text-white rounded-2xl py-7 font-black flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                            >
                                <Download className="w-5 h-5" />
                                DOWNLOAD PNG
                            </Button>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    onClick={handleCopyLink}
                                    variant="outline"
                                    className="border-2 border-[var(--kravy-border)] bg-[var(--kravy-bg-2)]/30 hover:bg-[var(--kravy-brand)]/10 hover:border-[var(--kravy-brand)]/30 text-[var(--kravy-text-muted)] hover:text-[var(--kravy-brand)] rounded-2xl py-7 font-black flex items-center justify-center gap-2 transition-all"
                                >
                                    <LinkIcon className="w-5 h-5 text-[var(--kravy-brand)]" />
                                    COPY URL
                                </Button>
                                <Button
                                    onClick={handleSaveQR}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-7 font-black flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
                                >
                                    <QrCode className="w-5 h-5" />
                                    SAVE QR
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: REAL MENU PREVIEW */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-[var(--kravy-surface)] rounded-[32px] border border-[var(--kravy-border)] p-8 shadow-xl h-full max-h-[900px] flex flex-col">
                        <div className="flex items-center justify-between mb-8 pb-8 border-b border-[var(--kravy-border)]">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-[20px] bg-emerald-500/10 flex items-center justify-center shadow-inner">
                                    <Smartphone className="w-7 h-7 text-emerald-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-[var(--kravy-text-primary)] tracking-tight">Live Menu View</h2>
                                    <p className="text-xs text-[var(--kravy-text-muted)] font-black uppercase tracking-widest mt-1">Real-time Customer Preview</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => window.open(publicMenuUrl, '_blank')}
                                variant="outline"
                                className="rounded-2xl px-6 h-12 text-sm font-black border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white shadow-xl shadow-emerald-500/10 transition-all"
                            >
                                <Share2 className="w-4 h-4 mr-2" />
                                OPEN PREVIEW
                            </Button>
                        </div>

                        {/* REAL ITEMS PREVIEW */}
                        {items.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                                <div className="w-24 h-24 bg-[var(--kravy-bg-2)]/50 rounded-full flex items-center justify-center mb-6 border border-dashed border-[var(--kravy-border)]">
                                    <UtensilsCrossed className="w-10 h-10 text-[var(--kravy-text-muted)] opacity-50" />
                                </div>
                                <h3 className="text-xl font-black text-[var(--kravy-text-primary)]">Your Menu is Empty</h3>
                                <p className="text-sm text-[var(--kravy-text-muted)] mt-3 max-w-sm leading-relaxed">
                                    Items from your Menus section will appear here for customers scanning your QR codes.
                                </p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2 pb-6">
                                {items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-5 bg-[var(--kravy-bg-2)]/40 p-5 rounded-[24px] border border-[var(--kravy-border)] hover:bg-[var(--kravy-bg-2)]/60 transition-colors">
                                        <div className="w-20 h-20 rounded-2xl bg-[var(--kravy-surface)] flex-shrink-0 overflow-hidden relative shadow-lg ring-1 ring-black/5">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-indigo-500/5">
                                                    <UtensilsCrossed className="w-8 h-8 text-indigo-500/20" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-4 h-4 rounded-[4px] border border-[var(--kravy-border)] bg-[var(--kravy-surface)] flex items-center justify-center shadow-sm">
                                                    <div className={`w-2 h-2 rounded-full ${item.isVeg !== false ? 'bg-emerald-500' : 'bg-rose-500 shadow-rose-500/50 shadow-md'}`}></div>
                                                </div>
                                                <h4 className="font-black text-[var(--kravy-text-primary)] text-lg truncate tracking-tight">{item.name}</h4>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <p className="text-lg font-black text-[var(--kravy-brand)] tracking-tight">₹{item.sellingPrice || item.price || 0}</p>
                                                {item.category?.name && (
                                                    <span className="text-[10px] uppercase tracking-widest font-black text-[var(--kravy-text-muted)] bg-[var(--kravy-bg-2)] px-2.5 py-1 rounded-lg border border-[var(--kravy-border)]">
                                                        {item.category.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
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
