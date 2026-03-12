import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const combos = await prisma.combo.findMany({
            where: { clerkUserId: effectiveId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(combos);
    } catch (error) {
        console.error("GET_COMBOS_ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch combos" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { name, description, price, imageUrl, selections, isActive } = body;

        if (!name || isNaN(price)) {
            return NextResponse.json({ error: "Name and Price are required" }, { status: 400 });
        }

        const combo = await prisma.combo.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                imageUrl,
                selections: selections || [],
                isActive: isActive !== undefined ? isActive : true,
                clerkUserId: effectiveId,
            },
        });

        return NextResponse.json(combo, { status: 201 });
    } catch (error) {
        console.error("CREATE_COMBO_ERROR:", error);
        return NextResponse.json({ error: "Failed to create combo" }, { status: 500 });
    }
}
