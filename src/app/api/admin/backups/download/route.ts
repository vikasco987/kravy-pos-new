import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("file"); 

    if (!fileName) {
      return NextResponse.json({ error: "File name is required" }, { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BACKUP_BUCKET!,
      Key: `backups/${fileName}`,
    });

    const url = await getSignedUrl(s3Client, command, { 
      expiresIn: Number(process.env.PRE_SIGNED_URL_EXPIRY || 600) 
    });

    return NextResponse.json({ url });
  } catch (err) {
    console.error("S3 Download Error:", err);
    return NextResponse.json({ error: "Failed to generate download link" }, { status: 500 });
  }
}
