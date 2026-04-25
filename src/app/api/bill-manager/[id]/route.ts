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
      include: {
        party: true
      }
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
      customerAddress,
      tableName,
      discountCode,
      isKotPrinted,
      deliveryCharges,
      packagingCharges,
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

    // ✅ FETCH PROFILE FOR GLOBAL GST FALLBACK
    const profile = await prisma.businessProfile.findFirst({
      where: { userId: effectiveId },
    });
    
    const isTaxEnabled = profile?.taxEnabled ?? true;
    const globalGstRate = isTaxEnabled ? (profile?.taxRate ?? 0) : 0;
    const perProductEnabled = profile?.perProductTaxEnabled ?? false;

    // ✅ RECALCULATE EVERYTHING ON SERVER (SECURITY)
    let calcSubtotal = 0;
    let totalTax = 0;

    items.forEach((item: any) => {
      const qty = Number(item.qty || item.quantity) || 0;
      const rate = Number(item.rate || item.price) || 0;
      const itemGstRate = (perProductEnabled && item.gst !== undefined && item.gst !== null) 
        ? Number(item.gst) 
        : globalGstRate;
      const taxStatus = item.taxStatus || "Without Tax";
      
      const gross = qty * rate;

      if (taxStatus === "With Tax") {
        const base = gross / (1 + itemGstRate / 100);
        const gst = gross - base;
        calcSubtotal += base;
        totalTax += gst;
      } else {
        const gst = (gross * itemGstRate) / 100;
        calcSubtotal += gross;
        totalTax += gst;
      }
    });

    const finalSubtotal = Number(calcSubtotal.toFixed(2));
    const tax = Number(totalTax.toFixed(2));

    // 🎟️ SERVER-SIDE DISCOUNT VALIDATION
    let serverDiscountAmt = 0;
    let validatedDiscountCode = null;

    if (discountCode) {
      const offer = await prisma.offer.findFirst({
        where: { code: discountCode.toUpperCase(), isActive: true, clerkUserId: effectiveId },
      });

      if (offer) {
        const { calculateDiscount } = require("@/lib/discount-utils");
        serverDiscountAmt = calculateDiscount(offer, finalSubtotal, items);
        validatedDiscountCode = offer.code;
      }
    }

    const finalDeliveryCharge = Number(deliveryCharges) || 0;
    const finalPackagingCharge = Number(packagingCharges) || 0;

    // ✅ RECALCULATE CHARGES GST (SERVER-SIDE)
    let serverDeliveryGst = 0;
    if (finalDeliveryCharge > 0 && profile?.deliveryGstEnabled) {
      serverDeliveryGst = (finalDeliveryCharge * (profile.deliveryGstRate || 0)) / 100;
    }
    
    let serverPackagingGst = 0;
    if (finalPackagingCharge > 0 && profile?.packagingGstEnabled) {
      serverPackagingGst = (finalPackagingCharge * (profile.packagingGstRate || 0)) / 100;
    }

    const finalTotal = Number((finalSubtotal + tax - serverDiscountAmt + finalDeliveryCharge + serverDeliveryGst + finalPackagingCharge + serverPackagingGst).toFixed(2));

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
        subtotal: finalSubtotal,
        tax,
        total: finalTotal,
        paymentMode: finalPaymentMode,
        paymentStatus: finalPaymentStatus,
        isHeld: body.isHeld === true,
        upiTxnRef: finalPaymentMode === "UPI" ? upiTxnRef : null,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        customerAddress: customerAddress || null,
        partyId: partyId,
        tableName: tableName || undefined,
        discountAmount: serverDiscountAmt,
        discountCode: validatedDiscountCode,
        deliveryCharges: finalDeliveryCharge,
        deliveryGst: serverDeliveryGst,
        packagingCharges: finalPackagingCharge,
        packagingGst: serverPackagingGst,
        isKotPrinted: isKotPrinted === true,
        auditNote: body.auditNote || null,
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

    // Perform soft delete as requested by the user
    await prisma.billManager.update({
      where: { id },
      data: { 
        isDeleted: true,
        deletedAt: new Date(),
        // Store a snapshot for audit purposes if needed
        deletedSnapshot: JSON.parse(JSON.stringify(bill))
      }
    });

    return NextResponse.json({ success: true, deleted: true });
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
