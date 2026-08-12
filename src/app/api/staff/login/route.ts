import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "kravy_pos_secret_key_123";

export async function POST(req: Request) {
  try {
    const { email, password, source } = await req.json();

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

    if (source === "app") {
      const metadata = (staff.privateMetadata as any) || {};
      if (metadata.createdFrom !== "app") {
        return NextResponse.json(
          { success: false, message: "Staff created from web cannot login to the app." },
          { status: 403 }
        );
      }
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

    const jti = crypto.randomUUID();
    const hashedJti = crypto.createHash('sha256').update(jti).digest('hex');

    // 4. Generate Access JWT (15m)
    const token = jwt.sign(
        { 
            staffId: staff.id, 
            email: staff.email, 
            businessId: staff.businessId,
            accessType: staff.accessType,
            permissions: staff.permissions,
            name: staff.name,
            jtiHash: hashedJti
        },
        JWT_SECRET,
        { expiresIn: "15m" }
    );

    const userAgent = req.headers.get("user-agent") || "";
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const deviceType = /mobile|android|iphone/i.test(userAgent) ? "mobile" : "desktop";
    const browser = /chrome/i.test(userAgent) ? "Chrome" : /safari/i.test(userAgent) ? "Safari" : /firefox/i.test(userAgent) ? "Firefox" : /edg/i.test(userAgent) ? "Edge" : "Other";
    const os = /windows/i.test(userAgent) ? "Windows" : /mac/i.test(userAgent) ? "macOS" : /linux/i.test(userAgent) ? "Linux" : /android/i.test(userAgent) ? "Android" : /iphone|ipad/i.test(userAgent) ? "iOS" : "Other";

    let location = "Unknown Location";
    try {
        if (ip !== "unknown" && ip !== "127.0.0.1" && ip !== "::1") {
            const locRes = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,country`, { signal: AbortSignal.timeout(1500) });
            const locData = await locRes.json();
            if (locData && locData.city) {
                location = `${locData.city}, ${locData.country}`;
            }
        }
    } catch(e) {}

    // 5. Generate Refresh JWT (90d)
    const refreshToken = jwt.sign(
        { staffId: staff.id, jti },
        JWT_SECRET,
        { expiresIn: "90d" }
    );

    // Update staff privateMetadata to store valid refresh tokens
    const currentMeta = staff.privateMetadata as any || {};
    const existingTokens = currentMeta.refreshTokens || [];
    const maxSessions = currentMeta.maxSessions || 15;
    
    const updatedTokens = [...existingTokens, { 
        jtiHash: hashedJti, 
        createdAt: Date.now(),
        ipAddress: ip,
        userAgent: userAgent,
        deviceType: deviceType,
        browser: browser,
        os: os,
        location: location
    }].slice(-maxSessions);
    
    await prisma.staff.update({
        where: { id: staff.id },
        data: {
            privateMetadata: {
                ...currentMeta,
                refreshTokens: updatedTokens
            }
        }
    });

    // 6. Set Cookies
    const cookieStore = await cookies();
    cookieStore.set("staff_token", token, {
        httpOnly: false, // Must be false for ClientLayout to detect staff session
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 15, // 15 minutes
        path: "/",
    });
    cookieStore.set("staff_refresh_token", refreshToken, {
        httpOnly: true, // Secure, not accessible to JS
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 90, // 90 days
        path: "/",
    });

    // Clear any existing merchant/admin sessions to prevent permission bypass when testing
    cookieStore.delete("kravy_auth_token");
    cookieStore.delete("__session");

    // 6. Return response
    const { password: _, ...staffData } = staff;

    //    // Track session (Analytics / audit trail)
    try {
        await prisma.userSession.create({
            data: {
                staffId: staff.id,
                ipAddress: ip,
                userAgent: userAgent,
                deviceType: deviceType,
                browser: browser,
                os: os,
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
