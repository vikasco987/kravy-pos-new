import { NextRequest, NextResponse } from "next/server";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const clerkUserId = await getEffectiveClerkId();
        if (!clerkUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const connection = await prisma.gmailConnection.findUnique({
            where: { clerkUserId },
            select: {
                isConnected: true,
                connectedEmail: true,
                lastSynced: true,
                lastEmailId: true
            }
        });

        return NextResponse.json(connection || { isConnected: false });
    } catch (err: any) {
        console.error("GET Gmail Status Error:", err);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const clerkUserId = await getEffectiveClerkId();
        if (!clerkUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Delete Gmail connection
        await prisma.gmailConnection.deleteMany({
            where: { clerkUserId }
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("POST Disconnect Gmail Error:", err);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
