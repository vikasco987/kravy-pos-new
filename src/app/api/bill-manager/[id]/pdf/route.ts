// import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@clerk/nextjs/server";
// import prisma from "@/lib/prisma";
// import { PDFDocument, StandardFonts } from "pdf-lib";

// export async function GET(
//   req: NextRequest,
//   context: { params: { id: string } }
// ) {
//   const { userId } = auth(req);

//   if (!userId) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   /* ================= FETCH BILL ================= */
//   const bill = await prisma.billManager.findUnique({
//     where: { id: context.params.id },
//   });

//   if (!bill) {
//     return NextResponse.json({ error: "Bill not found" }, { status: 404 });
//   }

//   /* ================= FETCH BUSINESS PROFILE ================= */
//   const business = await prisma.businessProfile.findFirst({
//     where: { userId },
//   });

//   /* ================= PDF SETUP ================= */
//   const pdfDoc = await PDFDocument.create();

//   // 58–80mm thermal width
//   const page = pdfDoc.addPage([300, 600]);

//   const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

//   let y = 560;

//   const line = (text: string, size = 10) => {
//     page.drawText(text, { x: 20, y, size, font });
//     y -= size + 6;
//   };

//   /* ================= HEADER ================= */
//   line(business?.businessName || "Business Name", 12);

//   // Address line
//   if (
//     business?.businessAddress ||
//     business?.district ||
//     business?.state ||
//     business?.pinCode
//   ) {
//     line(
//       `${business?.businessAddress || ""}${
//         business?.district ? ", " + business.district : ""
//       }${business?.state ? ", " + business.state : ""}${
//         business?.pinCode ? " - " + business.pinCode : ""
//       }`,
//       9
//     );
//   }

//   // GST
//   if (business?.gstNumber) {
//     line(`GSTIN: ${business.gstNumber}`, 9);
//   }

//   line("-----------------------------", 9);

//   /* ================= BILL META ================= */
//   line(`Bill No: ${bill.billNumber}`);
//   line(`Date: ${new Date(bill.createdAt).toLocaleString()}`);

//   line(`Customer: ${bill.customerName || "Walk-in Customer"}`);
//   if (bill.customerPhone) {
//     line(`Phone: ${bill.customerPhone}`);
//   }

//   line("-----------------------------", 9);

//  /* ================= ITEMS ================= */
// const items = Array.isArray(bill.items) ? bill.items : [];

// if (items.length === 0) {
//   line("No items");
// } else {
//   items.forEach((i: any) => {
//     line(
//       `${i.name} x${i.qty}   ₹${(i.qty * i.rate).toFixed(2)}`
//     );
//   });
// }

//   /* ================= TOTAL ================= */
//   line(`TOTAL: ₹${bill.total.toFixed(2)}`, 11);
//   line(`Payment: ${bill.paymentMode}`);
//   line(`Status: ${bill.paymentStatus}`);

//   if (bill.paymentMode === "UPI" && bill.upiTxnRef) {
//     line(`Txn Ref: ${bill.upiTxnRef}`, 9);
//   }

//   /* ================= TAGLINE ================= */
//   if (business?.businessTagLine) {
//     line("-----------------------------", 9);
//     line(business.businessTagLine, 9);
//   }

//   line("Thank you 🙏", 10);

//   /* ================= RESPONSE ================= */
//  const pdfBytes = await pdfDoc.save();
// const pdfBuffer = Buffer.from(pdfBytes);

// return new NextResponse(pdfBuffer, {
//   headers: {
//     "Content-Type": "application/pdf",
//     "Content-Disposition": `inline; filename="${bill.billNumber}.pdf"`,
//   },
// });
// }
// 

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { PDFDocument, StandardFonts } from "pdf-lib";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /* ================= FETCH BILL ================= */
  const bill = await prisma.billManager.findUnique({
    where: { id: context.params.id },
  });

  if (!bill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  /* ================= FETCH BUSINESS PROFILE ================= */
  const business = await prisma.businessProfile.findFirst({
    where: { userId },
  });

  /* ================= PDF SETUP ================= */
  const pdfDoc = await PDFDocument.create();

  // 58–80mm thermal width
  const page = pdfDoc.addPage([300, 600]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = 560;

  const line = (text: string, size = 10) => {
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
      `${business?.businessAddress || ""}${
        business?.district ? ", " + business.district : ""
      }${business?.state ? ", " + business.state : ""}${
        business?.pinCode ? " - " + business.pinCode : ""
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
  line(`Date: ${new Date(bill.createdAt).toLocaleString()}`);

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
        line(
          `${i.name} x${i.qty}   ₹${(i.qty * i.rate).toFixed(2)}`
        );
      });
    }

  /* ================= TOTAL ================= */
  line(`TOTAL: ₹${bill.total.toFixed(2)}`, 11);
  line(`Payment: ${bill.paymentMode}`);
  line(`Status: ${bill.paymentStatus}`);

  if (bill.paymentMode === "UPI" && bill.upiTxnRef) {
    line(`Txn Ref: ${bill.upiTxnRef}`, 9);
  }

  /* ================= TAGLINE ================= */
  if (business?.businessTagLine) {
    line("-----------------------------", 9);
    line(business.businessTagLine, 9);
  }

  line("Thank you 🙏", 10);

  /* ================= RESPONSE ================= */
  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${bill.billNumber}.pdf"`,
    },
  });
}