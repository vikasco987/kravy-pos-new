import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * API to confirm payment and activate premium status from the bridge domain (kravy.in)
 * This is used because kravy.in handles the actual PhonePe payment initiation.
 */
export async function POST(req: Request) {
  try {
    const { clerkId, amount, secretKey } = await req.json();

    // Secure this endpoint with a secret key from .env
    const SYSTEM_SECRET = process.env.BRIDGE_SECRET || "kravy_bridge_secret_987";
    
    if (secretKey !== SYSTEM_SECRET) {
      return NextResponse.json({ error: "Unauthorized Bridge Request" }, { status: 401 });
    }

    if (!clerkId) {
      return NextResponse.json({ error: "Missing identifier" }, { status: 400 });
    }

    // Update the business profile to Premium
    // 'userId' in BusinessProfile is the unique field that can be either clerkId or MongoDB ID
    const updatedProfile = await prisma.businessProfile.update({
      where: { userId: clerkId },
      data: {
        isPremium: true,
        showPremiumPopup: false,
      }
    });

    // Also record the order in billing database for accounting
    await prisma.subscriptionOrder.create({
      data: {
        merchantOrderId: "BRIDGE_" + Date.now(),
        clerkUserId: clerkId,
        amount: parseFloat(amount) || 0,
        paymentStatus: "SUCCESS",
        customer: { name: updatedProfile.businessName || "Premium User" },
        items: [{ name: "Premium Subscription", price: parseFloat(amount) }]
      }
    });

    return NextResponse.json({ success: true, message: "Premium activated successfully" });

  } catch (err: any) {
    console.error("Bridge Confirmation Error:", err.message);
    return NextResponse.json({ error: "Confirmation failed", details: err.message }, { status: 500 });
  }
}
