import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const orders = await prisma.order.findMany({
        where: { 
            isDeleted: { not: true },
        },
        take: 50,
        orderBy: { createdAt: "desc" }
    });
    console.log("Total API-like orders without include found:", orders.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
