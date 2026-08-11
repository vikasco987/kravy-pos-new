import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "kravy_pos_secret_key_123";

export async function POST() {
    try {
        const cookieStore = await cookies();
        const refreshTokenStr = cookieStore.get("staff_refresh_token")?.value;

        if (refreshTokenStr) {
            try {
                const decoded: any = jwt.verify(refreshTokenStr, JWT_SECRET, { ignoreExpiration: true });
                const { staffId, jti } = decoded;

                if (staffId && jti) {
                    const hashedJti = crypto.createHash('sha256').update(jti).digest('hex');
                    const staff = await prisma.staff.findUnique({ where: { id: staffId } });

                    if (staff) {
                        const currentMeta = (staff.privateMetadata as any) || {};
                        const existingTokens = currentMeta.refreshTokens || [];
                        const updatedTokens = existingTokens.filter((t: any) => t.jtiHash !== hashedJti);

                        await prisma.staff.update({
                            where: { id: staff.id },
                            data: {
                                privateMetadata: {
                                    ...currentMeta,
                                    refreshTokens: updatedTokens
                                }
                            }
                        });
                    }
                }
            } catch (err) {
                console.error("Logout: Failed to decode/revoke refresh token", err);
            }
        }
        
        // Clear both cookies
        cookieStore.delete("staff_token");
        cookieStore.delete("staff_refresh_token");

        return NextResponse.json({
            success: true,
            message: "Successfully logged out"
        });
    } catch (error: any) {
        console.error("LOGOUT_ERROR:", error);
        return NextResponse.json({
            success: false,
            message: "Logout failed: " + error.message
        }, { status: 500 });
    }
}
