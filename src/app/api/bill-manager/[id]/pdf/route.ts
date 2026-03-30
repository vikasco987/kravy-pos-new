import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import cloudinary from "@/lib/cloudinary";
import QRCode from "qrcode";
import { ObjectId } from "mongodb";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  console.log(`[PDF API] STEP 1: API called for Bill ID: ${id}`);

  try {
    const effectiveId = await getEffectiveClerkId();
    const searchParams = req.nextUrl.searchParams;
    const clerkIdParam = searchParams.get("clerkId");

    // VALIDATE MONGODB ID
    if (!ObjectId.isValid(id)) {
      console.error(`[PDF API] ERROR: Invalid MongoDB ID provided: ${id}`);
      return NextResponse.json({ error: "Invalid bill ID format" }, { status: 400 });
    }

    /* ================= FETCH BILL ================= */
    console.log("[PDF API] STEP 2: Fetching bill from database...");
    const bill = await prisma.billManager.findUnique({
      where: { id },
    });

    if (!bill) {
      console.error(`[PDF API] ERROR: Bill not found in DB: ${id}`);
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }
    console.log(`[PDF API] STEP 3: Bill found: ${bill.billNumber}`);

    // Security: Must be authorized via session OR matching clerkId param
    // For staff, effectiveId will be the seller's ID
    const isAuthorized = effectiveId === bill.clerkUserId || clerkIdParam === bill.clerkUserId;

    if (!isAuthorized) {
      console.warn(`[PDF API] UNAUTHORIZED ACCESS ATTEMPT: Bill ${id} by User ${effectiveId || clerkIdParam}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* ================= FETCH BUSINESS PROFILE ================= */
    console.log("[PDF API] STEP 4: Fetching business profile...");
    const business = await prisma.businessProfile.findFirst({
      where: { userId: bill.clerkUserId },
    });

    /* ================= PDF SETUP ================= */
    console.log("[PDF API] STEP 5: Starting PDF generation...");
    const pdfDoc = await PDFDocument.create();

    const items = Array.isArray(bill.items) ? bill.items : [];
    const baseHeight = 450; // Header, Footer, Meta, Tax Breakdown (increased for more info)
    const itemHeight = items.length * 15;
    const qrHeight = (bill.paymentMode === "UPI" && business?.upi) ? 120 : 0;
    const finalHeight = baseHeight + itemHeight + qrHeight;

    const page = pdfDoc.addPage([250, finalHeight]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = finalHeight - 20;

    const line = (text: string, size = 9, align: 'left' | 'center' | 'right' = 'left', isBold = false) => {
      if (!text) return;
      const currentFont = isBold ? fontBold : font;
      const cleanText = text.replace(/[^\x00-\x7F]/g, ""); 
      const textWidth = currentFont.widthOfTextAtSize(cleanText, size);
      
      let x = 15;
      if (align === 'center') x = (250 - textWidth) / 2;
      if (align === 'right') x = 250 - 15 - textWidth;

      page.drawText(cleanText, { x, y, size, font: currentFont });
      y -= size + 5;
    };

    const multiLine = (text: string, size = 8, align: 'left' | 'center' | 'right' = 'center', isBold = false) => {
      if (!text) return;
      const currentFont = isBold ? fontBold : font;
      const cleanText = text.replace(/[^\x00-\x7F]/g, ""); 
      
      const maxWidth = 210; 
      const words = cleanText.split(" ");
      let lines: string[] = [];
      let currentLine = "";

      words.forEach(word => {
        const testLine = currentLine ? currentLine + " " + word : word;
        if (currentFont.widthOfTextAtSize(testLine, size) <= maxWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      });
      if (currentLine) lines.push(currentLine);

      lines.forEach(l => line(l, size, align, isBold));
    };

    const hr = () => {
      page.drawLine({
        start: { x: 15, y: y + 2 },
        end: { x: 235, y: y + 2 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
      y -= 10;
    };

    /* ================= LOGO ================= */
    if (business?.logoUrl) {
      try {
        const logoRes = await fetch(business.logoUrl);
        const logoBytes = await logoRes.arrayBuffer();
        let logoImage;
        if (business.logoUrl.toLowerCase().endsWith('.png')) {
            logoImage = await pdfDoc.embedPng(logoBytes);
        } else {
            logoImage = await pdfDoc.embedJpg(logoBytes);
        }
        
        const dims = logoImage.scale(0.5);
        const logoWidth = 40;
        const logoHeight = (dims.height / dims.width) * logoWidth;
        
        page.drawImage(logoImage, {
          x: (250 - logoWidth) / 2,
          y: y - logoHeight,
          width: logoWidth,
          height: logoHeight,
        });
        y -= logoHeight + 10;
      } catch (e) {
        console.error("[PDF API] Logo embed failed:", e);
      }
    }

    /* ================= HEADER ================= */
    y -= 10;
    multiLine(business?.businessName?.toUpperCase() || "KRAVY POS", 14, 'center', true);
    
    if (business?.businessTagLine) {
      line(business.businessTagLine, 8, 'center');
    }
    
    y -= 5;
    if (business?.businessAddress) {
      multiLine(business.businessAddress, 8, 'center');
    }
    
    y -= 2;
    if (business?.contactPersonPhone) {
      const displayPhone = business.contactPersonPhone.includes("+91") 
        ? business.contactPersonPhone 
        : `+91 ${business.contactPersonPhone}`;
      line(`Mob: ${displayPhone}`, 8, 'center', true);
    }
    
    // GST & FSSAI
    y -= 5;
    const certs = [];
    if (business?.gstNumber) certs.push(`GSTIN: ${business.gstNumber}`);
    if (business?.fssaiEnabled && business?.fssaiNumber) certs.push(`FSSAI: ${business.fssaiNumber}`);
    
    if (certs.length > 0) {
      certs.forEach(c => line(c, 8, 'center', true));
    }

    hr();

    /* ================= BILL META ================= */
    line(`Bill No: ${bill.billNumber}`, 9, 'left', true);
    line(`Date: ${new Date(bill.createdAt).toLocaleDateString('en-IN')}`, 8, 'left');
    
    if (bill.customerName) line(`Customer: ${bill.customerName}`, 8, 'left');
    if (bill.customerPhone) line(`Phone: ${bill.customerPhone}`, 8, 'left');
    // ✅ ADD BUYER GSTIN
    if ((bill as any).buyerGSTIN) line(`Buyer GSTIN: ${(bill as any).buyerGSTIN}`, 8, 'left', true);
    if ((bill as any).placeOfSupply) line(`Place of Supply: ${(bill as any).placeOfSupply}`, 8, 'left');

    hr();

    /* ================= TABLE HEADER ================= */
    page.drawText("Item / HSN", { x: 15, y, size: 8, font: fontBold });
    page.drawText("Qty", { x: 130, y, size: 8, font: fontBold });
    page.drawText("Total", { x: 200, y, size: 8, font: fontBold });
    y -= 12;
    hr();

    /* ================= ITEMS ================= */
    const businessState = (business?.state || "").trim().toLowerCase();
    const billState = ((bill as any).placeOfSupply || businessState).trim().toLowerCase();
    const isInterState = businessState !== "" && billState !== "" && businessState !== billState;
    
    // Track totals for breakdown if not already provided in bill object top-level
    const taxGroups: Record<number, any> = {};

    items.forEach((i: any) => {
      const name = i.name || "Item";
      const hsn = i.hsnCode ? `(${i.hsnCode})` : "";
      const qty = Number(i.qty ?? i.quantity ?? 1);
      const rate = Number(i.rate ?? i.price ?? 0);
      const itemGstRate = i.gst != null ? Number(i.gst) : (business?.taxRate || 0);
      const taxStatus = i.taxStatus || "Without Tax";
      const gross = qty * rate;

      let taxable = gross;
      let gstAmount = 0;
      if (taxStatus === "With Tax") {
        taxable = gross / (1 + itemGstRate / 100);
        gstAmount = gross - taxable;
      } else {
        gstAmount = (gross * itemGstRate) / 100;
      }

      if (itemGstRate > 0) {
        if (!taxGroups[itemGstRate]) taxGroups[itemGstRate] = { rate: itemGstRate, cgst: 0, sgst: 0, igst: 0 };
        if (isInterState) {
          taxGroups[itemGstRate].igst += gstAmount;
        } else {
          taxGroups[itemGstRate].cgst += gstAmount / 2;
          taxGroups[itemGstRate].sgst += gstAmount / 2;
        }
      }

      const displayName = `${name} ${hsn}`;
      const maxWidthName = 110; 
      const words = displayName.split(" ");
      let currentLine = "";
      let itemLines: string[] = [];

      words.forEach(word => {
          const testLine = currentLine ? currentLine + " " + word : word;
          if (font.widthOfTextAtSize(testLine, 7) <= maxWidthName) {
              currentLine = testLine;
          } else {
              itemLines.push(currentLine);
              currentLine = word;
          }
      });
      if (currentLine) itemLines.push(currentLine);

      // First line includes Qty and Total
      page.drawText(itemLines[0] || "", { x: 15, y, size: 7, font });
      page.drawText(`${qty}`, { x: 130, y, size: 8, font });
      page.drawText(`${gross.toFixed(2)}`, { x: 200, y, size: 8, font });
      y -= 10;

      // Wrap-around lines for the name only
      for (let k = 1; k < itemLines.length; k++) {
          page.drawText(itemLines[k], { x: 15, y, size: 7, font });
          y -= 10;
      }
      y -= 5;
    });

    hr();

    /* ================= TOTALS ================= */
    const subtotal = Number(bill.subtotal || 0);
    const tax = Number(bill.tax || 0);
    const finalTotal = Number(bill.total || 0);

    page.drawText("Subtotal:", { x: 130, y, size: 8, font });
    page.drawText(`${subtotal.toFixed(2)}`, { x: 200, y, size: 8, font });
    y -= 12;

    // ✅ DETAILED GST BREAKDOWN
    Object.values(taxGroups).forEach((g: any) => {
      if (isInterState) {
        page.drawText(`IGST (${g.rate}%):`, { x: 130, y, size: 7, font });
        page.drawText(`${g.igst.toFixed(2)}`, { x: 200, y, size: 7, font });
        y -= 10;
      } else {
        page.drawText(`CGST (${g.rate/2}%):`, { x: 130, y, size: 7, font });
        page.drawText(`${g.cgst.toFixed(2)}`, { x: 200, y, size: 7, font });
        y -= 9;
        page.drawText(`SGST (${g.rate/2}%):`, { x: 130, y, size: 7, font });
        page.drawText(`${g.sgst.toFixed(2)}`, { x: 200, y, size: 7, font });
        y -= 10;
      }
    });

    if (Object.keys(taxGroups).length === 0 && tax > 0) {
      page.drawText("GST:", { x: 130, y, size: 8, font });
      page.drawText(`${tax.toFixed(2)}`, { x: 200, y, size: 8, font });
      y -= 12;
    }

    y -= 5; 

    // GRAND TOTAL WITH BLACK HIGHLIGHT
    page.drawRectangle({
      x: 15,
      y: y - 8,
      width: 220,
      height: 22,
      color: rgb(0, 0, 0),
    });
    page.drawText("GRAND TOTAL:", { x: 25, y: y, size: 10, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText(`Rs. ${finalTotal.toFixed(2)}`, { x: 160, y: y, size: 11, font: fontBold, color: rgb(1, 1, 1) });
    y -= 40;

    line(`Payment: ${bill.paymentMode || "Cash"} | Status: ${bill.paymentStatus || "Paid"}`, 8, 'center');
    hr();

    /* ================= UPI QR CODE ================= */
    if (bill.paymentMode === "UPI" && business?.upi && (business as any).upiQrEnabled !== false) {
      try {
        const upiUrl = `upi://pay?pa=${business.upi}&pn=${business.businessName?.replace(/\s/g, '%20')}&am=${finalTotal.toFixed(2)}&cu=INR&tn=Bill%20${bill.billNumber}`;
        const qrDataUrl = await QRCode.toDataURL(upiUrl, { margin: 1, width: 120 });
        const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
        const qrImage = await pdfDoc.embedPng(qrBuffer);
        
        const qrSize = 80;
        page.drawImage(qrImage, {
          x: (250 - qrSize) / 2,
          y: y - qrSize,
          width: qrSize,
          height: qrSize,
        });
        y -= qrSize + 10;
        
        // Scan to Pay with Black Highlight
        page.drawRectangle({
          x: 60,
          y: y - 2,
          width: 130,
          height: 15,
          color: rgb(0, 0, 0),
        });
        page.drawText("SCAN TO PAY", { 
          x: (250 - fontBold.widthOfTextAtSize("SCAN TO PAY", 8)) / 2, 
          y: y + 2, 
          size: 8, 
          font: fontBold, 
          color: rgb(1, 1, 1) 
        });
        y -= 20;
      } catch (qrErr) {
        console.error("[PDF API] QR Code generation failed:", qrErr);
      }
    }

    line("Thank you for your visit!", 9, 'center', true);
    line("Please come again", 8, 'center');
    y -= 10;
    line(`Powered by Kravy POS`, 7, 'center');

    /* ================= RESPONSE & CLOUDINARY UPLOAD ================= */
    console.log("[PDF API] STEP 6: Saving PDF bytes...");
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);
    console.log(`[PDF API] STEP 7: PDF generated, size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

    console.log("[PDF API] STEP 8: Uploading to Cloudinary...");
    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "kravy_bills",
          public_id: `bill_${bill.billNumber.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
          resource_type: "image",
          format: "pdf",
          overwrite: true,
          access_mode: "public"
        },
        (error, result) => {
          if (error) {
            console.error("[PDF API] CLOUDINARY UPLOAD ERROR:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(pdfBuffer);
    });

    if (uploadResult?.secure_url) {
        console.log(`[PDF API] STEP 9: Cloudinary upload success: ${uploadResult.secure_url}`);
        await prisma.billManager.update({
            where: { id: bill.id },
            data: { pdfUrl: uploadResult.secure_url }
        });
    }

    if (searchParams.get("json") === "true") {
      console.log("[PDF API] STEP 10: Returning JSON response.");
      return NextResponse.json({ url: uploadResult?.secure_url });
    }

    console.log("[PDF API] STEP 10: Returning PDF direct response.");
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${bill.billNumber}.pdf"`,
        "Cache-Control": "public, max-age=31536000",
      },
    });

  } catch (err: any) {
    console.error("[PDF API] FATAL ERROR:", err);
    return NextResponse.json(
      { error: "Failed to generate or share PDF", details: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}