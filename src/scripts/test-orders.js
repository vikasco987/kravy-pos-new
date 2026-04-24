import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 20
    });
    console.log("Total orders found:", orders.length);
    orders.forEach(o => {
        console.log(`- ${o.id}: status=${o.status}, isDeleted=${o.isDeleted}, clerkUserId=${o.clerkUserId}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
