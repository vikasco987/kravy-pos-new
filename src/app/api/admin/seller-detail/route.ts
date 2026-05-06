import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(req: Request) {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (me.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("sellerId");
    const days = parseInt(searchParams.get("days") || "7");

    if (!targetUserId) {
      return NextResponse.json({ error: "Seller ID required" }, { status: 400 });
    }

    // Calculate the cutoff date for trends
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Fetch detailed activity for 1 specific seller
    const [seller, billsInRange, lifetimeStats, profile] = await Promise.all([
      prisma.user.findUnique({
        where: { clerkId: targetUserId },
        select: { name: true, email: true, createdAt: true }
      }),
      prisma.billManager.findMany({
        where: { 
            clerkUserId: targetUserId,
            createdAt: { gte: cutoffDate },
            isDeleted: false
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.billManager.aggregate({
        where: { clerkUserId: targetUserId, isDeleted: false },
        _sum: { total: true },
        _count: true
      }),
      prisma.businessProfile.findUnique({
        where: { userId: targetUserId }
      })
    ]);

    if (!seller) return NextResponse.json({ error: "Seller not found" }, { status: 404 });

    // Calculate trends based on requested days (IST Aware)
    const trendData = Array.from({ length: days }).map((_, i) => {
      // Get IST date by adding offset
      const now = new Date();
      const istNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      
      const targetDate = new Date(istNow);
      targetDate.setDate(targetDate.getDate() - i);
      
      const dayStart = new Date(targetDate);
      dayStart.setUTCHours(0, 0, 0, 0);
      dayStart.setTime(dayStart.getTime() - (5.5 * 60 * 60 * 1000)); // Back to UTC for DB comparison
      
      const dayEnd = new Date(dayStart);
      dayEnd.setTime(dayEnd.getTime() + (24 * 60 * 60 * 1000) - 1);
      
      const count = billsInRange.filter(b => {
          const bDate = new Date(b.createdAt);
          return bDate >= dayStart && bDate <= dayEnd;
      }).length;

      const labelDate = new Date(targetDate);
      return { 
        date: days <= 14 
          ? labelDate.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' }) 
          : labelDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }), 
        count 
      };
    }).reverse();

    const paymentModes = billsInRange.reduce((acc: any, b) => {
      acc[b.paymentMode] = (acc[b.paymentMode] || 0) + 1;
      return acc;
    }, {});

    const totalLifetimeRevenue = lifetimeStats._sum.total || 0;
    const totalLifetimeBills = lifetimeStats._count || 0;

    return NextResponse.json({
      seller,
      profile,
      stats: {
        totalBills: totalLifetimeBills,
        totalRevenue: totalLifetimeRevenue,
        avgTicketSize: totalLifetimeBills > 0 ? totalLifetimeRevenue / totalLifetimeBills : 0,
        trends: trendData,
        paymentDistribution: Object.entries(paymentModes).map(([name, value]) => ({ name, value })),
        recentBills: billsInRange.slice(0, 5).map(b => ({
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
