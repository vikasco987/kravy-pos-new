import { NextRequest, NextResponse } from "next/server";
import { generateManualInvoicePDF } from "@/lib/pdf/invoice-pdf";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role in DB
    const me = await prisma.user.findUnique({
      where: { clerkId: effectiveId },
      select: { role: true },
    });

    if (!me || me.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
