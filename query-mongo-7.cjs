const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bill = await prisma.billManager.findUnique({
    where: { id: "6a66f364f0189a07182d790e" }
  });
  
  if (bill) {
    console.log("Found 3 frds bill:");
    console.log(bill);
    
    // Find bills created around this time for the same user
    const surroundingBills = await prisma.billManager.findMany({
      where: { clerkUserId: bill.clerkUserId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    console.log("\nSurrounding bills:");
    surroundingBills.forEach(b => {
      console.log(`ID: ${b.id}, Total: ${b.total}, Token: ${b.tokenNumber}, Cust: ${b.customerName}, Date: ${b.createdAt}`);
    });
  }
}

main().finally(() => prisma.$disconnect());
