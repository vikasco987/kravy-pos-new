import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function GET(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.item.findMany({
      where: { clerkId: effectiveId },
      include: { category: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("INVENTORY GET ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, currentStock, reorderLevel, openingStock } = body;

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const updated = await prisma.item.update({
      where: { id, clerkId: effectiveId },
      data: {
        currentStock: currentStock !== undefined ? Number(currentStock) : undefined,
        reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : undefined,
        openingStock: openingStock !== undefined ? Number(openingStock) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("INVENTORY UPDATE ERROR:", error);
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
  }
}
