import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = request.headers.get("x-scraper-secret");

    if (secret !== process.env.SCRAPER_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch business profiles to guide the scraper
    const profiles = await prisma.businessProfile.findMany({
      select: {
        userId: true, // Clerk ID
        businessName: true,
      },
    });

    return NextResponse.json(profiles, { status: 200 });
  } catch (error) {
    console.error("GET /api/external/users error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
