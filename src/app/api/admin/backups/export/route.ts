
import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import * as XLSX from "xlsx";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

const uri = process.env.DATABASE_URL;

export async function GET(req: NextRequest) {
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
    const format = searchParams.get("format"); 
    const collectionName = searchParams.get("model");
    const fileName = searchParams.get("file");

    if (!collectionName || !uri) return NextResponse.json({ error: "Missing params" }, { status: 400 });

    let data: any[] = [];

    if (fileName) {
      // 1. Fetch from S3
      const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
      const zlib = await import("zlib");
      const { BSON } = await import("mongodb");

      const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'ap-south-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
      });

      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BACKUP_BUCKET!,
        Key: `backups/${fileName}`,
      });

      const response = await s3Client.send(command);
      const bodyBuffer = Buffer.from(await response.Body!.transformToByteArray());
      const decompressed = zlib.gunzipSync(bodyBuffer);
      const backupData = BSON.EJSON.parse(decompressed.toString()) as Record<string, any[]>;
      data = backupData[collectionName] || [];
    } else {
      // 2. Fetch from Live DB
      const client = new MongoClient(uri);
      await client.connect();
      data = await client.db().collection(collectionName).find({}).toArray();
      await client.close();
    }

    // Cleaning data (_id ko string mein badalna)
    const cleanedData = data.map(item => ({ 
      ...item, 
      _id: item._id?.toString(),
      createdAt: item.createdAt?.toISOString ? item.createdAt.toISOString() : item.createdAt,
      updatedAt: item.updatedAt?.toISOString ? item.updatedAt.toISOString() : item.updatedAt
    }));

    if (format === "excel") {
      const worksheet = XLSX.utils.json_to_sheet(cleanedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, collectionName);
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=kravy_${collectionName}_${new Date().toISOString().split('T')[0]}.xlsx`,
        },
      });
    }

    // Default JSON Export
    return new NextResponse(JSON.stringify(cleanedData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename=kravy_${collectionName}_${new Date().toISOString().split('T')[0]}.json`,
      },
    });
  } catch (error) {
    console.error("Export API Error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
