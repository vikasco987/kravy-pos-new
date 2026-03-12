import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function PUT(req: NextRequest) {
  try {
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, price, categoryId } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Menu id required" },
        { status: 400 }
      );
    }

    // ✅ Check ownership
    const existing = await prisma.item.findFirst({
      where: {
        id,
        clerkId: effectiveId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // ✅ Update menu item
    const updated = await prisma.item.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        price: price ?? existing.price,
        categoryId: categoryId ?? existing.categoryId,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Menu update error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
