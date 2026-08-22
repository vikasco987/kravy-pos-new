import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function PUT(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body || !Array.isArray(body.categoryIds)) {
      return NextResponse.json({ error: "Invalid payload. Expected categoryIds array." }, { status: 400 });
    }

    const { categoryIds } = body;

    // We will update each category with its index as sortOrder (1-based)
    const updates = categoryIds.map((id: string, index: number) => {
      return prisma.category.updateMany({
        where: { id, clerkId: effectiveId },
        data: { sortOrder: index + 1 },
      });
    });

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true, message: "Categories reordered successfully." });
  } catch (error) {
    console.error("PUT /api/categories/order error:", error);
    return NextResponse.json({ error: "Failed to reorder categories" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  // Use DELETE to reset sort order to null
  try {
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.category.updateMany({
      where: { clerkId: effectiveId },
      data: { sortOrder: null },
    });

    return NextResponse.json({ success: true, message: "Category order reset to default." });
  } catch (error) {
    console.error("DELETE /api/categories/order error:", error);
    return NextResponse.json({ error: "Failed to reset categories" }, { status: 500 });
  }
}
