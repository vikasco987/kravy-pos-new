import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import { calculateDiscount } from "@/lib/discount-utils";
import { clerkClient } from "@clerk/nextjs/server";

export const runtime = "nodejs";

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
      include: {
        party: true
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

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
      customerAddress,
      tableName,
      discountCode,
      discountAmount,
      isKotPrinted,
      deliveryCharges,
      packagingCharges,
    } = body;

    // 🛑 1. ROBUST VALIDATION (Critical Fix for UI Crashes)
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "आइटम्स (Cart) खाली हैं। कृपया कम से कम एक आइटम जोड़ें।" }, { status: 400 });
    }

    if (total == null || isNaN(Number(total))) {
      return NextResponse.json({ error: "कुल राशि (Total) सही नहीं है।" }, { status: 400 });
    }

    // 🛡️ 2. PRISMA USER SYNC FALLBACK (Critical Fix for "Failed to create bill")
    // If the effectiveId (Owner or Staff) doesn't exist in our User table, 
    // Prisma will fail with a relation error. We must ensure it exists.
    const dbUser = await prisma.user.findUnique({ where: { clerkId: effectiveId } });
    if (!dbUser) {
      try {
        const client = await clerkClient();
        const fullUser = await client.users.getUser(effectiveId);
        await prisma.user.create({
          data: {
            clerkId: effectiveId,
            email: fullUser.emailAddresses[0].emailAddress,
            name: `${fullUser.firstName || ""} ${fullUser.lastName || ""}`.trim() || fullUser.username || "Staff Member",
            role: "USER",
            ownerId: (fullUser.publicMetadata?.ownerId as string) || null,
          }
        });
      } catch (syncErr) {
        console.error("USER SYNC FALLBACK ERROR:", syncErr);
      }
    }

    // ✅ HARD DEFAULTS (CRITICAL)
    const finalPaymentMode: "Cash" | "UPI" | "Card" | "Pay on Counter" | "Wallet" =
      paymentMode === "UPI" || paymentMode === "Card" || paymentMode === "Pay on Counter" || paymentMode === "Wallet"
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
        serverDiscountAmt = calculateDiscount(offer as any, finalSubtotal, items);
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

    const finalTotal = Number((finalSubtotal + calculatedTax - serverDiscountAmt + finalDeliveryCharge + serverDeliveryGst + finalPackagingCharge + serverPackagingGst).toFixed(2));

    // ✅ Generate unique sequential bill number (SV/YYMM/XXXX)
    const nowLocal = new Date();
    const yy = String(nowLocal.getFullYear()).slice(-2);
    const mm = String(nowLocal.getMonth() + 1).padStart(2, '0');
    
    const monthStart = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), 1);
    
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

    // ✅ DERIVE FINAL PAYMENT STATUS
    let finalPaymentStatus: string;
    if (isHeld === true) {
      finalPaymentStatus = "HELD";
    } else if (finalPaymentMode === "Cash" || finalPaymentMode === "Card" || finalPaymentMode === "Wallet") {
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
          update: { name: customerName },
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
        clerkUserId: effectiveId || "Unknown",
        billNumber: billNumber,
        items: items,
        subtotal: finalSubtotal,
        tax: calculatedTax,
        total: finalTotal,
        paymentMode: finalPaymentMode,
        paymentStatus: finalPaymentStatus,
        isHeld: isHeld === true,
        upiTxnRef: upiTxnRef || null,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        customerAddress: customerAddress || null,
        partyId: partyId,
        tableName: tableName || "POS",
        discountAmount: serverDiscountAmt,
        discountCode: validatedDiscountCode,
        deliveryCharges: finalDeliveryCharge,
        deliveryGst: serverDeliveryGst,
        packagingCharges: finalPackagingCharge,
        packagingGst: serverPackagingGst,
        auditNote: body.auditNote || null,
        isKotPrinted: isKotPrinted === true,
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
