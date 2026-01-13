import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

/**
 * GET → List bills
 */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(req);

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

/**
 * POST → Create bill
 */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(req);

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
      discount,
      tax,
      total,
      paymentMode,
      paymentStatus,
      upiTxnRef,
      customerName,
      customerPhone,
    } = body;

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

        if (paymentMode === "Cash") {
          finalPaymentStatus = "Paid";
        } else {
          // UPI / Card
          finalPaymentStatus =
            paymentStatus === "Paid" ? "Paid" : "Pending";
        }

    const bill = await prisma.billManager.create({
      data: {
        clerkUserId,
        billNumber,
        items,
        subtotal,
        discount,
        tax,
        total,
        paymentMode,
        paymentStatus: finalPaymentStatus, // 🔥 FIX
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
