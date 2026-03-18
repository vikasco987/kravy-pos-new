import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export async function PUT(req: NextRequest) {
  try {
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      id, name, price, sellingPrice, categoryId, 
      gst, taxStatus, hsnCode, description, unit, barcode,
      isVeg, isBestseller, isRecommended, isNew,
      openingStock, currentStock, reorderLevel
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Menu id required" },
        { status: 400 }
      );
    }

    // ✅ Check ownership
    const existing = await prisma.item.findFirst({
      where: {
        id,
        clerkId: effectiveId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // ✅ Update menu item
    const updated = await prisma.item.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        price: price !== undefined ? Number(price) : existing.price,
        sellingPrice: sellingPrice !== undefined ? Number(sellingPrice) : (price !== undefined ? Number(price) : existing.sellingPrice),
        categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
        gst: gst !== undefined ? Number(gst) : existing.gst,
        taxStatus: taxStatus !== undefined ? taxStatus : existing.taxStatus,
        hsnCode: hsnCode !== undefined ? hsnCode : existing.hsnCode,
        description: description !== undefined ? description : existing.description,
        unit: unit !== undefined ? unit : existing.unit,
        barcode: barcode !== undefined ? barcode : existing.barcode,
        isVeg: isVeg !== undefined ? Boolean(isVeg) : existing.isVeg,
        isBestseller: isBestseller !== undefined ? Boolean(isBestseller) : existing.isBestseller,
        isRecommended: isRecommended !== undefined ? Boolean(isRecommended) : existing.isRecommended,
        isNew: isNew !== undefined ? Boolean(isNew) : existing.isNew,
        openingStock: openingStock !== undefined ? Number(openingStock) : existing.openingStock,
        currentStock: currentStock !== undefined ? Number(currentStock) : existing.currentStock,
        reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : existing.reorderLevel,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Menu update error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
