import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

/* ======================================================
   GET → Fetch all active/inactive discounts
====================================================== */
export async function GET(req: NextRequest) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const offers = await prisma.offer.findMany({
      where: { clerkUserId: effectiveId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ offers });
  } catch (err) {
    console.error("DISCOUNT GET ERROR:", err);
    return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
  }
}

/* ======================================================
   POST → Create new discount/offer
====================================================== */
export async function POST(req: NextRequest) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      code,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      buyItemId,
      buyQty,
      getItemOffId,
      getQty,
      applyOnCategory,
      startDate,
      endDate,
      usageLimit,
      isActive
    } = body;

    if (!title || !discountType) {
      return NextResponse.json({ error: "Title and Type are required" }, { status: 400 });
    }

    // Generate code if missing
    const finalCode = code || title.toUpperCase().replace(/\s+/g, "").slice(0, 10) + Math.floor(Math.random() * 100);

    const offer = await prisma.offer.create({
      data: {
        title,
        description,
        code: finalCode,
        discountType,
        discountValue: Number(discountValue) || 0,
        minOrderValue: Number(minOrderValue) || 0,
        maxDiscount: Number(maxDiscount) || null,
        buyItemId,
        buyQty: Number(buyQty) || 1,
        getItemOffId,
        getQty: Number(getQty) || 1,
        applyOnCategory,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        usageLimit: Number(usageLimit) || 1000,
        isActive: isActive !== undefined ? isActive : true,
        clerkUserId: effectiveId,
      },
    });

    return NextResponse.json({ offer });
  } catch (err) {
    console.error("DISCOUNT POST ERROR:", err);
    return NextResponse.json({ error: "Failed to create offer" }, { status: 500 });
  }
}
