import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // Find all orders that are true to avoid overwriting them
    const trueOrders = await prisma.order.findMany({
        where: { isDeleted: true },
        select: { id: true }
    });
    const trueIds = trueOrders.map(o => o.id);

    const result = await prisma.order.updateMany({
        where: {
            id: { notIn: trueIds }
        },
        data: { isDeleted: false }
    });

    console.log("Updated orders:", result.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
