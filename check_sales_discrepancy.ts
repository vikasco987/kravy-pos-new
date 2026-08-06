import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = "mahajanraghav14@gmail.com";
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } }
  });

  if (!user) return console.log("User not found");
  const clerkId = user.clerkId;
  console.log("Checking for clerkId:", clerkId);

  // UTC bounds (what I used before)
  const startUTC = new Date("2026-07-01T00:00:00.000Z");
  const endUTC = new Date("2026-07-31T23:59:59.999Z");
  
  // IST bounds (+5:30)
  // July 1st 00:00:00 IST = June 30th 18:30:00 UTC
  // July 31st 23:59:59 IST = July 31st 18:29:59 UTC
  const startIST = new Date("2026-06-30T18:30:00.000Z");
  const endIST = new Date("2026-07-31T18:29:59.999Z");

  const getStats = async (start: Date, end: Date, label: string) => {
    const bills = await prisma.billManager.findMany({
      where: { clerkUserId: clerkId, createdAt: { gte: start, lte: end } }
    });

    const validBills = bills.filter(b => !b.isDeleted);
    const deletedBills = bills.filter(b => b.isDeleted);
    const heldBills = validBills.filter(b => b.isHeld);
    const paidBills = validBills.filter(b => !b.isHeld);

    console.log(`\n--- ${label} ---`);
    console.log("Total Valid Bills Sum:", validBills.reduce((s, b) => s + b.total, 0));
    console.log(" - Of which Paid/Completed:", paidBills.reduce((s, b) => s + b.total, 0));
    console.log(" - Of which Held:", heldBills.reduce((s, b) => s + b.total, 0));
    console.log("Deleted Bills Sum:", deletedBills.reduce((s, b) => s + b.total, 0));
  }

  await getStats(startUTC, endUTC, "UTC Timezone (Previous Query)");
  await getStats(startIST, endIST, "IST Timezone (India Local Time)");

  // Manual Invoices in IST
  const invoices = await prisma.manualInvoice.findMany({
    where: { clerkUserId: clerkId, date: { gte: startIST, lte: endIST } }
  });
  console.log(`\n--- Manual Invoices (IST) ---`);
  console.log("Total Invoices Sum:", invoices.reduce((s, i) => s + i.total, 0));
}

main().finally(() => prisma.$disconnect());
