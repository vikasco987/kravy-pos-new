import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "kravy_pos_secret_key_123";

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const refreshTokenStr = cookieStore.get("staff_refresh_token")?.value;

        if (!refreshTokenStr) {
            return NextResponse.json({ success: false, message: "No refresh token provided" }, { status: 401 });
        }

        // 1. Verify Refresh Token
        let decoded: any;
        try {
            decoded = jwt.verify(refreshTokenStr, JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ success: false, message: "Invalid or expired refresh token" }, { status: 401 });
        }

        const { staffId, jti } = decoded;
        if (!staffId || !jti) {
            return NextResponse.json({ success: false, message: "Malformed refresh token" }, { status: 401 });
        }

        // 2. Fetch Staff & Validate Token Hash
        const staff = await prisma.staff.findUnique({
            where: { id: staffId }
        });

        if (!staff || staff.status !== "active") {
            return NextResponse.json({ success: false, message: "Staff not found or inactive" }, { status: 401 });
        }

        const hashedJti = crypto.createHash('sha256').update(jti).digest('hex');
        const currentMeta = (staff.privateMetadata as any) || {};
        const existingTokens = currentMeta.refreshTokens || [];

        // Find the token in DB
        const activeToken = existingTokens.find((t: any) => t.jtiHash === hashedJti);
        if (!activeToken || activeToken.status === "revoked") {
            return NextResponse.json({ success: false, message: "Refresh token revoked or already used" }, { status: 401 });
        }

        // 3. NO Token Rotation (Fixes race conditions on concurrent requests)
        const newAccessToken = jwt.sign(
            { 
                staffId: staff.id, 
                email: staff.email, 
                businessId: staff.businessId,
                accessType: staff.accessType,
                permissions: staff.permissions,
                name: staff.name,
                jtiHash: hashedJti // Keep the same hashedJti
            },
            JWT_SECRET,
            { expiresIn: "90d" }
        );

        const response = NextResponse.json({
            success: true,
            message: "Tokens refreshed successfully"
        });

        // 4. Set Cookies on the response object
        response.cookies.set("staff_token", newAccessToken, {
            httpOnly: false, 
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 15, // 15 minutes
            path: "/",
        });
        
        response.cookies.set("staff_refresh_token", refreshTokenStr, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 90, // 90 days
            path: "/",
        });

        return response;

    } catch (error) {
        console.error("Refresh Token Error:", error);
        return NextResponse.json(
            { success: false, message: "Server error during refresh" },
            { status: 500 }
        );
    }
}
