import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Searching for user with email or phone...");
    
    // Search by email or phone
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'Etdsit', mode: 'insensitive' } },
          { email: { contains: 'etdsit', mode: 'insensitive' } },
          { phone: { contains: '98244' } },
          { phone: { contains: '81632' } }
        ]
      }
    });

    console.log("Found users:", users);

    if (users.length === 0) {
      // List last 10 users to see recently created ones
      const recentUsers = await prisma.user.findMany({
        take: 10,
        orderBy: { id: 'desc' }
      });
      console.log("Recent 10 users:", recentUsers.map(u => ({ id: u.id, email: u.email, phone: u.phone, name: u.name, clerkId: u.clerkId })));
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
