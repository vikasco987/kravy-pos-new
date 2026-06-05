import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ clerkId: string }> }
) {
    try {
        const { clerkId } = await params;
        const searchParams = req.nextUrl.searchParams;
        const tableId = searchParams.get("tableId");

        if (!clerkId) {
            return NextResponse.json({ error: "Clerk ID is required" }, { status: 400 });
        }

        console.log(`[PUBLIC_MENU] Fetching menu for: ${clerkId}, Table: ${tableId}`);

        // Fetch profile first to check if multi-zone is enabled
        let profile = null;
        try {
            profile = await prisma.businessProfile.findFirst({
                where: { userId: clerkId },
                orderBy: { createdAt: 'asc' },
            });
        } catch (e: any) {
            if (e.code === 'P2032' || e.message?.includes('createdAt') || e.message?.includes('updatedAt')) {
                console.log("⚠️ Prisma P2032 error in Public Menu. Running self-healing...");
                await prisma.$runCommandRaw({
                    update: "BusinessProfile",
                    updates: [
                        { q: { $or: [{ createdAt: null }, { createdAt: { $exists: false } }] }, u: { $set: { createdAt: { $date: new Date().toISOString() } } }, multi: true },
                        { q: { $or: [{ updatedAt: null }, { updatedAt: { $exists: false } }] }, u: { $set: { updatedAt: { $date: new Date().toISOString() } } }, multi: true }
                    ]
                });
                profile = await prisma.businessProfile.findFirst({
                    where: { userId: clerkId },
                    orderBy: { createdAt: 'asc' },
                });
            } else {
                throw e;
            }
        }

        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(tableId || "");
        
        const table = tableId ? await prisma.table.findFirst({
            where: {
                clerkUserId: clerkId,
                OR: [
                    isValidObjectId ? { id: tableId } : undefined,
                    { name: tableId }
                ].filter(Boolean) as any
            }
        }) : null;

        const tableZone = table?.zone?.toUpperCase() || "DEFAULT";
        console.log(`[PUBLIC_MENU] Table: ${table?.name || "None"}, Zone: ${tableZone}`);

        const rawItems = await prisma.item.findMany({
            where: { clerkId: clerkId },
            orderBy: { name: "asc" },
            include: {
                category: true,
                addonGroups: true,
                _count: {
                    select: { reviews: true }
                }
            },
        });

        console.log(`[PUBLIC_MENU] Raw items fetched: ${rawItems.length}`);

        // Filter in memory for reliability
        const items = rawItems.filter(item => {
            // If table is DEFAULT or Counter, show everything
            if (tableZone === "DEFAULT" || tableId === "Counter" || !profile?.multiZoneMenuEnabled) {
                return true;
            }

            // Otherwise, show items that match this zone OR are global (no zones assigned)
            const itemZones = (item.zones || []).map(z => z.toUpperCase());
            const isGlobal = itemZones.length === 0;
            const matchesZone = itemZones.includes(tableZone);

            return isGlobal || matchesZone;
        });

        const allAddonGroups = await prisma.addonGroup.findMany({
            where: { clerkId: clerkId }
        });

        const itemsWithAddons = items.map(item => {
            const explicitAddons = item.addonGroups || [];
            const categoryAddons = allAddonGroups.filter(ag => 
                (ag.categoryIds as string[])?.includes(item.categoryId || "") &&
                !explicitAddons.some(ea => ea.id === ag.id)
            );
            return {
                ...item,
                addonGroups: [...explicitAddons, ...categoryAddons]
            };
        });

        console.log(`[PUBLIC_MENU] Final filtered items: ${itemsWithAddons.length}`);

        const combos = await prisma.combo.findMany({
            where: { clerkUserId: clerkId, isActive: true },
        });

        const offers = await prisma.offer.findMany({
            where: { clerkUserId: clerkId, isActive: true },
        });

        const rewards = await prisma.reward.findMany({
            where: { clerkUserId: clerkId, isActive: true },
        });

        return NextResponse.json({ items: itemsWithAddons, profile, combos, offers, rewards });
    } catch (error) {
        console.error("PUBLIC_MENU_ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
    }
}
