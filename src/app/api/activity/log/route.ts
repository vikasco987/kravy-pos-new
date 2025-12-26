import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, meta } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    // IMPORTANT: find DB user first
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "DB user not found" },
        { status: 404 }
      );
    }

    const log = await prisma.activityLog.create({
      data: {
        userId: dbUser.id,
        action,
        meta,
      },
    });

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error("ACTIVITY LOG ERROR:", error);
    return NextResponse.json(
      { error: "Failed to log activity" },
      { status: 500 }
    );
  }
}
