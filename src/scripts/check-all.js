
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const timeout = setTimeout(() => {
    console.log('Timed out connecting to DB');
    process.exit(1);
  }, 5000);

  try {
    const users = await prisma.user.findMany({ take: 10 });
    console.log('Users:', JSON.stringify(users, null, 2));
    
    const ordersCount = await prisma.order.count();
    console.log('Total Orders:', ordersCount);
    
    clearTimeout(timeout);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
