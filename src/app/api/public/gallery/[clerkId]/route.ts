import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Public GET — customer-facing, no auth required
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ clerkId: string }> }
) {
    try {
        const { clerkId } = await params;
        if (!clerkId) return NextResponse.json({ error: "clerkId required" }, { status: 400 });

        const images = await prisma.galleryImage.findMany({
            where: { clerkUserId: clerkId, isActive: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
            select: {
                id: true,
                imageUrl: true,
                category: true,
                caption: true,
                createdAt: true,
            },
        });

        return NextResponse.json(images);
    } catch (error) {
        console.error("PUBLIC_GALLERY_ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
    }
}
