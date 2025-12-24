// import { NextResponse } from "next/server";
// import { getAuth } from "@clerk/nextjs/server";
// import prisma from "@/lib/prisma";

// export async function POST(req: Request) {
//   try {
//     const { userId } = getAuth(req);

//     if (!userId) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     const body = await req.json();
//     const items = body?.items;

//     if (!Array.isArray(items) || items.length === 0) {
//       return NextResponse.json(
//         { error: "No items provided" },
//         { status: 400 }
//       );
//     }

//     const result = await prisma.storeItem.createMany({
//   data: items.map((item) => ({
//     name: item.name,
//     price: Number(item.price),
//     categoryId: item.categoryId ?? null,
//     clerkId: item.clerkId ?? userId,
//     imageUrl: item.imageUrl ?? null,
//     isActive: item.isActive ?? true,
//   })),
// });

// return NextResponse.json({
//   success: true,
//   insertedCount: result.count,
// });

//   } catch (err) {
//     console.error("STORE ITEM BULK ERROR:", err);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }
      // 1️⃣ Find internal User by clerkId
const user = await prisma.user.findFirst({
  where: { clerkId },
  select: { id: true },
});

if (!user) {
  return NextResponse.json(
    { error: "User record not found for this clerk" },
    { status: 400 }
  );
}

// 2️⃣ MongoDB ObjectId (string)
const userObjectId = user.id;

    const result = await prisma.item.createMany({
  data: items.map((item) => ({
    name: item.name,

    // optional fields (model supports them)
    description: null,
    price: item.price ?? null,
    sellingPrice: item.price ?? null,
    gst: null,
    unit: item.unit ?? null,
    barcode: null,
    imageUrl: item.imageUrl ?? null,

    // relations
    categoryId: item.categoryId ?? null,

    // required fields
clerkId: item.clerkId && item.clerkId.length > 0
  ? item.clerkId
  : loggedInClerkId,
    userId: userObjectId, // 👈 MUST be valid ObjectId string
  })),
});


    return NextResponse.json({
      success: true,
      insertedCount: result.count,
    });
  } catch (err) {
    console.error("ITEM BULK SAVE ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
