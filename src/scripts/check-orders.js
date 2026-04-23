
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrders() {
  try {
    const totalOrders = await prisma.order.count();
    const deletedOrders = await prisma.order.count({ where: { isDeleted: true } });
    const nonDeletedOrders = await prisma.order.count({ where: { isDeleted: false } });
    const missingFieldOrders = await prisma.order.count({ 
        where: { 
            NOT: {
                OR: [
                    { isDeleted: true },
                    { isDeleted: false }
                ]
            }
        } 
    });

    console.log('Total Orders:', totalOrders);
    console.log('Deleted Orders:', deletedOrders);
    console.log('Non-Deleted Orders (isDeleted: false):', nonDeletedOrders);
    console.log('Orders where isDeleted is MISSING/NULL:', missingFieldOrders);

    const samples = await prisma.order.findMany({ take: 5 });
    console.log('Sample Orders:', JSON.stringify(samples, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();
