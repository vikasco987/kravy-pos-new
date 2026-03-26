import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const secret = request.headers.get("x-scraper-secret");

    if (secret !== process.env.SCRAPER_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch ALL items for this userId (clerkId) to allow full menu inspection
    const items = await prisma.item.findMany({
      where: {
        clerkId: userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
      },
    });

    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("GET /api/external/menu error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
