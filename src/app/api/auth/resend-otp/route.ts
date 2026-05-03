import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import { getOTPEmailTemplate } from "@/lib/mail-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🔢 Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpiry
      }
    });

    // 📧 Send OTP
    await resend.emails.send({
      from: 'Kravy POS <auth@kravy.in>',
      to: email,
      subject: 'Your New Verification Code',
      html: getOTPEmailTemplate(user.name, otp, 'Verification')
    });

    return NextResponse.json({ success: true, message: "New OTP sent to your email" });

  } catch (error) {
    console.error("RESEND_OTP_ERROR:", error);
    return NextResponse.json({ error: "Failed to resend OTP" }, { status: 500 });
  }
}
