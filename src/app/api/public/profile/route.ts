import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const clerkId = searchParams.get('clerkId');

        if (!clerkId) {
            return NextResponse.json({ error: "clerkId is required" }, { status: 400 });
        }

        const profile = await prisma.businessProfile.findUnique({
            where: { userId: clerkId },
            select: {
                businessName: true,
                businessTagLine: true,
                logoUrl: true,
                upi: true,
                businessAddress: true,
                contactPersonPhone: true
            }
        });

        return NextResponse.json(profile);
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}
