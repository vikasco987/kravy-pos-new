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
    const { action, partyId, amount, description, transactionId, type } = body;

    console.log(`[WALLET_API] Action: ${action}, PartyId: ${partyId}, TransactionId: ${transactionId}, Amount: ${amount}`);

    if (action === "edit") {
      if (!transactionId) {
        return NextResponse.json({ error: "Missing transactionId" }, { status: 400 });
      }

      const tx = await prisma.walletTransaction.findUnique({
        where: { id: transactionId }
      });

      if (!tx) {
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      }

      const party = await prisma.party.findUnique({ where: { id: tx.partyId } });
      if (!party) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      const oldType = tx.type;
      const oldAmount = tx.amount;
      const newType = type && ["CREDIT", "DEBIT"].includes(type) ? type : oldType;
      const newAmount = amount !== undefined && !isNaN(Number(amount)) && Number(amount) >= 0 ? Number(amount) : oldAmount;
      const newDesc = description !== undefined ? description.trim() : (tx.description || "");

      // Net balance adjustment calculation
      const oldEffect = oldType === "CREDIT" ? -oldAmount : oldAmount;
      const newEffect = newType === "CREDIT" ? newAmount : -newAmount;
      const netAdjustment = oldEffect + newEffect;

      const currentBalance = party.walletBalance || 0;
      const newBalance = Math.max(0, currentBalance + netAdjustment);

      let updatedPartyBalance = currentBalance;
      if (netAdjustment !== 0) {
        const updatedParty = await prisma.party.update({
          where: { id: tx.partyId },
          data: { walletBalance: newBalance }
        });
        updatedPartyBalance = updatedParty.walletBalance;
      }

      const updatedTx = await prisma.walletTransaction.update({
        where: { id: transactionId },
        data: {
          type: newType,
          amount: newAmount,
          description: newDesc
        }
      });

      return NextResponse.json({ 
        success: true, 
        transaction: updatedTx, 
        balance: updatedPartyBalance 
      });
    }

    if (action === "delete") {
      if (!transactionId) {
        return NextResponse.json({ error: "Missing transactionId" }, { status: 400 });
      }

      const tx = await prisma.walletTransaction.findUnique({
        where: { id: transactionId }
      });

      if (!tx) {
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      }

      const party = await prisma.party.findUnique({ where: { id: tx.partyId } });
      let updatedPartyBalance = party ? party.walletBalance : null;

      if (party) {
        const adjustment = tx.type === "CREDIT" ? -tx.amount : tx.amount;
        const newBal = Math.max(0, (party.walletBalance || 0) + adjustment);
        const updatedP = await prisma.party.update({
          where: { id: tx.partyId },
          data: { walletBalance: newBal }
        });
        updatedPartyBalance = updatedP.walletBalance;
      }

      await prisma.walletTransaction.delete({
        where: { id: transactionId }
      });

      return NextResponse.json({ success: true, balance: updatedPartyBalance });
    }

    if (!partyId || amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) <= 0) {
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

    if (action === "withdraw") {
      const currentBalance = party.walletBalance || 0;
      if (currentBalance < amount) {
        console.warn(`[WALLET_API] Insufficient Balance: ${currentBalance} < ${amount}`);
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }

      const newBalance = currentBalance - amount;
      console.log(`[WALLET_API] Manual Withdrawal: ${currentBalance} - ${amount} = ${newBalance}`);

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
          description: description || "Money Withdrawn",
        },
      });

      return NextResponse.json({ success: true, balance: updatedParty.walletBalance });
    }

    if (action === "udhar") {
      const currentBalance = party.walletBalance || 0;
      const newBalance = currentBalance - amount;
      console.log(`[WALLET_API] Manual Udhar: ${currentBalance} - ${amount} = ${newBalance}`);

      const updatedParty = await prisma.party.update({
        where: { id: partyId },
        data: {
          walletBalance: newBalance,
        },
      });

      await prisma.walletTransaction.create({
        data: {
          partyId,
          clerkId: effectiveId,
          type: "DEBIT",
          amount,
          description: description || "Udhar (Credit Given)",
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
