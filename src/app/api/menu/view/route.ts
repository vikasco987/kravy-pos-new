
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // ✔ Works with both: Clerk Cookies & Bearer Token
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Fetch categories created by user
    const categories = await prisma.category.findMany({
      where: { clerkId: userId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    });

    // 3️⃣ Fetch items created by user
    const items = await prisma.item.findMany({
      where: { clerkId: userId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        price: true,
        sellingPrice: true,
        imageUrl: true,
        unit: true,
        categoryId: true,
      },
    });

    // 4️⃣ Fetch uncategorized items
    const uncategorizedItems = await prisma.item.findMany({
      where: {
        clerkId: userId,
        categoryId: null,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      categories,
      items,
      uncategorizedItems,
    });
  } catch (error: any) {
    console.error("Menu view error:", error);
    return NextResponse.json(
      { error: "Server error", details: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}