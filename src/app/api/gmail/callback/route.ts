import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokensFromCode, getConnectedEmail } from "@/lib/gmail-service";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // clerkUserId
    const error = searchParams.get("error");
    
    const origin = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const redirectUrl = `${origin}/dashboard/integration/gmail`;

    if (error || !code || !state) {
        console.error("Gmail OAuth Callback error query:", error);
        return NextResponse.redirect(`${redirectUrl}?success=false&error=${error || "missing_code_or_state"}`);
    }

    try {
        const callbackRedirectUri = `${origin}/api/gmail/callback`;
        const tokens = await getTokensFromCode(code, callbackRedirectUri);
        const email = await getConnectedEmail(tokens.access_token!, tokens.refresh_token!);

        // Upsert connection details
        await prisma.gmailConnection.upsert({
            where: { clerkUserId: state },
            update: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || undefined, // refresh token only returned on first consent
                connectedEmail: email,
                isConnected: true,
                updatedAt: new Date()
            },
            create: {
                clerkUserId: state,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || null,
                connectedEmail: email,
                isConnected: true,
            }
        });

        // Trigger an initial dry run sync asynchronously to fetch past messages immediately
        fetch(`${origin}/api/gmail/sync?userId=${state}`, { method: "POST" }).catch(err => {
            console.error("Async initial sync fetch error:", err);
        });

        return NextResponse.redirect(`${redirectUrl}?success=true`);
    } catch (err: any) {
        console.error("Gmail OAuth Callback processing error:", err);
        return NextResponse.redirect(`${redirectUrl}?success=false&error=server_error`);
    }
}
