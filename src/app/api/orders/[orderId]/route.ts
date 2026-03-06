import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        clerkUserId: clerkId,
      },
      include: {
        table: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or unauthorized" },
        { status: 404 }
      );
    }

    // Parse items
    let items = [];
    try {
      items = Array.isArray(order.items)
        ? order.items
        : JSON.parse(order.items || "[]");
    } catch (e) {
      items = [];
    }

    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          orderId: order.id,
          tableId: order.tableId,
          tableName: order.table?.name,
          status: order.status,
          caseType: order.caseType,
          isMerged: order.isMerged,
          items: items,
          total: order.total,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          mergedAt: order.mergedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch order error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
