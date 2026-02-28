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
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);


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
    if (!receiptRef.current) return;
    const html = document.body.innerHTML;
    document.body.innerHTML = receiptRef.current.outerHTML;
    window.print();
    document.body.innerHTML = html;
  }

  if (loading) return <p className="p-6">Loading bill...</p>;
  if (!bill) return <p className="p-6">Bill not found</p>;
  const billItems: BillItem[] = Array.isArray(bill.items)
  ? (bill.items as BillItem[])
  : [];
  <tbody>
  {billItems.map((i, idx) => (
    <tr key={idx}>
      ...
    </tr>
  ))}
</tbody>


  return (
    <div className="p-26 space-y-6">

      {bill.isHeld && (
  <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded">
    ⏸ This bill is currently on hold.  
    Unhold the bill to proceed with printing or payment.
  </div>
)}
  {bill.isHeld && (
  <div className="bg-yellow-50 text-yellow-700 p-3 rounded">
    ⏸ This bill is on hold. Resume it to continue.
  </div>
)}

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">
            Bill #{bill.billNumber}
          </h1>
          <p className="text-sm text-gray-500">
            {new Date(bill.createdAt).toLocaleString()}
          </p>
        </div>

        {/* CUSTOMER DETAILS */}
<div className="border rounded-lg p-3 bg-white">
  <p className="text-sm font-medium mb-1">Customer Details</p>

  <p className="text-sm">
    <span className="font-medium">Name:</span>{" "}
    {bill.customerName || "Walk-in Customer"}
  </p>

  {bill.customerPhone && (
    <p className="text-sm">
      <span className="font-medium">Phone:</span>{" "}
      {bill.customerPhone}
    </p>
  )}
</div>

        <div className="flex gap-2">
         <button
  onClick={printReceipt}
  disabled={bill.isHeld}
  className="border px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
>
  Print
</button>
      <button disabled={bill.isHeld}className="border px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
>
  Share
</button>

<button disabled={bill.isHeld}className="border px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
>
  Download PDF
</button>

          <Link
            href="/billing"
            className="border px-3 py-1 rounded"
          >
            Back
          </Link>
        </div>
      </div>

      {/* BILL DETAILS */}
      <div className="bg-white border rounded-xl p-6 space-y-4">
        {/* CUSTOMER */}
        <div>
          <p className="text-sm text-gray-500">Customer</p>
          <p className="font-medium">
            {bill.customerName ?? "Walk-in Customer"}
          </p>
        </div>

        {/* ITEMS */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Item</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Rate</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {billItems.map((i, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3">{i.name}</td>
                    <td className="p-3 text-right">{i.qty}</td>
                    <td className="p-3 text-right">
                      ₹{i.rate.toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      ₹{(i.qty * i.rate).toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* TOTALS */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <Row label="Subtotal" value={bill.subtotal} />
            <Row label="Tax" value={bill.tax ?? undefined} />
            <Row label="Total" value={bill.total} bold />
          </div>
        </div>

        {/* PAYMENT */}
        <div className="border-t pt-4 text-sm space-y-1">
          <p>
            <b>Payment Mode:</b> {bill.paymentMode}
          </p>
          <p>
            <b>Status:</b> {bill.paymentStatus}
          </p>
          {bill.upiTxnRef && (
            <p>
              <b>Txn Ref:</b> {bill.upiTxnRef}
            </p>
          )}
        </div>
      </div>

      {/* PRINT RECEIPT */}
      <div
        ref={receiptRef}
        className="hidden print:block w-[80mm] text-[12px]"
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

       <div className="text-center font-bold text-[13px]">
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
          <div className="flex justify-between font-semibold text-[9px] border-b border-dashed pb-1">
            <span className="w-[28mm]">Item</span>
            <span className="w-[8mm] text-right">Qty</span>
            <span className="w-[10mm] text-right">Rate</span>
            <span className="w-[12mm] text-right">Amt</span>
          </div>

       {/* ITEMS */}
        {billItems.map((i, idx) => (
            <div
              key={idx}
              className="flex justify-between text-[9px] mt-1"
            >
              <span className="w-[28mm] truncate">
                {i.name}
              </span>
              <span className="w-[8mm] text-right">
                {i.qty}
              </span>
              <span className="w-[10mm] text-right">
                {i.rate.toFixed(2)}
              </span>
              <span className="w-[12mm] text-right">
                {(i.qty * i.rate).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="border-t border-dashed my-1" />

          {/* SUBTOTAL */}
          <div className="flex justify-between text-[9px]">
            <span>Subtotal</span>
            <span>₹{bill.subtotal.toFixed(2)}</span>
          </div>

          {/* GST */}
          <div className="flex justify-between text-[9px]">
            <span>GST</span>
            <span>₹{(bill.tax ?? 0).toFixed(2)}</span>
          </div>

          <div className="border-t border-dashed my-1" />

          {/* GRAND TOTAL */}
          <div className="flex justify-between font-bold text-[11px]">
            <span>GRAND TOTAL</span>
            <span>₹{bill.total.toFixed(2)}</span>
          </div>

          <div className="border-t border-dashed my-1" />

         {/* PAYMENT MODE */}
<div className="text-center text-[9px]">
  Payment: {bill.paymentMode}
</div>

{/* UPI QR INSIDE RECEIPT */}
{bill.paymentMode === "UPI" && business?.upi && (
  <>
    <div className="flex justify-center my-2">
          <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
          `upi://pay?pa=${business.upi}&pn=${encodeURIComponent(
            business.businessName ?? ""
          )}&am=${bill.total}&cu=INR`
        )}`}
        alt="UPI QR"
        className="w-[28mm]"
      />

    </div>

    <div className="text-center text-[9px]">
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

          <div className="text-center font-semibold text-[10px] mt-1">
            Thank you 🙏
          </div>

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
      className={`flex justify-between ${
        bold ? "font-semibold text-base" : ""
      }`}
    >
      <span>{label}</span>
      <span>₹{(value ?? 0).toFixed(2)}</span>
    </div>
  );
}