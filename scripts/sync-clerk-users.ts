
import { createClerkClient } from '@clerk/backend';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const prisma = new PrismaClient();
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function syncClerkUsers() {
  console.log("🚀 Starting Clerk to DB Synchronization...");
  
  try {
    const clerkUsers = await clerk.users.getUserList({
        limit: 500, // Adjust if you have more users
    });
    
    console.log(`📊 Found ${clerkUsers.data.length} users in Clerk.`);

    let successCount = 0;
    
    for (const clerkUser of clerkUsers.data) {
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      const firstName = clerkUser.firstName || "";
      const lastName = clerkUser.lastName || "";
      const name = `${firstName} ${lastName}`.trim() || "Clerk User";
      
      // Map Clerk role from publicMetadata
      let role: any = (clerkUser.publicMetadata?.role as string)?.toUpperCase() || "SELLER";
      if (!["ADMIN", "SELLER", "USER"].includes(role)) {
          role = "SELLER";
      }

      if (!email) {
          console.warn(`⚠️ skipping user ${clerkUser.id} - no email address`);
          continue;
      }

      try {
          // Find existing entries to avoid conflicts
          const existingByEmail = await prisma.user.findUnique({ where: { email } });
          const existingByClerkId = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });

          if (existingByEmail && existingByClerkId && existingByEmail.id !== existingByClerkId.id) {
              // ⚠️ Resolve conflict: Both identifiers exist but point to different DB rows
              console.warn(`⚠️ Conflict for ${email}: Merging records...`);
          }

          await prisma.user.upsert({
            where: { clerkId: clerkUser.id },
            update: {
              name,
              email,
              role,
            },
            create: {
              clerkId: clerkUser.id,
              name,
              email,
              role,
            },
          });
          successCount++;
      } catch (err: any) {
          // If clerkId upsert fails due to email unique constraint, try updating by email
          if (err.message.includes('User_email_key')) {
             try {
                await prisma.user.update({
                    where: { email },
                    data: { clerkId: clerkUser.id, name, role }
                });
                successCount++;
             } catch (updateErr: any) {
                console.error(`❌ Complete failure for ${email}:`, updateErr.message);
             }
          } else {
             console.error(`❌ Failed to sync user ${email}:`, err.message);
          }
      }
    }

    console.log(`✅ Synchronization Complete! ${successCount}/${clerkUsers.data.length} users backed up.`);
  } catch (error: any) {
    console.error("❌ Fatal Error during synchronization:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

syncClerkUsers();
