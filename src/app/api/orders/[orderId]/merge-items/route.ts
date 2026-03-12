import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

interface MergeItem {
  name: string;
  price: number;
  quantity: number;
  itemId?: string;
}

interface OrderItem extends MergeItem {
  addedAt: string;
  addedInCase: string;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;
    const { items: newItems, caseType = "merge" } = await req.json();

    if (!newItems || !Array.isArray(newItems) || newItems.length === 0) {
      return NextResponse.json(
        { error: "Items array required and must not be empty" },
        { status: 400 }
      );
    }

    // Fetch existing order
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        clerkUserId: effectiveId,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if order status allows merging
    if (!["PENDING", "ACCEPTING"].includes(existingOrder.status)) {
      return NextResponse.json(
        {
          error: `Cannot merge items to order with status: ${existingOrder.status}`,
          currentStatus: existingOrder.status,
          message: "Order must be in PENDING or ACCEPTING state to merge items",
        },
        { status: 400 }
      );
    }

    // Parse existing items
    let existingItems: OrderItem[] = [];
    try {
      existingItems = Array.isArray(existingOrder.items)
        ? (existingOrder.items as unknown as OrderItem[])
        : [];
    } catch (e) {
      existingItems = [];
    }

    // Prepare new items with metadata
    const newItemsWithMeta: OrderItem[] = newItems.map((item: MergeItem) => ({
      ...item,
      addedAt: new Date().toISOString(),
      addedInCase: caseType,
    }));

    // Merge items - combine existing + new
    const mergedItems = [...existingItems, ...newItemsWithMeta];

    // Calculate new total
    const newTotal = mergedItems.reduce(
      (sum: number, item: OrderItem) => sum + item.price * item.quantity,
      0
    );

    // Update order with merged items
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        items: mergedItems as any,
        total: newTotal,
        isMerged: true,
        mergedAt: new Date(),
        caseType: caseType,
        status: "ACCEPTING", // Change to ACCEPTING so kitchen knows to re-review
      },
    });

    // Log activity
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: effectiveId },
      });

      if (user) {
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: `MERGED_ITEMS_TO_ORDER`,
            meta: JSON.stringify({
              orderId: orderId,
              itemsAdded: newItems.length,
              newTotal: newTotal,
              caseType: caseType,
            }),
          },
        });
      }
    } catch (logError) {
      console.warn("Failed to log activity:", logError);
    }

    return NextResponse.json(
      {
        success: true,
        message: `${newItems.length} item(s) merged to order successfully`,
        orderId: orderId,
        mergedItemsCount: newItems.length,
        totalItemsCount: mergedItems.length,
        newTotal: newTotal,
        previousTotal: existingOrder.total,
        items: mergedItems,
        order: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Merge items error:", error);
    return NextResponse.json(
      {
        error: "Failed to merge items to order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
