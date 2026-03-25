import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const secret = request.headers.get("x-scraper-secret");

    if (secret !== process.env.SCRAPER_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all business profiles with some basic item counts
    const businessProfiles = await prisma.businessProfile.findMany({
      select: {
        userId: true,
        businessName: true,
        profileImageUrl: true,
      },
    });

    // For each profile, get the count of items without images
    const usersWithStats = await Promise.all(
      businessProfiles.map(async (profile) => {
        const totalItems = await prisma.item.count({
          where: { clerkId: profile.userId },
        });
        
        const missingImageItems = await prisma.item.count({
          where: {
            clerkId: profile.userId,
            OR: [
              { imageUrl: null },
              { imageUrl: "" },
              { imageUrl: { startsWith: "https://picsum.photos" } },
              { imageUrl: { startsWith: "https://source.unsplash.com" } },
              { imageUrl: { startsWith: "https://loremflickr.com" } },
            ],
          },
        });

        return {
          id: profile.userId,
          name: profile.businessName,
          image: profile.profileImageUrl,
          totalItems,
          missingImages: missingImageItems,
        };
      })
    );

    return NextResponse.json(usersWithStats, { status: 200 });
  } catch (error) {
    console.error("GET /api/external/users error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
