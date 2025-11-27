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

    const entry = await prisma.deleteHistory.findUnique({
      where: { id: restoreId },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const snap: any = entry.snapshot;

    // 1️⃣ Restore the main bill
    await prisma.bill.create({
      data: {
        id: snap.id,
        userId: snap.userId,
        clerkUserId: snap.clerkUserId,
        customerId: snap.customerId,
        total: snap.total,
        discount: snap.discount,
        gst: snap.gst,
        grandTotal: snap.grandTotal,
        paymentStatus: snap.paymentStatus,
        paymentMode: snap.paymentMode,
        notes: snap.notes,
        dueDate: snap.dueDate ? new Date(snap.dueDate) : null,

        holdBy: snap.holdBy,
        holdAt: snap.holdAt ? new Date(snap.holdAt) : null,
        resumedAt: snap.resumedAt ? new Date(snap.resumedAt) : null,
        isHeld: snap.isHeld,

        companyName: snap.companyName,
        companyAddress: snap.companyAddress,
        companyPhone: snap.companyPhone,
        contactPerson: snap.contactPerson,
        logoUrl: snap.logoUrl,
        signatureUrl: snap.signatureUrl,
        websiteUrl: snap.websiteUrl,
      },
    });

    // 2️⃣ Restore bill products
    if (snap.products?.length) {
      await prisma.billProduct.createMany({
        data: snap.products.map((p: any) => ({
          id: p.id,
          billId: p.billId,
          productId: p.productId,
          productName: p.productName,
          quantity: p.quantity,
          price: p.price,
          discount: p.discount,
          gst: p.gst,
          total: p.total,
        })),
      });
    }

    // 3️⃣ Restore payments
    if (snap.payments?.length) {
      await prisma.payment.createMany({
        data: snap.payments.map((p: any) => ({
          id: p.id,
          billId: p.billId,
          amount: p.amount,
          mode: p.mode,
          paidAt: new Date(p.paidAt),
        })),
      });
    }

    // 4️⃣ Delete from DeleteHistory (cleanup)
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
