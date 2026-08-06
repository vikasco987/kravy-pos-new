import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEffectiveClerkId } from '@/lib/auth-utils';

function generateShortCode(length: number = 6): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars like I, 1, O, 0
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function GET(request: Request) {
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

        const qrs = await prisma.googleReviewQR.findMany({
            where: { businessProfileId: profile.id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ qrs });

    } catch (error) {
        console.error("Error fetching Google Review QRs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

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
        const count = body.count ? parseInt(body.count, 10) : 100;

        if (isNaN(count) || count <= 0 || count > 1000) {
            return NextResponse.json({ error: "Invalid count. Must be between 1 and 1000." }, { status: 400 });
        }

        const newQRs = [];
        
        // Generate unique codes safely
        for (let i = 0; i < count; i++) {
            let code = generateShortCode();
            // Optional: While collision probability is extremely low, we can just insert and ignore collisions 
            // by using Prisma's createMany if it supported `skipDuplicates`. But since we want to be safe:
            newQRs.push({
                code,
                businessProfileId: profile.id
            });
        }

        // Insert in bulk
        const result = await prisma.googleReviewQR.createMany({
            data: newQRs
        });

        return NextResponse.json({ success: true, count: result.count });

    } catch (error) {
        console.error("Error generating Google Review QRs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { id, shopName, destinationUrl } = body;

        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const profile = await prisma.businessProfile.findFirst({
            where: { userId: effectiveId }
        });
        if (!profile) return NextResponse.json({ error: "Business profile not found" }, { status: 404 });

        const updatedQR = await prisma.googleReviewQR.updateMany({
            where: { id, businessProfileId: profile.id },
            data: { shopName, destinationUrl }
        });

        if (updatedQR.count === 0) return NextResponse.json({ error: "QR not found or not owned by you" }, { status: 404 });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error updating Google Review QR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const profile = await prisma.businessProfile.findFirst({
            where: { userId: effectiveId }
        });
        if (!profile) return NextResponse.json({ error: "Business profile not found" }, { status: 404 });

        const deleted = await prisma.googleReviewQR.deleteMany({
            where: { id, businessProfileId: profile.id }
        });

        if (deleted.count === 0) return NextResponse.json({ error: "QR not found or not owned by you" }, { status: 404 });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error deleting Google Review QR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
