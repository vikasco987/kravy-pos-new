import { NextRequest, NextResponse } from "next/server";
import { getEffectiveClerkId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { fetchPlatformEmails } from "@/lib/gmail-service";
import { parseEmail } from "@/lib/email-parser";

// Set runtime timeout to 60 seconds (or maximum supported by deployment)
export const maxDuration = 60;

export async function GET(req: NextRequest) {
    return handleSync(req);
}

export async function POST(req: NextRequest) {
    return handleSync(req);
}

async function handleSync(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const cronKey = searchParams.get("key");
        const userIdParam = searchParams.get("userId");

        let connectionsToSync: any[] = [];
        let isCron = false;

        // 1. Cron Sync (Global scheduled run)
        if (cronKey && cronKey === process.env.CRON_SECRET) {
            isCron = true;
            connectionsToSync = await prisma.gmailConnection.findMany({
                where: { isConnected: true }
            });
        } 
        // 2. Initial Async Trigger or Admin Force Sync
        else if (userIdParam) {
            // Validate if request is from same origin (internal async call) or authorized
            const connection = await prisma.gmailConnection.findUnique({
                where: { clerkUserId: userIdParam }
            });
            if (connection) {
                connectionsToSync = [connection];
            }
        } 
        // 3. Single User Manual Sync (From Dashboard)
        else {
            const clerkUserId = await getEffectiveClerkId();
            if (!clerkUserId) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const connection = await prisma.gmailConnection.findUnique({
                where: { clerkUserId }
            });
            
            if (!connection || !connection.isConnected) {
                return NextResponse.json({ error: "Gmail is not connected" }, { status: 400 });
            }

            connectionsToSync = [connection];
        }

        if (connectionsToSync.length === 0) {
            return NextResponse.json({ success: true, message: "No active Gmail connections found to sync" });
        }

        console.log(`[Gmail Sync] Syncing ${connectionsToSync.length} connection(s)...`);
        
        let savedCount = 0;
        let skippedCount = 0;

        for (const conn of connectionsToSync) {
            const { clerkUserId, accessToken, refreshToken, lastEmailId } = conn;
            
            if (!accessToken || !refreshToken) {
                console.warn(`[Gmail Sync] Missing token details for user: ${clerkUserId}`);
                continue;
            }

            try {
                // Fetch new emails
                const emails = await fetchPlatformEmails(
                    clerkUserId,
                    accessToken,
                    refreshToken,
                    lastEmailId
                );

                console.log(`[Gmail Sync] Found ${emails.length} emails to process for user: ${clerkUserId}`);
                let updatedLastEmailId = lastEmailId;

                for (const email of emails) {
                    const parsed = parseEmail(email);

                    if (!parsed) {
                        skippedCount++;
                        continue;
                    }

                    // Upsert parsed sales into DB
                    await prisma.externalSales.upsert({
                        where: {
                            clerkUserId_platform_date: {
                                clerkUserId,
                                platform: parsed.platform,
                                date: parsed.date
                            }
                        },
                        update: {
                            totalOrders: parsed.totalOrders,
                            totalRevenue: parsed.totalRevenue,
                            cancelledOrders: parsed.cancelledOrders,
                            avgOrderValue: parsed.avgOrderValue,
                            rating: parsed.rating,
                            sourceEmailId: parsed.sourceEmailId,
                            rawSnippet: parsed.rawSnippet,
                            parsedAt: new Date()
                        },
                        create: {
                            clerkUserId,
                            platform: parsed.platform,
                            date: parsed.date,
                            totalOrders: parsed.totalOrders,
                            totalRevenue: parsed.totalRevenue,
                            cancelledOrders: parsed.cancelledOrders,
                            avgOrderValue: parsed.avgOrderValue,
                            rating: parsed.rating,
                            sourceEmailId: parsed.sourceEmailId,
                            rawSnippet: parsed.rawSnippet
                        }
                    });

                    savedCount++;

                    // Update last email ID tracking
                    if (!updatedLastEmailId || email.id > updatedLastEmailId) {
                        updatedLastEmailId = email.id;
                    }
                }

                // Update last sync timestamp and last processed email id
                await prisma.gmailConnection.update({
                    where: { clerkUserId },
                    data: {
                        lastSynced: new Date(),
                        lastEmailId: updatedLastEmailId
                    }
                });

            } catch (err: any) {
                console.error(`[Gmail Sync] Error syncing user ${clerkUserId}:`, err.message);
            }
        }

        return NextResponse.json({
            success: true,
            syncedAccounts: connectionsToSync.length,
            savedCount,
            skippedCount
        });

    } catch (err: any) {
        console.error("Global Gmail Sync Route Error:", err);
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
}
