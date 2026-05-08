import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const materials = await prisma.rawMaterial.findMany({
      where: { clerkId: effectiveId },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(materials);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: effectiveId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { name, unit, stock, minStock, price } = body;

    const material = await prisma.rawMaterial.create({
      data: {
        name,
        unit,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 0,
        price: Number(price) || 0,
        clerkId: effectiveId,
        userId: user.id
      }
    });

    return NextResponse.json(material);
  } catch (err) {
    return NextResponse.json({ error: "Failed to create material" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, stock, minStock, price, name } = body;

    const material = await prisma.rawMaterial.update({
      where: { id, clerkId: effectiveId },
      data: {
        name: name !== undefined ? name : undefined,
        stock: stock !== undefined ? Number(stock) : undefined,
        minStock: minStock !== undefined ? Number(minStock) : undefined,
        price: price !== undefined ? Number(price) : undefined,
      }
    });

    return NextResponse.json(material);
  } catch (err) {
    return NextResponse.json({ error: "Failed to update material" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.rawMaterial.delete({
      where: { id, clerkId: effectiveId }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
  }
}
