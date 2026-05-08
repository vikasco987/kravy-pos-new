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

/* --------------------------------
   Helper: find or create DB user
--------------------------------- */
async function findOrCreateDBUser(clerkId: string) {
  let user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    if (clerkId.startsWith("custom_")) {
       throw new Error(`Custom User ${clerkId} not found in database.`);
    }
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);

    user = await prisma.user.create({
      data: {
        clerkId,
        name: clerkUser.fullName ?? "",
        email: clerkUser.emailAddresses[0]?.emailAddress ?? `no-email-${clerkId}@example.com`,
      },
      select: { id: true },
    });
  }
  return user;
}

export async function POST(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await findOrCreateDBUser(effectiveId);
    const body = await req.json();
    const { name, unit, stock, minStock, price } = body;

    if (!name || !unit) {
      return NextResponse.json({ error: "Name and Unit are required" }, { status: 400 });
    }

    const material = await prisma.rawMaterial.create({
      data: {
        name,
        unit,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 0,
        price: Number(price) || 0,
        clerkId: effectiveId,
        user: { connect: { id: dbUser.id } }
      }
    });

    return NextResponse.json(material);
  } catch (err: any) {
    console.error("[RAW_MATERIAL_POST_ERROR]:", err);
    return NextResponse.json({ error: "Failed to create material", details: err?.message || String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, stock, minStock, price, name, unit } = body;

    const material = await prisma.rawMaterial.update({
      where: { id, clerkId: effectiveId },
      data: {
        name: name !== undefined ? name : undefined,
        unit: unit !== undefined ? unit : undefined,
        stock: stock !== undefined ? Number(stock) : undefined,
        minStock: minStock !== undefined ? Number(minStock) : undefined,
        price: price !== undefined ? Number(price) : undefined,
      }
    });

    return NextResponse.json(material);
  } catch (err: any) {
    console.error("[RAW_MATERIAL_PATCH_ERROR]:", err);
    return NextResponse.json({ error: "Failed to update material", details: err?.message || String(err) }, { status: 500 });
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
