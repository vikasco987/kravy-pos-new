
import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import zlib from "zlib";
import { BSON } from "mongodb";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

/**
 * API to inspect the contents of a specific backup file on S3
 */
export async function GET(req: NextRequest) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const me = await prisma.user.findUnique({
      where: { clerkId: effectiveId },
      select: { role: true },
    });

    if (!me || me.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("file");

    if (!fileName) return NextResponse.json({ error: "File name is required" }, { status: 400 });

    // 1. Fetch from S3
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BACKUP_BUCKET!,
      Key: `backups/${fileName}`,
    });

    const response = await s3Client.send(command);
    const bodyBuffer = Buffer.from(await response.Body!.transformToByteArray());

    // 2. Decompress
    const decompressed = zlib.gunzipSync(bodyBuffer);
    
    // 3. Parse EJSON
    const backupData = BSON.EJSON.parse(decompressed.toString());

    // 4. Summarize collections
    const collections = Object.keys(backupData).map(name => ({
      name,
      count: Array.isArray(backupData[name]) ? backupData[name].length : 0
    }));

    collections.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      fileName,
      collections
    });

  } catch (error: any) {
    console.error("Backup Inspect Error:", error);
    return NextResponse.json({ error: "Failed to inspect backup: " + error.message }, { status: 500 });
  }
}
