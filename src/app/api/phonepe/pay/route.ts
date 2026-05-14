import { NextResponse } from "next/server";
import axios from "axios";
import { prisma } from "@/lib/prisma";
import { getAccessToken } from "@/lib/phonepe";
import { auth } from "@clerk/nextjs/server";

const PAY_URL = "https://api.phonepe.com/apis/pg/checkout/v2/pay";

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, customer, items } = await req.json();

    const token = await getAccessToken();
    const merchantOrderId = "KPOS" + Date.now();

    /* ---------- PHONEPE PAYLOAD ---------- */
    const payload = {
      merchantOrderId,
      amount: Math.round(amount * 100),
      paymentFlow: {
        type: "PG_CHECKOUT",
        merchantUrls: {
          redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/result/${merchantOrderId}`
        }
      }
    };

    /* ---------- CREATE PAYMENT ---------- */
    const response = await axios.post(
      PAY_URL,
      payload,
      {
        headers: {
          Authorization: `O-Bearer ${token}`,
          "Content-Type": "application/json",
          "X-MERCHANT-ID": process.env.PHONEPE_MERCHANT_ID
        }
      }
    );

    const phonepeOrderId = response.data.orderId;

    /* ---------- SAVE ORDER ---------- */
    await prisma.subscriptionOrder.create({
      data: {
        merchantOrderId,
        phonepeOrderId,
        clerkUserId,
        customer,
        items,
        amount,
        paymentStatus: "PENDING"
      }
    });

    /* ---------- RETURN REDIRECT ---------- */
    const redirectUrl = response.data.redirectUrl || response.data.data?.redirectUrl;

    return NextResponse.json({
      url: redirectUrl
    });

  } catch (err: any) {
    console.error("PhonePe Pay Error:", err.response?.data || err.message);
    return NextResponse.json(
      {
        error: "Payment initiation failed",
        details: err.message
      },
      { status: 500 }
    );
  }
}
