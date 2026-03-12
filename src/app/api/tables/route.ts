import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const tables = await prisma.table.findMany({
            where: { clerkUserId: effectiveId },
            orderBy: { name: "asc" },
            // qrUrl is included automatically
        });
        return NextResponse.json(tables);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { name } = await req.json();
        if (!name) return NextResponse.json({ error: "Table name is required" }, { status: 400 });

        // create the record first so we know the generated id
        const table = await prisma.table.create({
            data: {
                name,
                clerkUserId: effectiveId,
            },
        });

        // compute menu link and qr url using the Seller's ID (effectiveId)
        const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";
        const menuUrl = `${origin}/menu/${effectiveId}?tableId=${encodeURIComponent(table.id)}&tableName=${encodeURIComponent(name)}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(menuUrl)}`;

        const updated = await prisma.table.update({
            where: { id: table.id },
            data: { qrUrl },
        });

        return NextResponse.json(updated, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create table" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Table ID required" }, { status: 400 });

        await prisma.table.delete({
            where: { id, clerkUserId: effectiveId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete table" }, { status: 500 });
    }
}
