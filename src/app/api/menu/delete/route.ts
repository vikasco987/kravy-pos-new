import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    // ✅ App Router auth (correct)
    const session = await await auth();
    const userId = session.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Read body
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Item id required" },
        { status: 400 }
      );
    }

    // ✅ Check ownership
    const existing = await prisma.item.findFirst({
      where: {
        id,
        clerkId: userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // ✅ Delete item
    await prisma.item.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Menu delete error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
