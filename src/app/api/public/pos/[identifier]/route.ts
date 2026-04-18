import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { identifier: string } }
) {
  try {
    const { identifier } = params;

    // 1. Find the business profile by slug or publicId or even ID
    const profile = await prisma.businessProfile.findFirst({
      where: {
        OR: [
          { slug: identifier },
          { publicId: identifier },
          { id: identifier.length === 24 ? identifier : undefined } // Hex ObjectId length
        ]
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            clerkId: true
          }
        }
      }
    });

    if (!profile) {
      return NextResponse.json({ error: "POS not found" }, { status: 404 });
    }

    // 2. Fetch associated data (Categories and Items)
    const [categories, items] = await Promise.all([
      prisma.category.findMany({
        where: { clerkId: profile.userId }
      }),
      prisma.item.findMany({
        where: { clerkId: profile.userId, isActive: true }
      })
    ]);

    // 3. Construct a secure response (Don't leak sensitive user info)
    return NextResponse.json({
      businessName: profile.businessName,
      businessTagLine: profile.businessTagLine,
      logoUrl: profile.logoUrl,
      upi: profile.upi,
      taxEnabled: profile.taxEnabled,
      taxRate: profile.taxRate,
      categories,
      items,
      // Metadata
      slug: profile.slug,
      publicId: profile.publicId
    });
  } catch (error) {
    console.error("PUBLIC POS FETCH ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
