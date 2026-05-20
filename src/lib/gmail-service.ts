import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export function getOAuthClient(redirectUri?: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    // Fallback redirect URI if not provided
    const finalRedirectUri = redirectUri || 
        process.env.GOOGLE_REDIRECT_URI || 
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/gmail/callback`;

    return new google.auth.OAuth2(
        clientId,
        clientSecret,
        finalRedirectUri
    );
}

export function getAuthUrl(clerkUserId: string, redirectUri: string) {
    const oauth2Client = getOAuthClient(redirectUri);
    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent", // Force consent screen to ensure refresh token is returned
        scope: [
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/userinfo.email",
        ],
        state: clerkUserId,
    });
}

export async function getTokensFromCode(code: string, redirectUri: string) {
    const oauth2Client = getOAuthClient(redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

export async function getConnectedEmail(accessToken: string, refreshToken: string) {
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
    });
    
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    return data.email;
}

/**
 * Creates an authorized Gmail API client, auto-refreshing token if necessary
 */
export async function getGmailClient(clerkUserId: string, accessToken: string, refreshToken: string) {
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
    });

    oauth2Client.on("tokens", async (newTokens) => {
        try {
            // Update token in database
            const updateData: any = {};
            if (newTokens.access_token) {
                updateData.accessToken = newTokens.access_token;
            }
            if (newTokens.refresh_token) {
                updateData.refreshToken = newTokens.refresh_token;
            }

            if (Object.keys(updateData).length > 0) {
                await prisma.gmailConnection.update({
                    where: { clerkUserId },
                    data: updateData,
                });
            }
        } catch (err) {
            console.error("Failed to auto-update Gmail tokens for user:", clerkUserId, err);
        }
    });

    return google.gmail({ version: "v1", auth: oauth2Client });
}

/**
 * Fetch platform emails (Zomato/Swiggy) since last synced ID or last 2 days
 */
export async function fetchPlatformEmails(clerkUserId: string, accessToken: string, refreshToken: string, lastEmailId: string | null) {
    const gmail = await getGmailClient(clerkUserId, accessToken, refreshToken);
    const emails: any[] = [];

    // Filter by Zomato and Swiggy daily summaries within the last 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const dateStr = threeDaysAgo.toISOString().split("T")[0].replace(/-/g, "/");

    const query = `(from:zomato.com OR from:swiggy.in OR subject:"Zomato" OR subject:"Swiggy") after:${dateStr}`;

    try {
        const listRes = await gmail.users.messages.list({
            userId: "me",
            q: query,
            maxResults: 25,
        });

        const messages = listRes.data.messages || [];
        if (messages.length === 0) return emails;

        // Sort messages to parse older ones first, to properly construct history
        const reversedMessages = [...messages].reverse();

        // If we have a lastSynced email id, we filter out emails that have already been handled
        // Note: For simplicity and safety against out-of-order deliveries, we'll fetch details for all
        // and deduplicate against existing DB records based on message ID.
        for (const msg of reversedMessages) {
            try {
                if (!msg.id) continue;
                
                const msgRes = await gmail.users.messages.get({
                    userId: "me",
                    id: msg.id,
                    format: "metadata",
                    metadataHeaders: ["Subject", "From", "Date"],
                });

                const headers = msgRes.data.payload?.headers || [];
                const getHeader = (name: string) =>
                    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

                emails.push({
                    id: msg.id,
                    subject: getHeader("Subject"),
                    sender: getHeader("From"),
                    date: getHeader("Date"),
                    snippet: msgRes.data.snippet || "",
                });
            } catch (err: any) {
                console.error(`Failed to fetch metadata for email ${msg.id}:`, err.message);
            }
        }

        return emails;
    } catch (err: any) {
        console.error(`Gmail fetch error for user ${clerkUserId}:`, err.message);
        throw err;
    }
}
