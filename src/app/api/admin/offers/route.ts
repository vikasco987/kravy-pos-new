import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const offers = await prisma.offer.findMany({
            where: { clerkUserId: userId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(offers);
    } catch (error) {
        console.error("GET_OFFERS_ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const {
            title,
            description,
            code,
            discountType,
            discountValue,
            minOrderValue,
            maxDiscount,
            startDate,
            endDate,
            isActive,
        } = body;

        if (!title || !discountType || isNaN(discountValue)) {
            return NextResponse.json({ error: "Title, Discount Type and Value are required" }, { status: 400 });
        }

        const offer = await prisma.offer.create({
            data: {
                title,
                description,
                code: code || null,
                discountType,
                discountValue: parseFloat(discountValue),
                minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
                maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                isActive: isActive !== undefined ? isActive : true,
                clerkUserId: userId,
            },
        });

        return NextResponse.json(offer, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Coupon code must be unique" }, { status: 400 });
        }
        console.error("CREATE_OFFER_ERROR:", error);
        return NextResponse.json({ error: "Failed to create offer" }, { status: 500 });
    }
}

// PATCH — toggle isActive or update fields
export async function PATCH(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { id, isActive } = body;

        if (!id) return NextResponse.json({ error: "Offer id required" }, { status: 400 });

        const offer = await prisma.offer.update({
            where: { id },
            data: { isActive },
        });

        return NextResponse.json(offer);
    } catch (error) {
        console.error("PATCH_OFFER_ERROR:", error);
        return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
    }
}

// DELETE — remove an offer
export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "Offer id required" }, { status: 400 });

        await prisma.offer.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE_OFFER_ERROR:", error);
        return NextResponse.json({ error: "Failed to delete offer" }, { status: 500 });
    }
}
