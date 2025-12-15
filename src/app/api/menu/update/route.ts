import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, sellingPrice, unit, categoryId, imageUrl } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // ensure item belongs to user
    const existing = await prisma.item.findFirst({
      where: { id, clerkId: userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const updated = await prisma.item.update({
      where: { id },
      data: {
        name,
        sellingPrice,
        unit,
        categoryId: categoryId === "uncategorised" ? null : categoryId,
        imageUrl,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Menu update error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
