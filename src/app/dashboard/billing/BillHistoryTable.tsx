"use client";

import React, { useState } from "react";
import { 
  ChevronDown, ChevronRight, Filter, Clock, CheckCircle2, 
  Smartphone, CreditCard, Wallet, Banknote, MoreVertical, 
  Eye, Printer, FileText, MessageCircle, Trash2, XCircle, CheckCircle, X
} from "lucide-react";
import { formatWhatsAppNumber } from "@/lib/whatsapp";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

// --- Sub-components ---

const TypeBadge = ({ type }: { type: string }) => {
  const t = type?.toUpperCase() || "POS";
  let color = "#64748B";
  let bg = "rgba(100, 116, 139, 0.1)";
  let label = "Counter";

  if (t.includes("DELIVERY")) { color = "#3B82F6"; bg = "rgba(59, 130, 246, 0.1)"; label = "Delivery"; }
  else if (t.includes("TAKEAWAY")) { color = "#F59E0B"; bg = "rgba(245, 158, 11, 0.1)"; label = "Takeaway"; }
  else if (t === "COUNTER" || t !== "POS") { color = "#10B981"; bg = "rgba(16, 185, 129, 0.1)"; label = "Dine-in"; }

  return (
    <span style={{ 
      padding: "5px 12px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 800, 
      background: bg, color: color, display: "inline-block", border: `1px solid ${color}20`
    }}>{label}</span>
  );
};

const StatusIndicator = ({ status, isHeld }: { status: string, isHeld?: boolean }) => {
  const s = status?.toLowerCase();
  if (isHeld || s === "pending") return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#f59e0b", fontSize: "0.65rem", fontWeight: 800 }}>
      <Clock size={12} /> PENDING
    </div>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#10b981", fontSize: "0.65rem", fontWeight: 800 }}>
      <CheckCircle2 size={12} /> SETTLED
    </div>
  );
};

const PaymentBadge = ({ mode, status }: { mode: string, status: string }) => {
  const m = mode?.toLowerCase();
  let icon = <Banknote size={10} />;
  let color = "#6B7280";
  let bg = "#F3F4F6";

  if (m === "upi") { icon = <Smartphone size={10} />; color = "#4F46E5"; bg = "#EEF2FF"; }
  if (m === "card") { icon = <CreditCard size={10} />; color = "#2563EB"; bg = "#EFF6FF"; }
  if (m === "wallet") { icon = <Wallet size={10} />; color = "#7C3AED"; bg = "#F5F3FF"; }
  if (m === "cash") { icon = <Banknote size={10} />; color = "#059669"; bg = "#ECFDF5"; }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding: "4px 8px", borderRadius: "6px", background: bg, color: color,
        fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", width: "fit-content"
      }}>
        {icon} {mode || "Cash"}
      </div>
      <div style={{ 
        fontSize: "0.6rem", fontWeight: 900, 
        color: status === "Paid" ? "#10B981" : "#EF4444", 
        border: `1px solid ${status === "Paid" ? "#D1FAE5" : "#FEE2E2"}`, 
        padding: "2px 6px", borderRadius: "4px", width: "fit-content" 
      }}>
        ✓ {status?.toUpperCase()}
      </div>
    </div>
  );
};

const MenuOption = ({ icon, label, onClick, isDestructive }: any) => (
  <button 
    type="button"
    onClick={(e) => { e.stopPropagation(); onClick(e); }} 
    style={{ width: "100%", textAlign: "left", padding: "10px 12px", border: "none", background: "transparent", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", fontWeight: 700, color: isDestructive ? "#EF4444" : "#374151" }}
  >
    {icon} {label}
  </button>
);

const BillActions = ({ bill, refresh, business, userRole, userPermissions, openMenuId, setOpenMenuId, setPreviewBill }: any) => {
  const isOpen = openMenuId === bill.id;
  const router = useRouter();
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<any>({});
  const [mounted, setMounted] = useState(false);
  
  React.useEffect(() => { setMounted(true); }, []);
  
  const canDelete = userRole === "ADMIN" || userRole === "MASTER" || userRole === "SELLER" || userPermissions.includes("delete-bill");

  const handleDelete = async () => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/bill-manager/${bill.id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Deleted"); refresh(true); }
    } catch (e) { toast.error("Error"); }
  };

  const handleStatusUpdate = async (status: string) => {
    const label = status === "Paid" ? "PAID" : status === "CANCELLED" ? "CANCELLED" : "UNPAID";
    if (!confirm(`Mark this order as ${label}?`)) return;
    try {
      const res = await fetch(`/api/bill-manager/${bill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: status }),
      });
      if (res.ok) { toast.success(`Updated to ${label}`); refresh(true); }
      else { toast.error("Failed to update"); }
    } catch (e) { toast.error("Error"); }
  };

  const handleWhatsApp = () => {
    const phone = formatWhatsAppNumber(bill.customerPhone);
    const origin = window.location.origin;
    const pdfUrl = `${origin}/api/bill-manager/${bill.id}/pdf${bill.clerkUserId ? `?clerkId=${bill.clerkUserId}` : ""}`;
    const restaurantName = business?.businessName || "Kravy POS";
    const message = encodeURIComponent(
      "🙏 *Thank you for shopping with us!*\n\n" +
      `Hello *${bill.customerName || "Customer"}*,\n\n` +
      `Here is your invoice from *${restaurantName}*:\n\n` +
      "🧾 *Bill No:* " + bill.billNumber + "\n" +
      "💰 *Amount Paid:* Rs. " + bill.total + "\n\n" +
      "📄 *Download Invoice:*\n" + pdfUrl + "\n\n" +
      "We look forward to serving you again! 😊"
    );
    window.open(phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`, "_blank");
  };

  const toggleMenu = (e: any) => {
    e.stopPropagation();
    if (isOpen) {
      setOpenMenuId(null);
    } else {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const menuHeight = 280; // approximate height
        const menuWidth = 200;
        
        setMenuPos({
          left: rect.right - menuWidth,
          ...(spaceBelow < menuHeight 
            ? { bottom: window.innerHeight - rect.top + 8 } 
            : { top: rect.bottom + 8 })
        });
      }
      setOpenMenuId(bill.id);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
      <div style={{ position: "relative", display: "inline-block" }}>
        <button 
          ref={buttonRef}
          onClick={toggleMenu} 
          style={{ width: "30px", height: "30px", borderRadius: "8px", border: "1px solid #E5E7EB", background: isOpen ? "#F3F4F6" : "white", color: "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "0.2s" }}
        >
          <MoreVertical size={14} />
        </button>
        {isOpen && mounted && typeof document !== "undefined" && createPortal(
          <div style={{ position: "absolute", zIndex: 99999 }}>
            <div style={{ position: "fixed", inset: 0, zIndex: 99998 }} onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} />
            <div style={{
              position: "fixed", left: menuPos.left, top: menuPos.top, bottom: menuPos.bottom, width: "200px",
              background: "white", borderRadius: "18px", border: "1px solid #F3F4F6",
              boxShadow: "0 10px 40px rgba(0,0,0,0.15)", padding: "8px", zIndex: 99999, display: "flex", flexDirection: "column", gap: "2px"
            }}>
              <MenuOption icon={<Eye size={14} color="#8B5CF6" />} label="Preview" onClick={() => { setOpenMenuId(null); setPreviewBill(bill); }} />
              <MenuOption icon={<Printer size={14} color="#6B7280" />} label="Reprint Bill" onClick={() => { setOpenMenuId(null); router.push(`/dashboard/billing/${bill.id}`); }} />
              <MenuOption icon={<FileText size={14} color="#3B82F6" />} label="Edit Bill" onClick={() => { setOpenMenuId(null); router.push(`/dashboard/billing/checkout?resumeBillId=${bill.id}`); }} />
              <MenuOption icon={<MessageCircle size={14} color="#10B981" />} label="WhatsApp" onClick={() => { setOpenMenuId(null); handleWhatsApp(); }} />
              
              <div style={{ height: "1px", background: "#F3F4F6", margin: "4px 0" }} />
              
              {bill.paymentStatus !== "Paid" && (
                <MenuOption icon={<CheckCircle size={14} color="#10B981" />} label="Mark as Paid" onClick={() => { setOpenMenuId(null); handleStatusUpdate("Paid"); }} />
              )}
              {bill.paymentStatus !== "Pending" && bill.paymentStatus !== "Unpaid" && (
                <MenuOption icon={<Clock size={14} color="#F59E0B" />} label="Mark as Unpaid" onClick={() => { setOpenMenuId(null); handleStatusUpdate("Pending"); }} />
              )}
              {bill.paymentStatus !== "CANCELLED" ? (
                <MenuOption icon={<XCircle size={14} color="#EF4444" />} label="Mark as Cancelled" onClick={() => { setOpenMenuId(null); handleStatusUpdate("CANCELLED"); }} />
              ) : (
                <MenuOption icon={<CheckCircle size={14} color="#10B981" />} label="Restore Order" onClick={() => { setOpenMenuId(null); handleStatusUpdate("Paid"); }} />
              )}
              {canDelete && (
                <>
                  <div style={{ height: "1px", background: "#F3F4F6", margin: "4px 0" }} />
                  <MenuOption icon={<Trash2 size={14} color="#EF4444" />} label="Delete Bill" onClick={() => { setOpenMenuId(null); handleDelete(); }} isDestructive />
                </>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

// --- Main Table Component ---

export default function BillHistoryTable({ bills, business, userRole, userPermissions, refresh, currentPage, itemsPerPage, visibleCols }: any) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [previewBill, setPreviewBill] = useState<any>(null);

  // Auto-close menu on table scroll
  React.useEffect(() => {
    const handleScroll = (e: Event) => {
      if (openMenuId && e.target instanceof Element && e.target.classList.contains('kravy-card')) {
        setOpenMenuId(null);
      }
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [openMenuId]);

  const toggleRow = (id: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  const format = (num: number) => new Intl.NumberFormat("en-IN").format(Math.round(num));

  return (
    <div className="kravy-card hidden md:block" style={{ overflowX: "auto", padding: 0, marginBottom: "100px" }}>
      <table className="kravy-table" style={{ minWidth: "1400px", borderCollapse: "separate", borderSpacing: 0 }}>
        <thead>
          <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
            <th style={{ width: "40px" }}></th>
            {visibleCols.sno && <Th label="#S.No" width="50px" />}
            {visibleCols.timeline && <Th label="Date & Time" width="160px" />}
            {visibleCols.billInfo && <Th label="Bill Info" width="140px" />}
            {visibleCols.source && <Th label="Type" width="110px" />}
            {visibleCols.source && <Th label="Source" width="110px" />}
            {visibleCols.items && <Th label="Items" width="100px" />}
            {visibleCols.customer && <Th label="Customer" width="150px" />}
            {visibleCols.customerPhone && <Th label="Phone" width="110px" />}
            {visibleCols.subtotal && <Th label="Subtotal" isRight />}
            {visibleCols.discount && <Th label="Disc." isRight color="#EF4444" />}
            {visibleCols.gst && <Th label="GST" isRight color="#F59E0B" />}
            {visibleCols.total && <Th label="Net Total" isRight />}
            {visibleCols.payment && <Th label="Payment" />}
            {visibleCols.token && <Th label="Token" width="70px" />}
            <th style={{ padding: "16px 20px", textAlign: "right", fontSize: "0.7rem", fontWeight: 900, color: "#9CA3AF" }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((bill: any, idx: number) => {
            const isExpanded = expandedRows.has(bill.id);
            const dt = new Date(bill.createdAt);
            const itemsCount = bill.items?.length || 0;

            return (
              <React.Fragment key={bill.id}>
                <tr style={{ borderBottom: isExpanded ? "none" : "1px solid #F9FAFB", transition: "background 0.2s" }} className="hover:bg-slate-50">
                  <td style={{ padding: "16px 10px", width: "40px", textAlign: "center" }}>
                    <button onClick={() => toggleRow(bill.id)} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer" }}>
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  </td>
                  {visibleCols.sno && <td style={{ padding: "16px 20px", fontSize: "0.75rem", fontWeight: 700, color: "#D1D5DB" }}>{(currentPage-1)*itemsPerPage + idx + 1}</td>}
                  {visibleCols.timeline && (
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 800 }}>{dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9CA3AF" }}>{dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                      </div>
                    </td>
                  )}
                  {visibleCols.billInfo && (
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 900, color: "#6366F1", fontFamily: "monospace" }}>#{bill.billNumber}</span>
                        <StatusIndicator status={bill.isOrder ? bill.orderStatus! : (bill.paymentStatus || "Paid")} />
                      </div>
                    </td>
                  )}
                  {visibleCols.source && <td><TypeBadge type={bill.tableName || "POS"} /></td>}
                  {visibleCols.source && (
                    <td>
                      <span style={{ 
                        padding: "4px 8px", borderRadius: "6px", 
                        background: (bill.tableName || "POS") === "POS" ? "rgba(99, 102, 241, 0.1)" : "rgba(245, 158, 11, 0.1)", 
                        color: (bill.tableName || "POS") === "POS" ? "#6366F1" : "#D97706", 
                        fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", border: "1px solid currentColor"
                      }}>
                        {bill.tableName || "POS"}
                      </span>
                    </td>
                  )}
                  {visibleCols.items && (
                    <td>
                      <button onClick={() => toggleRow(bill.id)} style={{ padding: "6px 12px", borderRadius: "10px", background: "#EEF2FF", color: "#6366F1", fontSize: "0.7rem", fontWeight: 900, border: "1px solid #E0E7FF", cursor: "pointer", transition: "all 0.2s" }}>
                        {itemsCount} {itemsCount === 1 ? 'ITEM' : 'ITEMS'}
                      </button>
                    </td>
                  )}
                  {visibleCols.customer && <td style={{ fontSize: "0.85rem", fontWeight: 800 }}>{bill.customerName || "Walk-in"}</td>}
                  {visibleCols.customerPhone && <td style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#9CA3AF" }}>{bill.customerPhone || "—"}</td>}
                  {visibleCols.subtotal && <td style={{ textAlign: "right", fontWeight: 600 }}>₹{format(bill.subtotal || bill.total)}</td>}
                  {visibleCols.discount && <td style={{ textAlign: "right", fontWeight: 700, color: "#EF4444" }}>₹{format(bill.discountAmount || 0)}</td>}
                  {visibleCols.gst && <td style={{ textAlign: "right", fontWeight: 700, color: "#F59E0B" }}>₹{format(bill.tax || 0)}</td>}
                  {visibleCols.total && <td style={{ textAlign: "right", fontSize: "1rem", fontWeight: 950, color: "#1E293B" }}>₹{format(bill.total)}</td>}
                  {visibleCols.payment && <td><PaymentBadge mode={bill.paymentMode} status={bill.paymentStatus} /></td>}
                  {visibleCols.token && (
                    <td>
                      {bill.tokenNumber ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#F1F5F9", padding: "4px 8px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                          <span style={{ fontSize: "0.55rem", fontWeight: 900, color: "#64748B" }}>TOKEN</span>
                          <span style={{ fontSize: "0.9rem", fontWeight: 950, color: "#6366F1", fontFamily: "monospace", lineHeight: 1 }}>{String(bill.tokenNumber).padStart(2, '0')}</span>
                        </div>
                      ) : <span style={{ color: "#D1D5DB" }}>—</span>}
                    </td>
                  )}
                  <td style={{ textAlign: "right", paddingRight: "60px" }}>
                    <BillActions 
                      bill={bill} 
                      refresh={refresh} 
                      business={business} 
                      userRole={userRole} 
                      userPermissions={userPermissions}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                      setPreviewBill={setPreviewBill}
                    />
                  </td>
                </tr>

                {isExpanded && (
                  <tr>
                    <td colSpan={16} style={{ padding: "0 20px 24px 60px" }}>
                       <div style={{ background: "white", borderRadius: "28px", padding: "32px", border: "1px solid #F1F5F9", boxShadow: "0 15px 40px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: "24px", position: "relative", overflow: "hidden" }}>
                          {/* Accent line */}
                          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "6px", background: "linear-gradient(to bottom, #6366F1, #A855F7)" }} />
                          
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                             <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ padding: "10px", background: "#EEF2FF", borderRadius: "12px", color: "#6366F1" }}><FileText size={20} /></div>
                                <div>
                                   <div style={{ fontSize: "1rem", fontWeight: 900, color: "#1E293B" }}>Detailed Items Breakdown</div>
                                   <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94A3B8" }}>Invoice ID: {bill.id.slice(-8).toUpperCase()}</div>
                                </div>
                             </div>
                             <div style={{ display: "flex", gap: "8px" }}>
                                <span style={{ padding: "6px 12px", background: "#F1F5F9", borderRadius: "8px", fontSize: "0.65rem", fontWeight: 900, color: "#64748B" }}>{itemsCount} ITEMS TOTAL</span>
                             </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
                             {bill.items?.map((it: any, i: number) => {
                               const q = Number(it.qty || it.quantity || 0);
                               const r = Number(it.rate || it.price || 0);
                               return (
                                 <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#F8FAFC", borderRadius: "20px", border: "1px solid #F1F5F9", transition: "all 0.2s" }} className="hover:border-indigo-100 hover:shadow-sm">
                                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                       <div style={{ width: "36px", height: "36px", background: "white", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #E2E8F0", fontSize: "0.75rem", fontWeight: 900, color: "#6366F1" }}>{q}x</div>
                                       <div style={{ display: "flex", flexDirection: "column" }}>
                                          <span style={{ fontWeight: 850, fontSize: "0.9rem", color: "#1E293B" }}>{it.name}</span>
                                          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94A3B8" }}>Unit Price: ₹{format(r)}</span>
                                       </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                       <span style={{ fontWeight: 950, fontSize: "1.05rem", color: "#1E293B" }}>₹{format(q * r)}</span>
                                    </div>
                                 </div>
                               );
                             })}
                          </div>

                          <div style={{ marginTop: "8px", background: "#F8FAFC", borderRadius: "24px", padding: "24px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                             <div style={{ display: "flex", gap: "32px" }}>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                   <span style={{ fontSize: "0.6rem", fontWeight: 900, color: "#94A3B8", textTransform: "uppercase" }}>Subtotal</span>
                                   <span style={{ fontSize: "1rem", fontWeight: 900, color: "#1E293B" }}>₹{format(bill.subtotal)}</span>
                                </div>
                                {bill.discountAmount > 0 && (
                                   <div style={{ display: "flex", flexDirection: "column" }}>
                                      <span style={{ fontSize: "0.6rem", fontWeight: 900, color: "#EF4444", textTransform: "uppercase" }}>Discount</span>
                                      <span style={{ fontSize: "1rem", fontWeight: 900, color: "#EF4444" }}>-₹{format(bill.discountAmount)}</span>
                                   </div>
                                )}
                                {bill.tax > 0 && (
                                   <div style={{ display: "flex", flexDirection: "column" }}>
                                      <span style={{ fontSize: "0.6rem", fontWeight: 900, color: "#F59E0B", textTransform: "uppercase" }}>GST (Tax)</span>
                                      <span style={{ fontSize: "1rem", fontWeight: 900, color: "#F59E0B" }}>+₹{format(bill.tax)}</span>
                                   </div>
                                )}
                             </div>
                             <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                <span style={{ fontSize: "0.7rem", fontWeight: 900, color: "#6366F1", textTransform: "uppercase", letterSpacing: "1px" }}>Total Payable</span>
                                <span style={{ fontSize: "1.75rem", fontWeight: 1000, color: "#1E293B", lineHeight: 1 }}>₹{format(bill.total)}</span>
                             </div>
                          </div>
                       </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {previewBill && (
        <BillPreviewModal bill={previewBill} business={business} onClose={() => setPreviewBill(null)} />
      )}
    </div>
  );
}

const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
  };

  if (num === 0) return 'Zero Only';
  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);
  
  let result = convert(integerPart) + ' Rupees';
  if (decimalPart > 0) result += ' and ' + convert(decimalPart) + ' Paise';
  return result + ' Only';
};

const BillPreviewModal = ({ bill, business, onClose }: { bill: any, business: any, onClose: () => void }) => {
  if (!bill) return null;

  const dt = new Date(bill.createdAt);
  const dateStr = dt.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const format = (num: number) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

  const addressParts = [business?.businessAddress, business?.district, business?.state, business?.pinCode].filter(Boolean);
  const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : "";

  const UPI_ID = business?.upi || "";
  const UPI_NAME = business?.businessName || "Store";
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${Number(bill.total).toFixed(2)}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;

  // GST Calculation
  const taxActive = business?.taxEnabled ?? true;
  const perProductEnabled = business?.perProductTaxEnabled ?? false;
  const globalRate = business?.taxRate ?? 5.0;
  const discountRatio = bill.subtotal > 0 ? ((bill.subtotal - (bill.discountAmount || 0)) / bill.subtotal) : 1;

  const taxGroups = (bill.items || []).reduce((acc: any, item: any) => {
    let rate = 0;
    if (perProductEnabled && item.gst !== undefined && item.gst !== null) {
      rate = item.gst;
    } else if (taxActive) {
      rate = globalRate;
    }
    const qty = Number(item.qty || item.quantity || 0);
    const itemRate = Number(item.rate || item.price || 0);
    const gross = (qty * itemRate) * discountRatio;
    let taxable = gross;
    let gst = 0;
    if (item.taxStatus === "With Tax") {
      taxable = gross / (1 + rate / 100);
      gst = gross - taxable;
    } else {
      taxable = gross;
      gst = (gross * rate) / 100;
    }
    if (!acc[rate]) acc[rate] = { rate, taxable: 0, cgst: 0, sgst: 0 };
    acc[rate].taxable += taxable;
    acc[rate].cgst += gst / 2;
    acc[rate].sgst += gst / 2;
    return acc;
  }, {});
  let taxBreakup = Object.values(taxGroups).filter((g: any) => g.cgst > 0 || g.sgst > 0);
  
  // Robust fallback for historical bills where GST rate was not saved explicitly in items
  if (taxBreakup.length === 0 && bill.tax > 0) {
    const assumedRate = Math.round((bill.tax / bill.subtotal) * 100);
    taxBreakup.push({
      rate: assumedRate,
      taxable: bill.subtotal,
      cgst: bill.tax / 2,
      sgst: bill.tax / 2
    });
  }

  const totalTaxable = taxBreakup.reduce((sum, g: any) => sum + g.taxable, 0);

  const handleWhatsApp = () => {
    const phone = formatWhatsAppNumber(bill.customerPhone);
    const origin = window.location.origin;
    const pdfUrl = `${origin}/api/bill-manager/${bill.id}/pdf${bill.clerkUserId ? `?clerkId=${bill.clerkUserId}` : ""}`;
    const restaurantName = business?.businessName || "Kravy POS";
    const message = encodeURIComponent(
      "🙏 *Thank you for shopping with us!*\n\n" +
      `Hello *${bill.customerName || "Customer"}*,\n\n` +
      `Here is your invoice from *${restaurantName}*:\n\n` +
      "🧾 *Bill No:* " + bill.billNumber + "\n" +
      "💰 *Amount Paid:* Rs. " + bill.total + "\n\n" +
      "📄 *Download Invoice:*\n" + pdfUrl + "\n\n" +
      "We look forward to serving you again! 😊"
    );
    window.open(phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`, "_blank");
  };

  const handlePrintPdf = () => {
    const origin = window.location.origin;
    const pdfUrl = `${origin}/api/bill-manager/${bill.id}/pdf${bill.clerkUserId ? `?clerkId=${bill.clerkUserId}` : ""}`;
    window.open(pdfUrl, "_blank");
  };

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 999999, display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.6)", padding: "20px" }}>
      <div style={{ margin: "auto", background: "#F1F5F9", width: "100%", maxWidth: "460px", borderRadius: "20px", display: "flex", flexDirection: "column", overflow: "hidden", maxHeight: "90vh", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", background: "white", borderBottom: "1px solid #E2E8F0" }}>
           <div>
             <div style={{ fontSize: "1.15rem", fontWeight: 950, color: "#0F172A" }}>Bill Preview</div>
             <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "1px" }}>Check Before Printing</div>
           </div>
           <button onClick={onClose} style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#FEE2E2", color: "#EF4444", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
             <X size={18} />
           </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: "32px 24px 64px 24px", overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", background: "#E2E8F0", flex: 1 }}>
           
           {/* Exact Receipt Paper Match */}
           <div style={{ background: "white", width: "100%", maxWidth: "340px", padding: "24px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", fontFamily: "var(--font-inter), sans-serif", color: "black", flexShrink: 0 }}>
              
              {/* Logo & Header */}
              <div style={{ textAlign: "center", marginBottom: "8px" }}>
                 {business?.logoUrl ? (
                   <img src={business.logoUrl} alt="Logo" style={{ width: "80px", height: "80px", objectFit: "contain", margin: "0 auto 12px auto", filter: "grayscale(100%) contrast(200%)" }} />
                 ) : (
                   <div style={{ width: "60px", height: "60px", margin: "0 auto 12px auto", background: "black", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: "24px" }}>
                     K
                   </div>
                 )}
                 <div style={{ fontSize: "1.4rem", fontWeight: 900, marginBottom: "2px", letterSpacing: "-0.5px" }}>{business?.businessName || "Kravy POS"}</div>
                 <div style={{ fontSize: "0.8rem", fontWeight: 700, maxWidth: "90%", margin: "0 auto" }}>{fullAddress}</div>
              </div>

              <div style={{ borderTop: "1.5px dashed black", margin: "8px 0" }} />
              <div style={{ textAlign: "center", fontSize: "0.8rem", fontWeight: 800 }}>GSTIN: {business?.gstNumber || "NOT PROVIDED"}</div>
              <div style={{ borderTop: "1.5px dashed black", margin: "8px 0" }} />

              <div style={{ textAlign: "center", fontSize: "0.85rem", fontWeight: 800, lineHeight: 1.4, marginBottom: "12px" }}>
                 <div>Bill No: {bill.billNumber}</div>
                 <div>Date: {dateStr}, {timeStr}</div>
              </div>

              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <span style={{ border: "1.5px solid black", padding: "4px 12px", fontSize: "0.85rem", fontWeight: 900, textTransform: "uppercase" }}>
                  TYPE: {bill.tableName || "POS"}
                </span>
              </div>

              <div style={{ borderTop: "2px dashed black", margin: "12px 0" }} />
              
              {/* Items Header */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 900, textTransform: "uppercase" }}>
                <span>ITEM DESCRIPTION</span>
                <span>TOTAL</span>
              </div>
              <div style={{ display: "flex", overflow: "hidden", fontSize: "0.8rem", fontWeight: 900, letterSpacing: "2px", marginBottom: "8px" }}>
                ================================================
              </div>

              {/* Items List */}
              <div style={{ marginBottom: "12px" }}>
                 {bill.items?.map((it: any, i: number) => {
                   const q = Number(it.qty || it.quantity || 0);
                   const r = Number(it.rate || it.price || 0);
                   let itemGst = perProductEnabled && it.gst !== undefined && it.gst !== null ? it.gst : (taxActive ? globalRate : 0);
                   
                   // Fallback visual fix for historical items
                   if (itemGst === 0 && bill.tax > 0) {
                     itemGst = Math.round((bill.tax / bill.subtotal) * 100);
                   }

                   return (
                     <div key={i} style={{ marginBottom: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: 900 }}>
                           <span>{it.name}</span>
                           <span>₹{format(q * r)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700 }}>
                           <span>{q} x ₹{format(r)}</span>
                           <span>| GST: {itemGst}%</span>
                        </div>
                     </div>
                   );
                 })}
              </div>

              <div style={{ borderTop: "2px dashed black", margin: "12px 0 8px 0" }} />

              {/* Subtotals */}
              <div style={{ fontSize: "0.9rem", fontWeight: 800, lineHeight: 1.6 }}>
                 <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Subtotal</span>
                    <span>₹{format(bill.subtotal || bill.total)}</span>
                 </div>
                 {(bill.discountAmount > 0) && (
                   <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Discount</span>
                      <span>-₹{format(bill.discountAmount)}</span>
                   </div>
                 )}
                 {(bill.deliveryCharges > 0) && (
                   <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Delivery Charge</span>
                      <span>₹{format(bill.deliveryCharges)}</span>
                   </div>
                 )}
                 {(bill.packagingCharges > 0) && (
                   <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Packaging Charge</span>
                      <span>₹{format(bill.packagingCharges)}</span>
                   </div>
                 )}
                 {(bill.serviceCharge > 0) && (
                   <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Service Charge</span>
                      <span>₹{format(bill.serviceCharge)}</span>
                   </div>
                 )}
                 {(bill.tax > 0) && (
                   <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Taxable Amt</span>
                      <span>₹{format(totalTaxable)}</span>
                   </div>
                 )}
                 {(bill.tax > 0) && (
                   <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Total Tax</span>
                      <span>₹{format(bill.tax)}</span>
                   </div>
                 )}
              </div>

              <div style={{ borderTop: "2px dashed black", margin: "8px 0" }} />
              <div style={{ borderTop: "4px solid black", margin: "8px 0" }} />
              
              {/* Grand Total */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 0" }}>
                 <span style={{ fontSize: "1.2rem", fontWeight: 950, textTransform: "uppercase" }}>GRAND TOTAL</span>
                 <span style={{ fontSize: "1.4rem", fontWeight: 950 }}>₹{format(bill.total)}</span>
              </div>

              <div style={{ borderTop: "4px solid black", margin: "8px 0" }} />

              {/* GST Tax Breakup */}
              {taxBreakup.length > 0 && (
                <div style={{ marginTop: "16px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "4px" }}>GST TAX BREAKUP</div>
                  <div style={{ borderTop: "1.5px dashed black", margin: "4px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 900 }}>
                    <span style={{ width: "25%" }}>Rate</span>
                    <span style={{ width: "35%", textAlign: "right" }}>Taxable</span>
                    <span style={{ width: "20%", textAlign: "right" }}>CGST</span>
                    <span style={{ width: "20%", textAlign: "right" }}>SGST</span>
                  </div>
                  <div style={{ borderTop: "3px solid black", margin: "4px 0" }} />
                  {taxBreakup.map((g: any, i: number) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 800 }}>
                      <span style={{ width: "25%" }}>{g.rate}%</span>
                      <span style={{ width: "35%", textAlign: "right" }}>{format(g.taxable)}</span>
                      <span style={{ width: "20%", textAlign: "right" }}>{format(g.cgst)}</span>
                      <span style={{ width: "20%", textAlign: "right" }}>{format(g.sgst)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: "3px solid black", margin: "4px 0" }} />
                </div>
              )}

              {/* Amount in words */}
              <div style={{ fontSize: "0.8rem", fontStyle: "italic", fontWeight: 800, marginTop: "12px", marginBottom: "16px", lineHeight: 1.3 }}>
                Amount in Words: {numberToWords(bill.total)}
              </div>

              <div style={{ borderTop: "2px dashed black", margin: "8px 0" }} />
              
              {/* Payment Info */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 900 }}>
                <span>Payment: {bill.paymentMode || "Cash"}</span>
                <span>Status: {bill.paymentStatus}</span>
              </div>
              
              <div style={{ borderTop: "2px dashed black", margin: "8px 0" }} />

              {/* QR Code */}
              {business?.upi && business?.upiQrEnabled !== false && (
                <div style={{ textAlign: "center", margin: "24px 0" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 950, textTransform: "uppercase", marginBottom: "12px" }}>SCAN & PAY</div>
                  <img src={qrUrl} alt="UPI QR" style={{ width: "160px", height: "160px", margin: "0 auto 12px auto", mixBlendMode: "multiply", filter: "contrast(200%) grayscale(100%)" }} />
                  <div style={{ fontSize: "0.8rem", fontWeight: 800 }}>UPI: {business.upi}</div>
                </div>
              )}

              {business?.upi && business?.upiQrEnabled !== false && (
                <div style={{ borderTop: "2px dashed black", margin: "16px 0" }} />
              )}

              {/* Footer Elements */}
              <div style={{ textAlign: "center", marginTop: "24px" }}>
                 <div style={{ fontSize: "1.1rem", fontWeight: 950, textTransform: "uppercase", marginBottom: "12px", letterSpacing: "1px" }}>
                   THANK YOU 🙏 VISIT AGAIN
                 </div>
                 <div style={{ fontSize: "0.7rem", fontWeight: 800 }}>Software by Kravy</div>
                 <div style={{ fontSize: "0.75rem", fontStyle: "italic", fontWeight: 800, letterSpacing: "4px", marginTop: "4px" }}>
                   * * * END OF BILL * * *
                 </div>
              </div>
           </div>
        </div>

        {/* Footer Actions */}
        <div style={{ padding: "16px 24px", background: "white", borderTop: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: "10px" }}>
           <button onClick={onClose} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #E2E8F0", background: "white", fontWeight: 800, color: "#475569", cursor: "pointer", fontSize: "0.95rem", transition: "0.2s" }} className="hover:bg-slate-50">Close</button>
           <button onClick={handlePrintPdf} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #F97316", background: "white", fontWeight: 800, color: "#EA580C", cursor: "pointer", fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "0.2s" }} className="hover:bg-orange-50"><Printer size={18} /> Print PDF / Direct</button>
           <button onClick={handleWhatsApp} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "none", background: "#10B981", fontWeight: 800, color: "white", cursor: "pointer", fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "0.2s" }} className="hover:bg-emerald-400"><Smartphone size={18} /> WhatsApp</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const Th = ({ label, isRight, color = "#9CA3AF", width }: any) => (
  <th style={{ padding: "16px 20px", textAlign: isRight ? "right" : "left", fontSize: "0.7rem", fontWeight: 900, color: color, letterSpacing: "1px", width }}>
    {label}
  </th>
);
