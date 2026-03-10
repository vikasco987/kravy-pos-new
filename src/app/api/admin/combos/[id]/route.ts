import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const { id: _, clerkUserId: __, ...updateData } = await req.json();

        // Ensure price is a number if it exists in the body
        if (updateData.price !== undefined) {
            updateData.price = parseFloat(updateData.price.toString());
        }

        const combo = await prisma.combo.update({
            where: { id, clerkUserId: userId },
            data: updateData,
        });

        return NextResponse.json(combo);
    } catch (error) {
        console.error("PATCH_COMBO_ERROR:", error);
        return NextResponse.json({ error: "Failed to update combo" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        await prisma.combo.delete({
            where: { id, clerkUserId: userId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE_COMBO_ERROR:", error);
        return NextResponse.json({ error: "Failed to delete combo" }, { status: 500 });
    }
}
