import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Create Server-Sent Events stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            // Send initial connection message
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

            // Poll for new orders every 5 seconds
            const pollInterval = setInterval(async () => {
                try {
                    const recentOrders = await prisma.order.findMany({
                        where: { 
                            clerkUserId: clerkId,
                            createdAt: {
                                gte: new Date(Date.now() - 30000) // Last 30 seconds
                            }
                        },
                        include: { table: true },
                        orderBy: { createdAt: "desc" }
                    });

                    if (recentOrders.length > 0) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                            type: 'new_orders', 
                            orders: recentOrders 
                        })}\n\n`));
                    }

                    // Check for recent reviews
                    const recentReviews = await prisma.review.findMany({
                        where: { 
                            clerkUserId: clerkId,
                            createdAt: {
                                gte: new Date(Date.now() - 30000) // Last 30 seconds
                            }
                        },
                        include: { item: { select: { name: true } } },
                        orderBy: { createdAt: "desc" }
                    });

                    if (recentReviews.length > 0) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                            type: 'new_reviews', 
                            reviews: recentReviews 
                        })}\n\n`));
                    }
                } catch (error) {
                    console.error("Error in SSE polling:", error);
                }
            }, 5000);

            // Cleanup on disconnect
            req.signal.addEventListener("abort", () => {
                clearInterval(pollInterval);
                controller.close();
            });
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
