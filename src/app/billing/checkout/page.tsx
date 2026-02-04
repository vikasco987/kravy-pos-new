
// // src/app/billing/checkout/page.tsx
// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useSearchParams } from "next/navigation";


// type BillItem = {
//   id: string;
//   name: string;
//   qty: number;
//   rate: number;
// };

// export default function BillingPage() {
//   const receiptRef = useRef<HTMLDivElement | null>(null);

//   // SHOP DETAILS
//   const SHOP = {
//     name: "KRAVY SPICE VILLA",
//     address: "Main Road, Gurugram, Haryana",
//     gstin: "06ABCDE1234F1Z2",
//     tagline: "Fresh food, fast service ❤️",
//     upiId: "kravy@upi", // change later
//   };

//   // BILL META
//   const [billNumber, setBillNumber] = useState("");
//   const [billDate, setBillDate] = useState("");
//   const [savedBill, setSavedBill] = useState<any>(null);
//   const router = useRouter();
//   const [customerName, setCustomerName] = useState("");
//   const [customerPhone, setCustomerPhone] = useState("");
//   const searchParams = useSearchParams();
// const resumeBillId = searchParams.get("resume");
// const [currentBillId, setCurrentBillId] = useState<string | null>(null);



//  useEffect(() => {
//   if (!resumeBillId) return;

//   async function loadHeldBill() {
//     const res = await fetch(`/api/bill-manager/${resumeBillId}`);
//     if (!res.ok) {
//       alert("Failed to load held bill");
//       return;
//     }

//     const bill = await res.json();

//     // restore data
//     setItems(bill.items || []);
//     setCustomerName(bill.customerName || "");
//     setCustomerPhone(bill.customerPhone || "");
//     setBillDiscountPercent(
//       bill.subtotal > 0
//         ? Math.round(((bill.discount || 0) / bill.subtotal) * 100)
//         : 0
//     );

//     setPaymentMode(bill.paymentMode || "Cash");
//     setPaymentStatus("Pending");

//     // 🔓 UNHOLD THE BILL
//     await fetch(`/api/bill-manager/${resumeBillId}/hold`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ isHeld: false }),
//     });
//   }

//   loadHeldBill();
// }, [resumeBillId]);




//   useEffect(() => {
//     setBillNumber(`SV-${Date.now()}`);
//     setBillDate(new Date().toLocaleString());
//   }, []);

//   // PAYMENT
//   const [paymentMode, setPaymentMode] = useState("Cash");
//   const [paymentStatus, setPaymentStatus] = useState<"Pending" | "Paid">("Pending");
//   const [upiTxnRef, setUpiTxnRef] = useState("");

//         useEffect(() => {
//         // ❌ Do nothing if bill is being held
//         if (items.length === 0) return;

//         if (paymentMode === "UPI") {
//           setPaymentStatus("Paid");
//         }

//         if (paymentMode === "Cash") {
//         setPaymentStatus(bill.paymentStatus === "Paid" ? "Paid" : "Pending");
//         }
//         }, [paymentMode]);

//   // DISCOUNT
//   const [billDiscountPercent, setBillDiscountPercent] = useState(0);

//   // ITEMS
//   const [items, setItems] = useState<BillItem[]>([]);

//   // LOAD ITEMS FROM MENU
//   useEffect(() => {
//     const raw = localStorage.getItem("pendingCart");
//     if (!raw) return;

//     const cart = JSON.parse(raw);
//     const parsed: BillItem[] = Object.values(cart).map((it: any) => ({
//       id: it.id,
//       name: it.name,
//       qty: it.quantity,
//       rate: Number(it.price ?? 0),
//     }));
//     setItems(parsed);
//   }, []);

//   // QTY CONTROLS
//   const inc = (id: string) =>
//     setItems((s) => s.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)));

//   const dec = (id: string) =>
//     setItems((s) =>
//       s.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i)).filter((i) => i.qty > 0)
//     );

//   const remove = (id: string) =>
//     setItems((s) => s.filter((i) => i.id !== id));

//   // whatsapp link
// function formatWhatsAppNumber(phone?: string | null) {
//   if (!phone) return null;

//   const digits = phone.replace(/\D/g, "");

//   //send invoice via WhatsApp 
//       function sendInvoiceOnWhatsApp(bill: any) {
//         const phone = formatWhatsAppNumber(bill.customerPhone);

//         const pdfUrl = `${window.location.origin}/api/bill-manager/${bill.id}/pdf`;

//         const message = encodeURIComponent(
//           `🙏 Thank you for shopping with ${SHOP.name}!\n\n` +
//           `Hello ${bill.customerName || "Customer"},\n\n` +
//           `Here is your invoice:\n` +
//           `🧾 Bill No: ${bill.billNumber}\n` +
//           `💰 Amount Paid: ₹${bill.total}\n\n` +
//           `📄 Download Invoice:\n${pdfUrl}\n\n` +
//           `We look forward to serving you again 😊`
//         );


//         if (phone) {
//           window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
//         } else {
//           window.open(`https://wa.me/?text=${message}`, "_blank");
//         }
//       }


//   // India default
//   if (digits.length === 10) return `91${digits}`;

//   // Already has country code
//   return digits;
// }


//   // CLEAR BILL
//   function clearBill() {
//     if (!confirm("Clear current bill?")) return;
//     setItems([]);
//     setBillDiscountPercent(0);
//     setPaymentMode("Cash");
//     setPaymentStatus("Pending");
//     setUpiTxnRef("");
//     localStorage.removeItem("pendingCart");
//   }

//   // CALCULATIONS
//   const GST = 5;
//   const totalBeforeDiscount = items.reduce((a, i) => a + i.qty * i.rate, 0);
//   const discountAmount = (totalBeforeDiscount * billDiscountPercent) / 100;
//   const subTotal = totalBeforeDiscount - discountAmount;
//   const gstAmount = (subTotal * GST) / 100;
//   const cgst = gstAmount / 2;
//   const sgst = gstAmount / 2;
//   const finalTotal = subTotal + gstAmount;

//   // UPI
//   const upiLink = `upi://pay?pa=${SHOP.upiId}&pn=${encodeURIComponent(
//     SHOP.name
//   )}&am=${finalTotal.toFixed(2)}&cu=INR`;

//   const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
//     upiLink
//   )}`;



//   // SAVE BILL
// async function saveBill(options?: { hold?: boolean }) {
//   if (items.length === 0) {
//     alert("Cannot save empty bill");
//     return null;
//   }

//   // 1️⃣ CALCULATIONS
//   const subtotal = items.reduce(
//     (sum, i) => sum + i.qty * i.rate,
//     0
//   );

//   const discount = (subtotal * billDiscountPercent) / 100;
//   const taxableAmount = subtotal - discount;
//   const tax = (taxableAmount * GST) / 100;
//   const total = taxableAmount + tax;

//   // 2️⃣ FINAL PAYMENT STATUS (SOURCE OF TRUTH)
//   let finalPaymentStatus: "Paid" | "Pending" | "HELD";

//   if (options?.hold) {
//     finalPaymentStatus = "HELD";
//   } else if (paymentMode === "Cash") {
//     finalPaymentStatus = "Paid"; // ✅ ONLY ON SAVE
//   } else {
//     finalPaymentStatus =
//       paymentStatus === "Paid" ? "Paid" : "Pending";
//   }

//   // 3️⃣ PAYLOAD
//   const payload = {
//     items,
//     subtotal,
//     discount,
//     tax,
//     total,
//     paymentMode,
//     paymentStatus: finalPaymentStatus,
//     isHeld: options?.hold ?? false,
//     upiTxnRef: upiTxnRef || null,
//     customerName: customerName || "Walk-in Customer",
//     customerPhone: customerPhone || null,
//   };

//   // 4️⃣ API CALL
//   try {
//     const response = await fetch("/api/bill-manager", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     if (!response.ok) {
//       const err = await response.json();
//       alert(err.error || "Failed to save bill");
//       return null;
//     }

//     // 5️⃣ RESPONSE
//     const data = await response.json();
//     localStorage.removeItem("pendingCart");

//     // 6️⃣ RETURN BILL
//     return data.bill;
//   } catch (err) {
//     console.error("SAVE BILL ERROR:", err);
//     alert("Something went wrong");
//     return null;
//   }
// }

// // HOLD BILL
// // HOLD BILL
// async function holdBill() {
//   if (items.length === 0) {
//     alert("Cannot hold empty bill");
//     return;
//   }

//   // 🔢 Calculate totals
//   const subtotal = items.reduce(
//     (sum, i) => sum + i.qty * i.rate,
//     0
//   );

//   const discount = (subtotal * billDiscountPercent) / 100;
//   const taxableAmount = subtotal - discount;
//   const tax = (taxableAmount * GST) / 100;
//   const total = taxableAmount + tax;

//   const payload = {
//     items,
//     subtotal,
//     discount,
//     tax,
//     total,
//     paymentMode, // can be Cash / UPI, doesn’t matter
//     paymentStatus: "HELD", // 🔒 FORCE
//     isHeld: true,
//     upiTxnRef: null,
//     customerName: customerName || "Walk-in Customer",
//     customerPhone: customerPhone || null,
//   };

//   try {
//     const res = await fetch("/api/bill-manager", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     if (!res.ok) {
//       alert("Failed to hold bill");
//       return;
//     }

//     alert("Bill held successfully");

//     // 🧹 Clear checkout
//     setItems([]);
//     setCustomerName("");
//     setCustomerPhone("");
//     setBillDiscountPercent(0);
//     setPaymentMode("Cash");
//     setPaymentStatus("Pending");
//   } catch (err) {
//     console.error("HOLD BILL ERROR:", err);
//     alert("Something went wrong");
//   }
// }


//   // PRINT
//   function printReceipt() {
//     if (!receiptRef.current) return;
//     const html = document.body.innerHTML;
//     document.body.innerHTML = receiptRef.current.outerHTML;
//     window.print();
//     document.body.innerHTML = html;
//   }

//   return (
//     <div className="max-w-7xl mx-auto p-4 pt-18">
//       <h1 className="text-xl font-bold mb-4">Billing</h1>

//         {/* CHECKOUT QUICK ACTIONS */}
// <div className="flex gap-5 mb-3">
//   <Link
//     href="/menu/view"
//     className="flex-3 border-2 py-2  rounded text-center text-sm"
//   >
//     ➕ Add More Items
//   </Link>

//   <button
//     onClick={clearBill}
//     disabled={items.length === 0}
//     className="flex-3 border-2 py-2 rounded text-sm text-red-600 disabled:opacity-50"
//   >
//     🧹 Clear Bill
//   </button>
// </div>


//       {/* TOP ACTIONS */}
//      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
      
//   {/* LEFT COLUMN */}
//   <div className="space-y-4">

//     {/* CUSTOMER DETAILS */}
//     <div className="border rounded-lg p-3 space-y-2 bg-white">
//       <p className="text-sm font-medium">Customer Details (optional)</p>

//       <input
//         placeholder="Customer name"
//         value={customerName}
//         onChange={(e) => setCustomerName(e.target.value)}
//         className="border p-2 w-full rounded"
//       />

//       <input
//         placeholder="Customer phone"
//         value={customerPhone}
//         onChange={(e) => setCustomerPhone(e.target.value)}
//         className="border p-2 w-full rounded"
//       />
//     </div>

//     {/* ITEMS */}
//     <div className="bg-white border rounded-lg">
//       <div className="grid grid-cols-[1fr_80px_120px_100px] bg-green-500 text-white px-3 py-2 text-sm font-semibold">
//         <div>Item</div>
//         <div>Rate</div>
//         <div>Qty</div>
//         <div>Amount</div>
//       </div>

//       {items.length === 0 && (
//         <div className="p-4 text-sm text-gray-500">No items added</div>
//       )}

//       {items.map((i) => (
//         <div
//           key={i.id}
//           className="grid grid-cols-[1fr_80px_120px_100px] px-3 py-2 border-b items-center text-sm"
//         >
//           <div>{i.name}</div>
//           <div>₹{i.rate}</div>
//           <div className="flex items-center gap-2">
//             <button onClick={() => dec(i.id)} className="border px-2">−</button>
//             <span>{i.qty}</span>
//             <button onClick={() => inc(i.id)} className="border px-2">+</button>
//           </div>
//           <div className="flex justify-between items-center">
//             <span>₹{(i.qty * i.rate).toFixed(2)}</span>
//             <button onClick={() => remove(i.id)} className="text-red-600 ml-2">✕</button>
//           </div>
//         </div>
//       ))}
//     </div>

//   </div>


//   {/* RIGHT COLUMN – SUMMARY */}
//          <div className="bg-white border rounded-lg p-4 space-y-3 text-sm">
//           <div className="flex justify-between"><span>Total</span><span>₹{totalBeforeDiscount.toFixed(2)}</span></div>


//           <div>
//             <label className="text-xs">Discount (%)</label>
//             <input
//               type="number"
//               value={billDiscountPercent}
//               onChange={(e) => setBillDiscountPercent(Math.min(Math.max(Number(e.target.value), 0), 100))}
//               className="border p-1 w-full"
//             />
//           </div>

        
//           <div className="flex justify-between"><span>Sub Total</span><span>₹{subTotal.toFixed(2)}</span></div>
//           <div className="flex justify-between"><span>CGST</span><span>₹{cgst.toFixed(2)}</span></div>
//           <div className="flex justify-between"><span>SGST</span><span>₹{sgst.toFixed(2)}</span></div>

//           <div className="flex justify-between font-bold text-lg border-t pt-2">
//             <span>Grand Total</span>
//             <span>₹{finalTotal.toFixed(2)}</span>
//           </div>

//           {/* PAYMENT */}
//           <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="border p-2 w-full">
//             <option>Cash</option>
//             <option>UPI</option>
//             <option>Card</option>
//           </select>

          

//           {paymentMode === "UPI" && (
//             <>
//               <img src={qrUrl} className="mx-auto" />
//               <a href={upiLink} className="block text-center text-green-600 underline">
//                 Pay via UPI App
//               </a>
//               <input
//                 placeholder="UPI Txn Ref"
//                 value={upiTxnRef}
//                 onChange={(e) => setUpiTxnRef(e.target.value)}
//                 className="border p-2 w-full"
//               />
//               <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as any)} className="border p-2 w-full">
//                 <option value="Pending">Payment Pending</option>
//                 <option value="Paid">Payment Paid</option>
//               </select>
//             </>
//           )}

// <div className="flex gap-2">
//   <button
//     onClick={holdBill}
//     className="flex-1 border py-2 rounded text-yellow-700"
//   >
//     ⏸ Hold Bill
//   </button>

//   <button
//     onClick={() => saveBill()}
//     className="flex-1 bg-gray-200 py-2 rounded"
//   >
//     Save
//   </button>

//   <button
//     onClick={async () => {
//       const bill = await saveBill();
//       if (!bill) return;

//       // 1️⃣ Print
//       printReceipt();

//       // 2️⃣ Auto-send WhatsApp
//       sendInvoiceOnWhatsApp(bill);
//     }}
//     className="flex-1 bg-blue-600 text-white py-2 rounded"
//   >
//     Save & Print
//   </button>

// </div>



//           <div className="text-center text-xs text-gray-500">{SHOP.tagline}</div>
//         </div>
//       </div>

//       {/* PRINT */}
//       <div ref={receiptRef} className="hidden print:block w-[80mm] text-[12px]">
//         <div className="text-center font-bold">{SHOP.name}</div>
//         <div className="text-center">{SHOP.address}</div>
//         <div className="text-center">GSTIN: {SHOP.gstin}</div>

//         <hr />
//         <div>Bill No: {billNumber}</div>
//         <div>Date: {billDate}</div>
//         {(customerName || customerPhone) && (
//           <>
//         <div>Customer: {customerName || "Walk-in Customer"}</div>
//         {customerPhone && <div>Phone: {customerPhone}</div>}
//         </>
//         )}
//         <hr />
//         {items.map((i) => (
//           <div key={i.id} className="flex justify-between">
//             <span>{i.name} × {i.qty}</span>
//             <span>₹{i.rate} </span>
//             <span>₹{(i.qty * i.rate).toFixed(2)}</span>
//           </div>

          
//         ))}
//         <hr />
//         <div className="flex justify-between font-bold">TOTAL <span>₹{finalTotal.toFixed(2)}</span></div>
//         <div className="text-center">Payment: {paymentMode}</div>
//         {paymentMode === "UPI" && <div className="text-center">Txn Ref: {upiTxnRef || "Pending"}</div>}
//         <div className="text-center">{SHOP.tagline}</div>
//         <div className="text-center">Thank you 🙏</div>
//       </div>
//     </div>
    
//   );
// }





/*  ================= ================= ================= ================= ================= ================= ================= ================= ================= */     


//src/app/billing/checkout/page.tsx

import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading checkout...</div>}>
      <CheckoutClient />
    </Suspense>
  );
}
