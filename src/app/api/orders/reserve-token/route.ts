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
        
        let updateData: any = {
            billCounter: { increment: 1 }
        };

        if (lastTokenDate === today) {
            // Atomic increment prevents race conditions during the same day
            updateData.lastTokenNumber = { increment: 1 };
            // Ensure we keep the date updated (though it's already today)
            updateData.lastTokenDate = new Date();
        } else {
            // New day reset. If a race condition happens exactly at midnight for the first order, 
            // both might get token 1, which is an acceptable edge case compared to mid-day collisions.
            updateData.lastTokenNumber = 1;
            updateData.lastTokenDate = new Date();
        }

        // 2. Atomically update Profile for Token AND BillCounter
        const updatedProfile = await prisma.businessProfile.update({
            where: { id: latestProfile.id },
            data: updateData,
            select: { billCounter: true, lastTokenNumber: true }
        });

        const nextToken = updatedProfile.lastTokenNumber;

        // 3. Replicate orderNumber generation
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const yy = String(startOfMonth.getFullYear()).slice(-2);
        const mm = String(startOfMonth.getMonth() + 1).padStart(2, '0');
        const nextSerial = updatedProfile.billCounter;
        const orderNumber = `INV/${yy}${mm}/${nextSerial.toString().padStart(4, '0')}`;

        return NextResponse.json({ 
            tokenNumber: nextToken, 
            orderNumber: orderNumber 
        }, { status: 200 });
        
    } catch (error) {
        console.error("RESERVE_TOKEN_ERROR:", error);
        return NextResponse.json({ error: "Failed to reserve token" }, { status: 500 });
    }
}
