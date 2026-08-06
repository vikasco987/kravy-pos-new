import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = "mahajanraghav14@gmail.com";
  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!user) return;
  
  const profile = await prisma.businessProfile.findFirst({ where: { userId: user.clerkId } });
  console.log("taxEnabled:", profile?.taxEnabled);
  console.log("taxInclusive:", profile?.taxInclusive);
  console.log("perProductTaxEnabled:", profile?.perProductTaxEnabled);
}
main().finally(() => prisma.$disconnect());
