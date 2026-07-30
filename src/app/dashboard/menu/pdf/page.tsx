"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { 
  Printer, 
  ChevronLeft, 
  Sparkles, 
  Eye, 
  EyeOff, 
  QrCode as QrIcon, 
  Utensils, 
  Download,
  Palette,
  Columns,
  Loader2,
  CheckCircle2,
  Sliders,
  Type,
  FileText
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
  const searchParams = useSearchParams();
  const asUserId = searchParams.get("asUserId");

  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [profile, setProfile] = useState<any>(null);

  // Customization State
  const [template, setTemplate] = useState<"luxury" | "bistro" | "emerald" | "classic">("luxury");
  const [columns, setColumns] = useState<1 | 2 | 3>(2);
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");
  const [showImages, setShowImages] = useState(true);
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [showBadges, setShowBadges] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);
  const [showPrices, setShowPrices] = useState(true);
  const [showBusinessInfo, setShowBusinessInfo] = useState(true);

  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [asUserId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const itemsUrl = asUserId ? `/api/menu/view?asUserId=${asUserId}` : "/api/menu/view";
      const profileUrl = "/api/profile";

      const [itemsRes, profileRes] = await Promise.all([
        fetch(itemsUrl),
        fetch(profileUrl)
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
      console.error("Failed to load menu data", err);
    } finally {
      setLoading(false);
    }
  };

  // Group items by category
  const categories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; items: MenuItem[] }>();

    items.forEach((item) => {
      if (item.isActive === false) return;
      const catName = item.category?.name || "General Menu";
      const catId = item.category?.id || "general";

      if (!map.has(catId)) {
        map.set(catId, { id: catId, name: catName, items: [] });
      }
      map.get(catId)!.items.push(item);
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  // 🚀 DIRECT AUTO DOWNLOAD PDF
  const handleAutoDownloadPdf = async () => {
    const el = document.getElementById("pdf-menu-card-canvas");
    if (!el) return;

    setDownloadingPdf(true);
    try {
      // Import html2pdf dynamically
      const html2pdf = (await import("html2pdf.js")).default;
      
      const fileName = `${(profile?.businessName || "Restaurant").replace(/[^a-[#a-zA-Z0-9]/g, "_")}_Menu_Card.pdf`;
      
      const opt = {
        margin: [8, 8, 8, 8],
        filename: fileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          letterRendering: true,
          allowTaint: true
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] }
      };

      await html2pdf().set(opt).from(el).save();
    } catch (err) {
      console.error("Direct PDF Generation error", err);
      // Fallback to native print if html2pdf fails
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const menuUrl = profile?.userId ? `https://billing.kravy.in/menu/${profile.userId}` : "https://kravy.in";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
          <p className="text-xs font-bold text-slate-500">Loading Menu Catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-24 font-sans">
      {/* ── TOP CONTROL BAR (Hidden during print) ── */}
      <header className="print:hidden sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 p-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => router.back()}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all text-slate-300 border border-slate-700"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white">PDF Menu Card Studio</h1>
                <span className="px-2 py-0.5 rounded-full text-[0.6rem] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  HD Export
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Export beautiful multi-column restaurant menu cards in 1-Click</p>
            </div>
          </div>

          {/* Quick Toolbar Controls */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
            {/* Template Selector */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700">
              <button
                onClick={() => setTemplate("luxury")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  template === "luxury" ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" : "text-slate-400 hover:text-white"
                }`}
              >
                👑 Royal Gold
              </button>
              <button
                onClick={() => setTemplate("bistro")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  template === "bistro" ? "bg-rose-600 text-white shadow-md shadow-rose-600/20" : "text-slate-400 hover:text-white"
                }`}
              >
                🍕 Modern Bistro
              </button>
              <button
                onClick={() => setTemplate("emerald")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  template === "emerald" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "text-slate-400 hover:text-white"
                }`}
              >
                🌿 Emerald
              </button>
              <button
                onClick={() => setTemplate("classic")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  template === "classic" ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                📜 Fine Vintage
              </button>
            </div>

            {/* Column Layout */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700">
              {[1, 2, 3].map((col) => (
                <button
                  key={col}
                  onClick={() => setColumns(col as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    columns === col ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {col} Col
                </button>
              ))}
            </div>

            {/* Font Size */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700">
              <button
                onClick={() => setFontSize("sm")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold ${fontSize === "sm" ? "bg-slate-700 text-white" : "text-slate-400"}`}
              >
                Small
              </button>
              <button
                onClick={() => setFontSize("md")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold ${fontSize === "md" ? "bg-slate-700 text-white" : "text-slate-400"}`}
              >
                Normal
              </button>
              <button
                onClick={() => setFontSize("lg")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold ${fontSize === "lg" ? "bg-slate-700 text-white" : "text-slate-400"}`}
              >
                Large
              </button>
            </div>

            {/* Toggles */}
            <button
              onClick={() => setShowImages(!showImages)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                showImages ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {showImages ? <Eye size={14} /> : <EyeOff size={14} />} Photos
            </button>

            <button
              onClick={() => setShowQrCode(!showQrCode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                showQrCode ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              <QrIcon size={14} /> QR Code
            </button>

            {/* 🚀 DIRECT 1-CLICK DOWNLOAD BUTTON */}
            <button
              onClick={handleAutoDownloadPdf}
              disabled={downloadingPdf}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-black font-black text-xs rounded-2xl shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 size={16} className="animate-spin text-black" /> Generating PDF...
                </>
              ) : (
                <>
                  <Download size={16} /> Direct Download PDF ⬇️
                </>
              )}
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Printer size={15} /> Print
            </button>
          </div>
        </div>
      </header>

      {/* ── CANVAS DISPLAY PREVIEW CONTAINER ── */}
      <div className="max-w-5xl mx-auto my-8 px-4 print:p-0 print:m-0 print:max-w-none">
        <div
          id="pdf-menu-card-canvas"
          ref={printAreaRef}
          className={`rounded-3xl print:rounded-none p-8 md:p-12 print:p-6 transition-all min-h-[1100px] shadow-2xl print:shadow-none relative ${
            template === "luxury"
              ? "bg-[#0c0804] text-[#f4e8c1] border border-[#3b2711]"
              : template === "bistro"
              ? "bg-white text-slate-900 border border-slate-200"
              : template === "emerald"
              ? "bg-[#041e17] text-[#d1fae5] border border-[#065f46]"
              : "bg-[#fdfbf7] text-[#2c221e] border border-[#e5dec9]"
          }`}
        >
          {/* HEADER DECORATION & BRANDING */}
          <div className={`text-center border-b pb-8 mb-8 relative ${
            template === "luxury"
              ? "border-[#3b2711]"
              : template === "emerald"
              ? "border-[#065f46]"
              : template === "classic"
              ? "border-[#e5dec9]"
              : "border-slate-200"
          }`}>
            {showBusinessInfo && (
              <>
                {profile?.logoUrl || profile?.profileImageUrl ? (
                  <div className="w-24 h-24 mx-auto mb-4 relative rounded-full overflow-hidden border-2 shadow-xl border-amber-500/40">
                    <Image
                      src={profile.logoUrl || profile.profileImageUrl}
                      alt={profile.businessName || "Restaurant"}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center text-3xl shadow-lg ${
                    template === "luxury"
                      ? "bg-gradient-to-br from-amber-500 to-amber-700 text-black"
                      : template === "emerald"
                      ? "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white"
                      : template === "bistro"
                      ? "bg-gradient-to-br from-rose-500 to-rose-700 text-white"
                      : "bg-[#3c2a21] text-[#fdfbf7]"
                  }`}>
                    <Utensils size={36} />
                  </div>
                )}

                <h1 className={`text-3xl md:text-5xl font-black uppercase tracking-tight leading-none mb-2 ${
                  template === "luxury"
                    ? "font-[Syne] text-transparent bg-clip-text bg-gradient-to-r from-[#f7e39c] via-[#d4a353] to-[#e6b85c]"
                    : template === "emerald"
                    ? "text-[#6ee7b7]"
                    : template === "classic"
                    ? "font-serif text-[#3c2a21]"
                    : "text-slate-900"
                }`}>
                  {profile?.businessName || "Restaurant Menu"}
                </h1>

                {profile?.businessTagLine && (
                  <p className={`text-xs md:text-sm font-semibold italic mt-1 ${
                    template === "luxury"
                      ? "text-[#d4a353]/90"
                      : template === "emerald"
                      ? "text-emerald-300/80"
                      : template === "classic"
                      ? "text-[#6e5849]"
                      : "text-slate-500"
                  }`}>
                    “{profile.businessTagLine}”
                  </p>
                )}

                <div className={`flex flex-wrap items-center justify-center gap-4 text-xs font-bold mt-4 ${
                  template === "luxury"
                    ? "text-[#f4e8c1]/75"
                    : template === "emerald"
                    ? "text-emerald-200/70"
                    : template === "classic"
                    ? "text-[#6e5849]"
                    : "text-slate-600"
                }`}>
                  {profile?.contactPersonPhone && <span>📞 {profile.contactPersonPhone}</span>}
                  {profile?.businessAddress && <span>📍 {profile.businessAddress}</span>}
                  {profile?.fssaiNumber && <span>🛡️ FSSAI: {profile.fssaiNumber}</span>}
                </div>
              </>
            )}

            {/* QR CODE OVERLAY BANNER */}
            {showQrCode && (
              <div className={`absolute top-0 right-0 hidden sm:flex flex-col items-center gap-1.5 p-3 rounded-2xl border shadow-lg print:flex ${
                template === "luxury"
                  ? "bg-[#181109] border-[#3b2711]"
                  : template === "emerald"
                  ? "bg-[#092d23] border-[#065f46]"
                  : template === "classic"
                  ? "bg-[#f5efe3] border-[#e5dec9]"
                  : "bg-white border-slate-200"
              }`}>
                <div className="p-1.5 bg-white rounded-xl shadow-sm">
                  <QRCode value={menuUrl} size={70} />
                </div>
                <span className="text-[0.65rem] font-black uppercase tracking-wider opacity-80">
                  Scan to Order 📱
                </span>
              </div>
            )}
          </div>

          {/* MENU CATEGORIES CONTENT */}
          {categories.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold">
              No menu items available. Please add products in Menu Editor!
            </div>
          ) : (
            <div className="space-y-10">
              {categories.map((cat) => (
                <section key={cat.id} className="break-inside-avoid">
                  {/* Category Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className={`text-lg md:text-2xl font-black uppercase tracking-wider ${
                      template === "luxury"
                        ? "text-[#f7e39c] border-b-2 border-[#d4a353]/60 pb-1"
                        : template === "emerald"
                        ? "text-[#6ee7b7] border-b-2 border-emerald-500/60 pb-1"
                        : template === "classic"
                        ? "font-serif text-[#3c2a21] border-b-2 border-[#3c2a21] pb-1"
                        : "text-slate-900 border-b-2 border-rose-600 pb-1"
                    }`}>
                      {cat.name}
                    </h2>
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                      template === "luxury"
                        ? "bg-[#281a0b] text-[#d4a353]"
                        : template === "emerald"
                        ? "bg-[#0f4d3c] text-emerald-300"
                        : template === "classic"
                        ? "bg-[#e5dec9] text-[#3c2a21]"
                        : "bg-rose-50 text-rose-600"
                    }`}>
                      {cat.items.length}
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
                          className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 break-inside-avoid ${
                            template === "luxury"
                              ? "bg-[#160f09] border-[#2d1e0e]"
                              : template === "emerald"
                              ? "bg-[#092d23] border-[#0a4234]"
                              : template === "classic"
                              ? "bg-[#f5efe3] border-[#e8dfc9]"
                              : "bg-white border-slate-100 shadow-sm"
                          }`}
                        >
                          {/* Item Thumbnail Photo */}
                          {showImages && (
                            <div className="w-16 h-16 shrink-0 relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                              {item.imageUrl ? (
                                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center opacity-40">
                                  <Utensils size={20} />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Item Text & Price */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {/* Veg / NonVeg Badge */}
                                {showBadges && (
                                  <div className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center shrink-0 ${
                                    item.isVeg ? "border-green-600 bg-green-950/20" : item.isEgg ? "border-amber-500 bg-amber-950/20" : "border-red-600 bg-red-950/20"
                                  }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                      item.isVeg ? "bg-green-600" : item.isEgg ? "bg-amber-500" : "bg-red-600"
                                    }`} />
                                  </div>
                                )}

                                <h3 className={`font-black leading-snug ${
                                  fontSize === "sm" ? "text-xs" : fontSize === "lg" ? "text-base" : "text-sm"
                                } ${
                                  template === "luxury"
                                    ? "text-[#f4e8c1]"
                                    : template === "emerald"
                                    ? "text-emerald-100"
                                    : template === "classic"
                                    ? "font-serif text-[#2c221e]"
                                    : "text-slate-900"
                                }`}>
                                  {item.name}
                                </h3>

                                {item.isBestseller && (
                                  <span className="text-[0.6rem] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/30">
                                    ★ Bestseller
                                  </span>
                                )}
                              </div>

                              {/* Price Display */}
                              {showPrices && (
                                <span className={`font-black shrink-0 ${
                                  fontSize === "sm" ? "text-xs" : fontSize === "lg" ? "text-base" : "text-sm"
                                } ${
                                  template === "luxury"
                                    ? "text-[#f7e39c]"
                                    : template === "emerald"
                                    ? "text-[#6ee7b7]"
                                    : template === "classic"
                                    ? "text-[#8b4513]"
                                    : "text-rose-600"
                                }`}>
                                  ₹{displayPrice.toFixed(2)}
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            {showDescriptions && item.description && (
                              <p className={`text-[0.7rem] font-medium mt-1 line-clamp-2 leading-relaxed ${
                                template === "luxury"
                                  ? "text-[#f4e8c1]/60"
                                  : template === "emerald"
                                  ? "text-emerald-200/60"
                                  : template === "classic"
                                  ? "text-[#6e5849]"
                                  : "text-slate-500"
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

          {/* FOOTER & GREETING BANNER */}
          <div className={`mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs font-bold ${
            template === "luxury"
              ? "border-[#3b2711] text-[#f4e8c1]/60"
              : template === "emerald"
              ? "border-[#065f46] text-emerald-200/60"
              : template === "classic"
              ? "border-[#e5dec9] text-[#6e5849]"
              : "border-slate-200 text-slate-500"
          }`}>
            <div>
              <p className={`font-extrabold ${
                template === "luxury" ? "text-[#f7e39c]" : template === "emerald" ? "text-[#6ee7b7]" : "text-slate-900"
              }`}>
                {profile?.greetingMessage || "Thank You! Visit Again 🙏"}
              </p>
              <p className="text-[0.65rem] mt-0.5 opacity-70">
                Prices subject to applicable taxes. Digitized & Managed with KravyPOS Smart Billing System.
              </p>
            </div>

            {showQrCode && (
              <div className="flex items-center gap-2.5">
                <div className="p-1 bg-white rounded-lg border shadow-sm">
                  <QRCode value={menuUrl} size={42} />
                </div>
                <div className="text-left text-[0.65rem]">
                  <p className="font-black uppercase">Scan for Digital Menu</p>
                  <p className="opacity-70 truncate max-w-[150px]">{menuUrl}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, nav, sidebar, button {
            display: none !important;
          }
          #pdf-menu-card-canvas {
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
