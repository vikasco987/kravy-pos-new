import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("PhonePe Webhook Received:", body);
    
    // In a real scenario, you would verify the X-VERIFY header here
    // and update the order status in the database.
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
