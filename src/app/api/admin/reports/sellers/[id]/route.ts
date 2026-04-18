import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const seller = await prisma.user.findUnique({
      where: { clerkId: id },
      include: {
        profiles: true,
        bills: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
          take: 100, // Last 100 bills for performance
        },
      },
    });

    if (!seller) return NextResponse.json({ error: "Seller not found" }, { status: 404 });

    const totalRevenue = seller.bills.reduce((sum, b) => sum + (b.total || 0), 0);
    const profile = seller.profiles[0];

    // Calculate daily activity for a small chart/timeline
    const activityMap: Record<string, number> = {};
    seller.bills.forEach(bill => {
      const date = bill.createdAt.toISOString().split('T')[0];
      activityMap[date] = (activityMap[date] || 0) + 1;
    });

    const timeline = Object.entries(activityMap).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      seller: {
        id: seller.clerkId,
        name: seller.name,
        email: seller.email,
        businessName: profile?.businessName || seller.name,
        businessAddress: profile?.businessAddress,
        contactPhone: profile?.contactPhone,
      },
      stats: {
        totalBills: seller.bills.length,
        totalRevenue,
      },
      bills: seller.bills,
      timeline,
    });
  } catch (err) {
    console.error("ADMIN SELLER DETAIL ERROR:", err);
    return NextResponse.json({ error: "Failed to fetch details" }, { status: 500 });
  }
}
