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
        const { clerkUserId, tableId, items, total, customerName, customerPhone, customerAddress, caseType, parentOrderId, paymentMethod } = body;

        if (!clerkUserId || !items || !total) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Fetch business profile for dynamic settings
        const profile = await prisma.businessProfile.findUnique({
            where: { userId: clerkUserId }
        });

        const isInclusive = profile?.qrMenuPriceInclusive ?? false;
        const enrichedRequestItems = items.map((i: any) => ({ 
            ...i, 
            taxStatus: i.taxStatus || (isInclusive ? "With Tax" : "Without Tax") 
        }));

        // Case 1: MERGE INTO EXISTING ORDER
        if (caseType === "merge" && parentOrderId) {
            const isValidParentId = /^[0-9a-fA-F]{24}$/.test(parentOrderId);
            if (!isValidParentId) return NextResponse.json({ error: "Invalid parent order ID format" }, { status: 400 });

            const existing = await prisma.order.findUnique({ where: { id: parentOrderId } });
            if (!existing) return NextResponse.json({ error: "Parent order not found" }, { status: 404 });

            // Mark new items explicitly so kitchen can highlight them
            const newItems = enrichedRequestItems.map((i: any) => ({ ...i, isNew: true, addedAt: new Date().toISOString() }));

            const currentItems = Array.isArray(existing.items) ? existing.items : [];
            const updatedItems = [...currentItems, ...newItems];

            const updatedOrder = await prisma.order.update({
                where: { id: parentOrderId },
                data: {
                    items: updatedItems,
                    total: existing.total + parseFloat(total),
                    isMerged: true,
                    mergedAt: new Date(),
                    isKotPrinted: false, // Reset so kitchen knows to print new items
                    isBillPrinted: false, // Reset total has changed
                    paymentMode: paymentMethod || existing.paymentMode,
                    notes: body.notes || existing.notes || null, // ✅ Append or Update
                    preferences: body.preferences || existing.preferences || null, // ✅ Update preferences
                    customerAddress: customerAddress || existing.customerAddress // ✅ Update address if provided
                },
                include: { table: true },
            });
            return NextResponse.json(updatedOrder);
        }

        // Resolve table name to real table ID
        let realTableId = null;
        if (tableId) {
            const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(tableId);
            
            const tableRecord = await prisma.table.findFirst({
                where: {
                    OR: [
                        ...(isValidObjectId ? [{ id: tableId }] : []),
                        { name: tableId }
                    ],
                    clerkUserId: clerkUserId
                }
            });
            if (tableRecord) {
                realTableId = tableRecord.id;
            }
        }

        // Case 2 & 3: NEW ORDER (Separate / Round 2)
        const order = await prisma.order.create({
            data: {
                clerkUserId,
                tableId: realTableId,
                items: enrichedRequestItems, // JSON array enriched with taxStatus
                total: parseFloat(total),
                customerName,
                customerPhone,
                status: "PENDING",
                caseType: caseType || "new",
                parentOrderId: parentOrderId || null,
                paymentMode: paymentMethod || "UPI / QR",
                customerAddress,
                notes: body.notes || null, // ✅ NEW
                preferences: body.preferences || null // ✅ NEW
            },
            include: {
                table: true,
            }
        });

        // Award Loyalty Points (Dynamic Ratio)
        if (customerPhone) {
            try {
                const ratio = profile?.loyaltyPointRatio || 10;
                const pointsToAward = Math.floor(parseFloat(total) / ratio);
                if (pointsToAward > 0) {
                    await prisma.party.upsert({
                        where: {
                            phone_createdBy: {
                                phone: customerPhone,
                                createdBy: clerkUserId
                            }
                        },
                        update: {
                            loyaltyPoints: { increment: pointsToAward },
                            name: customerName || undefined
                        },
                        create: {
                            phone: customerPhone,
                            name: customerName || "Guest",
                            createdBy: clerkUserId,
                            loyaltyPoints: pointsToAward
                        }
                    });
                }
            } catch (loyaltyError) {
                console.error("LOYALTY_AWARD_ERROR:", loyaltyError);
            }
        }


        return NextResponse.json(order);
    } catch (error) {
        console.error("ORDER_CREATE_ERROR:", error);
        return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
    }
}
