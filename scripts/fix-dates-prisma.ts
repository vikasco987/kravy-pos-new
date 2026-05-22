import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🔌 Initializing Prisma Client...");
  try {
    // We execute a raw MongoDB update command to fix null/missing fields directly in the DB
    // without fetching them to the client (which prevents type-conversion serialization crashes).
    console.log("⚡ Running direct MongoDB updates for createdAt and updatedAt...");

    const fixCreatedAt = await prisma.$runCommandRaw({
      update: "BusinessProfile",
      updates: [
        {
          q: { 
            $or: [ 
              { createdAt: null }, 
              { createdAt: { $exists: false } } 
            ] 
          },
          u: { 
            $set: { createdAt: { $date: new Date().toISOString() } } 
          },
          multi: true
        }
      ]
    });
    console.log("✅ Fixed createdAt on affected documents. Result:", JSON.stringify(fixCreatedAt));

    const fixUpdatedAt = await prisma.$runCommandRaw({
      update: "BusinessProfile",
      updates: [
        {
          q: { 
            $or: [ 
              { updatedAt: null }, 
              { updatedAt: { $exists: false } } 
            ] 
          },
          u: { 
            $set: { updatedAt: { $date: new Date().toISOString() } } 
          },
          multi: true
        }
      ]
    });
    console.log("✅ Fixed updatedAt on affected documents. Result:", JSON.stringify(fixUpdatedAt));

    console.log("🎉 Database migration completed successfully!");
  } catch (error) {
    console.error("🚨 Prisma Migration Error:", error);
  } finally {
    await prisma.$disconnect();
    console.log("🔌 Disconnected Prisma.");
  }
}

main();
