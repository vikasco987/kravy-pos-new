import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Testing database queries for PnL...");
    try {
        console.log("1. Querying Expense table...");
        const expensesCount = await prisma.expense.count();
        console.log(`Success: Found ${expensesCount} expenses.`);
        
        console.log("2. Querying BillManager table...");
        const billsCount = await prisma.billManager.count();
        console.log(`Success: Found ${billsCount} bills.`);

        console.log("3. Fetching sample expenses...");
        const samples = await prisma.expense.findMany({ take: 5 });
        console.log("Sample expenses:", samples);

        console.log("4. Fetching sample bills...");
        const sampleBills = await prisma.billManager.findMany({ take: 5 });
        console.log("Sample bills:", sampleBills);

        console.log("All database queries succeeded!");
    } catch (err) {
        console.error("Database query failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
