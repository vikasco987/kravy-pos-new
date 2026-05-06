import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { getOTPEmailTemplate } from "@/lib/mail-templates";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { name, email, phone, password } = await req.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, '');

    // 🛑 1. Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { phone: cleanPhone }
        ]
      }
    });

    if (existingUser) {
      // 🚀 Whether verified or not, let them trigger a password reset flow via OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60000);
      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.update({
        where: { id: existingUser.id },
        data: { otpCode, otpExpiry, password: hashedPassword }
      });

      await resend.emails.send({
        from: 'Kravy POS <auth@kravy.in>',
        to: cleanEmail,
        subject: 'Verify Password Change - Kravy POS',
        html: getOTPEmailTemplate(existingUser.name, otpCode, 'Account Update', { phone: existingUser.phone || undefined, email: existingUser.email })
      });

      return NextResponse.json({ 
        error: "User exists. Please verify OTP to update your password/account.",
        needsVerification: true,
        email: cleanEmail 
      }, { status: 400 });
    }

    // 🔐 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔢 3. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // 📧 4. Create User (Unverified)
    // For custom users, we use a prefixed clerkId to maintain schema relations
    const customClerkId = `custom_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const user = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        phone: cleanPhone,
        password: hashedPassword,
        clerkId: customClerkId,
        otpCode: otp,
        otpExpiry,
        isVerified: false,
        role: "USER" // Default role
      }
    });

    // 🚀 5. Send OTP via Email
    try {
      await resend.emails.send({
        from: 'Kravy POS <auth@kravy.in>', 
        to: cleanEmail,
        subject: 'Verify your Kravy POS Account',
        html: getOTPEmailTemplate(name, otp, 'Verification', { phone: cleanPhone, email: cleanEmail })
      });
    } catch (emailErr) {
      console.error("EMAIL_SEND_ERROR:", emailErr);
      // We don't return error here because user is already created, 
      // they can retry OTP resend later
    }

    return NextResponse.json({ 
      success: true, 
      message: "OTP sent to your email",
      userId: user.id 
    });

  } catch (error) {
    console.error("REGISTER_ERROR:", error);
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }
}
