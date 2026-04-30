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
        select: { id: true, deletedAt: true, deletedSnapshot: true },
      }),
      prisma.order.findMany({
        where: { clerkUserId: effectiveId, isDeleted: true },
        orderBy: { updatedAt: "desc" },
        include: { table: true }
      })
    ]);

    const formattedBills = deletedBills
      .filter(b => b.deletedSnapshot)
      .map((b) => ({
        id: b.id,
        billId: b.id,
        createdAt: b.deletedAt,
        snapshot: b.deletedSnapshot,
        type: "bill"
      }));

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
