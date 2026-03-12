import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function GET() {
  try {
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json([], { status: 401 });
    }

    // Find all users belonging to this business (Seller + Staff)
    const businessUsers = await (prisma.user as any).findMany({
      where: {
        OR: [
          { clerkId: effectiveId },
          { ownerId: effectiveId }
        ]
      },
      select: { id: true }
    });

    const userIds = businessUsers.map((u: any) => u.id);

    const logs = await prisma.activityLog.findMany({
      where: { userId: { in: userIds } },
      include: { 
        user: { 
          select: { name: true, role: true } 
        } 
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("ACTIVITY LIST ERROR:", error);
    return NextResponse.json([], { status: 500 });
  }
}
