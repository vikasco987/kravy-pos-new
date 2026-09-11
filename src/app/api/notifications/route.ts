import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";
// Removed runtime = 'nodejs' to allow it to run on standard edge or nodejs effortlessly
// without long-living stream configurations

export async function GET(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();

        if (!effectiveId) {
            return new Response("Unauthorized", { status: 401 });
        }

        const clerkId: string = effectiveId;
        
        // Use a session start to only fetch recent orders/reviews to avoid over-fetching
        // Usually, the frontend will pass a 'since' parameter, but we can default to 24 hours
        const url = new URL(req.url);
        const sinceParam = url.searchParams.get("since");
        const sessionStart = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 24 * 60 * 60 * 1000);

        // ── New QR Orders ──────────────────────────────────────────────
        const recentOrders = await prisma.order.findMany({
            where: {
                clerkUserId: clerkId,
                createdAt: { gte: sessionStart },
                status: "PENDING", // Only QR orders start as PENDING; POS orders are PREPARING
            },
            select: {
                id: true,
                customerName: true,
                total: true,
                items: true,
                table: { select: { name: true } },
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 20, // Fetch up to 20 recent pending orders
        });

        // ── New Reviews ────────────────────────────────────────────────
        const recentReviews = await prisma.review.findMany({
            where: {
                clerkUserId: clerkId,
                createdAt: { gte: sessionStart },
            },
            select: {
                id: true,
                customerName: true,
                rating: true,
                comment: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        // Return immediately instead of holding the connection open
        return new Response(JSON.stringify({ 
            orders: recentOrders, 
            reviews: recentReviews 
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache, no-store, no-transform",
            },
        });
    } catch (err) {
        console.error("SYNC ERROR IN /api/notifications:", err);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
}
