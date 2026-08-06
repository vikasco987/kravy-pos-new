import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function fix() {
  const parties = await prisma.party.findMany({
    include: { walletTransactions: true }
  });

  let fixed = 0;
  for (const party of parties) {
    let expectedBalance = 0;
    for (const tx of party.walletTransactions) {
      if (tx.type === "CREDIT") {
        expectedBalance += tx.amount;
      } else if (tx.type === "DEBIT") {
        expectedBalance -= tx.amount;
      }
    }

    // Due to float math, round to 2 decimals
    expectedBalance = Math.round(expectedBalance * 100) / 100;
    const currentBalance = Math.round((party.walletBalance || 0) * 100) / 100;

    if (currentBalance !== expectedBalance) {
      console.log(`Fixing party ${party.name} (${party.id}): ${currentBalance} -> ${expectedBalance}`);
      await prisma.party.update({
        where: { id: party.id },
        data: { walletBalance: expectedBalance }
      });
      fixed++;
    }
  }

  console.log(`Fixed ${fixed} parties.`);
}

fix().catch(console.error).finally(() => prisma.$disconnect());
