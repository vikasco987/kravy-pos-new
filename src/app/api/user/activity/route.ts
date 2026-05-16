import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET(req: Request) {
    try {
        const auth = await getAuthUser();
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const clerkId = auth.businessId; // The Owner ID for data fetching
        const individualId = auth.id; // The specific person's ID (for future granular tracking)

        const url = new URL(req.url);
        const targetClerkId = url.searchParams.get("clerkId") || clerkId;
        const year = parseInt(url.searchParams.get("year") || new Date().getFullYear().toString());

        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        // Fetch bills for activity
        const bills = await prisma.billManager.findMany({
            where: {
                clerkUserId: targetClerkId,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                },
                isDeleted: false
            },
            select: {
                createdAt: true
            }
        });

        // Group by date YYYY-MM-DD
        const activityMap: Record<string, number> = {};
        bills.forEach(bill => {
            const dateStr = bill.createdAt.toISOString().split('T')[0];
            activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
        });

        return NextResponse.json({ 
            year,
            totalBills: bills.length,
            activity: activityMap 
        });

    } catch (error) {
        console.error("Activity API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
