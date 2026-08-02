import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, getEffectiveClerkId } from "@/lib/auth-utils";

export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Master Access Validation
    const isMaster =
      authUser.type === "OWNER" ||
      authUser.type === "ADMIN" ||
      authUser.role === "MASTER" ||
      authUser.role === "OWNER" ||
      authUser.role === "ADMIN" ||
      !authUser.permissions ||
      authUser.permissions.includes("all") ||
      authUser.permissions.includes("/dashboard/reports/staff-pnl");

    if (!isMaster) {
      return NextResponse.json(
        { error: "Access Denied. Staff Profitability Report is strictly restricted to Masters & Owners." },
        { status: 403 }
      );
    }

    // 1. Fetch Staff Members
    const [legacyStaffList, userStaffList] = await Promise.all([
      prisma.staff.findMany({
        where: { businessId: effectiveId }
      }),
      prisma.user.findMany({
        where: { ownerId: effectiveId }
      })
    ]);

    // Combine staff records
    const allStaffMembers = [
      ...legacyStaffList.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        role: s.accessType || "STAFF",
        source: "STAFF"
      })),
      ...userStaffList.map(u => ({
        id: u.id,
        name: u.name || u.email.split("@")[0],
        email: u.email,
        phone: u.phone,
        role: u.role || "STAFF",
        source: "USER"
      }))
    ];

    // Add Owner as primary option too
    if (authUser.name || authUser.email) {
      allStaffMembers.unshift({
        id: effectiveId,
        name: authUser.name || "Owner / Master",
        email: authUser.email || "owner@master.com",
        phone: null,
        role: "MASTER",
        source: "OWNER"
      });
    }

    // Deduplicate by ID / email
    const uniqueStaff = Array.from(new Map(allStaffMembers.map(s => [s.id, s])).values());

    // 2. Fetch Bills / Work Orders / Tasks
    const allBills = await prisma.billManager.findMany({
      where: { clerkUserId: effectiveId, isDeleted: false },
      orderBy: { createdAt: "desc" }
    });

    // 3. Fetch Custom Staff Expenses (Salaries, Incentives, Travel, etc.)
    const staffExpenses = await prisma.staffExpense.findMany({
      where: { clerkUserId: effectiveId },
      orderBy: { date: "desc" }
    });

    // 4. Calculate Staff-wise Performance & Profitability
    const staffPerformanceMap: Record<string, any> = {};

    uniqueStaff.forEach(st => {
      staffPerformanceMap[st.id] = {
        id: st.id,
        name: st.name,
        email: st.email,
        role: st.role,
        totalTasks: 0,
        totalRevenue: 0,
        totalTaskCost: 0,
        grossProfit: 0,
        totalLoss: 0,
        staffExpensesAmount: 0,
        netProfit: 0,
        expensesList: []
      };
    });

    // Default "Unassigned / General" bucket
    staffPerformanceMap["unassigned"] = {
      id: "unassigned",
      name: "Unassigned / General POS",
      email: "-",
      role: "SYSTEM",
      totalTasks: 0,
      totalRevenue: 0,
      totalTaskCost: 0,
      grossProfit: 0,
      totalLoss: 0,
      staffExpensesAmount: 0,
      netProfit: 0,
      expensesList: []
    };

    // Attribute bills to staff
    allBills.forEach(b => {
      // Attribute by creator note / auditNote / items if available or default unassigned
      let assignedStaffId = "unassigned";

      // Check if bill has partyId / auditNote matching a staff member
      if (b.auditNote) {
        const matched = uniqueStaff.find(s => b.auditNote?.toLowerCase().includes(s.name.toLowerCase()) || b.auditNote?.includes(s.id));
        if (matched) assignedStaffId = matched.id;
      }

      if (!staffPerformanceMap[assignedStaffId]) {
        staffPerformanceMap[assignedStaffId] = {
          id: assignedStaffId,
          name: "Other Staff",
          email: "-",
          role: "STAFF",
          totalTasks: 0,
          totalRevenue: 0,
          totalTaskCost: 0,
          grossProfit: 0,
          totalLoss: 0,
          staffExpensesAmount: 0,
          netProfit: 0,
          expensesList: []
        };
      }

      const sp = staffPerformanceMap[assignedStaffId];
      sp.totalTasks += 1;
      sp.totalRevenue += b.total;

      // Estimate item cost (or delivery + discount)
      const taskCost = (b.subtotal * 0.45) + (b.deliveryCharges || 0) + (b.discountAmount || 0);
      sp.totalTaskCost += taskCost;
      const profit = b.total - taskCost;
      if (profit >= 0) {
        sp.grossProfit += profit;
      } else {
        sp.totalLoss += Math.abs(profit);
      }
    });

    // Attribute custom employee expenses (Salaries, Incentives, Travel, etc.)
    staffExpenses.forEach(exp => {
      const sid = exp.staffId || "unassigned";
      if (staffPerformanceMap[sid]) {
        staffPerformanceMap[sid].staffExpensesAmount += exp.amount;
        staffPerformanceMap[sid].expensesList.push(exp);
      }
    });

    // Calculate Net Profit = Gross Profit - Loss - Staff Expenses
    const staffReportList = Object.values(staffPerformanceMap)
      .map(sp => {
        const netProfit = sp.grossProfit - sp.totalLoss - sp.staffExpensesAmount;
        const roiMargin = sp.totalRevenue > 0 ? (netProfit / sp.totalRevenue) * 100 : 0;
        return {
          ...sp,
          netProfit,
          roiMargin,
          status: netProfit >= 0 ? "SURPLUS" : "DEFICIT"
        };
      })
      .filter(sp => sp.totalTasks > 0 || sp.staffExpensesAmount > 0 || sp.id !== "unassigned");

    // Overall Summary
    const totalBusinessRevenue = staffReportList.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalStaffExpenses = staffReportList.reduce((sum, s) => sum + s.staffExpensesAmount, 0);
    const totalNetBusinessProfit = staffReportList.reduce((sum, s) => sum + s.netProfit, 0);

    return NextResponse.json({
      success: true,
      isMaster: true,
      summary: {
        totalStaff: uniqueStaff.length,
        totalBusinessRevenue,
        totalStaffExpenses,
        totalNetBusinessProfit,
      },
      staffList: uniqueStaff,
      staffReportList,
      rawStaffExpenses: staffExpenses
    });

  } catch (error: any) {
    console.error("STAFF PNL REPORT API ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isMaster =
      authUser.type === "OWNER" ||
      authUser.type === "ADMIN" ||
      authUser.role === "MASTER" ||
      authUser.role === "OWNER" ||
      authUser.role === "ADMIN" ||
      !authUser.permissions ||
      authUser.permissions.includes("all");

    if (!isMaster) {
      return NextResponse.json({ error: "Only Masters can add staff expenses" }, { status: 403 });
    }

    const body = await req.json();
    const { staffId, staffName, category, amount, note, date } = body;

    if (!staffId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Staff Member and valid Amount are required." }, { status: 400 });
    }

    const newExpense = await prisma.staffExpense.create({
      data: {
        clerkUserId: effectiveId,
        staffId,
        staffName: staffName || "Staff Member",
        category: category || "SALARY",
        amount: parseFloat(amount),
        note: note || "",
        date: date ? new Date(date) : new Date()
      }
    });

    return NextResponse.json({ success: true, expense: newExpense });

  } catch (error: any) {
    console.error("ADD STAFF EXPENSE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const expenseId = searchParams.get("id");

    if (!expenseId) {
      return NextResponse.json({ error: "Missing expense ID" }, { status: 400 });
    }

    await prisma.staffExpense.deleteMany({
      where: { id: expenseId, clerkUserId: effectiveId }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
