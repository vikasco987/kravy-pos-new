// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";

// export async function GET(req: Request) {
//   try {
//     const { userId } = await auth();

//     if (!userId) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     // ✅ Get range from query
//     const { searchParams } = new URL(req.url);
//     const range = parseInt(searchParams.get("range") || "30");

//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() - range);

//     // ✅ Fetch filtered bills
//     const bills = await prisma.billManager.findMany({
//       where: {
//         clerkUserId: userId,
//         isDeleted: false,
//         createdAt: {
//           gte: startDate,
//         },
//       },
//       select: {
//         total: true,
//         paymentMode: true,
//         createdAt: true,
//         items: true,
//       },
//     });

//     const monthlyMap: any = {};
//     const dailyMap: any = {};
//     const paymentMap: any = { Cash: 0, UPI: 0 };
//     const itemMap: any = {};

//     bills.forEach((bill) => {
//       const date = new Date(bill.createdAt);

//       const monthLabel = new Intl.DateTimeFormat("en-IN", {
//         month: "short",
//         year: "numeric",
//       }).format(date);

//       const dayLabel = new Intl.DateTimeFormat("en-IN", {
//         day: "2-digit",
//         month: "short",
//       }).format(date);

//       // Monthly
//       if (!monthlyMap[monthLabel]) {
//         monthlyMap[monthLabel] = {
//           revenue: 0,
//           billCount: 0,
//         };
//       }

//       monthlyMap[monthLabel].revenue += bill.total;
//       monthlyMap[monthLabel].billCount += 1;

//       // Daily
//       if (!dailyMap[monthLabel]) {
//         dailyMap[monthLabel] = {};
//       }

//       if (!dailyMap[monthLabel][dayLabel]) {
//         dailyMap[monthLabel][dayLabel] = 0;
//       }

//       dailyMap[monthLabel][dayLabel] += bill.total;

//       // Payment split
//       if (bill.paymentMode?.toLowerCase() === "cash") {
//         paymentMap.Cash += bill.total;
//       }

//       if (bill.paymentMode?.toLowerCase() === "upi") {
//         paymentMap.UPI += bill.total;
//       }

//       // Top items
//       const items = bill.items as any[];

//       items?.forEach((item) => {
//         if (!itemMap[item.name]) {
//           itemMap[item.name] = 0;
//         }
//         itemMap[item.name] += item.qty;
//       });
//     });

//     const monthlyRevenue = Object.entries(monthlyMap).map(
//       ([month, value]: any) => ({
//         month,
//         ...value,
//       })
//     );

//     // ✅ Month-over-month growth
//     let growth = 0;

//     if (monthlyRevenue.length >= 2) {
//       const last =
//         monthlyRevenue[monthlyRevenue.length - 1].revenue;

//       const prev =
//         monthlyRevenue[monthlyRevenue.length - 2].revenue;

//       if (prev > 0) {
//         growth = ((last - prev) / prev) * 100;
//       }
//     }

//     const topItems = Object.entries(itemMap)
//       .map(([name, qty]) => ({
//         name,
//         qty,
//       }))
//       .sort((a: any, b: any) => b.qty - a.qty)
//       .slice(0, 5);

//     return NextResponse.json({
//       monthlyRevenue,
//       dailyRevenue: dailyMap,
//       paymentSplit: paymentMap,
//       topItems,
//       growth,
//     });
//   } catch (error) {
//     console.error("Dashboard API Error:", error);

//     // Recent Bills (latest 5)
// const recentBillsRaw = await prisma.billManager.findMany({
//   where: {
//     clerkUserId: userId,
//     isDeleted: false,
//   },
//   orderBy: {
//     createdAt: "desc",
//   },
//   take: 5,
//   select: {
//     billNumber: true,
//     customerName: true,
//     paymentMode: true,
//     total: true,
//     createdAt: true,
//   },
// });

// const recentBills = recentBillsRaw.map((bill) => ({
//   ...bill,
//   createdAt: new Intl.DateTimeFormat("en-IN", {
//     day: "2-digit",
//     month: "short",
//     hour: "2-digit",
//     minute: "2-digit",
//   }).format(new Date(bill.createdAt)),
// }));

//     return NextResponse.json({
//     monthlyRevenue,
//     dailyRevenue: dailyMap,
//     paymentSplit: paymentMap,
//     topItems,
//     growth,
//     recentBills,
//     });
//   }
// }



import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clerkUserId = searchParams.get("clerkUserId");
    const range = Number(searchParams.get("range") || 30);

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "clerkUserId required" },
        { status: 400 }
      );
    }

    // Date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - range);

    const bills = await prisma.billManager.findMany({
      where: {
        clerkUserId,
        isDeleted: false,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    //////////////////////////////////////////////////////
    // TOTAL REVENUE
    //////////////////////////////////////////////////////
    const totalRevenue = bills.reduce(
      (sum, bill) => sum + (bill.total || 0),
      0
    );

    //////////////////////////////////////////////////////
    // TOTAL BILLS
    //////////////////////////////////////////////////////
    const totalBills = bills.length;

    //////////////////////////////////////////////////////
    // CASH / UPI (CASE INSENSITIVE FIX)
    //////////////////////////////////////////////////////
    let cash = 0;
    let upi = 0;

    bills.forEach((bill) => {
      const mode = (bill.paymentMode || "").toLowerCase();

      if (mode.includes("cash")) {
        cash += bill.total || 0;
      }

      if (mode.includes("upi")) {
        upi += bill.total || 0;
      }
    });

    //////////////////////////////////////////////////////
    // TOP SELLING ITEMS (ROBUST JSON PARSER)
    //////////////////////////////////////////////////////
    const itemMap: Record<string, number> = {};

    bills.forEach((bill) => {
      let items: any = bill.items;

      // If stored as string JSON
      if (typeof items === "string") {
        try {
          items = JSON.parse(items);
        } catch {
          items = [];
        }
      }

      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          const name = item?.name || "Unknown Item";
          const quantity = Number(item?.quantity || 0);

          if (!itemMap[name]) {
            itemMap[name] = 0;
          }

          itemMap[name] += quantity;
        });
      }
    });

    const topItems = Object.keys(itemMap)
      .map((name) => ({
        name,
        totalSold: itemMap[name],
      }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);

    //////////////////////////////////////////////////////
    // CHART DATA
    //////////////////////////////////////////////////////
    const chartMap: Record<
      string,
      { revenue: number; bills: number }
    > = {};

    bills.forEach((bill) => {
      const date = bill.createdAt.toISOString().split("T")[0];

      if (!chartMap[date]) {
        chartMap[date] = { revenue: 0, bills: 0 };
      }

      chartMap[date].revenue += bill.total || 0;
      chartMap[date].bills += 1;
    });

    const chartData = Object.keys(chartMap).map((date) => ({
      date,
      revenue: chartMap[date].revenue,
      bills: chartMap[date].bills,
    }));

    //////////////////////////////////////////////////////
    // RECENT BILLS
    //////////////////////////////////////////////////////
    const recentBills = bills.slice(0, 5).map((bill) => ({
      id: bill.id,
      customer: bill.customerName || "Walk-in Customer",
      amount: bill.total,
      date: bill.createdAt.toLocaleDateString(),
    }));

    //////////////////////////////////////////////////////
    // Deleted Bills
    //////////////////////////////////////////////////////


    const deletedBillsData = await prisma.billManager.findMany({
      where: {
        clerkUserId,
        isDeleted: true,
      },
      orderBy: { deletedAt: "desc" },
      take: 5,
    });

    const deletedBills = deletedBillsData.map((bill) => ({
      billNumber: bill.billNumber,
      customerName: bill.customerName,
      paymentMode: bill.paymentMode,
      total: bill.total,
      createdAt: bill.createdAt.toLocaleDateString(),
    }));

    //////////////////////////////////////////////////////
    // RESPONSE
    //////////////////////////////////////////////////////
    return NextResponse.json({
      totalRevenue,
      totalBills,
      cash,
      upi,
      chartData,
      recentBills,
      deletedBills,
      topItems,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}