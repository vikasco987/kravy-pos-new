import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Clerk auth (App Router correct)
    const session = await auth();
    const clerkUserId = session.userId;

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Params are async
    const { id: historyId } = await context.params;

    // 1️⃣ Find deleted bill snapshot
    const history = await prisma.billHistory.findUnique({
      where: { id: historyId },
    });

    if (!history || history.action !== "DELETED") {
      return NextResponse.json(
        { error: "Deleted bill not found" },
        { status: 404 }
      );
    }

    const snap = history.snapshot as any;

    // 2️⃣ Restore bill (items is Json, no products table)
    await prisma.bill.upsert({
      where: { id: snap.id },
      update: {
        clerkUserId,
        customerId: snap.customerId ?? null,
        billNumber: snap.billNumber,
        items: snap.items,
        subtotal: snap.subtotal,
        billDiscountPct: snap.billDiscountPct ?? null,
        discountAmount: snap.discountAmount ?? null,
        taxableAmount: snap.taxableAmount,
        gstPercent: snap.gstPercent ?? null,
        cgst: snap.cgst,
        sgst: snap.sgst,
        total: snap.total,
        paymentMode: snap.paymentMode,
        paymentStatus: snap.paymentStatus,
        upiTxnRef: snap.upiTxnRef ?? null,
        isHeld: snap.isHeld ?? false,
        holdBy: snap.holdBy ?? null,
        holdAt: snap.holdAt ? new Date(snap.holdAt) : null,
        resumedAt: snap.resumedAt ? new Date(snap.resumedAt) : null,
        companyName: snap.companyName ?? null,
        companyAddress: snap.companyAddress ?? null,
        companyPhone: snap.companyPhone ?? null,
        gstNumber: snap.gstNumber ?? null,
        logoUrl: snap.logoUrl ?? null,
        websiteUrl: snap.websiteUrl ?? null,
      },
      create: {
        id: snap.id,
        userId: snap.userId,
        clerkUserId,
        customerId: snap.customerId ?? null,
        billNumber: snap.billNumber,
        items: snap.items,
        subtotal: snap.subtotal,
        billDiscountPct: snap.billDiscountPct ?? null,
        discountAmount: snap.discountAmount ?? null,
        taxableAmount: snap.taxableAmount,
        gstPercent: snap.gstPercent ?? null,
        cgst: snap.cgst,
        sgst: snap.sgst,
        total: snap.total,
        paymentMode: snap.paymentMode,
        paymentStatus: snap.paymentStatus,
        upiTxnRef: snap.upiTxnRef ?? null,
        isHeld: snap.isHeld ?? false,
        holdBy: snap.holdBy ?? null,
        holdAt: snap.holdAt ? new Date(snap.holdAt) : null,
        resumedAt: snap.resumedAt ? new Date(snap.resumedAt) : null,
        companyName: snap.companyName ?? null,
        companyAddress: snap.companyAddress ?? null,
        companyPhone: snap.companyPhone ?? null,
        gstNumber: snap.gstNumber ?? null,
        logoUrl: snap.logoUrl ?? null,
        websiteUrl: snap.websiteUrl ?? null,
      },
    });

    // 3️⃣ Remove delete history entry
    await prisma.billHistory.delete({
      where: { id: historyId },
    });

    return NextResponse.json({
      success: true,
      message: "Bill restored successfully",
    });
  } catch (error) {
    console.error("RESTORE ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
