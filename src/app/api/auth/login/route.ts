import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "kravy_pos_secret_key_123";

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json(); // identifier can be email or phone

    if (!identifier || !password) {
      return NextResponse.json({ error: "Identifier and password are required" }, { status: 400 });
    }

    // 🔍 1. Find user by email OR phone
    // Normalize identifier: if it's a 10-digit number, we try to match it more flexibly
    const cleanIdentifier = identifier.trim().toLowerCase();
    
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier },
          { phone: cleanIdentifier },
          { secondaryEmails: { has: cleanIdentifier } },
          { secondaryPhones: { has: cleanIdentifier } },
          // Try to match if the user provided 10 digits but DB has +91
          { phone: { endsWith: cleanIdentifier.length >= 10 ? cleanIdentifier.slice(-10) : cleanIdentifier } }
        ],
        isDisabled: false
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found with this Email/Phone" }, { status: 401 });
    }

    // 🛑 2. Check if verified
    if (!user.isVerified) {
      return NextResponse.json({ 
        error: "Account not verified. Please check your email for OTP.", 
        notVerified: true,
        email: user.email 
      }, { status: 403 });
    }

    // 🔐 3. Compare Password
    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect Password" }, { status: 401 });
    }

    // 🎟️ 4. Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        // Use ownerId as clerkId so the system recognizes the business context
        clerkId: user.ownerId || user.clerkId, 
        role: user.role,
        email: user.email,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 🍪 5. Set Cookie (Optional but recommended for Next.js)
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        clerkId: user.clerkId
      },
      token
    });

    response.cookies.set("kravy_auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error) {
    console.error("LOGIN_ERROR:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
