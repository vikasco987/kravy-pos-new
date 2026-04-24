import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    let orders = await prisma.order.findMany({
        where: { 
            isDeleted: false,
        },
        take: 50,
        orderBy: { createdAt: "desc" }
    });
    console.log("With isDeleted: false ->", orders.length);

    orders = await prisma.order.findMany({
        where: { 
            isDeleted: null,
        },
        take: 50,
        orderBy: { createdAt: "desc" }
    });
    console.log("With isDeleted: null ->", orders.length);
    
    orders = await prisma.order.findMany({
        where: { 
            isDeleted: { equals: false },
        },
        take: 50,
        orderBy: { createdAt: "desc" }
    });
    console.log("With isDeleted: { equals: false } ->", orders.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
