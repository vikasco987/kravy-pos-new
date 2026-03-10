import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await req.json();

        if (body.pointsRequired !== undefined) {
            body.pointsRequired = parseInt(body.pointsRequired.toString());
        }

        const reward = await prisma.reward.update({
            where: { id, clerkUserId: userId },
            data: body,
        });

        return NextResponse.json(reward);
    } catch (error) {
        console.error("PATCH_REWARD_ERROR:", error);
        return NextResponse.json({ error: "Failed to update reward" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        await prisma.reward.delete({
            where: { id, clerkUserId: userId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE_REWARD_ERROR:", error);
        return NextResponse.json({ error: "Failed to delete reward" }, { status: 500 });
    }
}
