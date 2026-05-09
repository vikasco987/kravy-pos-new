import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [deletedBills, deletedOrders] = await Promise.all([
      prisma.billManager.findMany({
        where: { clerkUserId: effectiveId, isDeleted: true },
        orderBy: { deletedAt: "desc" },
      }),
      prisma.order.findMany({
        where: { clerkUserId: effectiveId, isDeleted: true },
        orderBy: { updatedAt: "desc" },
        include: { table: true }
      })
    ]);

    const formattedBills = deletedBills.map((b: any) => {
      // 1. Get snapshot (or raw data fallback)
      const rawSnap = b.deletedSnapshot || b;
      
      // 2. Normalize snapshot for frontend
      const snapshot = {
        billNumber: rawSnap.billNumber,
        total: rawSnap.total,
        paymentMode: rawSnap.paymentMode,
        paymentStatus: rawSnap.paymentStatus,
        isHeld: rawSnap.isHeld,
        tableName: rawSnap.tableName,
        customer: { 
          name: rawSnap.customerName || (rawSnap.customer?.name) || "Walk-in Customer" 
        },
        items: rawSnap.items
      };

      return {
        id: b.id,
        billId: b.id,
        createdAt: b.deletedAt,
        snapshot: snapshot,
        type: "bill"
      };
    });

    const formattedOrders = deletedOrders.map((o: any) => ({
      id: o.id,
      billId: o.id,
      createdAt: o.updatedAt,
      type: "order",
      snapshot: {
        billNumber: `ORD-${o.id.slice(-4).toUpperCase()}`,
        total: o.total,
        paymentMode: "Pending",
        paymentStatus: o.status,
        customer: { name: o.customerName || "Walk-in" },
        tableName: o.table?.name || "Counter"
      }
    }));

    const combined = [...formattedBills, ...formattedOrders].sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );

    return NextResponse.json({ deleted: combined });
  } catch (err) {
    console.error("DELETED BILL LIST ERROR:", err);
    return NextResponse.json(
      { error: "Failed to load deleted bills" },
      { status: 500 }
    );
  }
}
