
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrders() {
  try {
    const totalOrders = await prisma.order.count();
    console.log('Total Orders in DB:', totalOrders);
    
    const sample = await prisma.order.findFirst();
    console.log('First Order:', JSON.stringify(sample, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();
