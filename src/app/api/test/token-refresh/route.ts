import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "kravy_pos_secret_key_123";

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const refreshTokenStr = cookieStore.get("kravy_refresh_token")?.value;
        const staffRefreshTokenStr = cookieStore.get("staff_refresh_token")?.value;

        if (!refreshTokenStr && !staffRefreshTokenStr) {
            return NextResponse.json({ success: false, message: "No refresh token found in cookies (both custom and staff)" });
        }

        const debugInfo: any = {
            hasCustomToken: !!refreshTokenStr,
            hasStaffToken: !!staffRefreshTokenStr,
        };

        if (refreshTokenStr) {
            try {
                const decoded: any = jwt.verify(refreshTokenStr, JWT_SECRET);
                debugInfo.customTokenDecoded = decoded;
                
                const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
                debugInfo.userFound = !!user;

                if (user) {
                    const currentMeta = (user.privateMetadata as any) || {};
                    const existingTokens = currentMeta.refreshTokens || [];
                    debugInfo.existingTokensCount = existingTokens.length;

                    const hashedJti = crypto.createHash('sha256').update(decoded.jti).digest('hex');
                    debugInfo.hashedJti = hashedJti;

                    const activeToken = existingTokens.find((t: any) => t.jtiHash === hashedJti);
                    debugInfo.activeTokenFound = !!activeToken;
                    
                    if (activeToken) {
                        debugInfo.activeTokenStatus = activeToken.status || "active";
                    }
                }
            } catch (err: any) {
                debugInfo.customTokenError = err.message;
            }
        }

        return NextResponse.json({ success: true, debugInfo });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message });
    }
}
