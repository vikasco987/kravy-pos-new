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

    // SaaS Logic: Auto-trigger popup after 3 days of trial
    if (profile && !profile.isPremium && !profile.showPremiumPopup) {
      const trialStartedAt = profile.trialStartedAt || profile.createdAt;
      const trialEndsAt = new Date(trialStartedAt);
      trialEndsAt.setDate(trialEndsAt.getDate() + 3); // 3-day trial

      if (new Date() > trialEndsAt) {
        await prisma.businessProfile.update({
          where: { id: profile.id },
          data: { showPremiumPopup: true }
        });
        profile.showPremiumPopup = true;
      }
    }

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
    
    // ✅ QR Ordering Status & Timing (MOVE TO TOP FOR PRIORITY)
    console.log("SERVER DEBUG: body.isOnline =", body.isOnline, "Type =", typeof body.isOnline);
    if (body.isOnline !== undefined) updateData.isOnline = b(body.isOnline);
    if (body.openingTime !== undefined) updateData.openingTime = s(body.openingTime);
    if (body.closingTime !== undefined) updateData.closingTime = s(body.closingTime);
    if (body.offlineMessage !== undefined) updateData.offlineMessage = s(body.offlineMessage);

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
    if (body.businessAddressSize !== undefined) updateData.businessAddressSize = n(body.businessAddressSize);

    // ✅ TAX & PRICING (MISSING FIELDS FIX)
    if (body.perProductTaxEnabled !== undefined) updateData.perProductTaxEnabled = b(body.perProductTaxEnabled);
    if (body.qrMenuPriceInclusive !== undefined) updateData.qrMenuPriceInclusive = b(body.qrMenuPriceInclusive);
    if (body.enableKOTWithBill !== undefined) updateData.enableKOTWithBill = b(body.enableKOTWithBill);
    if (body.syncQuickPosWithKitchen !== undefined) updateData.syncQuickPosWithKitchen = b(body.syncQuickPosWithKitchen);
    
    // ✅ ADDITIONAL CHARGES
    if (body.enableDeliveryCharges !== undefined) updateData.enableDeliveryCharges = b(body.enableDeliveryCharges);
    if (body.deliveryChargeAmount !== undefined) updateData.deliveryChargeAmount = n(body.deliveryChargeAmount);
    if (body.deliveryGstEnabled !== undefined) updateData.deliveryGstEnabled = b(body.deliveryGstEnabled);
    if (body.deliveryGstRate !== undefined) updateData.deliveryGstRate = n(body.deliveryGstRate);
    
    if (body.enablePackagingCharges !== undefined) updateData.enablePackagingCharges = b(body.enablePackagingCharges);
    if (body.packagingChargeAmount !== undefined) updateData.packagingChargeAmount = n(body.packagingChargeAmount);
    if (body.packagingGstEnabled !== undefined) updateData.packagingGstEnabled = b(body.packagingGstEnabled);
    if (body.packagingGstRate !== undefined) updateData.packagingGstRate = n(body.packagingGstRate);

    // POS Checkout Visibility
    if (body.posCashEnabled !== undefined) updateData.posCashEnabled = b(body.posCashEnabled);
    if (body.posUpiEnabled !== undefined) updateData.posUpiEnabled = b(body.posUpiEnabled);
    if (body.posCardEnabled !== undefined) updateData.posCardEnabled = b(body.posCardEnabled);

    // ✅ SaaS Subscription & Premium Popups
    if (body.isPremium !== undefined) updateData.isPremium = b(body.isPremium);
    if (body.showPremiumPopup !== undefined) updateData.showPremiumPopup = b(body.showPremiumPopup);
    if (body.trialStartedAt !== undefined) updateData.trialStartedAt = new Date(body.trialStartedAt);
    if (body.posHoldEnabled !== undefined) updateData.posHoldEnabled = b(body.posHoldEnabled);
    if (body.posSaveEnabled !== undefined) updateData.posSaveEnabled = b(body.posSaveEnabled);
    if (body.posPreviewEnabled !== undefined) updateData.posPreviewEnabled = b(body.posPreviewEnabled);
    if (body.posKotEnabled !== undefined) updateData.posKotEnabled = b(body.posKotEnabled);

    // ✅ MISC SETTINGS
    if (body.gstType !== undefined) updateData.gstType = s(body.gstType);
    if (body.collectCustomerName !== undefined) updateData.collectCustomerName = b(body.collectCustomerName);
    if (body.requireCustomerName !== undefined) updateData.requireCustomerName = b(body.requireCustomerName);
    if (body.collectCustomerPhone !== undefined) updateData.collectCustomerPhone = b(body.collectCustomerPhone);
    if (body.requireCustomerPhone !== undefined) updateData.requireCustomerPhone = b(body.requireCustomerPhone);
    if (body.collectCustomerAddress !== undefined) updateData.collectCustomerAddress = b(body.collectCustomerAddress);
    if (body.requireCustomerAddress !== undefined) updateData.requireCustomerAddress = b(body.requireCustomerAddress);
    if (body.loyaltyPointRatio !== undefined) updateData.loyaltyPointRatio = n(body.loyaltyPointRatio);
    if (body.loyaltyMinRedeem !== undefined) updateData.loyaltyMinRedeem = n(body.loyaltyMinRedeem);
    if (body.aiScraperEnabled !== undefined) updateData.aiScraperEnabled = b(body.aiScraperEnabled);
    if (body.excelImportEnabled !== undefined) updateData.excelImportEnabled = b(body.excelImportEnabled);
    if (body.multiZoneMenuEnabled !== undefined) updateData.multiZoneMenuEnabled = b(body.multiZoneMenuEnabled);
    if (body.phonePrefixType !== undefined) updateData.phonePrefixType = s(body.phonePrefixType);
    if (body.printSettings !== undefined) updateData.printSettings = body.printSettings;
    if (body.reviewUrl !== undefined) updateData.reviewUrl = s(body.reviewUrl);

    if (body.printSettings !== undefined) updateData.printSettings = body.printSettings;
    if (body.reviewUrl !== undefined) updateData.reviewUrl = s(body.reviewUrl);

    console.log("SERVER DEBUG: Final Update Data:", JSON.stringify(updateData, null, 2));

    // ✅ FIX: Use separate find/update/create instead of upsert to avoid MongoDB Atlas pipeline length limit (50 stages)
    const existingProfile = await prisma.businessProfile.findUnique({
      where: { userId: effectiveId }
    });

    let profile;
    if (existingProfile) {
      const fieldCount = Object.keys(updateData).length;
      
      if (fieldCount > 40) {
        // Split updates to avoid MongoDB Atlas pipeline limit
        const keys = Object.keys(updateData);
        const half = Math.ceil(keys.length / 2);
        const chunk1: any = {};
        const chunk2: any = {};
        
        keys.forEach((key, idx) => {
          if (idx < half) chunk1[key] = updateData[key];
          else chunk2[key] = updateData[key];
        });

        // Update in two chunks
        await prisma.businessProfile.update({
          where: { userId: effectiveId },
          data: chunk1
        });
        profile = await prisma.businessProfile.update({
          where: { userId: effectiveId },
          data: chunk2
        });
      } else {
        profile = await prisma.businessProfile.update({
          where: { userId: effectiveId },
          data: updateData
        });
      }
    } else {
      profile = await prisma.businessProfile.create({
        data: {
          ...updateData, // Use the fields we have in updateData
          userId: effectiveId,
          // Ensure mandatory fields have defaults if missing in updateData
          businessName: updateData.businessName ?? s(body.businessName) ?? "My Business",
          taxEnabled: updateData.taxEnabled ?? b(body.taxEnabled) ?? true,
          taxRate: updateData.taxRate ?? n(body.taxRate) ?? 5.0,
          upiQrEnabled: updateData.upiQrEnabled ?? b(body.upiQrEnabled) ?? true,
          menuLinkEnabled: updateData.menuLinkEnabled ?? b(body.menuLinkEnabled) ?? true,
          greetingMessage: updateData.greetingMessage ?? s(body.greetingMessage) ?? "Thank You 🙏 Visit Again!",
          businessNameSize: updateData.businessNameSize ?? s(body.businessNameSize) ?? "large",
          tokenNumberSize: updateData.tokenNumberSize ?? n(body.tokenNumberSize) ?? 22,
          gstType: updateData.gstType ?? s(body.gstType) ?? "PRODUCT",
        }
      });
    }

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
