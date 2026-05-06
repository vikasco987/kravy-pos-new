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
    const existingByEmail = await prisma.user.findUnique({ where: { email: cleanEmail } });
    const existingByPhone = await prisma.user.findFirst({ where: { phone: cleanPhone } });

    if (existingByEmail || existingByPhone) {
      // Case A: Exactly the same user (Email and Phone both match or one matches and the other is empty/same)
      const isSameUser = existingByEmail && existingByPhone && existingByEmail.id === existingByPhone.id;
      const onlyEmailMatches = existingByEmail && !existingByPhone;
      const onlyPhoneMatches = !existingByEmail && existingByPhone;

      // If it's a conflict (Phone belongs to X, but you're trying to use Email Y)
      if (existingByEmail && existingByPhone && existingByEmail.id !== existingByPhone.id) {
        return NextResponse.json({ 
          error: "Conflict: This email and phone number belong to two different accounts." 
        }, { status: 400 });
      }

      // If phone is already taken by someone else
      if (onlyPhoneMatches && existingByPhone.email !== cleanEmail) {
         return NextResponse.json({ 
          error: `The phone number ${cleanPhone} is already linked to another account.` 
        }, { status: 400 });
      }

      // If email is already taken but with a different phone
      if (onlyEmailMatches && existingByEmail.phone && existingByEmail.phone !== cleanPhone) {
         return NextResponse.json({ 
          error: `The email ${cleanEmail} is already linked to another account with a different phone number.` 
        }, { status: 400 });
      }

      // Otherwise, it's a safe "Retry" flow for the SAME user
      const userToUpdate = existingByEmail || existingByPhone;
      if (!userToUpdate) return; // Should not happen

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60000);
      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.update({
        where: { id: userToUpdate.id },
        data: { otpCode, otpExpiry, password: hashedPassword, name } // Also update name if they changed it
      });

      await resend.emails.send({
        from: 'Kravy POS <auth@kravy.in>',
        to: cleanEmail,
        subject: 'Verify your Kravy POS Account',
        html: getOTPEmailTemplate(name, otpCode, 'Verification', { phone: cleanPhone, email: cleanEmail })
      });

      return NextResponse.json({ 
        message: "Account found. A new OTP has been sent to your email for verification.",
        needsVerification: true,
        email: cleanEmail 
      }, { status: 200 });
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

  } catch (error: any) {
    console.error("REGISTER_ERROR:", error);
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      const target = error.meta?.target || '';
      if (target.includes('email')) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
      }
      if (target.includes('phone')) {
        return NextResponse.json({ error: "An account with this phone number already exists." }, { status: 400 });
      }
      return NextResponse.json({ error: "Email or Phone already registered. Please login or reset password." }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to register: " + (error.message || "Unknown error") }, { status: 500 });
  }
}
