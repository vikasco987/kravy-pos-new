import { NextRequest, NextResponse } from "next/server";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const clerkUserId = await getEffectiveClerkId();
        if (!clerkUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const startDateStr = searchParams.get("startDate");
        const endDateStr = searchParams.get("endDate");

        const where: any = { clerkUserId };

        if (startDateStr || endDateStr) {
            where.date = {};
            if (startDateStr) where.date.gte = new Date(startDateStr);
            if (endDateStr) where.date.lte = new Date(endDateStr);
        }

        const sales = await prisma.externalSales.findMany({
            where,
            orderBy: { date: "asc" }
        });

        return NextResponse.json(sales);
    } catch (err: any) {
        console.error("GET External Sales Error:", err);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
