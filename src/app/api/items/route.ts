


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
import { getEffectiveClerkId } from "@/lib/auth-utils";
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
    // Get Clerk client (IMPORTANT)
    const client = await clerkClient();

    // ✅ fetch Clerk user to get email
    const clerkUser = await client.users.getUser(clerkId);

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

// Helper to check if string is a valid MongoDB ObjectId
const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

/* --------------------------------
   GET /api/items
--------------------------------- */
export async function GET(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (id) {
      const item = await prisma.item.findFirst({
        where: { id, clerkId: effectiveId },
      });

      if (!item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      return NextResponse.json(item);
    }

    const categoryId = url.searchParams.get("categoryId");

    const items = await prisma.item.findMany({
      where: {
        clerkId: effectiveId,
        ...(categoryId ? { categoryId } : {})
      },
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        addonGroups: true
      }
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
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await findOrCreateDBUser(effectiveId);
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
        description: body.description || null,
        clerkId: effectiveId,
        categoryId: (body.categoryId && isValidObjectId(String(body.categoryId))) 
          ? String(body.categoryId) 
          : null,
        userId: dbUser.id,
        // Enhanced Fields
        isVeg: body.isVeg !== undefined ? Boolean(body.isVeg) : true,
        isEgg: body.isEgg !== undefined ? Boolean(body.isEgg) : false,
        isBestseller: Boolean(body.isBestseller),
        isRecommended: Boolean(body.isRecommended),
        isNew: Boolean(body.isNew),
        spiciness: body.spiciness || null,
        rating: body.rating != null ? Number(body.rating) : 4.5,
        hiName: body.hiName || null,
        mrName: body.mrName || null,
        taName: body.taName || null,
        upsellText: body.upsellText || null,
        hsnCode: body.hsnCode || null,
        taxStatus: body.taxStatus || "Without Tax",
        gst: body.gst != null ? Number(body.gst) : 0,
        openingStock: body.openingStock != null ? Number(body.openingStock) : 0,
        currentStock: body.currentStock != null ? Number(body.currentStock) : 0,
        reorderLevel: body.reorderLevel != null ? Number(body.reorderLevel) : 0,
        variants: body.variants || null,
        addonGroupIds: body.addonGroupIds || [],
      },
      include: {
        category: true,
        addonGroups: true
      }
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/items error:", err);
    return NextResponse.json(
      { error: "Failed to save item", details: err?.message },
      { status: 500 }
    );
  }
}

/* --------------------------------
   PUT /api/items
--------------------------------- */
export async function PUT(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, sellingPrice, unit, categoryId, imageUrl, description } = body;

    // 🟢 BULK UPDATE SUPPORT
    if (body.ids && Array.isArray(body.ids)) {
      const ids = body.ids;
      await prisma.item.updateMany({
        where: { id: { in: ids }, clerkId: effectiveId },
        data: {
          isVeg: body.isVeg !== undefined ? Boolean(body.isVeg) : undefined,
          isEgg: body.isEgg !== undefined ? Boolean(body.isEgg) : undefined,
          isBestseller: body.isBestseller !== undefined ? Boolean(body.isBestseller) : undefined,
          isRecommended: body.isRecommended !== undefined ? Boolean(body.isRecommended) : undefined,
          isNew: body.isNew !== undefined ? Boolean(body.isNew) : undefined,
          categoryId: (categoryId === "uncategorised" || categoryId === "__uncategorised__") ? null : categoryId ?? undefined,
          taxStatus: body.taxStatus !== undefined ? body.taxStatus : undefined,
          gst: body.gst !== undefined ? Number(body.gst) : undefined,
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        }
      });
      return NextResponse.json({ success: true, count: ids.length });
    }

    if (!id || !name) {
      return NextResponse.json(
        { error: "Item id and name are required" },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const existing = await prisma.item.findFirst({
      where: { id, clerkId: effectiveId },
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
        description: description ?? undefined,
        categoryId: (categoryId && isValidObjectId(String(categoryId))) 
          ? String(categoryId) 
          : (categoryId === "uncategorised" || categoryId === "__uncategorised__") ? null : undefined,
        isVeg: body.isVeg !== undefined ? Boolean(body.isVeg) : undefined,
        isEgg: body.isEgg !== undefined ? Boolean(body.isEgg) : undefined,
        isBestseller: body.isBestseller !== undefined ? Boolean(body.isBestseller) : undefined,
        isRecommended: body.isRecommended !== undefined ? Boolean(body.isRecommended) : undefined,
        isNew: body.isNew !== undefined ? Boolean(body.isNew) : undefined,
        spiciness: body.spiciness !== undefined ? body.spiciness : undefined,
        rating: body.rating !== undefined ? Number(body.rating) : undefined,
        hiName: body.hiName !== undefined ? body.hiName : undefined,
        mrName: body.mrName !== undefined ? body.mrName : undefined,
        taName: body.taName !== undefined ? body.taName : undefined,
        upsellText: body.upsellText !== undefined ? body.upsellText : undefined,
        hsnCode: body.hsnCode !== undefined ? body.hsnCode : undefined,
        taxStatus: body.taxStatus !== undefined ? body.taxStatus : undefined,
        gst: body.gst !== undefined ? Number(body.gst) : undefined,
        openingStock: body.openingStock !== undefined ? Number(body.openingStock) : undefined,
        currentStock: body.currentStock !== undefined ? Number(body.currentStock) : undefined,
        reorderLevel: body.reorderLevel !== undefined ? Number(body.reorderLevel) : undefined,
        variants: body.variants !== undefined ? body.variants : undefined,
        addonGroupIds: body.addonGroupIds !== undefined ? body.addonGroupIds : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      },
      include: {
        category: true,
        addonGroups: true
      }
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
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const deleteAll = url.searchParams.get("all") === "true";
    let id = url.searchParams.get("id");

    if (deleteAll) {
      const result = await prisma.item.deleteMany({
        where: { clerkId: effectiveId }
      });
      return NextResponse.json({ success: true, count: result.count });
    }

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id || null;
      } catch { }
    }

    if (!id) {
      return NextResponse.json(
        { error: "Item id required" },
        { status: 400 }
      );
    }

    const existing = await prisma.item.findFirst({
      where: { id, clerkId: effectiveId },
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
