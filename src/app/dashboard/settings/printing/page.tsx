"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
    ArrowLeft, Save, Printer, Eye, Settings, 
    Image as ImageIcon, Type, Phone, MapPin, 
    Hash, User, Users, Percent, MessageSquare, QrCode,
    Receipt, ChefHat, Clock, FileText, Check, Zap, MoreVertical,
    ChevronDown, ChevronUp, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { kravy } from "@/lib/sounds";
import PrintTemplates from "@/components/printing/PrintTemplates";

// --- Professional Thermal Sizing & Styling Configurations ---
const defaults: any = {
    // Bill Settings
    showLogo: true,
    showTagline: true,
    showContact: true,
    showAddress: true,
    showGST: true,
    showFSSAI: true,
    showToken: true,
    showCustomerDetails: true,
    showTaxBreakup: true,
    showGreetings: true,
    showAmountInWords: true,
    showPaymentStatus: true,
    showFoodTypeSuffix: true,
    // KOT Settings
    showKOTToken: true,
    showKOTCustomer: true,
    showKOTBillNo: true,
    showKOTInstructions: true,
    // QR Settings
    showReviewQR: false,
    
    // Typography Customization Defaults
    paperWidth: "58mm",
    printDensity: "balanced",
    fontFamily: "",
    kotFontFamily: "",
    businessNameSize: 18,
    businessAddressSize: 11,
    taglineSize: 11,
    receiptTokenSize: 28,
    detailsFontSize: 10,
    itemsFontSize: 11,
    totalFontSize: 13,
    greetingFontSize: 12,
    kotTokenSize: 16,
    kotItemsFontSize: 11,
    kotQtyFontSize: 14
};

const TYPOGRAPHY_PRESETS = {
    balanced: {
        businessNameSize: 18,
        businessAddressSize: 11,
        taglineSize: 11,
        receiptTokenSize: 28,
        detailsFontSize: 10,
        itemsFontSize: 11,
        totalFontSize: 13,
        greetingFontSize: 12,
        kotTokenSize: 16,
        kotItemsFontSize: 11,
        kotQtyFontSize: 14,
        fontFamily: "",
        kotFontFamily: ""
    },
    compact: {
        businessNameSize: 14,
        businessAddressSize: 9,
        taglineSize: 9,
        receiptTokenSize: 20,
        detailsFontSize: 8,
        itemsFontSize: 9,
        totalFontSize: 11,
        greetingFontSize: 9,
        kotTokenSize: 12,
        kotItemsFontSize: 9,
        kotQtyFontSize: 11,
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        kotFontFamily: '"Courier New", Courier, monospace'
    },
    bold: {
        businessNameSize: 24,
        businessAddressSize: 13,
        taglineSize: 12,
        receiptTokenSize: 34,
        detailsFontSize: 12,
        itemsFontSize: 13,
        totalFontSize: 16,
        greetingFontSize: 14,
        kotTokenSize: 20,
        kotItemsFontSize: 13,
        kotQtyFontSize: 16,
        fontFamily: 'Georgia, Cambria, "Times New Roman", serif',
        kotFontFamily: '"Courier New", Courier, monospace'
    },
    minimal: {
        businessNameSize: 16,
        businessAddressSize: 10,
        taglineSize: 10,
        receiptTokenSize: 24,
        detailsFontSize: 9,
        itemsFontSize: 10,
        totalFontSize: 12,
        greetingFontSize: 10,
        kotTokenSize: 14,
        kotItemsFontSize: 10,
        kotQtyFontSize: 12,
        fontFamily: '"Trebuchet MS", Helvetica, sans-serif',
        kotFontFamily: '"Courier New", Courier, monospace'
    }
};

const fonts = [
    { name: "Default (System Sans)", value: "", desc: "Clean & fast", safe: true },
    { name: "Courier New / Monospace", value: '"Courier New", Courier, monospace', desc: "Thermal Classic", safe: true },
    { name: "Helvetica / Clean Sans", value: '"Helvetica Neue", Helvetica, Arial, sans-serif', desc: "Modern Sans", safe: true },
    { name: "Verdana / Wide Sans", value: 'Verdana, Geneva, sans-serif', desc: "Broad Sans", safe: true },
    { name: "Georgia / Classic Serif", value: 'Georgia, Cambria, "Times New Roman", serif', desc: "Formal Print", safe: false }
];

export default function PrintingSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [business, setBusiness] = useState<any>(null);
    const [previewGst, setPreviewGst] = useState(true);
    const [showStyling, setShowStyling] = useState(true);
    const [printSettings, setPrintSettings] = useState<any>({ ...defaults });

    const receiptRef = useRef<HTMLDivElement>(null);
    const kotRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch(`/api/profile`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setBusiness(data);
                    if (data.printSettings) {
                        setPrintSettings({
                            ...printSettings,
                            ...data.printSettings
                        });
                    }
                }
            })
            .catch(() => toast.error("Failed to load settings"))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    printSettings,
                    reviewUrl: business.reviewUrl 
                }),
            });
            if (res.ok) {
                kravy.success();
                toast.success("Printing preferences saved!");
            } else {
                toast.error("Failed to save settings");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const toggle = (key: string) => {
        setPrintSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Loading Templates...</p>
        </div>
    );

    // DUMMY DATA FOR PREVIEW
    const dummyProps = {
        receiptRef,
        kotRef,
        business: { ...business, printSettings },
        billNumber: "INV-2024-001",
        billDate: new Date().toLocaleString('en-IN'),
        tokenNumber: "42",
        selectedTable: "Table 05",
        customerName: "Rahul Sharma",
        customerPhone: "9876543210",
        customerAddress: "Flat 101, Green Heights, Delhi",
        orderNotes: "Extra spicy, no onions please!",
        buyerGSTIN: previewGst ? "07AAAAA0000A1Z5" : null,
        placeOfSupply: previewGst ? "Delhi (07)" : null,
        items: [
            { name: "Paneer Butter Masala", qty: 2, rate: 250, gst: previewGst ? 5 : 0 },
            { name: "Butter Naan", qty: 4, rate: 40, gst: previewGst ? 5 : 0 },
            { name: "Cold Coffee", qty: 1, rate: 120, gst: previewGst ? 18 : 0 }
        ],
        subtotal: 780,
        discountAmt: 50,
        appliedOffer: { code: "WELCOME50" },
        taxActive: previewGst,
        perProductEnabled: previewGst,
        globalRate: 5,
        totalTaxable: 730,
        totalGst: previewGst ? 36.5 : 0,
        taxBreakup: previewGst ? [{ rate: 5, taxable: 610, cgst: 15.25, sgst: 15.25, igst: 0 }, { rate: 18, taxable: 120, cgst: 10.8, sgst: 10.8, igst: 0 }] : [],
        deliveryCharge: 0,
        deliveryGst: 0,
        packagingCharge: 20,
        packagingGst: 1,
        serviceCharge: 0,
        finalTotal: 787.5,
        paymentMode: "UPI",
        paymentStatus: "PAID",
        upiTxnRef: "1234567890",
        qrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=test@upi",
        prevWalletBalance: null,
        selectedParty: null,
        kotNumbers: [101, 102],
        numberToWords: (num: number) => "Seven Hundred Eighty Seven Rupees Only"
    };

    const SettingToggle = ({ icon: Icon, label, sKey, desc, color }: any) => (
        <button 
            onClick={() => toggle(sKey)}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                printSettings[sKey] !== false 
                ? "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10" 
                : "bg-slate-50 dark:bg-black/20 border-slate-100 dark:border-white/5 opacity-60"
            }`}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                printSettings[sKey] !== false 
                ? `${color} text-white shadow-lg shadow-current/20` 
                : "bg-slate-200 dark:bg-white/5 text-slate-400"
            }`}>
                <Icon size={18} />
            </div>
            
            <div className="flex-1">
                <h3 className={`text-sm font-bold transition-all ${printSettings[sKey] !== false ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>{label}</h3>
                <p className="text-[10px] text-slate-400 dark:text-white/30 font-bold uppercase tracking-widest mt-0.5 line-clamp-1">{desc}</p>
            </div>

            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                printSettings[sKey] !== false 
                ? "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400" 
                : "bg-white dark:bg-transparent border-slate-200 dark:border-white/10 text-slate-300"
            }`}>
                {printSettings[sKey] !== false ? <Check size={14} strokeWidth={4} /> : null}
            </div>
        </button>
    );

    const Sizer = ({ label, icon: Icon, sKey, min, max, descMap }: any) => {
        const value = printSettings[sKey] !== undefined && printSettings[sKey] !== "" ? Number(printSettings[sKey]) : defaults[sKey];
        
        const getLabel = (val: number) => {
            if (descMap) {
                const keys = Object.keys(descMap).map(Number).sort((a,b) => a-b);
                for (let i = keys.length - 1; i >= 0; i--) {
                    if (val >= keys[i]) return descMap[keys[i]];
                }
            }
            return `${val}px`;
        };

        return (
            <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 flex items-center justify-center">
                            <Icon size={14} />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">{label}</h4>
                            <p className="text-[10px] text-slate-400 font-medium">Range: {min}px - {max}px</p>
                        </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-600 text-xs font-black">
                        {getLabel(value)}
                    </span>
                </div>
                
                <input 
                    type="range" 
                    min={min} 
                    max={max} 
                    value={value} 
                    onChange={(e) => setPrintSettings((prev: any) => ({ ...prev, [sKey]: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-600 focus:outline-none"
                />
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 kravy-page-fade">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div className="flex items-center gap-5">
                    <Link href="/dashboard/settings" className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center hover:scale-110 transition-all shadow-sm">
                        <ArrowLeft size={20} className="text-slate-600 dark:text-white" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Print Customizer</h1>
                        <p className="text-xs text-slate-400 dark:text-white/40 font-bold uppercase tracking-[0.2em] mt-1">Design your Bill & KOT layout</p>
                    </div>
                </div>

                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="h-14 px-10 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-violet-600/20 disabled:opacity-50 transition-all active:scale-95"
                >
                    <Save size={18} />
                    {saving ? "Saving..." : "Save Preferences"}
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start px-4">
                {/* Left: Controls */}
                <div className="xl:col-span-8 space-y-10">
                    
                    {/* Bill Settings */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-4">
                            <div className="w-2 h-2 rounded-full bg-violet-500" />
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Bill (Receipt) Layout</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SettingToggle icon={ImageIcon} label="Business Logo" sKey="showLogo" desc="Your restaurant logo" color="bg-blue-500" />
                            <SettingToggle icon={Type} label="Tagline" sKey="showTagline" desc="Catchy business slogan" color="bg-indigo-500" />
                            <SettingToggle icon={Phone} label="Contact Info" sKey="showContact" desc="Phone numbers & WhatsApp" color="bg-emerald-500" />
                            <SettingToggle icon={MapPin} label="Address" sKey="showAddress" desc="Full store address" color="bg-rose-500" />
                            <SettingToggle icon={Hash} label="GST Number" sKey="showGST" desc="Business GSTIN details" color="bg-amber-500" />
                            <SettingToggle icon={FileText} label="FSSAI Number" sKey="showFSSAI" desc="Food license details" color="bg-orange-500" />
                            <SettingToggle icon={Clock} label="Token Number" sKey="showToken" desc="Order sequence token" color="bg-pink-500" />
                            <SettingToggle icon={User} label="Customer Info" sKey="showCustomerDetails" desc="Name, Phone, Address" color="bg-violet-500" />
                            <SettingToggle icon={Percent} label="Tax Breakup" sKey="showTaxBreakup" desc="GST Rate table" color="bg-cyan-500" />
                            <SettingToggle icon={MessageSquare} label="Greetings" sKey="showGreetings" desc="Thank you message" color="bg-teal-500" />
                            <SettingToggle icon={FileText} label="Amt in Words" sKey="showAmountInWords" desc="Convert total to text" color="bg-slate-500" />
                            <SettingToggle icon={Receipt} label="Payment Info" sKey="showPaymentStatus" desc="Mode & Status" color="bg-blue-600" />
                            <SettingToggle icon={Type} label="Food Type Suffix" sKey="showFoodTypeSuffix" desc="Show (V), (NV) or (R)" color="bg-rose-600" />
                        </div>
                    </div>

                    {/* Financial Settings */}
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center gap-3 px-4">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Financial Summary</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SettingToggle icon={Hash} label="Subtotal" sKey="showSubtotal" desc="Sum before taxes" color="bg-emerald-500" />
                            <SettingToggle icon={Percent} label="Discount" sKey="showDiscount" desc="Offer & coupon lines" color="bg-amber-500" />
                            <SettingToggle icon={FileText} label="Taxable Amount" sKey="showTaxableAmt" desc="Amount liable for tax" color="bg-cyan-500" />
                            <SettingToggle icon={Receipt} label="Total GST" sKey="showTotalTax" desc="Sum of CGST+SGST" color="bg-blue-500" />
                            <SettingToggle icon={MapPin} label="Delivery Fee" sKey="showDeliveryCharges" desc="Shipping/Delivery line" color="bg-indigo-500" />
                            <SettingToggle icon={Hash} label="Packaging" sKey="showPackagingCharges" desc="Container/Packing line" color="bg-violet-500" />
                            <SettingToggle icon={Users} label="Service Charge" sKey="showServiceCharge" desc="Additional service fee" color="bg-rose-500" />
                        </div>
                    </div>

                    {/* Footer Settings */}
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center gap-3 px-4">
                            <div className="w-2 h-2 rounded-full bg-slate-500" />
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Footer & Branding</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SettingToggle icon={MessageSquare} label="Visit Again" sKey="showVisitAgain" desc="Greeting footer line" color="bg-slate-600" />
                            <SettingToggle icon={Zap} label="Powered By" sKey="showPoweredBy" desc="Kravy branding line" color="bg-violet-600" />
                        </div>
                    </div>

                    {/* Separator Settings */}
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center gap-3 px-4">
                            <div className="w-2 h-2 rounded-full bg-slate-500" />
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Layout Separators</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SettingToggle icon={MoreVertical} label="Top Header Line" sKey="sepTop" desc="Divider at the very top" color="bg-slate-500" />
                            <SettingToggle icon={MoreVertical} label="Customer Divider" sKey="sepCustomer" desc="Line after customer info" color="bg-slate-400" />
                            <SettingToggle icon={MoreVertical} label="Items Header Line" sKey="sepItemsHeader" desc="Divider for item column names" color="bg-slate-500" />
                            <SettingToggle icon={MoreVertical} label="Total Top Line" sKey="sepTotalTop" desc="Divider before Grand Total" color="bg-slate-600" />
                            <SettingToggle icon={MoreVertical} label="Total Bottom Line" sKey="sepTotalBottom" desc="Divider after Grand Total" color="bg-slate-700" />
                            <SettingToggle icon={MoreVertical} label="Payment Divider" sKey="sepPayment" desc="Line before payment mode" color="bg-slate-500" />
                            <SettingToggle icon={MoreVertical} label="Footer Divider" sKey="sepFooter" desc="Line before greetings" color="bg-slate-400" />
                            <SettingToggle icon={MoreVertical} label="KOT Note Border" sKey="sepKOTInstructions" desc="Box around chef notes" color="bg-slate-500" />
                        </div>
                    </div>

                    {/* KOT Settings */}
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center gap-3 px-4">
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">KOT (Kitchen) Layout</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SettingToggle icon={Clock} label="KOT Token" sKey="showKOTToken" desc="Token number for chefs" color="bg-rose-500" />
                            <SettingToggle icon={User} label="KOT Customer" sKey="showKOTCustomer" desc="Customer name on KOT" color="bg-orange-500" />
                            <SettingToggle icon={Receipt} label="Bill Reference" sKey="showKOTBillNo" desc="Invoice # on KOT" color="bg-indigo-500" />
                            <SettingToggle icon={Clock} label="Print Time" sKey="showKOTTime" desc="Current time on KOT" color="bg-blue-500" />
                            <SettingToggle icon={ChefHat} label="Instructions" sKey="showKOTInstructions" desc="Chef notes & modifications" color="bg-emerald-500" />
                        </div>
                    </div>

                    {/* QR Code & Digital */}
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center gap-3 px-4">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">QR Code & Digital</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SettingToggle icon={QrCode} label="Feedback QR" sKey="showReviewQR" desc="Scan to review on Google" color="bg-orange-500" />
                        </div>
                        
                        {printSettings.showReviewQR && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mx-4 p-6 rounded-3xl bg-orange-500/5 border border-orange-500/10 space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                                        <QrCode size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white">Review/Feedback URL</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Enter your Google Review or Form link</p>
                                    </div>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="https://g.page/r/your-id/review"
                                    value={business?.reviewUrl || ""}
                                    onChange={(e) => setBusiness({ ...business, reviewUrl: e.target.value })}
                                    className="w-full h-12 px-5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                />
                            </motion.div>
                        )}
                    </div>

                    {/* Typography & Styling Customization Accordion */}
                    <div className="space-y-6 pt-4">
                        <button 
                            onClick={() => setShowStyling(!showStyling)}
                            className="w-full flex items-center justify-between px-4 py-2 hover:opacity-80 transition-all text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-violet-500" />
                                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Typography & Styling</h2>
                            </div>
                            <div className="text-slate-400">
                                {showStyling ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                        </button>

                        {showStyling && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mx-4 p-6 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-8"
                            >
                                {/* Paper Settings Row */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Printer size={12} /> Paper Width & Density
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Paper Width Toggle */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Paper Width</label>
                                            <div className="grid grid-cols-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl gap-1">
                                                <button 
                                                    type="button"
                                                    onClick={() => setPrintSettings((p: any) => ({ ...p, paperWidth: "58mm" }))}
                                                    className={`py-2 rounded-lg text-xs font-black uppercase transition-all ${printSettings.paperWidth !== "80mm" ? 'bg-white dark:bg-white/10 shadow-sm text-violet-600' : 'text-slate-400'}`}
                                                >
                                                    58mm (2" Thermal)
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setPrintSettings((p: any) => ({ ...p, paperWidth: "80mm" }))}
                                                    className={`py-2 rounded-lg text-xs font-black uppercase transition-all ${printSettings.paperWidth === "80mm" ? 'bg-white dark:bg-white/10 shadow-sm text-violet-600' : 'text-slate-400'}`}
                                                >
                                                    80mm (3" Thermal)
                                                </button>
                                            </div>
                                        </div>

                                        {/* Density presets */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Print Density Mode</label>
                                            <div className="grid grid-cols-3 bg-slate-100 dark:bg-white/5 p-1 rounded-xl gap-1">
                                                {(["compact", "balanced", "spacious"] as const).map((mode) => (
                                                    <button 
                                                        key={mode}
                                                        type="button"
                                                        onClick={() => {
                                                            setPrintSettings((p: any) => ({ 
                                                                ...p, 
                                                                printDensity: mode,
                                                                ...TYPOGRAPHY_PRESETS[mode === 'compact' ? 'compact' : mode === 'spacious' ? 'bold' : 'balanced']
                                                            }));
                                                            kravy.success();
                                                            toast.success(`Applied ${mode} presets!`);
                                                        }}
                                                        className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                                                            (printSettings.printDensity === mode || 
                                                            (mode === 'balanced' && !printSettings.printDensity)) 
                                                            ? 'bg-white dark:bg-white/10 shadow-sm text-violet-600' 
                                                            : 'text-slate-400'
                                                        }`}
                                                    >
                                                        {mode}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Typography Presets Row */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Zap size={12} /> Styling Presets
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { id: "balanced", label: "Balanced Standard", desc: "Default layout" },
                                            { id: "compact", label: "Compact POS", desc: "Dense & paper-saving" },
                                            { id: "bold", label: "Restaurant Bold", desc: "High readability" },
                                            { id: "minimal", label: "Minimal Cafe", desc: "Clean modern design" }
                                        ].map((preset) => (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                onClick={() => {
                                                    setPrintSettings((prev: any) => ({
                                                        ...prev,
                                                        printDensity: preset.id === "balanced" ? "balanced" : preset.id === "bold" ? "spacious" : preset.id,
                                                        ...TYPOGRAPHY_PRESETS[preset.id as keyof typeof TYPOGRAPHY_PRESETS]
                                                    }));
                                                    kravy.success();
                                                    toast.success(`Preset "${preset.label}" loaded!`);
                                                }}
                                                className={`p-3 rounded-2xl border text-left transition-all hover:scale-[1.02] ${
                                                    (printSettings.printDensity === preset.id || 
                                                     (preset.id === "balanced" && (printSettings.printDensity === "balanced" || !printSettings.printDensity)))
                                                    ? "bg-violet-600/5 border-violet-500/20 text-violet-600" 
                                                    : "bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-300"
                                                }`}
                                            >
                                                <div className="text-xs font-black uppercase tracking-wider">{preset.label}</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{preset.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Font Selector Row */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Type size={12} /> Typography & Fonts
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Receipt Font */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Receipt/Bill Font Family</label>
                                            <select 
                                                value={printSettings.fontFamily || ""}
                                                onChange={(e) => setPrintSettings((p: any) => ({ ...p, fontFamily: e.target.value }))}
                                                className="h-12 px-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-black focus:ring-2 focus:ring-violet-500 outline-none transition-all cursor-pointer"
                                            >
                                                {fonts.map((f, idx) => (
                                                    <option key={idx} value={f.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs">
                                                        {f.name} {f.safe ? " (✔ Thermal Safe)" : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* KOT Font */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">KOT (Kitchen Slip) Font Family</label>
                                            <select 
                                                value={printSettings.kotFontFamily || ""}
                                                onChange={(e) => setPrintSettings((p: any) => ({ ...p, kotFontFamily: e.target.value }))}
                                                className="h-12 px-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-black focus:ring-2 focus:ring-violet-500 outline-none transition-all cursor-pointer"
                                            >
                                                {fonts.map((f, idx) => (
                                                    <option key={idx} value={f.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs">
                                                        {f.name} {f.safe ? " (✔ Thermal Safe)" : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Slider Grid: Receipt */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-dashed border-slate-200 dark:border-white/10 pb-2">
                                        <Receipt size={12} /> Receipt Element Sizing (Thermal Safe Constrained)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Sizer 
                                            label="Business Name Font Size" 
                                            icon={Type} 
                                            sKey="businessNameSize" 
                                            min={14} 
                                            max={32} 
                                            descMap={{ 14: "Small", 18: "Medium", 24: "Large", 32: "Extra Large" }} 
                                        />
                                        <Sizer 
                                            label="Address Font Size" 
                                            icon={MapPin} 
                                            sKey="businessAddressSize" 
                                            min={8} 
                                            max={16} 
                                            descMap={{ 8: "Very Compact", 11: "Standard", 14: "Highly Readable", 16: "Large" }} 
                                        />
                                        <Sizer 
                                            label="Tagline Font Size" 
                                            icon={Type} 
                                            sKey="taglineSize" 
                                            min={8} 
                                            max={14} 
                                            descMap={{ 8: "Compact", 11: "Standard", 14: "Large" }} 
                                        />
                                        <Sizer 
                                            label="Receipt Token Size" 
                                            icon={Clock} 
                                            sKey="receiptTokenSize" 
                                            min={18} 
                                            max={40} 
                                            descMap={{ 18: "Normal", 28: "Bold Standout", 40: "Giant Block" }} 
                                        />
                                        <Sizer 
                                            label="Items List Font Size" 
                                            icon={Receipt} 
                                            sKey="itemsFontSize" 
                                            min={9} 
                                            max={18} 
                                            descMap={{ 9: "Compact POS", 11: "Standard", 14: "Medium", 18: "Extra Large" }} 
                                        />
                                        <Sizer 
                                            label="Grand Total Font Size" 
                                            icon={Receipt} 
                                            sKey="totalFontSize" 
                                            min={11} 
                                            max={24} 
                                            descMap={{ 11: "Regular", 13: "Standard Highlight", 18: "Bold Large", 24: "Screaming Total" }} 
                                        />
                                        <Sizer 
                                            label="Details & Metadata Size" 
                                            icon={FileText} 
                                            sKey="detailsFontSize" 
                                            min={8} 
                                            max={14} 
                                            descMap={{ 8: "Dense", 10: "Standard", 14: "Large" }} 
                                        />
                                        <Sizer 
                                            label="Greetings Footer Size" 
                                            icon={MessageSquare} 
                                            sKey="greetingFontSize" 
                                            min={9} 
                                            max={18} 
                                            descMap={{ 9: "Compact", 12: "Standard", 18: "Large" }} 
                                        />
                                    </div>
                                </div>

                                {/* Slider Grid: KOT */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-dashed border-slate-200 dark:border-white/10 pb-2">
                                        <ChefHat size={12} /> Kitchen Slip (KOT) Element Sizing
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Sizer 
                                            label="KOT Token Size" 
                                            icon={Clock} 
                                            sKey="kotTokenSize" 
                                            min={12} 
                                            max={28} 
                                            descMap={{ 12: "Regular", 16: "Standard", 28: "Large Block" }} 
                                        />
                                        <Sizer 
                                            label="KOT Items Font Size" 
                                            icon={ChefHat} 
                                            sKey="kotItemsFontSize" 
                                            min={9} 
                                            max={18} 
                                            descMap={{ 9: "Compact", 11: "Standard Mono", 18: "Spacious Large" }} 
                                        />
                                        <Sizer 
                                            label="KOT Quantity Font Size" 
                                            icon={ChefHat} 
                                            sKey="kotQtyFontSize" 
                                            min={10} 
                                            max={22} 
                                            descMap={{ 10: "Standard", 14: "Bold Standout", 22: "Giant Bold" }} 
                                        />
                                    </div>
                                </div>

                                {/* Resets Row */}
                                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        * Element sizing fallbacks are applied automatically when limits are set.
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPrintSettings((p: any) => ({
                                                    ...p,
                                                    businessNameSize: defaults.businessNameSize,
                                                    businessAddressSize: defaults.businessAddressSize,
                                                    taglineSize: defaults.taglineSize,
                                                    receiptTokenSize: defaults.receiptTokenSize,
                                                    detailsFontSize: defaults.detailsFontSize,
                                                    itemsFontSize: defaults.itemsFontSize,
                                                    totalFontSize: defaults.totalFontSize,
                                                    greetingFontSize: defaults.greetingFontSize,
                                                    fontFamily: defaults.fontFamily
                                                }));
                                                kravy.success();
                                                toast.success("Receipt typography reset to default!");
                                            }}
                                            className="h-10 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-transparent text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center gap-2"
                                        >
                                            <RefreshCw size={12} /> Reset Receipt Styling
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPrintSettings((p: any) => ({
                                                    ...p,
                                                    kotTokenSize: defaults.kotTokenSize,
                                                    kotItemsFontSize: defaults.kotItemsFontSize,
                                                    kotQtyFontSize: defaults.kotQtyFontSize,
                                                    kotFontFamily: defaults.kotFontFamily
                                                }));
                                                kravy.success();
                                                toast.success("KOT typography reset to default!");
                                            }}
                                            className="h-10 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-transparent text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center gap-2"
                                        >
                                            <RefreshCw size={12} /> Reset KOT Styling
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Right: Live Preview */}
                <div className="xl:col-span-4 sticky top-24 space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Live Preview</h2>
                        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl gap-1">
                            <button 
                                onClick={() => setPreviewGst(true)}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${previewGst ? 'bg-white dark:bg-white/10 shadow-sm text-violet-600' : 'text-slate-400'}`}
                            >
                                GST
                            </button>
                            <button 
                                onClick={() => setPreviewGst(false)}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${!previewGst ? 'bg-white dark:bg-white/10 shadow-sm text-violet-600' : 'text-slate-400'}`}
                            >
                                Non-GST
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-200/50 dark:bg-black/40 rounded-[2.5rem] p-8 border border-slate-300 dark:border-white/10 shadow-inner flex flex-col items-center gap-10 min-h-[600px] overflow-hidden">
                        
                        {/* THE PREVIEW WRAPPER */}
                        <div 
                            className={`flex flex-col gap-8 w-full transition-all duration-300 border-x-2 border-dashed border-slate-400/20 px-4 relative ${
                                printSettings.paperWidth === '80mm' ? 'max-w-[330px]' : 'max-w-[260px]'
                            }`}
                        >
                            {/* Width Badge Indicator */}
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-violet-600 text-white font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap">
                                {printSettings.paperWidth === '80mm' ? '80mm (3") Printable Width' : '58mm (2") Printable Width'}
                            </div>

                            {/* Bill Preview */}
                            <div className="space-y-3 mt-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Customer Receipt</p>
                                <div className="bg-white p-4 rounded-lg shadow-2xl scale-[0.95] origin-top">
                                   <PrintTemplates {...dummyProps} />
                                   {/* Manual Overrides for CSS to show in preview instead of hidden */}
                                   <style dangerouslySetInnerHTML={{ __html: `
                                        .hidden-print .receipt, .hidden-print .kot { 
                                            display: block !important; 
                                            width: 100% !important;
                                            box-shadow: none !important;
                                            padding: 0 !important;
                                            visibility: visible !important;
                                            opacity: 1 !important;
                                        }
                                        .hidden-print .receipt { margin-bottom: 20px !important; border-bottom: 2px dashed #000; }
                                   `}} />
                                </div>
                            </div>
                            
                            {/* KOT Preview is included in PrintTemplates, the CSS above shows both */}
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Kitchen KOT Above</p>
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-center text-[10px] text-slate-400 font-bold px-10 leading-relaxed uppercase tracking-widest">
                        * Note: Preview might look slightly different from actual 58mm thermal print.
                    </p>
                </div>
            </div>
        </div>
    );
}
