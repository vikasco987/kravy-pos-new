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

    // Fetch items with no image or placeholder image for this userId (clerkId)
    const items = await prisma.item.findMany({
      where: {
        clerkId: userId,
        OR: [
          { imageUrl: null },
          { imageUrl: "" },
          { imageUrl: { startsWith: "https://picsum.photos" } },
          { imageUrl: { startsWith: "https://source.unsplash.com" } },
          { imageUrl: { startsWith: "https://loremflickr.com" } },
        ],
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
