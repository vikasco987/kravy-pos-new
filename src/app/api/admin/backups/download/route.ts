import { S3 } from "aws-sdk";
import { NextResponse } from "next/server";

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get("file"); 

  if (!fileName) {
    return NextResponse.json({ error: "File name is required" }, { status: 400 });
  }

  try {
    const url = s3.getSignedUrl("getObject", {
      Bucket: process.env.AWS_S3_BACKUP_BUCKET!,
      Key: fileName,
      Expires: Number(process.env.PRE_SIGNED_URL_EXPIRY || 600), // default 10 min
    });

    return NextResponse.json({ url });
  } catch (err) {
    console.error("S3 GetSignedUrl Error:", err);
    return NextResponse.json({ error: "Failed to generate download link" }, { status: 500 });
  }
}
