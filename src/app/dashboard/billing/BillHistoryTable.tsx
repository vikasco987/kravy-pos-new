"use client";

import React, { useState } from "react";
import { 
  ChevronDown, ChevronRight, Filter, Clock, CheckCircle2, 
  Smartphone, CreditCard, Wallet, Banknote, MoreVertical, 
  Eye, Printer, FileText, MessageCircle, Trash2, XCircle, CheckCircle 
} from "lucide-react";
import { formatWhatsAppNumber } from "@/lib/whatsapp";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

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
  <button onClick={onClick} style={{ width: "100%", textAlign: "left", padding: "10px 12px", border: "none", background: "transparent", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", fontWeight: 700, color: isDestructive ? "#EF4444" : "#374151" }}>
    {icon} {label}
  </button>
);

const BillActions = ({ bill, refresh, business, userRole, userPermissions }: any) => {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const canDelete = userRole === "ADMIN" || userRole === "MASTER" || userPermissions.includes("delete-bill");

  const handleDelete = async () => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/bill-manager/${bill.id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Deleted"); refresh(); }
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
      if (res.ok) { toast.success(`Updated to ${label}`); refresh(); }
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

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <button 
        onClick={handleWhatsApp} 
        style={{ 
          background: "#10b981", color: "white", border: "none", borderRadius: "8px", 
          padding: "5px 10px", display: "flex", alignItems: "center", gap: "6px", 
          fontSize: "0.65rem", fontWeight: 800, cursor: "pointer" 
        }}
      >
        <Smartphone size={12} /> WhatsApp
      </button>
      <div style={{ position: "relative", display: "inline-block" }}>
        <button onClick={() => setShowMenu(!showMenu)} style={{ width: "30px", height: "30px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "white", color: "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><MoreVertical size={14} /></button>
        {showMenu && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 9999 }} onClick={() => setShowMenu(false)} />
            <div style={{
              position: "absolute", right: 0, bottom: "calc(100% + 8px)", width: "200px",
              background: "white", borderRadius: "18px", border: "1px solid #F3F4F6",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)", padding: "8px", zIndex: 10000, display: "flex", flexDirection: "column", gap: "2px"
            }}>
              <MenuOption icon={<Eye size={14} color="#8B5CF6" />} label="View Details" onClick={() => router.push(`/dashboard/billing/${bill.id}`)} />
              <MenuOption icon={<Printer size={14} color="#6B7280" />} label="Reprint Bill" onClick={() => router.push(`/dashboard/billing/${bill.id}`)} />
              <MenuOption icon={<FileText size={14} color="#3B82F6" />} label="Edit Bill" onClick={() => router.push(`/dashboard/billing/checkout?resumeBillId=${bill.id}`)} />
              <MenuOption icon={<MessageCircle size={14} color="#10B981" />} label="WhatsApp" onClick={handleWhatsApp} />
              
              <div style={{ height: "1px", background: "#F3F4F6", margin: "4px 0" }} />
              
              {bill.paymentStatus !== "Paid" && (
                <MenuOption icon={<CheckCircle size={14} color="#10B981" />} label="Mark as Paid" onClick={() => handleStatusUpdate("Paid")} />
              )}
              {bill.paymentStatus !== "Pending" && bill.paymentStatus !== "Unpaid" && (
                <MenuOption icon={<Clock size={14} color="#F59E0B" />} label="Mark as Unpaid" onClick={() => handleStatusUpdate("Pending")} />
              )}
              {bill.paymentStatus !== "CANCELLED" ? (
                <MenuOption icon={<XCircle size={14} color="#EF4444" />} label="Mark as Cancelled" onClick={() => handleStatusUpdate("CANCELLED")} />
              ) : (
                <MenuOption icon={<CheckCircle size={14} color="#10B981" />} label="Restore Order" onClick={() => handleStatusUpdate("Paid")} />
              )}
              {canDelete && (
                <>
                  <div style={{ height: "1px", background: "#F3F4F6", margin: "4px 0" }} />
                  <MenuOption icon={<Trash2 size={14} color="#EF4444" />} label="Delete Bill" onClick={handleDelete} isDestructive />
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- Main Table Component ---

export default function BillHistoryTable({ bills, business, userRole, userPermissions, refresh, currentPage, itemsPerPage, visibleCols }: any) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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
                    <BillActions bill={bill} refresh={refresh} business={business} userRole={userRole} userPermissions={userPermissions} />
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
    </div>
  );
}

const Th = ({ label, isRight, color = "#9CA3AF", width }: any) => (
  <th style={{ padding: "16px 20px", textAlign: isRight ? "right" : "left", fontSize: "0.7rem", fontWeight: 900, color: color, letterSpacing: "1px", width }}>
    {label}
  </th>
);
