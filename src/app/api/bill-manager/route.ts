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
      zoneName,
      discountCode,
      discountAmount,
      isKotPrinted,
      deliveryCharges,
      packagingCharges,
      serviceCharge,
      kotNumbers,
    } = body;

    // 🛑 1. ROBUST VALIDATION (Critical Fix for UI Crashes)
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "आइटम्स (Cart) खाली हैं। कृपया कम से कम एक आइटम जोड़ें।" }, { status: 400 });
    }

    if (total == null || isNaN(Number(total))) {
      return NextResponse.json({ error: "कुल राशि (Total) सही नहीं है।" }, { status: 400 });
    }

    // ✅ CONSTANTS & DATE PREP
    const nowLocal = new Date();
    const yy = String(nowLocal.getFullYear()).slice(-2);
    const mm = String(nowLocal.getMonth() + 1).padStart(2, '0');
    const monthStart = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), 1);

    // ✅ OPTIMIZED PARALLEL DATA FETCHING
    const itemIds = items.map((it: any) => it.id).filter(Boolean);
    const [profile, dbItems, offer, lastBill] = await Promise.all([
      prisma.businessProfile.findUnique({ where: { userId: effectiveId } }),
      prisma.item.findMany({ where: { id: { in: itemIds }, clerkId: effectiveId } }),
      discountCode ? prisma.offer.findFirst({ where: { code: discountCode.toUpperCase(), isActive: true, clerkUserId: effectiveId } }) : Promise.resolve(null),
      prisma.billManager.findFirst({
        where: { clerkUserId: effectiveId, createdAt: { gte: monthStart }, billNumber: { startsWith: 'SV/' } },
        orderBy: { billNumber: 'desc' },
        select: { billNumber: true }
      })
    ]);
    
    const isTaxEnabled = profile?.taxEnabled ?? true;
    const globalGstRate = isTaxEnabled ? (profile?.taxRate ?? 0) : 0;
    const perProductEnabled = profile?.perProductTaxEnabled ?? false;

    let calcSubtotal = 0;
    let totalTax = 0;

    items.forEach((item: any) => {
      const dbItem = dbItems.find(it => it.id === item.id);
      const qty = Number(item.qty || item.quantity) || 0;
      const rate = dbItem ? Number(dbItem.sellingPrice ?? dbItem.price) : Number(item.rate || item.price || 0);
      const itemGstRate = (perProductEnabled && item.gst !== undefined && item.gst !== null) ? Number(item.gst) : globalGstRate;
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
      item.rate = rate; 
    });

    const finalSubtotal = Number(calcSubtotal.toFixed(2));
    const calculatedTax = Number(totalTax.toFixed(2));
    
    let serverDiscountAmt = 0;
    let validatedDiscountCode = null;
    if (offer) {
      serverDiscountAmt = calculateDiscount(offer as any, finalSubtotal, items);
      validatedDiscountCode = offer.code;
    }

    const finalDeliveryCharge = Number(deliveryCharges) || 0;
    const finalPackagingCharge = Number(packagingCharges) || 0;
    const finalServiceCharge = Number(serviceCharge) || 0;

    let serverDeliveryGst = 0;
    if (finalDeliveryCharge > 0 && profile?.deliveryGstEnabled) {
      serverDeliveryGst = (finalDeliveryCharge * (profile.deliveryGstRate || 0)) / 100;
    }
    let serverPackagingGst = 0;
    if (finalPackagingCharge > 0 && profile?.packagingGstEnabled) {
      serverPackagingGst = (finalPackagingCharge * (profile.packagingGstRate || 0)) / 100;
    }

    const finalTotal = Number((finalSubtotal + calculatedTax - serverDiscountAmt + finalDeliveryCharge + serverDeliveryGst + finalPackagingCharge + serverPackagingGst + finalServiceCharge).toFixed(2));

    let nextSerial = 1;
    if (lastBill && lastBill.billNumber) {
      const parts = lastBill.billNumber.split('/');
      const lastSerial = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSerial)) nextSerial = lastSerial + 1;
    }
    const serialLabel = String(nextSerial).padStart(4, '0');
    const billNumber = `SV/${yy}${mm}/${serialLabel}`;

    const finalPaymentMode: "Cash" | "UPI" | "Card" | "Pay on Counter" | "Wallet" =
      paymentMode === "UPI" || paymentMode === "Card" || paymentMode === "Pay on Counter" || paymentMode === "Wallet"
        ? paymentMode
        : "Cash";

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

    // ✅ TOKEN NUMBER GENERATION (REUSE OR INCREMENT)
    let nextToken = body.tokenNumber || (kotNumbers && Array.isArray(kotNumbers) && kotNumbers.length > 0 ? kotNumbers[kotNumbers.length - 1] : null);
    
    if (!nextToken) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const lastTokenDate = profile?.lastTokenDate ? new Date(profile.lastTokenDate).toISOString().split('T')[0] : "";
            
            if (lastTokenDate === today) {
                nextToken = (profile?.lastTokenNumber || 0) + 1;
            } else {
                nextToken = 1;
            }

            // Sync with BusinessProfile
            await prisma.businessProfile.update({
                where: { userId: effectiveId },
                data: {
                    lastTokenNumber: nextToken,
                    lastTokenDate: new Date()
                }
            });
        } catch (tokenErr) {
            console.error("TOKEN GENERATION ERROR:", tokenErr);
            nextToken = 1; // Fallback
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
        zoneName: zoneName || null,
        discountAmount: serverDiscountAmt,
        discountCode: validatedDiscountCode,
        deliveryCharges: finalDeliveryCharge,
        deliveryGst: serverDeliveryGst,
        packagingCharges: finalPackagingCharge,
        packagingGst: serverPackagingGst,
        serviceCharge: finalServiceCharge,
        auditNote: body.auditNote || null,
        isKotPrinted: isKotPrinted === true,
        tokenNumber: nextToken,
        kotNumbers: kotNumbers || [],
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
