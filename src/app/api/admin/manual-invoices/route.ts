import { NextRequest, NextResponse } from "next/server";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const me = await prisma.user.findUnique({
      where: { clerkId: effectiveId },
      select: { role: true },
    });

    if (!me || me.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invoices = await prisma.manualInvoice.findMany({
      where: { clerkUserId: effectiveId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("GET Manual Invoices Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const me = await prisma.user.findUnique({
      where: { clerkId: effectiveId },
      select: { role: true },
    });

    if (!me || me.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const invoice = await prisma.manualInvoice.create({
      data: {
        clerkUserId: effectiveId,
        invoiceNumber: body.invoiceNumber,
        date: new Date(body.date),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        documentType: body.documentType,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerEmail: body.customerEmail,
        customerAddress: body.customerAddress,
        customerCity: body.customerCity,
        customerState: body.customerState,
        customerPincode: body.customerPincode,
        customerGst: body.customerGst,
        items: body.items,
        subtotal: Number(body.subtotal) || 0,
        discount: Number(body.discount) || 0,
        tax: Number(body.tax) || 0,
        total: Number(body.total) || 0,
        paymentMode: body.paymentMode,
        status: body.status || "UNPAID",
        notes: body.notes,
        bankDetails: body.bankDetails,
        termsConditions: body.termsConditions,
        bankImage: body.bankImage
      }
    });

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("POST Manual Invoice Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
