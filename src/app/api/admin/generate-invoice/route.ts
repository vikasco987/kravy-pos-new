import { NextRequest, NextResponse } from "next/server";
import { generateManualInvoicePDF } from "@/lib/pdf/invoice-pdf";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const pdfBytes = await generateManualInvoicePDF(body);

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${Date.now()}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
