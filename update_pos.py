import re

# 1. CheckoutClient.tsx - Optimize Print Window Delay
with open("src/app/dashboard/billing/checkout/CheckoutClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('''    Promise.all(imagePromises).then(() => {
      // Give more time (300ms) for items to render and images to prepare
      setTimeout(() => {
        window.print();''', '''    Promise.all(imagePromises).then(() => {
      setTimeout(() => {
        window.print();''')
content = content.replace('''        }, 2500); 
      }, 300);
    });''', '''        }, 2500); 
      }, images.length > 0 ? 150 : 10);
    });''')

with open("src/app/dashboard/billing/checkout/CheckoutClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)


# 2. BillHistoryTable.tsx - Modal & Reason Logic
with open("src/app/dashboard/billing/BillHistoryTable.tsx", "r", encoding="utf-8") as f:
    content2 = f.read()

# Add DELETED status badge
content2 = content2.replace('''  if (s === "cancelled") { icon = <XCircle size={10} />; color = "#EF4444"; bg = "#FEF2F2"; text = "CANCELLED"; }''', '''  if (s === "cancelled") { icon = <XCircle size={10} />; color = "#EF4444"; bg = "#FEF2F2"; text = "CANCELLED"; }
  if (s === "deleted") { icon = <Trash2 size={10} />; color = "#64748B"; bg = "#F1F5F9"; text = "DELETED"; }''')

# Replace handleStatusUpdate and handleDelete
content2 = content2.replace('''  const handleDelete = async () => {
    if (!await confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/bill-manager/${bill.id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Deleted"); refresh(true); }
    } catch (e) { toast.error("Error"); }
  };

  const handleStatusUpdate = async (status: string) => {
    const label = status === "Paid" ? "PAID" : status === "CANCELLED" ? "CANCELLED" : "UNPAID";
    if (!await confirm(`Mark this order as ${label}?`)) return;
    try {
      const res = await fetch(`/api/bill-manager/${bill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: status }),
      });
      if (res.ok) { toast.success(`Updated to ${label}`); refresh(true); }
      else { toast.error("Failed to update"); }
    } catch (e) { toast.error("Error"); }
  };''', '''  const [reasonModal, setReasonModal] = useState<{type: "CANCELLED" | "DELETED", isOpen: boolean} | null>(null);

  const handleDelete = async (reason: string) => {
    try {
      const res = await fetch(`/api/bill-manager/${bill.id}`, { 
        method: "DELETE",
        headers: { "x-delete-reason": reason } 
      });
      if (res.ok) { toast.success("Deleted"); refresh(true); }
    } catch (e) { toast.error("Error"); }
  };

  const handleStatusUpdate = async (status: string, reason?: string) => {
    const label = status === "Paid" ? "PAID" : status === "CANCELLED" ? "CANCELLED" : "UNPAID";
    if (status === "Paid" && !await confirm(`Mark this order as ${label}?`)) return;
    if (status === "Pending" && !await confirm(`Mark this order as ${label}?`)) return;
    
    try {
      if (bill.isOrder && status === "Paid") {
        const res1 = await fetch("/api/bill-manager", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: bill.items,
            subtotal: bill.subtotal,
            tax: bill.tax,
            total: bill.total,
            paymentMode: bill.paymentMode || "Cash",
            paymentStatus: "Paid",
            customerName: bill.customerName,
            customerPhone: bill.customerPhone,
            tableName: bill.tableName,
            orderId: bill.id,
            isKotPrinted: true,
            amountPaid: bill.total
          })
        });

        if (res1.ok) {
           await fetch("/api/orders", {
             method: "PATCH",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ orderId: bill.id, status: "COMPLETED", skipInventoryDeduction: true })
           });
           toast.success(`Updated to PAID`);
           refresh(true);
           return;
        } else {
           throw new Error("Failed to create bill");
        }
      }

      const res = await fetch(`/api/bill-manager/${bill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: status, auditNote: reason ? `Reason: ${reason}` : undefined }),
      });
      if (res.ok) { toast.success(`Updated to ${label}`); refresh(true); }
      else { toast.error("Failed to update"); }
    } catch (e) { toast.error("Error"); }
  };''')

# Update Cancel/Delete buttons in MenuOption
content2 = content2.replace('''              {bill.paymentStatus !== "CANCELLED" ? (
                <MenuOption icon={<XCircle size={14} color="#EF4444" />} label="Mark as Cancelled" onClick={async () => { setOpenMenuId(null); handleStatusUpdate("CANCELLED"); }} />
              ) : (''', '''              {bill.paymentStatus !== "CANCELLED" && bill.paymentStatus !== "DELETED" ? (
                <MenuOption icon={<XCircle size={14} color="#EF4444" />} label="Mark as Cancelled" onClick={async () => { setOpenMenuId(null); setReasonModal({ type: "CANCELLED", isOpen: true }); }} />
              ) : (''')

content2 = content2.replace('''                  <div style={{ height: "1px", background: "#F3F4F6", margin: "4px 0" }} />
                  <MenuOption icon={<Trash2 size={14} color="#EF4444" />} label="Delete Bill" onClick={async () => { setOpenMenuId(null); handleDelete(); }} isDestructive />''', '''                  <div style={{ height: "1px", background: "#F3F4F6", margin: "4px 0" }} />
                  {bill.paymentStatus !== "DELETED" && (
                    <MenuOption icon={<Trash2 size={14} color="#EF4444" />} label="Delete Bill" onClick={async () => { setOpenMenuId(null); setReasonModal({ type: "DELETED", isOpen: true }); }} isDestructive />
                  )}''')

# Insert Reason Modal UI inside BillActions return
reason_modal_ui = '''        {renderStatus()}
      </div>

      {reasonModal?.isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div style={{ background: "white", padding: "24px", borderRadius: "20px", width: "90%", maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 900, marginBottom: "16px", color: "#1E293B" }}>
              {reasonModal.type === "CANCELLED" ? "Cancel Bill" : "Delete Bill"}
            </h3>
            <p style={{ fontSize: "0.8rem", color: "#64748B", marginBottom: "12px" }}>Select a reason:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              {["Guest refused to pay", "Wrong Item Billed", "Test Order", "Duplicate Bill"].map(rs => (
                <button key={rs} onClick={() => {
                  setReasonModal(null);
                  if (reasonModal.type === "CANCELLED") handleStatusUpdate("CANCELLED", rs);
                  else handleDelete(rs);
                }} style={{ padding: "10px", background: "#F1F5F9", borderRadius: "10px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
                  {rs}
                </button>
              ))}
            </div>
            <p style={{ fontSize: "0.8rem", color: "#64748B", marginBottom: "8px" }}>Or enter custom reason:</p>
            <form onSubmit={(e: any) => {
              e.preventDefault();
              const val = e.target.elements.customReason.value;
              if(!val) return;
              setReasonModal(null);
              if (reasonModal.type === "CANCELLED") handleStatusUpdate("CANCELLED", val);
              else handleDelete(val);
            }}>
              <input name="customReason" autoFocus placeholder="Type reason here..." style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #E2E8F0", marginBottom: "12px", fontSize: "0.85rem", outline: "none" }} />
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setReasonModal(null)} style={{ padding: "10px 16px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 800, color: "#64748B" }}>Close</button>
                <button type="submit" style={{ padding: "10px 16px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 800, background: "#EF4444", color: "white" }}>Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    );'''

content2 = content2.replace('''        {renderStatus()}
      </div>
    );''', reason_modal_ui)

# Display the auditNote reason in the table row if cancelled/deleted
content2 = content2.replace('''{visibleCols.customer && <td className="text-slate-800 dark:text-slate-200" style={{ fontSize: "0.85rem", fontWeight: 800 }}>{bill.customerName || "Walk-in"}</td>}''', '''{visibleCols.customer && (
  <td className="text-slate-800 dark:text-slate-200" style={{ fontSize: "0.85rem", fontWeight: 800 }}>
    {bill.customerName || "Walk-in"}
    {(bill.paymentStatus === "CANCELLED" || bill.paymentStatus === "DELETED") && bill.auditNote && (
      <div style={{ fontSize: "0.65rem", color: "#EF4444", fontWeight: 700, marginTop: "4px", background: "#FEF2F2", padding: "2px 6px", borderRadius: "4px", display: "inline-block" }}>
        {bill.auditNote}
      </div>
    )}
  </td>
)}''')


with open("src/app/dashboard/billing/BillHistoryTable.tsx", "w", encoding="utf-8") as f:
    f.write(content2)


# 3. api/bill-manager/[id]/route.ts - Soft Delete implementation
with open("src/app/api/bill-manager/[id]/route.ts", "r", encoding="utf-8") as f:
    content3 = f.read()

content3 = content3.replace('''    const bill = await prisma.billManager.findFirst({ where: { id, clerkUserId: effectiveId } });
    if (bill) {
      await prisma.billManager.update({ 
        where: { id }, 
        data: { 
          isDeleted: true, 
          deletedAt: new Date(),
          deletedSnapshot: bill as any // ✅ Save full snapshot for history
        } 
      });
      return NextResponse.json({ success: true, type: "bill" });
    }

    const order = await prisma.order.findFirst({ 
      where: { id, clerkUserId: effectiveId },
      include: { table: true }
    });
    if (order) {
      await prisma.order.update({ 
        where: { id }, 
        data: { 
          isDeleted: true,
          deletedAt: new Date(),
          deletedSnapshot: order as any
        } 
      });
      return NextResponse.json({ success: true, type: "order" });
    }''', '''    const deleteReason = req.headers.get("x-delete-reason") || "Deleted manually";
    const bill = await prisma.billManager.findFirst({ where: { id, clerkUserId: effectiveId } });
    if (bill) {
      await prisma.billManager.update({ 
        where: { id }, 
        data: { 
          paymentStatus: "DELETED",
          auditNote: `Reason: ${deleteReason}`,
          deletedSnapshot: bill as any 
        } 
      });
      return NextResponse.json({ success: true, type: "bill" });
    }

    const order = await prisma.order.findFirst({ 
      where: { id, clerkUserId: effectiveId },
      include: { table: true }
    });
    if (order) {
      await prisma.order.update({ 
        where: { id }, 
        data: { 
          status: "DELETED",
          notes: `Reason: ${deleteReason}`,
          deletedSnapshot: order as any
        } 
      });
      return NextResponse.json({ success: true, type: "order" });
    }''')

with open("src/app/api/bill-manager/[id]/route.ts", "w", encoding="utf-8") as f:
    f.write(content3)


# 4. Handle PATCH auditNote
content3 = content3.replace('''    const allowedUpdates = ["paymentStatus", "paymentMode", "upiTxnRef", "isHeld", "customerName", "customerPhone", "customerAddress"];''', '''    const allowedUpdates = ["paymentStatus", "paymentMode", "upiTxnRef", "isHeld", "customerName", "customerPhone", "customerAddress", "auditNote"];''')

with open("src/app/api/bill-manager/[id]/route.ts", "w", encoding="utf-8") as f:
    f.write(content3)

print("Done updates!")
