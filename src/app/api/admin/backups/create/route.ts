import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { MongoClient } from "mongodb";
import { S3 } from "aws-sdk";
import { gzipSync } from "zlib";
import fs from "fs";
import path from "path";
import os from "os";

// Support maximum processing time on serverless environments
export const maxDuration = 60;

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const me = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (!me || me.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1. Fetch data directly via MongoDB native driver (JS only!)
    const mongoUri = process.env.DATABASE_URL;
    if (!mongoUri) {
      return NextResponse.json({ error: "DATABASE_URL not found" }, { status: 500 });
    }

    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db();

    const collections = await db.collections();
    const backupData: Record<string, any[]> = {};

    for (const collection of collections) {
      // Exclude system collections if any
      if (collection.collectionName.startsWith("system.")) continue;
      backupData[collection.collectionName] = await collection.find({}).toArray();
    }

    await client.close();

    // 2. Stringify and compress payload
    const backupString = JSON.stringify(backupData);
    const compressedBuffer = gzipSync(Buffer.from(backupString, "utf-8"));
    const timestamp = Date.now();
    const fileName = `kravy-backup-${timestamp}.json.gz`;

    // 3. Save purely locally (handles folder creation & permissions cross-platform securely)
    const backupDirPath = path.join(os.tmpdir(), "kravy-backups");
    if (!fs.existsSync(backupDirPath)) {
      fs.mkdirSync(backupDirPath, { recursive: true });
    }
    const localFilePath = path.join(backupDirPath, fileName);
    fs.writeFileSync(localFilePath, compressedBuffer);

    // 4. Upload directly to S3 if configured
    if (process.env.AWS_S3_BACKUP_BUCKET) {
      try {
        await s3
          .putObject({
            Bucket: process.env.AWS_S3_BACKUP_BUCKET,
            Key: fileName,
            Body: compressedBuffer,
            ContentType: "application/gzip",
          })
          .promise();
      } catch (s3Err) {
        console.error("S3 Upload Error:", s3Err);
        // Continue, as we have local backup saved successfully
      }
    }

    return NextResponse.json({ 
      success: true, 
      fileName, 
      size: (compressedBuffer.length / (1024 * 1024)).toFixed(2) + " MB",
      message: "Backup created successfully via NodeJS"
    });
  } catch (err: any) {
    console.error("Manual Backup failed:", err);
    return NextResponse.json({ error: "Backup process failed", details: err.message }, { status: 500 });
  }
}
