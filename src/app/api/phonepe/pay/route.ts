import { NextResponse } from "next/server";
import axios from "axios";
import { prisma } from "@/lib/prisma";
import { getAccessToken } from "@/lib/phonepe";
import { auth } from "@clerk/nextjs/server";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const PAY_URL = "https://api.phonepe.com/apis/pg/checkout/v2/pay";
const JWT_SECRET = process.env.JWT_SECRET || "kravy_pos_secret_key_123";

export async function POST(req: Request) {
  try {
    // 1. Check Clerk Auth
    const { userId: clerkIdFromClerk } = await auth();
    let clerkUserId = clerkIdFromClerk;

    // 2. If no Clerk ID, check Custom Auth Cookie
    if (!clerkUserId) {
      const cookieStore = await cookies();
      const token = cookieStore.get("kravy_auth_token")?.value;
      
      if (token) {
        try {
          const decoded: any = jwt.verify(token, JWT_SECRET);
          clerkUserId = decoded.clerkId || decoded.userId; // Use clerkId from token
        } catch (err) {
          console.error("JWT Verify Error in Pay Route:", err);
        }
      }
    }

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized - Please login first" }, { status: 401 });
    }

    const { amount, customer, items } = await req.json();

    const host = req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
    // Force using the working domain for PhonePe initiation to bypass whitelisting issues
    const baseUrl = "https://www.kravy.in"; 

    const token = await getAccessToken();
    const merchantOrderId = "OMO" + Date.now();

    const cleanPhone = customer.phone.replace(/\D/g, '').slice(-10);

    /* ---------- PHONEPE PAYLOAD ---------- */
    const payload = {
      merchantOrderId,
      amount: Math.round(amount * 100),
      paymentFlow: {
        type: "PG_CHECKOUT",
        merchantUrls: {
          redirectUrl: `${baseUrl}/payment/result/${merchantOrderId}`
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
