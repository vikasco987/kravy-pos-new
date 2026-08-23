import { NextResponse } from "next/server";
import { runMongoBackup } from "@/lib/backup/mongodb-backup";

export const dynamic = "force-dynamic"; // Ensure it's not cached

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");

    const CRON_SECRET = process.env.CRON_SECRET || "kravy-pos-cron-secret-123";

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
    }

    // Run backup asynchronously (fire and forget)
    // We don't await this so the cron caller gets an immediate response and doesn't timeout
    runMongoBackup().catch(err => console.error("Cron Backup failed:", err));

    return NextResponse.json({ 
      success: true, 
      message: "Cron Backup started successfully" 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
