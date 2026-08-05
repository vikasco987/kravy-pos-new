import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const groupBy = searchParams.get("groupBy") || "month"; // "year" | "month" | "week" | "day" | "bill"
    
    // Date/period filters
    const filterYear = searchParams.get("year"); // "2026"
    const filterMonth = searchParams.get("month"); // "2026-08"
    const filterWeek = searchParams.get("week"); // Start date "2026-08-03" or string
    const filterDay = searchParams.get("day"); // "2026-08-03"
    
    // Custom Date Range Filters
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    
    // Entity Filters
    const paymentMode = searchParams.get("paymentMode");
    const orderType = searchParams.get("orderType"); // "Dine In" | "Takeaway" | "Delivery"
    const customer = searchParams.get("customer"); // Name or phone search
    const status = searchParams.get("status"); // "Paid" | "Pending" | "Cancelled"
    const gstType = searchParams.get("gstType"); // "GST" | "NON-GST"
    
    // Pagination for bills
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.max(10, Math.min(100, Number(searchParams.get("pageSize") || "50")));

    // 1. Build date query boundaries
    let dateGte: Date | undefined;
    let dateLte: Date | undefined;

    // Helper to get IST boundaries
    const getISTBoundary = (dateStr: string, isEndOfDay: boolean = false) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d, isEndOfDay ? 23 : 0, isEndOfDay ? 59 : 0, isEndOfDay ? 59 : 0, isEndOfDay ? 999 : 0));
      dt.setMinutes(dt.getMinutes() - 330);
      return dt;
    };

    if (filterDay) {
      dateGte = getISTBoundary(filterDay, false);
      dateLte = getISTBoundary(filterDay, true);
    } else if (filterWeek) {
      dateGte = getISTBoundary(filterWeek, false);
      const endOfWeek = new Date(dateGte);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(endOfWeek.getHours() + 23);
      endOfWeek.setMinutes(endOfWeek.getMinutes() + 59);
      endOfWeek.setSeconds(endOfWeek.getSeconds() + 59);
      endOfWeek.setMilliseconds(999);
      dateLte = endOfWeek;
    } else if (filterMonth) {
      const [y, m] = filterMonth.split("-").map(Number);
      const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
      start.setMinutes(start.getMinutes() - 330);
      dateGte = start;
      const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
      end.setMinutes(end.getMinutes() - 330);
      dateLte = end;
    } else if (filterYear) {
      const y = Number(filterYear);
      const start = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
      start.setMinutes(start.getMinutes() - 330);
      dateGte = start;
      const end = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
      end.setMinutes(end.getMinutes() - 330);
      dateLte = end;
    } else if (startDateParam || endDateParam) {
      if (startDateParam) dateGte = getISTBoundary(startDateParam, false);
      if (endDateParam) dateLte = getISTBoundary(endDateParam, true);
    }

    // 2. Build where clause
    const whereClause: any = {
      clerkUserId: effectiveId,
      isDeleted: false,
    };

    if (dateGte || dateLte) {
      whereClause.createdAt = {};
      if (dateGte) whereClause.createdAt.gte = dateGte;
      if (dateLte) whereClause.createdAt.lte = dateLte;
    }

    // Apply Payment Mode filter
    if (paymentMode && paymentMode !== "ALL") {
      whereClause.paymentMode = { equals: paymentMode, mode: "insensitive" };
    }

    // Apply Status filter
    if (status && status !== "ALL") {
      whereClause.paymentStatus = { equals: status, mode: "insensitive" };
    }

    // Apply GST filter
    if (gstType === "GST") {
      whereClause.tax = { gt: 0 };
    } else if (gstType === "NON-GST") {
      whereClause.OR = [
        { tax: { equals: 0 } },
        { tax: null }
      ];
    }

    // Apply Order Type filter
    if (orderType && orderType !== "ALL") {
      if (orderType === "Delivery") {
        whereClause.tableName = { contains: "DELIVERY", mode: "insensitive" };
      } else if (orderType === "Takeaway") {
        whereClause.tableName = { contains: "TAKEAWAY", mode: "insensitive" };
      } else {
        // Dine-in/POS
        whereClause.tableName = {
          not: { in: ["DELIVERY", "TAKEAWAY"] }
        };
      }
    }

    // Apply Customer search filter (Name or Phone)
    if (customer && customer.trim() !== "") {
      const cleanCustomer = customer.trim();
      whereClause.OR = [
        { customerName: { contains: cleanCustomer, mode: "insensitive" } },
        { customerPhone: { contains: cleanCustomer, mode: "insensitive" } },
        { billNumber: { contains: cleanCustomer, mode: "insensitive" } }
      ];
    }

    // 3. Fetch bills matching criteria (all for metrics aggregation, paginated for listing if groupBy === "bill")
    const allBills = await prisma.billManager.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    // 4. Compute Metrics Summary
    let totalSales = 0; // Settled/Paid or non-cancelled total
    let netSales = 0; // Total subtotal for non-cancelled
    let grossSales = 0; // Overall total regardless of cancellation
    let totalBillsCount = 0;
    let cancelledBillsCount = 0;
    let cancelledBillsValue = 0;
    let highestBill = 0;
    let lowestBill = allBills.length > 0 ? Infinity : 0;
    const paymentBreakdown: Record<string, number> = { CASH: 0, UPI: 0, CARD: 0, WALLET: 0, OTHER: 0 };
    const orderTypeBreakdown: Record<string, number> = { DINEIN: 0, TAKEAWAY: 0, DELIVERY: 0 };
    const customerMap = new Set<string>();
    const returningCustomerMap = new Set<string>();
    const hourlySalesMap: Record<number, number> = {};

    allBills.forEach((b) => {
      const isCancelled = b.paymentStatus.toUpperCase() === "CANCELLED";
      grossSales += b.total;

      if (isCancelled) {
        cancelledBillsCount++;
        cancelledBillsValue += b.total;
      } else {
        totalSales += b.total;
        netSales += b.subtotal;
        totalBillsCount++;

        // Highest & Lowest
        if (b.total > highestBill) highestBill = b.total;
        if (b.total < lowestBill) lowestBill = b.total;

        // Payment mode breakdown
        const pm = b.paymentMode.toUpperCase();
        if (pm.includes("CASH")) paymentBreakdown.CASH += b.total;
        else if (pm.includes("UPI")) paymentBreakdown.UPI += b.total;
        else if (pm.includes("CARD")) paymentBreakdown.CARD += b.total;
        else if (pm.includes("WALLET")) paymentBreakdown.WALLET += b.total;
        else paymentBreakdown.OTHER += b.total;

        // Order Type breakdown
        const table = (b.tableName || "").toUpperCase();
        if (table.includes("DELIVERY")) orderTypeBreakdown.DELIVERY += b.total;
        else if (table.includes("TAKEAWAY")) orderTypeBreakdown.TAKEAWAY += b.total;
        else orderTypeBreakdown.DINEIN += b.total;

        // Unique Customers
        const customerKey = b.customerPhone?.trim() || b.customerName?.trim() || "";
        if (customerKey) {
          if (customerMap.has(customerKey)) {
            returningCustomerMap.add(customerKey);
          } else {
            customerMap.add(customerKey);
          }
        }

        // Peak Sales Hour Map
        const hr = new Date(b.createdAt).getHours();
        hourlySalesMap[hr] = (hourlySalesMap[hr] || 0) + b.total;
      }
    });

    if (lowestBill === Infinity) lowestBill = 0;
    const avgBill = totalBillsCount > 0 ? totalSales / totalBillsCount : 0;

    // Peak Hour Computation
    let peakSalesHour = -1;
    let maxHourSales = 0;
    Object.entries(hourlySalesMap).forEach(([hour, sales]) => {
      if (sales > maxHourSales) {
        maxHourSales = sales;
        peakSalesHour = Number(hour);
      }
    });

    const summary = {
      totalSales,
      netSales,
      grossSales,
      totalBills: totalBillsCount,
      cancelledBills: cancelledBillsCount,
      cancelledValue: cancelledBillsValue,
      refundAmount: 0, // Placeholder
      avgBill,
      highestBill,
      lowestBill,
      uniqueCustomers: customerMap.size,
      returningCustomers: returningCustomerMap.size,
      peakSalesHour,
      paymentBreakdown,
      orderTypeBreakdown,
    };

    // 5. Groupings based on groupBy parameter
    let responseItems: any[] = [];
    let totalItemsCount = 0;

    if (groupBy === "bill") {
      totalItemsCount = allBills.length;
      const startIndex = (page - 1) * pageSize;
      const paginatedBills = allBills.slice(startIndex, startIndex + pageSize);
      
      responseItems = paginatedBills.map((b) => ({
        id: b.id,
        billNumber: b.billNumber,
        createdAt: b.createdAt.toISOString(),
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        paymentMode: b.paymentMode,
        paymentStatus: b.paymentStatus,
        total: b.total,
        subtotal: b.subtotal,
        discountAmount: b.discountAmount || 0,
        tax: b.tax || 0,
        amountPaid: b.amountPaid,
        balanceDue: b.balanceDue,
        tableName: b.tableName || "POS",
        items: b.items,
        auditNote: b.auditNote,
      }));
    } else {
      const aggregationMap = new Map<string, { 
        label: string; 
        sales: number; 
        count: number; 
        rawKey: string;
        collected: number;
        outstanding: number;
        upiSales: number;
        cashSales: number;
        cardSales: number;
      }>();

      allBills.forEach((b) => {
        if (b.paymentStatus.toUpperCase() === "CANCELLED") return;

        const date = new Date(b.createdAt);
        let key = "";
        let label = "";

        if (groupBy === "year") {
          key = date.getFullYear().toString();
          label = key;
        } else if (groupBy === "month") {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          key = `${year}-${month}`;
          label = date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
        } else if (groupBy === "week") {
          // Get Monday starting date
          const day = date.getDay();
          const diff = date.getDate() - day + (day === 0 ? -6 : 1);
          const startOfWeek = new Date(date.setDate(diff));
          key = startOfWeek.toISOString().split("T")[0];
          label = `Week of ${startOfWeek.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`;
        } else {
          // Default to Day
          key = b.createdAt.toISOString().split("T")[0];
          label = new Date(key).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        }

        const collected = b.amountPaid || 0;
        const outstanding = b.balanceDue || 0;
        const pm = (b.paymentMode || "").toUpperCase();
        const upi = pm.includes("UPI") ? b.total : 0;
        const cash = pm.includes("CASH") ? b.total : 0;
        const card = pm.includes("CARD") ? b.total : 0;

        const existing = aggregationMap.get(key);
        if (existing) {
          existing.sales += b.total;
          existing.count += 1;
          existing.collected += collected;
          existing.outstanding += outstanding;
          existing.upiSales += upi;
          existing.cashSales += cash;
          existing.cardSales += card;
        } else {
          aggregationMap.set(key, { 
            label, 
            sales: b.total, 
            count: 1, 
            rawKey: key,
            collected,
            outstanding,
            upiSales: upi,
            cashSales: cash,
            cardSales: card
          });
        }
      });

      // Sort oldest first to calculate MoM growth chronologically
      const sortedArray = Array.from(aggregationMap.values()).sort((a, b) => a.rawKey.localeCompare(b.rawKey));
      
      const arrayWithGrowth = sortedArray.map((item, idx, arr) => {
        let growth: number | null = null;
        if (idx > 0) {
          const prev = arr[idx - 1];
          if (prev.sales > 0) {
            growth = ((item.sales - prev.sales) / prev.sales) * 100;
          }
        }
        return {
          ...item,
          growth,
        };
      });

      // Sort reverse-chronologically (latest first) to display to user
      responseItems = arrayWithGrowth.reverse();
      totalItemsCount = responseItems.length;
    }

    return NextResponse.json({
      summary,
      items: responseItems,
      pagination: {
        page,
        pageSize,
        totalItems: totalItemsCount,
        totalPages: Math.ceil(totalItemsCount / pageSize),
      },
    });
  } catch (error) {
    console.error("Sales Drilldown API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
