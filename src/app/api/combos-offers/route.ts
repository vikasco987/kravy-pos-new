import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

// NOTE: Combo model uses `selections` (Json field) NOT a relational `items`.
// This route works with that Json-based structure.

export async function GET(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type"); // 'combo' or 'offer'

        if (type === "combo") {
            const combos = await prisma.combo.findMany({
                where: { clerkUserId: effectiveId },
                orderBy: { createdAt: "desc" },
            });
            return NextResponse.json(combos);
        }

        if (type === "offer") {
            const offers = await prisma.offer.findMany({
                where: { clerkUserId: effectiveId },
                orderBy: { createdAt: "desc" },
            });
            return NextResponse.json(offers);
        }

        return NextResponse.json({ error: "Type parameter required" }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { type, ...data } = body;

        if (type === "combo") {
            const { name, description, price, selections, imageUrl, isActive } = data;

            const combo = await prisma.combo.create({
                data: {
                    name,
                    description,
                    price: parseFloat(price),
                    imageUrl: imageUrl || null,
                    isActive: isActive !== false,
                    clerkUserId: effectiveId,
                    selections: selections ?? [],
                },
            });

            return NextResponse.json(combo, { status: 201 });
        }

        if (type === "offer") {
            const { title, description, discountType, discountValue, minOrderValue, maxDiscount, isActive, code } = data;

            const offer = await prisma.offer.create({
                data: {
                    title,
                    description,
                    code: code || null,
                    discountType,
                    discountValue: parseFloat(discountValue),
                    minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
                    maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
                    isActive: isActive !== false,
                    clerkUserId: effectiveId,
                },
            });

            return NextResponse.json(offer, { status: 201 });
        }

        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    } catch (error) {
        console.error("Error creating combo/offer:", error);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { type, id, ...updateData } = body;

        if (type === "combo") {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { items, ...safeUpdate } = updateData; // strip any stray `items` key
            const combo = await prisma.combo.update({
                where: { id, clerkUserId: effectiveId },
                data: safeUpdate,
            });
            return NextResponse.json(combo);
        }

        if (type === "offer") {
            const offer = await prisma.offer.update({
                where: { id, clerkUserId: effectiveId },
                data: updateData,
            });
            return NextResponse.json(offer);
        }

        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");
        const id = searchParams.get("id");

        if (!type || !id) {
            return NextResponse.json({ error: "Type and ID required" }, { status: 400 });
        }

        if (type === "combo") {
            await prisma.combo.delete({ where: { id, clerkUserId: effectiveId } });
        } else if (type === "offer") {
            await prisma.offer.delete({ where: { id, clerkUserId: effectiveId } });
        } else {
            return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
