import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// GET — fetch all gallery images for the authenticated owner
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const images = await prisma.galleryImage.findMany({
            where: { clerkUserId: userId },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        });

        return NextResponse.json(images);
    } catch (error) {
        console.error("GET_GALLERY_ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
    }
}

// POST — add a new image to gallery
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { imageUrl, category, caption } = body;

        if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 });

        const image = await prisma.galleryImage.create({
            data: {
                clerkUserId: userId,
                imageUrl,
                category: category || "food",
                caption: caption || null,
                isActive: true,
            },
        });

        return NextResponse.json(image, { status: 201 });
    } catch (error) {
        console.error("POST_GALLERY_ERROR:", error);
        return NextResponse.json({ error: "Failed to add image" }, { status: 500 });
    }
}

// PATCH — update caption or category or toggle isActive
export async function PATCH(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { id, caption, category, isActive } = body;
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

        const updated = await prisma.galleryImage.update({
            where: { id },
            data: {
                ...(caption !== undefined && { caption }),
                ...(category !== undefined && { category }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("PATCH_GALLERY_ERROR:", error);
        return NextResponse.json({ error: "Failed to update image" }, { status: 500 });
    }
}

// DELETE — remove an image
export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

        await prisma.galleryImage.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE_GALLERY_ERROR:", error);
        return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
    }
}
