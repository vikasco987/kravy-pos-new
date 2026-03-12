// import { NextResponse } from "next/server";
// import cloudinary from "@/lib/cloudinary";

// export async function POST(req: Request) {
//   try {
//     const formData = await req.formData();
//     const file = formData.get("file") as File;

//     if (!file) {
//       return NextResponse.json({ error: "No file provided" }, { status: 400 });
//     }

//     // Convert file to buffer
//     const bytes = await file.arrayBuffer();
//     const buffer = Buffer.from(bytes);

//     // Upload to Cloudinary
//     const uploadResult: any = await new Promise((resolve, reject) => {
//       const stream = cloudinary.uploader.upload_stream(
//         {
//           folder: "uploads",       // optional folder
//           upload_preset: "mybillingmenu", // unsigned preset
//         },
//         (error, result) => {
//           if (error) reject(error);
//           else resolve(result);
//         }
//       );
//       stream.end(buffer);
//     });

//     // Only return the URL
//     return NextResponse.json({ url: uploadResult.secure_url });
//   } catch (err: any) {
//     console.error("Upload error:", err);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }







// import { NextResponse } from "next/server";
// import cloudinary from "@/lib/cloudinary";

// export async function POST(req: Request) {
//   try {
//     const formData = await req.formData();
//     const file = formData.get("file") as File;

//     if (!file) {
//       return NextResponse.json({ error: "No file provided" }, { status: 400 });
//     }

//     // Convert file to buffer
//     const bytes = await file.arrayBuffer();
//     const buffer = Buffer.from(bytes);

//     // Upload to Cloudinary
//     const uploadResult: any = await new Promise((resolve, reject) => {
//       const stream = cloudinary.uploader.upload_stream(
//         {
//           folder: "uploads",             // optional folder
//           upload_preset: "mybillingmenu" // unsigned preset
//         },
//         (error, result) => {
//           if (error) return reject(error);
//           if (!result?.secure_url) return reject(new Error("No secure_url returned"));
//           return resolve(result);
//         }
//       );
//       stream.end(buffer);
//     });

//     // ✅ Always return { secure_url }
//     return NextResponse.json({ secure_url: uploadResult.secure_url });

//   } catch (err: any) {
//     console.error("Upload error:", err);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }












import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "uploads",           // optional folder
          upload_preset: "mybillingmenu" // unsigned preset
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result?.secure_url) return reject(new Error("No secure_url returned"));
          return resolve(result);
        }
      );
      stream.end(buffer);
    });

    // 1. Log it on the backend before sending response
    console.log("✅ Uploaded image URL:", uploadResult.secure_url);

    // ✅ Always return { secure_url }
    return NextResponse.json({ secure_url: uploadResult.secure_url });

  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}