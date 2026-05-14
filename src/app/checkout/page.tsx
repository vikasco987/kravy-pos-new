"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Printer, 
  ArrowLeft,
  CreditCard,
  Loader2,
  Lock
} from "lucide-react";
import Link from "next/link";
import axios from "axios";

const plansData = {
  year1: { id: "year1", name: "1 Year Plan", price: 3999 },
  year2: { id: "year2", name: "2 Year Plan", price: 5999 },
  year3: { id: "year3", name: "3 Year Plan", price: 7499 },
};

const addonsData = {
  printer: { id: "printer", name: "Thermal Printer (58mm)", price: 1999 },
  gateway: { id: "gateway", name: "Payment Gateway Activation", price: 1499 },
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") as keyof typeof plansData;
  const retryId = searchParams.get("retry");

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    house: "",
    addressLine: "",
    district: "",
    state: "",
    pincode: ""
  });

  const [selectedPlan, setSelectedPlan] = useState<any>(plansData[planId] || null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (planId && plansData[planId]) {
        setSelectedPlan(plansData[planId]);
    }
  }, [planId]);

  useEffect(() => {
    if (retryId) {
      const fetchRetryOrder = async () => {
        try {
          const res = await axios.get(`/api/phonepe/status/${retryId}`);
          if (res.data.order) {
            setCustomer(res.data.order.customer);
          }
        } catch (err) {
          console.error("Retry fetch error:", err);
        }
      };
      fetchRetryOrder();
    }
  }, [retryId]);

  const toggleAddon = (id: keyof typeof addonsData) => {
    if (selectedAddons.find(a => a.id === id)) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== id));
    } else {
      setSelectedAddons([...selectedAddons, addonsData[id]]);
    }
  };

  const totalAmount = (selectedPlan?.price || 0) + selectedAddons.reduce((acc, curr) => acc + curr.price, 0);

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
        alert("Please select a plan first.");
        return;
    }

    const requiredFields = ["name", "phone", "house", "addressLine", "district", "state", "pincode"];
    const missing = requiredFields.filter(f => !customer[f as keyof typeof customer]?.trim());
    
    if (missing.length > 0) {
      alert(`Please fill in all required fields: ${missing.join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      const items = [
        { id: selectedPlan.id, name: selectedPlan.name, price: selectedPlan.price, quantity: 1 },
        ...selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price, quantity: 1 }))
      ];

      const response = await axios.post("/api/phonepe/pay", {
        amount: totalAmount,
        customer,
        items
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Payment initiation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedPlan && !retryId) {
      return (
          <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">No plan selected</h1>
                  <Link href="/upgrade" className="text-indigo-500 font-bold hover:underline">Go back to Upgrade Page</Link>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] pb-24">
      {/* Header */}
      <nav className="p-6 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-white/5 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link href="/upgrade" className="flex items-center gap-2 group">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold text-sm uppercase tracking-wider">Back to Plans</span>
            </Link>
            <div className="flex items-center gap-2">
                <Lock size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Secure Checkout</span>
            </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 p-8 md:p-10 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <span className="font-black">1</span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Business Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name *</label>
                        <input type="text" name="name" placeholder="Contact Person Name" value={customer.name} onChange={handleCustomerChange} className="w-full px-5 py-4 rounded-2xl border bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-white/5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number *</label>
                        <input type="tel" name="phone" placeholder="10-digit number" value={customer.phone} onChange={handleCustomerChange} className="w-full px-5 py-4 rounded-2xl border bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-white/5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                        <input type="email" name="email" placeholder="for invoice delivery" value={customer.email} onChange={handleCustomerChange} className="w-full px-5 py-4 rounded-2xl border bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-white/5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">House / Building No. *</label>
                        <input type="text" name="house" placeholder="Flat No. / Shop No." value={customer.house} onChange={handleCustomerChange} className="w-full px-5 py-4 rounded-2xl border bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-white/5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Area / Locality *</label>
                        <input type="text" name="addressLine" placeholder="Street name / Landmark" value={customer.addressLine} onChange={handleCustomerChange} className="w-full px-5 py-4 rounded-2xl border bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-white/5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 md:col-span-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">District *</label>
                            <input type="text" name="district" placeholder="City" value={customer.district} onChange={handleCustomerChange} className="w-full px-5 py-4 rounded-2xl border bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-white/5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">State *</label>
                            <input type="text" name="state" placeholder="State" value={customer.state} onChange={handleCustomerChange} className="w-full px-5 py-4 rounded-2xl border bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-white/5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Pincode *</label>
                            <input type="text" name="pincode" placeholder="6-digit" value={customer.pincode} onChange={handleCustomerChange} className="w-full px-5 py-4 rounded-2xl border bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-white/5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" />
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="relative z-10">
                    <h3 className="text-xl font-black text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
                        🧾 Hardware Add-on
                        <span className="text-[10px] bg-amber-200 dark:bg-amber-800 px-3 py-1 rounded-full text-amber-900 dark:text-amber-100 font-black tracking-widest uppercase">Special Price</span>
                    </h3>
                    <p className="text-sm text-amber-800/70 dark:text-amber-400/70 mb-6 max-w-lg">
                        Get our high-speed 58mm Thermal Printer with Bluetooth & USB support for instant billing.
                    </p>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">One-time payment</p>
                            <p className="text-2xl font-black text-amber-900 dark:text-amber-100">₹1,999</p>
                        </div>
                        <button 
                            onClick={() => toggleAddon('printer')}
                            className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg
                            ${selectedAddons.find(a => a.id === 'printer') 
                                ? 'bg-amber-600 text-white hover:bg-amber-700' 
                                : 'bg-white text-amber-600 border border-amber-200 hover:bg-amber-50'
                            }`}
                        >
                            {selectedAddons.find(a => a.id === 'printer') ? 'Added to Cart' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </section>
          </div>

          {/* Right Column: Summary */}
          <div className="space-y-6">
            <section className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 p-8 shadow-xl sticky top-32">
                <h2 className="text-xl font-black tracking-tight mb-8">Order Summary</h2>
                
                <div className="space-y-4 mb-8">
                    {/* Selected Plan */}
                    <div className="flex justify-between items-start p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-white/5">
                        <div>
                            <p className="font-bold text-sm">{selectedPlan?.name}</p>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">SaaS Subscription</p>
                        </div>
                        <p className="font-black text-sm">₹{selectedPlan?.price.toLocaleString()}</p>
                    </div>

                    {/* Selected Addons */}
                    {selectedAddons.map(addon => (
                        <div key={addon.id} className="flex justify-between items-start p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                            <div>
                                <p className="font-bold text-sm">{addon.name}</p>
                                <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mt-1">Product Add-on</p>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-sm">₹{addon.price.toLocaleString()}</p>
                                <button onClick={() => toggleAddon(addon.id as any)} className="text-[10px] font-bold text-red-500 hover:underline mt-1">Remove</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-3 mb-8 px-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Subtotal</span>
                        <span className="font-bold">₹{totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Processing Fee</span>
                        <span className="text-emerald-500 font-black">₹0.00</span>
                    </div>
                    <div className="h-px bg-slate-100 dark:bg-white/5 my-4" />
                    <div className="flex justify-between items-center">
                        <span className="font-black uppercase tracking-[3px] text-xs">Total</span>
                        <span className="text-3xl font-black tracking-tight text-indigo-600">₹{totalAmount.toLocaleString()}</span>
                    </div>
                </div>

                <button 
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.8rem] font-black text-sm uppercase tracking-[3px] transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Pay Securely
                            <CreditCard size={18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

                <div className="mt-6 flex items-center justify-center gap-4 opacity-30 grayscale hover:grayscale-0 transition-all cursor-default">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" className="h-4" alt="UPI" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-3" alt="Visa" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4" alt="Mastercard" />
                </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
