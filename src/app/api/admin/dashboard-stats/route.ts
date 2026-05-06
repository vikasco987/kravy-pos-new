import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(req: Request) {
  try {
    const me = await getAuthUser();

    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (me.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all users with their profiles and bill counts
    const sellers = await prisma.user.findMany({
      where: {
        role: { not: "ADMIN" },
      },
      include: {
        profiles: true,
        _count: {
          select: { bills: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get last bill date for each seller to determine activity
    const sellersWithLastBill = await Promise.all(
      sellers.map(async (seller) => {
        const lastBill = await prisma.billManager.findFirst({
          where: { clerkUserId: seller.clerkId },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        });

        const billStats = await prisma.billManager.aggregate({
          where: { clerkUserId: seller.clerkId },
          _sum: { total: true },
          _count: true,
        });

        return {
          id: seller.id,
          name: seller.name,
          email: seller.email,
          clerkId: seller.clerkId,
          createdAt: seller.createdAt,
          isDisabled: seller.isDisabled,
          businessName: seller.profiles[0]?.businessName || "No Name",
          billCount: billStats._count || 0,
          totalRevenue: billStats._sum.total || 0,
          lastBillDate: lastBill?.createdAt || null,
          features: {
            upi: seller.profiles[0]?.upiQrEnabled || false,
            qrMenu: seller.profiles[0]?.menuLinkEnabled || false,
            tax: seller.profiles[0]?.taxEnabled || false,
            kot: seller.profiles[0]?.enableKOTWithBill || false,
            ai: seller.profiles[0]?.aiScraperEnabled || false,
            excel: seller.profiles[0]?.excelImportEnabled || false,
            slug: seller.profiles[0]?.slug || null,
            publicId: seller.profiles[0]?.publicId || null,
          },
        };
      })
    );

    // Aggregate statistics
    const stats = {
      totalSellers: sellers.length,
      activeToday: sellersWithLastBill.filter(s => {
        if (!s.lastBillDate) return false;
        const today = new Date();
        const billDate = new Date(s.lastBillDate);
        return billDate.toDateString() === today.toDateString();
      }).length,
      totalBills: sellersWithLastBill.reduce((acc, s) => acc + s.billCount, 0),
      totalRevenue: sellersWithLastBill.reduce((acc, s) => acc + (s.totalRevenue || 0), 0),
      features: {
        upi: sellersWithLastBill.filter(s => s.features.upi).length,
        qrMenu: sellersWithLastBill.filter(s => s.features.qrMenu).length,
        kot: sellersWithLastBill.filter(s => s.features.kot).length,
        ai: sellersWithLastBill.filter(s => s.features.ai).length,
      }
    };

    return NextResponse.json({ stats, sellers: sellersWithLastBill }, { status: 200 });
  } catch (error) {
    console.error("ADMIN DASHBOARD STATS ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
