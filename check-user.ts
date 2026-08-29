import prisma from "./src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { contains: "gorapallisrikanth" } }
  });
  console.log("Users:", users);

  if (users.length > 0) {
    const clerkId = users[0].clerkId;
    const bills = await prisma.billManager.count({
      where: { clerkUserId: clerkId }
    });
    console.log("Bills count:", bills);
  }
}
main().catch(console.error);
