import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // ---------- AUTH ----------
    const session = await auth();
    const clerkUserId = session.userId;

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ---------- BODY ----------
    const body = await req.json();
    const {
      customerId,
      products,
      billDiscountPct,
      gstPercent,
      paymentMode,
      paymentStatus,
    } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { message: "Products missing" },
        { status: 400 }
      );
    }

    // ---------- FIND USER ----------
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // ---------- FETCH ITEMS ----------
    const items = await prisma.item.findMany({
      where: {
        id: { in: products.map((p: any) => p.productId) },
      },
    });

    // ---------- BUILD BILL ITEMS (JSON) ----------
    const billItems = products.map((p: any) => {
      const item = items.find((i) => i.id === p.productId);
      if (!item) throw new Error("Products mismatch");

      return {
        id: p.productId,
        name: item.name,
        quantity: p.quantity,
        price: p.price,
        discount: p.discount ?? 0,
        gst: p.gst ?? 0,
        total: p.total,
      };
    });

    if (!billItems.length) {
      return NextResponse.json(
        { message: "No items found" },
        { status: 400 }
      );
    }

    // ---------- CALCULATIONS ----------
    const subtotal = billItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    const discountAmount =
      billDiscountPct != null ? (subtotal * billDiscountPct) / 100 : null;

    const taxableAmount =
      discountAmount != null ? subtotal - discountAmount : subtotal;

    const cgst = gstPercent ? (taxableAmount * gstPercent) / 200 : 0;
    const sgst = gstPercent ? (taxableAmount * gstPercent) / 200 : 0;

    const total = taxableAmount + cgst + sgst;

    // ---------- CREATE HELD BILL ----------
    const heldBill = await prisma.bill.create({
      data: {
        userId: user.id,
        clerkUserId,

        customerId: customerId ?? null,
        billNumber: `HOLD-${Date.now()}`,

        items: billItems,

        subtotal,
        billDiscountPct: billDiscountPct ?? null,
        discountAmount,
        taxableAmount,
        gstPercent: gstPercent ?? null,
        cgst,
        sgst,
        total,

        paymentMode: paymentMode ?? "PENDING",
        paymentStatus: paymentStatus ?? "HOLD",

        upiTxnRef: null,

        isHeld: true,
        holdBy: clerkUserId, // ✅ FIXED
        holdAt: new Date(),
      },
    });

    // ---------- LIST HELD BILLS ----------
    const heldBills = await prisma.bill.findMany({
      where: { isHeld: true, clerkUserId },
      orderBy: { holdAt: "desc" },
      include: {
        customer: true,
        payments: true,
      },
    });

    return NextResponse.json({ heldBill, heldBills }, { status: 200 });
  } catch (err: any) {
    console.error("Error holding bill:", err);
    return NextResponse.json(
      { message: "Failed to hold bill", error: err.message },
      { status: 500 }
    );
  }
}
