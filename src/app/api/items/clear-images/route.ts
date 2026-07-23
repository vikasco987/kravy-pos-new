import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.item.updateMany({
      where: { clerkId: effectiveId },
      data: { imageUrl: null }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST /api/items/clear-images error:", err);
    return NextResponse.json(
      { error: "Failed to clear images" },
      { status: 500 }
    );
  }
}
