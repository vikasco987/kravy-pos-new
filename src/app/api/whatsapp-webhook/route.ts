import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyId, customerPhone, items, customerName } = body;
    if (!companyId || !items || items.length === 0) {
      return NextResponse.json({ error: "Invalid Data" }, { status: 400 });
    }
    // Dummy price calculation
    const totalAmount = items.length * 100; 
    // Order ko MongoDB me save karna Prisma ke through
    const newOrder = await prisma.order.create({
      data: {
        companyId: companyId,
        orderSource: "whatsapp",
        customerName: customerName,
        customerPhone: customerPhone,
        totalAmount: totalAmount,
        status: "pending",
        orderItems: {
          create: items.map((item: any) => ({
            name: item.name,
            quantity: item.qty,
            price: 100 
          }))
        }
      }
    });
    return NextResponse.json({ success: true, order: newOrder });
  } catch (error) {
    console.error("WhatsApp Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
