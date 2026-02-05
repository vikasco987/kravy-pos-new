import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    /* =====================
       AUTH
    ===================== */
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const items = body?.items;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    /* =====================
       FETCH USER + ROLE
    ===================== */
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 400 }
      );
    }

    const isAdmin = user.role === "ADMIN";
    let updatedCount = 0;

    /* =====================
       UPDATE LOOP
    ===================== */
    for (const item of items) {
      if (!item?.id || typeof item.id !== "string") {
        continue;
      }

      /* ---------------------
         FETCH EXISTING ITEM
      --------------------- */
      const existing = await prisma.item.findUnique({
        where: { id: item.id },
        select: { clerkId: true },
      });

      if (!existing) continue;

      // 🔐 NON-ADMIN CANNOT TOUCH OTHERS
      if (!isAdmin && existing.clerkId !== clerkId) {
        continue;
      }

      /* ---------------------
         BUILD UPDATE DATA
      --------------------- */
      const data: any = {
        name: String(item.name || "").trim(),
        price:
          item.price != null ? Number(item.price) : null,
        imageUrl: item.imageUrl ?? null,
        isActive: item.isActive ?? true,

        // 🔐 ROLE RULE
        clerkId: isAdmin
          ? item.clerkId?.length
            ? item.clerkId
            : existing.clerkId
          : clerkId,
      };

      /* ---------------------
         CATEGORY RELATION
      --------------------- */
      if (
        item.categoryId &&
        typeof item.categoryId === "string"
      ) {
        const categoryExists =
          await prisma.category.findUnique({
            where: { id: item.categoryId },
            select: { id: true },
          });

        data.category = categoryExists
          ? { connect: { id: item.categoryId } }
          : { disconnect: true };
      }

      await prisma.item.update({
        where: { id: item.id },
        data,
      });

      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      updatedCount,
    });
  } catch (error) {
    console.error("BULK UPDATE ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
