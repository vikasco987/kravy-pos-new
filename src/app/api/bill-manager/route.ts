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
} = body;

// ✅ HARD DEFAULTS (CRITICAL)
const finalPaymentMode: "Cash" | "UPI" | "Card" =
  paymentMode === "UPI" || paymentMode === "Card"
    ? paymentMode
    : "Cash";

    // ✅ ALWAYS CALCULATE TAX ON SERVER
    const GST_PERCENT = 5;

    const calculatedTax = Number(
      ((subtotal * GST_PERCENT) / 100).toFixed(2)
    );


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

    // ✅ Generate unique bill number on server
    const billNumber = `SV-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;


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
        subtotal,
        tax: calculatedTax,
        total,
        paymentMode: finalPaymentMode,     // ✅ GUARANTEED
        paymentStatus: finalPaymentStatus, // ✅ SOURCE OF TRUTH
        isHeld: isHeld === true, // ✅ THIS LINE WAS MISSING
        upiTxnRef: upiTxnRef || null,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        partyId: partyId,
        tableName: tableName || "POS",
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
