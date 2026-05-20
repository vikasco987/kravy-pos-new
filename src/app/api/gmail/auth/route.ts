import { NextRequest, NextResponse } from "next/server";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import { getAuthUrl } from "@/lib/gmail-service";

export async function GET(req: NextRequest) {
    try {
        const clerkUserId = await getEffectiveClerkId();
        if (!clerkUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        // Let the client pass their current origin so redirect URI is correct
        const origin = searchParams.get("origin") || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
        const redirectUri = `${origin}/api/gmail/callback`;

        const authUrl = getAuthUrl(clerkUserId, redirectUri);
        
        return NextResponse.json({ url: authUrl });
    } catch (err: any) {
        console.error("Gmail OAuth Init Error:", err);
        return NextResponse.json({ error: "Failed to initiate OAuth flow" }, { status: 500 });
    }
}
