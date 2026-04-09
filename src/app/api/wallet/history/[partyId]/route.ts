import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { partyId: string } }
) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { partyId } = params;

    const transactions = await prisma.walletTransaction.findMany({
      where: {
        partyId,
        clerkId: effectiveId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Wallet History API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
