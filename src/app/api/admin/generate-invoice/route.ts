import { NextRequest, NextResponse } from "next/server";
import { generateManualInvoicePDF } from "@/lib/pdf/invoice-pdf";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    console.log("Current user role for PDF generation:", role);

    if (role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("PDF Generation Request for:", body.customerName);
    
    const pdfBytes = await generateManualInvoicePDF(body);
    const pdfBuffer = Buffer.from(pdfBytes);
    console.log("PDF Generated Successfully, size:", pdfBuffer.length);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${Date.now()}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("PDF API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
