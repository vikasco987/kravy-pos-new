import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
        return new Response("Unauthorized", { status: 401 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            // Send connection confirmation
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

            // Track what we've already sent so we don't resend on same SSE connection
            const sentOrderIds = new Set<string>();
            const sentReviewIds = new Set<string>();

            // Session start — only alert for orders created AFTER this point
            const sessionStart = new Date();

            const pollInterval = setInterval(async () => {
                try {
                    // ── New QR Orders ──────────────────────────────────────────────
                    const recentOrders = await prisma.order.findMany({
                        where: {
                            clerkUserId: clerkId,
                            createdAt: { gte: sessionStart },
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
                        take: 10,
                    });

                    const newOrders = recentOrders.filter(o => !sentOrderIds.has(o.id));

                    if (newOrders.length > 0) {
                        newOrders.forEach(o => sentOrderIds.add(o.id));
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({ type: "new_orders", orders: newOrders })}\n\n`
                            )
                        );
                    }

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
                        take: 5,
                    });

                    const newReviews = recentReviews.filter(r => !sentReviewIds.has(r.id));

                    if (newReviews.length > 0) {
                        newReviews.forEach(r => sentReviewIds.add(r.id));
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({ type: "new_reviews", reviews: newReviews })}\n\n`
                            )
                        );
                    }
                } catch (error) {
                    console.error("SSE poll error:", error);
                }
            }, 5000); // poll every 5 seconds

            // Send heartbeat every 25s to prevent proxy timeout
            const heartbeat = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(`: heartbeat\n\n`));
                } catch { clearInterval(heartbeat); }
            }, 25000);

            req.signal.addEventListener("abort", () => {
                clearInterval(pollInterval);
                clearInterval(heartbeat);
                try { controller.close(); } catch { }
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-store, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no", // Disable nginx buffering
        },
    });
}
