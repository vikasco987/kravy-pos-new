import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bills = await prisma.billManager.findMany({
      where: { clerkUserId: effectiveId },
      select: {
        createdAt: true,
        tokenNumber: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const dailyStats: Record<string, { date: string; totalTokens: number; orders: number }> = {};

    bills.forEach((bill) => {
      const date = new Date(bill.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      if (!dailyStats[date]) {
        dailyStats[date] = { date, totalTokens: 0, orders: 0 };
      }
      
      dailyStats[date].orders += 1;
      if (bill.tokenNumber && bill.tokenNumber > dailyStats[date].totalTokens) {
        dailyStats[date].totalTokens = bill.tokenNumber;
      }
    });

    return NextResponse.json(Object.values(dailyStats));
  } catch (error) {
    console.error("Token Report Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
