const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rooms = await prisma.hotelRoom.findMany();
  const seen = new Set();
  let deletedCount = 0;
  for (const room of rooms) {
    const key = `${room.clerkUserId}-${room.roomNumber}`;
    if (seen.has(key)) {
      await prisma.hotelRoom.delete({ where: { id: room.id } });
      deletedCount++;
    } else {
      seen.add(key);
    }
  }
  console.log(`Deleted ${deletedCount} duplicate rooms.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
