import { NextRequest, NextResponse } from "next/server";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

    const invoice = await prisma.manualInvoice.update({
      where: { id: params.id, clerkUserId: effectiveId },
      data: {
        invoiceNumber: body.invoiceNumber,
        date: body.date ? new Date(body.date) : undefined,
        dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
        documentType: body.documentType,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerEmail: body.customerEmail,
        customerAddress: body.customerAddress,
        customerCity: body.customerCity,
        customerState: body.customerState,
        customerPincode: body.customerPincode,
        customerGst: body.customerGst,
        companyInfo: body.companyInfo,
        items: body.items,
        subtotal: body.subtotal !== undefined ? Number(body.subtotal) : undefined,
        discount: body.discount !== undefined ? Number(body.discount) : undefined,
        tax: body.tax !== undefined ? Number(body.tax) : undefined,
        total: body.total !== undefined ? Number(body.total) : undefined,
        paymentMode: body.paymentMode,
        status: body.status,
        notes: body.notes,
        bankDetails: body.bankDetails,
        termsConditions: body.termsConditions,
        bankImage: body.bankImage
      }
    });

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("PATCH Manual Invoice Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

    await prisma.manualInvoice.delete({
      where: { id: params.id, clerkUserId: effectiveId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Manual Invoice Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
