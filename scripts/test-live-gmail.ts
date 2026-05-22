import { PrismaClient } from "@prisma/client";
import { fetchPlatformEmails } from "../src/lib/gmail-service";
import { parseEmail } from "../src/lib/email-parser";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting test-live-gmail script...");
    const connections = await prisma.gmailConnection.findMany();
    console.log(`Found ${connections.length} total connections in DB.`);
    
    for (const conn of connections) {
        console.log("\n-------------------------------------------");
        console.log(`User: ${conn.clerkUserId}`);
        console.log(`Connected Email: ${conn.connectedEmail}`);
        console.log(`Is Connected: ${conn.isConnected}`);
        console.log(`Last Synced: ${conn.lastSynced}`);
        console.log(`Last Email ID: ${conn.lastEmailId}`);
        
        if (!conn.isConnected || !conn.accessToken || !conn.refreshToken) {
            console.log("Skipping: Connection is not active or missing tokens.");
            continue;
        }

        try {
            const emails = await fetchPlatformEmails(
                conn.clerkUserId,
                conn.accessToken,
                conn.refreshToken,
                null // pass null to ignore lastEmailId filter for testing
            );
            console.log(`Gmail API returned ${emails.length} emails matching query.`);
            
            for (const email of emails) {
                console.log(`\n-> Email ID: ${email.id}`);
                console.log(`   Subject: ${email.subject}`);
                console.log(`   Sender: ${email.sender}`);
                console.log(`   Date: ${email.date}`);
                console.log(`   Snippet: ${email.snippet}`);
                
                const parsed = parseEmail(email);
                if (parsed) {
                    console.log("   ✅ PARSED SUCCESSFUL:", parsed);
                } else {
                    console.log("   ❌ PARSE SKIPPED (Snippet didn't match data patterns)");
                }
            }
        } catch (err: any) {
            console.error("   🔴 Error fetching emails:", err.message);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
