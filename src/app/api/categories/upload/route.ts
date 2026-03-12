// import { NextRequest, NextResponse } from "next/server";
// import cloudinary from "@/lib/cloudinary"; // use alias
// import prisma from "@/lib/prisma";

// export async function POST(req: NextRequest) {
//   try {
//     const formData = await req.formData();
//     const file = formData.get("file") as File | null;
//     const text = formData.get("text") as string;

//     if (!file) {
//       return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
//     }

//     // 🔎 Debug Cloudinary env vars
//     console.log("✅ Cloudinary config", {
//       CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
//       CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? "Loaded" : "❌ Missing",
//       CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? "Loaded" : "❌ Missing",
//     });

//     // Convert file → Buffer
//     const arrayBuffer = await file.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);

//     // Upload to Cloudinary
//     const uploadResponse = await new Promise<any>((resolve, reject) => {
//       cloudinary.uploader
//         .upload_stream({ folder: "my_uploads" }, (error, result) => {
//           if (error) reject(error);
//           else resolve(result);
//         })
//         .end(buffer);
//     });

//     // Save to DB
//     const saved = await prisma.upload.create({
//       data: {
//         text,
//         imageUrl: uploadResponse.secure_url,
//       },
//     });

//     return NextResponse.json(saved, { status: 200 });
//   } catch (err: any) {
//     console.error("❌ Upload API error:", err);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }












import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import cloudinary from "@/lib/cloudinary"; 


export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const text = formData.get("text") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // ✅ Get effective clerk ID
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Debug Cloudinary config
    console.log("✅ Cloudinary config", {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? "Loaded" : "❌ Missing",
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? "Loaded" : "❌ Missing",
    });

    // Convert file → Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const uploadResponse = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "my_uploads" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        })
        .end(buffer);
    });

    // ✅ Save to DB with user relation
    const saved = await prisma.upload.create({
      data: {
        imageUrl: uploadResponse.secure_url,
        user: { connect: { clerkId: effectiveId } },
      },
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (err: any) {
    console.error("❌ Upload API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
