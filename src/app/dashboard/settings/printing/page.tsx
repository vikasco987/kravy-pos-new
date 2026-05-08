"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
    ArrowLeft, Save, Printer, Eye, Settings, 
    Image as ImageIcon, Type, Phone, MapPin, 
    Hash, User, Users, Percent, MessageSquare, QrCode,
    Receipt, ChefHat, Clock, FileText, Check, Zap, MoreVertical
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { kravy } from "@/lib/sounds";
import PrintTemplates from "@/components/printing/PrintTemplates";

export default function PrintingSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [business, setBusiness] = useState<any>(null);
    const [printSettings, setPrintSettings] = useState<any>({
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
        // KOT Settings
        showKOTToken: true,
        showKOTCustomer: true,
        showKOTBillNo: true,
        showKOTInstructions: true,
    });

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
                body: JSON.stringify({ printSettings }),
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
        buyerGSTIN: "07AAAAA0000A1Z5",
        placeOfSupply: "Delhi (07)",
        items: [
            { name: "Paneer Butter Masala", qty: 2, rate: 250, gst: 5 },
            { name: "Butter Naan", qty: 4, rate: 40, gst: 5 },
            { name: "Cold Coffee", qty: 1, rate: 120, gst: 18 }
        ],
        subtotal: 780,
        discountAmt: 50,
        appliedOffer: { code: "WELCOME50" },
        taxActive: true,
        perProductEnabled: true,
        globalRate: 5,
        totalTaxable: 730,
        totalGst: 36.5,
        taxBreakup: [{ rate: 5, taxable: 610, cgst: 15.25, sgst: 15.25, igst: 0 }, { rate: 18, taxable: 120, cgst: 10.8, sgst: 10.8, igst: 0 }],
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
                </div>

                {/* Right: Live Preview */}
                <div className="xl:col-span-4 sticky top-24 space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Live Preview</h2>
                        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                            <div className="px-3 py-1 bg-white dark:bg-white/10 rounded-lg text-[10px] font-black uppercase shadow-sm">Real-time</div>
                        </div>
                    </div>

                    <div className="bg-slate-200/50 dark:bg-black/40 rounded-[2.5rem] p-8 border border-slate-300 dark:border-white/10 shadow-inner flex flex-col items-center gap-10 min-h-[600px] overflow-hidden">
                        
                        {/* THE PREVIEW WRAPPER */}
                        <div className="flex flex-col gap-12 w-full max-w-[280px]">
                            {/* Bill Preview */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Customer Receipt</p>
                                <div className="bg-white p-4 rounded-lg shadow-2xl scale-[0.85] origin-top">
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
