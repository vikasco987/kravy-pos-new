import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const { userId: clerkId } = getAuth(req);

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

    let updatedCount = 0;

    for (const item of items) {
if (!item?.id || typeof item.id !== "string") {
  console.warn("SKIPPING INVALID ITEM:", item);
  continue;
}

      const data: any = {
        name: item.name,
        price: item.price ?? null,
        imageUrl: item.imageUrl ?? null,
        // isActive: item.isActive ?? true,
        clerkId: item.clerkId ?? clerkId,
      
      };

      // ✅ CORRECT RELATION UPDATE (NO categoryId HERE)
    if (item.categoryId && typeof item.categoryId === "string") {
  const categoryExists = await prisma.category.findUnique({
    where: { id: item.categoryId },
    select: { id: true },
  });

  if (categoryExists) {
    data.category = {
      connect: { id: item.categoryId },
    };
  } else {
    console.warn(
      "CATEGORY NOT FOUND, DISCONNECTING:",
      item.categoryId
    );

    data.category = {
      disconnect: true,
    };
  }
}


     console.log("UPDATING ITEM:", {
  id: item.id,
  name: item.name,
  categoryId: item.categoryId,
  clerkId: item.clerkId,
});

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
