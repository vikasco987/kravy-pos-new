import { NextResponse } from "next/server";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { runMongoBackup } from "@/lib/backup/mongodb-backup";

export async function GET(req: Request) {
  try {
    const userId = await getEffectiveClerkId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Allow any admin/manager/owner, or just rely on middleware
    const backups = await prisma.backup.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    
    return NextResponse.json(backups);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getEffectiveClerkId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Run backup asynchronously (fire and forget)
    // We don't await this so the UI gets an immediate response
    runMongoBackup().catch(err => console.error("Backup failed:", err));
    
    return NextResponse.json({ success: true, message: "Backup started successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
