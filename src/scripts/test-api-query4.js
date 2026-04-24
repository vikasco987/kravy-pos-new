import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    let orders = await prisma.order.findMany({
        where: { 
            OR: [
                { isDeleted: false },
                { isDeleted: { isSet: false } }
            ]
        },
        take: 50,
        orderBy: { createdAt: "desc" }
    });
    console.log("With OR isSet: false ->", orders.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
