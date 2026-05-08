import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const clerkId = "custom_1777896458618_rmhrp9";
  const user = await prisma.user.findUnique({
    where: { clerkId }
  });
  console.log("USER FOUND BY CLERKID:", user ? "YES" : "NO");
  if (user) console.log("USER ID:", user.id);
  
  const userById = await prisma.user.findUnique({
    where: { id: clerkId }
  }).catch(() => null);
  console.log("USER FOUND BY ID:", userById ? "YES" : "NO");

  const staff = await prisma.staff.findUnique({
    where: { id: clerkId }
  }).catch(() => null);
  console.log("STAFF FOUND BY ID:", staff ? "YES" : "NO");

  process.exit(0);
}

check();
