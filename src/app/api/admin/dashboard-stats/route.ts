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
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "ALL";
    const skip = (page - 1) * limit;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    // 1. Calculate Global Stats (Always platform-wide)
    const [totalSellersPlatform, totalBills, totalRevenue, upiCount, qrCount, kotCount, aiCount] = await Promise.all([
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

    // Build Search Filter
    const searchFilter: any = {
      role: { not: "ADMIN" },
      AND: []
    };

    if (search) {
      searchFilter.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { profiles: { some: { businessName: { contains: search, mode: 'insensitive' } } } },
          { profiles: { some: { contactPersonPhone: { contains: search, mode: 'insensitive' } } } }
        ]
      });
    }

    if (status === "LIVE") {
      searchFilter.AND.push({ bills: { some: { createdAt: { gte: today }, isDeleted: false } } });
    } else if (status === "STATIONARY") {
      searchFilter.AND.push({ bills: { none: { createdAt: { gte: today }, isDeleted: false } }, isDisabled: false });
    } else if (status === "ACTIVE_7D") {
      searchFilter.AND.push({ bills: { some: { createdAt: { gte: weekAgo }, isDeleted: false } } });
    } else if (status === "DISABLED") {
      searchFilter.AND.push({ isDisabled: true });
    }

    // Calculate active sellers today
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
      totalSellers: totalSellersPlatform,
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

    // 2. Fetch Sellers (Filtered & Paginated)
    const [sellers, totalFiltered] = await Promise.all([
      prisma.user.findMany({
        where: searchFilter,
        include: {
          profiles: {
              select: {
                  businessName: true,
                  contactPersonPhone: true,
                  contactPersonName: true,
                  upiQrEnabled: true,
                  menuLinkEnabled: true,
                  taxEnabled: true,
                  enableKOTWithBill: true,
                  aiScraperEnabled: true,
                  excelImportEnabled: true,
              }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: searchFilter })
    ]);

    // 3. Batch Enrich (Optimized: 1 query instead of 100)
    const sellerIds = sellers.map(s => s.clerkId);
    const batchStats = await prisma.billManager.groupBy({
        by: ['clerkUserId'],
        where: {
            clerkUserId: { in: sellerIds },
            isDeleted: false
        },
        _sum: { total: true },
        _count: { _all: true },
        _max: { createdAt: true }
    });

    const statsMap = new Map(batchStats.map(s => [s.clerkUserId, s]));

    const enrichedSellers = sellers.map((seller) => {
      const sellerStats = statsMap.get(seller.clerkId);
      const profile = seller.profiles[0];

      return {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        clerkId: seller.clerkId,
        createdAt: seller.createdAt,
        isDisabled: seller.isDisabled,
        businessName: profile?.businessName || "No Name",
        billCount: sellerStats?._count?._all || 0,
        totalRevenue: sellerStats?._sum?.total || 0,
        lastBillDate: sellerStats?._max?.createdAt || null,
        features: {
          upi: profile?.upiQrEnabled || false,
          qrMenu: profile?.menuLinkEnabled || false,
          tax: profile?.taxEnabled || false,
          kot: profile?.enableKOTWithBill || false,
          ai: profile?.aiScraperEnabled || false,
          excel: profile?.excelImportEnabled || false,
        },
      };
    });

    return NextResponse.json({ 
        stats, 
        sellers: enrichedSellers,
        pagination: {
            total: totalFiltered,
            page,
            limit,
            pages: Math.ceil(totalFiltered / limit)
        }
    }, { status: 200 });
  } catch (error) {
    console.error("ADMIN DASHBOARD STATS ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
