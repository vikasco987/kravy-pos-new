import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

/**
 * GET → List bills
 */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bills = await prisma.billManager.findMany({
      where: {
        clerkUserId,
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bills });
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
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
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
  finalPaymentStatus =
    paymentStatus === "Paid" ? "Paid" : "Pending";
}



    const bill = await prisma.billManager.create({
  data: {
    clerkUserId,
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
