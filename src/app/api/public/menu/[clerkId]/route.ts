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
            },
            orderBy: {
                name: "asc",
            },
            include: {
                category: true,
            },
        });

        console.log(`[PUBLIC_MENU] Found ${items.length} items for ${clerkId}`);

        const profile = await prisma.businessProfile.findUnique({
            where: { userId: clerkId },
        });

        return NextResponse.json({ items, profile });
    } catch (error) {
        console.error("PUBLIC_MENU_ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
    }
}
