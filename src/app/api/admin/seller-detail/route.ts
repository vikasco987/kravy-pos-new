import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const me = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });

    if (!me || me.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("sellerId");

    if (!targetUserId) {
      return NextResponse.json({ error: "Seller ID required" }, { status: 400 });
    }

    // Fetch detailed activity for 1 specific seller
    const [seller, bills, profile] = await Promise.all([
      prisma.user.findUnique({
        where: { clerkId: targetUserId },
        select: { name: true, email: true, createdAt: true }
      }),
      prisma.billManager.findMany({
        where: { clerkUserId: targetUserId },
        orderBy: { createdAt: "desc" },
        take: 50 // Last 50 bills for trends
      }),
      prisma.businessProfile.findUnique({
        where: { userId: targetUserId }
      })
    ]);

    if (!seller) return NextResponse.json({ error: "Seller not found" }, { status: 404 });

    // Calculate trends
    const last7DaysBills = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const count = bills.filter(b => b.createdAt >= dayStart && b.createdAt <= dayEnd).length;
      return { date: dayStart.toLocaleDateString('en-IN', { weekday: 'short' }), count };
    }).reverse();

    const paymentModes = bills.reduce((acc: any, b) => {
      acc[b.paymentMode] = (acc[b.paymentMode] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      seller,
      profile,
      stats: {
        totalBills: bills.length,
        totalRevenue: bills.reduce((sum, b) => sum + (b.total || 0), 0),
        avgTicketSize: bills.length > 0 ? bills.reduce((sum, b) => sum + (b.total || 0), 0) / bills.length : 0,
        last7Days: last7DaysBills,
        paymentDistribution: Object.entries(paymentModes).map(([name, value]) => ({ name, value })),
        recentBills: bills.slice(0, 5).map(b => ({
          id: b.id,
          total: b.total,
          paymentMode: b.paymentMode,
          createdAt: b.createdAt
        }))
      }
    });

  } catch (error) {
    console.error("ADMIN SELLER DETAIL ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
