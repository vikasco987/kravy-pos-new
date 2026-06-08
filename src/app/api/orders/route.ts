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

        const active = searchParams.get("active") === "true";

        const orders = await prisma.order.findMany({
            where: { 
                clerkUserId: effectiveId,
                ...(tableId ? { tableId } : {}),
                ...(status ? { status } : {}),
                ...(active ? { NOT: { status: "COMPLETED" } } : {}),
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

        const { orderId, status, isKotPrinted, isBillPrinted, items, total, isDeleted, skipInventoryDeduction, customerName, customerPhone } = await req.json();

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

        // ✅ ALWAYS GENERATE TOKEN IF MISSING (Or if new items added)
        try {
            const currentOrder = await prisma.order.findUnique({ where: { id: orderId } });
            if (currentOrder) {
                const targetItems = (items && Array.isArray(items)) ? items : (Array.isArray(currentOrder.items) ? currentOrder.items : []);
                const hasNewItems = (targetItems as any[]).some(it => it.isNew);
                const isMissingToken = !currentOrder.tokenNumber || currentOrder.tokenNumber === 0;

                if (hasNewItems || isMissingToken) {
                    let nextToken = 1;
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
                        await prisma.businessProfile.update({
                            where: { id: profile.id },
                            data: {
                                lastTokenNumber: nextToken,
                                lastTokenDate: new Date()
                            }
                        });
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

        // ✅ AUTO-DEDUCT INVENTORY ON COMPLETION
        if (status === "COMPLETED" && !skipInventoryDeduction && order.items && Array.isArray(order.items)) {
            console.log(`[ORDER_PATCH_DEBUG] Order ${orderId} marked as COMPLETED. Triggering inventory deduction.`);
            const { deductInventory } = await import("@/lib/inventory-utils");
            await deductInventory(order.items);
        } else if (status === "COMPLETED" && skipInventoryDeduction) {
            console.log(`[ORDER_PATCH_DEBUG] Order ${orderId} marked as COMPLETED. Inventory deduction skipped by caller.`);
        } else if (status === "COMPLETED") {
            console.warn(`[ORDER_PATCH_DEBUG] Order ${orderId} marked as COMPLETED but has NO items. Deduction skipped.`);
        }

        return NextResponse.json(order);
    } catch (error: any) {
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
        const { tableId, items, total, customerName, customerPhone, customerAddress, status, notes, preferences, isKotPrinted } = body;

        if (!items || total === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // ✅ 1. FETCH PROFILE FOR TOKEN GENERATION
        const profile = await prisma.businessProfile.findFirst({
            where: { userId: effectiveId },
            orderBy: { createdAt: 'asc' }
        });

        // ✅ 2. TOKEN NUMBER GENERATION (DAILY RESET)
        let nextToken = 1;
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

        // ✅ Generate orderNumber (INV/YYMM/XXXX) with max sequence
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        let maxSerial = 0;
        const lastBill = await prisma.billManager.findFirst({
            where: { clerkUserId: effectiveId, createdAt: { gte: startOfMonth }, OR: [{ billNumber: { startsWith: 'INV/' } }, { billNumber: { startsWith: 'SV/' } }] },
            orderBy: { createdAt: 'desc' },
            select: { billNumber: true }
        });
        if (lastBill?.billNumber) {
            const parts = lastBill.billNumber.split(/[\/-]/);
            const serial = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(serial) && serial > maxSerial) maxSerial = serial;
        }
        
        const lastOrder = await prisma.order.findFirst({
            where: { clerkUserId: effectiveId, createdAt: { gte: startOfMonth }, orderNumber: { not: null } },
            orderBy: { createdAt: 'desc' },
            select: { orderNumber: true }
        });
        if (lastOrder?.orderNumber) {
            const parts = lastOrder.orderNumber.split(/[\/-]/);
            const serial = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(serial) && serial > maxSerial) maxSerial = serial;
        }

        const nextSerial = maxSerial + 1;
        const yy = String(startOfMonth.getFullYear()).slice(-2);
        const mm = String(startOfMonth.getMonth() + 1).padStart(2, '0');
        const orderNumber = `INV/${yy}${mm}/${nextSerial.toString().padStart(4, '0')}`;

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
            },
            include: { table: true },
        });

        // ✅ 4. AUTO-DEDUCT INVENTORY IF COMPLETED
        if (order.status === "COMPLETED") {
            console.log(`[ORDER_POST_DEBUG] New Order ${order.id} is COMPLETED. Triggering inventory deduction.`);
            const { deductInventory } = await import("@/lib/inventory-utils");
            await deductInventory(order.items as any[]);
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
