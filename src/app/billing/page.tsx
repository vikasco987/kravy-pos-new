"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

type BillItem = {
  id: string;
  name: string;
  qty: number;
  rate: number;
};

export default function BillingPage() {
  const receiptRef = useRef<HTMLDivElement | null>(null);

  // SHOP DETAILS
  const SHOP = {
    name: "KRAVY SPICE VILLA",
    address: "Main Road, Gurugram, Haryana",
    gstin: "06ABCDE1234F1Z2",
    tagline: "Fresh food, fast service ❤️",
    upiId: "kravy@upi", // change later
  };

  // BILL META
  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState("");

  useEffect(() => {
    setBillNumber(`SV-${Date.now()}`);
    setBillDate(new Date().toLocaleString());
  }, []);

  // PAYMENT
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState<"Pending" | "Paid">("Pending");
  const [upiTxnRef, setUpiTxnRef] = useState("");

  // DISCOUNT
  const [billDiscountPercent, setBillDiscountPercent] = useState(0);

  // ITEMS
  const [items, setItems] = useState<BillItem[]>([]);

  // LOAD ITEMS FROM MENU
  useEffect(() => {
    const raw = localStorage.getItem("pendingCart");
    if (!raw) return;

    const cart = JSON.parse(raw);
    const parsed: BillItem[] = Object.values(cart).map((it: any) => ({
      id: it.id,
      name: it.name,
      qty: it.quantity,
      rate: Number(it.price ?? 0),
    }));
    setItems(parsed);
  }, []);

  // QTY CONTROLS
  const inc = (id: string) =>
    setItems((s) => s.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)));

  const dec = (id: string) =>
    setItems((s) =>
      s.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i)).filter((i) => i.qty > 0)
    );

  const remove = (id: string) =>
    setItems((s) => s.filter((i) => i.id !== id));

  // CLEAR BILL
  function clearBill() {
    if (!confirm("Clear current bill?")) return;
    setItems([]);
    setBillDiscountPercent(0);
    setPaymentMode("Cash");
    setPaymentStatus("Pending");
    setUpiTxnRef("");
    localStorage.removeItem("pendingCart");
  }

  // CALCULATIONS
  const GST = 5;
  const totalBeforeDiscount = items.reduce((a, i) => a + i.qty * i.rate, 0);
  const discountAmount = (totalBeforeDiscount * billDiscountPercent) / 100;
  const subTotal = totalBeforeDiscount - discountAmount;
  const gstAmount = (subTotal * GST) / 100;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const finalTotal = subTotal + gstAmount;

  // UPI
  const upiLink = `upi://pay?pa=${SHOP.upiId}&pn=${encodeURIComponent(
    SHOP.name
  )}&am=${finalTotal.toFixed(2)}&cu=INR`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiLink
  )}`;

  // SAVE
  async function saveBill() {
    await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        billNumber,
        billDate,
        items,
        billDiscountPercent,
        finalTotal,
        paymentMode,
        paymentStatus,
        upiTxnRef,
      }),
    });
  }

  // PRINT
  function printReceipt() {
    if (!receiptRef.current) return;
    const html = document.body.innerHTML;
    document.body.innerHTML = receiptRef.current.outerHTML;
    window.print();
    document.body.innerHTML = html;
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Billing</h1>

      {/* TOP ACTIONS */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Link href="/menu/view" className="border px-3 py-1 rounded">
          ➕ Add More Items
        </Link>

        <Link href="/billing/history" className="border px-3 py-1 rounded">
          🧾 Last Bills
        </Link>

        <button onClick={clearBill} className="border px-3 py-1 rounded text-red-600">
          🧹 Clear Bill
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        {/* ITEMS */}
        <div className="bg-white border rounded-lg">
          <div className="grid grid-cols-[1fr_80px_120px_100px] bg-green-500 text-white px-3 py-2 text-sm font-semibold">
            <div>Item</div>
            <div>Rate</div>
            <div>Qty</div>
            <div>Amount</div>
          </div>

          {items.length === 0 && (
            <div className="p-4 text-sm text-gray-500">No items added</div>
          )}

          {items.map((i) => (
            <div key={i.id} className="grid grid-cols-[1fr_80px_120px_100px] px-3 py-2 border-b items-center text-sm">
              <div>{i.name}</div>
              <div>₹{i.rate}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => dec(i.id)} className="border px-2">−</button>
                <span>{i.qty}</span>
                <button onClick={() => inc(i.id)} className="border px-2">+</button>
              </div>
              <div className="flex justify-between items-center">
                <span>₹{(i.qty * i.rate).toFixed(2)}</span>
                <button onClick={() => remove(i.id)} className="text-red-600 ml-2">✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* SUMMARY */}
        <div className="bg-white border rounded-lg p-4 space-y-3 text-sm">
          <div className="flex justify-between"><span>Total</span><span>₹{totalBeforeDiscount.toFixed(2)}</span></div>

          <div>
            <label className="text-xs">Discount (%)</label>
            <input
              type="number"
              value={billDiscountPercent}
              onChange={(e) => setBillDiscountPercent(Math.min(Math.max(Number(e.target.value), 0), 100))}
              className="border p-1 w-full"
            />
          </div>

          <div className="flex justify-between"><span>Sub Total</span><span>₹{subTotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>CGST</span><span>₹{cgst.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>SGST</span><span>₹{sgst.toFixed(2)}</span></div>

          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total Amount</span>
            <span>₹{finalTotal.toFixed(2)}</span>
          </div>

          {/* PAYMENT */}
          <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="border p-2 w-full">
            <option>Cash</option>
            <option>UPI</option>
            <option>Card</option>
          </select>

          {paymentMode === "UPI" && (
            <>
              <img src={qrUrl} className="mx-auto" />
              <a href={upiLink} className="block text-center text-green-600 underline">
                Pay via UPI App
              </a>
              <input
                placeholder="UPI Txn Ref"
                value={upiTxnRef}
                onChange={(e) => setUpiTxnRef(e.target.value)}
                className="border p-2 w-full"
              />
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as any)} className="border p-2 w-full">
                <option value="Pending">Payment Pending</option>
                <option value="Paid">Payment Paid</option>
              </select>
            </>
          )}

          <div className="flex gap-2">
            <button onClick={saveBill} className="flex-1 bg-gray-200 py-2 rounded">
              Save
            </button>
            <button onClick={() => { saveBill(); printReceipt(); }} className="flex-1 bg-green-600 text-white py-2 rounded">
              Save & Print
            </button>
          </div>

          <div className="text-center text-xs text-gray-500">{SHOP.tagline}</div>
        </div>
      </div>

      {/* PRINT */}
      <div ref={receiptRef} className="hidden print:block w-[80mm] text-[12px]">
        <div className="text-center font-bold">{SHOP.name}</div>
        <hr />
        {items.map((i) => (
          <div key={i.id} className="flex justify-between">
            <span>{i.name} × {i.qty}</span>
            <span>₹{(i.qty * i.rate).toFixed(2)}</span>
          </div>
        ))}
        <hr />
        <div className="flex justify-between font-bold">TOTAL <span>₹{finalTotal.toFixed(2)}</span></div>
        <div className="text-center">Payment: {paymentMode}</div>
        {paymentMode === "UPI" && <div className="text-center">Txn Ref: {upiTxnRef || "Pending"}</div>}
        <div className="text-center">{SHOP.tagline}</div>
        <div className="text-center">Thank you 🙏</div>
      </div>
    </div>
  );
}