

// // "use server";

// // import { NextResponse } from "next/server";
// // import prisma from "@/lib/prisma";
// // import cloudinary from "@/lib/cloudinary";
// // import busboy from "busboy";
// // import { Readable } from "stream";
// // import { currentUser } from "@clerk/nextjs/server";

// // // Helper: convert Web ReadableStream → Node Readable
// // function toNodeReadable(stream: ReadableStream<Uint8Array> | null): Readable {
// //   if (!stream) throw new Error("Request body is empty");
// //   const reader = stream.getReader();
// //   return new Readable({
// //     async read() {
// //       const { done, value } = await reader.read();
// //       if (done) this.push(null);
// //       else this.push(Buffer.from(value));
// //     },
// //   });
// // }

// // // ==================== GET: fetch items for current Clerk user ====================
// // export async function GET() {
// //   try {
// //     const user = await currentUser();
// //     if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// //     // Fetch only items where userId matches current Clerk ID
// //     const items = await prisma.item.findMany({
// //       where: { user: { clerkId: user.id } },
// //       orderBy: { createdAt: "desc" },
// //       select: {
// //         id: true,
// //         name: true,
// //         description: true,
// //         price: true,
// //         sellingPrice: true,
// //         mrp: true,
// //         currentStock: true,
// //         unit: true,
// //         category: { select: { id: true, name: true } },
// //         user: { select: { name: true, email: true } },
// //         imageUrl: true,
// //         gallery: true,
// //       },
// //     });

// //     return NextResponse.json(items);
// //   } catch (err: any) {
// //     console.error("Error fetching items:", err);
// //     return NextResponse.json({ error: err.message }, { status: 500 });
// //   }
// // }

// // // ==================== POST: create new item ====================
// // export async function POST(req: Request) {
// //   try {
// //     const user = await currentUser();
// //     if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// //     // Ensure user exists in DB
// //     let dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } });
// //     if (!dbUser) {
// //       dbUser = await prisma.user.create({
// //         data: {
// //           clerkId: user.id,
// //           name: user.firstName + (user.lastName ? " " + user.lastName : ""),
// //           email: user.emailAddresses[0]?.emailAddress || `no-email-${user.id}@example.com`,
// //           role: "SELLER",
// //         },
// //       });
// //     }

// //     const contentType = req.headers.get("content-type") || "";

// //     // Handle JSON request
// //     if (contentType.includes("application/json")) {
// //       const data = await req.json();
// //       if (!data.name || !data.price || !data.categoryId) {
// //         return NextResponse.json(
// //           { error: "Missing required fields: name, price, or categoryId" },
// //           { status: 400 }
// //         );
// //       }

// //       const item = await prisma.item.create({
// //         data: {
// //           name: data.name,
// //           description: data.description || null,
// //           mrp: data.mrp ? parseFloat(data.mrp) : null,
// //           purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : null,
// //           sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : parseFloat(data.price),
// //           price: parseFloat(data.price),
// //           gst: data.gst ? parseFloat(data.gst) : null,
// //           discount: data.discount ? parseFloat(data.discount) : null,
// //           openingStock: data.openingStock ? parseInt(data.openingStock) : null,
// //           currentStock:
// //             data.currentStock !== undefined
// //               ? parseInt(data.currentStock)
// //               : data.openingStock
// //               ? parseInt(data.openingStock)
// //               : null,
// //           reorderLevel: data.reorderLevel ? parseInt(data.reorderLevel) : null,
// //           unit: data.unit || null,
// //           barcode: data.barcode || null,
// //           brand: data.brand || null,
// //           model: data.model || null,
// //           size: data.size || null,
// //           color: data.color || null,
// //           imageUrl: data.imageUrl || null,
// //           gallery: data.gallery || [],
// //           category: { connect: { id: String(data.categoryId) } },
// //           user: { connect: { id: dbUser.id } }, // Clerk user relation
// //         },
// //       });

// //       return NextResponse.json(item, { status: 201 });
// //     }

// //     // Handle multipart/form-data (file uploads)
// //     if (contentType.includes("multipart/form-data")) {
// //       return await new Promise<NextResponse>((resolve) => {
// //         const headers: Record<string, string> = {};
// //         req.headers.forEach((value, key) => (headers[key.toLowerCase()] = value));

// //         const bb = busboy({ headers });
// //         const fields: Record<string, any> = {};
// //         const fileUploadPromises: Promise<string>[] = [];

// //         bb.on("file", (_name, file) => {
// //           const uploadPromise = new Promise<string>((res, rej) => {
// //             const uploadStream = cloudinary.uploader.upload_stream(
// //               { upload_preset: "mybillingmenu" },
// //               (error, result) => {
// //                 if (error) return rej(error);
// //                 if (!result?.secure_url) return rej(new Error("No image URL returned"));
// //                 res(result.secure_url);
// //               }
// //             );
// //             file.pipe(uploadStream);
// //           });
// //           fileUploadPromises.push(uploadPromise);
// //         });

// //         bb.on("field", (name, value) => {
// //           fields[name] = value;
// //         });

// //         bb.on("finish", async () => {
// //           try {
// //             if (!fields.name || !fields.price || !fields.categoryId) {
// //               return resolve(
// //                 NextResponse.json(
// //                   { error: "Missing required fields: name, price, or categoryId" },
// //                   { status: 400 }
// //                 )
// //               );
// //             }

// //             let imageUrl: string | null = null;
// //             if (fileUploadPromises.length > 0) {
// //               const uploadedResults = await Promise.all(fileUploadPromises);
// //               imageUrl = uploadedResults[0] || null;
// //             }

// //             const item = await prisma.item.create({
// //               data: {
// //                 name: fields.name,
// //                 description: fields.description || null,
// //                 mrp: fields.mrp ? parseFloat(fields.mrp) : null,
// //                 purchasePrice: fields.purchasePrice ? parseFloat(fields.purchasePrice) : null,
// //                 sellingPrice: fields.sellingPrice
// //                   ? parseFloat(fields.sellingPrice)
// //                   : parseFloat(fields.price),
// //                 price: parseFloat(fields.price),
// //                 gst: fields.gst ? parseFloat(fields.gst) : null,
// //                 discount: fields.discount ? parseFloat(fields.discount) : null,
// //                 openingStock: fields.openingStock ? parseInt(fields.openingStock) : null,
// //                 currentStock:
// //                   fields.currentStock !== undefined
// //                     ? parseInt(fields.currentStock)
// //                     : fields.openingStock
// //                     ? parseInt(fields.openingStock)
// //                     : null,
// //                 reorderLevel: fields.reorderLevel ? parseInt(fields.reorderLevel) : null,
// //                 unit: fields.unit || null,
// //                 barcode: fields.barcode || null,
// //                 brand: fields.brand || null,
// //                 model: fields.model || null,
// //                 size: fields.size || null,
// //                 color: fields.color || null,
// //                 imageUrl,
// //                 gallery: fields.gallery ? JSON.parse(fields.gallery) : [],
// //                 category: { connect: { id: String(fields.categoryId) } },
// //                 user: { connect: { id: dbUser!.id } }, // Clerk user relation
// //               },
// //             });

// //             resolve(NextResponse.json(item, { status: 201 }));
// //           } catch (err: any) {
// //             resolve(NextResponse.json({ error: err.message }, { status: 500 }));
// //           }
// //         });

// //         const nodeStream = toNodeReadable(req.body as ReadableStream<Uint8Array>);
// //         nodeStream.pipe(bb);
// //       });
// //     }

// //     return NextResponse.json({ error: `Unsupported content type: ${contentType}` }, { status: 400 });
// //   } catch (err: any) {
// //     return NextResponse.json({ error: err.message }, { status: 500 });
// //   }
// // }




































// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { uploadExternalImageToCloudinary } from "@/lib/cloudinaryUploadFromUrl";
// import { clerkClient } from "@clerk/nextjs/server";


// /* --------------------------------
//    Helper: find or create DB user
// --------------------------------- */
// async function findOrCreateDBUser(clerkId: string) {
//   let user = await prisma.user.findUnique({
//     where: { clerkId },
//     select: { id: true },
//   });

//   if (!user) {
//     // ✅ fetch Clerk user FIRST
//     const clerkUser = await clerkClient.users.getUser(clerkId);

//     user = await prisma.user.create({
//       data: {
//         clerkId,
//         email:
//           clerkUser.emailAddresses[0]?.emailAddress ||
//           `no-email-${clerkId}@example.com`,
//         name: clerkUser.fullName ?? "",
//       },
//       select: { id: true },
//     });
//   }

//   return user;
// }
// /* --------------------------------
//    GET /api/items
// --------------------------------- */
// export async function GET(req: Request) {
//   try {
//     const { userId: clerkId } = auth(req);

//     if (!clerkId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const url = new URL(req.url);
//     const id = url.searchParams.get("id");

//     if (id) {
//       const item = await prisma.item.findFirst({
//         where: { id, clerkId },
//       });

//       if (!item) {
//         return NextResponse.json({ error: "Item not found" }, { status: 404 });
//       }

//       return NextResponse.json(item);
//     }

//     const items = await prisma.item.findMany({
//       where: { clerkId },
//       orderBy: { createdAt: "desc" },
//     });

//     return NextResponse.json(items);
//   } catch (err: any) {
//     console.error("GET /api/items error:", err);
//     return NextResponse.json(
//       { error: "Failed to fetch items" },
//       { status: 500 }
//     );
//   }
// }

// /* --------------------------------
//    POST /api/items
// --------------------------------- */
// export async function POST(req: Request) {
//   try {
//     const { userId: clerkId } = auth(req);

//     if (!clerkId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const dbUser = await findOrCreateDBUser(clerkId);
//     const body = await req.json();
    

//     if (!body?.name || body.price == null || !body.categoryId) {
//       return NextResponse.json(
//         { error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     const item = await prisma.item.create({
//       data: {
//         name: body.name,
//         price: Number(body.price),
//         sellingPrice:
//           body.sellingPrice != null
//             ? Number(body.sellingPrice)
//             : Number(body.price),
//         unit: body.unit || null,
//         imageUrl: body.imageUrl || null,
//         clerkId,
//         category: { connect: { id: String(body.categoryId) } },
//         user: { connect: { id: dbUser.id } },
//       },
//     });

//     return NextResponse.json(item, { status: 201 });
//   } catch (err: any) {
//     console.error("POST /api/items error:", err);
//     return NextResponse.json(
//       { error: "Failed to save item" },
//       { status: 500 }
//     );
//   }
// }

// /* --------------------------------
//    PUT /api/items
// --------------------------------- */
// export async function PUT(req: Request) {
//   try {
//     const { userId: clerkId } = auth(req);

//     if (!clerkId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const body = await req.json();
//     const { id, name, sellingPrice, unit, categoryId, imageUrl } = body;

//     if (!id || !name) {
//       return NextResponse.json(
//         { error: "Item id and name are required" },
//         { status: 400 }
//       );
//     }

//     const existing = await prisma.item.findFirst({
//       where: { id, clerkId },
//       select: { id: true },
//     });

//     if (!existing) {
//       return NextResponse.json(
//         { error: "Item not found" },
//         { status: 404 }
//       );
//     }

//     const updated = await prisma.item.update({
//       where: { id },
//       data: {
//         name,
//         sellingPrice:
//           sellingPrice !== undefined ? Number(sellingPrice) : undefined,
//         unit: unit ?? undefined,
//         imageUrl: imageUrl ?? undefined,
//         categoryId:
//           categoryId === "uncategorised" ? null : categoryId ?? undefined,
//       },
//     });

//     return NextResponse.json(updated);
//   } catch (err: any) {
//     console.error("PUT /api/items error:", err);
//     return NextResponse.json(
//       { error: "Failed to update item" },
//       { status: 500 }
//     );
//   }
// }

// /* --------------------------------
//    DELETE /api/items
// --------------------------------- */
// export async function DELETE(req: Request) {
//   try {
//     const { userId: clerkId } = auth(req);

//     if (!clerkId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     let id: string | null = null;

//     const url = new URL(req.url);
//     id = url.searchParams.get("id");

//     if (!id) {
//       try {
//         const body = await req.json();
//         id = body?.id || null;
//       } catch {}
//     }

//     if (!id) {
//       return NextResponse.json(
//         { error: "Item id required" },
//         { status: 400 }
//       );
//     }

//     const existing = await prisma.item.findFirst({
//       where: { id, clerkId },
//       select: { id: true },
//     });

//     if (!existing) {
//       return NextResponse.json(
//         { error: "Item not found" },
//         { status: 404 }
//       );
//     }

//     await prisma.item.delete({ where: { id } });

//     return NextResponse.json({ success: true });
//   } catch (err: any) {
//     console.error("DELETE /api/items error:", err);
//     return NextResponse.json(
//       { error: "Failed to delete item" },
//       { status: 500 }
//     );
//   }
// }














// src/app/api/items/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { request } from "http";

/* --------------------------------
   Helper: find or create DB user
--------------------------------- */
async function findOrCreateDBUser(clerkId: string) {
  let user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    // ✅ fetch Clerk user to get email
    const clerkUser = await clerkClient.users.getUser(clerkId);

    user = await prisma.user.create({
      data: {
        clerkId,
        name: clerkUser.fullName ?? "",
        email:
          clerkUser.emailAddresses[0]?.emailAddress ??
          `no-email-${clerkId}@example.com`,
      },
      select: { id: true },
    });
  }

  return user;
}

/* --------------------------------
   GET /api/items
--------------------------------- */
export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (id) {
      const item = await prisma.item.findFirst({
        where: { id, clerkId },
      });

      if (!item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      return NextResponse.json(item);
    }

    const items = await prisma.item.findMany({
      where: { clerkId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (err) {
    console.error("GET /api/items error:", err);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

/* --------------------------------
   POST /api/items
--------------------------------- */
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await findOrCreateDBUser(clerkId);
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
        clerkId,
        category: { connect: { id: String(body.categoryId) } },
        user: { connect: { id: dbUser.id } },
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("POST /api/items error:", err);
    return NextResponse.json(
      { error: "Failed to save item" },
      { status: 500 }
    );
  }
}

/* --------------------------------
   PUT /api/items
--------------------------------- */
export async function PUT(req: Request) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
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

    const existing = await prisma.item.findFirst({
      where: { id, clerkId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Item not found" },
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
  } catch (err) {
    console.error("PUT /api/items error:", err);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

/* --------------------------------
   DELETE /api/items
--------------------------------- */
export async function DELETE(req: Request) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    let id = url.searchParams.get("id");

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

    const existing = await prisma.item.findFirst({
      where: { id, clerkId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    await prisma.item.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/items error:", err);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
