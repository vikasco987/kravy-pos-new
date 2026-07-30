"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Printer, 
  ChevronLeft, 
  LayoutGrid, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Sliders, 
  QrCode as QrIcon, 
  Utensils, 
  Download,
  Palette,
  Columns
} from "lucide-react";
import QRCode from "react-qr-code";

type MenuItem = {
  id: string;
  name: string;
  price?: number | null;
  sellingPrice?: number | null;
  imageUrl?: string | null;
  unit?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  description?: string | null;
  isVeg: boolean;
  isEgg: boolean;
  isBestseller: boolean;
  isRecommended: boolean;
  isNew: boolean;
  spiciness?: string | null;
  isActive?: boolean;
};

type MenuCategory = {
  id: string;
  name: string;
  items: MenuItem[];
};

export default function MenuPdfGeneratorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [profile, setProfile] = useState<any>(null);

  // Styling & Customization Options
  const [template, setTemplate] = useState<"classic" | "luxury" | "modern">("classic");
  const [columns, setColumns] = useState<1 | 2 | 3>(2);
  const [showImages, setShowImages] = useState(true);
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [showBadges, setShowBadges] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);
  const [showPrices, setShowPrices] = useState(true);
  const [accentColor, setAccentColor] = useState<"crimson" | "gold" | "emerald" | "slate">("crimson");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, profileRes] = await Promise.all([
        fetch("/api/menu/view"),
        fetch("/api/profile")
      ]);

      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setItems(Array.isArray(data) ? data : []);
      }

      if (profileRes.ok) {
        const profData = await profileRes.json();
        setProfile(profData);
      }
    } catch (err) {
      console.error("Failed to load data for PDF menu generator", err);
    } finally {
      setLoading(false);
    }
  };

  // Group active items by category
  const categories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; items: MenuItem[] }>();

    items.forEach((item) => {
      if (item.isActive === false) return; // Skip inactive items if specified
      const catName = item.category?.name || "General";
      const catId = item.category?.id || "general";

      if (!map.has(catId)) {
        map.set(catId, { id: catId, name: catName, items: [] });
      }
      map.get(catId)!.items.push(item);
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const handlePrint = () => {
    window.print();
  };

  const getAccentStyles = () => {
    switch (accentColor) {
      case "gold":
        return {
          primary: "text-amber-700 dark:text-amber-400",
          bg: "bg-amber-600",
          border: "border-amber-600",
          gradient: "from-amber-700 to-amber-900",
          lightBg: "bg-amber-50"
        };
      case "emerald":
        return {
          primary: "text-emerald-700 dark:text-emerald-400",
          bg: "bg-emerald-600",
          border: "border-emerald-600",
          gradient: "from-emerald-700 to-emerald-900",
          lightBg: "bg-emerald-50"
        };
      case "slate":
        return {
          primary: "text-slate-800 dark:text-slate-200",
          bg: "bg-slate-900",
          border: "border-slate-800",
          gradient: "from-slate-800 to-slate-950",
          lightBg: "bg-slate-100"
        };
      default: // crimson
        return {
          primary: "text-rose-700 dark:text-rose-400",
          bg: "bg-rose-600",
          border: "border-rose-600",
          gradient: "from-rose-600 to-red-800",
          lightBg: "bg-rose-50"
        };
    }
  };

  const accents = getAccentStyles();
  const menuUrl = profile?.userId ? `https://billing.kravy.in/menu/${profile.userId}` : "https://kravy.in";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-20">
      {/* ── TOP CONTROLS BAR (Hidden during printing) ── */}
      <header className="print:hidden sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all text-slate-700 dark:text-slate-300"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                PDF Menu Card Studio 🖨️
              </h1>
              <p className="text-xs text-slate-500 font-medium">Design & Export high-resolution printable restaurant menu PDF</p>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Template Picker */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setTemplate("classic")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  template === "classic" ? "bg-white dark:bg-slate-900 text-rose-600 shadow-sm" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Classic
              </button>
              <button
                onClick={() => setTemplate("luxury")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  template === "luxury" ? "bg-white dark:bg-slate-900 text-amber-500 shadow-sm" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Luxury Gold
              </button>
              <button
                onClick={() => setTemplate("modern")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  template === "modern" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Modern
              </button>
            </div>

            {/* Column Layout */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setColumns(1)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  columns === 1 ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
                }`}
                title="1 Column Layout"
              >
                1 Col
              </button>
              <button
                onClick={() => setColumns(2)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  columns === 2 ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
                }`}
                title="2 Column Grid"
              >
                2 Col
              </button>
              <button
                onClick={() => setColumns(3)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  columns === 3 ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
                }`}
                title="3 Column Grid"
              >
                3 Col
              </button>
            </div>

            {/* Toggle Chips */}
            <button
              onClick={() => setShowImages(!showImages)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                showImages ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              {showImages ? <Eye size={14} /> : <EyeOff size={14} />} Photos
            </button>

            <button
              onClick={() => setShowQrCode(!showQrCode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                showQrCode ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              <QrIcon size={14} /> QR Code
            </button>

            {/* Print & Download Button */}
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl font-black text-xs shadow-lg shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Printer size={16} /> Download / Save as PDF
            </button>
          </div>
        </div>
      </header>

      {/* ── PRINT DOCUMENT PREVIEW CONTAINER ── */}
      <div className="max-w-5xl mx-auto my-6 px-4 print:p-0 print:m-0 print:max-w-none">
        <div 
          id="pdf-menu-canvas"
          className={`bg-white text-slate-900 rounded-3xl print:rounded-none shadow-2xl print:shadow-none p-8 md:p-12 print:p-6 transition-all min-h-[1050px] ${
            template === "luxury" 
              ? "bg-[#0d0905] text-[#f3e7cb] border border-[#3d2a13]" 
              : template === "modern"
              ? "bg-gradient-to-b from-slate-50 to-white text-slate-900 border border-slate-200"
              : "bg-white text-slate-900 border border-slate-200"
          }`}
        >
          {/* HEADER SECTION */}
          <div className="text-center border-b pb-6 mb-8 relative border-slate-200 dark:border-amber-950/60">
            {profile?.logoUrl || profile?.profileImageUrl ? (
              <div className="w-20 h-20 mx-auto mb-3 relative rounded-full overflow-hidden border-2 border-amber-500/40 shadow-md">
                <Image
                  src={profile.logoUrl || profile.profileImageUrl}
                  alt={profile.businessName || "Restaurant"}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white text-2xl shadow-md">
                <Utensils size={32} />
              </div>
            )}

            <h1 className={`text-3xl md:text-4xl font-black tracking-tight uppercase ${
              template === "luxury" ? "font-[Syne] text-transparent bg-clip-text bg-gradient-to-r from-[#f5d77f] via-[#d4a353] to-[#e6b85c]" : "text-slate-900"
            }`}>
              {profile?.businessName || "Restaurant Menu"}
            </h1>

            {profile?.businessTagLine && (
              <p className={`text-xs md:text-sm font-semibold italic mt-1 ${
                template === "luxury" ? "text-[#d4a353]/80" : "text-slate-500"
              }`}>
                “{profile.businessTagLine}”
              </p>
            )}

            <div className={`flex flex-wrap items-center justify-center gap-3 text-xs font-bold mt-3 ${
              template === "luxury" ? "text-[#f3e7cb]/70" : "text-slate-600"
            }`}>
              {profile?.contactPersonPhone && <span>📞 {profile.contactPersonPhone}</span>}
              {profile?.businessAddress && <span>📍 {profile.businessAddress}</span>}
              {profile?.fssaiNumber && <span>🛡️ FSSAI: {profile.fssaiNumber}</span>}
            </div>

            {/* QR Code Banner */}
            {showQrCode && (
              <div className="absolute top-0 right-0 hidden sm:flex flex-col items-center gap-1 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:flex">
                <div className="p-1 bg-white rounded-lg">
                  <QRCode value={menuUrl} size={64} />
                </div>
                <span className="text-[0.55rem] font-black uppercase text-slate-500 tracking-wider">Scan to Order</span>
              </div>
            )}
          </div>

          {/* MENU CATEGORIES GRID */}
          {categories.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold">
              No active menu items found. Add products in Menu Editor to view your PDF Menu Card!
            </div>
          ) : (
            <div className="space-y-10">
              {categories.map((cat) => (
                <section key={cat.id} className="break-inside-avoid">
                  {/* Category Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className={`text-lg md:text-xl font-black uppercase tracking-wider ${
                      template === "luxury"
                        ? "text-[#f5d77f] border-b-2 border-[#d4a353]/50 pb-1"
                        : "text-slate-900 border-b-2 border-rose-600 pb-1"
                    }`}>
                      {cat.name}
                    </h2>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      template === "luxury" ? "bg-[#3d2a13] text-[#d4a353]" : "bg-slate-100 text-slate-600"
                    }`}>
                      {cat.items.length} items
                    </span>
                  </div>

                  {/* Category Items Grid */}
                  <div className={`grid gap-4 ${
                    columns === 1 
                      ? "grid-cols-1" 
                      : columns === 2 
                      ? "grid-cols-1 md:grid-cols-2" 
                      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  }`}>
                    {cat.items.map((item) => {
                      const displayPrice = item.sellingPrice || item.price || 0;

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-2xl border transition-all flex items-start gap-3 break-inside-avoid ${
                            template === "luxury"
                              ? "bg-[#140e08] border-[#3d2a13]"
                              : "bg-white border-slate-100 shadow-sm"
                          }`}
                        >
                          {/* Item Image */}
                          {showImages && (
                            <div className="w-16 h-16 shrink-0 relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              {item.imageUrl ? (
                                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <Utensils size={20} />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {/* Veg / NonVeg Badge */}
                                {showBadges && (
                                  <div className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center shrink-0 ${
                                    item.isVeg ? "border-green-600" : item.isEgg ? "border-amber-500" : "border-red-600"
                                  }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                      item.isVeg ? "bg-green-600" : item.isEgg ? "bg-amber-500" : "bg-red-600"
                                    }`} />
                                  </div>
                                )}

                                <h3 className={`text-sm font-black truncate ${
                                  template === "luxury" ? "text-[#f3e7cb]" : "text-slate-900"
                                }`}>
                                  {item.name}
                                </h3>

                                {item.isBestseller && (
                                  <span className="text-[0.6rem] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                    ★ Bestseller
                                  </span>
                                )}
                              </div>

                              {/* Price */}
                              {showPrices && (
                                <span className={`text-sm font-black shrink-0 ${
                                  template === "luxury" ? "text-[#f5d77f]" : "text-rose-600"
                                }`}>
                                  ₹{displayPrice.toFixed(2)}
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            {showDescriptions && item.description && (
                              <p className={`text-[0.7rem] font-medium mt-1 line-clamp-2 leading-relaxed ${
                                template === "luxury" ? "text-[#f3e7cb]/60" : "text-slate-500"
                              }`}>
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* FOOTER SECTION */}
          <div className="mt-12 pt-6 border-t border-slate-200 dark:border-amber-950/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs font-bold text-slate-500 dark:text-[#f3e7cb]/60">
            <div>
              <p className="font-extrabold text-slate-700 dark:text-[#f5d77f]">
                {profile?.greetingMessage || "Thank You! Visit Again 🙏"}
              </p>
              <p className="text-[0.65rem] mt-0.5 opacity-70">
                Prices subject to applicable taxes. Powered by KravyPOS Smart Billing System.
              </p>
            </div>

            {showQrCode && (
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white rounded border border-slate-200">
                  <QRCode value={menuUrl} size={40} />
                </div>
                <div className="text-left text-[0.65rem]">
                  <p className="font-black text-slate-900 dark:text-white uppercase">Scan for Digital Menu</p>
                  <p className="text-slate-400 truncate max-w-[150px]">{menuUrl}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PRINT STYLES ── */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, nav, sidebar, button {
            display: none !important;
          }
          #pdf-menu-canvas {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
