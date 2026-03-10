import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const offer = await prisma.offer.update({
            where: { id: params.id, clerkUserId: userId },
            data: body,
        });

        return NextResponse.json(offer);
    } catch (error) {
        console.error("PATCH_OFFER_ERROR:", error);
        return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await prisma.offer.delete({
            where: { id: params.id, clerkUserId: userId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE_OFFER_ERROR:", error);
        return NextResponse.json({ error: "Failed to delete offer" }, { status: 500 });
    }
}
