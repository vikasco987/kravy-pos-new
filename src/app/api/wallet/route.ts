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

    console.log(`[WALLET_API] Action: ${action}, PartyId: ${partyId}, Amount: ${amount}`);

    if (!partyId || !amount || amount <= 0) {
      console.warn("[WALLET_API] Validation Failed: Missing partyId or invalid amount");
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const party = await prisma.party.findUnique({
      where: { id: partyId },
    });

    if (!party) {
      console.warn(`[WALLET_API] Customer not found for ID: ${partyId}`);
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    console.log(`[WALLET_API] Found Customer: ${party.name}, Current Balance: ${party.walletBalance}`);

    if (party.createdBy !== effectiveId) {
      console.warn(`[WALLET_API] Forbidden: ${party.createdBy} !== ${effectiveId}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "deposit") {
      const newBalance = (party.walletBalance || 0) + amount;
      console.log(`[WALLET_API] Manual Calculation: ${party.walletBalance || 0} + ${amount} = ${newBalance}`);
      
      // 1. Update Party Balance
      const updatedParty = await prisma.party.update({
        where: { id: partyId },
        data: {
          walletBalance: newBalance,
        },
      });

      console.log(`[WALLET_API] DB Update Result: Name=${updatedParty.name}, NewBalance=${updatedParty.walletBalance}`);

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
      const currentBalance = party.walletBalance || 0;
      if (currentBalance < amount) {
        console.warn(`[WALLET_API] Insufficient Balance: ${currentBalance} < ${amount}`);
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }

      const newBalance = currentBalance - amount;
      console.log(`[WALLET_API] Manual Deduction: ${currentBalance} - ${amount} = ${newBalance}`);

      // 1. Deduct Balance
      const updatedParty = await prisma.party.update({
        where: { id: partyId },
        data: {
          walletBalance: newBalance,
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
