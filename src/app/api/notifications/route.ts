import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
        return new Response("Unauthorized", { status: 401 });
    }

    const clerkId: string = effectiveId;

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

            let isAborted = false;
            let pollTimeout: NodeJS.Timeout;

            async function poll() {
                if (isAborted) return;

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

                    if (isAborted) return;

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

                    if (isAborted) return;

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
                    // Check if it's a connection reset error and log it specifically
                    const errMsg = error instanceof Error ? error.message : String(error);
                    if (errMsg.includes("Connection reset by peer")) {
                        console.warn("Prisma: Connection reset by peer in SSE. Retrying in 10s...");
                        // Wait a bit longer before retrying on network errors
                        pollTimeout = setTimeout(poll, 10000);
                        return;
                    } else {
                        console.error("SSE poll error:", error);
                    }
                }

                // Schedule next poll
                pollTimeout = setTimeout(poll, 5000);
            }

            // Start polling
            poll();

            // Heartbeat Logic
            const heartbeatInterval = setInterval(() => {
                if (isAborted) return;
                try {
                    controller.enqueue(encoder.encode(`: heartbeat\n\n`));
                } catch { 
                    isAborted = true;
                    clearInterval(heartbeatInterval); 
                    clearTimeout(pollTimeout);
                }
            }, 25000);

            req.signal.addEventListener("abort", () => {
                isAborted = true;
                clearTimeout(pollTimeout);
                clearInterval(heartbeatInterval);
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
