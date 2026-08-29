import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const clerkId = 'user_3D50GqQtgxSAM58kGTRwzdUk3Xc';
  const items = await prisma.item.findMany({ where: { clerkId } });
  
  let deletedCount = 0;
  let updatedCount = 0;

  for (const item of items) {
    const hasOldZone = item.zones?.includes('NON AC');
    const hasNewZone = item.zones?.includes('nonAC');

    if (hasOldZone) {
      // The old nonAC items should be removed
      await prisma.item.delete({ where: { id: item.id } });
      deletedCount++;
    } else if (hasNewZone) {
      // The new items should be assigned to the old zone format 'NON AC'
      const newZones = item.zones.map(z => z === 'nonAC' ? 'NON AC' : z);
      await prisma.item.update({
        where: { id: item.id },
        data: { zones: newZones }
      });
      updatedCount++;
    }
  }

  // Also fix BusinessProfile zones if needed
  const bp = await prisma.businessProfile.findFirst({ where: { userId: clerkId } });
  if (bp && bp.zones?.includes('nonAC')) {
    const newBpZones = bp.zones.filter(z => z !== 'nonAC');
    if (!newBpZones.includes('NON AC')) {
        newBpZones.push('NON AC');
    }
    await prisma.businessProfile.update({
      where: { id: bp.id },
      data: { zones: newBpZones }
    });
    console.log('Fixed BusinessProfile zones');
  }

  console.log(`Deleted \${deletedCount} old items.`);
  console.log(`Updated \${updatedCount} new items to use correct zone format.`);
}

main().finally(() => prisma.$disconnect());
