// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";

// // ✅ Create new profile
// export async function POST(req: Request) {
//   try {
//     const body = await req.json();

//     const profile = await prisma.form.create({
//       data: {
//         title: "Business Profile",
//         fields: {
//           create: [
//             { label: "Business Type", type: "SELECT", value: body.businessType },
//             { label: "Business Name", type: "INPUT", value: body.businessName },
//             { label: "Tagline", type: "INPUT", value: body.businessTagline },
//             { label: "Contact Person Name", type: "INPUT", value: body.contactName },
//             { label: "Phone", type: "INPUT", value: body.contactPhone },
//             { label: "Email", type: "INPUT", value: body.contactEmail },
//             { label: "UPI", type: "INPUT", value: body.upi },
//             { label: "Google Review Link", type: "INPUT", value: body.reviewLink },
//             { label: "Custom Field", type: "INPUT", value: body.customField },
//             { label: "Signature", type: "FILE", fileUrl: body.signature },
//             { label: "Logo", type: "FILE", fileUrl: body.logo },
//           ],
//         },
//       },
//       include: { fields: true },
//     });

//     return NextResponse.json(profile, { status: 201 });
//   } catch (err: any) {
//     console.error("Profile save error:", err);
//     return NextResponse.json(
//       { error: "Failed to save profile", details: err.message },
//       { status: 500 }
//     );
//   }
// }

// // ✅ Fetch latest profile
// export async function GET() {
//   try {
//     const profile = await prisma.form.findFirst({
//       orderBy: { createdAt: "desc" },
//       include: { fields: true },
//     });

//     if (!profile) {
//       return NextResponse.json(
//         { message: "No profile found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(profile, { status: 200 });
//   } catch (err: any) {
//     console.error("Profile fetch error:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch profile", details: err.message },
//       { status: 500 }
//     );
//   }
// }












// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();

//     // ---- VALIDATION ----
//     if (!body.businessType) {
//       return NextResponse.json(
//         { error: "Business Type is required" },
//         { status: 400 }
//       );
//     }
//     if (!body.businessName) {
//       return NextResponse.json(
//         { error: "Business Name is required" },
//         { status: 400 }
//       );
//     }
//     if (!body.contactName) {
//       return NextResponse.json(
//         { error: "Contact Person Name is required" },
//         { status: 400 }
//       );
//     }
//     if (!body.contactPhone) {
//       return NextResponse.json(
//         { error: "Phone number is required" },
//         { status: 400 }
//       );
//     }
//     if (!body.contactEmail) {
//       return NextResponse.json(
//         { error: "Email is required" },
//         { status: 400 }
//       );
//     }

//     // ---- CREATE FORM ----
//     const profile = await prisma.form.create({
//       data: {
//         title: "Business Profile",
//         fields: {
//           create: [
//             {
//               label: "Business Type",
//               type: "SELECT",
//               value: body.businessType,
//               options: [],
//             },
//             {
//               label: "Business Name",
//               type: "INPUT",
//               value: body.businessName,
//               options: [],
//             },
//             {
//               label: "Tagline",
//               type: "INPUT",
//               value: body.businessTagline || "",
//               options: [],
//             },
//             {
//               label: "Contact Person Name",
//               type: "INPUT",
//               value: body.contactName,
//               options: [],
//             },
//             {
//               label: "Phone",
//               type: "INPUT",
//               value: body.contactPhone,
//               options: [],
//             },
//             {
//               label: "Email",
//               type: "INPUT",
//               value: body.contactEmail,
//               options: [],
//             },
//             {
//               label: "UPI",
//               type: "INPUT",
//               value: body.upi || "",
//               options: [],
//             },
//             {
//               label: "Google Review Link",
//               type: "INPUT",
//               value: body.reviewLink || "",
//               options: [],
//             },
//             {
//               label: "Custom Field",
//               type: "INPUT",
//               value: body.customField || "",
//               options: [],
//             },
//             {
//               label: "Signature",
//               type: "FILE",
//               fileUrl: body.signature || "",
//               options: [],
//             },
//             {
//               label: "Logo",
//               type: "FILE",
//               fileUrl: body.logo || "",
//               options: [],
//             },
//           ],
//         },
//       },
//       include: { fields: true },
//     });

//     return NextResponse.json(profile, { status: 201 });
//   } catch (err: any) {
//     console.error("Profile save error:", err);

//     // Prisma-specific error handling
//     if (err.code === "P2002") {
//       return NextResponse.json(
//         { error: "Duplicate entry detected" },
//         { status: 409 }
//       );
//     }

//     return NextResponse.json(
//       { error: "Failed to save profile", details: err.message },
//       { status: 500 }
//     );
//   }
// }



// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { currentUser } from "@clerk/nextjs/server"; // ✅ import Clerk

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();

//     // ---- GET LOGGED IN USER ----
//     const user = await currentUser();
//     if (!user?.id) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     // ---- VALIDATION ----
//     if (!body.businessType) {
//       return NextResponse.json(
//         { error: "Business Type is required" },
//         { status: 400 }
//       );
//     }
//     if (!body.businessName) {
//       return NextResponse.json(
//         { error: "Business Name is required" },
//         { status: 400 }
//       );
//     }
//     if (!body.contactName) {
//       return NextResponse.json(
//         { error: "Contact Person Name is required" },
//         { status: 400 }
//       );
//     }
//     if (!body.contactPhone) {
//       return NextResponse.json(
//         { error: "Phone number is required" },
//         { status: 400 }
//       );
//     }
//     if (!body.contactEmail) {
//       return NextResponse.json(
//         { error: "Email is required" },
//         { status: 400 }
//       );
//     }

//     // ---- CREATE FORM ----
//     const profile = await prisma.form.create({
//       data: {
//         title: "Business Profile",
//         userId: user.id, // ✅ FIX: link form to current user (clerkId)

//         fields: {
//           create: [
//             {
//               label: "Business Type",
//               type: "SELECT",
//               value: body.businessType,
//               options: [],
//             },
//             {
//               label: "Business Name",
//               type: "INPUT",
//               value: body.businessName,
//               options: [],
//             },
//             {
//               label: "Tagline",
//               type: "INPUT",
//               value: body.businessTagline || "",
//               options: [],
//             },
//             {
//               label: "Contact Person Name",
//               type: "INPUT",
//               value: body.contactName,
//               options: [],
//             },
//             {
//               label: "Phone",
//               type: "INPUT",
//               value: body.contactPhone,
//               options: [],
//             },
//             {
//               label: "Email",
//               type: "INPUT",
//               value: body.contactEmail,
//               options: [],
//             },
//             {
//               label: "UPI",
//               type: "INPUT",
//               value: body.upi || "",
//               options: [],
//             },
//             {
//               label: "Google Review Link",
//               type: "INPUT",
//               value: body.reviewLink || "",
//               options: [],
//             },
//             {
//               label: "Custom Field",
//               type: "INPUT",
//               value: body.customField || "",
//               options: [],
//             },
//             {
//               label: "Signature",
//               type: "FILE",
//               fileUrl: body.signature || "",
//               options: [],
//             },
//             {
//               label: "Logo",
//               type: "FILE",
//               fileUrl: body.logo || "",
//               options: [],
//             },
//           ],
//         },
//       },
//       include: { fields: true },
//     });

//     return NextResponse.json(profile, { status: 201 });
//   } catch (err: any) {
//     console.error("Profile save error:", err);

//     // Prisma-specific error handling
//     if (err.code === "P2002") {
//       return NextResponse.json(
//         { error: "Duplicate entry detected" },
//         { status: 409 }
//       );
//     }

//     return NextResponse.json(
//       { error: "Failed to save profile", details: err.message },
//       { status: 500 }
//     );
//   }
// }












// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { currentUser } from "@clerk/nextjs/server"; // ✅ Clerk import

// // =============================
// // CREATE BUSINESS PROFILE (POST)
// // =============================
// export async function POST(req: Request) {
//   try {
//     const body = await req.json();

//     // ---- GET LOGGED IN USER ----
//     const user = await currentUser();
//     if (!user?.id) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     // ---- VALIDATION ----
//     if (!body.businessType) {
//       return NextResponse.json(
//         { error: "Business Type is required" },
//         { status: 400 }
//       );
//     }
//     if (!body.businessName) {
//       return NextResponse.json(
//         { error: "Business Name is required" },
//         { status: 400 }
//       );
//     }
//     if (!body.contactName) {
//       return NextResponse.json(
//         { error: "Contact Person Name is required" },
//         { status: 400 }
//       );
//     }
//     if (!body.contactPhone) {
//       return NextResponse.json(
//         { error: "Phone number is required" },
//         { status: 400 }
//       );
//     }
//     if (!body.contactEmail) {
//       return NextResponse.json(
//         { error: "Email is required" },
//         { status: 400 }
//       );
//     }

//     // ---- CREATE FORM ----
//     const profile = await prisma.form.create({
//       data: {
//         title: "Business Profile",
//         userId: user.id, // ✅ link form to current user

//         fields: {
//           create: [
//             {
//               label: "Business Type",
//               type: "SELECT",
//               value: body.businessType,
//               options: [],
//             },
//             {
//               label: "Business Name",
//               type: "INPUT",
//               value: body.businessName,
//               options: [],
//             },
//             {
//               label: "Tagline",
//               type: "INPUT",
//               value: body.businessTagline || "",
//               options: [],
//             },
//             {
//               label: "Contact Person Name",
//               type: "INPUT",
//               value: body.contactName,
//               options: [],
//             },
//             {
//               label: "Phone",
//               type: "INPUT",
//               value: body.contactPhone,
//               options: [],
//             },
//             {
//               label: "Email",
//               type: "INPUT",
//               value: body.contactEmail,
//               options: [],
//             },
//             {
//               label: "UPI",
//               type: "INPUT",
//               value: body.upi || "",
//               options: [],
//             },
//             {
//               label: "Google Review Link",
//               type: "INPUT",
//               value: body.reviewLink || "",
//               options: [],
//             },
//             {
//               label: "Custom Field",
//               type: "INPUT",
//               value: body.customField || "",
//               options: [],
//             },
//             {
//               label: "Signature",
//               type: "FILE",
//               fileUrl: body.signature || "",
//               options: [],
//             },
//             {
//               label: "Logo",
//               type: "FILE",
//               fileUrl: body.logo || "",
//               options: [],
//             },
//           ],
//         },
//       },
//       include: { fields: true },
//     });

//     return NextResponse.json(profile, { status: 201 });
//   } catch (err: any) {
//     console.error("Profile save error:", err);

//     // Prisma-specific error handling
//     if (err.code === "P2002") {
//       return NextResponse.json(
//         { error: "Duplicate entry detected" },
//         { status: 409 }
//       );
//     }

//     return NextResponse.json(
//       { error: "Failed to save profile", details: err.message },
//       { status: 500 }
//     );
//   }
// }

// // =============================
// // GET MOST RECENT BUSINESS PROFILE
// // =============================
// export async function GET() {
//   try {
//     const user = await currentUser();
//     if (!user?.id) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     const profile = await prisma.form.findFirst({
//       where: {
//         userId: user.id,
//         title: "Business Profile",
//       },
//       include: {
//         fields: true,
//       },
//       orderBy: {
//         createdAt: "desc", // latest profile first
//       },
//     });

//     if (!profile) {
//       return NextResponse.json(
//         { message: "No Business Profile found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(profile, { status: 200 });
//   } catch (err: any) {
//     console.error("Fetch profile error:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch profile", details: err.message },
//       { status: 500 }
//     );
//   }
// }







// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { currentUser } from "@clerk/nextjs/server";

// // =============================
// // CREATE BUSINESS PROFILE (POST)
// // =============================
// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const user = await currentUser();

//     if (!user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // ---- VALIDATION ----
//     const required = {
//       businessType: "Business Type is required",
//       businessName: "Business Name is required",
//       contactName: "Contact Person Name is required",
//       contactPhone: "Phone number is required",
//       contactEmail: "Email is required",
//     };

//     for (const field in required) {
//       if (!body[field]) {
//         return NextResponse.json({ error: required[field] }, { status: 400 });
//       }
//     }

//     // ---- CREATE BUSINESS PROFILE ----
//     const profile = await prisma.businessProfile.create({
//       data: {
//         userId: user.id,
//         businessType: body.businessType,
//         businessName: body.businessName,
//         businessTagLine: body.businessTagline || "",
//         contactPersonName: body.contactName,
//         contactPersonPhone: body.contactPhone,
//         contactPersonEmail: body.contactEmail,
//         upi: body.upi || "",
//         googleReviewUrl: body.reviewLink || "",
//         signatureUrl: body.signature || "",
//         logoUrl: body.logo || "",
//         profileImageUrl: body.profileImageUrl || "",
//       },
//     });

//     return NextResponse.json(profile, { status: 201 });
//   } catch (err: any) {
//     console.error("Profile save error:", err);

//     if (err.code === "P2002") {
//       return NextResponse.json({ error: "Duplicate entry" }, { status: 409 });
//     }

//     return NextResponse.json(
//       { error: "Failed to save profile", details: err.message },
//       { status: 500 }
//     );
//   }
// }

// // =============================
// // GET MOST RECENT BUSINESS PROFILE
// // =============================
// export async function GET() {
//   try {
//     const user = await currentUser();
//     if (!user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const profile = await prisma.businessProfile.findFirst({
//       where: { userId: user.id },
//       orderBy: { createdAt: "desc" },
//     });

//     if (!profile) {
//       return NextResponse.json(
//         { message: "No Business Profile found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(profile, { status: 200 });
//   } catch (err: any) {
//     console.error("Fetch profile error:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch profile", details: err.message },
//       { status: 500 }
//     );
//   }
// }



// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { currentUser } from "@clerk/nextjs/server";
// import cloudinary from "@/lib/cloudinary";

// // =============================
// // CREATE BUSINESS PROFILE (POST)
// // =============================
// export async function POST(req: Request) {
//   try {
//     const formData = await req.formData();
//     const user = await currentUser();

//     if (!user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // ---- Extract text fields ----
//     const businessType = formData.get("businessType") as string;
//     const businessName = formData.get("businessName") as string;
//     const businessTagline = (formData.get("businessTagline") as string) || "";
//     const contactName = formData.get("contactName") as string;
//     const contactPhone = formData.get("contactPhone") as string;
//     const contactEmail = formData.get("contactEmail") as string;
//     const upi = (formData.get("upi") as string) || "";
//     const reviewLink = (formData.get("reviewLink") as string) || "";

//     // ---- Validation ----
//     const required = {
//       businessType: "Business Type is required",
//       businessName: "Business Name is required",
//       contactName: "Contact Person Name is required",
//       contactPhone: "Phone number is required",
//       contactEmail: "Email is required",
//     };

//     for (const field in required) {
//       if (!formData.get(field)) {
//         return NextResponse.json({ error: required[field] }, { status: 400 });
//       }
//     }

//     // ---- Handle File Uploads ----
//     const uploadFile = async (file: File | null) => {
//       if (!file) return "";
//       const bytes = await file.arrayBuffer();
//       const buffer = Buffer.from(bytes);
//       const uploaded = await new Promise<any>((resolve, reject) => {
//         cloudinary.uploader
//           .upload_stream({ folder: "uploads" }, (err, result) => {
//             if (err) reject(err);
//             else resolve(result);
//           })
//           .end(buffer);
//       });
//       return uploaded.secure_url;
//     };

//     const profileImageUrl = await uploadFile(formData.get("profileImage") as File);
//     const logoUrl = await uploadFile(formData.get("logo") as File);
//     const signatureUrl = await uploadFile(formData.get("signature") as File);

//     // ---- Create Business Profile ----
//     const profile = await prisma.businessProfile.create({
//       data: {
//         userId: user.id,
//         businessType,
//         businessName,
//         businessTagLine: businessTagline,
//         contactPersonName: contactName,
//         contactPersonPhone: contactPhone,
//         contactPersonEmail: contactEmail,
//         upi,
//         googleReviewUrl: reviewLink,
//         profileImageUrl,
//         logoUrl,
//         signatureUrl,
//       },
//     });

//     return NextResponse.json(profile, { status: 201 });
//   } catch (err: any) {
//     console.error("Profile save error:", err);

//     if (err.code === "P2002") {
//       return NextResponse.json({ error: "Duplicate entry" }, { status: 409 });
//     }

//     return NextResponse.json(
//       { error: "Failed to save profile", details: err.message },
//       { status: 500 }
//     );
//   }
// }

// // =============================
// // GET MOST RECENT BUSINESS PROFILE
// // =============================
// export async function GET() {
//   try {
//     const user = await currentUser();
//     if (!user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const profile = await prisma.businessProfile.findFirst({
//       where: { userId: user.id },
//       orderBy: { createdAt: "desc" },
//     });

//     if (!profile) {
//       return NextResponse.json(
//         { message: "No Business Profile found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(profile, { status: 200 });
//   } catch (err: any) {
//     console.error("Fetch profile error:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch profile", details: err.message },
//       { status: 500 }
//     );
//   }
// }







// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { currentUser } from "@clerk/nextjs/server";

// // =============================
// // CREATE BUSINESS PROFILE (POST)
// // =============================
// export async function POST(req: Request) {
//   try {
//     const data = await req.json(); // receive JSON from frontend
//     const user = await currentUser();

//     if (!user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // ---- Extract fields ----
//     const {
//       businessType,
//       businessName,
//       businessTagline = "",
//       contactName,
//       contactPhone,
//       contactEmail,
//       upi = "",
//       reviewLink = "",
//       profileImage,
//       logo,
//       signature,
//     } = data;

//     // ---- Validation ----
//     const required: Record<string, string> = {
//       businessType: "Business Type is required",
//       businessName: "Business Name is required",
//       contactName: "Contact Person Name is required",
//       contactPhone: "Phone number is required",
//       contactEmail: "Email is required",
//     };

//     for (const field in required) {
//       if (!data[field]) {
//         return NextResponse.json({ error: required[field] }, { status: 400 });
//       }
//     }

//     // ---- Save profile ----
//     const profile = await prisma.businessProfile.create({
//       data: {
//         userId: user.id,
//         businessType,
//         businessName,
//         businessTagLine: businessTagline,
//         contactPersonName: contactName,
//         contactPersonPhone: contactPhone,
//         contactPersonEmail: contactEmail,
//         upi,
//         googleReviewUrl: reviewLink,
//         profileImageUrl: profileImage || "",
//         logoUrl: logo || "",
//         signatureUrl: signature || "",
//       },
//     });

//     return NextResponse.json(profile, { status: 201 });
//   } catch (err: any) {
//     console.error("Profile save error:", err);

//     if (err.code === "P2002") {
//       return NextResponse.json({ error: "Duplicate entry" }, { status: 409 });
//     }

//     return NextResponse.json(
//       { error: "Failed to save profile", details: err.message },
//       { status: 500 }
//     );
//   }
// }

// // =============================
// // GET MOST RECENT BUSINESS PROFILE
// // =============================
// export async function GET() {
//   try {
//     const user = await currentUser();
//     if (!user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const profile = await prisma.businessProfile.findFirst({
//       where: { userId: user.id },
//       orderBy: { createdAt: "desc" },
//     });

//     if (!profile) {
//       return NextResponse.json(
//         { message: "No Business Profile found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(profile, { status: 200 });
//   } catch (err: any) {
//     console.error("Fetch profile error:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch profile", details: err.message },
//       { status: 500 }
//     );
//   }
// }




// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { currentUser } from "@clerk/nextjs/server";

// // =============================
// // CREATE BUSINESS PROFILE (POST)
// // =============================
// export async function POST(req: Request) {
//   try {
//     // Receive JSON from frontend
//     const data = await req.json();
//     const user = await currentUser();

//     if (!user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // ---- Extract fields ----
//     const {
//       businessType,
//       businessName,
//       businessTagline = "",
//       contactName,
//       contactPhone,
//       contactEmail,
//       upi = "",
//       reviewLink = "",
//       profileImage, // Cloudinary URL from frontend
//       logo,         // Cloudinary URL from frontend
//       signature,    // Cloudinary URL from frontend
//     } = data;

//     // ---- Validation ----
//     const required: Record<string, string> = {
//       businessType: "Business Type is required",
//       businessName: "Business Name is required",
//       contactName: "Contact Person Name is required",
//       contactPhone: "Phone number is required",
//       contactEmail: "Email is required",
//     };

//     for (const field in required) {
//       if (!data[field]) {
//         return NextResponse.json({ error: required[field] }, { status: 400 });
//       }
//     }

//     // ---- Save profile to database ----
//     const profile = await prisma.businessProfile.create({
//       data: {
//         userId: user.id,
//         businessType,
//         businessName,
//         businessTagLine: businessTagline,
//         contactPersonName: contactName,
//         contactPersonPhone: contactPhone,
//         contactPersonEmail: contactEmail,
//         upi,
//         googleReviewUrl: reviewLink,
//         profileImageUrl: profileImage || "",
//         logoUrl: logo || "",
//         signatureUrl: signature || "",
//       },
//     });

//     return NextResponse.json(profile, { status: 201 });
//   } catch (err: any) {
//     console.error("Profile save error:", err);

//     if (err.code === "P2002") {
//       return NextResponse.json({ error: "Duplicate entry" }, { status: 409 });
//     }

//     return NextResponse.json(
//       { error: "Failed to save profile", details: err.message },
//       { status: 500 }
//     );
//   }
// }

// // =============================
// // GET MOST RECENT BUSINESS PROFILE
// // =============================
// export async function GET() {
//   try {
//     const user = await currentUser();

//     if (!user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const profile = await prisma.businessProfile.findFirst({
//       where: { userId: user.id },
//       orderBy: { createdAt: "desc" },
//     });

//     if (!profile) {
//       return NextResponse.json(
//         { message: "No Business Profile found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(profile, { status: 200 });
//   } catch (err: any) {
//     console.error("Fetch profile error:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch profile", details: err.message },
//       { status: 500 }
//     );
//   }
// }










// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { currentUser } from "@clerk/nextjs/server";

// // =============================
// // CREATE BUSINESS PROFILE (POST)
// // =============================
// export async function POST(req: Request) {
//   try {
//     const data = await req.json();
//     const user = await currentUser();

//     if (!user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // ---- Extract fields ----
//     const {
//       businessType,
//       businessName,
//       businessTagline = "",
//       contactName,
//       contactPhone,
//       contactEmail,
//       upi = "",
//       reviewLink = "",
//       profileImage,
//       logo,
//       signature,
//       gstNumber = "",
//       businessAddress = "",
//       state = "",
//       pinCode = "",
//     } = data;

//     // ---- Validation ----
//     const required: Record<string, string> = {
//       businessType: "Business Type is required",
//       businessName: "Business Name is required",
//       contactName: "Contact Person Name is required",
//       contactPhone: "Phone number is required",
//       contactEmail: "Email is required",
//     };

//     for (const field in required) {
//       if (!data[field]) {
//         return NextResponse.json({ error: required[field] }, { status: 400 });
//       }
//     }

//     // ---- Save profile to database ----
//     const profile = await prisma.businessProfile.create({
//       data: {
//         userId: user.id,
//         businessType,
//         businessName,
//         businessTagLine: businessTagline,
//         contactPersonName: contactName,
//         contactPersonPhone: contactPhone,
//         contactPersonEmail: contactEmail,
//         upi,
//         googleReviewUrl: reviewLink,
//         profileImageUrl: profileImage || "",
//         logoUrl: logo || "",
//         signatureUrl: signature || "",
//         gstNumber,
//         businessAddress,
//         state,
//         pinCode,
//       },
//     });

//     return NextResponse.json(profile, { status: 201 });
//   } catch (err: any) {
//     console.error("Profile save error:", err);

//     if (err.code === "P2002") {
//       return NextResponse.json({ error: "Duplicate entry" }, { status: 409 });
//     }

//     return NextResponse.json(
//       { error: "Failed to save profile", details: err.message },
//       { status: 500 }
//     );
//   }
// }

// // =============================
// // GET MOST RECENT BUSINESS PROFILE (GET)
// // =============================
// export async function GET() {
//   try {
//     const user = await currentUser();

//     if (!user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const profile = await prisma.businessProfile.findFirst({
//       where: { userId: user.id },
//       orderBy: { createdAt: "desc" },
//     });

//     if (!profile) {
//       return NextResponse.json(
//         { message: "No Business Profile found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(profile, { status: 200 });
//   } catch (err: any) {
//     console.error("Fetch profile error:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch profile", details: err.message },
//       { status: 500 }
//     );
//   }
// }


















import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

// =============================
// CREATE BUSINESS PROFILE (POST)
// =============================
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ---- Extract fields ----
    const {
      businessType,
      businessName,
      businessTagline = "",
      contactName,
      contactPhone,
      contactEmail,
      upi = "",
      reviewLink = "",
      profileImage,
      logo,
      signature,
      gstNumber = "",
      businessAddress = "",
      state = "",
      pinCode = "",
    } = data;

    // ---- Validation ----
    const required: Record<string, string> = {
      businessType: "Business Type is required",
      businessName: "Business Name is required",
      contactName: "Contact Person Name is required",
      contactPhone: "Phone number is required",
      contactEmail: "Email is required",
    };

    for (const field in required) {
      if (!data[field]) {
        return NextResponse.json({ error: required[field] }, { status: 400 });
      }
    }

    // ---- Save profile to database ----
   const profile = await prisma.businessProfile.create({
  data: {
    userId: user.id,

    businessName,
    businessTagLine: businessTagline ?? null,

    contactPersonName: contactName ?? null,
    contactPersonPhone: contactPhone ?? null,

    upi: upi ?? null,
    logoUrl: logo ?? null,
    signatureUrl: signature ?? null,

    gstNumber: gstNumber ?? null,
    businessAddress: businessAddress ?? null,
    state: state ?? null,
    pinCode: pinCode ?? null,
  },
});

    return NextResponse.json(profile, { status: 201 });
  } catch (err: any) {
    console.error("Profile save error:", err);

    if (err.code === "P2002") {
      return NextResponse.json({ error: "Duplicate entry" }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Failed to save profile", details: err.message },
      { status: 500 }
    );
  }
}

// =============================
// GET MOST RECENT BUSINESS PROFILE (GET)
// =============================
export async function GET() {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.businessProfile.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!profile) {
      return NextResponse.json(
        { message: "No Business Profile found" },
        { status: 404 }
      );
    }

    return NextResponse.json(profile, { status: 200 });
  } catch (err: any) {
    console.error("Fetch profile error:", err);
    return NextResponse.json(
      { error: "Failed to fetch profile", details: err.message },
      { status: 500 }
    );
  }
}
