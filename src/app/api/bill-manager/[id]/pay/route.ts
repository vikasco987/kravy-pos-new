import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    const bill = await prisma.billManager.findFirst({
      where: { id, clerkUserId: effectiveId }
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    if (bill.paymentStatus === "PAID" || bill.paymentStatus === "Paid") {
      return NextResponse.json({ error: "Bill is already paid" }, { status: 400 });
    }

    const dueAmount = bill.balanceDue || (bill.total - (bill.amountPaid || 0));

    // Update the bill
    await prisma.billManager.update({
      where: { id },
      data: {
        paymentStatus: "PAID",
        amountPaid: bill.total,
        balanceDue: 0,
        paymentMode: bill.paymentMode.includes("Wallet") ? "Wallet (Auto) + Cash" : bill.paymentMode,
      }
    });

    // If it was tied to a party, credit the wallet back the due amount
    // because previously it was debited from the wallet as "Udhar" (Unpaid balance)
    if (bill.partyId && dueAmount > 0) {
      await prisma.party.update({
        where: { id: bill.partyId },
        data: { walletBalance: { increment: dueAmount } }
      });
      
      await prisma.walletTransaction.create({
         data: {
             partyId: bill.partyId,
             clerkId: effectiveId,
             type: "CREDIT",
             amount: dueAmount,
             description: `Cleared Udhar for Bill ${bill.billNumber} (Paid via History)`
         }
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("BILL PAY ERROR:", err);
    return NextResponse.json({ error: "Failed to pay bill" }, { status: 500 });
  }
}
