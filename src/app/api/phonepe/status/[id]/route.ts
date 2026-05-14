import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPhonePeStatus } from "@/lib/phonepe";

async function generateInvoiceNumber() {
    let invoiceNumber = "";
    let exists = true;
    while (exists) {
      invoiceNumber = "INV-" + Math.floor(100000 + Math.random() * 900000);
      const order = await prisma.subscriptionOrder.findUnique({
        where: { invoiceNumber }
      });
      if (!order) exists = false;
    }
    return invoiceNumber;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const order = await prisma.subscriptionOrder.findUnique({
    where: { merchantOrderId: id }
  });

  if (!order) {
    return NextResponse.json({ status: "NOT_FOUND" }, { status: 404 });
  }

  // If status is PENDING, double-check with PhonePe
  if (order.paymentStatus === "PENDING") {
    const { status: phonePeStatus } = await checkPhonePeStatus(id);
    
    if (phonePeStatus === "COMPLETED" || phonePeStatus === "SUCCESS") {
      const invoiceNumber = await generateInvoiceNumber();
      
      // Update Order
      await prisma.subscriptionOrder.update({
        where: { merchantOrderId: id },
        data: {
          paymentStatus: "SUCCESS",
          paidAt: new Date(),
          invoiceNumber
        }
      });

      // Update Business Profile to Premium
      await prisma.businessProfile.update({
        where: { userId: order.clerkUserId },
        data: {
          isPremium: true,
          showPremiumPopup: false
        }
      });

    } else if (phonePeStatus === "FAILED" || phonePeStatus === "FAIL") {
      await prisma.subscriptionOrder.update({
        where: { merchantOrderId: id },
        data: {
          paymentStatus: "FAILED"
        }
      });
    }
  }

  // Fetch updated order
  const updatedOrder = await prisma.subscriptionOrder.findUnique({
    where: { merchantOrderId: id }
  });

  return NextResponse.json({
    status: updatedOrder?.paymentStatus,
    order: updatedOrder
  });
}
