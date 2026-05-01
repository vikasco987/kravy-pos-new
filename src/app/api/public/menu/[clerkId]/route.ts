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
        const profile = await prisma.businessProfile.findUnique({
            where: { userId: clerkId },
        });

        const query: any = {
            clerkId: clerkId,
        };

        // Multi-zone filtering logic
        if (profile?.multiZoneMenuEnabled && tableId && tableId !== "Counter") {
            const table = await prisma.table.findFirst({
                where: {
                    clerkUserId: clerkId,
                    OR: [
                        { id: tableId.length === 24 ? tableId : undefined },
                        { id: tableId },
                        { name: tableId }
                    ].filter(Boolean) as any
                }
            });

            if (table) {
                const zone = table.zone ? table.zone.toUpperCase() : "DEFAULT";
                console.log(`[PUBLIC_MENU] Table: ${table.name}, Zone: ${zone}`);
                
                // If NOT Default, we filter items to show only this zone + global items
                if (zone !== "DEFAULT") {
                    query.OR = [
                        { zones: { has: zone } },
                        { zones: { has: zone.toLowerCase() } },
                        { zones: { has: zone.charAt(0).toUpperCase() + zone.slice(1).toLowerCase() } },
                        { zones: { isEmpty: true } },
                        { zones: { equals: [] } },
                        { zones: null }
                    ];
                }
                // If Default, we don't add OR filter so it shows everything (requested behavior)
            } else {
                console.warn(`[PUBLIC_MENU] Table not found for ID/Name: ${tableId}`);
            }
        }

        const items = await prisma.item.findMany({
            where: query,
            orderBy: {
                name: "asc",
            },
            include: {
                category: true,
                addonGroups: true, // Fetch global customizations
            },
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

        console.log(`[PUBLIC_MENU] Found ${items.length} items for ${clerkId}`);

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
