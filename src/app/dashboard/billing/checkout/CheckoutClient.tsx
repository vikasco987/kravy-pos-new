

// src/app/billing/checkout/CheckoutClient.tsx

"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Trash2, Play, X, Search } from "lucide-react";

/* ================= TYPES ================= */

type MenuItem = {
  id: string;
  name: string;
  price: number;
  unit?: string | null;
  imageUrl?: string | null; // ✅ ADD THIS  
  category?: {
    id: string;
    name: string;
  } | null;
};



type BillItem = {
  id: string;
  name: string;
  qty: number;
  rate: number;
};

/* ================= PAGE ================= */

export default function CheckoutClient() {
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeBillId = searchParams.get("resumeBillId");
  const [activeBillId, setActiveBillId] = useState<string | null>(null);

  /* ================= HELD BILLS STATE ================= */
  const [heldBills, setHeldBills] = useState<any[]>([]);
  const [showHeldBills, setShowHeldBills] = useState(false);
  const [heldBillsLoading, setHeldBillsLoading] = useState(false);

  async function fetchHeldBills() {
    try {
      setHeldBillsLoading(true);
      const res = await fetch("/api/bill-manager", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        // Filter only held bills
        const onlyHeld = (data.bills || []).filter((b: any) => b.isHeld);
        setHeldBills(onlyHeld);
      }
    } catch (err) {
      console.error("Fetch held bills error", err);
    } finally {
      setHeldBillsLoading(false);
    }
  }

  useEffect(() => {
    fetchHeldBills();
  }, []);

  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState("");

  useEffect(() => {
    setBillNumber(`SV-${Date.now()}`);
    setBillDate(new Date().toLocaleString());
  }, []);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch("/api/menu/items");
        if (!res.ok) return;

        const data = await res.json();

        // ✅ API returns array directly
        setMenuItems(data);
      } catch (err) {
        console.error("Menu fetch failed", err);
      } finally {
        setMenuLoading(false);
      }
    }

    fetchMenu();
  }, []);

  useEffect(() => {
    if (!resumeBillId) return;

    async function loadHeldBill() {
      try {
        const res = await fetch(`/api/bill-manager/${resumeBillId}`, {
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json();
        const bill = data.bill ?? data;
        // ✅ VERY IMPORTANT
        setActiveBillId(bill.id);
        // ✅ RESTORE CART
        setItems(
          bill.items.map((i: any) => ({
            id: i.id,
            name: i.name,
            qty: i.qty,
            rate: i.rate,
          }))
        );

        // ✅ RESTORE CUSTOMER
        setCustomerName(bill.customerName || "");
        setCustomerPhone(bill.customerPhone || "");

        // ✅ RESTORE PAYMENT
        setPaymentMode(bill.paymentMode);
        setPaymentStatus(bill.paymentStatus);
        setUpiTxnRef(bill.upiTxnRef || "");

      } catch (err) {
        console.error("RESUME BILL ERROR:", err);
      }
    }

    loadHeldBill();
  }, [resumeBillId]);


  /* ================= CATEGORY + SEARCH ================= */
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [search, setSearch] = useState("");

  const categories = Array.from(
    new Set(menuItems.map((i) => i.category?.name || "Others"))
  );

  const filteredMenuItems = menuItems
    .filter((i) =>
      activeCategory === "All"
        ? true
        : i.category?.name === activeCategory
    )
    .filter((i) =>
      i.name.toLowerCase().includes(search.toLowerCase())
    );


  /* ================= CART ================= */

  function addToCart(item: MenuItem) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);

      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      }

      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          qty: 1,
          rate: item.price,
        },
      ];
    });
  }

  function reduceFromCart(itemId: string) {
    setItems((prev) =>
      prev
        .map((i) =>
          i.id === itemId ? { ...i, qty: i.qty - 1 } : i
        )
        .filter((i) => i.qty > 0)
    );
  }

  /* ================= CUSTOMER ================= */
  const [showCustomer, setShowCustomer] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");


  /* ================= CART STATE ================= */

  const [items, setItems] = useState<BillItem[]>([]);
  const inc = (id: string) =>
    setItems((s) =>
      s.map((i) =>
        i.id === id ? { ...i, qty: i.qty + 1 } : i
      )
    );

  const dec = (id: string) =>
    setItems((s) =>
      s
        .map((i) =>
          i.id === id ? { ...i, qty: i.qty - 1 } : i
        )
        .filter((i) => i.qty > 0)
    );

  const remove = (id: string) =>
    setItems((s) => s.filter((i) => i.id !== id));

  /* ================= BUSINESS PROFILE ================= */

  const [business, setBusiness] = useState<{
    businessName: string;
    businessTagLine?: string;
    gstNumber?: string;
    businessAddress?: string;
    district?: string;
    state?: string;
    pinCode?: string;
    upi?: string;
    logoUrl?: string;
    taxEnabled?: boolean;
    taxRate?: number;
  } | null>(null);


  useEffect(() => {
    async function fetchBusinessProfile() {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (!res.ok) return;

        const data = await res.json();

        if (data) {
          setBusiness({
            businessName: data.businessName,
            businessTagLine: data.businessTagLine,
            gstNumber: data.gstNumber,
            businessAddress: data.businessAddress,
            district: data.district,
            state: data.state,
            pinCode: data.pinCode,
            upi: data.upi,
            logoUrl: data.logoUrl,
            taxEnabled: data.taxEnabled ?? true,
            taxRate: data.taxRate ?? 5.0,
          });
        }
      } catch (err) {
        console.error("Business profile load failed", err);
      }
    }

    fetchBusinessProfile();
  }, []);


  /* ================= TOTALS ================= */

  const taxActive = business?.taxEnabled ?? true;
  const currentTaxRate = business?.taxRate ?? 5.0;

  const subtotal = Number(
    items.reduce((a, i) => a + i.qty * i.rate, 0).toFixed(2)
  );

  const gstAmount = taxActive
    ? Number(((subtotal * currentTaxRate) / 100).toFixed(2))
    : 0;

  const cgst = Number((gstAmount / 2).toFixed(2));
  const sgst = Number((gstAmount / 2).toFixed(2));

  const finalTotal = Number(
    (subtotal + gstAmount).toFixed(2)
  );
  /* ================= PAYMENT STATE ================= */

  const [paymentMode, setPaymentMode] =
    useState<"Cash" | "UPI" | "Card">("Cash");
  const [paymentStatus, setPaymentStatus] =
    useState<"Pending" | "Paid">("Paid");
  const [upiTxnRef, setUpiTxnRef] = useState("");

  /* ================= UPI ================= */

  const UPI_ID = business?.upi || "";
  const UPI_NAME = business?.businessName || "Store";

  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(
    UPI_NAME
  )}&am=${finalTotal.toFixed(2)}&cu=INR`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiLink
  )}`;

  /* ================= PAYMENT EFFECT ================= */

  useEffect(() => {
    if (paymentMode === "Cash" || paymentMode === "Card") {
      setPaymentStatus("Paid");
    }
  }, [paymentMode]);

  /* ================= SAVE BILL ================= */
  async function saveBill(isHeld: boolean = false) {
    if (items.length === 0) {
      alert("No items to save");
      return null;
    }

    const payload = {
      items,
      subtotal,
      tax: gstAmount, // ✅ backend expects `tax`
      total: finalTotal,

      paymentMode,        // Cash | UPI | Card
      paymentStatus: isHeld ? "HELD" : paymentStatus, // ✅ Handle held status explicitly
      upiTxnRef: paymentMode === "UPI" ? upiTxnRef : null,

      isHeld,             // ✅ THIS ENABLES HOLD
      customerName: customerName || "Walk-in Customer",
      customerPhone: customerPhone || null,
    };

    try {
      // ✅ IF RESUMING, USE PUT TO UPDATE EXISTING
      const url = resumeBillId
        ? `/api/bill-manager/${resumeBillId}`
        : "/api/bill-manager";

      const method = resumeBillId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to save bill");
        return null;
      }

      const data = await res.json();
      return data.bill ?? data;
    } catch (err) {
      console.error("Save bill error", err);
      alert("Something went wrong");
      return null;
    }
  }

  /* ================= DELETE HELD BILL ================= */
  async function deleteHeldBill(id: string) {
    if (!confirm("Permanently delete this held bill?")) return;
    try {
      const res = await fetch(`/api/bill-manager/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Bill deleted");
        if (resumeBillId === id) {
          router.replace("/dashboard/billing/checkout"); // reset if we are currently resuming this one
          setItems([]);
          setCustomerName("");
          setCustomerPhone("");
        }
        return true;
      } else {
        alert("Failed to delete bill");
        return false;
      }
    } catch (err) {
      console.error("Delete bill error", err);
      return false;
    }
  }

  /* ================= PRINT RECEIPT ================= */

  function printReceipt() {
    if (!receiptRef.current) {
      alert("Nothing to print");
      return;
    }

    const printContents = receiptRef.current.innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;

    // reload to restore React state properly
    window.location.reload();
  }


  /* ================= UI ================= */

  return (
    <div className="h-full max-h-[calc(100vh-100px)] lg:h-[calc(100vh-80px)] bg-[var(--kravy-bg)] p-2 lg:p-4 transition-colors overflow-hidden">
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_400px] gap-4 lg:gap-6 h-full overflow-hidden">


        {/* ================= LEFT : MENU ITEMS ================= */}
        <div className="bg-[var(--kravy-surface)] rounded-2xl p-4 lg:p-6 overflow-y-auto border border-[var(--kravy-border)] shadow-sm relative flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4 lg:mb-5">
            <h2 className="text-lg lg:text-xl font-bold text-[var(--kravy-text-primary)]">Menu Catalog</h2>
          </div>

          {/* CATEGORY TABS */}
          <div className="flex gap-1.5 lg:gap-2 mb-3 lg:mb-4 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveCategory("All")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${activeCategory === "All"
                ? "bg-[var(--kravy-brand)] border-[var(--kravy-brand)] text-white shadow-lg shadow-indigo-500/30"
                : "bg-[var(--kravy-bg-2)] border-[var(--kravy-border)] text-[var(--kravy-text-secondary)] hover:border-[var(--kravy-brand)]"
                }`}
            >
              All
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeCategory === cat
                  ? "bg-[var(--kravy-brand)] border-[var(--kravy-brand)] text-white shadow-lg shadow-indigo-500/30"
                  : "bg-[var(--kravy-bg-2)] border-[var(--kravy-border)] text-[var(--kravy-text-secondary)] hover:border-[var(--kravy-brand)]"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* SEARCH */}
          <div className="relative mb-4 lg:mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--kravy-text-muted)]" size={14} />
            <input
              type="text"
              placeholder="Search items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)] text-[var(--kravy-text-primary)] h-9 lg:h-11 pl-9 lg:pl-10 pr-4 w-full rounded-lg lg:rounded-xl text-xs lg:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {menuLoading && (
            <p className="text-sm text-[var(--kravy-text-muted)] animate-pulse">Loading menu items…</p>
          )}

          {!menuLoading && filteredMenuItems.length === 0 && (
            <p className="text-sm text-[var(--kravy-text-muted)] italic">No matches found for your search.</p>
          )}

          {/* MENU GRID */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 lg:gap-4 overflow-y-auto pr-2">
            {filteredMenuItems.map((m) => {
              const inCart = items.find((i) => i.id === m.id);



              return (
                <div
                  key={m.id}
                  onClick={() => addToCart(m)}
                  className="group relative border border-[var(--kravy-border)] rounded-2xl overflow-hidden cursor-pointer
                 hover:shadow-xl hover:border-[var(--kravy-brand)] transition-all duration-300 bg-[var(--kravy-bg-2)]"
                >
                  {/* IMAGE */}
                  <div className="h-32 w-full bg-[var(--kravy-surface)] overflow-hidden">
                    <img
                      src={m.imageUrl || "/no-image.png"}
                      alt={m.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = "/no-image.png";
                      }}
                    />
                  </div>



                  {/* CONTENT */}
                  <div className="p-3 lg:p-4">
                    <p className="text-xs lg:text-sm font-bold text-[var(--kravy-text-primary)] truncate group-hover:text-indigo-500 transition-colors">
                      {m.name}
                    </p>

                    <div className="flex justify-between items-center mt-1 lg:mt-2">
                      <p className="text-xs lg:text-sm text-emerald-500 font-extrabold">
                        ₹{m.price.toFixed(2)}
                      </p>
                      <p className="text-[10px] uppercase font-black text-[var(--kravy-text-muted)] tracking-widest">
                        {m.unit ? `Per ${m.unit}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* GREEN QTY BADGE (TOP LEFT) */}
                  {inCart && (
                    <div className="absolute top-2 left-2 bg-green-600 text-white
                        text-xs px-2 py-0.5 rounded-full">
                      {inCart.qty}
                    </div>
                  )}

                  {/* RED REDUCE BADGE (TOP RIGHT) */}
                  {inCart && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // prevent add
                        reduceFromCart(m.id);
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white
                     text-xs w-6 h-6 rounded-full flex items-center
                     justify-center hover:bg-red-700"
                    >
                      −
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {/* ================= RIGHT : CART ================= */}
        <div className="bg-[var(--kravy-surface)] rounded-2xl flex flex-col border border-[var(--kravy-border)] shadow-xl overflow-hidden min-h-0">

          {/* HEADER */}
          <div className="border-b border-[var(--kravy-border)] p-4 lg:p-6 bg-[var(--kravy-bg-2)]/50 shrink-0">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-black text-[var(--kravy-text-primary)] leading-tight">Billing Invoice</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded uppercase tracking-wider">{billNumber}</span>
                  <span className="text-[10px] font-bold text-[var(--kravy-text-muted)] truncate">{billDate}</span>
                </div>
              </div>

              {/* HELD BILLS BADGE */}
              <button
                onClick={() => {
                  setShowHeldBills(true);
                  fetchHeldBills();
                }}
                className="relative group p-2.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-all"
                title="View Held Bills"
              >
                <Clock size={20} />
                {heldBills.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-[var(--kravy-surface)] shadow-sm">
                    {heldBills.length}
                  </span>
                )}
                {/* Tooltip on hover */}
                <span className="absolute bottom-full right-0 mb-2 whitespace-nowrap bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-bold">
                  {heldBills.length} Held Orders
                </span>
              </button>
            </div>
          </div>

          {/* CUSTOMER */}
          <button
            onClick={() => setShowCustomer(!showCustomer)}
            className="p-5 text-left border-b border-[var(--kravy-border)] font-black text-[10px] uppercase tracking-widest text-[var(--kravy-text-muted)] flex justify-between items-center hover:bg-[var(--kravy-bg-2)] transition-colors"
          >
            Customer Details
            <span className={`text-xs transition-transform duration-300 ${showCustomer ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {showCustomer && (
            <div className="p-4 lg:p-6 space-y-3 lg:space-y-4 border-b border-[var(--kravy-border)] bg-[var(--kravy-bg-2)]/30 shrink-0">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--kravy-text-muted)] uppercase tracking-wider ml-1">Name</label>
                <input
                  placeholder="Full Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] p-2 lg:p-2.5 w-full rounded-lg lg:rounded-xl text-xs lg:text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest ml-1">Phone</label>
                <input
                  placeholder="Phone Number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] p-2 lg:p-2.5 w-full rounded-lg lg:rounded-xl text-xs lg:text-sm outline-none focus:ring-1 focus:ring-[var(--kravy-brand)] font-mono"
                />
              </div>
            </div>
          )}

          {/* CART ITEMS */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
            {items.length === 0 && (
              <p className="text-sm text-gray-500">
                No items added
              </p>
            )}

            {items.map((i) => (
              <div key={i.id} className="flex justify-between items-center py-2 px-1 border-b border-[var(--kravy-border)]/50 last:border-0">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="font-bold text-[var(--kravy-text-primary)] truncate text-sm">{i.name}</p>
                  <p className="text-xs font-bold text-indigo-500/80">
                    {i.qty} × ₹{i.rate.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-4 items-center shrink-0">
                  <span className="font-bold text-[var(--kravy-text-primary)]">₹{(i.qty * i.rate).toFixed(2)}</span>
                  <button onClick={() => remove(i.id)} className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors">
                    <span className="text-xs font-black">✕</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* CHECKOUT */}
          <div className="border-t border-[var(--kravy-border)] p-3 lg:p-4 bg-[var(--kravy-bg-2)]/30 space-y-1.5 lg:space-y-2 shrink-0">

            {/* TOTALS */}
            <div className="flex justify-between text-sm text-[var(--kravy-text-muted)] font-medium">
              <span>Subtotal</span>
              <span className="text-[var(--kravy-text-primary)] font-bold">₹{subtotal.toFixed(2)}</span>
            </div>

            {taxActive && (
              <div className="flex justify-between text-sm text-[var(--kravy-text-muted)] font-medium">
                <span>GST ({currentTaxRate}%)</span>
                <span className="text-[var(--kravy-text-primary)] font-bold">₹{gstAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-y border-[var(--kravy-border)]/50">
              <span className="font-black text-[var(--kravy-text-primary)] uppercase tracking-widest text-xs">Total Order</span>
              <span className="text-2xl font-black text-[var(--kravy-brand)]">₹{finalTotal.toFixed(2)}</span>
            </div>

            {/* ================= PAYMENT ================= */}
            <div className="pt-2 space-y-2">
              <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest ml-1">
                Payment Method
              </label>

              <select
                value={paymentMode}
                onChange={(e) =>
                  setPaymentMode(e.target.value as "Cash" | "UPI" | "Card")
                }
                className="bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] p-2 lg:p-3 w-full rounded-lg lg:rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs lg:text-sm font-bold"
              >
                <option value="Cash">💵 Cash</option>
                <option value="UPI">📱 Digital UPI</option>
                <option value="Card">💳 Credit/Debit Card</option>
              </select>

              {/* -------- UPI DETAILS -------- */}
              {paymentMode === "UPI" && (
                <div className="space-y-4 p-4 rounded-2xl bg-indigo-500/5 mt-4 border border-indigo-500/10">
                  <div className="bg-white p-2 rounded-xl mx-auto w-fit shadow-xl">
                    <img
                      src={qrUrl}
                      alt="UPI QR"
                      className="w-32 h-32"
                    />
                  </div>

                  <a
                    href={upiLink}
                    className="block text-center text-indigo-500 font-bold underline text-xs"
                  >
                    Click to open UPI App
                  </a>

                  <input
                    placeholder="Txn Reference Number"
                    value={upiTxnRef}
                    onChange={(e) => setUpiTxnRef(e.target.value)}
                    className="bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] p-3 w-full rounded-xl text-sm outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                  />

                  <select
                    value={paymentStatus}
                    onChange={(e) =>
                      setPaymentStatus(e.target.value as "Pending" | "Paid")
                    }
                    className="bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] p-2 lg:p-3 w-full rounded-lg lg:rounded-xl text-xs lg:text-sm outline-none font-black uppercase tracking-widest"
                  >
                    <option value="Pending">🕒 Payment Pending</option>
                    <option value="Paid">✅ Payment Received</option>
                  </select>
                </div>
              )}
            </div>

            {/* ================= ACTION BUTTONS ================= */}
            <div className="flex gap-2 pt-2">
              {/* HOLD */}
              <button
                onClick={async () => {
                  const bill = await saveBill(true); // ✅ HOLD MODE
                  if (!bill) return;

                  alert("Bill saved on hold");
                  setItems([]);          // clear cart
                  setCustomerName("");
                  setCustomerPhone("");
                  fetchHeldBills(); // refresh list
                  if (resumeBillId) router.replace("/dashboard/billing/checkout"); // clear resume ID
                }}
                disabled={items.length === 0}
                className="flex-1 border-2 border-amber-500/50 text-amber-500 font-bold py-3 rounded-xl
                        disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-500/10 transition-colors text-sm"
              >
                ⏸ Hold
              </button>

              {/* SAVE */}
              <button
                type="button"
                onClick={async () => {
                  const bill = await saveBill();
                  if (!bill) return;

                  // ✅ CLEAR CURRENT BILL STATE (READY FOR NEW BILL)
                  setItems([]);
                  setCustomerName("");
                  setCustomerPhone("");
                  setUpiTxnRef("");
                  setPaymentMode("Cash");
                  setPaymentStatus("Paid");

                  // ✅ NEW BILL META
                  setBillNumber(`SV-${Date.now()}`);
                  setBillDate(new Date().toLocaleString());

                  if (resumeBillId) router.replace("/dashboard/billing/checkout");
                }}
                disabled={items.length === 0}
                className="flex-1 bg-[var(--kravy-surface-hover)] border border-[var(--kravy-border)] text-[var(--kravy-text-primary)] font-bold py-3 rounded-xl
                        disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--kravy-bg-2)] transition-colors text-sm"
              >
                💾 Save
              </button>

              {/* SAVE & PRINT */}
              <button
                onClick={async () => {
                  if (!business) {
                    alert("Business profile not loaded yet");
                    return;
                  }

                  const bill = await saveBill();
                  if (!bill) return;
                  printReceipt();
                }}
                disabled={
                  items.length === 0 ||
                  !business ||
                  (paymentMode === "UPI" && paymentStatus !== "Paid")
                }
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black py-2 lg:py-3 rounded-lg lg:rounded-xl
                        disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-xs lg:text-sm"
              >
                🖨️ Print
              </button>
            </div>

            {/* FOOTER */}
            <p className="text-xs text-center text-gray-500">
              {business?.businessTagLine}
            </p>

            {/* ================= PRINT (58mm) ================= */}

            <div
              ref={receiptRef}
              data-paper="58" // change to "80" for 80mm printer
              className="hidden print:block receipt font-mono text-[10px] leading-tight"
            >

              {/* LOGO */}
              {business?.logoUrl && (
                <div className="flex justify-center mb-1">
                  <img
                    src={business.logoUrl}
                    alt="Logo"
                    className="max-h-[28mm] object-contain"
                  />
                </div>
              )}

              {/* BUSINESS NAME */}
              <div className="text-center font-bold text-[12px]">
                {business?.businessName}
              </div>

              {/* ADDRESS */}
              {(business?.businessAddress ||
                business?.district ||
                business?.state ||
                business?.pinCode) && (
                  <div className="text-center text-[9px]">
                    {business.businessAddress}
                    {business.district && `, ${business.district}`}
                    {business.state && `, ${business.state}`}
                    {business.pinCode && ` - ${business.pinCode}`}
                  </div>
                )}

              {/* GSTIN */}
              {business?.gstNumber && (
                <div className="text-center text-[9px]">
                  GSTIN: {business.gstNumber}
                </div>
              )}

              {/* BILL META (CENTERED BELOW GSTIN) */}
              <div className="text-center text-[9px] mt-1">
                <div>Bill No: {billNumber}</div>
                <div>Date: {billDate}</div>
              </div>

              <div className="my-1 border-t border-dashed" />

              {/* CUSTOMER */}
              {(customerName || customerPhone) && (
                <div className="text-[9px]">
                  <div>Customer: {customerName || "Walk-in Customer"}</div>
                  {customerPhone && <div>Phone: {customerPhone}</div>}
                </div>
              )}

              <div className="my-1 border-t border-dashed" />

              {/* ITEM HEADER */}
              <div className="flex justify-between font-semibold text-[9px]">
                <span className="w-[26mm]">Desc</span>
                <span className="w-[8mm] text-right">Qty</span>
                <span className="w-[10mm] text-right">Rate</span>
                <span className="w-[10mm] text-right">Amt</span>
              </div>

              <div className="border-t border-dashed my-1" />

              {/* ITEMS */}
              {items.map((i) => (
                <div key={i.id} className="flex justify-between text-[9px]">
                  <span className="w-[26mm] truncate">{i.name}</span>
                  <span className="w-[8mm] text-right">{i.qty}</span>
                  <span className="w-[10mm] text-right">{i.rate.toFixed(2)}</span>
                  <span className="w-[10mm] text-right">
                    {(i.qty * i.rate).toFixed(2)}
                  </span>
                </div>
              ))}

              <div className="my-1 border-t border-dashed" />

              {/* TOTALS */}
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              {taxActive && (
                <div className="flex justify-between">
                  <span>GST ({currentTaxRate}%)</span>
                  <span>₹{gstAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-dashed my-1" />

              <div className="flex justify-between font-bold text-[11px]">
                <span>GRAND TOTAL</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>

              <div className="border-t border-dashed my-1" />

              {/* PAYMENT */}
              <div className="text-center text-[9px]">
                Payment: {paymentMode}
              </div>

              {/* ✅ UPI QR INSIDE RECEIPT */}
              {paymentMode === "UPI" && (
                <>
                  <div className="flex justify-center my-2">
                    <img
                      src={qrUrl}
                      alt="UPI QR"
                      className="w-[30mm]"
                    />
                  </div>

                  <div className="text-center text-[9px]">
                    Txn Ref: {upiTxnRef || "Pending"}
                  </div>
                </>
              )}


              {/* TAGLINE */}
              {business?.businessTagLine && (
                <div className="text-center text-[9px] mt-1">
                  {business.businessTagLine}
                </div>
              )}

              <div className="text-center font-semibold mt-1">
                Thank you 🙏
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ================= HELD BILLS DRAWER ================= */}
      {showHeldBills && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowHeldBills(false)}
          />
          <div className="relative w-full max-w-md bg-[var(--kravy-surface)] h-full shadow-2xl flex flex-col border-l border-[var(--kravy-border)] animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-[var(--kravy-border)] flex justify-between items-center bg-[var(--kravy-bg-2)]/50">
              <div>
                <h3 className="text-xl font-black text-[var(--kravy-text-primary)]">Held Bills</h3>
                <p className="text-xs text-[var(--kravy-text-muted)] font-bold uppercase tracking-widest mt-1">
                  {heldBills.length} Orders Paused
                </p>
              </div>
              <button
                onClick={() => setShowHeldBills(false)}
                className="p-2 hover:bg-red-500/10 text-[var(--kravy-text-muted)] hover:text-red-500 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {heldBillsLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-sm font-bold text-[var(--kravy-text-muted)]">Loading your bills...</p>
                </div>
              ) : heldBills.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-8 opacity-50">
                  <Clock size={48} className="mb-4 text-indigo-500" />
                  <p className="font-bold text-[var(--kravy-text-primary)]">No held bills found</p>
                  <p className="text-xs mt-1">Orders you put on hold will appear here</p>
                </div>
              ) : (
                heldBills.map((bill) => (
                  <div
                    key={bill.id}
                    className={`group p-4 rounded-2xl border transition-all hover:shadow-lg ${resumeBillId === bill.id
                      ? "bg-indigo-500/5 border-indigo-500 shadow-indigo-500/10"
                      : "bg-[var(--kravy-bg-2)] border-[var(--kravy-border)] hover:border-indigo-500/50"
                      }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">#{bill.billNumber}</span>
                          {resumeBillId === bill.id && (
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Now</span>
                          )}
                        </div>
                        <h4 className="font-black text-[var(--kravy-text-primary)] mt-2">
                          {bill.customerName || "Walk-in Customer"}
                        </h4>
                        <p className="text-[10px] font-bold text-[var(--kravy-text-muted)] mt-0.5">
                          {new Date(bill.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-[var(--kravy-brand)]">₹{bill.total.toFixed(2)}</p>
                        <p className="text-[10px] font-bold text-[var(--kravy-text-muted)] uppercase tracking-tighter">
                          {bill.items.length} Items
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowHeldBills(false);
                          router.push(`/dashboard/billing/checkout?resumeBillId=${bill.id}`);
                        }}
                        disabled={resumeBillId === bill.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
                      >
                        <Play size={14} fill="currentColor" />
                        Resume
                      </button>
                      <button
                        onClick={async () => {
                          const ok = await deleteHeldBill(bill.id);
                          if (ok) fetchHeldBills();
                        }}
                        className="w-12 flex items-center justify-center py-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-[var(--kravy-border)] bg-[var(--kravy-bg-2)]/30">
              <button
                onClick={() => setShowHeldBills(false)}
                className="w-full py-3 bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-xl font-bold text-sm text-[var(--kravy-text-secondary)] hover:bg-[var(--kravy-bg-2)] transition-all"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

