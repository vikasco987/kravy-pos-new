import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ Get range from query
    const { searchParams } = new URL(req.url);
    const range = parseInt(searchParams.get("range") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - range);

    // ✅ Fetch filtered bills
    const bills = await prisma.billManager.findMany({
      where: {
        clerkUserId: userId,
        isDeleted: false,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        total: true,
        paymentMode: true,
        createdAt: true,
        items: true,
      },
    });

    const monthlyMap: any = {};
    const dailyMap: any = {};
    const paymentMap: any = { Cash: 0, UPI: 0 };
    const itemMap: any = {};

    bills.forEach((bill) => {
      const date = new Date(bill.createdAt);

      const monthLabel = new Intl.DateTimeFormat("en-IN", {
        month: "short",
        year: "numeric",
      }).format(date);

      const dayLabel = new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
      }).format(date);

      // Monthly
      if (!monthlyMap[monthLabel]) {
        monthlyMap[monthLabel] = {
          revenue: 0,
          billCount: 0,
        };
      }

      monthlyMap[monthLabel].revenue += bill.total;
      monthlyMap[monthLabel].billCount += 1;

      // Daily
      if (!dailyMap[monthLabel]) {
        dailyMap[monthLabel] = {};
      }

      if (!dailyMap[monthLabel][dayLabel]) {
        dailyMap[monthLabel][dayLabel] = 0;
      }

      dailyMap[monthLabel][dayLabel] += bill.total;

      // Payment split
      if (bill.paymentMode?.toLowerCase() === "cash") {
        paymentMap.Cash += bill.total;
      }

      if (bill.paymentMode?.toLowerCase() === "upi") {
        paymentMap.UPI += bill.total;
      }

      // Top items
      const items = bill.items as any[];

      items?.forEach((item) => {
        if (!itemMap[item.name]) {
          itemMap[item.name] = 0;
        }
        itemMap[item.name] += item.qty;
      });
    });

    const monthlyRevenue = Object.entries(monthlyMap).map(
      ([month, value]: any) => ({
        month,
        ...value,
      })
    );

    // ✅ Month-over-month growth
    let growth = 0;

    if (monthlyRevenue.length >= 2) {
      const last =
        monthlyRevenue[monthlyRevenue.length - 1].revenue;

      const prev =
        monthlyRevenue[monthlyRevenue.length - 2].revenue;

      if (prev > 0) {
        growth = ((last - prev) / prev) * 100;
      }
    }

    const topItems = Object.entries(itemMap)
      .map(([name, qty]) => ({
        name,
        qty,
      }))
      .sort((a: any, b: any) => b.qty - a.qty)
      .slice(0, 5);

    return NextResponse.json({
      monthlyRevenue,
      dailyRevenue: dailyMap,
      paymentSplit: paymentMap,
      topItems,
      growth,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);

    // Recent Bills (latest 5)
const recentBillsRaw = await prisma.billManager.findMany({
  where: {
    clerkUserId: userId,
    isDeleted: false,
  },
  orderBy: {
    createdAt: "desc",
  },
  take: 5,
  select: {
    billNumber: true,
    customerName: true,
    paymentMode: true,
    total: true,
    createdAt: true,
  },
});

const recentBills = recentBillsRaw.map((bill) => ({
  ...bill,
  createdAt: new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(bill.createdAt)),
}));

    return NextResponse.json({
    monthlyRevenue,
    dailyRevenue: dailyMap,
    paymentSplit: paymentMap,
    topItems,
    growth,
    recentBills,
    });
  }
}