import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, partyId, amount, description } = body;

    if (!partyId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const party = await prisma.party.findUnique({
      where: { id: partyId },
    });

    if (!party) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    if (party.createdBy !== effectiveId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "deposit") {
      // 1. Update Party Balance
      const updatedParty = await prisma.party.update({
        where: { id: partyId },
        data: {
          walletBalance: { increment: amount },
        },
      });

      // 2. Clear Transaction History Entry
      await prisma.walletTransaction.create({
        data: {
          partyId,
          clerkId: effectiveId,
          type: "CREDIT",
          amount,
          description: description || "Money Deposited",
        },
      });

      return NextResponse.json({ success: true, balance: updatedParty.walletBalance });
    } 
    
    if (action === "payment") {
      if (party.walletBalance < amount) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }

      // 1. Deduct Balance
      const updatedParty = await prisma.party.update({
        where: { id: partyId },
        data: {
          walletBalance: { decrement: amount },
        },
      });

      // 2. Transaction Entry
      await prisma.walletTransaction.create({
        data: {
          partyId,
          clerkId: effectiveId,
          type: "DEBIT",
          amount,
          description: description || "Paid for Order",
        },
      });

      return NextResponse.json({ success: true, balance: updatedParty.walletBalance });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Wallet API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
