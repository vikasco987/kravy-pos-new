import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

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
