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
        
        let nextToken = 1;
        if (lastTokenDate === today) {
            nextToken = (latestProfile.lastTokenNumber || 0) + 1;
        }

        // 2. Atomically update Profile for Token AND BillCounter
        const updatedProfile = await prisma.businessProfile.update({
            where: { id: latestProfile.id },
            data: {
                lastTokenNumber: nextToken,
                lastTokenDate: new Date(),
                billCounter: { increment: 1 }
            },
            select: { billCounter: true }
        });

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
