// "use client";

// import React, { use, useEffect, useRef, useState } from "react";
// import Link from "next/link";
// import type { Bill, BusinessProfile as PrismaBusinessProfile } from "@prisma/client";

// type BillItem = {
//   name: string;
//   qty: number;
//   rate: number;
// };

// type BusinessProfile = {
//   businessName: string;
//   businessTagLine?: string;
//   gstNumber?: string;
//   businessAddress?: string;
//   district?: string;
//   state?: string;
//   pinCode?: string;
// };
// type BillResponse = {
//   bill: Bill;
//   business: PrismaBusinessProfile | null;
// };


// export default function ViewBillPage({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   // ✅ Next.js 16 async params
//   const { id } = use(params);

//   const [bill, setBill] = useState<Bill | null>(null);
//   const [business, setBusiness] = useState<PrismaBusinessProfile | null>(null);
//   const [loading, setLoading] = useState(true);
//   const receiptRef = useRef<HTMLDivElement>(null);

//   // ✅ Fetch from BillManager API
//   useEffect(() => {
//   fetch(`/api/bill-manager/${id}`)
//     .then((r) => r.json())
//     .then((data: BillResponse) => {
//       setBill(data.bill);
//       setBusiness(data.business);
//     })
//     .finally(() => setLoading(false));
// }, [id]);


//   // ✅ Print receipt function    


//   function printReceipt() {
//     if (!receiptRef.current) return;
//     const html = document.body.innerHTML;
//     document.body.innerHTML = receiptRef.current.outerHTML;
//     window.print();
//     document.body.innerHTML = html;
//   }

//   if (loading) return <p className="p-6">Loading bill...</p>;
//   if (!bill) return <p className="p-6">Bill not found</p>;

//   return (
//     <div className="p-26 space-y-6">

//       {bill.isHeld && (
//   <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded">
//     ⏸ This bill is currently on hold.  
//     Unhold the bill to proceed with printing or payment.
//   </div>
// )}
//   {bill.isHeld && (
//   <div className="bg-yellow-50 text-yellow-700 p-3 rounded">
//     ⏸ This bill is on hold. Resume it to continue.
//   </div>
// )}

//       {/* HEADER */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-xl font-semibold">
//             Bill #{bill.billNumber}
//           </h1>
//           <p className="text-sm text-gray-500">
//             {new Date(bill.createdAt).toLocaleString()}
//           </p>
//         </div>

//         {/* CUSTOMER DETAILS */}
// <div className="border rounded-lg p-3 bg-white">
//   <p className="text-sm font-medium mb-1">Customer Details</p>

//   <p className="text-sm">
//     <span className="font-medium">Name:</span>{" "}
//     {bill.customerId || "Walk-in Customer"}
//   </p>

//   <p className="text-sm">
//     <span className="font-medium">Customer:</span>{" "}
//     {bill.customerId || "Walk-in Customer"}
//   </p>

// </div>

//         <div className="flex gap-2">
//          <button
//   onClick={printReceipt}
//   disabled={bill.isHeld}
//   className="border px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
// >
//   Print
// </button>
//       <button disabled={bill.isHeld}className="border px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
// >
//   Share
// </button>

// <button disabled={bill.isHeld}className="border px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
// >
//   Download PDF
// </button>

//           <Link
//             href="/billing"
//             className="border px-3 py-1 rounded"
//           >
//             Back
//           </Link>
//         </div>
//       </div>

//       {/* BILL DETAILS */}
//       <div className="bg-white border rounded-xl p-6 space-y-4">
//         {/* CUSTOMER */}
//         <div>
//           <p className="text-sm text-gray-500">Customer</p>
//           <p className="font-medium">
//             {bill.customerName ?? "Walk-in Customer"}
//           </p>
//         </div>

//         {/* ITEMS */}
//         <div className="border rounded-lg overflow-hidden">
//           <table className="w-full text-sm">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="p-3 text-left">Item</th>
//                 <th className="p-3 text-right">Qty</th>
//                 <th className="p-3 text-right">Rate</th>
//                 <th className="p-3 text-right">Amount</th>
//               </tr>
//             </thead>
//             <tbody>
//               {Array.isArray(bill.items) &&
//                 bill.items.map((i, idx) => (
//                   <tr key={idx} className="border-t">
//                     <td className="p-3">{i.name}</td>
//                     <td className="p-3 text-right">{i.qty}</td>
//                     <td className="p-3 text-right">
//                       ₹{i.rate.toFixed(2)}
//                     </td>
//                     <td className="p-3 text-right">
//                       ₹{(i.qty * i.rate).toFixed(2)}
//                     </td>
//                   </tr>
//                 ))}
//             </tbody>
//           </table>
//         </div>

//         {/* TOTALS */}
//         <div className="flex justify-end">
//           <div className="w-full max-w-xs space-y-2 text-sm">
//             <Row label="Subtotal" value={bill.subtotal} />
//             <Row label="Discount" value={bill.discount} />
//             <Row label="Tax" value={bill.tax} />
//             <Row label="Total" value={bill.total} bold />
//           </div>
//         </div>

//         {/* PAYMENT */}
//         <div className="border-t pt-4 text-sm space-y-1">
//           <p>
//             <b>Payment Mode:</b> {bill.paymentMode}
//           </p>
//           <p>
//             <b>Status:</b> {bill.paymentStatus}
//           </p>
//           {bill.upiTxnRef && (
//             <p>
//               <b>Txn Ref:</b> {bill.upiTxnRef}
//             </p>
//           )}
//         </div>
//       </div>

//       {/* PRINT RECEIPT */}
//       <div
//         ref={receiptRef}
//         className="hidden print:block w-[80mm] text-[12px]"
//       >
//         {/* LOGO */}
//           {business?.logoUrl && (
//             <div className="flex justify-center mb-1">
//               <img
//                 src={business.logoUrl}
//                 alt={business.businessName}
//                 className="max-h-[40px] object-contain"
//                 onError={(e) => {
//                   (e.currentTarget as HTMLImageElement).style.display = "none";
//                 }}
//               />
//             </div>
//           )}

//        <div className="text-center font-bold text-[13px]">
//           {business?.businessName}
//           </div>

//           {(business?.businessAddress ||
//             business?.district ||
//             business?.state ||
//             business?.pinCode) && (
//             <div className="text-center text-[9px]">
//               {business.businessAddress}
//               {business.district && `, ${business.district}`}
//               {business.state && `, ${business.state}`}
//               {business.pinCode && ` - ${business.pinCode}`}
//             </div>
//           )}

//           {business?.gstNumber && (
//             <div className="text-center text-[9px]">
//               GSTIN: {business.gstNumber}
//             </div>
//           )}
//            {/* BILL META */}
//             <div className="text-center text-[9px]">
//               Bill No: {bill.billNumber}
//             </div>
//             <div className="text-center text-[9px]">
//               Date: {new Date(bill.createdAt).toLocaleString()}
//             </div>

//             <hr />

//         <hr />
//           {(bill.customerName || bill.customerPhoneNumber) && (
//           <>
//           <div>Customer: {bill.customerName || "Walk-in Customer"}</div>
//           {bill.customerPhoneNumber && <div>Phone: {bill.customerPhoneNumber}</div>}
//           <hr />
//           </>
//           )}
//         {/* ITEM HEADER */}
//           <div className="flex justify-between font-semibold text-[9px] border-b border-dashed pb-1">
//             <span className="w-[28mm]">Item</span>
//             <span className="w-[8mm] text-right">Qty</span>
//             <span className="w-[10mm] text-right">Rate</span>
//             <span className="w-[12mm] text-right">Amt</span>
//           </div>

//        {/* ITEMS */}
//           {bill.items.map((i, idx) => (
//             <div
//               key={idx}
//               className="flex justify-between text-[9px] mt-1"
//             >
//               <span className="w-[28mm] truncate">
//                 {i.name}
//               </span>
//               <span className="w-[8mm] text-right">
//                 {i.qty}
//               </span>
//               <span className="w-[10mm] text-right">
//                 {i.rate.toFixed(2)}
//               </span>
//               <span className="w-[12mm] text-right">
//                 {(i.qty * i.rate).toFixed(2)}
//               </span>
//             </div>
//           ))}
//           <div className="border-t border-dashed my-1" />

//           {/* SUBTOTAL */}
//           <div className="flex justify-between text-[9px]">
//             <span>Subtotal</span>
//             <span>₹{bill.subtotal.toFixed(2)}</span>
//           </div>

//           {/* GST */}
//           <div className="flex justify-between text-[9px]">
//             <span>GST</span>
//             <span>₹{bill.tax.toFixed(2)}</span>
//           </div>

//           <div className="border-t border-dashed my-1" />

//           {/* GRAND TOTAL */}
//           <div className="flex justify-between font-bold text-[11px]">
//             <span>GRAND TOTAL</span>
//             <span>₹{bill.total.toFixed(2)}</span>
//           </div>

//           <div className="border-t border-dashed my-1" />

//          {/* PAYMENT MODE */}
// <div className="text-center text-[9px]">
//   Payment: {bill.paymentMode}
// </div>

// {/* UPI QR INSIDE RECEIPT */}
// {bill.paymentMode === "UPI" && business?.upi && (
//   <>
//     <div className="flex justify-center my-2">
//       <img
//         src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
//           `upi://pay?pa=${business.upi}&pn=${encodeURIComponent(
//             business.businessName
//           )}&am=${bill.total}&cu=INR`
//         )}`}
//         alt="UPI QR"
//         className="w-[28mm]"
//       />
//     </div>

//     <div className="text-center text-[9px]">
//       Scan & Pay via UPI
//     </div>

//     {bill.upiTxnRef && (
//       <div className="text-center text-[9px]">
//         Txn Ref: {bill.upiTxnRef}
//       </div>
//     )}
//   </>
// )}

//           {business?.businessTagLine && (
//             <div className="text-center text-[9px] mt-1">
//               {business.businessTagLine}
//             </div>
//           )}

//           <div className="text-center font-semibold text-[10px] mt-1">
//             Thank you 🙏
//           </div>

//       </div>
//     </div>
//   );
// }

// /* ---------- SAFE ROW ---------- */

// function Row({
//   label,
//   value,
//   bold,
// }: {
//   label: string;
//   value?: number;
//   bold?: boolean;
// }) {
//   return (
//     <div
//       className={`flex justify-between ${
//         bold ? "font-semibold text-base" : ""
//       }`}
//     >
//       <span>{label}</span>
//       <span>₹{(value ?? 0).toFixed(2)}</span>
//     </div>
//   );
// }





/* ======================================================*/

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  MessageCircle, Printer, Download, ArrowLeft, Receipt, 
  Calendar, Clock, UtensilsCrossed, User, Phone, 
  CreditCard, CheckCircle2, AlertCircle, IndianRupee 
} from "lucide-react";
import { formatWhatsAppNumber } from "@/lib/whatsapp";
import { WhatsAppBillButton } from "@/components/WhatsAppBillButton";
import type {
  BillManager,
  BusinessProfile as PrismaBusinessProfile,
} from "@prisma/client";


type BillItem = {
  name: string;
  qty: number;
  rate: number;
};

type BusinessProfile = {
  businessName: string;
  businessTagLine?: string;
  gstNumber?: string;
  businessAddress?: string;
  district?: string;
  state?: string;
  pinCode?: string;
};

type BillResponse = {
  bill: BillManager;
  business: PrismaBusinessProfile | null;
};




export default function ViewBillPage() {
  const params = useParams();
  const id = params.id as string;

  const [bill, setBill] = useState<BillManager | null>(null);
  const [business, setBusiness] = useState<PrismaBusinessProfile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);


  // ✅ Fetch Role
  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => setUserRole(data.role))
      .catch(err => console.error("Failed to fetch role", err));
  }, []);

  // ✅ Fetch from BillManager API
  useEffect(() => {
    fetch(`/api/bill-manager/${id}`)
      .then((r) => r.json())
      .then((data: BillResponse) => {
        setBill(data.bill);
        setBusiness(data.business);
      })
      .finally(() => setLoading(false));
  }, [id]);


  // ✅ Print receipt function    


  function printReceipt() {
    // We already have @media print styles that handle visibility
    // No need to swap body.innerHTML, which breaks React state.
    window.print();
  }

  const handleWhatsApp = async () => {
    if (!bill) return;
    let pdfUrl = (bill as any).pdfUrl;
    const origin = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;

    // 1. Try to fetch Cloudinary URL if missing
    if (!pdfUrl) {
      try {
        const res = await fetch(`/api/bill-manager/${bill.id}/pdf${bill.clerkUserId ? `?clerkId=${bill.clerkUserId}` : ""}&json=true`);
        const data = await res.json();
        if (data && data.url) {
          pdfUrl = data.url;
        }
      } catch (err) {
        console.error("Failed to get PDF URL:", err);
      }
    }

    // 2. FINAL FALLBACK: If still null, use the local API URL
    if (!pdfUrl) {
      pdfUrl = `${origin}/api/bill-manager/${bill.id}/pdf${bill.clerkUserId ? `?clerkId=${bill.clerkUserId}` : ""}`;
    }

    // 3. Prepare Items Summary
    const itemsList = billItems
      .map((i) => `• ${i.name} ×${i.qty} – ₹${(i.qty * i.rate).toFixed(2)}`)
      .join("\n");

    const phone = formatWhatsAppNumber(bill.customerPhone);
    const restaurantName = business?.businessName || "Kravy POS";
    // origin is already declared above at line 460
    const menuUrl = `${origin}/menu/${bill.clerkUserId}`;
    const showMenu = business?.menuLinkEnabled !== false;
    
    // Using string concatenation to ensure best emoji compatibility
    const message = encodeURIComponent(
      "🙏 *Thank you for shopping with us!*\n\n" +
      `Hello *${bill.customerName || "Customer"}*,\n\n` +
      `Here is your invoice from *${restaurantName}*:\n\n` +
      "🧾 *Bill No:* " + bill.billNumber + "\n" +
      "💰 *Amount Paid:* Rs. " + bill.total + "\n\n" +
      "📄 *Download Invoice:*\n" +
      pdfUrl + "\n\n" +
      (showMenu ? ("🍴 *View Our Menu:*\n" + menuUrl + "\n\n") : "") +
      "We look forward to serving you again! 😊"
    );
    window.open(phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`, "_blank");
  };

  if (loading) return <p className="p-6">Loading bill...</p>;
  if (!bill) return <p className="p-6">Bill not found</p>;
  const billItems: BillItem[] = Array.isArray(bill.items)
    ? (bill.items as any[]).map((i: any) => ({
      name: i.name || "Unknown Item",
      qty: Number(i.qty ?? i.quantity ?? 0),
      rate: Number(i.rate ?? i.price ?? 0),
    }))
    : [];


  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-6 lg:p-10 space-y-8 max-w-5xl mx-auto">
      
      {/* ── Status Alerts ── */}
      {bill.isHeld && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 rounded-3xl shadow-sm animate-pulse">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
            <Clock size={20} className="animate-spin" />
          </div>
          <div>
            <p className="font-black text-sm uppercase tracking-tight">Bill is on Hold</p>
            <p className="text-xs font-medium opacity-80">Unhold the bill to proceed with printing or payment.</p>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-500/20 flex-shrink-0">
            <Receipt className="text-white" size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Bill <span className="text-indigo-600 dark:text-indigo-400">#{bill.billNumber}</span>
              </h1>
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${bill.paymentStatus?.toLowerCase() === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'}`}>
                {bill.paymentStatus || 'Pending'}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar size={14} />
              {new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              <span className="opacity-30 mx-1">|</span>
              <Clock size={14} />
              {new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button
            onClick={printReceipt}
            disabled={bill.isHeld}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl font-black text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            <Printer size={18} className="text-indigo-500" />
            Print
          </button>

          {(userRole === "ADMIN" || userRole === "OWNER" || userRole === "SELLER" || userPermissions.includes("whatsapp-bill")) && (
            <WhatsAppBillButton 
              billId={id} 
              defaultPhone={bill.customerPhone || ""} 
              onSent={() => {}} 
            />
          )}

          <button
            onClick={() => window.open((bill as any).pdfUrl || `/api/bill-manager/${bill.id}/pdf${bill.clerkUserId ? `?clerkId=${bill.clerkUserId}` : ""}`, "_blank")}
            disabled={bill.isHeld}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl font-black text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            <Download size={18} className="text-sky-500" />
            PDF
          </button>

          <Link
            href="/dashboard/billing"
            className="flex-1 lg:flex-none flex items-center justify-center gap-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-lg shadow-slate-200 dark:shadow-none active:scale-[0.98]"
          >
            <ArrowLeft size={18} />
            Back
          </Link>
        </div>
      </header>

      {/* ── Bill Body ── */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Items & Details */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <UtensilsCrossed size={16} /> Order Summary
              </h2>
              <span className="text-xs font-black px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-400">
                {billItems.length} Items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 dark:border-slate-800">
                    <th className="px-6 py-4 text-left">Product</th>
                    <th className="px-4 py-4 text-center">Qty</th>
                    <th className="px-4 py-4 text-right">Price</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {billItems.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{item.name}</p>
                        {/* If we have category or HSN info we could add it here */}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {item.qty}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-slate-500 dark:text-slate-400 text-sm">
                        ₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">
                        ₹{(item.qty * item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-end border-t border-slate-100 dark:border-slate-800">
              <div className="w-full max-w-[280px] space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-500 dark:text-slate-400">Subtotal</span>
                  <span className="font-black text-slate-900 dark:text-white">₹{bill.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {bill.tax ? (
                   <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500 dark:text-slate-400">GST / Tax</span>
                    <span className="font-black text-amber-600 dark:text-amber-400">₹{bill.tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                ) : null}
                <div className="h-px bg-slate-200 dark:bg-slate-700 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-base font-black text-slate-900 dark:text-white">Grand Total</span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">₹{bill.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Information Cards */}
        <div className="space-y-6">
          {/* Customer Info Card */}
          <section className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
              <User size={80} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
              <User size={14} className="text-indigo-500" /> Customer Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Full Name</p>
                <p className="text-lg font-black text-slate-800 dark:text-slate-200">{bill.customerName || "Walk-in Customer"}</p>
              </div>
              {bill.customerPhone && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Phone Number</p>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Phone size={14} className="text-emerald-500" />
                    {bill.customerPhone}
                  </p>
                </div>
              )}
               {(bill as any).buyerGSTIN && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">GSTIN Number</p>
                  <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase">{(bill as any).buyerGSTIN}</p>
                </div>
              )}
            </div>
          </section>

          {/* Payment Info Card */}
          <section className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
              <CreditCard size={80} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
              <CreditCard size={14} className="text-emerald-500" /> Payment Details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Payment Mode</p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{bill.paymentMode || "Cash"}</p>
                </div>
                <div className={`p-2 rounded-xl ${bill.paymentStatus?.toLowerCase() === 'paid' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30'}`}>
                  {bill.paymentStatus?.toLowerCase() === 'paid' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                </div>
              </div>
              
              {bill.upiTxnRef && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Transaction ID</p>
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    {bill.upiTxnRef}
                  </p>
                </div>
              )}

              {bill.tableName && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Source / Table</p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-black uppercase">
                    <UtensilsCrossed size={12} />
                    {bill.tableName}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Quick Info Bar */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-[28px] p-6 text-white shadow-lg shadow-indigo-500/30">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Business Name</p>
            <p className="text-xl font-black truncate mb-4">{business?.businessName}</p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">Total Bill</p>
                <p className="text-lg font-black tracking-tight">₹{bill.total.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <IndianRupee size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT RECEIPT (Optimized for 2-inch / 58mm Thermal Printers) */}
      <style jsx global>{`
        @media print {
          @page {
            size: 58mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            width: 58mm;
            background: white;
          }
          /* Hide everything except the receipt */
          body * {
            visibility: hidden;
          }
          .thermal-receipt, .thermal-receipt * {
            visibility: visible;
          }
          .thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 58mm;
            padding: 2mm;
            box-sizing: border-box;
          }
          /* Remove browser headers/footers */
          header, footer { display: none !important; }
        }
      `}</style>

      <div
        ref={receiptRef}
        className="hidden print:block thermal-receipt w-[58mm] text-[10px] leading-tight font-sans text-black"
      >
        {/* LOGO */}
        {business?.logoUrl && (
          <div className="flex justify-center mb-1">
            <img
              src={business.logoUrl}
              alt={business.businessName ?? "Business logo"}
              className="max-h-[40px] object-contain"
            />

          </div>
        )}

        <div 
          className="text-center font-bold"
          style={{ 
            fontSize: business?.businessNameSize === 'medium' ? '12px' : 
                      business?.businessNameSize === 'xlarge' ? '22px' : '17px',
            lineHeight: '1.2'
          }}
        >
          {business?.businessName}
        </div>

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

        {business?.gstNumber && (
          <div className="text-center text-[9px]">
            GSTIN: {business.gstNumber}
          </div>
        )}
        {/* BILL META */}
        <div className="text-center text-[9px]">
          Bill No: {bill.billNumber}
        </div>
        <div className="text-center text-[9px]">
          Date: {new Date(bill.createdAt).toLocaleString()}
        </div>

        {/* ✅ ADD BUYER GSTIN & POS */}
        {(bill as any).buyerGSTIN && (
          <div className="text-center text-[10px] font-bold mt-1">
            Buyer GSTIN: {(bill as any).buyerGSTIN}
          </div>
        )}
        {(bill as any).placeOfSupply && (
          <div className="text-center text-[9px]">
            POS: {(bill as any).placeOfSupply}
          </div>
        )}

        <hr />

        <hr />
        {(bill.customerName || bill.customerPhone) && (
          <>
            <div>Customer: {bill.customerName || "Walk-in Customer"}</div>
            {bill.customerPhone && <div>Phone: {bill.customerPhone}</div>}
            <hr />
          </>
        )}
        {/* ITEM HEADER */}
        <div className="flex justify-between font-bold text-[11px] border-b border-dashed pb-1 mb-1">
          <span className="w-[24mm]">Item</span>
          <span className="w-[6mm] text-right">Qty</span>
          <span className="w-[9mm] text-right">Rate</span>
          <span className="w-[11mm] text-right">Amt</span>
        </div>

        {/* ITEMS */}
        {billItems.map((i, idx) => {
          const itemData = (bill.items as any[])?.[idx] || {};
          const hsnCode = itemData.hsnCode ? ` (${itemData.hsnCode})` : "";
          
          return (
            <div
              key={idx}
              className="flex justify-between text-[11px] mt-1 leading-tight font-medium"
            >
              <span className="w-[24mm] break-words">
                {i.name}{hsnCode}
              </span>
              <span className="w-[6mm] text-right">
                {i.qty}
              </span>
              <span className="w-[9mm] text-right">
                {i.rate.toFixed(0)}
              </span>
              <span className="w-[11mm] text-right">
                {(i.qty * i.rate).toFixed(0)}
              </span>
            </div>
          );
        })}
        <div className="border-t border-dashed my-1" />

        {/* SUBTOTAL */}
        <div className="flex justify-between text-[10px] font-medium">
          <span>Subtotal</span>
          <span>₹{Number(bill.subtotal ?? 0).toFixed(2)}</span>
        </div>

        {/* GST BREAKUP */}
        {(() => {
          const items = Array.isArray(bill.items) ? bill.items : [];
          const placeOfSupply = (bill as any).placeOfSupply;
          const isInterState = placeOfSupply && business?.state && 
            placeOfSupply.trim().toLowerCase() !== business.state.trim().toLowerCase();
          
          const taxGroups: Record<number, any> = {};
          items.forEach((item: any) => {
            const qty = Number(item.qty ?? item.quantity ?? 0);
            const rate = Number(item.rate ?? item.price ?? 0);
            const gstRate = Number(item.gst || (business?.taxRate ?? 0));
            const taxStatus = item.taxStatus || "Without Tax";
            const gross = qty * rate;
            
            let taxable = gross;
            let gst = 0;
            if (taxStatus === "With Tax") {
              taxable = gross / (1 + gstRate / 100);
              gst = gross - taxable;
            } else {
              gst = (gross * gstRate) / 100;
            }

            if (!taxGroups[gstRate]) taxGroups[gstRate] = { rate: gstRate, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
            taxGroups[gstRate].taxable += taxable;
            if (isInterState) {
              taxGroups[gstRate].igst += gst;
            } else {
              taxGroups[gstRate].cgst += gst / 2;
              taxGroups[gstRate].sgst += gst / 2;
            }
          });

          const groups = Object.values(taxGroups).filter(g => g.rate > 0);
          if (groups.length === 0) return (
            <div className="flex justify-between text-[10px] font-medium">
              <span>GST</span>
              <span>₹{(bill.tax ?? 0).toFixed(2)}</span>
            </div>
          );

          return (
            <div className="mt-1">
              {Object.values(taxGroups).filter((g:any) => g.rate > 0).map((g: any, idx) => (
                <div key={idx} className="space-y-0.5">
                  {g.igst > 0 ? (
                    <div className="flex justify-between text-[9px] text-gray-600">
                      <span>IGST ({g.rate}%)</span>
                      <span>₹{g.igst.toFixed(2)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-[9px] text-gray-600">
                        <span>CGST ({g.rate/2}%)</span>
                        <span>₹{g.cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-gray-600">
                        <span>SGST ({g.rate/2}%)</span>
                        <span>₹{g.sgst.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
              <div className="flex justify-between text-[10px] font-bold mt-0.5 pt-0.5 border-t border-dashed">
                <span>Total GST</span>
                <span>₹{(bill.tax ?? 0).toFixed(2)}</span>
              </div>
            </div>
          );
        })()}

        <div className="border-t border-dashed my-1" />

        {/* GRAND TOTAL */}
        <div className="flex justify-between font-bold text-[13px]">
          <span>TOTAL</span>
          <span>₹{Number(bill.total ?? 0).toFixed(2)}</span>
        </div>

        <div className="border-t border-dashed my-1" />

        {/* PAYMENT MODE */}
        <div className="text-center text-[10px] font-bold">
          Payment Method: {bill.paymentMode}
        </div>

        {/* UPI QR INSIDE RECEIPT */}
        {bill.paymentMode === "UPI" && business?.upi && (
          <>
            <div className="flex justify-center my-2">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                  `upi://pay?pa=${business.upi}&pn=${encodeURIComponent(
                    business.businessName ?? ""
                  )}&am=${bill.total}&cu=INR`
                )}`}
                alt="UPI QR"
                className="w-[24mm] h-[24mm]"
              />
            </div>

            <div className="text-center text-[10px] font-bold">
              Scan & Pay via UPI
            </div>

            {bill.upiTxnRef && (
              <div className="text-center text-[9px]">
                Txn Ref: {bill.upiTxnRef}
              </div>
            )}
          </>
        )}

        {business?.businessTagLine && (
          <div className="text-center text-[9px] mt-1">
            {business.businessTagLine}
          </div>
        )}

        <div className="text-center font-semibold text-[10px] mt-1 mb-8 whitespace-pre-wrap">
          {business?.greetingMessage || "Thank you 🙏"}
        </div>
        
        {/* Extra space for physical cutter */}
        <div className="h-[15mm] block print:block" />

      </div>
    </div>
  );
}

/* ---------- SAFE ROW ---------- */

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value?: number;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${bold ? "font-semibold text-base" : ""
        }`}
    >
      <span>{label}</span>
      <span>₹{(value ?? 0).toFixed(2)}</span>
    </div>
  );
}