import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // 🔐 Clerk auth (App Router safe)
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    // 1️⃣ Find internal DB user
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User record not found for this clerk" },
        { status: 400 }
      );
    }

    // 2️⃣ Bulk insert items
    const result = await prisma.item.createMany({
      data: items.map((item: any) => ({
        // required
        name: item.name,
        userId: user.id,          // Mongo ObjectId (string)
        clerkId:
      item.clerkId && item.clerkId.length > 0  // ✅ FIX: respect row-level clerk selection
        ? item.clerkId
        : clerkId,     

        // optional
        description: item.description ?? null,
        price: item.price ? Number(item.price) : null,
        sellingPrice: item.price ? Number(item.price) : null,
        gst: item.gst ?? null,
        unit: item.unit ?? null,
        barcode: item.barcode ?? null,
        imageUrl: item.imageUrl ?? null,
        categoryId: item.categoryId ?? null,

        isActive: item.isActive ?? true,
      })),
    });

    return NextResponse.json({
      success: true,
      insertedCount: result.count,
    });
  } catch (err) {
    console.error("ITEM BULK SAVE ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
