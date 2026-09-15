const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "kravy_pos_secret_key_123";

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found!");
    return;
  }
  console.log("Found user:", user.id);
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
  console.log("TEST_TOKEN=" + token);
}

main().catch(console.error).finally(() => prisma.$disconnect());
