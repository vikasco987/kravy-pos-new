import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const pizzasData = [
  { name: "Margherita", reg: 119, med: 210 },
  { name: "Fiery Onion", reg: 119, med: 210 },
  { name: "Sweet Corn & Black Olives", reg: 139, med: 249 },
  { name: "Evergreen", reg: 139, med: 249 },
  { name: "Paneer Pizza", reg: 139, med: 249 },
  { name: "Rosemary Mushroom", reg: 139, med: 249 },
  { name: "Paneer Coriander Pesto", reg: 149, med: 279 },
  { name: "Veg Supreme Pizza", reg: 149, med: 279 },
  { name: "Exotic King Pizza", reg: 149, med: 279 },
  { name: "King'Scloud Pizza", reg: 149, med: 279 },
  { name: "Spicy Schezwan Pizza", reg: 149, med: 279 },
  { name: "Veggie Blast Pizza", reg: 169, med: 289 },
  { name: "Paneerpepperdelight Pizza", reg: 169, med: 289 },
  { name: "Royal Veggie Pizza", reg: 169, med: 289 },
  { name: "Royal Tandoori Paneer Pizza", reg: 199, med: 349 },
  { name: "Royal Punjabi Paneer Pizza:", reg: 199, med: 349 }, // from pdf
  { name: "Royal Makhani Paneer Pizza:", reg: 199, med: 349 },
  { name: "Royal Kadhai Paneer Pizza:", reg: 199, med: 349 },
  { name: "Peppy Paneer Pizza:", reg: 199, med: 349 }
];

async function main() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'vidi.organicafe@gmail.com' }
    });

    if (!user) throw new Error("User not found");

    const categories = await prisma.category.findMany({ where: { clerkId: user.clerkId } });
    const pizzaCategory = categories.find(c => c.name.toLowerCase().includes('pizza'));
    if (!pizzaCategory) throw new Error("Pizza category not found");

    const existingPizzas = await prisma.item.findMany({
      where: { categoryId: pizzaCategory.id, clerkId: user.clerkId }
    });

    console.log(`Found ${existingPizzas.length} existing pizza items.`);

    let addedItems = 0;
    let addedVariants = 0;
    let deletedItems = 0;
    let correctedImages = 0;

    // Helper to find image from existing
    const findImage = (pizzaName: string) => {
      // Normalize names for comparison
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const searchName = norm(pizzaName);
      
      const match = existingPizzas.find(p => norm(p.name).includes(searchName) && p.image);
      return match?.image || null;
    };

    // Create new items
    for (const p of pizzasData) {
      // Remove trailing colon if exists for the final name
      const finalName = p.name.replace(/:$/, '');
      const img = findImage(finalName);
      if (img) correctedImages++;

      const variants = [
        {
          id: crypto.randomUUID(),
          groupName: "Size",
          type: "radio",
          required: true,
          options: [
            { id: crypto.randomUUID(), name: "Regular", price: 0 },
            { id: crypto.randomUUID(), name: "Medium", price: p.med - p.reg }
          ]
        }
      ];

      await prisma.item.create({
        data: {
          name: finalName,
          price: p.reg,
          sellingPrice: p.reg,
          categoryId: pizzaCategory.id,
          clerkId: user.clerkId!,
          userId: user.id,
          isVeg: true,
          image: img,
          imageUrl: img,
          variants: variants
        }
      });
      addedItems++;
      addedVariants += 2; // 2 options
    }

    // Delete old items
    for (const old of existingPizzas) {
      // Assuming old items have "(Regular)" or "(Medium)" in name, or we just delete everything since we replaced them all
      // We will delete all existing ones that were fetched before we inserted new ones
      await prisma.item.delete({ where: { id: old.id } });
      deletedItems++;
    }

    console.log("---- REPORT ----");
    console.log(`New Items Added: ${addedItems}`);
    console.log(`Variants Added: ${addedVariants}`);
    console.log(`Old Items Deleted: ${deletedItems}`);
    console.log(`Items with Correct Image Reused: ${correctedImages}`);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
