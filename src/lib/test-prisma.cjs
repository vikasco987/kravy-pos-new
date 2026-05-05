const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Checking models in Prisma Client...")
    console.log("Available models:", Object.keys(prisma).filter(k => !k.startsWith('_') && typeof prisma[k] === 'object'))
    if (prisma.expenseCategory) {
        console.log("SUCCESS: expenseCategory found!")
    } else {
        console.log("FAILURE: expenseCategory NOT found!")
    }
  } catch (e) {
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
