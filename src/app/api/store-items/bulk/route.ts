import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    /* =====================
       AUTH
    ===================== */
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const items = body?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    /* =====================
       FETCH USER + ROLE
    ===================== */
    const user = await prisma.user.findUnique({
      where: { clerkId: effectiveId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 400 }
      );
    }

    const isAdmin = user.role === "ADMIN";

    /* =====================
       BULK INSERT
    ===================== */
    const result = await prisma.item.createMany({
      data: items.map((item: any) => ({
        /* REQUIRED */
        name: String(item.name || "").trim(),
        userId: user.id,

        // 🔐 ROLE RULE
        clerkId: isAdmin
          ? item.clerkId?.length
            ? item.clerkId
            : effectiveId
          : effectiveId,

        /* OPTIONAL */
        description: item.description ?? null,
        price:
          item.price != null ? Number(item.price) : null,
        sellingPrice:
          item.price != null ? Number(item.price) : null,
        gst: item.gst ?? null,
        unit: item.unit ?? null,
        barcode: item.barcode ?? null,
        imageUrl: item.imageUrl ?? null,
        image: item.imageUrl ?? null,
        categoryId: item.categoryId ?? null,
        isActive: item.isActive ?? true,
        zones: item.zones || [],
      })),
    });

    return NextResponse.json({
      success: true,
      insertedCount: result.count,
    });
  } catch (error) {
    console.error("BULK CREATE ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to save items",
        reason:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}
