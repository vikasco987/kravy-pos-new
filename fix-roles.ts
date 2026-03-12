import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // We can't use prisma to update invalid enums natively if it crashes on read.
  // Instead, we use raw query for MongoDB
  const result1 = await prisma.$runCommandRaw({
    update: "User",
    updates: [
      {
        q: { role: "user" },
        u: { $set: { role: "USER" } },
        multi: true,
      },
      {
        q: { role: "admin" },
        u: { $set: { role: "ADMIN" } },
        multi: true,
      },
      {
        q: { role: "seller" },
        u: { $set: { role: "SELLER" } },
        multi: true,
      }
    ]
  })
  console.log("Update result:", result1)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
