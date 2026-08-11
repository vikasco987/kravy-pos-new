import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

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

    // 🎟️ 4. Generate Access JWT (15m)
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
      { expiresIn: "15m" }
    );

    // 🎟️ 5. Generate Refresh JWT (90d)
    const jti = crypto.randomUUID();
    const refreshToken = jwt.sign(
      { userId: user.id, jti },
      JWT_SECRET,
      { expiresIn: "90d" }
    );

    // Hash the jti to store securely
    const hashedJti = crypto.createHash('sha256').update(jti).digest('hex');

    // Update user privateMetadata to store valid refresh tokens
    const currentMeta = (user.privateMetadata as any) || {};
    const existingTokens = currentMeta.refreshTokens || [];
    const updatedTokens = [...existingTokens, { jtiHash: hashedJti, createdAt: Date.now() }];
    
    await prisma.user.update({
        where: { id: user.id },
        data: {
            privateMetadata: {
                ...currentMeta,
                refreshTokens: updatedTokens
            }
        }
    });

    // 🍪 6. Set Cookies
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
      maxAge: 15 * 60 // 15 minutes
    });

    response.cookies.set("kravy_refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 90 * 24 * 60 * 60 // 90 days
    });

    // 🔐 6. Track Session
    try {
      const userAgent = req.headers.get("user-agent") || "";
      const ip = req.headers.get("x-forwarded-for") || req.ip || "unknown";
      
      await prisma.userSession.create({
        data: {
          userId: user.id,
          ipAddress: ip,
          userAgent: userAgent,
          deviceType: /mobile|android|iphone/i.test(userAgent) ? "mobile" : "desktop",
          browser: /chrome/i.test(userAgent) ? "Chrome" : /safari/i.test(userAgent) ? "Safari" : /firefox/i.test(userAgent) ? "Firefox" : /edg/i.test(userAgent) ? "Edge" : "Other",
          os: /windows/i.test(userAgent) ? "Windows" : /mac/i.test(userAgent) ? "macOS" : /linux/i.test(userAgent) ? "Linux" : /android/i.test(userAgent) ? "Android" : /iphone|ipad/i.test(userAgent) ? "iOS" : "Other",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
    } catch (sessionErr) {
      console.error("Failed to track custom session:", sessionErr);
    }

    return response;

  } catch (error) {
    console.error("LOGIN_ERROR:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
