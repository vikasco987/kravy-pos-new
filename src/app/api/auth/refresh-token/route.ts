import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "kravy_pos_secret_key_123";

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const refreshTokenStr = cookieStore.get("kravy_refresh_token")?.value;

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

        const { userId, jti } = decoded;
        if (!userId || !jti) {
            return NextResponse.json({ success: false, message: "Malformed refresh token" }, { status: 401 });
        }

        // 2. Fetch User & Validate Token Hash
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || user.isDisabled) {
            return NextResponse.json({ success: false, message: "User not found or disabled" }, { status: 401 });
        }

        const hashedJti = crypto.createHash('sha256').update(jti).digest('hex');
        const currentMeta = (user.privateMetadata as any) || {};
        const existingTokens = currentMeta.refreshTokens || [];

        // Find the token in DB
        const tokenExists = existingTokens.some((t: any) => t.jtiHash === hashedJti);
        if (!tokenExists) {
            return NextResponse.json({ success: false, message: "Refresh token revoked or already used" }, { status: 401 });
        }

        // 3. Token Rotation
        const newJti = crypto.randomUUID();
        const newHashedJti = crypto.createHash('sha256').update(newJti).digest('hex');
        const newRefreshToken = jwt.sign(
            { userId: user.id, jti: newJti },
            JWT_SECRET,
            { expiresIn: "90d" }
        );

        const newAccessToken = jwt.sign(
            { 
                userId: user.id, 
                clerkId: user.ownerId || user.clerkId, 
                role: user.role,
                email: user.email,
                name: user.name
            },
            JWT_SECRET,
            { expiresIn: "15m" }
        );

        // Remove old hash, add new hash, and cleanup old tokens (keep max 5 active sessions)
        const updatedTokens = existingTokens
            .filter((t: any) => t.jtiHash !== hashedJti)
            .concat({ jtiHash: newHashedJti, createdAt: Date.now() })
            .slice(-5);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                privateMetadata: {
                    ...currentMeta,
                    refreshTokens: updatedTokens
                }
            }
        });

        // 4. Set Cookies
        cookieStore.set("kravy_auth_token", newAccessToken, {
            httpOnly: true, 
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 15, // 15 minutes
            path: "/",
        });
        
        cookieStore.set("kravy_refresh_token", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 90, // 90 days
            path: "/",
        });

        return NextResponse.json({
            success: true,
            message: "Tokens refreshed successfully"
        });

    } catch (error) {
        console.error("Custom Auth Refresh Token Error:", error);
        return NextResponse.json(
            { success: false, message: "Server error during refresh" },
            { status: 500 }
        );
    }
}
