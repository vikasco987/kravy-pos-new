import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Use $queryRaw to skip rows where createdAt IS NULL (bad legacy data)
    // which causes Prisma P2032 type-conversion crash on findMany
    const rawSellers = await prisma.$queryRaw<
      {
        id: string;
        clerkId: string;
        name: string | null;
        email: string | null;
        role: string;
        createdAt: Date | null;
      }[]
    >`
      SELECT id, "clerkId", name, email, role, "createdAt"
      FROM "User"
      WHERE (role = 'SELLER' OR role = 'USER')
        AND "createdAt" IS NOT NULL
    `;

    if (!rawSellers || rawSellers.length === 0) {
      return NextResponse.json({
        sellers: [],
        stats: {
          totalMerchants: 0,
          activeMerchants: 0,
          inactiveMerchants: 0,
          totalRevenue: 0,
          totalBills: 0,
        },
      });
    }

    const clerkIds = rawSellers.map((s) => s.clerkId);

    // Fetch business profiles for these users
    const profiles = await prisma.businessProfile.findMany({
      where: { clerkUserId: { in: clerkIds } },
      select: { clerkUserId: true, businessName: true },
    });
    const profileMap = Object.fromEntries(
      profiles.map((p) => [p.clerkUserId, p.businessName])
    );

    // Fetch bill counts per user
    const billCounts = await prisma.billManager.groupBy({
      by: ["clerkUserId"],
      where: { isDeleted: false, clerkUserId: { in: clerkIds } },
      _count: { id: true },
    });
    const billCountMap = Object.fromEntries(
      billCounts.map((b) => [b.clerkUserId, b._count.id])
    );

    // Fetch total revenue per user
    const revenueStats = await prisma.billManager.groupBy({
      by: ["clerkUserId"],
      where: { isDeleted: false, clerkUserId: { in: clerkIds } },
      _sum: { total: true },
    });
    const revenueMap = Object.fromEntries(
      revenueStats.map((s) => [s.clerkUserId, s._sum.total || 0])
    );

    // Fetch latest bill date per user
    const latestBills = await prisma.billManager.findMany({
      where: { isDeleted: false, clerkUserId: { in: clerkIds } },
      orderBy: { createdAt: "desc" },
      select: { clerkUserId: true, createdAt: true },
      distinct: ["clerkUserId"],
    });
    const lastBillMap = Object.fromEntries(
      latestBills.map((b) => [b.clerkUserId, b.createdAt])
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const reportData = rawSellers.map((seller) => {
      const businessName =
        profileMap[seller.clerkId] || seller.name || "Unknown Business";
      const totalBills = billCountMap[seller.clerkId] || 0;
      const totalRevenue = revenueMap[seller.clerkId] || 0;
      const lastBillDate = lastBillMap[seller.clerkId] || null;
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
