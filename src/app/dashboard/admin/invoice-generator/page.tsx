"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Download, 
    Printer, 
    User, 
    Mail, 
    Phone, 
    MapPin, 
    CreditCard, 
    Plus, 
    Trash2,
    FileText,
    Building2,
    Calendar,
    Hash,
    Zap,
    ShieldCheck,
    Loader2,
    History,
    X
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function InvoiceGenerator() {
    const [loading, setLoading] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [fetchingHistory, setFetchingHistory] = useState(false);
    
    const [invoiceData, setInvoiceData] = useState({
        invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toISOString().split('T')[0],
        dueDate: "",
        documentType: "invoice",
        paymentMode: "Online / Bank Transfer",
        customer: {
            name: "",
            phone: "",
            email: "",
            address: "",
            gst: "",
            pincode: "",
            city: "",
            state: ""
        },
        items: [
            { name: "Kravy POS Premium - 1 Year", price: 3999, quantity: 1, discountType: "PERCENTAGE", discountValue: 0 }
        ],
        notes: "Thank you for choosing Kravy POS! Your premium subscription is now active.",
        bankDetails: "Bank Name: YES BANK\nA/C No: 102561900003170\nIFSC Code: YESB0001025\nBranch: Udyog Vihar, Gurgaon",
        termsConditions: "1. Payment is due within 7 days.\n2. Late payment may incur a 1.5% monthly fee.\n3. All disputes are subject to Delhi jurisdiction.",
        bankImage: ""
    });

    // Pincode Auto-fetch
    useEffect(() => {
        if (invoiceData.customer.pincode.length === 6) {
            fetch(`https://api.postalpincode.in/pincode/${invoiceData.customer.pincode}`)
                .then(res => res.json())
                .then(data => {
                    if (data[0].Status === "Success") {
                        const postOffice = data[0].PostOffice[0];
                        setInvoiceData(prev => ({
                            ...prev,
                            customer: {
                                ...prev.customer,
                                city: postOffice.District,
                                state: postOffice.State,
                                address: prev.customer.address || postOffice.Name
                            }
                        }));
                    }
                })
                .catch(err => console.error("Pincode API Error:", err));
        }
    }, [invoiceData.customer.pincode]);

    const addItem = () => {
        setInvoiceData(prev => ({
            ...prev,
            items: [...prev.items, { name: "", price: 0, quantity: 1, discountType: "PERCENTAGE", discountValue: 0 }]
        }));
    };

    const removeItem = (index: number) => {
        setInvoiceData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...invoiceData.items];
        // @ts-ignore
        newItems[index][field] = value;
        setInvoiceData(prev => ({ ...prev, items: newItems }));
    };

    const calculateSubtotal = () => {
        return invoiceData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const calculateDiscount = () => {
        return invoiceData.items.reduce((sum, item) => {
            const rowTotal = item.price * item.quantity;
            if (item.discountType === "PERCENTAGE") {
                return sum + (rowTotal * ((item.discountValue || 0) / 100));
            } else {
                return sum + (item.discountValue || 0);
            }
        }, 0);
    };

    const calculateTotal = () => {
        return calculateSubtotal() - calculateDiscount();
    };

    const handleDownload = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/admin/generate-invoice", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                },
                cache: "no-store",
                body: JSON.stringify({
                    ...invoiceData,
                    customerName: invoiceData.customer.name,
                    customerPhone: invoiceData.customer.phone,
                    customerEmail: invoiceData.customer.email,
                    customerAddress: invoiceData.customer.address,
                    customerDistrict: invoiceData.customer.city,
                    customerState: invoiceData.customer.state,
                    customerPincode: invoiceData.customer.pincode,
                    paymentMode: invoiceData.paymentMode,
                    subtotal: calculateSubtotal(),
                    discount: calculateDiscount(),
                    total: calculateTotal(),
                    taxType: "inclusive"
                })
            });

            // Save to History First
            fetch("/api/admin/manual-invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...invoiceData,
                    customerName: invoiceData.customer.name,
                    customerPhone: invoiceData.customer.phone,
                    customerEmail: invoiceData.customer.email,
                    customerAddress: invoiceData.customer.address,
                    customerDistrict: invoiceData.customer.city,
                    customerState: invoiceData.customer.state,
                    customerPincode: invoiceData.customer.pincode,
                    customerGst: invoiceData.customer.gst,
                    subtotal: calculateSubtotal(),
                    discount: calculateDiscount(),
                    total: calculateTotal()
                })
            }).catch(console.error);

            if (!response.ok) throw new Error("Failed to generate PDF");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Invoice_${invoiceData.invoiceNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            
            toast.success("Invoice Generated Successfully!");
        } catch (err: any) {
            console.error(err);
            toast.error("Download failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        setFetchingHistory(true);
        try {
            const res = await fetch("/api/admin/manual-invoices");
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (e) {
            toast.error("Failed to load history");
        }
        setFetchingHistory(false);
    };

    const handleOpenHistory = () => {
        setShowHistoryModal(true);
        loadHistory();
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black dark:text-white">Manual Invoice Generator</h1>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Create & Download SaaS Invoices</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleOpenHistory}
                            className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 px-6 py-3 rounded-2xl font-bold hover:shadow-lg transition-all"
                        >
                            <History size={16} /> View History
                        </button>
                        <button 
                            onClick={handleDownload}
                            disabled={loading}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
                        >
                            {loading ? <span className="animate-spin text-xl">⚪</span> : <Download size={16} />}
                            Save & Download PDF
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Input Side */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Customer Details */}
                        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-200 dark:border-white/5">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                <User size={14} /> Customer Information
                            </h3>
                            <div className="grid gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Customer / Business Name</label>
                                    <input 
                                        type="text"
                                        placeholder="Full Name"
                                        value={invoiceData.customer.name}
                                        onChange={e => setInvoiceData(prev => ({ ...prev, customer: { ...prev.customer, name: e.target.value } }))}
                                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Phone</label>
                                        <input 
                                            type="text"
                                            placeholder="Mobile Number"
                                            value={invoiceData.customer.phone}
                                            onChange={e => setInvoiceData(prev => ({ ...prev, customer: { ...prev.customer, phone: e.target.value } }))}
                                            className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Pincode</label>
                                        <input 
                                            type="text"
                                            placeholder="6-digit PIN"
                                            maxLength={6}
                                            value={invoiceData.customer.pincode}
                                            onChange={e => setInvoiceData(prev => ({ ...prev, customer: { ...prev.customer, pincode: e.target.value } }))}
                                            className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Complete Address</label>
                                    <textarea 
                                        placeholder="Address Line"
                                        value={invoiceData.customer.address}
                                        onChange={e => setInvoiceData(prev => ({ ...prev, customer: { ...prev.customer, address: e.target.value } }))}
                                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white h-20 resize-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">GSTIN (Optional)</label>
                                    <input 
                                        type="text"
                                        placeholder="07AAAAA0000A1Z5"
                                        value={invoiceData.customer.gst}
                                        onChange={e => setInvoiceData(prev => ({ ...prev, customer: { ...prev.customer, gst: e.target.value.toUpperCase() } }))}
                                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Invoice Items */}
                        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-200 dark:border-white/5">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <CreditCard size={14} /> Bill Items
                                </h3>
                                <button 
                                    onClick={addItem}
                                    className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg hover:bg-indigo-500/20 transition-all"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {invoiceData.items.map((item, index) => (
                                    <div key={index} className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5 relative group">
                                        <button 
                                            onClick={() => removeItem(index)}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                        <div className="grid gap-3">
                                            <input 
                                                type="text"
                                                placeholder="Item / Plan Name"
                                                value={item.name}
                                                onChange={e => updateItem(index, 'name', e.target.value)}
                                                className="w-full bg-transparent border-b border-slate-200 dark:border-white/10 pb-1 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                                            />
                                            <div className="grid grid-cols-4 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black uppercase text-slate-400">Price (₹)</label>
                                                    <input 
                                                        type="number"
                                                        value={item.price}
                                                        onChange={e => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-transparent border-b border-slate-200 dark:border-white/10 pb-1 text-xs font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black uppercase text-slate-400">Qty</label>
                                                    <input 
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                        className="w-full bg-transparent border-b border-slate-200 dark:border-white/10 pb-1 text-xs font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black uppercase text-slate-400">Disc. Type</label>
                                                    <select 
                                                        value={item.discountType || "PERCENTAGE"}
                                                        onChange={e => updateItem(index, 'discountType', e.target.value)}
                                                        className="w-full bg-transparent border-b border-slate-200 dark:border-white/10 pb-1 text-xs font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                                                    >
                                                        <option value="PERCENTAGE">%</option>
                                                        <option value="FLAT">₹ (Flat)</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black uppercase text-slate-400">Disc. Value</label>
                                                    <input 
                                                        type="number"
                                                        value={item.discountValue || 0}
                                                        onChange={e => updateItem(index, 'discountValue', parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-transparent border-b border-slate-200 dark:border-white/10 pb-1 text-xs font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Invoice Metadata */}
                        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-200 dark:border-white/5">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="space-y-1 col-span-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                                        <FileText size={10} /> Document Type
                                    </label>
                                    <select 
                                        value={invoiceData.documentType}
                                        onChange={e => setInvoiceData(prev => ({ ...prev, documentType: e.target.value }))}
                                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                                    >
                                        <option value="invoice">Tax Invoice</option>
                                        <option value="proforma">Proforma Invoice</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                                        <Hash size={10} /> Invoice #
                                    </label>
                                    <input 
                                        type="text"
                                        value={invoiceData.invoiceNumber}
                                        onChange={e => setInvoiceData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                                        <Calendar size={10} /> Date
                                    </label>
                                    <input 
                                        type="date"
                                        value={invoiceData.date}
                                        onChange={e => setInvoiceData(prev => ({ ...prev, date: e.target.value }))}
                                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                                        <Calendar size={10} /> {invoiceData.documentType === 'proforma' ? 'Valid Until' : 'Due Date'}
                                    </label>
                                    <input 
                                        type="date"
                                        value={invoiceData.dueDate}
                                        onChange={e => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1 col-span-3 mt-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                                        <CreditCard size={10} /> Payment Mode (Optional)
                                    </label>
                                    <select 
                                        value={invoiceData.paymentMode}
                                        onChange={e => setInvoiceData(prev => ({ ...prev, paymentMode: e.target.value }))}
                                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                                    >
                                        <option value="">None (Hide from invoice)</option>
                                        <option value="Online / Bank Transfer">Online / Bank Transfer</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="Cheque">Cheque</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Terms & Bank Details */}
                        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-200 dark:border-white/5 space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <ShieldCheck size={14} /> Terms & Bank Details
                            </h3>
                            
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Bank Details</label>
                                <textarea 
                                    value={invoiceData.bankDetails}
                                    onChange={e => setInvoiceData(prev => ({ ...prev, bankDetails: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white h-24 resize-none leading-relaxed"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Bank Image (e.g. Cheque / QR)</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleBankImageUpload}
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                                />
                                {invoiceData.bankImage && (
                                    <div className="mt-2 text-xs font-bold text-emerald-500 flex items-center gap-1">
                                        <ShieldCheck size={14} /> Image Attached
                                        <button onClick={() => setInvoiceData(prev => ({ ...prev, bankImage: "" }))} className="ml-2 text-red-500 underline text-[10px]">Remove</button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Terms & Conditions</label>
                                <textarea 
                                    value={invoiceData.termsConditions}
                                    onChange={e => setInvoiceData(prev => ({ ...prev, termsConditions: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white h-24 resize-none leading-relaxed"
                                />
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">General Notes</label>
                                <textarea 
                                    value={invoiceData.notes}
                                    onChange={e => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white h-16 resize-none leading-relaxed"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preview Side */}
                    <div className="lg:col-span-7">
                        <div className="bg-white rounded-3xl shadow-2xl p-0 overflow-auto sticky top-8 border border-slate-200" style={{ minHeight: '842px' }}>
                            <div id="invoice-capture" className="p-12 text-slate-800 bg-white" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
                                
                                {/* Invoice Header */}
                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                                                <Zap size={18} fill="currentColor" />
                                            </div>
                                            <span className="text-2xl font-black tracking-tighter">KRAVY POS</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                                            Netizen Business Solutions <br />
                                            Narela, Delhi - 110040 <br />
                                            Phone: +91 9289507882 <br />
                                            Email: info@kravy.in
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-4xl font-black text-slate-200 tracking-tighter mb-4">
                                            {invoiceData.documentType === 'proforma' ? 'PROFORMA INVOICE' : 'INVOICE'}
                                        </h2>
                                        <div className="space-y-1">
                                            <p className="text-xs font-black"><span className="text-slate-400 uppercase tracking-widest mr-2">Number:</span> {invoiceData.invoiceNumber}</p>
                                            <p className="text-xs font-black"><span className="text-slate-400 uppercase tracking-widest mr-2">Date:</span> {new Date(invoiceData.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-12 mb-12 pb-12 border-b border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[3px] text-indigo-500 mb-4">Bill To</p>
                                        <h4 className="text-xl font-black mb-2">{invoiceData.customer.name || 'Valued Customer'}</h4>
                                        <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                            {invoiceData.customer.phone} <br />
                                            {invoiceData.customer.email && <>{invoiceData.customer.email} <br /></>}
                                            {invoiceData.customer.address} <br />
                                            {invoiceData.customer.city}, {invoiceData.customer.state} {invoiceData.customer.pincode}
                                        </p>
                                        {invoiceData.customer.gst && (
                                            <div className="mt-4 p-2 bg-slate-50 rounded-lg border border-slate-100 inline-block">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">GSTIN</p>
                                                <p className="text-[10px] font-black">{invoiceData.customer.gst}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col justify-end text-right">
                                        {invoiceData.paymentMode && (
                                            <>
                                                <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-4">Payment Method</p>
                                                <p className="text-xs font-bold text-slate-600">{invoiceData.paymentMode}</p>
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Status: Paid</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Items Table */}
                                <table className="w-full mb-12">
                                    <thead>
                                        <tr className="bg-slate-900 text-white">
                                            <th className="text-left py-4 px-6 rounded-l-2xl text-[10px] font-black uppercase tracking-widest">Description</th>
                                            <th className="text-center py-4 px-6 text-[10px] font-black uppercase tracking-widest">Price</th>
                                            <th className="text-center py-4 px-6 text-[10px] font-black uppercase tracking-widest">Qty</th>
                                            <th className="text-right py-4 px-6 rounded-r-2xl text-[10px] font-black uppercase tracking-widest">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {invoiceData.items.map((item, i) => (
                                            <tr key={i}>
                                                <td className="py-6 px-6">
                                                    <p className="font-black text-sm">{item.name || 'Service Item'}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Subscription Activation</p>
                                                </td>
                                                <td className="py-6 px-6 text-center font-bold text-sm">₹{item.price.toLocaleString()}</td>
                                                <td className="py-6 px-6 text-center font-bold text-sm">{item.quantity}</td>
                                                <td className="py-6 px-6 text-right font-black text-sm">₹{(item.price * item.quantity).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Footer Summary */}
                                <div className="flex justify-between items-start gap-12">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-2">Notes</p>
                                        <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                                            {invoiceData.notes}
                                        </p>
                                    </div>
                                    <div className="w-64 space-y-3">
                                        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            <span>Subtotal</span>
                                            <span>₹{calculateSubtotal().toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            <span>Tax (GST 0%)</span>
                                            <span>₹0</span>
                                        </div>
                                        <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-end">
                                            <span className="text-xs font-black uppercase tracking-[3px]">Total</span>
                                            <span className="text-3xl font-black">₹{calculateSubtotal().toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bank Details & Terms */}
                                <div className="mt-12 flex items-start gap-12 border-t border-slate-100 pt-8">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-[3px] text-indigo-500 mb-2">Bank Details</p>
                                        <p className="text-[10px] font-bold text-slate-600 leading-relaxed whitespace-pre-wrap">
                                            {invoiceData.bankDetails}
                                        </p>
                                        {invoiceData.bankImage && (
                                            <div className="mt-4">
                                                <img src={invoiceData.bankImage} alt="Bank Details" className="h-24 object-contain border border-slate-200 rounded-lg p-1" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-[3px] text-indigo-500 mb-2">Terms & Conditions</p>
                                        <p className="text-[9px] font-bold text-slate-500 leading-relaxed whitespace-pre-wrap">
                                            {invoiceData.termsConditions}
                                        </p>
                                    </div>
                                </div>

                                {/* Stamp / Sign Placeholder */}
                                <div className="mt-12 flex justify-between items-end">
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-300 mb-1">Generated By</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest">Kravy POS System</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-40 h-px bg-slate-900 mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Authorized Signatory</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto border border-white/10">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black dark:text-white">Invoice History</h2>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Manage Past Manual Invoices</p>
                            </div>
                            <button onClick={() => setShowHistoryModal(false)} className="w-10 h-10 bg-slate-100 dark:bg-black/20 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-500">
                                <X size={20} />
                            </button>
                        </div>

                        {fetchingHistory ? (
                            <div className="py-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
                        ) : history.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 font-bold">No invoices found.</div>
                        ) : (
                            <div className="space-y-4">
                                {history.map(inv => (
                                    <div key={inv.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-2xl">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-black dark:text-white">{inv.invoiceNumber}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${inv.documentType === 'proforma' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                    {inv.documentType}
                                                </span>
                                                <button 
                                                    onClick={() => updateStatus(inv.id, inv.status)}
                                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest cursor-pointer hover:opacity-80 transition-opacity ${inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}
                                                >
                                                    {inv.status}
                                                </button>
                                            </div>
                                            <p className="text-xs font-bold text-slate-500">{inv.customerName} • ₹{inv.total.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <button 
                                                onClick={() => redownloadPdf(inv)}
                                                className="w-10 h-10 flex items-center justify-center bg-indigo-500/10 text-indigo-500 rounded-xl hover:bg-indigo-500/20 transition-colors"
                                            >
                                                <Download size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

