








// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import cloudinary from "@/lib/cloudinary";
// import busboy from "busboy";   // ✅ lowercase import
// import { Readable } from "stream";
// import { currentUser } from "@clerk/nextjs/server";

// // Helper: convert Web ReadableStream → Node Readable
// function toNodeReadable(stream: ReadableStream<Uint8Array> | null): Readable {
//   if (!stream) throw new Error("Request body is empty");
//   const reader = stream.getReader();
//   return new Readable({
//     async read() {
//       const { done, value } = await reader.read();
//       if (done) this.push(null);
//       else this.push(Buffer.from(value));
//     },
//   });
// }

// export async function POST(req: Request) {
//   try {
//     const user = await currentUser();
//     if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     const clerkId = user.id;

//     // Find or create user
//     let dbUser = await prisma.user.findUnique({ where: { clerkId } });
//     if (!dbUser) {
//       dbUser = await prisma.user.create({
//         data: {
//           clerkId,
//           name: user.firstName + (user.lastName ? " " + user.lastName : ""),
//           email: user.emailAddresses[0]?.emailAddress || `no-email-${clerkId}@example.com`,
//           role: "SELLER",
//         },
//       });
//     }

//     const contentType = req.headers.get("content-type") || "";

//     // ===== Case 1: JSON request =====
//     if (contentType.includes("application/json")) {
//       const data = await req.json();

//       if (!data.name || !data.price || !data.categoryId) {
//         return NextResponse.json(
//           { error: "Missing required fields: name, price, or categoryId" },
//           { status: 400 }
//         );
//       }

//       const item = await prisma.item.create({
//         data: {
//           name: data.name,
//           description: data.description || null,
//           mrp: data.mrp ? parseFloat(data.mrp) : null,
//           purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : null,
//           sellingPrice: data.sellingPrice
//             ? parseFloat(data.sellingPrice)
//             : parseFloat(data.price),
//           price: parseFloat(data.price),
//           gst: data.gst ? parseFloat(data.gst) : null,
//           discount: data.discount ? parseFloat(data.discount) : null,
//           openingStock: data.openingStock ? parseInt(data.openingStock) : null,
//           currentStock: data.currentStock
//             ? parseInt(data.currentStock)
//             : data.openingStock
//             ? parseInt(data.openingStock)
//             : null,
//           reorderLevel: data.reorderLevel ? parseInt(data.reorderLevel) : null,
//           unit: data.unit || null,
//           barcode: data.barcode || null,
//           brand: data.brand || null,
//           model: data.model || null,
//           size: data.size || null,
//           color: data.color || null,
//           imageUrl: data.imageUrl || null,
//           gallery: data.gallery || [],
//           user: { connect: { id: dbUser.id } },
//           category: { connect: { id: data.categoryId } },
//         },
//       });

//       return NextResponse.json(item, { status: 201 });
//     }

//     // ===== Case 2: multipart/form-data =====
//     if (contentType.includes("multipart/form-data")) {
//       return await new Promise<NextResponse>((resolve) => {
//         const headers: Record<string, string> = {};
//         req.headers.forEach((value, key) => (headers[key.toLowerCase()] = value));

//         // ✅ FIX: use busboy() instead of new Busboy()
//         const bb = busboy({ headers });
//         const fields: Record<string, any> = {};
//         const fileUploadPromises: Promise<string>[] = [];

//         bb.on("file", (_name, file) => {
//           const uploadPromise = new Promise<string>((res, rej) => {
//             const uploadStream = cloudinary.uploader.upload_stream(
//               { upload_preset: "mybillingmenu" },
//               (error, result) => {
//                 if (error) return rej(error);
//                 if (!result?.secure_url)
//                   return rej(new Error("No image URL returned from Cloudinary"));
//                 res(result.secure_url);
//               }
//             );
//             file.pipe(uploadStream);
//           });
//           fileUploadPromises.push(uploadPromise);
//         });

//         bb.on("field", (name, value) => {
//           fields[name] = value;
//         });

//         bb.on("finish", async () => {
//           try {
//             if (!fields.name || !fields.price || !fields.categoryId) {
//               return resolve(
//                 NextResponse.json(
//                   { error: "Missing required fields: name, price, or categoryId" },
//                   { status: 400 }
//                 )
//               );
//             }

//             let imageUrl: string | null = null;
//             if (fileUploadPromises.length > 0) {
//               const uploadedResults = await Promise.all(fileUploadPromises);
//               imageUrl = uploadedResults[0] || null;
//             }

//             const item = await prisma.item.create({
//               data: {
//                 name: fields.name,
//                 description: fields.description || null,
//                 mrp: fields.mrp ? parseFloat(fields.mrp) : null,
//                 purchasePrice: fields.purchasePrice ? parseFloat(fields.purchasePrice) : null,
//                 sellingPrice: fields.sellingPrice
//                   ? parseFloat(fields.sellingPrice)
//                   : parseFloat(fields.price),
//                 price: parseFloat(fields.price),
//                 gst: fields.gst ? parseFloat(fields.gst) : null,
//                 discount: fields.discount ? parseFloat(fields.discount) : null,
//                 openingStock: fields.openingStock ? parseInt(fields.openingStock) : null,
//                 currentStock: fields.currentStock
//                   ? parseInt(fields.currentStock)
//                   : fields.openingStock
//                   ? parseInt(fields.openingStock)
//                   : null,
//                 reorderLevel: fields.reorderLevel ? parseInt(fields.reorderLevel) : null,
//                 unit: fields.unit || null,
//                 barcode: fields.barcode || null,
//                 brand: fields.brand || null,
//                 model: fields.model || null,
//                 size: fields.size || null,
//                 color: fields.color || null,
//                 imageUrl,
//                 gallery: fields.gallery ? JSON.parse(fields.gallery) : [],
//                 user: { connect: { id: dbUser.id } },
//                 category: { connect: { id: fields.categoryId } },
//               },
//             });

//             resolve(NextResponse.json(item, { status: 201 }));
//           } catch (err: any) {
//             resolve(NextResponse.json({ error: err.message }, { status: 500 }));
//           }
//         });

//         const nodeStream = toNodeReadable(req.body as ReadableStream<Uint8Array>);
//         nodeStream.pipe(bb);
//       });
//     }

//     return NextResponse.json(
//       { error: `Unsupported content type: ${contentType}` },
//       { status: 400 }
//     );
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }





// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import cloudinary from "@/lib/cloudinary";
// import busboy from "busboy";
// import { Readable } from "stream";
// import { currentUser } from "@clerk/nextjs/server";

// // Helper: convert Web ReadableStream → Node Readable
// function toNodeReadable(stream: ReadableStream<Uint8Array> | null): Readable {
//   if (!stream) throw new Error("Request body is empty");
//   const reader = stream.getReader();
//   return new Readable({
//     async read() {
//       const { done, value } = await reader.read();
//       if (done) this.push(null);
//       else this.push(Buffer.from(value));
//     },
//   });
// }

// // ✅ GET handler: fetch all items for current user
// export async function GET() {
//   try {
//     const user = await currentUser();
//     if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     const clerkId = user.id;



//     const dbUser = await prisma.user.findUnique({ where: { clerkId } });
//     if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

//     const items = await prisma.item.findMany({
//       where: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { userId: clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  dbUser.id },
//       select: {
//         id: true,
//         name: true,
//         price: true,
//         sellingPrice: true,
//         mrp: true,
//         currentStock: true,
//       },
//     });

//     return NextResponse.json(items);
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }

// // POST handler: create new item (your existing code)
// export async function POST(req: Request) {
//   try {
//     const user = await currentUser();
//     if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     const clerkId = user.id;

//     let dbUser = await prisma.user.findUnique({ where: { clerkId } });
//     if (!dbUser) {
//       dbUser = await prisma.user.create({
//         data: {
//           clerkId,
//           name: user.firstName + (user.lastName ? " " + user.lastName : ""),
//           email: user.emailAddresses[0]?.emailAddress || `no-email-${clerkId}@example.com`,
//           role: "SELLER",
//         },
//       });
//     }

//     const contentType = req.headers.get("content-type") || "";

//     if (contentType.includes("application/json")) {
//       const data = await req.json();

//       if (!data.name || !data.price || !data.categoryId) {
//         return NextResponse.json(
//           { error: "Missing required fields: name, price, or categoryId" },
//           { status: 400 }
//         );
//       }

//       const item = await prisma.item.create({
//         data: {
//           name: data.name,
//           description: data.description || null,
//           mrp: data.mrp ? parseFloat(data.mrp) : null,
//           purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : null,
//           sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : parseFloat(data.price),
//           price: parseFloat(data.price),
//           gst: data.gst ? parseFloat(data.gst) : null,
//           discount: data.discount ? parseFloat(data.discount) : null,
//           openingStock: data.openingStock ? parseInt(data.openingStock) : null,
//           currentStock: data.currentStock
//             ? parseInt(data.currentStock)
//             : data.openingStock
//             ? parseInt(data.openingStock)
//             : null,
//           reorderLevel: data.reorderLevel ? parseInt(data.reorderLevel) : null,
//           unit: data.unit || null,
//           barcode: data.barcode || null,
//           brand: data.brand || null,
//           model: data.model || null,
//           size: data.size || null,
//           color: data.color || null,
//           imageUrl: data.imageUrl || null,
//           gallery: data.gallery || [],
//           user: { connect: { id: dbUser.id } },
//           category: { connect: { id: data.categoryId } },
//         },
//       });

//       return NextResponse.json(item, { status: 201 });
//     }

//     // multipart/form-data handling remains unchanged
//     if (contentType.includes("multipart/form-data")) {
//       return await new Promise<NextResponse>((resolve) => {
//         const headers: Record<string, string> = {};
//         req.headers.forEach((value, key) => (headers[key.toLowerCase()] = value));

//         const bb = busboy({ headers });
//         const fields: Record<string, any> = {};
//         const fileUploadPromises: Promise<string>[] = [];

//         bb.on("file", (_name, file) => {
//           const uploadPromise = new Promise<string>((res, rej) => {
//             const uploadStream = cloudinary.uploader.upload_stream(
//               { upload_preset: "mybillingmenu" },
//               (error, result) => {
//                 if (error) return rej(error);
//                 if (!result?.secure_url) return rej(new Error("No image URL returned"));
//                 res(result.secure_url);
//               }
//             );
//             file.pipe(uploadStream);
//           });
//           fileUploadPromises.push(uploadPromise);
//         });

//         bb.on("field", (name, value) => {
//           fields[name] = value;
//         });

//         bb.on("finish", async () => {
//           try {
//             if (!fields.name || !fields.price || !fields.categoryId) {
//               return resolve(
//                 NextResponse.json(
//                   { error: "Missing required fields: name, price, or categoryId" },
//                   { status: 400 }
//                 )
//               );
//             }

//             let imageUrl: string | null = null;
//             if (fileUploadPromises.length > 0) {
//               const uploadedResults = await Promise.all(fileUploadPromises);
//               imageUrl = uploadedResults[0] || null;
//             }

//             const item = await prisma.item.create({
//               data: {
//                 name: fields.name,
//                 description: fields.description || null,
//                 mrp: fields.mrp ? parseFloat(fields.mrp) : null,
//                 purchasePrice: fields.purchasePrice ? parseFloat(fields.purchasePrice) : null,
//                 sellingPrice: fields.sellingPrice
//                   ? parseFloat(fields.sellingPrice)
//                   : parseFloat(fields.price),
//                 price: parseFloat(fields.price),
//                 gst: fields.gst ? parseFloat(fields.gst) : null,
//                 discount: fields.discount ? parseFloat(fields.discount) : null,
//                 openingStock: fields.openingStock ? parseInt(fields.openingStock) : null,
//                 currentStock: fields.currentStock
//                   ? parseInt(fields.currentStock)
//                   : fields.openingStock
//                   ? parseInt(fields.openingStock)
//                   : null,
//                 reorderLevel: fields.reorderLevel ? parseInt(fields.reorderLevel) : null,
//                 unit: fields.unit || null,
//                 barcode: fields.barcode || null,
//                 brand: fields.brand || null,
//                 model: fields.model || null,
//                 size: fields.size || null,
//                 color: fields.color || null,
//                 imageUrl,
//                 gallery: fields.gallery ? JSON.parse(fields.gallery) : [],
//                 user: { connect: { id: dbUser.id } },
//                 category: { connect: { id: fields.categoryId } },
//               },
//             });

//             resolve(NextResponse.json(item, { status: 201 }));
//           } catch (err: any) {
//             resolve(NextResponse.json({ error: err.message }, { status: 500 }));
//           }
//         });

//         const nodeStream = toNodeReadable(req.body as ReadableStream<Uint8Array>);
//         nodeStream.pipe(bb);
//       });
//     }

//     return NextResponse.json({ error: `Unsupported content type: ${contentType}` }, { status: 400 });
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }












// "use server";

// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import cloudinary from "@/lib/cloudinary";
// import busboy from "busboy";
// import { Readable } from "stream";
// import { currentUser } from "@clerk/nextjs/server";

// // Helper: convert Web ReadableStream → Node Readable
// function toNodeReadable(stream: ReadableStream<Uint8Array> | null): Readable {
//   if (!stream) throw new Error("Request body is empty");
//   const reader = stream.getReader();
//   return new Readable({
//     async read() {
//       const { done, value } = await reader.read();
//       if (done) this.push(null);
//       else this.push(Buffer.from(value));
//     },
//   });
// }

// // ✅ GET: fetch all items **created by current user only**
// export async function GET() {
//   try {
//     const user = await currentUser();
//     if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } });
//     if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

//     const items = await prisma.item.findMany({
//       where: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { ue: { uuser clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }  clerkId }   user.id }, // 🔑 restrict to creator
//       orderBy: { createdAt: "desc" },
//       select: {
//         id: true,
//         name: true,
//         description: true,
//         price: true,
//         sellingPrice: true,
//         mrp: true,
//         currentStock: true,
//         category: { select: { id: true, name: true } },
//       },
//     });

//     return NextResponse.json(items);
//   } catch (err: any) {
//     console.error("Error fetching items:", err);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }

// // ✅ POST: create new item and assign **current user as creator**
// export async function POST(req: Request) {
//   try {
//     const user = await currentUser();
//     if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     let dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } });
//     if (!dbUser) {
//       dbUser = await prisma.user.create({
//         data: {
//           clerkId: user.id,
//           name: user.firstName + (user.lastName ? " " + user.lastName : ""),
//           email: user.emailAddresses[0]?.emailAddress || `no-email-${user.id}@example.com`,
//           role: "SELLER",
//         },
//       });
//     }

//     const contentType = req.headers.get("content-type") || "";

//     // JSON request
//     if (contentType.includes("application/json")) {
//       const data = await req.json();

//       if (!data.name || !data.price || !data.categoryId) {
//         return NextResponse.json(
//           { error: "Missing required fields: name, price, or categoryId" },
//           { status: 400 }
//         );
//       }

//       const item = await prisma.item.create({
//         data: {
//           name: data.name,
//           description: data.description || null,
//           mrp: data.mrp ? parseFloat(data.mrp) : null,
//           purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : null,
//           sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : parseFloat(data.price),
//           price: parseFloat(data.price),
//           gst: data.gst ? parseFloat(data.gst) : null,
//           discount: data.discount ? parseFloat(data.discount) : null,
//           openingStock: data.openingStock ? parseInt(data.openingStock) : null,
//           currentStock: data.currentStock
//             ? parseInt(data.currentStock)
//             : data.openingStock
//             ? parseInt(data.openingStock)
//             : null,
//           reorderLevel: data.reorderLevel ? parseInt(data.reorderLevel) : null,
//           unit: data.unit || null,
//           barcode: data.barcode || null,
//           brand: data.brand || null,
//           model: data.model || null,
//           size: data.size || null,
//           color: data.color || null,
//           imageUrl: data.imageUrl || null,
//           gallery: data.gallery || [],
//           user: { connect: { id: dbUser.id } }, // 🔑 assign creator
//           category: { connect: { id: data.categoryId } },
//         },
//       });

//       return NextResponse.json(item, { status: 201 });
//     }

//     // multipart/form-data (file uploads)
//     if (contentType.includes("multipart/form-data")) {
//       return await new Promise<NextResponse>((resolve) => {
//         const headers: Record<string, string> = {};
//         req.headers.forEach((value, key) => (headers[key.toLowerCase()] = value));

//         const bb = busboy({ headers });
//         const fields: Record<string, any> = {};
//         const fileUploadPromises: Promise<string>[] = [];

//         bb.on("file", (_name, file) => {
//           const uploadPromise = new Promise<string>((res, rej) => {
//             const uploadStream = cloudinary.uploader.upload_stream(
//               { upload_preset: "mybillingmenu" },
//               (error, result) => {
//                 if (error) return rej(error);
//                 if (!result?.secure_url) return rej(new Error("No image URL returned"));
//                 res(result.secure_url);
//               }
//             );
//             file.pipe(uploadStream);
//           });
//           fileUploadPromises.push(uploadPromise);
//         });

//         bb.on("field", (name, value) => {
//           fields[name] = value;
//         });

//         bb.on("finish", async () => {
//           try {
//             if (!fields.name || !fields.price || !fields.categoryId) {
//               return resolve(
//                 NextResponse.json(
//                   { error: "Missing required fields: name, price, or categoryId" },
//                   { status: 400 }
//                 )
//               );
//             }

//             let imageUrl: string | null = null;
//             if (fileUploadPromises.length > 0) {
//               const uploadedResults = await Promise.all(fileUploadPromises);
//               imageUrl = uploadedResults[0] || null;
//             }

//             const item = await prisma.item.create({
//               data: {
//                 name: fields.name,
//                 description: fields.description || null,
//                 mrp: fields.mrp ? parseFloat(fields.mrp) : null,
//                 purchasePrice: fields.purchasePrice ? parseFloat(fields.purchasePrice) : null,
//                 sellingPrice: fields.sellingPrice
//                   ? parseFloat(fields.sellingPrice)
//                   : parseFloat(fields.price),
//                 price: parseFloat(fields.price),
//                 gst: fields.gst ? parseFloat(fields.gst) : null,
//                 discount: fields.discount ? parseFloat(fields.discount) : null,
//                 openingStock: fields.openingStock ? parseInt(fields.openingStock) : null,
//                 currentStock: fields.currentStock
//                   ? parseInt(fields.currentStock)
//                   : fields.openingStock
//                   ? parseInt(fields.openingStock)
//                   : null,
//                 reorderLevel: fields.reorderLevel ? parseInt(fields.reorderLevel) : null,
//                 unit: fields.unit || null,
//                 barcode: fields.barcode || null,
//                 brand: fields.brand || null,
//                 model: fields.model || null,
//                 size: fields.size || null,
//                 color: fields.color || null,
//                 imageUrl,
//                 gallery: fields.gallery ? JSON.parse(fields.gallery) : [],
//                 user: { connect: { id: dbUser.id } }, // 🔑 assign creator
//                 category: { connect: { id: fields.categoryId } },
//               },
//             });

//             resolve(NextResponse.json(item, { status: 201 }));
//           } catch (err: any) {
//             resolve(NextResponse.json({ error: err.message }, { status: 500 }));
//           }
//         });

//         const nodeStream = toNodeReadable(req.body as ReadableStream<Uint8Array>);
//         nodeStream.pipe(bb);
//       });
//     }

//     return NextResponse.json({ error: `Unsupported content type: ${contentType}` }, { status: 400 });
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }















// "use server";

// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import cloudinary from "@/lib/cloudinary";
// import busboy from "busboy";
// import { Readable } from "stream";
// import { currentUser } from "@clerk/nextjs/server";

// // Helper: convert Web ReadableStream → Node Readable
// function toNodeReadable(stream: ReadableStream<Uint8Array> | null): Readable {
//   if (!stream) throw new Error("Request body is empty");
//   const reader = stream.getReader();
//   return new Readable({
//     async read() {
//       const { done, value } = await reader.read();
//       if (done) this.push(null);
//       else this.push(Buffer.from(value));
//     },
//   });
// }

// // ✅ GET: fetch all items created by current Clerk user
// export async function GET() {
//   try {
//     const user = await currentUser();
//     if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const items = await prisma.item.findMany({
//       where: { createdByClerkId: user.id }, // 🔑 filter by current user
//       orderBy: { createdAt: "desc" },
//       select: {
//         id: true,
//         name: true,
//         description: true,
//         price: true,
//         sellingPrice: true,
//         mrp: true,
//         currentStock: true,
//         category: { select: { id: true, name: true } },
//       },
//     });

//     return NextResponse.json(items);
//   } catch (err: any) {
//     console.error("Error fetching items:", err);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }

// // ✅ POST: create new item with createdByClerkId
// export async function POST(req: Request) {
//   try {
//     const user = await currentUser();
//     if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const contentType = req.headers.get("content-type") || "";

//     // JSON request
//     if (contentType.includes("application/json")) {
//       const data = await req.json();

//       if (!data.name || !data.price || !data.categoryId) {
//         return NextResponse.json(
//           { error: "Missing required fields: name, price, or categoryId" },
//           { status: 400 }
//         );
//       }

//       const item = await prisma.item.create({
//         data: {
//           name: data.name,
//           description: data.description || null,
//           mrp: data.mrp ? parseFloat(data.mrp) : null,
//           purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : null,
//           sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : parseFloat(data.price),
//           price: parseFloat(data.price),
//           gst: data.gst ? parseFloat(data.gst) : null,
//           discount: data.discount ? parseFloat(data.discount) : null,
//           openingStock: data.openingStock ? parseInt(data.openingStock) : null,
//           currentStock: data.currentStock
//             ? parseInt(data.currentStock)
//             : data.openingStock
//             ? parseInt(data.openingStock)
//             : null,
//           reorderLevel: data.reorderLevel ? parseInt(data.reorderLevel) : null,
//           unit: data.unit || null,
//           barcode: data.barcode || null,
//           brand: data.brand || null,
//           model: data.model || null,
//           size: data.size || null,
//           color: data.color || null,
//           imageUrl: data.imageUrl || null,
//           gallery: data.gallery || [],
//           category: { connect: { id: data.categoryId } },
//           createdByClerkId: user.id, // 🔑 store Clerk ID
//         },
//       });

//       return NextResponse.json(item, { status: 201 });
//     }

//     // multipart/form-data (file uploads)
//     if (contentType.includes("multipart/form-data")) {
//       return await new Promise<NextResponse>((resolve) => {
//         const headers: Record<string, string> = {};
//         req.headers.forEach((value, key) => (headers[key.toLowerCase()] = value));

//         const bb = busboy({ headers });
//         const fields: Record<string, any> = {};
//         const fileUploadPromises: Promise<string>[] = [];

//         bb.on("file", (_name, file) => {
//           const uploadPromise = new Promise<string>((res, rej) => {
//             const uploadStream = cloudinary.uploader.upload_stream(
//               { upload_preset: "mybillingmenu" },
//               (error, result) => {
//                 if (error) return rej(error);
//                 if (!result?.secure_url) return rej(new Error("No image URL returned"));
//                 res(result.secure_url);
//               }
//             );
//             file.pipe(uploadStream);
//           });
//           fileUploadPromises.push(uploadPromise);
//         });

//         bb.on("field", (name, value) => {
//           fields[name] = value;
//         });

//         bb.on("finish", async () => {
//           try {
//             if (!fields.name || !fields.price || !fields.categoryId) {
//               return resolve(
//                 NextResponse.json(
//                   { error: "Missing required fields: name, price, or categoryId" },
//                   { status: 400 }
//                 )
//               );
//             }

//             let imageUrl: string | null = null;
//             if (fileUploadPromises.length > 0) {
//               const uploadedResults = await Promise.all(fileUploadPromises);
//               imageUrl = uploadedResults[0] || null;
//             }

//             const item = await prisma.item.create({
//               data: {
//                 name: fields.name,
//                 description: fields.description || null,
//                 mrp: fields.mrp ? parseFloat(fields.mrp) : null,
//                 purchasePrice: fields.purchasePrice ? parseFloat(fields.purchasePrice) : null,
//                 sellingPrice: fields.sellingPrice
//                   ? parseFloat(fields.sellingPrice)
//                   : parseFloat(fields.price),
//                 price: parseFloat(fields.price),
//                 gst: fields.gst ? parseFloat(fields.gst) : null,
//                 discount: fields.discount ? parseFloat(fields.discount) : null,
//                 openingStock: fields.openingStock ? parseInt(fields.openingStock) : null,
//                 currentStock: fields.currentStock
//                   ? parseInt(fields.currentStock)
//                   : fields.openingStock
//                   ? parseInt(fields.openingStock)
//                   : null,
//                 reorderLevel: fields.reorderLevel ? parseInt(fields.reorderLevel) : null,
//                 unit: fields.unit || null,
//                 barcode: fields.barcode || null,
//                 brand: fields.brand || null,
//                 model: fields.model || null,
//                 size: fields.size || null,
//                 color: fields.color || null,
//                 imageUrl,
//                 gallery: fields.gallery ? JSON.parse(fields.gallery) : [],
//                 category: { connect: { id: fields.categoryId } },
//                 createdByClerkId: user.id, // 🔑 store Clerk ID
//               },
//             });

//             resolve(NextResponse.json(item, { status: 201 }));
//           } catch (err: any) {
//             resolve(NextResponse.json({ error: err.message }, { status: 500 }));
//           }
//         });

//         const nodeStream = toNodeReadable(req.body as ReadableStream<Uint8Array>);
//         nodeStream.pipe(bb);
//       });
//     }

//     return NextResponse.json({ error: `Unsupported content type: ${contentType}` }, { status: 400 });
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }
















// "use server";

// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import cloudinary from "@/lib/cloudinary";
// import busboy from "busboy";
// import { Readable } from "stream";
// import { currentUser } from "@clerk/nextjs/server";

// // Helper: convert Web ReadableStream → Node Readable
// function toNodeReadable(stream: ReadableStream<Uint8Array> | null): Readable {
//   if (!stream) throw new Error("Request body is empty");
//   const reader = stream.getReader();
//   return new Readable({
//     async read() {
//       const { done, value } = await reader.read();
//       if (done) this.push(null);
//       else this.push(Buffer.from(value));
//     },
//   });
// }

// // GET: fetch all items created by current Clerk user
// export async function GET() {
//   try {
//     const user = await currentUser();
//     if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const items = await prisma.item.findMany({
//       where: { user: { clerkId: user.id } },
//       orderBy: { createdAt: "desc" },
//       select: {
//         id: true,
//         name: true,
//         description: true,
//         price: true,
//         sellingPrice: true,
//         mrp: true,
//         currentStock: true,
//         category: { select: { id: true, name: true } },
//         user: { select: { name: true, email: true } },
//       },
//     });

//     return NextResponse.json(items);
//   } catch (err: any) {
//     console.error("Error fetching items:", err);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }

// // POST: create new item
// export async function POST(req: Request) {
//   try {
//     const user = await currentUser();
//     if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     // Ensure User exists in DB
//     let dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } });
//     if (!dbUser) {
//       dbUser = await prisma.user.create({
//         data: {
//           clerkId: user.id,
//           name: user.firstName + (user.lastName ? " " + user.lastName : ""),
//           email: user.emailAddresses[0]?.emailAddress || `no-email-${user.id}@example.com`,
//           role: "SELLER",
//         },
//       });
//     }

//     const contentType = req.headers.get("content-type") || "";

//     // JSON request
//     if (contentType.includes("application/json")) {
//       const data = await req.json();

//       if (!data.name || !data.price || !data.categoryId) {
//         return NextResponse.json(
//           { error: "Missing required fields: name, price, or categoryId" },
//           { status: 400 }
//         );
//       }

//       const item = await prisma.item.create({
//         data: {
//           name: data.name,
//           description: data.description || null,
//           mrp: data.mrp ? parseFloat(data.mrp) : null,
//           purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : null,
//           sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : parseFloat(data.price),
//           price: parseFloat(data.price),
//           gst: data.gst ? parseFloat(data.gst) : null,
//           discount: data.discount ? parseFloat(data.discount) : null,
//           openingStock: data.openingStock ? parseInt(data.openingStock) : null,
//           currentStock:
//             data.currentStock !== undefined
//               ? parseInt(data.currentStock)
//               : data.openingStock
//               ? parseInt(data.openingStock)
//               : null,
//           reorderLevel: data.reorderLevel ? parseInt(data.reorderLevel) : null,
//           unit: data.unit || null,
//           barcode: data.barcode || null,
//           brand: data.brand || null,
//           model: data.model || null,
//           size: data.size || null,
//           color: data.color || null,
//           imageUrl: data.imageUrl || null,
//           gallery: data.gallery || [],
//           category: { connect: { id: String(data.categoryId) } }, // ✅ string
//           user: { connect: { id: dbUser.id } },
//         },
//       });

//       return NextResponse.json(item, { status: 201 });
//     }

//     // multipart/form-data (file uploads)
//     if (contentType.includes("multipart/form-data")) {
//       return await new Promise<NextResponse>((resolve) => {
//         const headers: Record<string, string> = {};
//         req.headers.forEach((value, key) => (headers[key.toLowerCase()] = value));

//         const bb = busboy({ headers });
//         const fields: Record<string, any> = {};
//         const fileUploadPromises: Promise<string>[] = [];

//         bb.on("file", (_name, file) => {
//           const uploadPromise = new Promise<string>((res, rej) => {
//             const uploadStream = cloudinary.uploader.upload_stream(
//               { upload_preset: "mybillingmenu" },
//               (error, result) => {
//                 if (error) return rej(error);
//                 if (!result?.secure_url) return rej(new Error("No image URL returned"));
//                 res(result.secure_url);
//               }
//             );
//             file.pipe(uploadStream);
//           });
//           fileUploadPromises.push(uploadPromise);
//         });

//         bb.on("field", (name, value) => {
//           fields[name] = value;
//         });

//         bb.on("finish", async () => {
//           try {
//             if (!fields.name || !fields.price || !fields.categoryId) {
//               return resolve(
//                 NextResponse.json(
//                   { error: "Missing required fields: name, price, or categoryId" },
//                   { status: 400 }
//                 )
//               );
//             }

//             let imageUrl: string | null = null;
//             if (fileUploadPromises.length > 0) {
//               const uploadedResults = await Promise.all(fileUploadPromises);
//               imageUrl = uploadedResults[0] || null;
//             }

//             const item = await prisma.item.create({
//               data: {
//                 name: fields.name,
//                 description: fields.description || null,
//                 mrp: fields.mrp ? parseFloat(fields.mrp) : null,
//                 purchasePrice: fields.purchasePrice ? parseFloat(fields.purchasePrice) : null,
//                 sellingPrice: fields.sellingPrice
//                   ? parseFloat(fields.sellingPrice)
//                   : parseFloat(fields.price),
//                 price: parseFloat(fields.price),
//                 gst: fields.gst ? parseFloat(fields.gst) : null,
//                 discount: fields.discount ? parseFloat(fields.discount) : null,
//                 openingStock: fields.openingStock ? parseInt(fields.openingStock) : null,
//                 currentStock:
//                   fields.currentStock !== undefined
//                     ? parseInt(fields.currentStock)
//                     : fields.openingStock
//                     ? parseInt(fields.openingStock)
//                     : null,
//                 reorderLevel: fields.reorderLevel ? parseInt(fields.reorderLevel) : null,
//                 unit: fields.unit || null,
//                 barcode: fields.barcode || null,
//                 brand: fields.brand || null,
//                 model: fields.model || null,
//                 size: fields.size || null,
//                 color: fields.color || null,
//                 imageUrl,
//                 gallery: fields.gallery ? JSON.parse(fields.gallery) : [],
//                 category: { connect: { id: String(fields.categoryId) } }, // ✅ string
//                 user: { connect: { id: dbUser!.id } },
//               },
//             });

//             resolve(NextResponse.json(item, { status: 201 }));
//           } catch (err: any) {
//             resolve(NextResponse.json({ error: err.message }, { status: 500 }));
//           }
//         });

//         const nodeStream = toNodeReadable(req.body as ReadableStream<Uint8Array>);
//         nodeStream.pipe(bb);
//       });
//     }

//     return NextResponse.json({ error: `Unsupported content type: ${contentType}` }, { status: 400 });
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }













// "use server";

// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import cloudinary from "@/lib/cloudinary";
// import busboy from "busboy";
// import { Readable } from "stream";
// import { currentUser } from "@clerk/nextjs/server";

// // Helper: convert Web ReadableStream → Node Readable
// function toNodeReadable(stream: ReadableStream<Uint8Array> | null): Readable {
//   if (!stream) throw new Error("Request body is empty");
//   const reader = stream.getReader();
//   return new Readable({
//     async read() {
//       const { done, value } = await reader.read();
//       if (done) this.push(null);
//       else this.push(Buffer.from(value));
//     },
//   });
// }

// // GET: fetch all items created by current Clerk user
// export async function GET() {
//   try {
//     const user = await currentUser();
//     if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const items = await prisma.item.findMany({
//       where: { user: { clerkId: user.id } },
//       orderBy: { createdAt: "desc" },
//       select: {
//         id: true,
//         name: true,
//         description: true,
//         price: true,
//         sellingPrice: true,
//         mrp: true,
//         currentStock: true,
//         category: { select: { id: true, name: true } },
//         user: { select: { name: true, email: true } },
//       },
//     });

//     return NextResponse.json(items);
//   } catch (err: any) {
//     console.error("Error fetching items:", err);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }

// // POST: create new item
// export async function POST(req: Request) {
//   try {
//     const user = await currentUser();
//     if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     // Ensure user exists in DB
//     let dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } });
//     if (!dbUser) {
//       dbUser = await prisma.user.create({
//         data: {
//           clerkId: user.id,
//           name: user.firstName + (user.lastName ? " " + user.lastName : ""),
//           email: user.emailAddresses[0]?.emailAddress || `no-email-${user.id}@example.com`,
//           role: "SELLER",
//         },
//       });
//     }

//     const contentType = req.headers.get("content-type") || "";

//     // JSON request
//     if (contentType.includes("application/json")) {
//       const data = await req.json();

//       if (!data.name || !data.price || !data.categoryId) {
//         return NextResponse.json(
//           { error: "Missing required fields: name, price, or categoryId" },
//           { status: 400 }
//         );
//       }

//       const item = await prisma.item.create({
//         data: {
//           name: data.name,
//           description: data.description || null,
//           mrp: data.mrp ? parseFloat(data.mrp) : null,
//           purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : null,
//           sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : parseFloat(data.price),
//           price: parseFloat(data.price),
//           gst: data.gst ? parseFloat(data.gst) : null,
//           discount: data.discount ? parseFloat(data.discount) : null,
//           openingStock: data.openingStock ? parseInt(data.openingStock) : null,
//           currentStock:
//             data.currentStock !== undefined
//               ? parseInt(data.currentStock)
//               : data.openingStock
//               ? parseInt(data.openingStock)
//               : null,
//           reorderLevel: data.reorderLevel ? parseInt(data.reorderLevel) : null,
//           unit: data.unit || null,
//           barcode: data.barcode || null,
//           brand: data.brand || null,
//           model: data.model || null,
//           size: data.size || null,
//           color: data.color || null,
//           imageUrl: data.imageUrl || null,
//           gallery: data.gallery || [],
//           category: { connect: { id: String(data.categoryId) } },
//           user: { connect: { id: dbUser.id } }, // ✅ Clerk ID stored automatically
//         },
//       });

//       return NextResponse.json(item, { status: 201 });
//     }

//     // multipart/form-data (file uploads)
//     if (contentType.includes("multipart/form-data")) {
//       return await new Promise<NextResponse>((resolve) => {
//         const headers: Record<string, string> = {};
//         req.headers.forEach((value, key) => (headers[key.toLowerCase()] = value));

//         const bb = busboy({ headers });
//         const fields: Record<string, any> = {};
//         const fileUploadPromises: Promise<string>[] = [];

//         bb.on("file", (_name, file) => {
//           const uploadPromise = new Promise<string>((res, rej) => {
//             const uploadStream = cloudinary.uploader.upload_stream(
//               { upload_preset: "mybillingmenu" },
//               (error, result) => {
//                 if (error) return rej(error);
//                 if (!result?.secure_url) return rej(new Error("No image URL returned"));
//                 res(result.secure_url);
//               }
//             );
//             file.pipe(uploadStream);
//           });
//           fileUploadPromises.push(uploadPromise);
//         });

//         bb.on("field", (name, value) => {
//           fields[name] = value;
//         });

//         bb.on("finish", async () => {
//           try {
//             if (!fields.name || !fields.price || !fields.categoryId) {
//               return resolve(
//                 NextResponse.json(
//                   { error: "Missing required fields: name, price, or categoryId" },
//                   { status: 400 }
//                 )
//               );
//             }

//             let imageUrl: string | null = null;
//             if (fileUploadPromises.length > 0) {
//               const uploadedResults = await Promise.all(fileUploadPromises);
//               imageUrl = uploadedResults[0] || null;
//             }

//             const item = await prisma.item.create({
//               data: {
//                 name: fields.name,
//                 description: fields.description || null,
//                 mrp: fields.mrp ? parseFloat(fields.mrp) : null,
//                 purchasePrice: fields.purchasePrice ? parseFloat(fields.purchasePrice) : null,
//                 sellingPrice: fields.sellingPrice
//                   ? parseFloat(fields.sellingPrice)
//                   : parseFloat(fields.price),
//                 price: parseFloat(fields.price),
//                 gst: fields.gst ? parseFloat(fields.gst) : null,
//                 discount: fields.discount ? parseFloat(fields.discount) : null,
//                 openingStock: fields.openingStock ? parseInt(fields.openingStock) : null,
//                 currentStock:
//                   fields.currentStock !== undefined
//                     ? parseInt(fields.currentStock)
//                     : fields.openingStock
//                     ? parseInt(fields.openingStock)
//                     : null,
//                 reorderLevel: fields.reorderLevel ? parseInt(fields.reorderLevel) : null,
//                 unit: fields.unit || null,
//                 barcode: fields.barcode || null,
//                 brand: fields.brand || null,
//                 model: fields.model || null,
//                 size: fields.size || null,
//                 color: fields.color || null,
//                 imageUrl,
//                 gallery: fields.gallery ? JSON.parse(fields.gallery) : [],
//                 category: { connect: { id: String(fields.categoryId) } },
//                 user: { connect: { id: dbUser!.id } }, // ✅ Clerk ID stored automatically
//               },
//             });

//             resolve(NextResponse.json(item, { status: 201 }));
//           } catch (err: any) {
//             resolve(NextResponse.json({ error: err.message }, { status: 500 }));
//           }
//         });

//         const nodeStream = toNodeReadable(req.body as ReadableStream<Uint8Array>);
//         nodeStream.pipe(bb);
//       });
//     }

//     return NextResponse.json({ error: `Unsupported content type: ${contentType}` }, { status: 400 });
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }






// "use server";

// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import cloudinary from "@/lib/cloudinary";
// import busboy from "busboy";
// import { Readable } from "stream";
// import { currentUser } from "@clerk/nextjs/server";

// // Helper: convert Web ReadableStream → Node Readable
// function toNodeReadable(stream: ReadableStream<Uint8Array> | null): Readable {
//   if (!stream) throw new Error("Request body is empty");
//   const reader = stream.getReader();
//   return new Readable({
//     async read() {
//       const { done, value } = await reader.read();
//       if (done) this.push(null);
//       else this.push(Buffer.from(value));
//     },
//   });
// }

// // ==================== GET: fetch items for current Clerk user ====================
// export async function GET() {
//   try {
//     const user = await currentUser();
//     if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     // Fetch only items where userId matches current Clerk ID
//     const items = await prisma.item.findMany({
//       where: { user: { clerkId: user.id } },
//       orderBy: { createdAt: "desc" },
//       select: {
//         id: true,
//         name: true,
//         description: true,
//         price: true,
//         sellingPrice: true,
//         mrp: true,
//         currentStock: true,
//         unit: true,
//         category: { select: { id: true, name: true } },
//         user: { select: { name: true, email: true } },
//         imageUrl: true,
//         gallery: true,
//       },
//     });

//     return NextResponse.json(items);
//   } catch (err: any) {
//     console.error("Error fetching items:", err);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }

// // ==================== POST: create new item ====================
// export async function POST(req: Request) {
//   try {
//     const user = await currentUser();
//     if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     // Ensure user exists in DB
//     let dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } });
//     if (!dbUser) {
//       dbUser = await prisma.user.create({
//         data: {
//           clerkId: user.id,
//           name: user.firstName + (user.lastName ? " " + user.lastName : ""),
//           email: user.emailAddresses[0]?.emailAddress || `no-email-${user.id}@example.com`,
//           role: "SELLER",
//         },
//       });
//     }

//     const contentType = req.headers.get("content-type") || "";

//     // Handle JSON request
//     if (contentType.includes("application/json")) {
//       const data = await req.json();
//       if (!data.name || !data.price || !data.categoryId) {
//         return NextResponse.json(
//           { error: "Missing required fields: name, price, or categoryId" },
//           { status: 400 }
//         );
//       }

//       const item = await prisma.item.create({
//         data: {
//           name: data.name,
//           description: data.description || null,
//           mrp: data.mrp ? parseFloat(data.mrp) : null,
//           purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : null,
//           sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : parseFloat(data.price),
//           price: parseFloat(data.price),
//           gst: data.gst ? parseFloat(data.gst) : null,
//           discount: data.discount ? parseFloat(data.discount) : null,
//           openingStock: data.openingStock ? parseInt(data.openingStock) : null,
//           currentStock:
//             data.currentStock !== undefined
//               ? parseInt(data.currentStock)
//               : data.openingStock
//               ? parseInt(data.openingStock)
//               : null,
//           reorderLevel: data.reorderLevel ? parseInt(data.reorderLevel) : null,
//           unit: data.unit || null,
//           barcode: data.barcode || null,
//           brand: data.brand || null,
//           model: data.model || null,
//           size: data.size || null,
//           color: data.color || null,
//           imageUrl: data.imageUrl || null,
//           gallery: data.gallery || [],
//           category: { connect: { id: String(data.categoryId) } },
//           user: { connect: { id: dbUser.id } }, // Clerk user relation
//         },
//       });

//       return NextResponse.json(item, { status: 201 });
//     }

//     // Handle multipart/form-data (file uploads)
//     if (contentType.includes("multipart/form-data")) {
//       return await new Promise<NextResponse>((resolve) => {
//         const headers: Record<string, string> = {};
//         req.headers.forEach((value, key) => (headers[key.toLowerCase()] = value));

//         const bb = busboy({ headers });
//         const fields: Record<string, any> = {};
//         const fileUploadPromises: Promise<string>[] = [];

//         bb.on("file", (_name, file) => {
//           const uploadPromise = new Promise<string>((res, rej) => {
//             const uploadStream = cloudinary.uploader.upload_stream(
//               { upload_preset: "mybillingmenu" },
//               (error, result) => {
//                 if (error) return rej(error);
//                 if (!result?.secure_url) return rej(new Error("No image URL returned"));
//                 res(result.secure_url);
//               }
//             );
//             file.pipe(uploadStream);
//           });
//           fileUploadPromises.push(uploadPromise);
//         });

//         bb.on("field", (name, value) => {
//           fields[name] = value;
//         });

//         bb.on("finish", async () => {
//           try {
//             if (!fields.name || !fields.price || !fields.categoryId) {
//               return resolve(
//                 NextResponse.json(
//                   { error: "Missing required fields: name, price, or categoryId" },
//                   { status: 400 }
//                 )
//               );
//             }

//             let imageUrl: string | null = null;
//             if (fileUploadPromises.length > 0) {
//               const uploadedResults = await Promise.all(fileUploadPromises);
//               imageUrl = uploadedResults[0] || null;
//             }

//             const item = await prisma.item.create({
//               data: {
//                 name: fields.name,
//                 description: fields.description || null,
//                 mrp: fields.mrp ? parseFloat(fields.mrp) : null,
//                 purchasePrice: fields.purchasePrice ? parseFloat(fields.purchasePrice) : null,
//                 sellingPrice: fields.sellingPrice
//                   ? parseFloat(fields.sellingPrice)
//                   : parseFloat(fields.price),
//                 price: parseFloat(fields.price),
//                 gst: fields.gst ? parseFloat(fields.gst) : null,
//                 discount: fields.discount ? parseFloat(fields.discount) : null,
//                 openingStock: fields.openingStock ? parseInt(fields.openingStock) : null,
//                 currentStock:
//                   fields.currentStock !== undefined
//                     ? parseInt(fields.currentStock)
//                     : fields.openingStock
//                     ? parseInt(fields.openingStock)
//                     : null,
//                 reorderLevel: fields.reorderLevel ? parseInt(fields.reorderLevel) : null,
//                 unit: fields.unit || null,
//                 barcode: fields.barcode || null,
//                 brand: fields.brand || null,
//                 model: fields.model || null,
//                 size: fields.size || null,
//                 color: fields.color || null,
//                 imageUrl,
//                 gallery: fields.gallery ? JSON.parse(fields.gallery) : [],
//                 category: { connect: { id: String(fields.categoryId) } },
//                 user: { connect: { id: dbUser!.id } }, // Clerk user relation
//               },
//             });

//             resolve(NextResponse.json(item, { status: 201 }));
//           } catch (err: any) {
//             resolve(NextResponse.json({ error: err.message }, { status: 500 }));
//           }
//         });

//         const nodeStream = toNodeReadable(req.body as ReadableStream<Uint8Array>);
//         nodeStream.pipe(bb);
//       });
//     }

//     return NextResponse.json({ error: `Unsupported content type: ${contentType}` }, { status: 400 });
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }




"use server";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

/* --------------------------------
   Helper: find or create DB user
--------------------------------- */
async function findOrCreateDBUser(clerk: any) {
  const email = clerk?.emailAddresses?.[0]?.emailAddress || null;
  const clerkId = clerk?.id || null;
  const name =
    `${clerk?.firstName || ""} ${clerk?.lastName || ""}`.trim() || null;

  const orConditions: any[] = [];

  if (clerkId) orConditions.push({ clerkId });
  if (email) orConditions.push({ email });

  let dbUser = await prisma.user.findFirst({
    where: orConditions.length ? { OR: orConditions } : undefined,
    select: {
      id: true,
      clerkId: true,
      email: true,
      name: true,
    },
  });

  // 1️⃣ If user does not exist → create
  if (!dbUser) {
   dbUser = await prisma.user.create({
  data: {
    clerkId: clerkId ?? undefined,
    email: email ?? undefined,
    name: name ?? "", // ✅ always string
  },
  select: {
    id: true,
    clerkId: true,
    email: true,
    name: true,
  },
});

  }

  // 2️⃣ If user exists but clerkId is missing → update
  if (!dbUser.clerkId && clerkId) {
    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: { clerkId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
      },
    });
  }

  // ✅ IMPORTANT: return the user
  return dbUser;
}

/* --------------------------------
   GET /api/items
--------------------------------- */
export async function GET(req: Request) {
  try {
    const clerk = await currentUser();
    if (!clerk?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const search = (url.searchParams.get("search") || "").trim();
    const page = Number(url.searchParams.get("page") || "1");
    const pageSize = Number(url.searchParams.get("pageSize") || "50");

    if (id) {
      const item = await prisma.item.findFirst({
        where: { id, clerkId: clerk.id },
      });

      if (!item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
      return NextResponse.json(item);
    }

    const where: any = { clerkId: clerk.id };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
        {
          category: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.item.count({ where }),
    ]);

    return NextResponse.json({
      items,
      page,
      pageSize,
      total,
      hasMore: skip + items.length < total,
    });
  } catch (err: any) {
    console.error("GET /api/items error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch items" },
      { status: 500 }
    );
  }
}

/* --------------------------------
   POST /api/items (unchanged)
--------------------------------- */
export async function POST(req: Request) {
  try {
    const clerk = await currentUser();
    if (!clerk?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await findOrCreateDBUser(clerk);

    const body = await req.json();
    if (!body?.name || body.price == null || !body.categoryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const item = await prisma.item.create({
      data: {
        name: body.name,
        price: Number(body.price),
        sellingPrice:
          body.sellingPrice != null
            ? Number(body.sellingPrice)
            : Number(body.price),
        unit: body.unit || null,
        imageUrl: body.imageUrl || null,
        category: { connect: { id: String(body.categoryId) } },
        clerkId: clerk.id,
        user: { connect: { id: dbUser.id } },
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/items error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to save item" },
      { status: 500 }
    );
  }
}

/* --------------------------------
   PUT /api/items  ✅ NEW (EDIT MENU)
--------------------------------- */
export async function PUT(req: Request) {
  try {
    const clerk = await currentUser();
    if (!clerk?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, sellingPrice, unit, categoryId, imageUrl } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: "Item id and name are required" },
        { status: 400 }
      );
    }

    // 🔐 ensure ownership (VERY IMPORTANT)
    const existing = await prisma.item.findFirst({
      where: {
        id,
        clerkId: clerk.id,
      },
      select: { id: true, userId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Item not found or not owned by user" },
        { status: 404 }
      );
    }

    const updated = await prisma.item.update({
      where: { id },
      data: {
        name,
        sellingPrice:
          sellingPrice !== undefined ? Number(sellingPrice) : undefined,
        unit: unit ?? undefined,
        imageUrl: imageUrl ?? undefined,
        categoryId:
          categoryId === "uncategorised" ? null : categoryId ?? undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PUT /api/items error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update item" },
      { status: 500 }
    );
  }
}


/* --------------------------------
   DELETE /api/items  ✅ UPDATED
--------------------------------- */

export async function DELETE(req: Request) {
  try {
    const clerk = await currentUser();
    if (!clerk?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let id: string | null = null;

    // allow query param
    const url = new URL(req.url);
    id = url.searchParams.get("id");

    // allow JSON body
    if (!id) {
      try {
        const body = await req.json();
        id = body?.id || null;
      } catch {}
    }

    if (!id) {
      return NextResponse.json(
        { error: "Item id required" },
        { status: 400 }
      );
    }

    // 🔐 ownership check
    const existing = await prisma.item.findFirst({
      where: {
        id,
        clerkId: clerk.id,
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Item not found or not owned by user" },
        { status: 404 }
      );
    }

    await prisma.item.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/items error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete item" },
      { status: 500 }
    );
  }
}
