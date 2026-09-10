import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Phase 2: Exact Behavior Preservation (Lightweight)
        // 1. Fetch exact business profile just like /api/orders
        const latestProfile = await prisma.businessProfile.findFirst({
            where: { userId: effectiveId },
            orderBy: { createdAt: 'asc' }
        });

        if (!latestProfile) {
            return NextResponse.json({ error: "Business profile not found" }, { status: 404 });
        }

        const today = new Date().toISOString().split('T')[0];
        const lastTokenDate = latestProfile.lastTokenDate ? new Date(latestProfile.lastTokenDate).toISOString().split('T')[0] : "";
        
        let updateData: any = {};

        if (lastTokenDate === today) {
            // Atomic increment prevents race conditions during the same day
            updateData.lastTokenNumber = { increment: 1 };
            updateData.lastTokenDate = new Date();
        } else {
            updateData.lastTokenNumber = 1;
            updateData.lastTokenDate = new Date();
        }

        // 2. Atomically update Profile for Token ONLY
        const updatedProfile = await prisma.businessProfile.update({
            where: { id: latestProfile.id },
            data: updateData,
            select: { lastTokenNumber: true }
        });

        const nextToken = updatedProfile.lastTokenNumber;

        return NextResponse.json({ 
            tokenNumber: nextToken
        }, { status: 200 });
        
    } catch (error) {
        console.error("RESERVE_TOKEN_ERROR:", error);
        return NextResponse.json({ error: "Failed to reserve token" }, { status: 500 });
    }
}
