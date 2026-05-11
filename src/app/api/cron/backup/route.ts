import { NextResponse } from "next/server";
import { runMongoBackup } from "@/lib/backup/mongodb-backup";

// Allow up to 5 minutes for the backup process
export const maxDuration = 300; 

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const authHeader = req.headers.get("authorization");
    const secretKey = url.searchParams.get("key");

    const validSecret = process.env.CRON_SECRET;

    // Authorize via Bearer token OR query parameter 'key'
    const isAuthorized = 
      (authHeader && authHeader === `Bearer ${validSecret}`) ||
      (secretKey && secretKey === validSecret);

    if (!validSecret || !isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename, size } = await runMongoBackup();

    return NextResponse.json({ 
      success: true, 
      fileName: filename, 
      size: (size / (1024 * 1024)).toFixed(2) + " MB",
      message: "Automated backup completed successfully"
    });
  } catch (err: any) {
    console.error("Cron Backup failed:", err);
    return NextResponse.json({ error: err.message || "Backup process failed" }, { status: 500 });
  }
}
