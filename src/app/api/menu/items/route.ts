//src/app/api/menu/items/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    // 1️⃣ Get logged-in Clerk user
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2️⃣ Fetch menu items for this clerk
    const items = await prisma.item.findMany({
      where: {
        clerkId: clerkId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        category: true,
      },
    });

    // 3️⃣ Return array directly (IMPORTANT)
    return NextResponse.json(items);
  } catch (error: any) {
  console.error("MENU VIEW ERROR:", error);
  return NextResponse.json(
    { 
      error: "Failed to fetch menu items",
      message: error?.message || "Unknown error"
    },
    { status: 500 }
  );
}
}
