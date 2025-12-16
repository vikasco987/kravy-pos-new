import { NextResponse } from "next/server";
import prisma from "@/utils/prismaClient";

export async function GET() {
  try {
    const now = new Date();

    // Start of today
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // Start of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today sales
    const today = await prisma.bill.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: {
        createdAt: { gte: startOfToday },
        paymentStatus: "Paid",
      },
    });

    // Month sales
    const month = await prisma.bill.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: {
        createdAt: { gte: startOfMonth },
        paymentStatus: "Paid",
      },
    });

    return NextResponse.json({
      today: {
        total: today._sum.total || 0,
        count: today._count.id || 0,
      },
      month: {
        total: month._sum.total || 0,
        count: month._count.id || 0,
      },
    });
  } catch (error) {
    console.error("Sales report error:", error);
    return NextResponse.json(
      { error: "Failed to load sales report" },
      { status: 500 }
    );
  }
}
