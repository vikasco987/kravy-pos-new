


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
