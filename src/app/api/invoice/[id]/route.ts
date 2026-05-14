import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoice } from "@/lib/generateInvoice";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.subscriptionOrder.findUnique({
      where: { merchantOrderId: id }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus !== "SUCCESS") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const pdfBuffer = await generateInvoice(order);

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${order.invoiceNumber}.pdf`
      }
    });

  } catch (err: any) {
    console.error("Invoice API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
