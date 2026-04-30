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

    console.log("SERVER DEBUG: GET Profile for", effectiveId, 
      "taxEnabled:", profile?.taxEnabled,
      "taxRate:", profile?.taxRate,
      "enableKOTWithBill:", profile?.enableKOTWithBill,
      "enableMenuQRInBill:", profile?.enableMenuQRInBill
    );
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

    let body: any = {};
    try {
      const textBody = await request.text();
      if (textBody) {
        body = JSON.parse(textBody);
      }
      console.log("SERVER DEBUG: POST Profile Body keys:", Object.keys(body));
      console.log("SERVER DEBUG: logo provided:", body.logo ? "YES" : "NO", "logoUrl provided:", body.logoUrl ? "YES" : "NO");
    } catch (e) {
      console.error("Failed to parse profile body:", e);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const profile = await prisma.businessProfile.upsert({
      where: { userId: effectiveId },
      update: {
        businessType: body.businessType !== undefined ? body.businessType : undefined,
        businessName: body.businessName !== undefined ? body.businessName : undefined,
        businessTagLine: body.businessTagline !== undefined ? body.businessTagline : (body.businessTagLine !== undefined ? body.businessTagLine : undefined),

        contactPersonName: body.contactName !== undefined ? body.contactName : (body.contactPersonName !== undefined ? body.contactPersonName : undefined),
        contactPersonPhone: body.contactPhone !== undefined ? body.contactPhone : (body.contactPersonPhone !== undefined ? body.contactPersonPhone : undefined),
        contactPersonEmail: body.contactEmail !== undefined ? body.contactEmail : (body.contactPersonEmail !== undefined ? body.contactPersonEmail : undefined),
        businessEmail: body.businessEmail !== undefined ? body.businessEmail : undefined,

        upi: body.upi !== undefined ? body.upi : undefined,

        profileImageUrl: body.profileImage !== undefined ? body.profileImage : (body.profileImageUrl !== undefined ? body.profileImageUrl : undefined),
        logoUrl: body.logo !== undefined ? body.logo : (body.logoUrl !== undefined ? body.logoUrl : undefined),
        signatureUrl: body.signature !== undefined ? body.signature : (body.signatureUrl !== undefined ? body.signatureUrl : undefined),
        businessTagLine: body.businessTagline !== undefined ? body.businessTagline : (body.businessTagLine !== undefined ? body.businessTagLine : undefined),

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
        fssaiNumber: body.fssaiNumber !== undefined ? body.fssaiNumber : undefined,
        fssaiEnabled: body.fssaiEnabled !== undefined ? body.fssaiEnabled : undefined,
        hsnEnabled: body.hsnEnabled !== undefined ? body.hsnEnabled : undefined,
        gstType: body.gstType !== undefined ? body.gstType : undefined,
        perProductTaxEnabled: body.perProductTaxEnabled !== undefined ? body.perProductTaxEnabled : undefined,
        loyaltyPointRatio: body.loyaltyPointRatio !== undefined ? body.loyaltyPointRatio : undefined,
        loyaltyMinRedeem: body.loyaltyMinRedeem !== undefined ? body.loyaltyMinRedeem : undefined,
        aiScraperEnabled: body.aiScraperEnabled !== undefined ? body.aiScraperEnabled : undefined,
        excelImportEnabled: body.excelImportEnabled !== undefined ? body.excelImportEnabled : undefined,
        qrMenuPriceInclusive: body.qrMenuPriceInclusive !== undefined ? body.qrMenuPriceInclusive : undefined,
        enableKOTWithBill: body.enableKOTWithBill !== undefined ? body.enableKOTWithBill : undefined,
        enableMenuQRInBill: body.enableMenuQRInBill !== undefined ? body.enableMenuQRInBill : undefined,
        enableDeliveryCharges: body.enableDeliveryCharges !== undefined ? body.enableDeliveryCharges : undefined,
        deliveryChargeAmount: body.deliveryChargeAmount !== undefined ? body.deliveryChargeAmount : undefined,
        deliveryGstEnabled: body.deliveryGstEnabled !== undefined ? body.deliveryGstEnabled : undefined,
        deliveryGstRate: body.deliveryGstRate !== undefined ? body.deliveryGstRate : undefined,
        enablePackagingCharges: body.enablePackagingCharges !== undefined ? body.enablePackagingCharges : undefined,
        packagingChargeAmount: body.packagingChargeAmount !== undefined ? body.packagingChargeAmount : undefined,
        packagingGstEnabled: body.packagingGstEnabled !== undefined ? body.packagingGstEnabled : undefined,
        packagingGstRate: body.packagingGstRate !== undefined ? body.packagingGstRate : undefined,
        syncQuickPosWithKitchen: body.syncQuickPosWithKitchen !== undefined ? body.syncQuickPosWithKitchen : undefined,
      },

      create: {
        userId: effectiveId,

        businessType: body.businessType ?? null,
        businessName: body.businessName ?? null,
        businessTagLine: body.businessTagline ?? body.businessTagLine ?? null,

        contactPersonName: body.contactName ?? body.contactPersonName ?? null,
        contactPersonPhone: body.contactPhone ?? body.contactPersonPhone ?? null,
        contactPersonEmail: body.contactEmail ?? body.contactPersonEmail ?? null,
        businessEmail: body.businessEmail ?? null,

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
        fssaiNumber: body.fssaiNumber ?? null,
        fssaiEnabled: body.fssaiEnabled ?? false,
        hsnEnabled: body.hsnEnabled ?? false,
        gstType: body.gstType ?? "PRODUCT",
        perProductTaxEnabled: body.perProductTaxEnabled ?? false,
        loyaltyPointRatio: body.loyaltyPointRatio ?? 10.0,
        loyaltyMinRedeem: body.loyaltyMinRedeem ?? 100,
        aiScraperEnabled: body.aiScraperEnabled ?? false,
        excelImportEnabled: body.excelImportEnabled ?? false,
        qrMenuPriceInclusive: body.qrMenuPriceInclusive ?? false,
        enableKOTWithBill: body.enableKOTWithBill ?? false,
        enableMenuQRInBill: body.enableMenuQRInBill ?? false,
        enableDeliveryCharges: body.enableDeliveryCharges ?? false,
        deliveryChargeAmount: body.deliveryChargeAmount ?? 0,
        deliveryGstEnabled: body.deliveryGstEnabled ?? false,
        deliveryGstRate: body.deliveryGstRate ?? 0,
        enablePackagingCharges: body.enablePackagingCharges ?? false,
        packagingChargeAmount: body.packagingChargeAmount ?? 0,
        packagingGstEnabled: body.packagingGstEnabled ?? false,
        packagingGstRate: body.packagingGstRate ?? 0,
        syncQuickPosWithKitchen: body.syncQuickPosWithKitchen ?? false,
      },
    });

    console.log("SERVER DEBUG: POST Profile Saved - enableKOTWithBill:", profile.enableKOTWithBill);
    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    console.error("POST /api/profile error:", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
