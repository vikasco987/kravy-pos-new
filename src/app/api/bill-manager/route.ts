import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

/**
 * GET → List bills
 */
export async function GET(req: NextRequest) {
  try {
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bills = await prisma.billManager.findMany({
      where: {
        clerkUserId: effectiveId,
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bills, clerkUserId: effectiveId });
  } catch (err) {
    console.error("BILL MANAGER LIST ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch bills" },
      { status: 500 }
    );
  }
}

/* POST → Create bill */

export async function POST(req: NextRequest) {
  try {
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // ❌ DO NOT destructure billNumber
    const {
      items,
      subtotal,
      total,
      paymentMode,
      paymentStatus,
      isHeld,
      upiTxnRef,
      customerName,
      customerPhone,
      tableName,
      discountCode,
      discountAmount,
    } = body;

// ✅ HARD DEFAULTS (CRITICAL)
const finalPaymentMode: "Cash" | "UPI" | "Card" =
  paymentMode === "UPI" || paymentMode === "Card"
    ? paymentMode
    : "Cash";

    // ✅ FETCH PROFILE FOR GLOBAL GST FALLBACK
    const profile = await prisma.businessProfile.findUnique({
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
    const calculatedTax = Number(totalTax.toFixed(2));
    
    // 🎟️ SERVER-SIDE DISCOUNT VALIDATION
    let serverDiscountAmt = 0;
    let validatedDiscountCode = null;

    if (discountCode) {
      const offer = await prisma.offer.findFirst({
        where: { code: discountCode.toUpperCase(), isActive: true, clerkUserId: effectiveId },
      });

      if (offer) {
        // Simple validation, you could use the full calculateDiscount logic here too
        const { calculateDiscount } = require("@/lib/discount-utils");
        serverDiscountAmt = calculateDiscount(offer, finalSubtotal, items);
        validatedDiscountCode = offer.code;
      }
    }

    const finalTotal = Number((finalSubtotal + calculatedTax - serverDiscountAmt).toFixed(2));


    // Basic validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items are required" },
        { status: 400 }
      );
    }

    if (total == null) {
      return NextResponse.json(
        { error: "Total is required" },
        { status: 400 }
      );
    }

    // ✅ Generate unique sequential bill number (SV/YYMM/XXXX)
    const nowLocal = new Date();
    const yy = String(nowLocal.getFullYear()).slice(-2);
    const mm = String(nowLocal.getMonth() + 1).padStart(2, '0');
    
    const monthStart = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), 1);
    
    // 🛡️ FIX: find the HIGHEST serial this month rather than just counting (handles deletions)
    const lastBill = await prisma.billManager.findFirst({
      where: {
        clerkUserId: effectiveId,
        createdAt: { gte: monthStart }
      },
      orderBy: { billNumber: 'desc' },
      select: { billNumber: true }
    });
    
    let nextSerial = 1;
    if (lastBill && lastBill.billNumber) {
      const parts = lastBill.billNumber.split('/');
      const lastSerial = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSerial)) {
        nextSerial = lastSerial + 1;
      }
    }
    
    const serialLabel = String(nextSerial).padStart(4, '0');
    const billNumber = `SV/${yy}${mm}/${serialLabel}`;


    // ✅ DERIVE FINAL PAYMENT STATUS (SOURCE OF TRUTH)
    let finalPaymentStatus: string;
    if (isHeld === true) {
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
        // Clean phone number (remove spaces, etc.) for better matching
        const cleanPhone = customerPhone.replace(/[\s\-\(\)\+]/g, "").slice(-10);

        // Upsert customer into the Party table
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
        console.error("Party upsert error in billing:", err);
      }
    }

    const bill = await prisma.billManager.create({
      data: {
        clerkUserId: effectiveId,
        billNumber,
        items,
        subtotal: finalSubtotal,
        tax: calculatedTax,
        total: finalTotal,
        paymentMode: finalPaymentMode,     // ✅ GUARANTEED
        paymentStatus: finalPaymentStatus, // ✅ SOURCE OF TRUTH
        isHeld: isHeld === true, // ✅ THIS LINE WAS MISSING
        upiTxnRef: upiTxnRef || null,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        partyId: partyId,
        tableName: tableName || "POS",
        discountAmount: serverDiscountAmt,
        discountCode: validatedDiscountCode,
        auditNote: body.auditNote || null,
      },
    });

    return NextResponse.json({ bill });
  } catch (err) {
    console.error("BILL MANAGER CREATE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to create bill" },
      { status: 500 }
    );
  }
}
