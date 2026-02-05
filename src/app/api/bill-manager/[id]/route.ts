import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

/* ======================================================
   GET → View / Resume bill
====================================================== */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const bill = await prisma.billManager.findFirst({
      where: {
        id,
        clerkUserId: userId,
        isDeleted: false,
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const business = await prisma.businessProfile.findFirst({
      where: { userId },
    });

    return NextResponse.json({ bill, business });
  } catch (err) {
    console.error("BILL MANAGER GET ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch bill" },
      { status: 500 }
    );
  }
}

/* ======================================================
   PUT → Update existing bill (RESUME / FINAL SAVE)
====================================================== */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const {
      items,
      subtotal,
      total,
      paymentMode,
      paymentStatus,
      upiTxnRef,
      customerName,
      customerPhone,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items are required" },
        { status: 400 }
      );
    }

    /* ---------- PAYMENT MODE ---------- */
    const finalPaymentMode: "Cash" | "UPI" | "Card" =
      paymentMode === "UPI" || paymentMode === "Card"
        ? paymentMode
        : "Cash";

    /* ---------- TAX (SERVER SOURCE OF TRUTH) ---------- */
    const GST_PERCENT = 5;
    const tax = Number(((subtotal * GST_PERCENT) / 100).toFixed(2));

    /* ---------- PAYMENT STATUS ---------- */
    let finalPaymentStatus: "Paid" | "Pending";
    if (finalPaymentMode === "Cash" || finalPaymentMode === "Card") {
      finalPaymentStatus = "Paid";
    } else {
      finalPaymentStatus = paymentStatus === "Paid" ? "Paid" : "Pending";
    }

    const bill = await prisma.billManager.update({
      where: { id }, // ✅ ONLY UNIQUE FIELD
      data: {
        items,
        subtotal,
        tax,
        total,

        paymentMode: finalPaymentMode,
        paymentStatus: finalPaymentStatus,

        isHeld: false, // 🔥 RESUME → UNHOLD
        upiTxnRef: finalPaymentMode === "UPI" ? upiTxnRef : null,

        customerName: customerName || null,
        customerPhone: customerPhone || null,
      },
    });

    return NextResponse.json({ bill });
  } catch (err) {
    console.error("BILL MANAGER UPDATE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update bill" },
      { status: 500 }
    );
  }
}

/* ======================================================
   DELETE → Soft delete bill + snapshot
====================================================== */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const bill = await prisma.billManager.findFirst({
      where: {
        id,
        clerkUserId: userId,
        isDeleted: false,
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    await prisma.billManager.update({
        where: { id },
        data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedSnapshot: {
          billNumber: bill.billNumber,
          total: bill.total,
          paymentMode: bill.paymentMode,
          paymentStatus: bill.paymentStatus,
          isHeld: bill.isHeld,
          customer: {
            name: bill.customerName,
            phone: bill.customerPhone,
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE BILL ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete bill" },
      { status: 500 }
    );
  }
}
