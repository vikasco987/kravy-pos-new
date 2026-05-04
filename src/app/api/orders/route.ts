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
                clerkUserId: effectiveId,
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

        // ✅ TOKEN NUMBER GENERATION FOR ADD-ON KOTs
        if (isKotPrinted) {
            let nextToken = 1;
            try {
                const profile = await prisma.businessProfile.findUnique({
                    where: { userId: effectiveId },
                });
                const today = new Date().toISOString().split('T')[0];
                const lastTokenDate = profile?.lastTokenDate ? new Date(profile.lastTokenDate).toISOString().split('T')[0] : "";
                
                if (lastTokenDate === today) {
                    nextToken = (profile?.lastTokenNumber || 0) + 1;
                } else {
                    nextToken = 1;
                }

                await prisma.businessProfile.update({
                    where: { userId: effectiveId },
                    data: {
                        lastTokenNumber: nextToken,
                        lastTokenDate: new Date()
                    }
                });

                // Fetch current kotNumbers and items
                const currentOrder = await prisma.order.findUnique({ where: { id: orderId } });
                const existingKotNumbers = Array.isArray(currentOrder?.kotNumbers) ? currentOrder.kotNumbers : (currentOrder?.tokenNumber ? [currentOrder.tokenNumber] : []);
                
                // Tag items that are being printed as 'new' with this KOT number
                if (items && Array.isArray(items)) {
                    data.items = items.map((it: any) => {
                        if (it.isNew) {
                            return { ...it, isNew: false, kotNumber: nextToken };
                        }
                        return it;
                    });
                } else if (currentOrder && Array.isArray(currentOrder.items)) {
                    // Fallback to existing items if items not passed in body (though they usually are)
                    data.items = (currentOrder.items as any[]).map((it: any) => {
                        if (it.isNew) {
                            return { ...it, isNew: false, kotNumber: nextToken };
                        }
                        return it;
                    });
                }

                data.tokenNumber = nextToken; // Update latest for legacy
                data.kotNumbers = [...existingKotNumbers, nextToken];
            } catch (tokenErr) {
                console.error("PATCH_ORDER_TOKEN_ERROR:", tokenErr);
            }
        }

        const order = await prisma.order.update({
            where: { 
                id: orderId, 
                clerkUserId: effectiveId 
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
export async function POST(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { tableId, items, total, customerName, customerPhone, customerAddress, status, notes, preferences, isKotPrinted } = body;

        if (!items || total === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // ✅ 1. FETCH PROFILE FOR TOKEN GENERATION
        const profile = await prisma.businessProfile.findUnique({
            where: { userId: effectiveId },
        });

        // ✅ 2. TOKEN NUMBER GENERATION (DAILY RESET)
        let nextToken = 1;
        try {
            // Re-fetch profile to get latest lastTokenNumber (prevent race condition)
            const latestProfile = await prisma.businessProfile.findUnique({
                where: { userId: effectiveId },
            });
            const today = new Date().toISOString().split('T')[0];
            const lastTokenDate = latestProfile?.lastTokenDate ? new Date(latestProfile.lastTokenDate).toISOString().split('T')[0] : "";
            
            if (lastTokenDate === today) {
                nextToken = (latestProfile?.lastTokenNumber || 0) + 1;
            } else {
                nextToken = 1;
            }

            // Sync with BusinessProfile
            await prisma.businessProfile.update({
                where: { userId: effectiveId },
                data: {
                    lastTokenNumber: nextToken,
                    lastTokenDate: new Date()
                }
            });
        } catch (tokenErr) {
            console.error("ORDER_TOKEN_GENERATION_ERROR:", tokenErr);
            // Fallback to 1 if profile update fails
        }

        // ✅ 3. CREATE ORDER WITH PERSISTENT TOKEN
        const order = await prisma.order.create({
            data: {
                clerkUserId: effectiveId,
                tableId: tableId || null,
                items,
                total: parseFloat(total),
                status: status || "PENDING",
                customerName: customerName || null,
                customerPhone: customerPhone || null,
                customerAddress: customerAddress || null,
                notes: notes || null,
                preferences: preferences || null,
                isKotPrinted: isKotPrinted || false,
                isBillPrinted: false,
                tokenNumber: nextToken, // Legacy
                kotNumbers: [nextToken], // Store as first KOT/Token number
            },
            include: { table: true },
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error("POST_ORDER_ERROR:", error);
        return NextResponse.json({ error: "Failed to create order", details: String(error) }, { status: 500 });
    }
}
