"use client";

import React, { useEffect, useState } from "react";
import { Plus, Tag, Trash2, Edit3, Settings, AlertCircle, CheckCircle2, Search, X, Calendar, DollarSign, Percent, Gift, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { calculateDiscount } from "@/lib/discount-utils";

/* ================= TYPES ================= */

type Offer = {
  id: string;
  title: string;
  description?: string;
  code: string;
  discountType: string; // PERCENTAGE, FLAT, BOGO, ITEM_WISE
  discountValue?: number;
  minOrderValue?: number;
  maxDiscount?: number;
  buyItemId?: string;
  buyQty?: number;
  getItemOffId?: string;
  getQty?: number;
  applyOnCategory?: string;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  currentUsage: number;
  isActive: boolean;
};

type Item = {
  id: string;
  name: string;
  category?: { name: string };
};

/* ================= PAGE ================= */

export default function DiscountManagement() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("OFFERS");
  const [submitting, setSubmitting] = useState(false);
  
  // Tester State
  const [testCode, setTestCode] = useState("");
  const [testAmount, setTestAmount] = useState<number>(1000);
  const [testResult, setTestResult] = useState<any>(null);

  const [formData, setFormData] = useState<Partial<Offer>>({
    title: "",
    description: "",
    code: "",
    discountType: "FLAT",
    discountValue: 0,
    minOrderValue: 0,
    maxDiscount: undefined,
    usageLimit: 1000,
    isActive: true,
  });

  /* 🔗 FETCH DATA */
  async function fetchData() {
    try {
      setLoading(true);
      const [offersRes, itemsRes] = await Promise.all([
        fetch("/api/discounts"),
        fetch("/api/menu/items"),
      ]);

      if (offersRes.ok) {
        const data = await offersRes.json();
        setOffers(data.offers || []);
      }
      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setItems(data || []);
      }
    } catch (err) {
      toast.error("Failed to load discount data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  /* ⚡ HANDLERS */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      const url = editingId ? `/api/discounts/${editingId}` : "/api/discounts";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingId ? "Offer updated!" : "New offer created!");
        setShowAddModal(false);
        setEditingId(null);
        setFormData({ title: "", description: "", discountType: "FLAT", discountValue: 0, minOrderValue: 0 });
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save offer");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/discounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) {
        setOffers(prev => prev.map(o => o.id === id ? { ...o, isActive: !current } : o));
        toast.success("Status updated");
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  }

  async function deleteOffer(id: string) {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    try {
      const res = await fetch(`/api/discounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setOffers(prev => prev.filter(o => o.id !== id));
        toast.success("Offer deleted");
      }
    } catch (err) {
      toast.error("Failed to delete offer");
    }
  }

  const filteredOffers = offers.filter(o => 
    o.title.toLowerCase().includes(search.toLowerCase()) || 
    (o.code || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--kravy-bg)] p-4 md:p-8 pt-20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--kravy-surface)] p-6 rounded-3xl border border-[var(--kravy-border)] shadow-xl shadow-indigo-500/5">
          <div>
            <h1 className="text-3xl font-black text-[var(--kravy-text-primary)] tracking-tight">Discounts & Offers</h1>
            <p className="text-[var(--kravy-text-muted)] mt-1 font-medium">Manage coupons, BOGO and flat discounts</p>
          </div>
          <button 
            onClick={() => { setEditingId(null); setShowAddModal(true); }}
            className="flex items-center gap-2 bg-[var(--kravy-brand)] hover:scale-105 active:scale-95 text-white px-6 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-indigo-500/30"
          >
            <Plus size={20} strokeWidth={3} />
            CREATE NEW OFFER
          </button>
        </div>

        {/* CUSTOM TABS */}
        <div className="flex gap-2 p-1.5 bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-2xl w-fit">
          {["OFFERS", "ANALYTICS", "TESTER"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${activeTab === tab 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-[var(--kravy-text-muted)] hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "OFFERS" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

        {/* STATS PREVIEW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Offers", val: offers.filter(o => o.isActive).length, icon: <CheckCircle2 className="text-emerald-500" /> },
            { label: "Paused", val: offers.filter(o => !o.isActive).length, icon: <AlertCircle className="text-amber-500" /> },
            { label: "Total Usage", val: offers.reduce((a, b) => a + b.currentUsage, 0), icon: <ShoppingBag className="text-indigo-500" /> },
            { label: "Expiring Soon", val: 0, icon: <Calendar className="text-rose-500" /> },
          ].map((s, i) => (
            <div key={i} className="bg-[var(--kravy-surface)] p-4 rounded-2xl border border-[var(--kravy-border)] flex items-center gap-3">
              <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">{s.icon}</div>
              <div>
                <p className="text-[10px] font-black uppercase text-[var(--kravy-text-muted)] tracking-widest leading-none">{s.label}</p>
                <p className="text-xl font-black text-[var(--kravy-text-primary)] mt-1">{s.val}</p>
              </div>
            </div>
          ))}
        </div>

        {/* SEARCH & FILTER */}
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--kravy-text-muted)] group-focus-within:text-[var(--kravy-brand)] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by offer name or coupon code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--kravy-surface)] border-2 border-[var(--kravy-border)] text-lg pl-14 pr-6 py-5 rounded-3xl outline-none focus:border-[var(--kravy-brand)] transition-all shadow-sm"
          />
        </div>

        {/* OFFERS LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          <AnimatePresence mode="popLayout">
            {filteredOffers.map((o) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={o.id}
                className={`group relative overflow-hidden bg-[var(--kravy-surface)] rounded-[32px] border-2 transition-all duration-500 ${o.isActive ? 'border-[var(--kravy-border)] hover:border-[var(--kravy-brand)] hover:shadow-2xl' : 'border-dashed border-gray-300 opacity-60'}`}
              >
                {/* STATUS BADGE */}
                <div className="absolute top-6 right-6 flex gap-2">
                   <button 
                    onClick={() => toggleStatus(o.id, o.isActive)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${o.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-amber-500/10 border-amber-500/20 text-amber-600'}`}
                  >
                    {o.isActive ? "● Active" : "○ Paused"}
                  </button>
                </div>

                <div className="p-8">
                  {/* ICON & TYPE */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500 ${o.discountType === 'PERCENTAGE' ? 'bg-indigo-500/10 text-indigo-500' : o.discountType === 'FLAT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {o.discountType === 'PERCENTAGE' ? <Percent size={28} /> : o.discountType === 'FLAT' ? <DollarSign size={28} /> : <Gift size={28} />}
                  </div>

                  <h3 className="text-xl font-black text-[var(--kravy-text-primary)] leading-tight">{o.title}</h3>
                  <p className="text-sm text-[var(--kravy-text-muted)] mt-2 font-medium line-clamp-2 min-h-[40px]">{o.description || "No description provided."}</p>

                  <div className="bg-dashed-border my-6 border-t-2 border-dashed border-[var(--kravy-border)]" />

                  {/* DETAILS */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-[var(--kravy-text-muted)]">Coupon Code</span>
                      <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg font-black text-[var(--kravy-text-primary)] tracking-widest uppercase border border-[var(--kravy-border)]">{o.code}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-[var(--kravy-text-muted)]">Offer Value</span>
                      <span className="font-black text-[var(--kravy-brand)] text-lg">
                        {o.discountType === 'PERCENTAGE' ? `${o.discountValue}% Off` : `₹${o.discountValue} Off`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-[var(--kravy-text-muted)]">
                      <span>Usage Limit: {o.currentUsage}/{o.usageLimit}</span>
                      <div className="flex-1 mx-4 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--kravy-brand)]" style={{ width: `${(o.currentUsage / (o.usageLimit || 1)) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* QUICK ACTIONS */}
                  <div className="flex gap-2 mt-8">
                    <button 
                      onClick={() => { setEditingId(o.id); setFormData(o); setShowAddModal(true); }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-indigo-500/10 hover:text-indigo-500 rounded-2xl font-bold transition-all"
                    >
                      <Edit3 size={16} /> Edit
                    </button>
                    <button 
                      onClick={() => deleteOffer(o.id)}
                      className="w-12 h-12 flex items-center justify-center bg-gray-50 dark:bg-gray-800 hover:bg-rose-500/10 hover:text-rose-500 rounded-2xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* NO STATE */}
        {!loading && filteredOffers.length === 0 && (
          <div className="text-center py-20 bg-[var(--kravy-surface)] rounded-[40px] border-2 border-dashed border-gray-300">
             <div className="w-20 h-20 bg-gray-100 mx-auto rounded-full flex items-center justify-center mb-6 text-gray-400">
               <Tag size={40} />
             </div>
             <h2 className="text-2xl font-black text-[var(--kravy-text-primary)]">No offers found</h2>
             <p className="text-gray-500 mt-2 font-medium">Start by creating your first promotional discount</p>
          </div>
        )}
        </motion.div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "ANALYTICS" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[var(--kravy-surface)] p-12 rounded-[40px] border-2 border-dashed border-[var(--kravy-border)] text-center">
             <AlertCircle className="mx-auto text-indigo-500 mb-4" size={48} />
             <h2 className="text-2xl font-black">Coming Soon</h2>
             <p className="text-[var(--kravy-text-muted)] mt-2">Advanced usage reports and conversion analytics are being prepared.</p>
          </motion.div>
        )}

        {/* TESTER TAB */}
        {activeTab === "TESTER" && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="bg-[var(--kravy-surface)] p-8 rounded-[40px] border border-[var(--kravy-border)] shadow-xl space-y-6">
              <div>
                <h3 className="text-xl font-black">Coupon Tester</h3>
                <p className="text-sm text-[var(--kravy-text-muted)] mt-1">Simulate discount application before going live.</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[var(--kravy-text-muted)] tracking-widest ml-1">Example Cart Subtotal</label>
                  <input type="number" value={testAmount} onChange={e => setTestAmount(Number(e.target.value))} className="w-full bg-[var(--kravy-bg-2)] border-2 border-[var(--kravy-border)] p-4 rounded-2xl outline-none focus:border-[var(--kravy-brand)] font-black text-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[var(--kravy-text-muted)] tracking-widest ml-1">Promo Code</label>
                  <input value={testCode} onChange={e => setTestCode(e.target.value.toUpperCase())} placeholder="SAVE50, DIWALI, etc." className="w-full bg-[var(--kravy-bg-2)] border-2 border-[var(--kravy-border)] p-4 rounded-2xl outline-none focus:border-[var(--kravy-brand)] font-black tracking-widest uppercase" />
                </div>
                <button 
                  onClick={() => {
                    const found = offers.find(o => o.code === testCode);
                    if (!found) { setTestResult({ error: "Invalid Code" }); return; }
                    if (!found) { setTestResult({ error: "Invalid Code" }); return; }
                    const d = calculateDiscount(found, testAmount, []);
                    setTestResult({ offer: found, discount: d });
                  }}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  TEST APPLICATION
                </button>
              </div>
            </div>

            <div className="bg-[var(--kravy-surface)] p-8 rounded-[40px] border border-[var(--kravy-border)] shadow-xl min-h-[350px] flex flex-col items-center justify-center text-center">
              {testResult ? (
                testResult.error ? (
                   <div className="text-rose-500 font-bold">
                     <X size={48} className="mx-auto mb-4" />
                     <p className="text-xl">{testResult.error}</p>
                   </div>
                ) : (
                  <div className="w-full space-y-6">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                        <Tag size={32} />
                      </div>
                      <h4 className="text-2xl font-black text-emerald-600 mb-1">₹{testResult.discount.toFixed(2)} Off</h4>
                      <p className="text-sm font-bold text-[var(--kravy-text-muted)] uppercase tracking-widest">Savings Applied</p>
                    </div>
                    
                    <div className="bg-[var(--kravy-bg-2)] p-6 rounded-2xl space-y-3 text-left">
                       <div className="flex justify-between text-sm">
                         <span className="text-[var(--kravy-text-muted)] font-bold">Subtotal</span>
                         <span className="font-black">₹{testAmount.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-sm text-emerald-600">
                         <span className="font-bold">Discount ({testResult.offer.title})</span>
                         <span className="font-black">- ₹{testResult.discount.toFixed(2)}</span>
                       </div>
                       <div className="border-t border-dashed border-[var(--kravy-border)] pt-3 flex justify-between">
                         <span className="font-black text-lg">Final Total</span>
                         <span className="font-black text-lg text-[var(--kravy-brand)]">₹{(testAmount - testResult.discount).toFixed(2)}</span>
                       </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="opacity-40">
                  <Percent size={48} className="mx-auto mb-4" />
                  <p className="font-bold">Result will appear here</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm"
               onClick={() => setShowAddModal(false)}
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleSubmit}
              className="relative w-full max-w-2xl bg-[var(--kravy-surface)] p-8 rounded-[40px] shadow-2xl border border-[var(--kravy-border)] overflow-y-auto max-h-[90vh] no-scrollbar"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-black text-[var(--kravy-text-primary)] tracking-tight">
                    {editingId ? "Edit Offer" : "Create New Offer"}
                  </h2>
                  <p className="text-[var(--kravy-text-muted)] font-medium">Fill in the details for your marketing campaign</p>
                </div>
                <button type="button" onClick={() => setShowAddModal(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all h-fit text-gray-500 hover:text-rose-500">
                  <X />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* TITLE & CODE */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[var(--kravy-text-muted)] tracking-widest ml-1">Offer Title</label>
                  <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Diwal Dhamaka" className="w-full bg-[var(--kravy-bg-2)] border-2 border-[var(--kravy-border)] p-4 rounded-2xl outline-none focus:border-[var(--kravy-brand)] font-bold transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[var(--kravy-text-muted)] tracking-widest ml-1">Coupon Code (optional)</label>
                  <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="e.g. SAVE50" className="w-full bg-[var(--kravy-bg-2)] border-2 border-[var(--kravy-border)] p-4 rounded-2xl outline-none focus:border-[var(--kravy-brand)] font-black uppercase tracking-widest transition-all" />
                </div>

                {/* TYPE & VALUE */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[var(--kravy-text-muted)] tracking-widest ml-1">Discount Type</label>
                  <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})} className="w-full bg-[var(--kravy-bg-2)] border-2 border-[var(--kravy-border)] p-4 rounded-2xl outline-none focus:border-[var(--kravy-brand)] font-bold transition-all">
                    <option value="FLAT">Flat ₹ Fixed Amount</option>
                    <option value="PERCENTAGE">Percentage % Off</option>
                    <option value="BOGO">BOGO (Buy X Get Y)</option>
                    <option value="ITEM_WISE">Item-wise / Category</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[var(--kravy-text-muted)] tracking-widest ml-1">Discount Value</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{formData.discountType === 'PERCENTAGE' ? '%' : '₹'}</span>
                    <input type="number" step="0.01" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: Number(e.target.value)})} className="w-full bg-[var(--kravy-bg-2)] border-2 border-[var(--kravy-border)] pl-10 pr-4 py-4 rounded-2xl outline-none focus:border-[var(--kravy-brand)] font-bold transition-all" />
                  </div>
                </div>

                {/* LIMITS */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[var(--kravy-text-muted)] tracking-widest ml-1">Min Order Value</label>
                  <input type="number" value={formData.minOrderValue} onChange={e => setFormData({...formData, minOrderValue: Number(e.target.value)})} className="w-full bg-[var(--kravy-bg-2)] border-2 border-[var(--kravy-border)] p-4 rounded-2xl outline-none focus:border-[var(--kravy-brand)] font-bold transition-all" />
                </div>
                {formData.discountType === 'PERCENTAGE' && (
                   <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-[var(--kravy-text-muted)] tracking-widest ml-1">Max Discount Cap (₹)</label>
                    <input type="number" value={formData.maxDiscount} onChange={e => setFormData({...formData, maxDiscount: Number(e.target.value)})} className="w-full bg-[var(--kravy-bg-2)] border-2 border-[var(--kravy-border)] p-4 rounded-2xl outline-none focus:border-[var(--kravy-brand)] font-bold transition-all" />
                  </div>
                )}

                {/* BOGO FIELDS */}
                {formData.discountType === 'BOGO' && (
                   <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-[var(--kravy-text-muted)] tracking-widest ml-1">Buy Item</label>
                      <select value={formData.buyItemId} onChange={e => setFormData({...formData, buyItemId: e.target.value})} className="w-full bg-[var(--kravy-bg-2)] border-2 border-[var(--kravy-border)] p-4 rounded-2xl outline-none focus:border-[var(--kravy-brand)] font-bold transition-all">
                        <option value="">Select Item</option>
                        {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-[var(--kravy-text-muted)] tracking-widest ml-1">Get Item Off</label>
                      <select value={formData.getItemOffId} onChange={e => setFormData({...formData, getItemOffId: e.target.value})} className="w-full bg-[var(--kravy-bg-2)] border-2 border-[var(--kravy-border)] p-4 rounded-2xl outline-none focus:border-[var(--kravy-brand)] font-bold transition-all">
                        <option value="">Select Item</option>
                        {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                      </select>
                    </div>
                  </>
                )}

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-[var(--kravy-text-muted)] tracking-widest ml-1">Description</label>
                  <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe your offer..." className="w-full bg-[var(--kravy-bg-2)] border-2 border-[var(--kravy-border)] p-4 rounded-3xl outline-none focus:border-[var(--kravy-brand)] font-medium transition-all" />
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-[var(--kravy-border)] flex gap-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 rounded-2xl font-black text-gray-500 hover:bg-gray-200 transition-all">CANCEL</button>
                <button type="submit" disabled={submitting} className="flex-[2] py-4 bg-[var(--kravy-brand)] text-white rounded-2xl font-black shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? "SAVING..." : "SAVE OFFER"}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
