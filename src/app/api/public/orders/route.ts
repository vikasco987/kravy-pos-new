import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/public/orders?id=<orderId> — public order tracking
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Order ID required" }, { status: 400 });

        const order = await prisma.order.findUnique({
            where: { id },
            include: { table: true },
        });

        if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

        return NextResponse.json(order);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { clerkUserId, tableId, items, total, customerName, customerPhone, caseType, parentOrderId } = body;

        if (!clerkUserId || !items || !total) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Case 1: MERGE INTO EXISTING ORDER
        if (caseType === "merge" && parentOrderId) {
            const existing = await prisma.order.findUnique({ where: { id: parentOrderId } });
            if (!existing) return NextResponse.json({ error: "Parent order not found" }, { status: 404 });

            // Mark new items explicitly so kitchen can highlight them
            const newItems = items.map((i: any) => ({ ...i, isNew: true, addedAt: new Date().toISOString() }));

            // Append rather than replace
            const currentItems = Array.isArray(existing.items) ? existing.items : [];
            const updatedItems = [...currentItems, ...newItems];

            const updatedOrder = await prisma.order.update({
                where: { id: parentOrderId },
                data: {
                    items: updatedItems,
                    total: existing.total + parseFloat(total),
                    isMerged: true,
                    mergedAt: new Date(),
                },
                include: { table: true },
            });
            return NextResponse.json(updatedOrder);
        }

        // Case 2 & 3: NEW ORDER (Separate / Round 2)
        const order = await prisma.order.create({
            data: {
                clerkUserId,
                tableId: tableId || null,
                items, // JSON array
                total: parseFloat(total),
                customerName,
                customerPhone,
                status: "PENDING",
                caseType: caseType || "new",
                parentOrderId: parentOrderId || null,
            },
            include: {
                table: true,
            }
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error("ORDER_CREATE_ERROR:", error);
        return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
    }
}
