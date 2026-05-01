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

        const table = tableId ? await prisma.table.findFirst({
            where: {
                clerkUserId: clerkId,
                OR: [
                    { id: tableId.length === 24 ? tableId : undefined },
                    { id: tableId },
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
