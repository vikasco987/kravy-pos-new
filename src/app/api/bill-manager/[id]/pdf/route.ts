import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { PDFDocument, StandardFonts } from "pdf-lib";
import cloudinary from "@/lib/cloudinary";

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

    // 58–80mm thermal width (scaled for PDF points)
    const page = pdfDoc.addPage([300, 600]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 560;

    const line = (text: string, size = 10) => {
      if (!text) return;
      page.drawText(text, { x: 20, y, size, font });
      y -= size + 6;
    };

    /* ================= HEADER ================= */
    line(business?.businessName || "Business Name", 12);

    // Address line
    if (
      business?.businessAddress ||
      business?.district ||
      business?.state ||
      business?.pinCode
    ) {
      line(
        `${business?.businessAddress || ""}${business?.district ? ", " + business.district : ""
        }${business?.state ? ", " + business.state : ""}${business?.pinCode ? " - " + business.pinCode : ""
        }`,
        9
      );
    }

    // GST
    if (business?.gstNumber) {
      line(`GSTIN: ${business.gstNumber}`, 9);
    }

    line("-----------------------------", 9);

    /* ================= BILL META ================= */
    line(`Bill No: ${bill.billNumber}`);
    line(`Date: ${new Date(bill.createdAt).toLocaleString('en-IN')}`);

    line(`Customer: ${bill.customerName || "Walk-in Customer"}`);
    if (bill.customerPhone) {
      line(`Phone: ${bill.customerPhone}`);
    }

    line("-----------------------------", 9);


    /* ================= ITEMS ================= */
    const items = Array.isArray(bill.items) ? bill.items : [];

    if (items.length === 0) {
      line("No items");
    } else {
      items.forEach((i: any) => {
        const name = i.name || "Item";
        const qty = Number(i.qty ?? i.quantity ?? 1);
        const rate = Number(i.rate ?? i.price ?? 0);
        line(`${name}  (x${qty})`);
        line(`      @ ₹${rate.toFixed(2)} = ₹${(qty * rate).toFixed(2)}`, 9);
        y -= 2; // Extra spacing
      });
    }

    /* ================= TOTAL ================= */
    line(`TOTAL: ₹${Number(bill.total || 0).toFixed(2)}`, 11);
    line(`Payment: ${bill.paymentMode || "Cash"}`);
    line(`Status: ${bill.paymentStatus || "Paid"}`);

    if (bill.paymentMode === "UPI" && bill.upiTxnRef) {
      line(`Txn Ref: ${bill.upiTxnRef}`, 9);
    }

    /* ================= TAGLINE ================= */
    if (business?.businessTagLine) {
      line("-----------------------------", 9);
      line(business.businessTagLine, 9);
    }

    line("Thank you 🙏", 10);

    /* ================= RESPONSE & CLOUDINARY UPLOAD ================= */
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // Upload to Cloudinary as raw file (PDF)
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

    if (!uploadResult || !uploadResult.secure_url) {
      throw new Error("Failed to get secure URL from Cloudinary");
    }

    // Save URL to database for faster access next time
    await prisma.billManager.update({
      where: { id: bill.id },
      data: { pdfUrl: uploadResult.secure_url }
    });

    // Redirect to the Cloudinary URL
    return NextResponse.redirect(uploadResult.secure_url);

  } catch (err: any) {
    console.error("PDF GENERATION/UPLOAD FATAL ERROR:", err);
    return NextResponse.json(
      { error: "Failed to generate or share PDF", details: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}