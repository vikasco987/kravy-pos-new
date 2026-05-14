import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Check if user is admin (Optional but recommended)
    // const effectiveId = await getEffectiveClerkId();
    // const user = await prisma.user.findUnique({ where: { clerkId: effectiveId } });
    // if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sellers = await prisma.user.findMany({
      where: {
        OR: [
          { role: "SELLER" },
          { role: "USER" },
        ],
      },
      include: {
        profiles: true,
        _count: {
          select: { bills: { where: { isDeleted: false } } }
        },
        bills: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
          take: 1, // Only need the latest bill for status
        }
      },
    });

    // Optimization: Get all revenue in one go
    const revenueStats = await prisma.billManager.groupBy({
      by: ['userId'],
      where: { isDeleted: false },
      _sum: { total: true }
    });
    const revenueMap = Object.fromEntries(revenueStats.map(s => [s.userId, s._sum.total || 0]));

    const reportData = sellers.map((seller) => {
      const profile = seller.profiles[0];
      const businessName = profile?.businessName || seller.name || "Unknown Business";
      const totalBills = seller._count.bills;
      const totalRevenue = revenueMap[seller.clerkId] || 0;
      const lastBillDate = seller.bills.length > 0 ? seller.bills[0].createdAt : null;
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const isActive = lastBillDate && lastBillDate > sevenDaysAgo;

      return {
        clerkId: seller.clerkId,
        businessName,
        email: seller.email,
        totalBills,
        totalRevenue,
        lastBill: lastBillDate,
        status: isActive ? "ACTIVE" : "INACTIVE",
      };
    });

    // Summary Stats
    const stats = {
      totalMerchants: reportData.length,
      activeMerchants: reportData.filter((s) => s.status === "ACTIVE").length,
      inactiveMerchants: reportData.filter((s) => s.status === "INACTIVE").length,
      totalRevenue: reportData.reduce((sum, s) => sum + s.totalRevenue, 0),
      totalBills: reportData.reduce((sum, s) => sum + s.totalBills, 0),
    };

    return NextResponse.json({ sellers: reportData, stats });
  } catch (err) {
    console.error("ADMIN REPORT ERROR:", err);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}
