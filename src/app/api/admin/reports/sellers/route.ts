import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  console.log("🏁 [API reports/sellers] GET request initiated");
  try {
    // 1. Fetch Users
    console.log("🕵️ [API reports/sellers] Querying prisma.user.findMany...");
    const rawSellers = await prisma.user.findMany({
      where: {
        OR: [
          { role: "SELLER" },
          { role: "USER" },
        ],
        createdAt: {
          gt: new Date(0),
        },
      },
      select: {
        id: true,
        clerkId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
    console.log(`✅ [API reports/sellers] Loaded ${rawSellers.length} raw sellers from DB.`);

    if (!rawSellers || rawSellers.length === 0) {
      console.log("⚠️ [API reports/sellers] No sellers found in DB.");
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

    const clerkIds = rawSellers
      .map((s) => s.clerkId)
      .filter((id): id is string => id !== null);
    console.log(`ℹ️ [API reports/sellers] Extracted ${clerkIds.length} valid non-null clerkIds.`);

    // 2. Fetch Business Profiles
    console.log("🕵️ [API reports/sellers] Querying prisma.businessProfile.findMany...");
    const profiles = await prisma.businessProfile.findMany({
      where: { userId: { in: clerkIds } },
      select: { userId: true, businessName: true },
    });
    console.log(`✅ [API reports/sellers] Loaded ${profiles.length} business profiles.`);
    const profileMap = Object.fromEntries(
      profiles.map((p) => [p.userId, p.businessName])
    );

    // 3. Fetch Bill Counts
    console.log("🕵️ [API reports/sellers] Querying prisma.billManager.groupBy for bill counts...");
    const billCounts = await prisma.billManager.groupBy({
      by: ["clerkUserId"],
      where: { isDeleted: false, clerkUserId: { in: clerkIds } },
      _count: { id: true },
    });
    console.log(`✅ [API reports/sellers] Loaded ${billCounts.length} bill counts.`);
    const billCountMap = Object.fromEntries(
      billCounts.map((b) => [b.clerkUserId, b._count.id])
    );

    // 4. Fetch Revenue
    console.log("🕵️ [API reports/sellers] Querying prisma.billManager.groupBy for revenue...");
    const revenueStats = await prisma.billManager.groupBy({
      by: ["clerkUserId"],
      where: { isDeleted: false, clerkUserId: { in: clerkIds } },
      _sum: { total: true },
    });
    console.log(`✅ [API reports/sellers] Loaded ${revenueStats.length} revenue stats.`);
    const revenueMap = Object.fromEntries(
      revenueStats.map((s) => [s.clerkUserId, s._sum.total || 0])
    );

    // 5. Fetch Latest Bills
    console.log("🕵️ [API reports/sellers] Querying prisma.billManager.findMany for latest bill dates...");
    const latestBills = await prisma.billManager.findMany({
      where: { isDeleted: false, clerkUserId: { in: clerkIds } },
      orderBy: { createdAt: "desc" },
      select: { clerkUserId: true, createdAt: true },
      distinct: ["clerkUserId"],
    });
    console.log(`✅ [API reports/sellers] Loaded ${latestBills.length} latest bills.`);
    const lastBillMap = Object.fromEntries(
      latestBills.map((b) => [b.clerkUserId, b.createdAt])
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log("🔄 [API reports/sellers] Transforming rawSellers into reportData...");
    const reportData = rawSellers.map((seller) => {
      const lookupKey = seller.clerkId || "";
      const businessName =
        (lookupKey ? profileMap[lookupKey] : null) || seller.name || "Unknown Business";
      const totalBills = lookupKey ? (billCountMap[lookupKey] || 0) : 0;
      const totalRevenue = lookupKey ? (revenueMap[lookupKey] || 0) : 0;
      const lastBillDate = lookupKey ? (lastBillMap[lookupKey] || null) : null;
      const isActive = lastBillDate && lastBillDate > sevenDaysAgo;

      return {
        clerkId: seller.clerkId || seller.id,
        businessName,
        email: seller.email || "",
        phone: seller.phone || "",
        totalBills,
        totalRevenue,
        lastBill: lastBillDate,
        status: isActive ? "ACTIVE" : "INACTIVE",
      };
    });

    console.log("📊 [API reports/sellers] Calculating stats...");
    const stats = {
      totalMerchants: reportData.length,
      activeMerchants: reportData.filter((s) => s.status === "ACTIVE").length,
      inactiveMerchants: reportData.filter((s) => s.status === "INACTIVE").length,
      totalRevenue: reportData.reduce((sum, s) => sum + s.totalRevenue, 0),
      totalBills: reportData.reduce((sum, s) => sum + s.totalBills, 0),
    };

    console.log(`🎉 [API reports/sellers] Successfully generated report for ${reportData.length} merchants.`);
    return NextResponse.json({ sellers: reportData, stats });
  } catch (err: any) {
    console.error("🚨🚨 [API reports/sellers] CRITICAL EXCEPTION OCCURRED:", err);
    return NextResponse.json(
      { error: "Failed to fetch report", details: err.message || String(err) },
      { status: 500 }
    );
  }
}
