import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const items = await prisma.item.findMany({
    where: { variants: { not: null } },
    select: { name: true, variants: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  console.log(JSON.stringify(items, null, 2))
}
main()
