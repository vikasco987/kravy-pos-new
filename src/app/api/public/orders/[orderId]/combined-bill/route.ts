import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const { orderId } = await params;

        // Find the root order first
        const currentOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: { table: true }
        });

        if (!currentOrder) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const rootOrderId = currentOrder.parentOrderId || currentOrder.id;

        // Fetch all orders sharing the same root (parentOrderId or id)
        const allOrders = await prisma.order.findMany({
            where: {
                OR: [
                    { id: rootOrderId },
                    { parentOrderId: rootOrderId }
                ]
            },
            orderBy: { createdAt: "asc" }
        });

        // Calculate subtotal, taxes, etc.
        let subtotal = 0;
        const processedOrders = allOrders.map(order => {
            const orderTotal = order.total;
            subtotal += orderTotal;
            return {
                id: order.id,
                items: order.items,
                total: orderTotal,
                status: order.status,
                caseType: order.caseType || "initial",
                createdAt: order.createdAt
            };
        });

        // Mock tax calculations (can be refined with business profile settings)
        const cgst = subtotal * 0.025;
        const sgst = subtotal * 0.025;
        const grandTotal = subtotal + cgst + sgst;

        return NextResponse.json({
            success: true,
            rootOrderId,
            orders: processedOrders,
            subtotal,
            cgst,
            sgst,
            grandTotal,
            table: currentOrder.table
        });
    } catch (error) {
        console.error("COMBINED_BILL_ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch combined bill" }, { status: 500 });
    }
}
