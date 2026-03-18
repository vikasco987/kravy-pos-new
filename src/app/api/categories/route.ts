import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

// ✅ GET all categories
export async function GET() {
  try {
    const effectiveId = await getEffectiveClerkId();
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { clerkId: effectiveId },
          { clerkId: null },
          { items: { some: { clerkId: effectiveId } } }
        ],
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

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

    // Attempt to update with ownership check
    try {
      const updated = await prisma.category.update({
        where: { id, clerkId: effectiveId },
        data: { name: name.trim() },
      });
      return NextResponse.json(updated, { status: 200 });
    } catch (err) {
      // Legacy fallback: If it belongs to no one, current user claims it
      const legacy = await prisma.category.findUnique({ where: { id } });
      if (legacy && !legacy.clerkId) {
        const updated = await prisma.category.update({
          where: { id },
          data: { name: name.trim(), clerkId: effectiveId },
        });
        return NextResponse.json(updated, { status: 200 });
      }
      throw err;
    }
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

    // Ownership check for products
    await prisma.item.updateMany({
      where: { categoryId: id, clerkId: effectiveId },
      data: { categoryId: null },
    });

    // Delete category
    try {
      await prisma.category.delete({
        where: { id, clerkId: effectiveId },
      });
    } catch (err) {
      // Fallback for legacy categories
      const legacy = await prisma.category.findUnique({ where: { id } });
      if (legacy && !legacy.clerkId) {
        await prisma.category.delete({ where: { id } });
      } else {
        throw err;
      }
    }

    return NextResponse.json({ message: "Category deleted and products moved." }, { status: 200 });
  } catch (error) {
    console.error("❌ Failed to delete category:", error);
    return NextResponse.json({ message: "Failed to delete" }, { status: 500 });
  }
}
