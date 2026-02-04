import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { billId, amount, mode } = await req.json();

    if (!billId || !amount || !mode) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: { billId, amount, mode },
    });

    // Optional: update payment status
   await prisma.billManager.update({
  where: { id: billId },
  data: { paymentStatus: "Paid" },
});


    return NextResponse.json(payment);
  } catch (error: any) {
    console.error("Payment Error:", error);
    return NextResponse.json({ message: "Failed to add payment" }, { status: 500 });
  }
}
