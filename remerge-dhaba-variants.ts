import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: 'shreeradha88@gmail.com', mode: 'insensitive' } },
    });

    if (!user) {
      console.error('User not found');
      return;
    }

    const allUserItems = await prisma.item.findMany({
        where: { userId: user.id }
    });

    const halfItems = allUserItems.filter(i => 
        i.name.endsWith(' (Half)') && 
        i.zones && i.zones.includes('Dhaba') && 
        i.isActive
    );

    let mergedCount = 0;
    for (const halfItem of halfItems) {
        const baseName = halfItem.name.replace(' (Half)', '');
        const fullItem = allUserItems.find(i => 
            i.name === `${baseName} (Full)` && 
            i.zones && i.zones.includes('Dhaba') && 
            i.isActive
        );

        if (fullItem) {
            // Merge them!
            const variants = [
                {
                    id: uuidv4(),
                    groupName: "Portion",
                    type: "radio",
                    required: true,
                    options: [
                        { id: uuidv4(), name: "Half", price: halfItem.price },
                        { id: uuidv4(), name: "Full", price: fullItem.price }
                    ]
                }
            ];

            // 1. Update Half item to be the main item
            await prisma.item.update({
                where: { id: halfItem.id },
                data: {
                    name: baseName,
                    variants: variants
                }
            });

            // 2. Hide Full item
            const newZones = (fullItem.zones as string[]).filter(z => z !== 'Dhaba');
            await prisma.item.update({
                where: { id: fullItem.id },
                data: {
                    isActive: false,
                    zones: newZones
                }
            });
            console.log(`Merged ${baseName}: Half(₹${halfItem.price}), Full(₹${fullItem.price})`);
            mergedCount++;
        }
    }

    console.log(`Successfully merged ${mergedCount} items!`);

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
