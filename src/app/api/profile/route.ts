import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getEffectiveClerkId } from "@/lib/auth-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =============================
   GET BUSINESS PROFILE
============================= */
export async function GET(request: Request) {
  try {
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const profile = await prisma.businessProfile.findFirst({
      where: { userId: effectiveId },
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
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const profile = await prisma.businessProfile.upsert({
      where: { userId: effectiveId },

      update: {
        businessType: body.businessType !== undefined ? body.businessType : undefined,
        businessName: body.businessName !== undefined ? body.businessName : undefined,
        businessTagLine: body.businessTagline !== undefined ? body.businessTagline : (body.businessTagLine !== undefined ? body.businessTagLine : undefined),

        contactPersonName: body.contactName !== undefined ? body.contactName : (body.contactPersonName !== undefined ? body.contactPersonName : undefined),
        contactPersonPhone: body.contactPhone !== undefined ? body.contactPhone : (body.contactPersonPhone !== undefined ? body.contactPersonPhone : undefined),
        contactPersonEmail: body.contactEmail !== undefined ? body.contactEmail : (body.contactPersonEmail !== undefined ? body.contactPersonEmail : undefined),

        upi: body.upi !== undefined ? body.upi : undefined,

        profileImageUrl: body.profileImage !== undefined ? body.profileImage : (body.profileImageUrl !== undefined ? body.profileImageUrl : undefined),
        logoUrl: body.logo !== undefined ? body.logo : (body.logoUrl !== undefined ? body.logoUrl : undefined),
        signatureUrl: body.signature !== undefined ? body.signature : (body.signatureUrl !== undefined ? body.signatureUrl : undefined),

        gstNumber: body.gstNumber !== undefined ? body.gstNumber : undefined,
        businessAddress: body.businessAddress !== undefined ? body.businessAddress : undefined,
        state: body.state !== undefined ? body.state : undefined,
        district: body.district !== undefined ? body.district : undefined,
        pinCode: body.pinCode !== undefined ? body.pinCode : undefined,
        
        taxEnabled: body.taxEnabled !== undefined ? body.taxEnabled : undefined,
        taxRate: body.taxRate !== undefined ? body.taxRate : undefined,
        upiQrEnabled: body.upiQrEnabled !== undefined ? body.upiQrEnabled : undefined,
        menuLinkEnabled: body.menuLinkEnabled !== undefined ? body.menuLinkEnabled : undefined,
        greetingMessage: body.greetingMessage !== undefined ? body.greetingMessage : undefined,
        businessNameSize: body.businessNameSize !== undefined ? body.businessNameSize : undefined,
      },

      create: {
        userId: effectiveId,

        businessType: body.businessType ?? null,
        businessName: body.businessName ?? null,
        businessTagLine: body.businessTagline ?? body.businessTagLine ?? null,

        contactPersonName: body.contactName ?? body.contactPersonName ?? null,
        contactPersonPhone: body.contactPhone ?? body.contactPersonPhone ?? null,
        contactPersonEmail: body.contactEmail ?? body.contactPersonEmail ?? null,

        upi: body.upi ?? null,

        profileImageUrl: body.profileImage ?? body.profileImageUrl ?? null,
        logoUrl: body.logo ?? body.logoUrl ?? null,
        signatureUrl: body.signature ?? body.signatureUrl ?? null,

        gstNumber: body.gstNumber ?? null,
        businessAddress: body.businessAddress ?? null,
        state: body.state ?? null,
        district: body.district ?? null,
        pinCode: body.pinCode ?? null,
        taxEnabled: body.taxEnabled ?? true,
        taxRate: body.taxRate ?? 5.0,
        upiQrEnabled: body.upiQrEnabled ?? true,
        menuLinkEnabled: body.menuLinkEnabled ?? true,
        greetingMessage: body.greetingMessage ?? "Thank You 🙏 Visit Again!",
        businessNameSize: body.businessNameSize ?? "large",
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
