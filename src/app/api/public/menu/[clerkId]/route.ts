import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ clerkId: string }> }
) {
    try {
        const { clerkId } = await params;

        if (!clerkId) {
            return NextResponse.json({ error: "Clerk ID is required" }, { status: 400 });
        }

        console.log(`[PUBLIC_MENU] Fetching menu for: ${clerkId}`);

        const items = await prisma.item.findMany({
            where: {
                clerkId: clerkId,
                // isActive: true, // Show all items for now to debug
            },
            orderBy: {
                name: "asc",
            },
            include: {
                category: true,
                addonGroups: true, // Fetch global customizations
            },
        });

        console.log(`[PUBLIC_MENU] Found ${items.length} items for ${clerkId}`);

        const profile = await prisma.businessProfile.findUnique({
            where: { userId: clerkId },
        });

        const combos = await prisma.combo.findMany({
            where: { clerkUserId: clerkId, isActive: true },
        });

        const offers = await prisma.offer.findMany({
            where: { clerkUserId: clerkId, isActive: true },
        });

        const rewards = await prisma.reward.findMany({
            where: { clerkUserId: clerkId, isActive: true },
        });

        return NextResponse.json({ items, profile, combos, offers, rewards });
    } catch (error) {
        console.error("PUBLIC_MENU_ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
    }
}
