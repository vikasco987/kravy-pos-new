import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

/* ======================================================
   GET → View / Resume bill
====================================================== */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const bill = await prisma.billManager.findFirst({
      where: {
        id,
        clerkUserId: effectiveId,
        isDeleted: false,
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const business = await prisma.businessProfile.findFirst({
      where: { userId: effectiveId },
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
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
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
    let finalPaymentStatus: string;
    if (body.isHeld === true) {
      finalPaymentStatus = "HELD";
    } else if (finalPaymentMode === "Cash" || finalPaymentMode === "Card") {
      finalPaymentStatus = "Paid";
    } else {
      finalPaymentStatus = paymentStatus === "Paid" ? "Paid" : "Pending";
    }

    // ✅ AUTO-SAVE CUSTOMER IN CRM (Party)
    let partyId = null;
    if (customerPhone && customerName && customerName !== "Walk-in Customer") {
      try {
        const cleanPhone = customerPhone.replace(/[\s\-\(\)\+]/g, "").slice(-10);
        const party = await prisma.party.upsert({
          where: {
            phone_createdBy: {
              phone: cleanPhone,
              createdBy: effectiveId,
            },
          },
          update: {
            name: customerName,
          },
          create: {
            name: customerName,
            phone: cleanPhone,
            createdBy: effectiveId,
          },
        });
        partyId = party.id;
      } catch (err) {
        console.error("Party upsert error in billing update:", err);
      }
    }

    const bill = await prisma.billManager.update({
      where: { id },
      data: {
        items,
        subtotal,
        tax,
        total,
        paymentMode: finalPaymentMode,
        paymentStatus: finalPaymentStatus,
        isHeld: body.isHeld === true,
        upiTxnRef: finalPaymentMode === "UPI" ? upiTxnRef : null,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        partyId: partyId, // ✅ Update link to party
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find the bill first to verify ownership and check if it's held
    const bill = await prisma.billManager.findFirst({
      where: {
        id,
        clerkUserId: effectiveId,
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Perform permanent delete as requested by the user
    // This also fixes the TypeError which was likely linked to the soft-delete snapshot logic
    await prisma.billManager.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedPermanently: true });
  } catch (err) {
    console.error("DELETE BILL ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete bill permanently" },
      { status: 500 }
    );
  }
}

/* ======================================================
   PATCH → Partial update (Change Status)
====================================================== */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const allowedUpdates = [
      "paymentStatus",
      "paymentMode",
      "upiTxnRef",
      "isHeld",
    ];

    const data: any = {};
    allowedUpdates.forEach((key) => {
      if (body[key] !== undefined) {
        data[key] = body[key];
      }
    });

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // If marking as not held, update status accordingly if not provided
    if (data.isHeld === false && !data.paymentStatus) {
      data.paymentStatus = "Paid";
    }

    const bill = await prisma.billManager.update({
      where: { id },
      data,
    });

    return NextResponse.json({ bill });
  } catch (err) {
    console.error("BILL MANAGER PATCH ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
