import { NextResponse } from "next/server";
import prisma from "@/utils/prismaClient";

export async function GET() {
  try {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const today = await prisma.bill.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: {
        createdAt: { gte: startOfToday },
        paymentStatus: "Paid",
      },
    });

   
