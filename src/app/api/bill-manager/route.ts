import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import { calculateDiscount } from "@/lib/discount-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET → List bills
 */
export async function GET(req: NextRequest) {
  try {
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const isHeld = searchParams.get("isHeld");

    const whereClause: any = {
      clerkUserId: effectiveId,
      isDeleted: false,
    };

    if (isHeld === "true") {
      whereClause.isHeld = true;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        const [y, m, d] = startDate.split('-').map(Number);
        const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
        start.setMinutes(start.getMinutes() - 330); // IST 00:00:00
        whereClause.createdAt.gte = start;
      }
      if (endDate) {
        const [y, m, d] = endDate.split('-').map(Number);
        const end = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
        end.setMinutes(end.getMinutes() - 330); // IST 23:59:59
        whereClause.createdAt.lte = end;
      }
    }

    const bills = await prisma.billManager.findMany({
      where: whereClause,
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
      serviceCharge,
      kotNumbers,
      skipInventoryDeduction,
      amountPaid,
      packagingCharges,
      loyaltyPointsRedeemed,
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
    const itemIds = items
      .map((it: any) => it.id)
      .filter((id: any) => id && /^[0-9a-fA-F]{24}$/.test(id));
    
    const tFetchStart = Date.now();
    const [profile, dbItems, offer] = await Promise.all([
      body.profileId 
        ? prisma.businessProfile.findUnique({ where: { id: body.profileId } }) 
        : prisma.businessProfile.findFirst({ where: { userId: effectiveId }, orderBy: { createdAt: 'asc' } }),
      prisma.item.findMany({ where: { id: { in: itemIds }, clerkId: effectiveId } }),
      discountCode ? prisma.offer.findFirst({ where: { code: discountCode.toUpperCase(), isActive: true, clerkUserId: effectiveId } }) : Promise.resolve(null)
    ]);
    console.log(`[BILL_PERF_STEP] 0. Initial Parallel Fetch: ${Date.now() - tFetchStart}ms`);
    
    const isTaxEnabled = profile?.taxEnabled ?? true;
    const globalGstRate = isTaxEnabled ? (profile?.taxRate ?? 0) : 0;
    const perProductEnabled = profile?.perProductTaxEnabled ?? false;

    let calcSubtotal = 0;
    let totalTax = 0;

    items.forEach((item: any) => {
      const dbItem = dbItems.find(it => it.id === item.id);
      const qty = Number(item.qty || item.quantity) || 0;
      const rate = item.isCustomRate 
        ? Number(item.rate) 
        : (dbItem ? Number(dbItem.sellingPrice ?? dbItem.price) : Number(item.rate || item.price || 0));
      const itemGstRate = (perProductEnabled && item.gst !== undefined && item.gst !== null) ? Number(item.gst) : globalGstRate;
      const globalTaxInclusive = profile?.taxInclusive ?? false;
      
      let isInclusive = false;
      if (perProductEnabled && item.gst !== undefined && item.gst !== null) {
        isInclusive = (item.taxStatus || "Without Tax") === "With Tax";
      } else if (isTaxEnabled) {
        isInclusive = globalTaxInclusive;
      }

      const gross = qty * rate;

      if (isInclusive) {
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
    
    let serverDiscountAmt = 0;
    let validatedDiscountCode = null;
    let loyaltyPointsRedeemedAmt = Number(loyaltyPointsRedeemed) || 0;

    if (offer) {
      serverDiscountAmt = calculateDiscount(offer as any, finalSubtotal, items);
      validatedDiscountCode = offer.code;
    } else if (discountAmount > 0) {
      serverDiscountAmt = Number(discountAmount);
    }

    const discountRatio = finalSubtotal > 0 ? Math.max(0, 1 - ((serverDiscountAmt + loyaltyPointsRedeemedAmt) / finalSubtotal)) : 1;
    const calculatedTax = Number((totalTax * discountRatio).toFixed(2));

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

    const finalTotal = Number((finalSubtotal + calculatedTax - serverDiscountAmt - loyaltyPointsRedeemedAmt + finalDeliveryCharge + serverDeliveryGst + finalPackagingCharge + serverPackagingGst + finalServiceCharge).toFixed(2));

    // ✅ ATOMIC TRANSACTION FOR BILL CREATION, COUNTER ALLOCATION, & LEDGER
    const startTime = Date.now();
    
    const bill = await prisma.$transaction(async (tx) => {
      // 1. ATOMIC BILL COUNTER & BILL NUMBER ALLOCATION
      const t1Start = Date.now();
      let nextSerial = 1;
      if (profile?.id) {
        const updatedProfile = await tx.businessProfile.update({
          where: { id: profile.id },
          data: { billCounter: { increment: 1 } },
          select: { billCounter: true }
        });
        nextSerial = updatedProfile.billCounter;
      } else {
        const lastBill = await tx.billManager.findFirst({
          where: { clerkUserId: effectiveId, createdAt: { gte: monthStart }, OR: [{ billNumber: { startsWith: 'INV/' } }, { billNumber: { startsWith: 'SV/' } }] },
          orderBy: { createdAt: 'desc' },
          select: { billNumber: true }
        });
        if (lastBill && lastBill.billNumber) {
          const parts = lastBill.billNumber.split('/');
          const lastSerial = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(lastSerial)) nextSerial = lastSerial + 1;
        }
      }
      const serialLabel = String(nextSerial).padStart(4, '0');
      let finalBillNumber = body.billNumber || `INV/${yy}${mm}/${serialLabel}`;
      console.log(`[BILL_PERF_STEP] 1. Bill Counter Allocation: ${Date.now() - t1Start}ms`);

      if (body.orderId) {
        const tOrderStart = Date.now();
        const order = await tx.order.findUnique({ where: { id: body.orderId } });
        console.log(`[BILL_PERF_STEP] 1b. Order Lookup: ${Date.now() - tOrderStart}ms`);
      }

      // 2. ATOMIC PARTY UPSERT & LOYALTY
      const tPartyStart = Date.now();
      let partyId = null;
      let partyWalletBalance = 0;
      if (customerPhone && customerName && customerName !== "Walk-in Customer") {
        const cleanPhone = customerPhone.replace(/[\s\-\(\)\+]/g, "").slice(-10);
        const pointRatio = profile?.loyaltyPointRatio && profile.loyaltyPointRatio > 0 ? profile.loyaltyPointRatio : 0;
        const earnedPoints = pointRatio > 0 ? Math.floor(finalSubtotal / pointRatio) : 0;
        const redeemedPoints = Number(loyaltyPointsRedeemed) || 0;
        const netPointsChange = earnedPoints - redeemedPoints;

        const existingParty = await tx.party.findUnique({
          where: {
            phone_createdBy: {
              phone: cleanPhone,
              createdBy: effectiveId,
            }
          }
        });

        partyWalletBalance = existingParty?.walletBalance || 0;

        const party = await tx.party.upsert({
          where: {
            phone_createdBy: {
              phone: cleanPhone,
              createdBy: effectiveId,
            },
          },
          update: { 
            name: customerName, 
            address: customerAddress || null,
            loyaltyPoints: { increment: netPointsChange }
          },
          create: {
            name: customerName,
            phone: cleanPhone,
            createdBy: effectiveId,
            address: customerAddress || null,
            loyaltyPoints: Math.max(0, netPointsChange)
          },
        });
        partyId = party.id;
      }
      console.log(`[BILL_PERF_STEP] 2. Party Upsert & Loyalty: ${Date.now() - tPartyStart}ms`);

      // WALLET ADJUSTMENT LOGIC
      let initPaymentMode = paymentMode || "Cash";
      if (
        initPaymentMode !== "UPI" && 
        initPaymentMode !== "Card" && 
        initPaymentMode !== "Pay on Counter" && 
        initPaymentMode !== "Wallet" && 
        !initPaymentMode.startsWith("Split")
      ) {
        initPaymentMode = "Cash";
      }

      let finalAmountPaid = amountPaid !== undefined ? Number(amountPaid) : finalTotal;
      let finalBalanceDue = Math.max(0, finalTotal - finalAmountPaid);
      let walletUsed = 0;
      let calculatedPaymentMode = initPaymentMode;

      if (customerPhone && customerName && customerName !== "Walk-in Customer" && !isHeld && finalBalanceDue > 0 && partyWalletBalance > 0) {
        walletUsed = Math.min(partyWalletBalance, finalBalanceDue);
        const originalAmountPaid = finalAmountPaid;
        finalAmountPaid += walletUsed;
        finalBalanceDue -= walletUsed;
        if (originalAmountPaid > 0) {
          calculatedPaymentMode = `${calculatedPaymentMode} (₹${originalAmountPaid}) + Wallet (₹${walletUsed})`;
        } else {
          calculatedPaymentMode = `Wallet (₹${walletUsed})`;
        }
      }

      let calculatedPaymentStatus: string;
      if (isHeld === true) {
        calculatedPaymentStatus = "HELD";
      } else if (finalBalanceDue > 0 && finalBalanceDue < finalTotal) {
        calculatedPaymentStatus = "PARTIAL";
      } else if (finalBalanceDue === finalTotal && finalTotal > 0) {
        calculatedPaymentStatus = "PENDING";
      } else if (calculatedPaymentMode === "Cash" || calculatedPaymentMode === "Card" || calculatedPaymentMode === "Wallet" || calculatedPaymentMode.includes("Wallet") || calculatedPaymentMode.startsWith("Split")) {
        calculatedPaymentStatus = "PAID";
      } else {
        calculatedPaymentStatus = paymentStatus === "Paid" ? "PAID" : "PENDING";
      }

      // 3. ATOMIC TOKEN NUMBER GENERATION
      const tTokenStart = Date.now();
      let nextToken = body.tokenNumber || (kotNumbers && Array.isArray(kotNumbers) && kotNumbers.length > 0 ? kotNumbers[kotNumbers.length - 1] : null);
      if (!nextToken) {
        const today = new Date().toISOString().split('T')[0];
        const lastTokenDate = profile?.lastTokenDate ? new Date(profile.lastTokenDate).toISOString().split('T')[0] : "";
        
        if (lastTokenDate === today) {
          nextToken = (profile?.lastTokenNumber || 0) + 1;
        } else {
          nextToken = 1;
        }

        if (profile?.id) {
          await tx.businessProfile.update({
            where: { id: profile.id },
            data: {
              lastTokenNumber: nextToken,
              lastTokenDate: new Date()
            }
          });
        }
      }
      console.log(`[BILL_PERF_STEP] 3. Token Generation & Profile Update: ${Date.now() - tTokenStart}ms`);

      const processedItems = items.map((it: any) => ({
        ...it,
        kotNumber: it.kotNumber || nextToken || 1,
        addedAt: it.addedAt || nowLocal.toISOString()
      }));

      // 4. CREATE BILL RECORD
      const tCreateStart = Date.now();
      const createdBill = await tx.billManager.create({
        data: {
          clerkUserId: effectiveId || "Unknown",
          billNumber: finalBillNumber,
          items: processedItems,
          subtotal: finalSubtotal,
          tax: calculatedTax,
          total: finalTotal,
          paymentMode: calculatedPaymentMode,
          paymentStatus: calculatedPaymentStatus,
          amountPaid: finalAmountPaid,
          balanceDue: finalBalanceDue,
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
      console.log(`[BILL_PERF_STEP] 4. BillManager Record Create: ${Date.now() - tCreateStart}ms`);

      // 5. ATOMIC WALLET / LEDGER DEDUCTIONS
      const tWalletStart = Date.now();
      if (!createdBill.isHeld && partyId) {
        if (walletUsed > 0) {
          await tx.party.update({
            where: { id: partyId },
            data: { walletBalance: { decrement: walletUsed } }
          });
          await tx.walletTransaction.create({
            data: {
              partyId: partyId,
              clerkId: effectiveId || "Unknown",
              type: "DEBIT",
              amount: walletUsed,
              description: `Auto-Paid for Bill ${createdBill.billNumber} from Wallet`
            }
          });
        }

        if (finalBalanceDue > 0) {
          await tx.party.update({
            where: { id: partyId },
            data: { walletBalance: { decrement: finalBalanceDue } }
          });
          await tx.walletTransaction.create({
            data: {
              partyId: partyId,
              clerkId: effectiveId || "Unknown",
              type: "DEBIT",
              amount: finalBalanceDue,
              description: `Unpaid Balance (Udhar) for Bill ${createdBill.billNumber}`
            }
          });
        }
      }
      console.log(`[BILL_PERF_STEP] 5. Wallet Ledger Updates: ${Date.now() - tWalletStart}ms`);

      return createdBill;
    }, {
      timeout: 10000
    });

    console.log(`[BILL_MANAGER_PERF] TOTAL Transaction Time for Bill ${bill.billNumber}: ${Date.now() - startTime}ms`);

    // ✅ AUTO-DEDUCT INVENTORY IN BACKGROUND (NON-BLOCKING)
    if (!bill.isHeld && skipInventoryDeduction !== true) {
      console.log(`[BILL_MANAGER_DEBUG] Bill ${bill.billNumber} created. Triggering background inventory deduction.`);
      const tInvStart = Date.now();
      import("@/lib/inventory-utils")
        .then(({ deductInventory }) => deductInventory(bill.items as any[]))
        .then(() => {
          console.log(`[BILL_PERF_STEP] 6. Async Inventory Deduction Complete: ${Date.now() - tInvStart}ms`);
        })
        .catch((deductErr) => {
          console.error("Failed to deduct inventory from bill:", deductErr);
        });
    } else if (skipInventoryDeduction === true) {
      console.log(`[BILL_MANAGER_DEBUG] Bill ${bill.billNumber} created. Inventory deduction skipped by caller.`);
    }

    return NextResponse.json({ bill });
  } catch (err: any) {
    console.error("BILL MANAGER CREATE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to create bill: " + (err?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
