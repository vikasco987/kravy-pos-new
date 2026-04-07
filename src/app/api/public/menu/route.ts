import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const clerkId = searchParams.get('clerkId');

        if (!clerkId) {
            return NextResponse.json({ error: "clerkId is required" }, { status: 400 });
        }

        const items = await prisma.item.findMany({
            where: { 
                clerkId: clerkId,
                isActive: true 
            },
            include: { 
                category: true,
                addonGroups: true
            },
            orderBy: { name: "asc" }
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error("Error fetching menu:", error);
        return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
    }
}
