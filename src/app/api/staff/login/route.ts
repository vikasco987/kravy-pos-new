import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "kravy_pos_secret_key_123";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
        return NextResponse.json(
            { success: false, message: "Email and password are required!" },
            { status: 400 }
        );
    }

    // 1. Find staff by email
    const staff = await prisma.staff.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, message: "Staff not found!" },
        { status: 404 }
      );
    }

    // 2. Check status
    if (staff.status !== "active") {
        return NextResponse.json(
            { success: false, message: "Account is inactive. Contact your manager." },
            { status: 403 }
        );
    }

    // 3. Compare Password
    const isMatch = await bcrypt.compare(password, staff.password || "");
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Incorrect password!" },
        { status: 401 }
      );
    }

    // 4. Generate JWT
    const token = jwt.sign(
        { 
            staffId: staff.id, 
            email: staff.email, 
            businessId: staff.businessId,
            accessType: staff.accessType,
            permissions: staff.permissions,
            name: staff.name
        },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    // 5. Set Cookie for Browser access
    (await cookies()).set("staff_token", token, {
        httpOnly: false, // Must be false for ClientLayout to detect staff session
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
    });

    // 6. Return response
    const { password: _, ...staffData } = staff;

    // 🔐 6. Track Session
    try {
      const userAgent = req.headers.get("user-agent") || "";
      const ip = req.headers.get("x-forwarded-for") || (req as any).ip || "unknown";
      
      await prisma.userSession.create({
        data: {
          staffId: staff.id,
          ipAddress: ip,
          userAgent: userAgent,
          deviceType: /mobile|android|iphone/i.test(userAgent) ? "mobile" : "desktop",
          browser: /chrome/i.test(userAgent) ? "Chrome" : /safari/i.test(userAgent) ? "Safari" : /firefox/i.test(userAgent) ? "Firefox" : /edg/i.test(userAgent) ? "Edge" : "Other",
          os: /windows/i.test(userAgent) ? "Windows" : /mac/i.test(userAgent) ? "macOS" : /linux/i.test(userAgent) ? "Linux" : /android/i.test(userAgent) ? "Android" : /iphone|ipad/i.test(userAgent) ? "iOS" : "Other",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
    } catch (sessionErr) {
      console.error("Failed to track staff session:", sessionErr);
    }

    return NextResponse.json({
      success: true,
      message: "Login successful",
      token: token,
      data: staffData
    });

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error during login" },
      { status: 500 }
    );
  }
}
