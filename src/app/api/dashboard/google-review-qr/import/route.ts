import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEffectiveClerkId } from '@/lib/auth-utils';

export async function POST(request: Request) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const profile = await prisma.businessProfile.findFirst({
            where: { userId: effectiveId }
        });

        if (!profile) {
            return NextResponse.json({ error: "Business profile not found" }, { status: 404 });
        }

        const body = await request.json();
        const { items } = body; // Expects array of { code, shopName, destinationUrl }

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "Invalid or empty items array" }, { status: 400 });
        }

        let updatedCount = 0;
        let notFoundCount = 0;

        // Perform sequential updates (or we could use bulk if we grouped, but sequential is fine for < 1000)
        for (const item of items) {
            const { code, shopName, destinationUrl } = item;
            if (!code) continue;

            const res = await prisma.googleReviewQR.updateMany({
                where: { 
                    code: code.trim(),
                    businessProfileId: profile.id
                },
                data: { 
                    shopName: shopName ? shopName.trim() : null, 
                    destinationUrl: destinationUrl ? destinationUrl.trim() : null
                }
            });

            if (res.count > 0) {
                updatedCount += res.count;
            } else {
                notFoundCount++;
            }
        }

        return NextResponse.json({ success: true, updatedCount, notFoundCount });

    } catch (error) {
        console.error("Error in bulk CSV import:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
