// // src/app/api/categories/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";


// // GET all categories
// export async function GET() {
//   const categories = await prisma.category.findMany({
//     include: { children: true },
//   });
//   return NextResponse.json(categories);
// }

// // POST create category
// export async function POST(req: NextRequest) {
//   const body = await req.json();
//   const category = await prisma.category.create({
//     data: {
//       name: body.name,
//       parentId: body.parentId || null,
//     },
//   });
//   return NextResponse.json(category);
// }










// // app/api/categories/route.ts
// import { NextResponse } from "next/server";
// import prisma from "@/utils/prismaClient";

// export async function GET() {
//   try {
//     const categories = await prisma.category.findMany({
//       select: { id: true, name: true },
//     });

//     // ✅ Ensure ObjectId is sent as string
//     const safeCategories = categories.map((cat) => ({
//       id: cat.id.toString(),
//       name: cat.name,
//     }));

//     return NextResponse.json(safeCategories);
//   } catch (error) {
//     console.error("❌ Error fetching categories:", error);
//     return NextResponse.json(
//       { error: "Failed to load categories" },
//       { status: 500 }
//     );
//   }
// }






// app/api/categories/route.ts
import { NextResponse } from "next/server";
import prisma from "@/utils/prismaClient";
import { getEffectiveClerkId } from "@/lib/auth-utils";

// ✅ GET all categories
export async function GET() {
  try {
    const effectiveId = await getEffectiveClerkId();
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ clerkId: effectiveId }, { clerkId: null }],
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" }, // optional: keep dropdown sorted
    });

    // Ensure IDs are strings (avoids React key warning)
    const safeCategories = categories.map((cat) => ({
      id: String(cat.id),
      name: cat.name,
    }));

    return NextResponse.json(safeCategories, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to load categories" },
      { status: 500 }
    );
  }
}

// ✅ POST new category
export async function POST(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { name } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: "Category name is required" },
        { status: 400 }
      );
    }

    // Avoid duplicates (case-insensitive) for this user
    const existing = await prisma.category.findFirst({
      where: { 
        name: { equals: name.trim(), mode: "insensitive" },
        clerkId: effectiveId
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          message: "Category already exists",
          category: {
            id: String(existing.id),
            name: existing.name,
          },
        },
        { status: 200 }
      );
    }

    const category = await prisma.category.create({
      data: { 
        name: name.trim(),
        clerkId: effectiveId
      },
    });

    return NextResponse.json(
      { id: String(category.id), name: category.name },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Failed to create category:", error);
    return NextResponse.json(
      { message: "Failed to create category" },
      { status: 500 }
    );
  }
}

// ✅ PUT update category name
export async function PUT(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id, name } = await req.json();

    if (!id || !name || !name.trim()) {
      return NextResponse.json(
        { message: "ID and name are required" },
        { status: 400 }
      );
    }

    const updated = await prisma.category.update({
      where: { id, clerkId: effectiveId },
      data: { name: name.trim() },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("❌ Failed to rename category:", error);
    return NextResponse.json({ message: "Failed to rename" }, { status: 500 });
  }
}

// ✅ DELETE category (move products to Uncategorized)
export async function DELETE(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    // 1. Reassign products to None (Uncategorized)
    await prisma.item.updateMany({
      where: { categoryId: id, clerkId: effectiveId },
      data: { categoryId: null },
    });

    // 2. Delete the category
    await prisma.category.delete({
      where: { id, clerkId: effectiveId },
    });

    return NextResponse.json({ message: "Category deleted and products moved." }, { status: 200 });
  } catch (error) {
    console.error("❌ Failed to delete category:", error);
    return NextResponse.json({ message: "Failed to delete" }, { status: 500 });
  }
}
