const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const profile = await prisma.businessProfile.findFirst({
    orderBy: { createdAt: 'desc' }
  })
  console.log("Profile Tax Enabled:", profile?.taxEnabled);
  console.log("Profile Per Product Tax Enabled:", profile?.perProductTaxEnabled);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
