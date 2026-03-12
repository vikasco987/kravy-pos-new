import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function GET(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const me = await prisma.user.findUnique({
      where: { clerkId: effectiveId },
      select: { role: true },
    });

    if (!me || me.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      // 🔴 IMPORTANT: NO take, NO skip
      select: {
        clerkId: true,
        email: true,
        name: true,
      },
      orderBy: {
        email: "asc",
      },
    });

    const clerks = users
      .filter((u) => u.clerkId) // safety
      .map((u) => ({
        clerkId: u.clerkId,
        label: u.name?.trim() || u.email,
        email: u.email,
      }));

    return NextResponse.json(clerks);
  } catch (error) {
    console.error("CLERKS FETCH ERROR:", error);
    return NextResponse.json([], { status: 200 });
  }
}
