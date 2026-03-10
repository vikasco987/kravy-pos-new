import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/public/loyalty?phone=<phone>&clerkUserId=<clerkUserId>
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const phone = searchParams.get("phone");
        const clerkUserId = searchParams.get("clerkUserId");

        if (!phone || !clerkUserId) {
            return NextResponse.json({ error: "Phone and Clerk ID required" }, { status: 400 });
        }

        const party = await prisma.party.findUnique({
            where: {
                phone_createdBy: {
                    phone,
                    createdBy: clerkUserId
                }
            }
        });

        if (!party) {
            return NextResponse.json({ loyaltyPoints: 0, newCustomer: true });
        }

        return NextResponse.json({
            loyaltyPoints: party.loyaltyPoints || 0,
            name: party.name,
            newCustomer: false
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch loyalty" }, { status: 500 });
    }
}

// POST /api/public/loyalty/redeem
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { phone, clerkUserId, pointsToRedeem } = body;

        const party = await prisma.party.findUnique({
            where: { phone_createdBy: { phone, createdBy: clerkUserId } }
        });

        if (!party || (party.loyaltyPoints || 0) < pointsToRedeem) {
            return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
        }

        const updated = await prisma.party.update({
            where: { id: party.id },
            data: {
                loyaltyPoints: { decrement: pointsToRedeem }
            }
        });

        return NextResponse.json({ success: true, balance: updated.loyaltyPoints });
    } catch (error) {
        return NextResponse.json({ error: "Failed to redeem points" }, { status: 500 });
    }
}
