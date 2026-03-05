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

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <p className="text-slate-500 animate-pulse">Loading real menu and QR setup...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">QR Menu Builder</h1>
                    <p className="text-slate-500 mt-1 font-medium">Generate table-wise QR codes & view your live public menu.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT: QR CODE MAKER */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                                <QrCode className="w-5 h-5 text-indigo-600" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900">Create QR Code</h2>
                        </div>

                        <div className="space-y-4 mb-8">
                            <label className="block text-sm font-bold text-slate-700">Table Number (Optional)</label>
                            <div className="relative">
                                <TableIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <Input
                                    type="text"
                                    placeholder="e.g. 05, VIP-1, T-12..."
                                    className="pl-12 py-6 bg-slate-50 border-slate-200 rounded-2xl text-lg font-semibold focus:ring-4 focus:ring-indigo-600/10 transition-all placeholder:font-normal"
                                    value={tableId}
                                    onChange={(e) => setTableId(e.target.value)}
                                />
                            </div>
                            <p className="text-sm text-slate-500">Leaving this blank creates a generic "Express Order" QR code.</p>
                        </div>

                        {/* DISPLAY QR */}
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center relative shadow-inner">
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">{profile?.businessName || "Your Menu"}</p>

                            <div
                                ref={qrRef}
                                className="bg-white p-4 rounded-[20px] shadow-lg border border-slate-100 mb-6 transition-transform hover:scale-105 duration-300"
                            >
                                {publicMenuUrl ? (
                                    <QRCode value={publicMenuUrl} size={180} />
                                ) : (
                                    <div className="w-[180px] h-[180px] bg-slate-100 flex items-center justify-center rounded-xl">
                                        <QrCode className="w-12 h-12 text-slate-300" />
                                    </div>
                                )}
                            </div>

                            {tableId ? (
                                <div className="px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
                                    <p className="font-bold text-indigo-700 text-sm">TABLE - {tableId}</p>
                                </div>
                            ) : (
                                <div className="px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
                                    <p className="font-bold text-emerald-700 text-sm">GENERAL MENU</p>
                                </div>
                            )}
                        </div>

                        {/* ACTIONS */}
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <Button
                                onClick={handleDownloadQR}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-6 font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-600/20 active:scale-95 transition-all"
                            >
                                <Download className="w-5 h-5" />
                                Download QR
                            </Button>
                            <Button
                                onClick={handleCopyLink}
                                variant="outline"
                                className="border-2 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-2xl py-6 font-bold flex items-center justify-center gap-2 transition-all"
                            >
                                <LinkIcon className="w-5 h-5" />
                                Copy URL
                            </Button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: REAL MENU PREVIEW */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm h-full max-h-[800px] flex flex-col">
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                                    <Smartphone className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Live Menu View</h2>
                                    <p className="text-xs text-slate-500 font-medium">This is EXACTLY what customers see.</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => window.open(publicMenuUrl, '_blank')}
                                variant="outline"
                                className="rounded-full text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                            >
                                <Share2 className="w-4 h-4 mr-2" />
                                Open Customer UI
                            </Button>
                        </div>

                        {/* REAL ITEMS PREVIEW */}
                        {items.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <UtensilsCrossed className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Your Menu is Empty</h3>
                                <p className="text-sm text-slate-500 mt-2 max-w-sm">
                                    Add items in the 'Menu' section to see them appear on your public QR ordering page.
                                </p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
                                {items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                        <div className="w-16 h-16 rounded-xl bg-slate-200 flex-shrink-0 overflow-hidden relative">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-indigo-50">
                                                    <UtensilsCrossed className="w-6 h-6 text-indigo-200" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-3 h-3 rounded-sm border border-slate-300 flex items-center justify-center">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg !== false ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                </div>
                                                <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <p className="text-sm font-black text-slate-700">₹{item.sellingPrice || item.price || 0}</p>
                                                {item.category?.name && (
                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
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
        </div >
    );
}
