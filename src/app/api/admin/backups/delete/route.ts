import { NextResponse } from "next/server";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function POST(req: Request) {
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

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Backup ID is required" }, { status: 400 });
    }

    // Find the backup record
    const backup = await prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    // Initialize S3 Client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    });

    const BUCKET_NAME = process.env.AWS_S3_BACKUP_BUCKET;

    // Delete from S3
    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `backups/${backup.filename}`,
      }));
      console.log(`🗑️ Deleted S3 object: backups/${backup.filename}`);
    } catch (s3Err) {
      console.error("Failed to delete from S3 (might already be gone):", s3Err);
      // We continue even if S3 delete fails (e.g. if file was already manually deleted)
    }

    // Delete from Database
    await prisma.backup.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Backup deleted successfully" 
    });

  } catch (err: any) {
    console.error("Backup deletion failed:", err);
    return NextResponse.json({ error: err.message || "Deletion failed" }, { status: 500 });
  }
}
