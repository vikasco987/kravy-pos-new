// src/app/api/admin/users/disable/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // 1️⃣ Auth check (App Router)
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2️⃣ Verify ADMIN from DB
    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // 3️⃣ Parse request body
    const body = await req.json();
    const { targetUserId, disable } = body;

    if (
      typeof targetUserId !== "string" ||
      typeof disable !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // 4️⃣ Find target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // ❌ Prevent admin disabling self
    if (targetUser.clerkId === userId) {
      return NextResponse.json(
        { error: "You cannot disable your own account" },
        { status: 400 }
      );
    }

    // 5️⃣ Disable / enable user in Clerk (metadata-based)
    await clerkClient.users.updateUser(targetUser.clerkId, {
      publicMetadata: {
        disabled: disable,
      },
    });

    // 6️⃣ Force logout if disabling
    if (disable) {
      const sessions = await clerkClient.sessions.getSessionList({
        userId: targetUser.clerkId,
      });

      await Promise.all(
        sessions.data.map((s) =>
          clerkClient.sessions.revokeSession(s.id)
        )
      );
    }

    // 7️⃣ Update DB status
    await prisma.user.update({
      where: { id: targetUserId },
      data: { isDisabled: disable },
    });

    // 8️⃣ Activity log
    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: disable ? "USER_DISABLED" : "USER_ENABLED",
        meta: `${disable ? "Disabled" : "Enabled"} ${targetUser.email}`,
      },
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("ENABLE/DISABLE USER ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    );
  }
}
