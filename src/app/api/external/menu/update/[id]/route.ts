import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { imageUrl } = await request.json();
    const secret = request.headers.get("x-scraper-secret");

    if (secret !== process.env.SCRAPER_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "No imageUrl provided" }, { status: 400 });
    }

    // Update the image URL for this item
    const updatedItem = await prisma.item.update({
      where: { id },
      data: { imageUrl },
    });

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/external/menu/update error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
