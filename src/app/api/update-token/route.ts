import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { clerkUserId, token, fcmToken } = body;
        if (!clerkUserId || (!token && !fcmToken)) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        const currentMetadata = (user.privateMetadata as any) || {};
        // Update metadata with the new push token
        await prisma.user.update({
            where: { clerkId: clerkUserId },
            data: {
                privateMetadata: {
                    ...currentMetadata,
                    expoPushToken: token || currentMetadata.expoPushToken,
                    fcmToken: fcmToken || currentMetadata.fcmToken
                }
            }
        });
        return NextResponse.json({ success: true, message: "Token saved successfully" });
    } catch (error) {
        console.error("SAVE_TOKEN_ERROR:", error);
        return NextResponse.json({ error: "Failed to save token" }, { status: 500 });
    }
}
