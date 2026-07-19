const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEmails() {
    console.log("Fetching users...");
    const users = await prisma.user.findMany({
        select: { id: true, email: true }
    });

    let updatedCount = 0;
    for (const user of users) {
        if (user.email && user.email !== user.email.toLowerCase()) {
            console.log(`Fixing email for user ${user.id}: ${user.email} -> ${user.email.toLowerCase()}`);
            await prisma.user.update({
                where: { id: user.id },
                data: { email: user.email.toLowerCase() }
            });
            updatedCount++;
        }
    }
    console.log(`Fixed ${updatedCount} user emails to lowercase.`);
}

fixEmails().catch(console.error).finally(() => prisma.$disconnect());
