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

    const clerkId = user.clerkId || user.id;

    async function getCat(name: string) {
        let cat = await prisma.category.findFirst({ where: { clerkId, name: name } });
        if (!cat) {
            cat = await prisma.category.create({ data: { name, clerkId } });
        }
        return cat;
    }

    const dalCat = await getCat("Dal दाल");
    const paneerCat = await getCat("Paneer पनीर");
    const sabziCat = await getCat("Sabzi सब्ज़ी");

    const missingItems = [
        // Dal
        { name: "Dal Tadka", price: 120, catId: dalCat.id },
        { name: "Dal Handi", price: 170, catId: dalCat.id },
        { name: "Punjabi Dal Tadka", price: 180, catId: dalCat.id },
        { name: "Mix Dal Tadka", price: 170, catId: dalCat.id },
        { name: "Charno Amrit Special Dal", price: 180, catId: dalCat.id },
        // Sabzi
        { name: "Aloo Tamatar", price: 110, catId: sabziCat.id },
    ];

    for (const item of missingItems) {
        const exists = await prisma.item.findFirst({
            where: { clerkId, name: item.name, zones: { has: 'Dhaba' } }
        });
        if (!exists) {
            await prisma.item.create({
                data: {
                    name: item.name,
                    price: item.price,
                    sellingPrice: item.price,
                    categoryId: item.catId,
                    userId: user.id,
                    clerkId: clerkId,
                    zones: ["Dhaba"],
                    isActive: true,
                    isVeg: true,
                }
            });
            console.log(`Added missing item: ${item.name}`);
        }
    }

    // Paneer with variants
    const paneerItems = [
        { name: "Handi Paneer", half: 150, full: 280, catId: paneerCat.id },
        { name: "Paneer Pasanda", half: 160, full: 310, catId: paneerCat.id },
    ];

    for (const p of paneerItems) {
        const exists = await prisma.item.findFirst({
            where: { clerkId, name: p.name, zones: { has: 'Dhaba' } }
        });
        if (!exists) {
            const variants = [
                {
                    id: uuidv4(),
                    groupName: "Portion",
                    type: "radio",
                    required: true,
                    options: [
                        { id: uuidv4(), name: "Half", price: p.half },
                        { id: uuidv4(), name: "Full", price: p.full }
                    ]
                }
            ];
            await prisma.item.create({
                data: {
                    name: p.name,
                    price: p.half, // Base price is Half price
                    sellingPrice: p.half,
                    categoryId: p.catId,
                    userId: user.id,
                    clerkId: clerkId,
                    zones: ["Dhaba"],
                    isActive: true,
                    isVeg: true,
                    variants: variants
                }
            });
            console.log(`Added missing Paneer item with variants: ${p.name}`);
        }
    }
    
    console.log("All missing items added to Dhaba!");

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
