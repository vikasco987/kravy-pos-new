import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // ✅ Correct auth method when proxy.ts includes /api
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ Fetch menu items for this clerk user
    const items = await prisma.item.findMany({
      where: {
        clerkId: clerkId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Menu view error:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu" },
      { status: 500 }
    );
  }
}
