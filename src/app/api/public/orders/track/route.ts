import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const phone = searchParams.get("phone");
        const orderId = searchParams.get("orderId");
        const clerkId = searchParams.get("clerkUserId");

        if (orderId) {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    table: true,
                    user: {
                        select: {
                            name: true,
                        }
                    }
                }
            });
            return NextResponse.json(order);
        }

        if (phone && clerkId) {
            // Find active orders for this phone number in the last 24 hours
            const yesterday = new Date();
            yesterday.setHours(yesterday.getHours() - 24);

            const orders = await prisma.order.findMany({
                where: {
                    customerPhone: phone,
                    clerkUserId: clerkId,
                    createdAt: { gte: yesterday },
                    status: { notIn: ["COMPLETED", "CANCELLED"] }
                },
                include: { table: true },
                orderBy: { createdAt: "desc" }
            });

            return NextResponse.json(orders);
        }

        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    } catch (error) {
        console.error("TRACK_ORDER_ERROR:", error);
        return NextResponse.json({ error: "Failed to track order" }, { status: 500 });
    }
}
