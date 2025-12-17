import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // ✅ Auth
    const session = await auth();
    const clerkUserId = session.userId;

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Body
    const body = await req.json();
    const { itemId, quantity, price } = body;

    if (!itemId || !quantity || !price) {
      return NextResponse.json(
        { error: "itemId, quantity and price are required" },
        { status: 400 }
      );
    }

    // ✅ Find user
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // ✅ Ensure item exists
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // ✅ Calculate total (single item)
    const total = quantity * price;

    // ✅ Create purchase
    const purchase = await prisma.purchase.create({
      data: {
        userId: clerkUserId,
        itemId,
        quantity,
        price,
        total,
      },
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error("PURCHASE CREATE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create purchase" },
      { status: 500 }
    );
  }
}
