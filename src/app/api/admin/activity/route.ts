import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { userId } = await auth(); // ✅ FIX

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

    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since");

    const logs = await prisma.activityLog.findMany({
      where: since
        ? { createdAt: { gt: new Date(since) } }
        : {},
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: {
          select: { name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("ADMIN ACTIVITY LIST ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load activity logs" },
      { status: 500 }
    );
  }
}
