import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // 1. Try finding in BillManager
    const bill = await prisma.billManager.findFirst({
      where: {
        id,
        clerkUserId: effectiveId,
        isDeleted: true,
      },
    });

    if (bill) {
      await prisma.billManager.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedSnapshot: null,
        },
      });
      return NextResponse.json({ success: true, type: "bill" });
    }

    // 2. Try finding in Order
    const order = await prisma.order.findFirst({
      where: {
        id,
        clerkUserId: effectiveId,
        isDeleted: true,
      }
    });

    if (order) {
      await prisma.order.update({
        where: { id },
        data: {
          isDeleted: false,
          updatedAt: new Date()
        }
      });
      return NextResponse.json({ success: true, type: "order" });
    }

    return NextResponse.json(
      { error: "Deleted record not found" },
      { status: 404 }
    );
  } catch (err) {
    console.error("RESTORE BILL ERROR:", err);
    return NextResponse.json(
      { error: "Failed to restore bill" },
      { status: 500 }
    );
  }
}
