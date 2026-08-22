import { PrismaClient } from '@prisma/client';

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

    console.log(`User found: ${user.name}`);
    const clerkId = user.clerkId || user.id;

    // --- STEP 1: Categories ---
    async function getOrCreateCategory(name: string) {
        let cat = await prisma.category.findFirst({
            where: { clerkId: clerkId, name: name }
        });
        if (!cat) {
            cat = await prisma.category.create({
                data: { name, clerkId }
            });
            console.log(`Created Category: ${name}`);
        }
        return cat;
    }

    const rotiCat = await getOrCreateCategory("Roti रोटी");
    const thaliCat = await getOrCreateCategory("Thali थाली");
    const sweetsCat = await getOrCreateCategory("Sweets मिठाई");

    // --- STEP 2: Add Missing Items ---
    console.log("\\n--- STEP 2: Adding Missing Items ---");
    const itemsToAdd = [
        // Roti
        { name: "Tawa Roti", price: 10, categoryId: rotiCat.id },
        { name: "Butter Roti", price: 15, categoryId: rotiCat.id },
        { name: "Tandoori Sada Roti", price: 10, categoryId: rotiCat.id },
        { name: "Tandoori Butter Roti", price: 15, categoryId: rotiCat.id },
        { name: "Laccha Paratha", price: 50, categoryId: rotiCat.id },
        { name: "Plain Naan", price: 40, categoryId: rotiCat.id },
        { name: "Butter Naan", price: 50, categoryId: rotiCat.id },
        { name: "Missi Roti", price: 30, categoryId: rotiCat.id },
        { name: "Missi Roti Pyaz", price: 40, categoryId: rotiCat.id },
        { name: "Garlic Naan", price: 60, categoryId: rotiCat.id },
        // Thali
        { name: "Saada Thali", price: 150, categoryId: thaliCat.id, description: "Mix Veg, Dal Fry, Rice, 4 Butter Roti, Raita, Salad, Achar" },
        { name: "Special Thali", price: 220, categoryId: thaliCat.id, description: "Shahi Paneer, Mix Veg, Dal Fry, Jeera Rice, 4 Roti Butter, Raita, Salad, Papad, Achar" },
        // Sweets
        { name: "Gulab Jamun", price: 40, categoryId: sweetsCat.id }
    ];

    let addedCount = 0;
    for (const itemData of itemsToAdd) {
        const exists = await prisma.item.findFirst({
            where: { clerkId, name: itemData.name, zones: { has: 'Dhaba' } }
        });
        if (!exists) {
            await prisma.item.create({
                data: {
                    name: itemData.name,
                    price: itemData.price,
                    sellingPrice: itemData.price,
                    categoryId: itemData.categoryId,
                    description: itemData.description || "",
                    userId: user.id,
                    clerkId: clerkId,
                    zones: ["Dhaba"],
                    isActive: true,
                    isVeg: true,
                }
            });
            console.log(`Added missing item: ${itemData.name} (₹${itemData.price})`);
            addedCount++;
        }
    }
    console.log(`Added ${addedCount} missing items.`);

    // --- STEP 3: Unmerge Variants ---
    console.log("\\n--- STEP 3: Restoring Variants ---");
    const allUserItems = await prisma.item.findMany({
        where: { userId: user.id }
    });

    const dhabaItemsWithVariants = allUserItems.filter(i => 
        i.zones && i.zones.includes("Dhaba") && 
        i.variants && Array.isArray(i.variants) && 
        i.variants.some((v: any) => v.groupName === "Portion")
    );

    let unmergedCount = 0;
    for (const halfItem of dhabaItemsWithVariants) {
        // Find the inactive duplicate (the Full one)
        // Note: the name must match exactly since we haven't renamed them yet
        const fullItem = allUserItems.find(i => 
            i.name === halfItem.name && 
            i.price > halfItem.price && 
            i.id !== halfItem.id
        );

        // Revert the half item and rename it explicitly to (Half)
        await prisma.item.update({
            where: { id: halfItem.id },
            data: {
                name: `${halfItem.name} (Half)`,
                variants: [] // Clear variants
            }
        });

        if (fullItem) {
            // Restore the full item and rename it explicitly to (Full)
            const newZones = (fullItem.zones as string[]) ? [...(fullItem.zones as string[])] : [];
            if (!newZones.includes("Dhaba")) newZones.push("Dhaba");

            await prisma.item.update({
                where: { id: fullItem.id },
                data: {
                    name: `${fullItem.name} (Full)`,
                    isActive: true,
                    zones: newZones
                }
            });
            console.log(`Unmerged: ${halfItem.name} (Half) - ₹${halfItem.price} & ${fullItem.name} (Full) - ₹${fullItem.price}`);
            unmergedCount++;
        } else {
            console.log(`Unmerged ${halfItem.name}: Could not find the duplicate full item. Just renamed to (Half).`);
        }
    }
    
    console.log(`Restored ${unmergedCount} item groups.`);
    console.log("\\nAll done!");

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
