import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (itemId) {
      const recipe = await prisma.recipeItem.findMany({
        where: { itemId },
        include: { material: true }
      });
      return NextResponse.json(recipe);
    }

    const allRecipes = await prisma.recipeItem.findMany({
      where: { item: { clerkId: effectiveId } },
      include: { material: true }
    });
    return NextResponse.json(allRecipes);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { itemId, materials } = body; // materials: Array of { materialId, quantity }

    // Clear existing recipe items for this item
    await prisma.recipeItem.deleteMany({
      where: { itemId }
    });

    // Create new recipe items
    const recipeItems = await prisma.recipeItem.createMany({
      data: materials.map((m: any) => ({
        itemId,
        materialId: m.materialId,
        quantity: Number(m.quantity)
      }))
    });

    return NextResponse.json({ success: true, count: recipeItems.count });
  } catch (err) {
    console.error("Recipe POST error:", err);
    return NextResponse.json({ error: "Failed to save recipe" }, { status: 500 });
  }
}
