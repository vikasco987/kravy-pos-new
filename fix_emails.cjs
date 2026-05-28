const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    for (const user of users) {
        if (user.secondaryEmails && user.secondaryEmails.length > 0) {
            const lowercased = user.secondaryEmails.map(e => e.toLowerCase().trim());
            const hasChange = user.secondaryEmails.some((e, i) => e !== lowercased[i]);
            if (hasChange) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { secondaryEmails: lowercased }
                });
                console.log(`Updated user ${user.id} secondary emails to lowercase`);
            }
        }
    }
    console.log("Done fixing secondary emails");
}
main().catch(console.error).finally(() => prisma.$disconnect());
