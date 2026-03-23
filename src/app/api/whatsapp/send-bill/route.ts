import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppBill } from "@/lib/whatsapp-bill";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { billId, phone } = await req.json();

    if (!billId) {
      return NextResponse.json({ error: "billId required" }, { status: 400 });
    }

    // DB se bill fetch karo
    const bill = await prisma.billManager.findUnique({
      where: { id: billId },
      include: {
        user: {
          include: {
            profiles: true
          }
        }
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const business = bill.user.profiles?.[0];

    // Customer phone — parameter se ya bill se
    const customerPhone =
      phone || bill.customerPhone;

    if (!customerPhone) {
      return NextResponse.json(
        { error: "Customer phone number nahi mila" },
        { status: 400 }
      );
    }

    // items parse karo agar string hai
    const itemsRaw = typeof bill.items === "string" ? JSON.parse(bill.items) : (bill.items as any[]);

    // BillData format mein convert karo
    const billData = {
      invoiceNo: bill.billNumber,
      date: new Date(bill.createdAt).toLocaleString("en-IN"),
      restaurantName: business?.businessName || "Restaurant",
      restaurantAddress: business?.businessAddress || "",
      gstin: business?.gstNumber || "",
      customerPhone,
      customerName: bill.customerName || undefined,
      items: itemsRaw.map((item: any) => ({
        name: item.name || "Item",
        qty: item.qty || item.quantity || 1,
        price: item.rate || item.price || 0,
        gstRate: item.gst || 0,
      })),
      subtotal: bill.subtotal,
      discountCode: bill.discountCode || undefined,
      discountAmount: bill.discountAmount || 0,
      taxableAmount: bill.subtotal, // Subtotal is used as taxable amount here
      cgst: (bill.tax || 0) / 2,
      sgst: (bill.tax || 0) / 2,
      grandTotal: bill.total,
      paymentMode: bill.paymentMode || "Cash",
    };

    const result = await sendWhatsAppBill(billData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Send failed" },
        { status: 500 }
      );
    }

    // DB mein whatsappSent mark karo
    await prisma.billManager.update({
      where: { id: billId },
      data: {
        whatsappSent: true,
        whatsappSentAt: new Date(),
        whatsappSid: result.messageSid,
      },
    });

    return NextResponse.json({
      success: true,
      messageSid: result.messageSid,
      sentTo: customerPhone,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
