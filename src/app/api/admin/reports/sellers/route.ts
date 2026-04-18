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
        bills: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const reportData = sellers.map((seller) => {
      const profile = seller.profiles[0];
      const businessName = profile?.businessName || seller.name || "Unknown Business";
      const totalBills = seller.bills.length;
      const totalRevenue = seller.bills.reduce((sum, bill) => sum + (bill.total || 0), 0);
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
