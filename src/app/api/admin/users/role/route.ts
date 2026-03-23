import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (!me || me.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { targetUserId, role } = await req.json();

    if (!["USER", "SELLER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Update DB
    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
    });

    // ✅ ALSO UPDATE CLERK (IMPORTANT: Sync issue fix)
    const client = await clerkClient();
    await client.users.updateUser(updated.clerkId, {
      publicMetadata: {
        role,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}
