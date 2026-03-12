import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const rewards = await prisma.reward.findMany({
            where: { clerkUserId: effectiveId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(rewards);
    } catch (error) {
        console.error("GET_REWARDS_ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { title, description, pointsRequired, isActive } = body;

        if (!title || !pointsRequired) {
            return NextResponse.json({ error: "Title and Points Required are needed" }, { status: 400 });
        }

        const reward = await prisma.reward.create({
            data: {
                title,
                description,
                pointsRequired: parseInt(pointsRequired),
                isActive: isActive !== undefined ? isActive : true,
                clerkUserId: effectiveId,
            },
        });

        return NextResponse.json(reward, { status: 201 });
    } catch (error) {
        console.error("CREATE_REWARD_ERROR:", error);
        return NextResponse.json({ error: "Failed to create reward" }, { status: 500 });
    }
}
