import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deletedBills = await prisma.billManager.findMany({
      where: {
        clerkUserId: effectiveId,
        isDeleted: true,
      },
      orderBy: {
        deletedAt: "desc",
      },
      select: {
        id: true,
        deletedAt: true,
        deletedSnapshot: true,
      },
    });

    const formatted = deletedBills
      .filter(b => b.deletedSnapshot)
      .map((b) => ({
        id: b.id,
        billId: b.id,
        createdAt: b.deletedAt,
        snapshot: b.deletedSnapshot,
      }));

    return NextResponse.json({ deleted: formatted });
  } catch (err) {
    console.error("DELETED BILL LIST ERROR:", err);
    return NextResponse.json(
      { error: "Failed to load deleted bills" },
      { status: 500 }
    );
  }
}
