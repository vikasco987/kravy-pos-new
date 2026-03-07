

// // src/app/billing/checkout/CheckoutClient.tsx

// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import Link from "next/link";
// import { useRouter, useSearchParams } from "next/navigation";
// import { Clock, Trash2, Play, X, Search } from "lucide-react";

// /* ================= TYPES ================= */

// type MenuItem = {
//   id: string;
//   name: string;
//   price: number;
//   unit?: string | null;
//   imageUrl?: string | null;
//   category?: {
//     id: string;
//     name: string;
//   } | null;
// };



// type BillItem = {
//   id: string;
//   name: string;
//   qty: number;
//   rate: number;
// };

// /* ================= PAGE ================= */

// export default function CheckoutClient() {
//   const receiptRef = useRef<HTMLDivElement | null>(null);
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const resumeBillId = searchParams.get("resumeBillId");
//   const [activeBillId, setActiveBillId] = useState<string | null>(null);

//   /* ================= HELD BILLS STATE ================= */
//   const [heldBills, setHeldBills] = useState<any[]>([]);
//   const [showHeldBills, setShowHeldBills] = useState(false);
//   const [heldBillsLoading, setHeldBillsLoading] = useState(false);

//   async function fetchHeldBills() {
//     try {
//       setHeldBillsLoading(true);
//       const res = await fetch("/api/bill-manager", { cache: "no-store" });
//       if (res.ok) {
//         const data = await res.json();
//         // Filter only held bills
//         const onlyHeld = (data.bills || []).filter((b: any) => b.isHeld);
//         setHeldBills(onlyHeld);
//       }
//     } catch (err) {
//       console.error("Fetch held bills error", err);
//     } finally {
//       setHeldBillsLoading(false);
//     }
//   }

//   useEffect(() => {
//     fetchHeldBills();
//   }, []);

//   const [billNumber, setBillNumber] = useState("");
//   const [billDate, setBillDate] = useState("");

//   useEffect(() => {
//     setBillNumber(`SV-${Date.now()}`);
//     setBillDate(new Date().toLocaleString());
//   }, []);

//   const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
//   const [menuLoading, setMenuLoading] = useState(true);

//   useEffect(() => {
//     async function fetchMenu() {
//       try {
//         // Add timestamp to prevent browser cache from showing old prices
//         const res = await fetch(`/api/menu/items?t=${Date.now()}`, {
//           cache: 'no-store'
//         });
//         if (!res.ok) return;

//         const data = await res.json();

//         // ✅ API returns array directly, but we map to ensure pos uses 'sellingPrice'
//         const mapped = (data || []).map((it: any) => {
//           // Robust price detection
//           const sPrice = Number(it.sellingPrice);
//           const bPrice = Number(it.price);

//           const finalPrice = (!isNaN(sPrice) && it.sellingPrice !== null)
//             ? sPrice
//             : (!isNaN(bPrice) ? bPrice : 0);

//           return {
//             ...it,
//             price: finalPrice
//           };
//         });

//         setMenuItems(mapped);
//       } catch (err) {
//         console.error("Menu fetch failed", err);
//       } finally {
//         setMenuLoading(false);
//       }
//     }

//     fetchMenu();
//   }, []);

//   useEffect(() => {
//     if (!resumeBillId) return;

//     async function loadHeldBill() {
//       try {
//         const res = await fetch(`/api/bill-manager/${resumeBillId}`, {
//           cache: "no-store",
//         });

//         if (!res.ok) return;

//         const data = await res.json();
//         const bill = data.bill ?? data;
//         // ✅ VERY IMPORTANT
//         setActiveBillId(bill.id);
//         // ✅ RESTORE CART
//         setItems(
//           bill.items.map((i: any) => ({
//             id: i.id,
//             name: i.name,
//             qty: i.qty,
//             rate: i.rate,
//           }))
//         );

//         // ✅ RESTORE CUSTOMER
//         setCustomerName(bill.customerName || "");
//         setCustomerPhone(bill.customerPhone || "");

//         // ✅ RESTORE PAYMENT
//         setPaymentMode(bill.paymentMode);
//         setPaymentStatus(bill.paymentStatus);
//         setUpiTxnRef(bill.upiTxnRef || "");

//       } catch (err) {
//         console.error("RESUME BILL ERROR:", err);
//       }
//     }

//     loadHeldBill();
//   }, [resumeBillId]);


//   /* ================= CATEGORY + SEARCH ================= */
//   const [activeCategory, setActiveCategory] = useState<string>("All");
//   const [search, setSearch] = useState("");

//   const categories = Array.from(
//     new Set(menuItems.map((i) => i.category?.name || "Others"))
//   );

//   const filteredMenuItems = menuItems
//     .filter((i) =>
//       activeCategory === "All"
//         ? true
//         : i.category?.name === activeCategory
//     )
//     .filter((i) =>
//       i.name.toLowerCase().includes(search.toLowerCase())
//     );


//   /* ================= CART ================= */

//   function addToCart(item: MenuItem) {
//     setItems((prev) => {
//       const existing = prev.find((i) => i.id === item.id);

//       if (existing) {
//         return prev.map((i) =>
//           i.id === item.id ? { ...i, qty: i.qty + 1 } : i
//         );
//       }

//       return [
//         ...prev,
//         {
//           id: item.id,
//           name: item.name,
//           qty: 1,
//           rate: item.price,
//         },
//       ];
//     });
//   }

//   function reduceFromCart(itemId: string) {
//     setItems((prev) =>
//       prev
//         .map((i) =>
//           i.id === itemId ? { ...i, qty: i.qty - 1 } : i
//         )
//         .filter((i) => i.qty > 0)
//     );
//   }

//   /* ================= CUSTOMER ================= */
//   const [showCustomer, setShowCustomer] = useState(false);
//   const [customerName, setCustomerName] = useState("");
//   const [customerPhone, setCustomerPhone] = useState("");


//   /* ================= CART STATE ================= */

//   const [items, setItems] = useState<BillItem[]>([]);
//   const inc = (id: string) =>
//     setItems((s) =>
//       s.map((i) =>
//         i.id === id ? { ...i, qty: i.qty + 1 } : i
//       )
//     );

//   const dec = (id: string) =>
//     setItems((s) =>
//       s
//         .map((i) =>
//           i.id === id ? { ...i, qty: i.qty - 1 } : i
//         )
//         .filter((i) => i.qty > 0)
//     );

//   const remove = (id: string) =>
//     setItems((s) => s.filter((i) => i.id !== id));

//   /* ================= BUSINESS PROFILE ================= */

//   const [business, setBusiness] = useState<{
//     businessName: string;
//     businessTagLine?: string;
//     gstNumber?: string;
//     businessAddress?: string;
//     district?: string;
//     state?: string;
//     pinCode?: string;
//     upi?: string;
//     logoUrl?: string;
//     taxEnabled?: boolean;
//     taxRate?: number;
//   } | null>(null);


//   useEffect(() => {
//     async function fetchBusinessProfile() {
//       try {
//         const res = await fetch("/api/profile", { cache: "no-store" });
//         if (!res.ok) return;

//         const data = await res.json();

//         if (data) {
//           setBusiness({
//             businessName: data.businessName,
//             businessTagLine: data.businessTagLine,
//             gstNumber: data.gstNumber,
//             businessAddress: data.businessAddress,
//             district: data.district,
//             state: data.state,
//             pinCode: data.pinCode,
//             upi: data.upi,
//             logoUrl: data.logoUrl,
//             taxEnabled: data.taxEnabled ?? true,
//             taxRate: data.taxRate ?? 5.0,
//           });
//         }
//       } catch (err) {
//         console.error("Business profile load failed", err);
//       }
//     }

//     fetchBusinessProfile();
//   }, []);


//   /* ================= TOTALS ================= */

//   const taxActive = business?.taxEnabled ?? true;
//   const currentTaxRate = business?.taxRate ?? 5.0;

//   const subtotal = Number(
//     items.reduce((a, i) => a + i.qty * i.rate, 0).toFixed(2)
//   );

//   const gstAmount = taxActive
//     ? Number(((subtotal * currentTaxRate) / 100).toFixed(2))
//     : 0;

//   const cgst = Number((gstAmount / 2).toFixed(2));
//   const sgst = Number((gstAmount / 2).toFixed(2));

//   const finalTotal = Number(
//     (subtotal + gstAmount).toFixed(2)
//   );
//   /* ================= PAYMENT STATE ================= */

//   const [paymentMode, setPaymentMode] =
//     useState<"Cash" | "UPI" | "Card">("Cash");
//   const [paymentStatus, setPaymentStatus] =
//     useState<"Pending" | "Paid">("Paid");
//   const [upiTxnRef, setUpiTxnRef] = useState("");

//   /* ================= UPI ================= */

//   const UPI_ID = business?.upi || "";
//   const UPI_NAME = business?.businessName || "Store";

//   const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(
//     UPI_NAME
//   )}&am=${finalTotal.toFixed(2)}&cu=INR`;

//   const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
//     upiLink
//   )}`;

//   /* ================= PAYMENT EFFECT ================= */

//   useEffect(() => {
//     if (paymentMode === "Cash" || paymentMode === "Card") {
//       setPaymentStatus("Paid");
//     }
//   }, [paymentMode]);

//   /* ================= SAVE BILL ================= */
//   async function saveBill(isHeld: boolean = false) {
//     if (items.length === 0) {
//       alert("No items to save");
//       return null;
//     }

//     const payload = {
//       items,
//       subtotal,
//       tax: gstAmount, // ✅ backend expects `tax`
//       total: finalTotal,

//       paymentMode,        // Cash | UPI | Card
//       paymentStatus: isHeld ? "HELD" : paymentStatus, // ✅ Handle held status explicitly
//       upiTxnRef: paymentMode === "UPI" ? upiTxnRef : null,

//       isHeld,             // ✅ THIS ENABLES HOLD
//       customerName: customerName || "Walk-in Customer",
//       customerPhone: customerPhone || null,
//     };

//     try {
//       // ✅ IF RESUMING, USE PUT TO UPDATE EXISTING
//       const url = resumeBillId
//         ? `/api/bill-manager/${resumeBillId}`
//         : "/api/bill-manager";

//       const method = resumeBillId ? "PUT" : "POST";

//       const res = await fetch(url, {
//         method,
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         const err = await res.json();
//         alert(err.error || "Failed to save bill");
//         return null;
//       }

//       const data = await res.json();
//       return data.bill ?? data;
//     } catch (err) {
//       console.error("Save bill error", err);
//       alert("Something went wrong");
//       return null;
//     }
//   }

//   /* ================= DELETE HELD BILL ================= */
//   async function deleteHeldBill(id: string) {
//     if (!confirm("Permanently delete this held bill?")) return;
//     try {
//       const res = await fetch(`/api/bill-manager/${id}`, { method: "DELETE" });
//       if (res.ok) {
//         alert("Bill deleted");
//         if (resumeBillId === id) {
//           router.replace("/dashboard/billing/checkout"); // reset if we are currently resuming this one
//           setItems([]);
//           setCustomerName("");
//           setCustomerPhone("");
//         }
//         return true;
//       } else {
//         alert("Failed to delete bill");
//         return false;
//       }
//     } catch (err) {
//       console.error("Delete bill error", err);
//       return false;
//     }
//   }

//   /* ================= PRINT RECEIPT ================= */

//   function printReceipt() {
//     if (!receiptRef.current) {
//       alert("Nothing to print");
//       return;
//     }

//     const printContents = receiptRef.current.innerHTML;
//     const originalContents = document.body.innerHTML;

//     document.body.innerHTML = printContents;
//     window.print();
//     document.body.innerHTML = originalContents;

//     // reload to restore React state properly
//     window.location.reload();
//   }


//   /* ================= UI ================= */

//   return (
//     <div className="h-[calc(100vh-72px)] bg-[var(--kravy-bg)] p-2 md:p-4 transition-colors w-full overflow-hidden">
//       <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_380px] gap-2 lg:gap-4 h-full min-h-0">


//         {/* ================= LEFT : MENU ITEMS ================= */}
//         <div className="bg-[var(--kravy-surface)] rounded-2xl p-3 md:p-5 border border-[var(--kravy-border)] shadow-sm relative flex flex-col min-h-0 min-w-0">
//           <div className="flex justify-between items-center mb-3 md:mb-5">
//             <h2 className="text-base md:text-lg font-bold text-[var(--kravy-text-primary)]">Menu Catalog</h2>
//           </div>

//           {/* CATEGORY TABS */}
//           <div className="flex gap-1.5 lg:gap-2 mb-3 lg:mb-4 overflow-x-auto pb-1 scrollbar-hide">
//             <button
//               onClick={() => setActiveCategory("All")}
//               className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${activeCategory === "All"
//                 ? "bg-[var(--kravy-brand)] border-[var(--kravy-brand)] text-white shadow-lg shadow-indigo-500/30"
//                 : "bg-[var(--kravy-bg-2)] border-[var(--kravy-border)] text-[var(--kravy-text-secondary)] hover:border-[var(--kravy-brand)]"
//                 }`}
//             >
//               All
//             </button>

//             {categories.map((cat) => (
//               <button
//                 key={cat}
//                 onClick={() => setActiveCategory(cat)}
//                 className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeCategory === cat
//                   ? "bg-[var(--kravy-brand)] border-[var(--kravy-brand)] text-white shadow-lg shadow-indigo-500/30"
//                   : "bg-[var(--kravy-bg-2)] border-[var(--kravy-border)] text-[var(--kravy-text-secondary)] hover:border-[var(--kravy-brand)]"
//                   }`}
//               >
//                 {cat}
//               </button>
//             ))}
//           </div>

//           {/* SEARCH */}
//           <div className="relative mb-4 lg:mb-6">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--kravy-text-muted)]" size={14} />
//             <input
//               type="text"
//               placeholder="Search items…"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)] text-[var(--kravy-text-primary)] h-9 lg:h-11 pl-9 lg:pl-10 pr-4 w-full rounded-lg lg:rounded-xl text-xs lg:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
//             />
//           </div>

//           {menuLoading && (
//             <p className="text-sm text-[var(--kravy-text-muted)] animate-pulse">Loading menu items…</p>
//           )}

//           {!menuLoading && filteredMenuItems.length === 0 && (
//             <p className="text-sm text-[var(--kravy-text-muted)] italic">No matches found for your search.</p>
//           )}

//           {/* MENU GRID */}
//           <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 overflow-y-auto pr-1 pb-10 no-scrollbar">
//             {filteredMenuItems.map((m) => {
//               const inCart = items.find((i) => i.id === m.id);



//               return (
//                 <div
//                   key={m.id}
//                   onClick={() => addToCart(m)}
//                   className="group relative border border-[var(--kravy-border)] rounded-2xl overflow-hidden cursor-pointer
//                  hover:shadow-xl hover:border-[var(--kravy-brand)] transition-all duration-300 bg-[var(--kravy-bg-2)] flex flex-col min-h-[140px] lg:min-h-[170px]"
//                 >
//                   {/* IMAGE - Force stability */}
//                   <div className="relative aspect-video w-full bg-[var(--kravy-surface)] overflow-hidden shrink-0 border-b border-[var(--kravy-border)]/50">
//                     <img
//                       src={m.imageUrl || "/no-image.png"}
//                       alt={m.name}
//                       className="h-full w-full object-cover"
//                       loading="lazy"
//                       onError={(e) => {
//                         e.currentTarget.src = "/no-image.png";
//                       }}
//                     />
//                   </div>



//                   {/* CONTENT */}
//                   <div className="p-2 lg:p-3 flex flex-col flex-1 justify-between">
//                     <div>
//                       <p className="text-[10px] lg:text-xs font-bold text-[var(--kravy-text-primary)] group-hover:text-amber-500 transition-colors line-clamp-2">
//                         {m.name}
//                       </p>
//                     </div>

//                     <div className="flex justify-between items-end mt-2">
//                       <p className="text-xs lg:text-sm text-emerald-500 font-extrabold leading-none">
//                         ₹{m.price.toFixed(2)}
//                       </p>
//                       <p className="text-[9px] uppercase font-black text-[var(--kravy-text-muted)] tracking-widest truncate ml-2 leading-none">
//                         {m.unit ? `${m.unit}` : ""}
//                       </p>
//                     </div>
//                   </div>

//                   {/* GREEN QTY BADGE (TOP LEFT) */}
//                   {inCart && (
//                     <div className="absolute top-2 left-2 bg-green-600 text-white
//                         text-xs px-2 py-0.5 rounded-full">
//                       {inCart.qty}
//                     </div>
//                   )}

//                   {/* RED REDUCE BADGE (TOP RIGHT) */}
//                   {inCart && (
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation(); // prevent add
//                         reduceFromCart(m.id);
//                       }}
//                       className="absolute top-2 right-2 bg-red-600 text-white
//                      text-xs w-6 h-6 rounded-full flex items-center
//                      justify-center hover:bg-red-700"
//                     >
//                       −
//                     </button>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//         {/* ================= RIGHT : CART ================= */}
//         <div className="bg-[var(--kravy-surface)] rounded-2xl flex flex-col border border-[var(--kravy-border)] shadow-xl overflow-hidden min-h-0">

//           {/* HEADER */}
//           <div className="border-b border-[var(--kravy-border)] p-4 lg:p-6 bg-[var(--kravy-bg-2)]/50 shrink-0">
//             <div className="flex justify-between items-center">
//               <div>
//                 <p className="text-lg font-black text-[var(--kravy-text-primary)] leading-tight">Billing Invoice</p>
//                 <div className="flex items-center gap-2 mt-1">
//                   <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded uppercase tracking-wider">{billNumber}</span>
//                   <span className="text-[10px] font-bold text-[var(--kravy-text-muted)] truncate">{billDate}</span>
//                 </div>
//               </div>

//               {/* HELD BILLS BADGE */}
//               <button
//                 onClick={() => {
//                   setShowHeldBills(true);
//                   fetchHeldBills();
//                 }}
//                 className="relative group p-2.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-all"
//                 title="View Held Bills"
//               >
//                 <Clock size={20} />
//                 {heldBills.length > 0 && (
//                   <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-[var(--kravy-surface)] shadow-sm">
//                     {heldBills.length}
//                   </span>
//                 )}
//                 {/* Tooltip on hover */}
//                 <span className="absolute bottom-full right-0 mb-2 whitespace-nowrap bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-bold">
//                   {heldBills.length} Held Orders
//                 </span>
//               </button>
//             </div>
//           </div>

//           {/* CUSTOMER */}
//           <button
//             onClick={() => setShowCustomer(!showCustomer)}
//             className="p-5 text-left border-b border-[var(--kravy-border)] font-black text-[10px] uppercase tracking-widest text-[var(--kravy-text-muted)] flex justify-between items-center hover:bg-[var(--kravy-bg-2)] transition-colors"
//           >
//             Customer Details
//             <span className={`text-xs transition-transform duration-300 ${showCustomer ? 'rotate-180' : ''}`}>▼</span>
//           </button>

//           {showCustomer && (
//             <div className="p-4 lg:p-6 space-y-3 lg:space-y-4 border-b border-[var(--kravy-border)] bg-[var(--kravy-bg-2)]/30 shrink-0">
//               <div className="space-y-1">
//                 <label className="text-[10px] font-bold text-[var(--kravy-text-muted)] uppercase tracking-wider ml-1">Name</label>
//                 <input
//                   placeholder="Full Name"
//                   value={customerName}
//                   onChange={(e) => setCustomerName(e.target.value)}
//                   className="bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] p-2 lg:p-2.5 w-full rounded-lg lg:rounded-xl text-xs lg:text-sm outline-none focus:ring-1 focus:ring-indigo-500"
//                 />
//               </div>
//               <div className="space-y-1">
//                 <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest ml-1">Phone</label>
//                 <input
//                   placeholder="Phone Number"
//                   value={customerPhone}
//                   onChange={(e) => setCustomerPhone(e.target.value)}
//                   className="bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] p-2 lg:p-2.5 w-full rounded-lg lg:rounded-xl text-xs lg:text-sm outline-none focus:ring-1 focus:ring-[var(--kravy-brand)] font-mono"
//                 />
//               </div>
//             </div>
//           )}

//           {/* CART ITEMS */}
//           <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
//             {items.length === 0 && (
//               <p className="text-sm text-gray-500">
//                 No items added
//               </p>
//             )}

//             {items.map((i) => (
//               <div key={i.id} className="flex justify-between items-center py-2 px-1 border-b border-[var(--kravy-border)]/50 last:border-0">
//                 <div className="flex-1 min-w-0 pr-4">
//                   <p className="font-bold text-[var(--kravy-text-primary)] truncate text-sm">{i.name}</p>
//                   <p className="text-xs font-bold text-indigo-500/80">
//                     {i.qty} × ₹{i.rate.toFixed(2)}
//                   </p>
//                 </div>
//                 <div className="flex gap-4 items-center shrink-0">
//                   <span className="font-bold text-[var(--kravy-text-primary)]">₹{(i.qty * i.rate).toFixed(2)}</span>
//                   <button onClick={() => remove(i.id)} className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors">
//                     <span className="text-xs font-black">✕</span>
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* CHECKOUT */}
//           <div className="border-t border-[var(--kravy-border)] p-3 lg:p-4 bg-[var(--kravy-bg-2)]/30 space-y-1.5 lg:space-y-2 shrink-0">

//             {/* TOTALS */}
//             <div className="flex justify-between text-sm text-[var(--kravy-text-muted)] font-medium">
//               <span>Subtotal</span>
//               <span className="text-[var(--kravy-text-primary)] font-bold">₹{subtotal.toFixed(2)}</span>
//             </div>

//             {taxActive && (
//               <div className="flex justify-between text-sm text-[var(--kravy-text-muted)] font-medium">
//                 <span>GST ({currentTaxRate}%)</span>
//                 <span className="text-[var(--kravy-text-primary)] font-bold">₹{gstAmount.toFixed(2)}</span>
//               </div>
//             )}

//             <div className="flex justify-between items-center py-2 border-y border-[var(--kravy-border)]/50">
//               <span className="font-black text-[var(--kravy-text-primary)] uppercase tracking-widest text-xs">Total Order</span>
//               <span className="text-2xl font-black text-[var(--kravy-brand)]">₹{finalTotal.toFixed(2)}</span>
//             </div>

//             {/* ================= PAYMENT ================= */}
//             <div className="pt-2 space-y-2">
//               <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest ml-1">
//                 Payment Method
//               </label>

//               <select
//                 value={paymentMode}
//                 onChange={(e) =>
//                   setPaymentMode(e.target.value as "Cash" | "UPI" | "Card")
//                 }
//                 className="bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] p-2 lg:p-3 w-full rounded-lg lg:rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs lg:text-sm font-bold"
//               >
//                 <option value="Cash">💵 Cash</option>
//                 <option value="UPI">📱 Digital UPI</option>
//                 <option value="Card">💳 Credit/Debit Card</option>
//               </select>

//               {/* -------- UPI DETAILS -------- */}
//               {paymentMode === "UPI" && (
//                 <div className="space-y-4 p-4 rounded-2xl bg-indigo-500/5 mt-4 border border-indigo-500/10">
//                   <div className="bg-white p-2 rounded-xl mx-auto w-fit shadow-xl">
//                     <img
//                       src={qrUrl}
//                       alt="UPI QR"
//                       className="w-32 h-32"
//                     />
//                   </div>

//                   <a
//                     href={upiLink}
//                     className="block text-center text-indigo-500 font-bold underline text-xs"
//                   >
//                     Click to open UPI App
//                   </a>

//                   <input
//                     placeholder="Txn Reference Number"
//                     value={upiTxnRef}
//                     onChange={(e) => setUpiTxnRef(e.target.value)}
//                     className="bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] p-3 w-full rounded-xl text-sm outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
//                   />

//                   <select
//                     value={paymentStatus}
//                     onChange={(e) =>
//                       setPaymentStatus(e.target.value as "Pending" | "Paid")
//                     }
//                     className="bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] p-2 lg:p-3 w-full rounded-lg lg:rounded-xl text-xs lg:text-sm outline-none font-black uppercase tracking-widest"
//                   >
//                     <option value="Pending">🕒 Payment Pending</option>
//                     <option value="Paid">✅ Payment Received</option>
//                   </select>
//                 </div>
//               )}
//             </div>

//             {/* ================= ACTION BUTTONS ================= */}
//             <div className="flex gap-2 pt-2">
//               {/* HOLD */}
//               <button
//                 onClick={async () => {
//                   const bill = await saveBill(true); // ✅ HOLD MODE
//                   if (!bill) return;

//                   alert("Bill saved on hold");
//                   setItems([]);          // clear cart
//                   setCustomerName("");
//                   setCustomerPhone("");
//                   fetchHeldBills(); // refresh list
//                   if (resumeBillId) router.replace("/dashboard/billing/checkout"); // clear resume ID
//                 }}
//                 disabled={items.length === 0}
//                 className="flex-1 border-2 border-amber-500/50 text-amber-500 font-bold py-3 rounded-xl
//                         disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-500/10 transition-colors text-sm"
//               >
//                 ⏸ Hold
//               </button>

//               {/* SAVE */}
//               <button
//                 type="button"
//                 onClick={async () => {
//                   const bill = await saveBill();
//                   if (!bill) return;

//                   // ✅ CLEAR CURRENT BILL STATE (READY FOR NEW BILL)
//                   setItems([]);
//                   setCustomerName("");
//                   setCustomerPhone("");
//                   setUpiTxnRef("");
//                   setPaymentMode("Cash");
//                   setPaymentStatus("Paid");

//                   // ✅ NEW BILL META
//                   setBillNumber(`SV-${Date.now()}`);
//                   setBillDate(new Date().toLocaleString());

//                   if (resumeBillId) router.replace("/dashboard/billing/checkout");
//                 }}
//                 disabled={items.length === 0}
//                 className="flex-1 bg-[var(--kravy-surface-hover)] border border-[var(--kravy-border)] text-[var(--kravy-text-primary)] font-bold py-3 rounded-xl
//                         disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--kravy-bg-2)] transition-colors text-sm"
//               >
//                 💾 Save
//               </button>

//               {/* SAVE & PRINT */}
//               <button
//                 onClick={async () => {
//                   if (!business) {
//                     alert("Business profile not loaded yet");
//                     return;
//                   }

//                   const bill = await saveBill();
//                   if (!bill) return;
//                   printReceipt();
//                 }}
//                 disabled={
//                   items.length === 0 ||
//                   !business ||
//                   (paymentMode === "UPI" && paymentStatus !== "Paid")
//                 }
//                 className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black py-2 lg:py-3 rounded-lg lg:rounded-xl
//                         disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-xs lg:text-sm"
//               >
//                 🖨️ Print
//               </button>
//             </div>

//             {/* FOOTER */}
//             <p className="text-xs text-center text-gray-500">
//               {business?.businessTagLine}
//             </p>

//             {/* ================= PRINT (58mm) ================= */}

//             <div
//               ref={receiptRef}
//               data-paper="58" // change to "80" for 80mm printer
//               className="hidden print:block receipt font-mono text-[10px] leading-tight"
//             >

//               {/* LOGO */}
//               {business?.logoUrl && (
//                 <div className="flex justify-center mb-1">
//                   <img
//                     src={business?.logoUrl}
//                     alt="Logo"
//                     className="max-h-[28mm] object-contain"
//                   />
//                 </div>
//               )}

//               {/* BUSINESS NAME */}
//               <div className="text-center font-bold text-[12px]">
//                 {business?.businessName}
//               </div>

//               {/* ADDRESS */}
//               {(business?.businessAddress ||
//                 business?.district ||
//                 business?.state ||
//                 business?.pinCode) && (
//                   <div className="text-center text-[9px]">
//                     {business?.businessAddress}
//                     {business?.district && `, ${business.district}`}
//                     {business?.state && `, ${business.state}`}
//                     {business?.pinCode && ` - ${business.pinCode}`}
//                   </div>
//                 )}

//               {/* GSTIN */}
//               {business?.gstNumber && (
//                 <div className="text-center text-[9px]">
//                   GSTIN: {business.gstNumber}
//                 </div>
//               )}

//               {/* BILL META (CENTERED BELOW GSTIN) */}
//               <div className="text-center text-[9px] mt-1">
//                 <div>Bill No: {billNumber}</div>
//                 <div>Date: {billDate}</div>
//               </div>

//               <div className="my-1 border-t border-dashed" />

//               {/* CUSTOMER */}
//               {(customerName || customerPhone) && (
//                 <div className="text-[9px]">
//                   <div>Customer: {customerName || "Walk-in Customer"}</div>
//                   {customerPhone && <div>Phone: {customerPhone}</div>}
//                 </div>
//               )}

//               <div className="my-1 border-t border-dashed" />

//               {/* ITEM HEADER */}
//               <div className="flex justify-between font-semibold text-[9px]">
//                 <span className="w-[26mm]">Desc</span>
//                 <span className="w-[8mm] text-right">Qty</span>
//                 <span className="w-[10mm] text-right">Rate</span>
//                 <span className="w-[10mm] text-right">Amt</span>
//               </div>

//               <div className="border-t border-dashed my-1" />

//               {/* ITEMS */}
//               {items.map((i) => (
//                 <div key={i.id} className="flex justify-between text-[9px]">
//                   <span className="w-[26mm] truncate">{i.name}</span>
//                   <span className="w-[8mm] text-right">{i.qty}</span>
//                   <span className="w-[10mm] text-right">{i.rate.toFixed(2)}</span>
//                   <span className="w-[10mm] text-right">
//                     {(i.qty * i.rate).toFixed(2)}
//                   </span>
//                 </div>
//               ))}

//               <div className="my-1 border-t border-dashed" />

//               {/* TOTALS */}
//               <div className="flex justify-between">
//                 <span>Subtotal</span>
//                 <span>₹{subtotal.toFixed(2)}</span>
//               </div>

//               {taxActive && (
//                 <div className="flex justify-between">
//                   <span>GST ({currentTaxRate}%)</span>
//                   <span>₹{gstAmount.toFixed(2)}</span>
//                 </div>
//               )}

//               <div className="border-t border-dashed my-1" />

//               <div className="flex justify-between font-bold text-[11px]">
//                 <span>GRAND TOTAL</span>
//                 <span>₹{finalTotal.toFixed(2)}</span>
//               </div>

//               <div className="border-t border-dashed my-1" />

//               {/* PAYMENT */}
//               <div className="text-center text-[9px]">
//                 Payment: {paymentMode}
//               </div>

//               {/* ✅ UPI QR INSIDE RECEIPT */}
//               {paymentMode === "UPI" && (
//                 <>
//                   <div className="flex justify-center my-2">
//                     <img
//                       src={qrUrl}
//                       alt="UPI QR"
//                       className="w-[30mm]"
//                     />
//                   </div>

//                   <div className="text-center text-[9px]">
//                     Txn Ref: {upiTxnRef || "Pending"}
//                   </div>
//                 </>
//               )}


//               {/* TAGLINE */}
//               {business?.businessTagLine && (
//                 <div className="text-center text-[9px] mt-1">
//                   {business.businessTagLine}
//                 </div>
//               )}

//               <div className="text-center font-semibold mt-1">
//                 Thank you 🙏
//               </div>
//             </div>

//           </div>
//         </div>
//       </div>

//       {/* ================= HELD BILLS DRAWER ================= */}
//       {showHeldBills && (
//         <div className="fixed inset-0 z-50 flex justify-end">
//           <div
//             className="absolute inset-0 bg-black/40 backdrop-blur-sm"
//             onClick={() => setShowHeldBills(false)}
//           />
//           <div className="relative w-full max-w-md bg-[var(--kravy-surface)] h-full shadow-2xl flex flex-col border-l border-[var(--kravy-border)] animate-in slide-in-from-right duration-300">
//             <div className="p-6 border-b border-[var(--kravy-border)] flex justify-between items-center bg-[var(--kravy-bg-2)]/50">
//               <div>
//                 <h3 className="text-xl font-black text-[var(--kravy-text-primary)]">Held Bills</h3>
//                 <p className="text-xs text-[var(--kravy-text-muted)] font-bold uppercase tracking-widest mt-1">
//                   {heldBills.length} Orders Paused
//                 </p>
//               </div>
//               <button
//                 onClick={() => setShowHeldBills(false)}
//                 className="p-2 hover:bg-red-500/10 text-[var(--kravy-text-muted)] hover:text-red-500 rounded-xl transition-all"
//               >
//                 <X size={24} />
//               </button>
//             </div>

//             <div className="flex-1 overflow-y-auto p-4 space-y-3">
//               {heldBillsLoading ? (
//                 <div className="flex flex-col items-center justify-center h-64 gap-3">
//                   <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
//                   <p className="text-sm font-bold text-[var(--kravy-text-muted)]">Loading your bills...</p>
//                 </div>
//               ) : heldBills.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center h-64 text-center p-8 opacity-50">
//                   <Clock size={48} className="mb-4 text-indigo-500" />
//                   <p className="font-bold text-[var(--kravy-text-primary)]">No held bills found</p>
//                   <p className="text-xs mt-1">Orders you put on hold will appear here</p>
//                 </div>
//               ) : (
//                 heldBills.map((bill) => (
//                   <div
//                     key={bill.id}
//                     className={`group p-4 rounded-2xl border transition-all hover:shadow-lg ${resumeBillId === bill.id
//                       ? "bg-indigo-500/5 border-indigo-500 shadow-indigo-500/10"
//                       : "bg-[var(--kravy-bg-2)] border-[var(--kravy-border)] hover:border-indigo-500/50"
//                       }`}
//                   >
//                     <div className="flex justify-between items-start mb-3">
//                       <div>
//                         <div className="flex items-center gap-2">
//                           <span className="text-xs font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">#{bill.billNumber}</span>
//                           {resumeBillId === bill.id && (
//                             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Now</span>
//                           )}
//                         </div>
//                         <h4 className="font-black text-[var(--kravy-text-primary)] mt-2">
//                           {bill.customerName || "Walk-in Customer"}
//                         </h4>
//                         <p className="text-[10px] font-bold text-[var(--kravy-text-muted)] mt-0.5">
//                           {new Date(bill.createdAt).toLocaleString()}
//                         </p>
//                       </div>
//                       <div className="text-right">
//                         <p className="text-lg font-black text-[var(--kravy-brand)]">₹{bill.total.toFixed(2)}</p>
//                         <p className="text-[10px] font-bold text-[var(--kravy-text-muted)] uppercase tracking-tighter">
//                           {bill.items.length} Items
//                         </p>
//                       </div>
//                     </div>

//                     <div className="flex gap-2">
//                       <button
//                         onClick={() => {
//                           setShowHeldBills(false);
//                           router.push(`/dashboard/billing/checkout?resumeBillId=${bill.id}`);
//                         }}
//                         disabled={resumeBillId === bill.id}
//                         className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
//                       >
//                         <Play size={14} fill="currentColor" />
//                         Resume
//                       </button>
//                       <button
//                         onClick={async () => {
//                           const ok = await deleteHeldBill(bill.id);
//                           if (ok) fetchHeldBills();
//                         }}
//                         className="w-12 flex items-center justify-center py-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
//                       >
//                         <Trash2 size={16} />
//                       </button>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>

//             <div className="p-6 border-t border-[var(--kravy-border)] bg-[var(--kravy-bg-2)]/30">
//               <button
//                 onClick={() => setShowHeldBills(false)}
//                 className="w-full py-3 bg-[var(--kravy-surface)] border border-[var(--kravy-border)] rounded-xl font-bold text-sm text-[var(--kravy-text-secondary)] hover:bg-[var(--kravy-bg-2)] transition-all"
//               >
//                 Close Drawer
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

























"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Trash2, Play, X, Search, ChevronDown, User, Printer, Save, PauseCircle } from "lucide-react";

/* ================= TYPES ================= */

type MenuItem = {
  id: string;
  name: string;
  price: number;
  unit?: string | null;
  imageUrl?: string | null;
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
        const onlyHeld = (data.bills || []).filter((b: any) => b.isHeld);
        setHeldBills(onlyHeld);
      }
    } catch (err) {
      console.error("Fetch held bills error", err);
    } finally {
      setHeldBillsLoading(false);
    }
  }

  useEffect(() => { fetchHeldBills(); }, []);

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
        const res = await fetch(`/api/menu/items?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const mapped = (data || []).map((it: any) => {
          const sPrice = Number(it.sellingPrice);
          const bPrice = Number(it.price);
          const finalPrice = (!isNaN(sPrice) && it.sellingPrice !== null) ? sPrice : (!isNaN(bPrice) ? bPrice : 0);
          return { ...it, price: finalPrice };
        });
        setMenuItems(mapped);
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
        const res = await fetch(`/api/bill-manager/${resumeBillId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const bill = data.bill ?? data;
        setActiveBillId(bill.id);
        setItems(bill.items.map((i: any) => ({ id: i.id, name: i.name, qty: i.qty, rate: i.rate })));
        setCustomerName(bill.customerName || "");
        setCustomerPhone(bill.customerPhone || "");
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

  const categories = Array.from(new Set(menuItems.map((i) => i.category?.name || "Others")));

  const filteredMenuItems = menuItems
    .filter((i) => activeCategory === "All" ? true : i.category?.name === activeCategory)
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  /* ================= CART ================= */
  function addToCart(item: MenuItem) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: item.id, name: item.name, qty: 1, rate: item.price }];
    });
  }

  function reduceFromCart(itemId: string) {
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, qty: i.qty - 1 } : i).filter((i) => i.qty > 0));
  }

  /* ================= CUSTOMER ================= */
  const [showCustomer, setShowCustomer] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  /* ================= CART STATE ================= */
  const [items, setItems] = useState<BillItem[]>([]);
  const inc = (id: string) => setItems((s) => s.map((i) => i.id === id ? { ...i, qty: i.qty + 1 } : i));
  const dec = (id: string) => setItems((s) => s.map((i) => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter((i) => i.qty > 0));
  const remove = (id: string) => setItems((s) => s.filter((i) => i.id !== id));

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
  const subtotal = Number(items.reduce((a, i) => a + i.qty * i.rate, 0).toFixed(2));
  const gstAmount = taxActive ? Number(((subtotal * currentTaxRate) / 100).toFixed(2)) : 0;
  const cgst = Number((gstAmount / 2).toFixed(2));
  const sgst = Number((gstAmount / 2).toFixed(2));
  const finalTotal = Number((subtotal + gstAmount).toFixed(2));

  /* ================= PAYMENT STATE ================= */
  const [paymentMode, setPaymentMode] = useState<"Cash" | "UPI" | "Card">("Cash");
  const [paymentStatus, setPaymentStatus] = useState<"Pending" | "Paid">("Paid");
  const [upiTxnRef, setUpiTxnRef] = useState("");

  /* ================= UPI ================= */
  const UPI_ID = business?.upi || "";
  const UPI_NAME = business?.businessName || "Store";
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${finalTotal.toFixed(2)}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;

  useEffect(() => {
    if (paymentMode === "Cash" || paymentMode === "Card") setPaymentStatus("Paid");
  }, [paymentMode]);

  /* ================= DELETE CONFIRM MODAL ================= */
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [resumeConfirmId, setResumeConfirmId] = useState<string | null>(null);

  /* ================= SAVE BILL ================= */
  async function saveBill(isHeld: boolean = false) {
    if (items.length === 0) { alert("No items to save"); return null; }
    const payload = {
      items, subtotal, tax: gstAmount, total: finalTotal,
      paymentMode, paymentStatus: isHeld ? "HELD" : paymentStatus,
      upiTxnRef: paymentMode === "UPI" ? upiTxnRef : null,
      isHeld, customerName: customerName || "Walk-in Customer",
      customerPhone: customerPhone || null,
    };
    try {
      const url = resumeBillId ? `/api/bill-manager/${resumeBillId}` : "/api/bill-manager";
      const method = resumeBillId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); alert(err.error || "Failed to save bill"); return null; }
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
    try {
      const res = await fetch(`/api/bill-manager/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (resumeBillId === id) {
          router.replace("/dashboard/billing/checkout");
          setItems([]); setCustomerName(""); setCustomerPhone("");
        }
        return true;
      } else { alert("Failed to delete bill"); return false; }
    } catch (err) {
      console.error("Delete bill error", err);
      return false;
    }
  }

  /* ================= PRINT RECEIPT ================= */
  function printReceipt() {
    if (!receiptRef.current) { alert("Nothing to print"); return; }
    const printContents = receiptRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  }

  /* ================= UI ================= */
  const totalItems = items.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="h-[calc(100vh-72px)] bg-[var(--kravy-bg)] flex flex-col overflow-hidden">

      {/* ════════════════════════════════════════════
          MAIN LAYOUT
      ════════════════════════════════════════════ */}
      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] gap-0 flex-1 min-h-0">

        {/* ══════════════════════════════
            LEFT — MENU CATALOG
        ══════════════════════════════ */}
        <div className="flex flex-col min-h-0 overflow-hidden border-r border-[var(--kravy-border)]">

          {/* Left Header */}
          <div className="bg-[var(--kravy-surface)] border-b border-[var(--kravy-border)] px-4 md:px-6 py-4 flex-shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base md:text-lg font-black text-[var(--kravy-text-primary)] tracking-tight">
                  Menu Catalog
                </h2>
                <p className="text-xs text-[var(--kravy-text-muted)] mt-0.5 font-medium">
                  {filteredMenuItems.length} items available
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--kravy-text-muted)]"
                size={15}
              />
              <input
                type="text"
                placeholder="Search menu items…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[var(--kravy-bg)] border border-[var(--kravy-border)] text-[var(--kravy-text-primary)]
                  h-10 pl-9 pr-4 rounded-xl text-sm outline-none
                  focus:ring-2 focus:ring-[var(--kravy-brand)]/20 focus:border-[var(--kravy-brand)]
                  transition-all placeholder:text-[var(--kravy-text-muted)] font-medium"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
              <button
                onClick={() => setActiveCategory("All")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all whitespace-nowrap flex-shrink-0 ${activeCategory === "All"
                    ? "bg-[var(--kravy-brand)] border-[var(--kravy-brand)] text-white shadow-md shadow-indigo-500/25"
                    : "bg-[var(--kravy-bg)] border-[var(--kravy-border)] text-[var(--kravy-text-secondary)] hover:border-[var(--kravy-brand)] hover:text-[var(--kravy-brand)]"
                  }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider border transition-all whitespace-nowrap flex-shrink-0 ${activeCategory === cat
                      ? "bg-[var(--kravy-brand)] border-[var(--kravy-brand)] text-white shadow-md shadow-indigo-500/25"
                      : "bg-[var(--kravy-bg)] border-[var(--kravy-border)] text-[var(--kravy-text-secondary)] hover:border-[var(--kravy-brand)] hover:text-[var(--kravy-brand)]"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Grid */}
          {menuLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-[var(--kravy-brand)]/20 border-t-[var(--kravy-brand)] rounded-full animate-spin" />
                <p className="text-sm font-bold text-[var(--kravy-text-muted)] animate-pulse">Loading menu…</p>
              </div>
            </div>
          )}

          {!menuLoading && filteredMenuItems.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div className="opacity-40">
                <Search size={40} className="mx-auto mb-3 text-[var(--kravy-text-muted)]" />
                <p className="font-bold text-[var(--kravy-text-primary)]">No items found</p>
                <p className="text-xs mt-1 text-[var(--kravy-text-muted)]">Try a different search or category</p>
              </div>
            </div>
          )}

          {!menuLoading && filteredMenuItems.length > 0 && (
            /* ✅ FIX: min-h-0 + overflow-y-auto on a proper scroll container
               grid items always render at their natural size — no squeezing */
            <div className="min-h-0 flex-1 overflow-y-auto px-4 md:px-5 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                {filteredMenuItems.map((m) => {
                  const inCart = items.find((i) => i.id === m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => addToCart(m)}
                      className={`group relative border rounded-2xl overflow-hidden cursor-pointer
                        transition-all duration-200 bg-[var(--kravy-surface)] flex flex-col
                        hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97]
                        ${inCart
                          ? "border-[var(--kravy-brand)] shadow-md shadow-indigo-500/10"
                          : "border-[var(--kravy-border)] hover:border-[var(--kravy-brand)]"
                        }`}
                    >
                      {/* Image — fixed height, never compresses */}
                      <div
                        className="relative w-full bg-[var(--kravy-bg)] overflow-hidden flex-shrink-0 border-b border-[var(--kravy-border)]/50"
                        style={{ height: "90px" }}
                      >
                        <img
                          src={m.imageUrl || "/no-image.png"}
                          alt={m.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.src = "/no-image.png"; }}
                        />
                        {/* Qty Badge */}
                        {inCart && (
                          <div className="absolute top-2 left-2 bg-emerald-500 text-white
                            text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-emerald-500/40
                            border border-white/20 z-10">
                            ×{inCart.qty}
                          </div>
                        )}
                        {/* Reduce Button */}
                        {inCart && (
                          <button
                            onClick={(e) => { e.stopPropagation(); reduceFromCart(m.id); }}
                            className="absolute top-2 right-2 bg-rose-500 text-white
                              w-6 h-6 rounded-full flex items-center justify-center
                              text-sm font-black hover:bg-rose-600 shadow-lg shadow-rose-500/40
                              border border-white/20 transition-all hover:scale-110 z-10"
                          >
                            −
                          </button>
                        )}
                      </div>

                      {/* Content — name + price always visible */}
                      <div className="p-2.5 md:p-3 flex flex-col gap-1.5 flex-shrink-0">
                        <p className={`text-[11px] md:text-xs font-bold leading-snug line-clamp-2 transition-colors
                          ${inCart ? "text-[var(--kravy-brand)]" : "text-[var(--kravy-text-primary)] group-hover:text-[var(--kravy-brand)]"}`}>
                          {m.name}
                        </p>
                        {/* ✅ Price always shown — NOT inside flex-1 / mt-auto */}
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs md:text-sm font-black text-emerald-500 whitespace-nowrap">
                            ₹{m.price.toFixed(2)}
                          </p>
                          {m.unit && (
                            <p className="text-[9px] uppercase font-black text-[var(--kravy-text-muted)] tracking-wider truncate">
                              {m.unit}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════
            RIGHT — CART / BILLING
        ══════════════════════════════ */}
        <div className="bg-[var(--kravy-surface)] flex flex-col border-l border-[var(--kravy-border)] overflow-hidden min-h-0
          fixed bottom-0 left-0 right-0 lg:static
          rounded-t-3xl lg:rounded-none
          shadow-2xl lg:shadow-none
          border-t-2 lg:border-t-0
          transition-transform duration-300
          z-30 lg:z-auto
          max-h-[82vh] lg:max-h-none"
          style={{ transform: 'translateY(0)' }}
        >

          {/* Mobile Drag Handle */}
          <div className="lg:hidden flex flex-col items-center pt-3 pb-1 cursor-grab active:cursor-grabbing flex-shrink-0">
            <div className="w-10 h-1 bg-[var(--kravy-border)] rounded-full mb-2" />
            <div className="w-full flex items-center justify-between px-5 pb-2">
              <div>
                <p className="text-sm font-black text-[var(--kravy-text-primary)]">Billing Invoice</p>
                <p className="text-[10px] font-bold text-[var(--kravy-text-muted)] mt-0.5">
                  {totalItems} items · ₹{finalTotal.toFixed(2)}
                </p>
              </div>
              <span className="text-xl font-black text-[var(--kravy-brand)]">₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Cart Header */}
          <div className="border-b border-[var(--kravy-border)] px-4 md:px-5 py-3.5 bg-[var(--kravy-bg)]/40 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-[var(--kravy-text-primary)] hidden lg:block">Billing Invoice</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black px-2.5 py-1 bg-[var(--kravy-brand)]/10 text-[var(--kravy-brand)] rounded-lg uppercase tracking-wider">
                    {billNumber}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--kravy-text-muted)] hidden sm:block">{billDate}</span>
                </div>
              </div>

              {/* Held Bills Button */}
              <button
                onClick={() => { setShowHeldBills(true); fetchHeldBills(); }}
                className="relative group flex items-center gap-2 px-3 py-2 bg-amber-500/10 text-amber-500
                  border border-amber-500/25 rounded-xl hover:bg-amber-500/20 transition-all"
                title="View Held Bills"
              >
                <Clock size={16} />
                <span className="text-xs font-black hidden sm:block">Held</span>
                {heldBills.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] font-black
                    w-4 h-4 flex items-center justify-center rounded-full border-2 border-[var(--kravy-surface)] shadow">
                    {heldBills.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Customer Section */}
          <button
            onClick={() => setShowCustomer(!showCustomer)}
            className="px-4 md:px-5 py-3 text-left border-b border-[var(--kravy-border)]
              flex items-center justify-between hover:bg-[var(--kravy-bg)] transition-colors flex-shrink-0"
          >
            <div className="flex items-center gap-2">
              <User size={13} className="text-[var(--kravy-text-muted)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--kravy-text-muted)]">
                Customer Details
              </span>
              {(customerName || customerPhone) && (
                <span className="text-[10px] font-bold text-[var(--kravy-brand)] bg-[var(--kravy-brand)]/10 px-2 py-0.5 rounded-md">
                  {customerName || customerPhone}
                </span>
              )}
            </div>
            <ChevronDown
              size={14}
              className={`text-[var(--kravy-text-muted)] transition-transform duration-200 ${showCustomer ? "rotate-180" : ""}`}
            />
          </button>

          {showCustomer && (
            <div className="px-4 md:px-5 py-3 space-y-3 border-b border-[var(--kravy-border)] bg-[var(--kravy-bg)]/30 flex-shrink-0">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-wider ml-0.5">Name</label>
                <input
                  placeholder="Customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]
                    p-2.5 w-full rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--kravy-brand)]/20
                    focus:border-[var(--kravy-brand)] transition-all placeholder:text-[var(--kravy-text-muted)] font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-wider ml-0.5">Phone</label>
                <input
                  placeholder="Phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]
                    p-2.5 w-full rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--kravy-brand)]/20
                    focus:border-[var(--kravy-brand)] transition-all placeholder:text-[var(--kravy-text-muted)] font-mono"
                />
              </div>
            </div>
          )}

          {/* Cart Items */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-5 py-3 space-y-2 no-scrollbar">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 opacity-40">
                <div className="text-4xl mb-3">🛒</div>
                <p className="font-bold text-[var(--kravy-text-primary)] text-sm">Cart is empty</p>
                <p className="text-xs text-[var(--kravy-text-muted)] mt-1">Tap any menu item to add</p>
              </div>
            ) : (
              items.map((i) => (
                <div
                  key={i.id}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl
                    bg-[var(--kravy-bg)] border border-[var(--kravy-border)]
                    hover:border-[var(--kravy-border)]/80 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[var(--kravy-text-primary)] truncate text-sm">{i.name}</p>
                    <p className="text-xs font-bold text-[var(--kravy-brand)]/70 mt-0.5">
                      {i.qty} × ₹{i.rate.toFixed(2)}
                    </p>
                  </div>

                  {/* Qty Controls */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => dec(i.id)}
                      className="w-7 h-7 rounded-lg border border-[var(--kravy-border)] bg-[var(--kravy-surface)]
                        text-[var(--kravy-text-secondary)] font-black text-base flex items-center justify-center
                        hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500 transition-all"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-black text-sm text-[var(--kravy-text-primary)]">{i.qty}</span>
                    <button
                      onClick={() => inc(i.id)}
                      className="w-7 h-7 rounded-lg border border-[var(--kravy-border)] bg-[var(--kravy-surface)]
                        text-[var(--kravy-text-secondary)] font-black text-base flex items-center justify-center
                        hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-500 transition-all"
                    >
                      +
                    </button>
                  </div>

                  <span className="font-black text-[var(--kravy-text-primary)] text-sm min-w-[52px] text-right flex-shrink-0">
                    ₹{(i.qty * i.rate).toFixed(2)}
                  </span>

                  <button
                    onClick={() => remove(i.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center
                      text-[var(--kravy-text-muted)] hover:bg-rose-50 hover:text-rose-500 transition-all flex-shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Checkout Footer */}
          <div className="border-t border-[var(--kravy-border)] px-4 md:px-5 py-4 bg-[var(--kravy-bg)]/30 space-y-3 flex-shrink-0">

            {/* Totals */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[var(--kravy-text-muted)] font-semibold">
                <span>Subtotal</span>
                <span className="text-[var(--kravy-text-primary)] font-bold">₹{subtotal.toFixed(2)}</span>
              </div>
              {taxActive && (
                <div className="flex justify-between text-xs text-[var(--kravy-text-muted)] font-semibold">
                  <span>GST ({currentTaxRate}%)</span>
                  <span className="text-[var(--kravy-text-primary)] font-bold">₹{gstAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-dashed border-[var(--kravy-border)]">
                <span className="font-black text-[var(--kravy-text-primary)] text-xs uppercase tracking-widest">Total</span>
                <span className="text-2xl font-black text-[var(--kravy-brand)]">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest">
                Payment Method
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(["Cash", "UPI", "Card"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2.5 rounded-xl border font-black text-xs transition-all ${paymentMode === mode
                        ? "bg-[var(--kravy-brand)] border-[var(--kravy-brand)] text-white shadow-md shadow-indigo-500/25"
                        : "bg-[var(--kravy-bg)] border-[var(--kravy-border)] text-[var(--kravy-text-secondary)] hover:border-[var(--kravy-brand)] hover:text-[var(--kravy-brand)]"
                      }`}
                  >
                    {mode === "Cash" ? "💵" : mode === "UPI" ? "📱" : "💳"} {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* UPI Details */}
            {paymentMode === "UPI" && (
              <div className="space-y-3 p-3.5 rounded-2xl bg-[var(--kravy-brand)]/5 border border-[var(--kravy-brand)]/15">
                <div className="bg-white p-2 rounded-xl mx-auto w-fit shadow-lg">
                  <img src={qrUrl} alt="UPI QR" className="w-28 h-28" />
                </div>
                <a href={upiLink} className="block text-center text-[var(--kravy-brand)] font-bold text-xs hover:underline">
                  Click to open UPI App →
                </a>
                <input
                  placeholder="Transaction Reference No."
                  value={upiTxnRef}
                  onChange={(e) => setUpiTxnRef(e.target.value)}
                  className="bg-[var(--kravy-input-bg)] border border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]
                    p-2.5 w-full rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--kravy-brand)]/20
                    focus:border-[var(--kravy-brand)] transition-all font-mono"
                />
                <div className="grid grid-cols-2 gap-2">
                  {(["Pending", "Paid"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setPaymentStatus(s)}
                      className={`py-2 rounded-xl border font-black text-xs transition-all ${paymentStatus === s
                          ? s === "Paid"
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "bg-amber-500 border-amber-500 text-white"
                          : "bg-[var(--kravy-bg)] border-[var(--kravy-border)] text-[var(--kravy-text-secondary)]"
                        }`}
                    >
                      {s === "Pending" ? "🕒 Pending" : "✅ Received"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {/* Hold */}
              <button
                onClick={async () => {
                  const bill = await saveBill(true);
                  if (!bill) return;
                  setItems([]); setCustomerName(""); setCustomerPhone("");
                  fetchHeldBills();
                  if (resumeBillId) router.replace("/dashboard/billing/checkout");
                }}
                disabled={items.length === 0}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl border-2
                  border-amber-500/40 text-amber-500 font-black text-xs
                  hover:bg-amber-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <PauseCircle size={14} /> Hold
              </button>

              {/* Save */}
              <button
                type="button"
                onClick={async () => {
                  const bill = await saveBill();
                  if (!bill) return;
                  setItems([]); setCustomerName(""); setCustomerPhone("");
                  setUpiTxnRef(""); setPaymentMode("Cash"); setPaymentStatus("Paid");
                  setBillNumber(`SV-${Date.now()}`);
                  setBillDate(new Date().toLocaleString());
                  if (resumeBillId) router.replace("/dashboard/billing/checkout");
                }}
                disabled={items.length === 0}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl border
                  border-[var(--kravy-border)] bg-[var(--kravy-bg)] text-[var(--kravy-text-secondary)]
                  font-black text-xs hover:bg-[var(--kravy-surface-hover)]
                  disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Save size={14} /> Save
              </button>

              {/* Print */}
              <button
                onClick={async () => {
                  if (!business) { alert("Business profile not loaded yet"); return; }
                  const bill = await saveBill();
                  if (!bill) return;
                  printReceipt();
                }}
                disabled={items.length === 0 || !business || (paymentMode === "UPI" && paymentStatus !== "Paid")}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl
                  bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs
                  shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30
                  hover:-translate-y-0.5 active:scale-95
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 transition-all"
              >
                <Printer size={14} /> Print
              </button>
            </div>

            {business?.businessTagLine && (
              <p className="text-[10px] text-center text-[var(--kravy-text-muted)] italic font-medium">
                {business.businessTagLine}
              </p>
            )}
          </div>
        </div>

        {/* ================= PRINT RECEIPT (58mm) ================= */}
        <div
          ref={receiptRef}
          data-paper="58"
          className="hidden print:block receipt font-mono text-[10px] leading-tight"
        >
          {business?.logoUrl && (
            <div className="flex justify-center mb-1">
              <img src={business?.logoUrl} alt="Logo" className="max-h-[28mm] object-contain" />
            </div>
          )}
          <div className="text-center font-bold text-[12px]">{business?.businessName}</div>
          {(business?.businessAddress || business?.district || business?.state || business?.pinCode) && (
            <div className="text-center text-[9px]">
              {business?.businessAddress}
              {business?.district && `, ${business.district}`}
              {business?.state && `, ${business.state}`}
              {business?.pinCode && ` - ${business.pinCode}`}
            </div>
          )}
          {business?.gstNumber && <div className="text-center text-[9px]">GSTIN: {business.gstNumber}</div>}
          <div className="text-center text-[9px] mt-1">
            <div>Bill No: {billNumber}</div>
            <div>Date: {billDate}</div>
          </div>
          <div className="my-1 border-t border-dashed" />
          {(customerName || customerPhone) && (
            <div className="text-[9px]">
              <div>Customer: {customerName || "Walk-in Customer"}</div>
              {customerPhone && <div>Phone: {customerPhone}</div>}
            </div>
          )}
          <div className="my-1 border-t border-dashed" />
          <div className="flex justify-between font-semibold text-[9px]">
            <span className="w-[26mm]">Desc</span>
            <span className="w-[8mm] text-right">Qty</span>
            <span className="w-[10mm] text-right">Rate</span>
            <span className="w-[10mm] text-right">Amt</span>
          </div>
          <div className="border-t border-dashed my-1" />
          {items.map((i) => (
            <div key={i.id} className="flex justify-between text-[9px]">
              <span className="w-[26mm] truncate">{i.name}</span>
              <span className="w-[8mm] text-right">{i.qty}</span>
              <span className="w-[10mm] text-right">{i.rate.toFixed(2)}</span>
              <span className="w-[10mm] text-right">{(i.qty * i.rate).toFixed(2)}</span>
            </div>
          ))}
          <div className="my-1 border-t border-dashed" />
          <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          {taxActive && <div className="flex justify-between"><span>GST ({currentTaxRate}%)</span><span>₹{gstAmount.toFixed(2)}</span></div>}
          <div className="border-t border-dashed my-1" />
          <div className="flex justify-between font-bold text-[11px]"><span>GRAND TOTAL</span><span>₹{finalTotal.toFixed(2)}</span></div>
          <div className="border-t border-dashed my-1" />
          <div className="text-center text-[9px]">Payment: {paymentMode}</div>
          {paymentMode === "UPI" && (
            <>
              <div className="flex justify-center my-2"><img src={qrUrl} alt="UPI QR" className="w-[30mm]" /></div>
              <div className="text-center text-[9px]">Txn Ref: {upiTxnRef || "Pending"}</div>
            </>
          )}
          {business?.businessTagLine && <div className="text-center text-[9px] mt-1">{business.businessTagLine}</div>}
          <div className="text-center font-semibold mt-1">Thank you 🙏</div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          HELD BILLS DRAWER
      ════════════════════════════════════════════ */}
      {showHeldBills && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowHeldBills(false)}
          />

          {/* Drawer */}
          <div className="relative w-full max-w-md bg-[var(--kravy-surface)] h-full shadow-2xl flex flex-col
            border-l border-[var(--kravy-border)] animate-in slide-in-from-right duration-300">

            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-[var(--kravy-border)] flex items-center justify-between
              bg-[var(--kravy-bg)]/50 flex-shrink-0">
              <div>
                <h3 className="text-lg font-black text-[var(--kravy-text-primary)]">Held Bills</h3>
                <p className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest mt-1">
                  {heldBills.length} Orders Paused
                </p>
              </div>
              <button
                onClick={() => setShowHeldBills(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl
                  hover:bg-rose-500/10 text-[var(--kravy-text-muted)] hover:text-rose-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {heldBillsLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <div className="w-8 h-8 border-4 border-[var(--kravy-brand)]/20 border-t-[var(--kravy-brand)] rounded-full animate-spin" />
                  <p className="text-sm font-bold text-[var(--kravy-text-muted)]">Loading bills…</p>
                </div>
              ) : heldBills.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center opacity-40 p-8">
                  <Clock size={44} className="mb-4 text-[var(--kravy-text-muted)]" />
                  <p className="font-black text-[var(--kravy-text-primary)]">No held bills</p>
                  <p className="text-xs mt-1 text-[var(--kravy-text-muted)]">Orders on hold will appear here</p>
                </div>
              ) : (
                heldBills.map((bill) => (
                  <div
                    key={bill.id}
                    className={`rounded-2xl border overflow-hidden transition-all ${resumeBillId === bill.id
                        ? "bg-[var(--kravy-brand)]/5 border-[var(--kravy-brand)] shadow-md shadow-indigo-500/10"
                        : "bg-[var(--kravy-bg)] border-[var(--kravy-border)] hover:border-[var(--kravy-brand)]/50"
                      }`}
                  >
                    {/* Card Top */}
                    <div className="p-4 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-[10px] font-black text-[var(--kravy-brand)] bg-[var(--kravy-brand)]/10 px-2 py-0.5 rounded-md">
                            #{bill.billNumber}
                          </span>
                          {resumeBillId === bill.id && (
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="font-black text-[var(--kravy-text-primary)] text-sm truncate">
                          {bill.customerName || "Walk-in Customer"}
                        </p>
                        <p className="text-[10px] font-bold text-[var(--kravy-text-muted)] mt-1">
                          {new Date(bill.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-black text-[var(--kravy-brand)]">₹{bill.total.toFixed(2)}</p>
                        <p className="text-[10px] font-bold text-[var(--kravy-text-muted)]">
                          {bill.items.length} items
                        </p>
                      </div>
                    </div>

                    {/* Item chips */}
                    <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                      {bill.items.slice(0, 3).map((item: any, idx: number) => (
                        <span key={idx} className="text-[10px] font-semibold bg-[var(--kravy-surface)] border border-[var(--kravy-border)] px-2.5 py-1 rounded-lg text-[var(--kravy-text-secondary)]">
                          {item.name} ×{item.qty}
                        </span>
                      ))}
                      {bill.items.length > 3 && (
                        <span className="text-[10px] font-semibold bg-[var(--kravy-surface)] border border-[var(--kravy-border)] px-2.5 py-1 rounded-lg text-[var(--kravy-text-muted)]">
                          +{bill.items.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex border-t border-[var(--kravy-border)]">
                      <button
                        onClick={() => {
                          setShowHeldBills(false);
                          router.push(`/dashboard/billing/checkout?resumeBillId=${bill.id}`);
                        }}
                        disabled={resumeBillId === bill.id}
                        className="flex-1 flex items-center justify-center gap-2 py-3
                          bg-[var(--kravy-brand)]/8 text-[var(--kravy-brand)] font-black text-xs
                          hover:bg-[var(--kravy-brand)] hover:text-white
                          disabled:opacity-40 disabled:cursor-not-allowed transition-all
                          border-r border-[var(--kravy-border)]"
                      >
                        <Play size={13} fill="currentColor" /> Resume
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(bill.id)}
                        className="w-14 flex items-center justify-center
                          bg-rose-500/8 text-rose-500 hover:bg-rose-500 hover:text-white
                          transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-[var(--kravy-border)] flex-shrink-0">
              <button
                onClick={() => setShowHeldBills(false)}
                className="w-full py-3 bg-[var(--kravy-bg)] border border-[var(--kravy-border)]
                  rounded-2xl font-black text-sm text-[var(--kravy-text-secondary)]
                  hover:bg-[var(--kravy-surface-hover)] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          DELETE CONFIRM MODAL (Beautiful Bottom Sheet)
      ════════════════════════════════════════════ */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative w-full sm:max-w-sm bg-[var(--kravy-surface)] rounded-t-3xl sm:rounded-3xl
            shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

            {/* Handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-[var(--kravy-border)] rounded-full" />
            </div>

            <div className="p-6 text-center">
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-rose-50 border-2 border-rose-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-rose-500" />
              </div>

              <h3 className="text-xl font-black text-[var(--kravy-text-primary)] mb-2">Delete Order?</h3>
              <p className="text-sm text-[var(--kravy-text-muted)] font-medium leading-relaxed mb-6">
                Yeh order permanently delete ho jaayega.<br />Yeh action undo nahi ho sakta.
              </p>

              {/* Bill preview */}
              {(() => {
                const bill = heldBills.find(b => b.id === deleteConfirmId);
                return bill ? (
                  <div className="bg-[var(--kravy-bg)] border border-[var(--kravy-border)] rounded-xl p-3 mb-6 flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-sm font-black text-[var(--kravy-text-primary)]">
                        {bill.customerName || "Walk-in Customer"}
                      </p>
                      <p className="text-[10px] text-[var(--kravy-text-muted)] font-bold mt-0.5">
                        #{bill.billNumber} · {bill.items.length} items
                      </p>
                    </div>
                    <span className="text-lg font-black text-[var(--kravy-brand)]">₹{bill.total.toFixed(2)}</span>
                  </div>
                ) : null;
              })()}

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={async () => {
                    const ok = await deleteHeldBill(deleteConfirmId!);
                    if (ok) { fetchHeldBills(); setDeleteConfirmId(null); }
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 text-white
                    font-black text-sm shadow-lg shadow-rose-500/30
                    hover:shadow-rose-500/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all
                    flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Haan, Delete Karo
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="w-full py-3.5 rounded-2xl bg-[var(--kravy-bg)] border border-[var(--kravy-border)]
                    text-[var(--kravy-text-secondary)] font-black text-sm
                    hover:bg-[var(--kravy-surface-hover)] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          RESUME CONFIRM MODAL
      ════════════════════════════════════════════ */}
      {resumeConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setResumeConfirmId(null)}
          />
          <div className="relative w-full sm:max-w-sm bg-[var(--kravy-surface)] rounded-t-3xl sm:rounded-3xl
            shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-[var(--kravy-border)] rounded-full" />
            </div>

            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Play size={28} className="text-emerald-500" fill="currentColor" />
              </div>
              <h3 className="text-xl font-black text-[var(--kravy-text-primary)] mb-2">Resume Order?</h3>
              <p className="text-sm text-[var(--kravy-text-muted)] font-medium leading-relaxed mb-6">
                Current cart ke items replace ho jaayenge.<br />Kya aap continue karna chahte hain?
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setShowHeldBills(false);
                    router.push(`/dashboard/billing/checkout?resumeBillId=${resumeConfirmId}`);
                    setResumeConfirmId(null);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white
                    font-black text-sm shadow-lg shadow-emerald-500/30
                    hover:-translate-y-0.5 active:scale-[0.98] transition-all
                    flex items-center justify-center gap-2"
                >
                  <Play size={16} fill="currentColor" /> Haan, Resume Karo
                </button>
                <button
                  onClick={() => setResumeConfirmId(null)}
                  className="w-full py-3.5 rounded-2xl bg-[var(--kravy-bg)] border border-[var(--kravy-border)]
                    text-[var(--kravy-text-secondary)] font-black text-sm hover:bg-[var(--kravy-surface-hover)] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}