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
        const rawLimit = searchParams.get("limit");
        const requestedLimit = Number(rawLimit);
        const limit = Math.min(
          Math.max(Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : 100, 1),
          100
        );

        const pageParam = searchParams.get("page");
        const page = Math.max(Number(pageParam) || 1, 1);
        const skip = (page - 1) * limit;
        const status = searchParams.get("status");
        const includeDeleted = searchParams.get("includeDeleted") === "true";

        const active = searchParams.get("active") === "true";
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const whereClause: any = {
            clerkUserId: effectiveId,
            ...(tableId ? { tableId } : {}),
            ...(status ? { status } : {}),
            ...(active ? { NOT: { status: "COMPLETED" } } : {}),
            isDeleted: includeDeleted ? undefined : { not: true },
        };

        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) {
                const [y, m, d] = startDate.split('-').map(Number);
                const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
                start.setMinutes(start.getMinutes() - 330);
                whereClause.createdAt.gte = start;
            }
            if (endDate) {
                const [y, m, d] = endDate.split('-').map(Number);
                const end = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
                end.setMinutes(end.getMinutes() - 330);
                whereClause.createdAt.lte = end;
            }
        }

        const orders = await prisma.order.findMany({
            where: whereClause,
            take: limit,
            skip: skip,
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

        const { orderId, status, isKotPrinted, isBillPrinted, items, total, isDeleted, skipInventoryDeduction, customerName, customerPhone, reservedTokenNumber } = await req.json();

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
        if (customerName !== undefined) data.customerName = customerName;
        if (customerPhone !== undefined) data.customerPhone = customerPhone;

        // ✅ 0. FETCH CURRENT ORDER FOR ATOMICITY & TOKEN GENERATION
        const currentOrder = await prisma.order.findUnique({ where: { id: orderId, clerkUserId: effectiveId } });
        if (!currentOrder) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // ✅ ALWAYS GENERATE TOKEN IF MISSING (Or if new items added)
        try {
            if (currentOrder) {
                const targetItems = (items && Array.isArray(items)) ? items : (Array.isArray(currentOrder.items) ? currentOrder.items : []);
                const hasNewItems = (targetItems as any[]).some(it => it.isNew);
                const isMissingToken = !currentOrder.tokenNumber || currentOrder.tokenNumber === 0;

                if (hasNewItems || isMissingToken) {
                    let nextToken = reservedTokenNumber ? Number(reservedTokenNumber) : 1;
                    
                    if (!reservedTokenNumber) {
                        const profile = await prisma.businessProfile.findFirst({
                            where: { userId: effectiveId },
                            orderBy: { createdAt: 'asc' }
                        });
                        const today = new Date().toISOString().split('T')[0];
                        const lastTokenDate = profile?.lastTokenDate ? new Date(profile.lastTokenDate).toISOString().split('T')[0] : "";
                        
                        if (lastTokenDate === today) {
                            nextToken = (profile?.lastTokenNumber || 0) + 1;
                        } else {
                            nextToken = 1;
                        }

                        if (profile?.id) {
                            let updateData: any = {};
                            if (lastTokenDate === today) {
                                updateData.lastTokenNumber = { increment: 1 };
                                updateData.lastTokenDate = new Date();
                            } else {
                                updateData.lastTokenNumber = 1;
                                updateData.lastTokenDate = new Date();
                            }
                            
                            const updatedProfile = await prisma.businessProfile.update({
                                where: { id: profile.id },
                                data: updateData,
                                select: { lastTokenNumber: true }
                            });
                            nextToken = updatedProfile.lastTokenNumber;
                        }
                    }

                    const existingKotNumbers = Array.isArray(currentOrder.kotNumbers) ? currentOrder.kotNumbers : (currentOrder.tokenNumber ? [currentOrder.tokenNumber] : []);
                    
                    data.items = (targetItems as any[]).map((it: any) => {
                        if (it.isNew) {
                            return { ...it, isNew: false, kotNumber: nextToken };
                        }
                        return it;
                    });

                    data.tokenNumber = isMissingToken ? nextToken : currentOrder.tokenNumber; 
                    if (hasNewItems) {
                        data.kotNumbers = [...existingKotNumbers, nextToken];
                    }
                }
            }
        } catch (tokenErr) {
            console.error("PATCH_ORDER_TOKEN_ERROR:", tokenErr);
        }

        const order = await prisma.order.update({
            where: { 
                id: orderId, 
                clerkUserId: effectiveId 
            },
            data,
        });

        // ✅ AUTO-DEDUCT INVENTORY ON COMPLETION (ATOMIC CLAIM)
        const isCompleting = status === "COMPLETED" && currentOrder.status !== "COMPLETED";
        
        if (isCompleting && !skipInventoryDeduction && order.items && Array.isArray(order.items) && order.items.length > 0) {
            // ATOMIC CLAIM
            const claim = await prisma.order.updateMany({
                where: { id: orderId, inventoryDeducted: false },
                data: { inventoryDeducted: true }
            });

            if (claim.count > 0) {
                console.log(`[ORDER_PATCH_DEBUG] Order ${orderId} marked as COMPLETED. Claim successful. Triggering inventory deduction.`);
                const { deductInventory } = await import("@/lib/inventory-utils");
                
                // Fire and forget, but with rollback on failure
                const tInvStart = Date.now();
                deductInventory(order.items)
                    .then(() => {
                        console.log(`[INVENTORY_PERF] source=order orderId=${orderId} durationMs=${Date.now() - tInvStart} status=success`);
                    })
                    .catch(async (err) => {
                        console.error(`[INVENTORY_PERF] source=order orderId=${orderId} durationMs=${Date.now() - tInvStart} status=failed error=`, err);
                        // Revert claim so it can be retried
                        try {
                            await prisma.order.updateMany({
                                where: { id: orderId },
                                data: { inventoryDeducted: false }
                            });
                        } catch (revertErr) {
                            console.error("Failed to revert inventory claim:", revertErr);
                        }
                    });
            } else {
                console.log(`[ORDER_PATCH_DEBUG] Order ${orderId} is already deducted or claim lost. Skipping deduction.`);
            }
        } else if (status === "COMPLETED" && skipInventoryDeduction) {
            console.log(`[ORDER_PATCH_DEBUG] Order ${orderId} marked as COMPLETED. Inventory deduction skipped by caller.`);
        } else if (status === "COMPLETED" && currentOrder.status === "COMPLETED") {
            console.log(`[ORDER_PATCH_DEBUG] Order ${orderId} is already COMPLETED. Skipping duplicate deduction.`);
        }

        return NextResponse.json(order);
    } catch (error: any) {
        if (error?.code === "P2025") {
            console.warn(`[PATCH_ORDER_WARN] Order ${orderId} update failed with P2025 (Record to update not found). Checking existing status...`);
            const existingOrder = await prisma.order.findUnique({
                where: { id: orderId, clerkUserId: effectiveId }
            });
            if (existingOrder) {
                console.log(`[PATCH_ORDER_INFO] Order ${orderId} already exists with status: ${existingOrder.status}. Returning existing record.`);
                return NextResponse.json(existingOrder);
            }
        }
        console.error("PATCH_ORDER_ERROR:", error);
        return NextResponse.json({ 
            error: "Failed to update order",
            details: error?.message || String(error),
            code: error?.code || "UNKNOWN"
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
        const { tableId, items, total, customerName, customerPhone, customerAddress, status, notes, preferences, isKotPrinted, reservedTokenNumber, reservedOrderNumber } = body;

        if (!items || total === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // ✅ 1. FETCH PROFILE FOR TOKEN GENERATION
        let nextToken = reservedTokenNumber ? Number(reservedTokenNumber) : 1;
        let nextSerial = 1;
        let orderNumber = reservedOrderNumber || "";

        if (!reservedTokenNumber) {
            const profile = await prisma.businessProfile.findFirst({
                where: { userId: effectiveId },
                orderBy: { createdAt: 'asc' }
            });

            // ✅ 2. TOKEN NUMBER GENERATION (DAILY RESET)
            try {
                // Re-fetch profile to get latest lastTokenNumber (prevent race condition)
                const latestProfile = await prisma.businessProfile.findFirst({
                    where: { userId: effectiveId },
                    orderBy: { createdAt: 'asc' }
                });
                const today = new Date().toISOString().split('T')[0];
                const lastTokenDate = latestProfile?.lastTokenDate ? new Date(latestProfile.lastTokenDate).toISOString().split('T')[0] : "";
                
                if (lastTokenDate === today) {
                    nextToken = (latestProfile?.lastTokenNumber || 0) + 1;
                } else {
                    nextToken = 1;
                }

                // Sync with BusinessProfile (using upsert to prevent errors if profile missing)
                if (latestProfile?.id) {
                    await prisma.businessProfile.update({
                        where: { id: latestProfile.id },
                        data: {
                            lastTokenNumber: nextToken,
                            lastTokenDate: new Date()
                        }
                    });
                } else {
                    await prisma.businessProfile.create({
                        data: {
                            userId: effectiveId,
                            lastTokenNumber: nextToken,
                            lastTokenDate: new Date(),
                            businessName: "My Restaurant",
                            contactPersonEmail: effectiveId.includes("user_") ? "" : effectiveId // Fallback
                        }
                    });
                }
            } catch (tokenErr) {
                console.error("ORDER_TOKEN_GENERATION_ERROR:", tokenErr);
                // Fallback to 1 if profile update fails
            }

        }

        if (!reservedOrderNumber) {
            // ✅ Generate orderNumber (ORD/YYMM/Random)
            // Orders no longer consume the GST invoice sequence!
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            
            const yy = String(startOfMonth.getFullYear()).slice(-2);
            const mm = String(startOfMonth.getMonth() + 1).padStart(2, '0');
            const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
            orderNumber = `ORD/${yy}${mm}/${randomString}`;
        }

        const processedItems = (items && Array.isArray(items)) 
            ? items.map((it: any) => ({ 
                ...it, 
                isNew: false, 
                kotNumber: nextToken,
                quantity: Number(it.quantity || it.qty || 0),
                price: Number(it.price || it.rate || 0),
                rate: Number(it.rate || it.price || 0),
                qty: Number(it.qty || it.quantity || 0)
            }))
            : items;

        // ✅ 3. CREATE ORDER WITH PERSISTENT TOKEN
        const order = await prisma.order.create({
            data: {
                clerkUserId: effectiveId,
                tableId: tableId || null,
                items: processedItems,
                total: parseFloat(total),
                status: status || "PENDING",
                customerName: customerName || null,
                customerPhone: customerPhone || null,
                customerAddress: customerAddress || null,
                notes: notes || null,
                preferences: preferences || null,
                isKotPrinted: isKotPrinted || false,
                isBillPrinted: false,
                orderNumber: orderNumber,
                tokenNumber: nextToken, // Legacy
                kotNumbers: [nextToken], // Store as first KOT/Token number
                inventoryDeducted: status === "COMPLETED" ? true : false,
            },
            include: { table: true },
        });

        // ✅ 4. AUTO-DEDUCT INVENTORY IF COMPLETED
        if (order.status === "COMPLETED" && order.inventoryDeducted) {
            console.log(`[ORDER_POST_DEBUG] New Order ${order.id} is COMPLETED. Triggering inventory deduction.`);
            const { deductInventory } = await import("@/lib/inventory-utils");
            
            const tInvStart = Date.now();
            deductInventory(order.items as any[])
                .then(() => {
                    console.log(`[INVENTORY_PERF] source=order_post orderId=${order.id} durationMs=${Date.now() - tInvStart} status=success`);
                })
                .catch(async (err) => {
                    console.error(`[INVENTORY_PERF] source=order_post orderId=${order.id} durationMs=${Date.now() - tInvStart} status=failed error=`, err);
                    try {
                        await prisma.order.updateMany({
                            where: { id: order.id },
                            data: { inventoryDeducted: false }
                        });
                    } catch (revertErr) {
                        console.error("Failed to revert inventory claim:", revertErr);
                    }
                });
        }

        // ✅ 5. SEND EXPO PUSH NOTIFICATION FOR BACKGROUND POPUP (DATA ONLY MESSAGE)
        try {
            // Fetch User to get the push token from privateMetadata
            const userForPush = await prisma.user.findUnique({
                where: { clerkId: effectiveId }
            });
            const expoPushToken = (userForPush?.privateMetadata as any)?.expoPushToken;
            if (expoPushToken) {
                console.log(`Sending silent data push to wake up Notifee: ${expoPushToken}`);
                const pushPayload = {
                    to: expoPushToken,
                    data: { orderId: order.id, isNewOrder: true },
                    priority: "high"
                };
                fetch("https://exp.host/--/api/v2/push/send", {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Accept-encoding": "gzip, deflate",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(pushPayload)
                }).catch(err => console.error("Silent push fetch error:", err));
            } else {
                console.log(`No expoPushToken found for user: ${effectiveId}`);
            }
        } catch (pushErr) {
            console.error("PUSH_NOTIFICATION_ERROR:", pushErr);
        }

        return NextResponse.json(order);
    } catch (error: any) {
        console.error("POST_ORDER_ERROR:", error);
        return NextResponse.json({ 
            error: "Failed to create order", 
            details: error?.message || String(error),
            code: error?.code || "UNKNOWN"
        }, { status: 500 });
    }
}
