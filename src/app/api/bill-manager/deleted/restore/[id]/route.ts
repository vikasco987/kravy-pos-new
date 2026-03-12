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

    // 🔎 Find deleted bill
    const bill = await prisma.billManager.findFirst({
      where: {
        id,
        clerkUserId: effectiveId,
        isDeleted: true,
      },
    });

    if (!bill) {
      return NextResponse.json(
        { error: "Deleted bill not found" },
        { status: 404 }
      );
    }

    // ♻️ RESTORE BILL
    await prisma.billManager.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedSnapshot: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("RESTORE BILL ERROR:", err);
    return NextResponse.json(
      { error: "Failed to restore bill" },
      { status: 500 }
    );
  }
}
