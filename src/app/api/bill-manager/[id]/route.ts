import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

/* ======================================================
   GET → View / Resume bill OR order
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

    // 1. Try finding in BillManager
    let bill = await prisma.billManager.findFirst({
      where: {
        id,
        clerkUserId: effectiveId,
        isDeleted: false,
      },
      include: {
        party: true
      }
    });

    // 2. Try finding in Order if not found in BillManager
    if (!bill) {
      const order = await prisma.order.findFirst({
        where: {
          id,
          clerkUserId: effectiveId,
          isDeleted: false,
        },
        include: {
          table: true
        }
      });

      if (order) {
        // Map Order to Bill-like structure
        bill = {
          ...order,
          billNumber: `ORD-${order.id.slice(-4).toUpperCase()}`,
          tableName: order.table?.name || "Counter",
          items: (order.items as any[]).map(it => ({
            ...it,
            id: it.itemId || it.id,
            rate: it.rate ?? it.price ?? 0,
          })),
          auditNote: order.notes || "",
          paymentMode: order.paymentMode || "Cash",
          paymentStatus: order.status === "COMPLETED" ? "Paid" : "Pending",
          // ✅ Preserve tokens
          kotNumbers: order.kotNumbers || [],
          tokenNumber: order.tokenNumber || null,
        } as any;
      }
    }

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
   SUPPORT: Now also supports converting an Order to a Bill
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
      serviceCharge,
      kotNumbers,
      tokenNumber,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items are required" },
        { status: 400 }
      );
    }

    /* ---------- PAYMENT MODE ---------- */
    const finalPaymentMode: "Cash" | "UPI" | "Card" | "Wallet" | "Pay on Counter" =
      ["Cash", "UPI", "Card", "Wallet", "Pay on Counter"].includes(paymentMode)
        ? paymentMode
        : "Cash";

    // ✅ FETCH PROFILE
    const profile = await prisma.businessProfile.findFirst({
      where: { userId: effectiveId },
    });
    
    const isTaxEnabled = profile?.taxEnabled ?? true;
    const globalGstRate = isTaxEnabled ? (profile?.taxRate ?? 0) : 0;
    const perProductEnabled = profile?.perProductTaxEnabled ?? false;

    // ✅ FETCH DB ITEMS
    const itemIds = items.map((it: any) => it.id).filter(Boolean);
    const dbItems = await prisma.item.findMany({
      where: { 
        id: { in: itemIds },
        clerkId: effectiveId 
      }
    });

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
        calcSubtotal += base;
        totalTax += (gross - base);
      } else {
        calcSubtotal += gross;
        totalTax += (gross * itemGstRate) / 100;
      }
      item.rate = rate;
    });

    const finalSubtotal = Number(calcSubtotal.toFixed(2));
    const tax = Number(totalTax.toFixed(2));

    // DISCOUNT
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
    const finalServiceCharge = Number(serviceCharge) || 0;

    let serverDeliveryGst = (finalDeliveryCharge > 0 && profile?.deliveryGstEnabled) ? (finalDeliveryCharge * (profile.deliveryGstRate || 0)) / 100 : 0;
    let serverPackagingGst = (finalPackagingCharge > 0 && profile?.packagingGstEnabled) ? (finalPackagingCharge * (profile.packagingGstRate || 0)) / 100 : 0;

    const finalTotal = Number((finalSubtotal + tax - serverDiscountAmt + finalDeliveryCharge + serverDeliveryGst + finalPackagingCharge + serverPackagingGst + finalServiceCharge).toFixed(2));

    let finalPaymentStatus = (body.isHeld === true) ? "HELD" : (paymentStatus === "Paid" ? "Paid" : "Pending");

    // CUSTOMER
    let partyId = null;
    if (customerPhone && customerName && customerName !== "Walk-in Customer") {
      try {
        const cleanPhone = customerPhone.replace(/[\s\-\(\)\+]/g, "").slice(-10);
        const party = await prisma.party.upsert({
          where: { phone_createdBy: { phone: cleanPhone, createdBy: effectiveId } },
          update: { name: customerName },
          create: { name: customerName, phone: cleanPhone, createdBy: effectiveId },
        });
        partyId = party.id;
      } catch (err) {}
    }

    /* ---------- PROCESS UPDATE OR CONVERT ORDER ---------- */
    let bill;
    const existingBill = await prisma.billManager.findUnique({ where: { id } });

    if (existingBill) {
      // ✅ UPDATE BILL
      bill = await prisma.billManager.update({
        where: { id },
        data: {
          items, subtotal: finalSubtotal, tax, total: finalTotal,
          paymentMode: finalPaymentMode, paymentStatus: finalPaymentStatus,
          isHeld: body.isHeld === true, upiTxnRef: upiTxnRef || null,
          customerName, customerPhone, customerAddress, partyId,
          tableName, discountAmount: serverDiscountAmt, discountCode: validatedDiscountCode,
          deliveryCharges: finalDeliveryCharge, deliveryGst: serverDeliveryGst,
          packagingCharges: finalPackagingCharge, packagingGst: serverPackagingGst,
          serviceCharge: finalServiceCharge, isKotPrinted: isKotPrinted === true,
          auditNote: body.auditNote || null,
          kotNumbers: kotNumbers || existingBill.kotNumbers,
          tokenNumber: tokenNumber || existingBill.tokenNumber,
        },
      });
    } else {
      // ✅ CONVERT ORDER TO BILL
      const existingOrder = await prisma.order.findUnique({ where: { id } });
      if (!existingOrder) return NextResponse.json({ error: "Not found" }, { status: 404 });

      // Generate Bill Number
      const nowLocal = new Date();
      const yy = String(nowLocal.getFullYear()).slice(-2);
      const mm = String(nowLocal.getMonth() + 1).padStart(2, '0');
      const lastBill = await prisma.billManager.findFirst({
        where: { clerkUserId: effectiveId, createdAt: { gte: new Date(nowLocal.getFullYear(), nowLocal.getMonth(), 1) }, billNumber: { startsWith: 'SV/' } },
        orderBy: { billNumber: 'desc' },
      });
      let nextSerial = 1;
      if (lastBill) {
        const lastS = parseInt(lastBill.billNumber.split('/').pop() || "0", 10);
        if (!isNaN(lastS)) nextSerial = lastS + 1;
      }
      const billNumber = `SV/${yy}${mm}/${String(nextSerial).padStart(4, '0')}`;

      bill = await prisma.billManager.create({
        data: {
          clerkUserId: effectiveId, billNumber, items, subtotal: finalSubtotal, tax, total: finalTotal,
          paymentMode: finalPaymentMode, paymentStatus: finalPaymentStatus,
          isHeld: body.isHeld === true, upiTxnRef: upiTxnRef || null,
          customerName: customerName || existingOrder.customerName,
          customerPhone: customerPhone || existingOrder.customerPhone,
          customerAddress: customerAddress || existingOrder.customerAddress,
          partyId, tableName: tableName || "POS",
          discountAmount: serverDiscountAmt, discountCode: validatedDiscountCode,
          deliveryCharges: finalDeliveryCharge, deliveryGst: serverDeliveryGst,
          packagingCharges: finalPackagingCharge, packagingGst: serverPackagingGst,
          serviceCharge: finalServiceCharge, isKotPrinted: isKotPrinted === true,
          auditNote: body.auditNote || "Finalized from Online Order",
          kotNumbers: kotNumbers || existingOrder.kotNumbers,
          tokenNumber: tokenNumber || existingOrder.tokenNumber,
        },
      });

      await prisma.order.update({
        where: { id },
        data: { status: "COMPLETED", isBillPrinted: true }
      });
    }

    return NextResponse.json({ bill });
  } catch (err) {
    console.error("BILL MANAGER UPDATE ERROR:", err);
    return NextResponse.json({ error: "Failed to update bill" }, { status: 500 });
  }
}

/* ======================================================
   DELETE → Soft delete bill OR order
====================================================== */
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;

    const bill = await prisma.billManager.findFirst({ where: { id, clerkUserId: effectiveId } });
    if (bill) {
      await prisma.billManager.update({ 
        where: { id }, 
        data: { 
          isDeleted: true, 
          deletedAt: new Date(),
          deletedSnapshot: bill as any // ✅ Save full snapshot for history
        } 
      });
      return NextResponse.json({ success: true, type: "bill" });
    }

    const order = await prisma.order.findFirst({ 
      where: { id, clerkUserId: effectiveId },
      include: { table: true }
    });
    if (order) {
      await prisma.order.update({ 
        where: { id }, 
        data: { 
          isDeleted: true,
          deletedAt: new Date(),
          deletedSnapshot: order as any
        } 
      });
      return NextResponse.json({ success: true, type: "order" });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}

/* ======================================================
   PATCH → Partial update (Change Status)
====================================================== */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const body = await req.json();

    const allowedUpdates = ["paymentStatus", "paymentMode", "upiTxnRef", "isHeld"];
    const data: any = {};
    allowedUpdates.forEach(key => {
      if (body[key] !== undefined) data[key] = body[key];
    });

    if (data.isHeld === false && !data.paymentStatus) {
      data.paymentStatus = "Paid";
    }

    const bill = await prisma.billManager.update({
      where: { id },
      data,
    });
    return NextResponse.json({ bill });
  } catch (err) {
    console.error("PATCH ERROR:", err);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
