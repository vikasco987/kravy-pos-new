import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(req: Request) {
  try {
    const me = await getAuthUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (me.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // 1. Calculate Global Stats (Very fast via DB aggregation)
    const [totalSellers, totalBills, totalRevenue, featureStats] = await Promise.all([
      prisma.user.count({ where: { role: { not: "ADMIN" } } }),
      prisma.billManager.count({ where: { isDeleted: false } }),
      prisma.billManager.aggregate({ 
        where: { isDeleted: false },
        _sum: { total: true } 
      }),
      prisma.businessProfile.aggregate({
        _count: {
          upiQrEnabled: true,
          menuLinkEnabled: true,
          enableKOTWithBill: true,
          aiScraperEnabled: true
        }
      })
    ]);

    // Calculate active sellers today (simplified)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = await prisma.billManager.groupBy({
        by: ['clerkUserId'],
        where: { createdAt: { gte: today } },
        _count: true
    });

    const stats = {
      totalSellers,
      activeToday: activeToday.length,
      totalBills,
      totalRevenue: totalRevenue._sum.total || 0,
      features: {
        upi: featureStats._count.upiQrEnabled,
        qrMenu: featureStats._count.menuLinkEnabled,
        kot: featureStats._count.enableKOTWithBill,
        ai: featureStats._count.aiScraperEnabled,
      }
    };

    // 2. Fetch Sellers (Paginated)
    const sellers = await prisma.user.findMany({
      where: { role: { not: "ADMIN" } },
      include: {
        profiles: {
            select: {
                businessName: true,
                upiQrEnabled: true,
                menuLinkEnabled: true,
                taxEnabled: true,
                enableKOTWithBill: true,
                aiScraperEnabled: true,
                excelImportEnabled: true,
                slug: true,
                publicId: true
            }
        },
        _count: { select: { bills: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Enrich sellers with revenue and last bill (still doing it per seller for now, but only for 50)
    const enrichedSellers = await Promise.all(
        sellers.map(async (seller) => {
          const lastBill = await prisma.billManager.findFirst({
            where: { clerkUserId: seller.clerkId },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
          });
  
          const billStats = await prisma.billManager.aggregate({
            where: { clerkUserId: seller.clerkId },
            _sum: { total: true },
          });
  
          const profile = seller.profiles[0];
          return {
            id: seller.id,
            name: seller.name,
            email: seller.email,
            clerkId: seller.clerkId,
            createdAt: seller.createdAt,
            isDisabled: seller.isDisabled,
            businessName: profile?.businessName || "No Name",
            billCount: seller._count.bills || 0,
            totalRevenue: billStats._sum.total || 0,
            lastBillDate: lastBill?.createdAt || null,
            features: {
              upi: profile?.upiQrEnabled || false,
              qrMenu: profile?.menuLinkEnabled || false,
              tax: profile?.taxEnabled || false,
              kot: profile?.enableKOTWithBill || false,
              ai: profile?.aiScraperEnabled || false,
              excel: profile?.excelImportEnabled || false,
              slug: profile?.slug || null,
              publicId: profile?.publicId || null,
            },
          };
        })
    );

    return NextResponse.json({ 
        stats, 
        sellers: enrichedSellers,
        pagination: {
            total: totalSellers,
            page,
            limit,
            pages: Math.ceil(totalSellers / limit)
        }
    }, { status: 200 });
  } catch (error) {
    console.error("ADMIN DASHBOARD STATS ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
