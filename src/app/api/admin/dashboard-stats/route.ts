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
    const [totalSellers, totalBills, totalRevenue, upiCount, qrCount, kotCount, aiCount] = await Promise.all([
      prisma.user.count({ where: { role: { not: "ADMIN" } } }),
      prisma.billManager.count({ where: { isDeleted: false } }),
      prisma.billManager.aggregate({ 
        where: { isDeleted: false },
        _sum: { total: true } 
      }),
      prisma.businessProfile.count({ where: { upiQrEnabled: true } }),
      prisma.businessProfile.count({ where: { menuLinkEnabled: true } }),
      prisma.businessProfile.count({ where: { enableKOTWithBill: true } }),
      prisma.businessProfile.count({ where: { aiScraperEnabled: true } }),
    ]);

    // Calculate active sellers today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeTodayGroups = await prisma.billManager.groupBy({
        by: ['clerkUserId'],
        where: { 
            createdAt: { gte: today },
            isDeleted: false
        },
        _count: {
            clerkUserId: true
        }
    });

    const stats = {
      totalSellers,
      activeToday: activeTodayGroups.length,
      totalBills,
      totalRevenue: totalRevenue._sum.total || 0,
      features: {
        upi: upiCount,
        qrMenu: qrCount,
        kot: kotCount,
        ai: aiCount,
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
                excelImportEnabled: true
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
          const [lastBill, billStats] = await Promise.all([
            prisma.billManager.findFirst({
              where: { clerkUserId: seller.clerkId, isDeleted: false },
              orderBy: { createdAt: "desc" },
              select: { createdAt: true },
            }),
            prisma.billManager.aggregate({
              where: { clerkUserId: seller.clerkId, isDeleted: false },
              _sum: { total: true },
              _count: true
            })
          ]);
  
          const profile = seller.profiles[0];
          return {
            id: seller.id,
            name: seller.name,
            email: seller.email,
            clerkId: seller.clerkId,
            createdAt: seller.createdAt,
            isDisabled: seller.isDisabled,
            businessName: profile?.businessName || "No Name",
            billCount: billStats._count || 0,
            totalRevenue: billStats._sum.total || 0,
            lastBillDate: lastBill?.createdAt || null,
            features: {
              upi: profile?.upiQrEnabled || false,
              qrMenu: profile?.menuLinkEnabled || false,
              tax: profile?.taxEnabled || false,
              kot: profile?.enableKOTWithBill || false,
              ai: profile?.aiScraperEnabled || false,
              excel: profile?.excelImportEnabled || false,
              slug: (profile as any)?.slug || null,
              publicId: (profile as any)?.publicId || null,
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
