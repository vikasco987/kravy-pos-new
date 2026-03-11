import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import cloudinary from "@/lib/cloudinary";
import QRCode from "qrcode";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: authUserId } = await auth();
    const searchParams = req.nextUrl.searchParams;
    const clerkIdParam = searchParams.get("clerkId");

    const { id } = await context.params;

    /* ================= FETCH BILL ================= */
    const bill = await prisma.billManager.findUnique({
      where: { id },
    });

    if (!bill) {
      console.error("BILL NOT FOUND:", id);
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Security: Must be authorized via session OR matching clerkId param
    const isAuthorized = authUserId === bill.clerkUserId || clerkIdParam === bill.clerkUserId;

    if (!isAuthorized) {
      console.warn("UNAUTHORIZED ACCESS ATTEMPT:", { id, authUserId, clerkIdParam });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* ================= FETCH BUSINESS PROFILE ================= */
    const business = await prisma.businessProfile.findFirst({
      where: { userId: bill.clerkUserId },
    });

    /* ================= PDF SETUP ================= */
    const pdfDoc = await PDFDocument.create();

    // 80mm thermal width is approx 226 points. 
    // We'll use 250 points for a bit more breathing room on digital screens.
    // Height will be dynamic (we'll start with 600 and adjust if needed, but for now fixed 800 is safer)
    const page = pdfDoc.addPage([250, 800]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 780;

    const line = (text: string, size = 9, align: 'left' | 'center' | 'right' = 'left', isBold = false) => {
      if (!text) return;
      const currentFont = isBold ? fontBold : font;
      const textWidth = currentFont.widthOfTextAtSize(text, size);
      
      let x = 15;
      if (align === 'center') x = (250 - textWidth) / 2;
      if (align === 'right') x = 250 - 15 - textWidth;

      page.drawText(text, { x, y, size, font: currentFont });
      y -= size + 5;
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
        // Check if it's png or jpg based on URL or content type ideally
        // For now, embedPng is safer if we don't know, or try-catch
        let logoImage;
        if (business.logoUrl.toLowerCase().endsWith('.png')) {
            logoImage = await pdfDoc.embedPng(logoBytes);
        } else {
            logoImage = await pdfDoc.embedJpg(logoBytes);
        }
        
        const dims = logoImage.scale(0.5);
        // Center the logo
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
        console.error("Logo embed failed:", e);
      }
    }

    /* ================= HEADER ================= */
    line(business?.businessName || "KRAVY POS", 14, 'center', true);
    if (business?.businessTagLine) {
      line(business.businessTagLine, 8, 'center');
    }
    y -= 5;

    // Address & Info
    if (business?.businessAddress) line(business.businessAddress, 8, 'center');
    if (business?.contactPersonPhone) line(`Ph: ${business.contactPersonPhone}`, 8, 'center');
    if (business?.gstNumber) line(`GSTIN: ${business.gstNumber}`, 8, 'center');

    hr();

    /* ================= BILL META ================= */
    page.drawText(`Bill No: ${bill.billNumber}`, { x: 15, y, size: 9, font: fontBold });
    page.drawText(`Date: ${new Date(bill.createdAt).toLocaleDateString('en-IN')}`, { x: 130, y, size: 8, font });
    y -= 12;
    line(`Customer: ${bill.customerName || "Cash Customer"}`, 8);
    hr();

    /* ================= TABLE HEADER ================= */
    page.drawText("Item", { x: 15, y, size: 8, font: fontBold });
    page.drawText("Qty", { x: 130, y, size: 8, font: fontBold });
    page.drawText("Total", { x: 200, y, size: 8, font: fontBold });
    y -= 12;
    hr();

    /* ================= ITEMS ================= */
    const items = Array.isArray(bill.items) ? bill.items : [];
    items.forEach((i: any) => {
      const name = i.name || "Item";
      const qty = Number(i.qty ?? i.quantity ?? 1);
      const rate = Number(i.rate ?? i.price ?? 0);
      const total = qty * rate;

      // Draw name (may wrap if too long, but for now simple)
      const displayName = name.length > 20 ? name.substring(0, 18) + ".." : name;
      page.drawText(displayName, { x: 15, y, size: 8, font });
      page.drawText(`${qty}`, { x: 130, y, size: 8, font });
      page.drawText(`${total.toFixed(2)}`, { x: 200, y, size: 8, font });
      y -= 12;
    });

    hr();

    /* ================= TOTALS ================= */
    const subtotal = Number(bill.subtotal || bill.total || 0);
    const tax = Number(bill.tax || 0);
    const finalTotal = Number(bill.total || 0);

    if (tax > 0) {
      page.drawText("Subtotal:", { x: 130, y, size: 9, font });
      page.drawText(`${subtotal.toFixed(2)}`, { x: 200, y, size: 9, font });
      y -= 12;
      page.drawText(`GST (${business?.taxRate || 5}%):`, { x: 130, y, size: 9, font });
      page.drawText(`${tax.toFixed(2)}`, { x: 200, y, size: 9, font });
      y -= 12;
    }

    page.drawText("GRAND TOTAL:", { x: 100, y, size: 10, font: fontBold });
    page.drawText(`Rs. ${finalTotal.toFixed(2)}`, { x: 180, y, size: 11, font: fontBold });
    y -= 25;

    /* ================= PAYMENT INFO ================= */
    line(`Payment: ${bill.paymentMode || "Cash"} | Status: ${bill.paymentStatus || "Paid"}`, 8, 'center');
    hr();

    /* ================= UPI QR CODE ================= */
    if (bill.paymentMode === "UPI" && business?.upi && business?.upiQrEnabled) {
      try {
        const upiUrl = `upi://pay?pa=${business.upi}&pn=${business.businessName?.replace(/\s/g, '%20')}&am=${finalTotal.toFixed(2)}&cu=INR&tn=Bill%20${bill.billNumber}`;
        const qrDataUrl = await QRCode.toDataURL(upiUrl, { margin: 1, width: 200 });
        const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
        const qrImage = await pdfDoc.embedPng(qrBuffer);
        
        const qrSize = 80;
        page.drawImage(qrImage, {
          x: (250 - qrSize) / 2,
          y: y - qrSize,
          width: qrSize,
          height: qrSize,
        });
        y -= qrSize + 5;
        line("Scan to Pay", 8, 'center', true);
        y -= 5;
      } catch (qrErr) {
        console.error("QR Code generation failed:", qrErr);
      }
    }

    /* ================= FOOTER ================= */
    y -= 10;
    line("Thank you for your visit!", 9, 'center', true);
    line("Please come again", 8, 'center');
    y -= 10;
    line(`Powered by Kravy POS`, 7, 'center');

    /* ================= RESPONSE & CLOUDINARY UPLOAD ================= */
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // Upload to Cloudinary in background/concurrently
    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "kravy_bills",
          public_id: `bill_${bill.billNumber.replace(/[^a-zA-Z0-9]/g, "_")}`,
          resource_type: "raw",
          overwrite: true,
          access_mode: "public"
        },
        (error, result) => {
          if (error) {
            console.error("CLOUDINARY UPLOAD ERROR:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(pdfBuffer);
    });

    if (uploadResult?.secure_url) {
        // Update DB with the Cloudinary URL
        await prisma.billManager.update({
            where: { id: bill.id },
            data: { pdfUrl: uploadResult.secure_url }
        });
    }

    // If JSON requested, return the URL
    if (searchParams.get("json") === "true") {
      return NextResponse.json({ url: uploadResult?.secure_url });
    }

    // Return the professional PDF buffer directly
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${bill.billNumber}.pdf"`,
        "Cache-Control": "public, max-age=31536000",
      },
    });

  } catch (err: any) {
    console.error("PDF GENERATION/UPLOAD FATAL ERROR:", err);
    return NextResponse.json(
      { error: "Failed to generate or share PDF", details: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}