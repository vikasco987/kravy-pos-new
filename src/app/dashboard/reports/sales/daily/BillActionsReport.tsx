"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Eye, Printer, FileText, MessageCircle, Clock, Trash2, Smartphone, XCircle, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatWhatsAppNumber } from "@/lib/whatsapp";

interface BillActionsProps {
  billId: string;
  bill: any;
  business?: any;
}

export const BillActionsReport = ({ billId, bill, business }: BillActionsProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this bill?")) return;
    try {
      const res = await fetch(`/api/bill-manager/${billId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Bill deleted successfully");
        router.refresh(); 
      } else {
        toast.error("Failed to delete bill");
      }
    } catch (e) {
      toast.error("Error deleting bill");
    }
  };

  const handleCancel = async (unCancel = false) => {
    if (!confirm(unCancel ? "Mark this order as SETTLED?" : "Mark this order as CANCELLED?")) return;
    try {
      const res = await fetch(`/api/bill-manager/${billId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: unCancel ? "Paid" : "CANCELLED" }),
      });
      if (res.ok) {
        toast.success(unCancel ? "Order Restored" : "Order Cancelled");
        router.refresh();
      } else {
        toast.error("Failed to update order");
      }
    } catch (e) {
      toast.error("Error");
    }
  };

  const handlePaymentStatusChange = async (status: string) => {
    try {
      const res = await fetch(`/api/bill-manager/${billId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: status }),
      });
      if (res.ok) {
        toast.success(`Marked as ${status}`);
        router.refresh();
        setShowMenu(false);
      } else {
        toast.error("Failed to update status");
      }
    } catch (e) {
      toast.error("Error updating status");
    }
  };

  const handleWhatsApp = () => {
    if (!bill) return;
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
      "📄 *Download Invoice:*\n" +
      pdfUrl + "\n\n" +
      "We look forward to serving you again! 😊"
    );
    window.open(phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`, "_blank");
    setShowMenu(false);
  };

  const handleEdit = () => {
    router.push(`/dashboard/billing/checkout?resumeBillId=${billId}`);
    setShowMenu(false);
  };

  const handlePrint = () => {
    // Navigate to the view page which has the print logic
    router.push(`/dashboard/billing/${billId}`);
    setShowMenu(false);
  };

  const handleView = () => {
    router.push(`/dashboard/billing/${billId}`);
    setShowMenu(false);
  };

  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "flex-end" }}>
      <button 
        onClick={() => setShowMenu(!showMenu)}
        style={{
          width: "36px", height: "36px", borderRadius: "12px", border: "1px solid var(--kravy-border)",
          background: "var(--kravy-bg-2)", color: "var(--kravy-text-muted)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
        }}
      >
        <MoreVertical size={18} />
      </button>

      {showMenu && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setShowMenu(false)} />
          <div style={{
            position: "absolute", right: 0, top: "calc(100% + 8px)", width: "200px",
            background: "var(--kravy-surface)", borderRadius: "18px", border: "1px solid var(--kravy-border)",
            boxShadow: "var(--kravy-shadow-lg)", padding: "8px", zIndex: 101, display: "flex", flexDirection: "column", gap: "2px"
          }}>
            <MenuOption icon={<Eye size={14} color="#8B5CF6" />} label="View Details" onClick={handleView} />
            <MenuOption icon={<Printer size={14} color="#6B7280" />} label="Reprint Bill" onClick={handlePrint} />
            <MenuOption icon={<FileText size={14} color="#3B82F6" />} label="Edit Bill" onClick={handleEdit} />
            <MenuOption icon={<MessageCircle size={14} color="#10B981" />} label="WhatsApp" onClick={handleWhatsApp} />
            
            {bill.paymentStatus !== "CANCELLED" && bill.paymentStatus?.toLowerCase() !== "paid" && (
              <MenuOption icon={<CheckCircle size={14} color="#10B981" />} label="Mark as Paid" onClick={() => handlePaymentStatusChange("Paid")} />
            )}
            {bill.paymentStatus !== "CANCELLED" && bill.paymentStatus?.toLowerCase() === "paid" && (
              <MenuOption icon={<Clock size={14} color="#F59E0B" />} label="Mark as Unpaid" onClick={() => handlePaymentStatusChange("Pending")} />
            )}

            {bill.paymentStatus === "CANCELLED" ? (
              <MenuOption icon={<CheckCircle size={14} color="#10B981" />} label="Un-cancel Order" onClick={() => handleCancel(true)} />
            ) : (
              <MenuOption icon={<XCircle size={14} color="#EF4444" />} label="Mark as Cancelled" onClick={() => handleCancel(false)} />
            )}
            <div style={{ height: "1px", background: "var(--kravy-border)", margin: "4px 0" }} />
            <MenuOption icon={<Trash2 size={14} color="#EF4444" />} label="Delete" onClick={handleDelete} isDestructive />
          </div>
        </>
      )}
    </div>
  );
};

const MenuOption = ({ icon, label, onClick, isDestructive }: any) => (
  <button 
    onClick={onClick}
    style={{
      width: "100%", textAlign: "left", padding: "10px 12px", border: "none", background: "transparent",
      borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px",
      fontSize: "0.85rem", fontWeight: 700, color: isDestructive ? "#EF4444" : "var(--kravy-text-primary)"
    }}
  >
    {icon} {label}
  </button>
);
