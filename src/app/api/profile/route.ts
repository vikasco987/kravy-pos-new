import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.businessProfile.findFirst({
      where: { userId: effectiveId },
    });

    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

/* =============================
   CREATE / UPDATE PROFILE
============================= */
export async function POST(request: Request) {
  console.log("API VERSION: 1.0.6 - Debug Status");
  try {
    const effectiveId = await getEffectiveClerkId();

    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any = {};
    try {
      const textBody = await request.text();
      if (textBody) {
        body = JSON.parse(textBody);
      }
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // --- Data Sanitization ---
    const s = (val: any) => {
      if (val === undefined) return undefined;
      if (val === null) return null;
      const trimmed = String(val).trim();
      return trimmed === "" ? null : trimmed;
    };
    const b = (val: any) => (typeof val === 'boolean' ? val : (val === 'true' ? true : (val === 'false' ? false : undefined)));
    const n = (val: any) => {
      if (val === undefined || val === null || val === "") return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    };

    const updateData: any = {};
    
    // Basic Info
    if (body.businessType !== undefined) updateData.businessType = s(body.businessType);
    if (body.businessName !== undefined) updateData.businessName = s(body.businessName);
    if (body.businessTagline !== undefined || body.businessTagLine !== undefined) {
      updateData.businessTagLine = s(body.businessTagline ?? body.businessTagLine);
    }

    // Contact
    if (body.contactName !== undefined || body.contactPersonName !== undefined) {
      updateData.contactPersonName = s(body.contactName ?? body.contactPersonName);
    }
    if (body.contactPhone !== undefined || body.contactPersonPhone !== undefined) {
      updateData.contactPersonPhone = s(body.contactPhone ?? body.contactPersonPhone);
    }
    if (body.contactEmail !== undefined || body.contactPersonEmail !== undefined) {
      updateData.contactPersonEmail = s(body.contactEmail ?? body.contactPersonEmail);
    }
    // Only include businessEmail IF explicitly provided, otherwise let it be null/omit
    if (body.businessEmail !== undefined) updateData.businessEmail = s(body.businessEmail);
    if (body.upi !== undefined) updateData.upi = s(body.upi);

    // Images
    if (body.profileImage !== undefined || body.profileImageUrl !== undefined) {
      updateData.profileImageUrl = s(body.profileImage ?? body.profileImageUrl);
    }
    if (body.logo !== undefined || body.logoUrl !== undefined) {
      updateData.logoUrl = s(body.logo ?? body.logoUrl);
    }
    if (body.signature !== undefined || body.signatureUrl !== undefined) {
      updateData.signatureUrl = s(body.signature ?? body.signatureUrl);
    }

    // Address & Tax
    if (body.gstNumber !== undefined) updateData.gstNumber = s(body.gstNumber);
    if (body.businessAddress !== undefined) updateData.businessAddress = s(body.businessAddress);
    if (body.state !== undefined) updateData.state = s(body.state);
    if (body.district !== undefined) updateData.district = s(body.district);
    if (body.pinCode !== undefined) updateData.pinCode = s(body.pinCode);
    
    if (body.taxEnabled !== undefined) updateData.taxEnabled = b(body.taxEnabled);
    if (body.taxRate !== undefined) updateData.taxRate = n(body.taxRate);
    if (body.upiQrEnabled !== undefined) updateData.upiQrEnabled = b(body.upiQrEnabled);
    if (body.menuLinkEnabled !== undefined) updateData.menuLinkEnabled = b(body.menuLinkEnabled);
    if (body.greetingMessage !== undefined) updateData.greetingMessage = s(body.greetingMessage);
    if (body.businessNameSize !== undefined) updateData.businessNameSize = s(body.businessNameSize);
    if (body.fssaiNumber !== undefined) updateData.fssaiNumber = s(body.fssaiNumber);
    if (body.fssaiEnabled !== undefined) updateData.fssaiEnabled = b(body.fssaiEnabled);
    if (body.hsnEnabled !== undefined) updateData.hsnEnabled = b(body.hsnEnabled);
    
    if (body.enableMenuQRInBill !== undefined) updateData.enableMenuQRInBill = b(body.enableMenuQRInBill);
    if (body.enableClerkAuth !== undefined) updateData.enableClerkAuth = b(body.enableClerkAuth);
    if (body.enableCustomAuth !== undefined) updateData.enableCustomAuth = b(body.enableCustomAuth);
    if (body.tokenNumberSize !== undefined) updateData.tokenNumberSize = n(body.tokenNumberSize);

    // Other settings
    if (body.posKotEnabled !== undefined) updateData.posKotEnabled = b(body.posKotEnabled);

    console.log("SERVER DEBUG: Final Update Data:", JSON.stringify(updateData, null, 2));

    const profile = await prisma.businessProfile.upsert({
      where: { userId: effectiveId },
      update: updateData,
      create: {
        userId: effectiveId,
        businessType: s(body.businessType) ?? null,
        businessName: s(body.businessName) ?? "My Business",
        businessTagLine: s(body.businessTagline ?? body.businessTagLine) ?? null,
        contactPersonName: s(body.contactName ?? body.contactPersonName) ?? null,
        contactPersonPhone: s(body.contactPhone ?? body.contactPersonPhone) ?? null,
        contactPersonEmail: s(body.contactEmail ?? body.contactPersonEmail) ?? null,
        businessEmail: s(body.businessEmail) ?? null,
        upi: s(body.upi) ?? null,
        profileImageUrl: s(body.profileImage ?? body.profileImageUrl) ?? null,
        logoUrl: s(body.logo ?? body.logoUrl) ?? null,
        signatureUrl: s(body.signature ?? body.signatureUrl) ?? null,
        gstNumber: s(body.gstNumber) ?? null,
        businessAddress: s(body.businessAddress) ?? null,
        state: s(body.state) ?? null,
        district: s(body.district) ?? null,
        pinCode: s(body.pinCode) ?? null,
        taxEnabled: b(body.taxEnabled) ?? true,
        taxRate: n(body.taxRate) ?? 5.0,
        upiQrEnabled: b(body.upiQrEnabled) ?? true,
        menuLinkEnabled: b(body.menuLinkEnabled) ?? true,
        greetingMessage: s(body.greetingMessage) ?? "Thank You 🙏 Visit Again!",
        businessNameSize: s(body.businessNameSize) ?? "large",
        fssaiNumber: s(body.fssaiNumber) ?? null,
        fssaiEnabled: b(body.fssaiEnabled) ?? false,
        hsnEnabled: b(body.hsnEnabled) ?? false,
        enableMenuQRInBill: b(body.enableMenuQRInBill) ?? false,
        enableClerkAuth: b(body.enableClerkAuth) ?? true,
        enableCustomAuth: b(body.enableCustomAuth) ?? false,
        tokenNumberSize: n(body.tokenNumberSize) ?? 22,
      },
    });

    return NextResponse.json(profile, { status: 200 });
  } catch (error: any) {
    console.error("POST /api/profile error DETAILS:", error);
    return NextResponse.json(
      { 
        error: "Failed to save profile", 
        details: error.message || String(error),
        code: error.code 
      },
      { status: 500 }
    );
  }
}
