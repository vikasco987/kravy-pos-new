import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request, { params }: any) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restoreId = params.id;

    // 1️⃣ Fetch deleted bill snapshot
    const entry = await prisma.deleteHistory.findUnique({
      where: { id: restoreId },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const snap: any = entry.snapshot;

    // 2️⃣ Restore the main bill using upsert to avoid unique constraint errors
    await prisma.bill.upsert({
      where: { id: snap.id },
      update: {
        userId: snap.userId,
        clerkUserId: snap.clerkUserId ?? null,
        customerId: snap.customerId ?? null,
        total: snap.total ?? 0,
        discount: snap.discount ?? null,
        gst: snap.gst ?? null,
        grandTotal: snap.grandTotal ?? null,
        paymentStatus: snap.paymentStatus ?? "PENDING",
        paymentMode: snap.paymentMode ?? null,
        notes: snap.notes ?? null,
        dueDate: snap.dueDate ? new Date(snap.dueDate) : null,

        holdBy: snap.holdBy ?? null,
        holdAt: snap.holdAt ? new Date(snap.holdAt) : null,
        resumedAt: snap.resumedAt ? new Date(snap.resumedAt) : null,
        isHeld: snap.isHeld ?? false,

        companyName: snap.companyName ?? null,
        companyAddress: snap.companyAddress ?? null,
        companyPhone: snap.companyPhone ?? null,
        contactPerson: snap.contactPerson ?? null,
        logoUrl: snap.logoUrl ?? null,
        signatureUrl: snap.signatureUrl ?? null,
        websiteUrl: snap.websiteUrl ?? null,
      },
      create: {
        id: snap.id,
        userId: snap.userId,
        clerkUserId: snap.clerkUserId ?? null,
        customerId: snap.customerId ?? null,
        total: snap.total ?? 0,
        discount: snap.discount ?? null,
        gst: snap.gst ?? null,
        grandTotal: snap.grandTotal ?? null,
        paymentStatus: snap.paymentStatus ?? "PENDING",
        paymentMode: snap.paymentMode ?? null,
        notes: snap.notes ?? null,
        dueDate: snap.dueDate ? new Date(snap.dueDate) : null,

        holdBy: snap.holdBy ?? null,
        holdAt: snap.holdAt ? new Date(snap.holdAt) : null,
        resumedAt: snap.resumedAt ? new Date(snap.resumedAt) : null,
        isHeld: snap.isHeld ?? false,

        companyName: snap.companyName ?? null,
        companyAddress: snap.companyAddress ?? null,
        companyPhone: snap.companyPhone ?? null,
        contactPerson: snap.contactPerson ?? null,
        logoUrl: snap.logoUrl ?? null,
        signatureUrl: snap.signatureUrl ?? null,
        websiteUrl: snap.websiteUrl ?? null,
      },
    });

    // 3️⃣ Restore bill products
    if (snap.products?.length) {
      for (const p of snap.products) {
        await prisma.billProduct.upsert({
          where: { id: p.id },
          update: {
            billId: p.billId,
            productId: p.productId,
            productName: p.productName,
            quantity: p.quantity,
            price: p.price,
            discount: p.discount,
            gst: p.gst,
            total: p.total,
          },
          create: {
            id: p.id,
            billId: p.billId,
            productId: p.productId,
            productName: p.productName,
            quantity: p.quantity,
            price: p.price,
            discount: p.discount,
            gst: p.gst,
            total: p.total,
          },
        });
      }
    }

    // 4️⃣ Restore payments
    if (snap.payments?.length) {
      for (const pay of snap.payments) {
        await prisma.payment.upsert({
          where: { id: pay.id },
          update: {
            billId: pay.billId,
            amount: pay.amount,
            mode: pay.mode,
            paidAt: new Date(pay.paidAt),
          },
          create: {
            id: pay.id,
            billId: pay.billId,
            amount: pay.amount,
            mode: pay.mode,
            paidAt: new Date(pay.paidAt),
          },
        });
      }
    }

    // 5️⃣ Delete restore entry from deleteHistory
    await prisma.deleteHistory.delete({
      where: { id: restoreId },
    });

    return NextResponse.json({
      success: true,
      message: "Bill restored successfully",
    });
  } catch (err) {
    console.error("RESTORE ERROR →", err);
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}
