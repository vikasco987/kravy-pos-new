import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

/* =============================
   GET BUSINESS PROFILE
============================= */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const profile = await prisma.businessProfile.findFirst({
      where: { userId },
    });

    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

/* =============================
   CREATE / UPDATE PROFILE
============================= */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const profile = await prisma.businessProfile.upsert({
      where: { userId },

      update: {
        businessType: body.businessType ?? null,
        businessName: body.businessName ?? null,
        businessTagLine: body.businessTagline ?? null,

        contactPersonName: body.contactName ?? null,
        contactPersonPhone: body.contactPhone ?? null,
        contactPersonEmail: body.contactEmail ?? null,

        upi: body.upi ?? null,

        profileImageUrl: body.profileImage ?? null,
        logoUrl: body.logo ?? null,
        signatureUrl: body.signature ?? null,

        gstNumber: body.gstNumber ?? null,
        businessAddress: body.businessAddress ?? null,
        state: body.state ?? null,
        district: body.district ?? null,
        pinCode: body.pinCode ?? null,
      },

      create: {
        userId,

        businessType: body.businessType ?? null,
        businessName: body.businessName ?? null,
        businessTagLine: body.businessTagline ?? null,

        contactPersonName: body.contactName ?? null,
        contactPersonPhone: body.contactPhone ?? null,
        contactPersonEmail: body.contactEmail ?? null,

        upi: body.upi ?? null,

        profileImageUrl: body.profileImage ?? null,
        logoUrl: body.logo ?? null,
        signatureUrl: body.signature ?? null,

        gstNumber: body.gstNumber ?? null,
        businessAddress: body.businessAddress ?? null,
        state: body.state ?? null,
        district: body.district ?? null,
        pinCode: body.pinCode ?? null,
      },
    });

    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    console.error("POST /api/profile error:", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
