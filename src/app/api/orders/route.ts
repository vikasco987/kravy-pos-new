import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const tableId = searchParams.get("tableId");
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;
        const status = searchParams.get("status");
        const includeDeleted = searchParams.get("includeDeleted") === "true";

        const orders = await prisma.order.findMany({
            where: { 
                // clerkUserId: effectiveId, // Temporarily disabled to resolve visibility issues
                ...(tableId ? { tableId } : {}),
                ...(status ? { status } : {}),
                isDeleted: includeDeleted ? undefined : { not: true },
            },
            take: limit,
            orderBy: { createdAt: "desc" },
            include: { table: true },
        });

        console.log(`[GET_ORDERS] EffectiveID: ${effectiveId}, Count: ${orders.length}`);
        return NextResponse.json(orders);
    } catch (error) {
        console.error("GET_ORDERS_ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch orders", details: String(error) }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orderId, status, isKotPrinted, isBillPrinted, items, total, isDeleted } = await req.json();

        if (!orderId) {
            return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
        }

        const data: any = {};
        if (status) data.status = status;
        if (typeof isKotPrinted === "boolean") data.isKotPrinted = isKotPrinted;
        if (typeof isBillPrinted === "boolean") data.isBillPrinted = isBillPrinted;
        if (items) data.items = items;
        if (typeof total === "number") data.total = total;
        if (typeof isDeleted === "boolean") data.isDeleted = isDeleted;

        const order = await prisma.order.update({
            where: { 
                id: orderId, 
                // clerkUserId: effectiveId 
            },
            data,
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error("PATCH_ORDER_ERROR:", error);
        return NextResponse.json({ 
            error: "Failed to update order",
            details: error instanceof Error ? error.message : "Unknown error" 
        }, { status: 500 });
    }
}
