import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const phone = "9888899482";
  const user = await prisma.user.findFirst({
    where: { 
      OR: [
        { phone },
        { email: { equals: "mahajanraghav14@gmail.com", mode: "insensitive" } }
      ]
    }
  });

  if (!user) {
    console.log("User not found by phone or case-insensitive email either.");
    return;
  }

  console.log("Found User:", user.email, user.clerkId);
  const clerkId = user.clerkId;

  // Check year 2026
  const start2026 = new Date("2026-07-01T00:00:00.000Z");
  const end2026 = new Date("2026-07-31T23:59:59.999Z");

  const bills2026 = await prisma.billManager.findMany({
    where: {
      clerkUserId: clerkId,
      createdAt: {
        gte: start2026,
        lte: end2026,
      },
      isDeleted: false
    }
  });

  const total2026 = bills2026.reduce((sum, bill) => sum + bill.total, 0);
  console.log("Total sales in July 2026:", total2026);
  
  // Check year 2024
  const start2024 = new Date("2024-07-01T00:00:00.000Z");
  const end2024 = new Date("2024-07-31T23:59:59.999Z");

  const bills2024 = await prisma.billManager.findMany({
    where: {
      clerkUserId: clerkId,
      createdAt: {
        gte: start2024,
        lte: end2024,
      },
      isDeleted: false
    }
  });
  
  const total2024 = bills2024.reduce((sum, bill) => sum + bill.total, 0);
  console.log("Total sales in July 2024:", total2024);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
