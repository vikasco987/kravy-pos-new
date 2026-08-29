const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient();
  const backupModel = prisma.backup || prisma.Backup;
  const backups = await backupModel.findMany({ orderBy: { id: 'desc' }, take: 5 });
  console.log(backups);
}
test();
