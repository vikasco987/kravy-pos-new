import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

/* ======================================================
   PUT → Update existing discount
====================================================== */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const offer = await prisma.offer.update({
      where: { id, clerkUserId: effectiveId },
      data: {
        title: body.title,
        description: body.description,
        code: body.code,
        discountType: body.discountType,
        discountValue: Number(body.discountValue) || 0,
        minOrderValue: Number(body.minOrderValue) || 0,
        maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
        buyItemId: body.buyItemId,
        buyQty: Number(body.buyQty) || 1,
        getItemOffId: body.getItemOffId,
        getQty: Number(body.getQty) || 1,
        applyOnCategory: body.applyOnCategory,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        usageLimit: Number(body.usageLimit) || 1000,
        isActive: body.isActive,
      },
    });

    return NextResponse.json({ offer });
  } catch (err) {
    console.error("DISCOUNT PUT ERROR:", err);
    return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
  }
}

/* ======================================================
   PATCH → Quick status update
====================================================== */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const offer = await prisma.offer.update({
      where: { id, clerkUserId: effectiveId },
      data: { isActive: body.isActive },
    });

    return NextResponse.json({ offer });
  } catch (err) {
    console.error("DISCOUNT PATCH ERROR:", err);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}

/* ======================================================
   DELETE → Remove discount
====================================================== */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    await prisma.offer.delete({
      where: { id, clerkUserId: effectiveId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DISCOUNT DELETE ERROR:", err);
    return NextResponse.json({ error: "Failed to delete offer" }, { status: 500 });
  }
}
