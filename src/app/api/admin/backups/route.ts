
import { NextResponse } from "next/server";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function GET() {
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

    const backupModel = (prisma as any).backup || (prisma as any).Backup;
    if (!backupModel) {
      return NextResponse.json([]); // Return empty list instead of crashing if model isn't ready
    }

    const backups = await backupModel.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(backups);
  } catch (err) {
    console.error("List Backups Error:", err);
    return NextResponse.json({ error: "Failed to list backups" }, { status: 500 });
  }
}
