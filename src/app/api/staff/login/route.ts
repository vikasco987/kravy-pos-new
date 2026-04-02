import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
        return NextResponse.json(
            { success: false, message: "Email and password are required!" },
            { status: 400 }
        );
    }

    // 1. Email se staff member ko dhundhein
    const staff = await prisma.staff.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, message: "Staff not found!" },
        { status: 404 }
      );
    }

    // 2. Check if staff is active
    if (staff.status !== "active") {
        return NextResponse.json(
            { success: false, message: "Account is inactive. Please contact your manager." },
            { status: 403 }
        );
    }

    // 3. Password check karein
    // NOTE: For better security, you should use bcrypt to hash and compare passwords.
    // Currently using plain comparison as per your requirement.
    if (staff.password !== password) {
      return NextResponse.json(
        { success: false, message: "Incorrect password!" },
        { status: 401 }
      );
    }

    // 4. Login Success - Staff ka data bhejein
    // We remove sensitive info before sending
    const { password: _, ...staffData } = staff;

    return NextResponse.json({
      success: true,
      message: "Login successful",
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
