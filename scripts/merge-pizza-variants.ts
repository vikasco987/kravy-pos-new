import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: 'dalegno@gmail.com', mode: 'insensitive' } },
    });

    if (!user) {
      console.error('User not found');
      return;
    }

    console.log(`User found: ${user.name}`);

    // --- STEP 1: Find all pizzas ---
    const allItems = await prisma.item.findMany({
      where: { 
          userId: user.id,
          isActive: true
      },
      include: {
        category: true
      }
    });

    const pizzaItems = allItems.filter(i => i.category?.name?.toLowerCase().includes('pizza'));
    console.log(`Found ${pizzaItems.length} pizza items.`);
    
    // Group by base name (removing size bracket)
    const groupedItems: { [name: string]: any[] } = {};
    for (const item of pizzaItems) {
      // e.g. "Verdura (V) [Piccolo (Small)]" -> "Verdura (V)"
      const baseNameMatch = item.name.match(/^(.*?) \[(.*?)\]$/);
      let baseName = item.name;
      let size = null;
      if (baseNameMatch) {
          baseName = baseNameMatch[1].trim();
          size = baseNameMatch[2].trim();
      } else {
          continue; // skip items not in the expected format
      }

      if (!groupedItems[baseName]) {
        groupedItems[baseName] = [];
      }
      
      item.parsedSize = size;
      groupedItems[baseName].push(item);
    }

    let variantsFixedCount = 0;
    
    for (const [name, items] of Object.entries(groupedItems)) {
        console.log(`\nProcessing ${name}...`);
        
        // Find Piccolo (Small), Medio (Medium), Grande (Large)
        const piccolo = items.find(i => i.parsedSize.toLowerCase().includes('piccolo') || i.parsedSize.toLowerCase().includes('small'));
        const medio = items.find(i => i.parsedSize.toLowerCase().includes('medio') || i.parsedSize.toLowerCase().includes('medium'));
        const grande = items.find(i => i.parsedSize.toLowerCase().includes('grande') || i.parsedSize.toLowerCase().includes('large'));
        
        if (!piccolo || !medio || !grande) {
            console.log(`  Skipping ${name}: Could not find all 3 sizes (Piccolo/Medio/Grande)`);
            continue;
        }

        // We will make 'Piccolo' the base item, rename it, and add variants
        const baseItem = piccolo;
        
        // Create variants JSON
        const variants = [
          {
            id: uuidv4(),
            groupName: "Size",
            type: "radio",
            required: true,
            options: [
              { id: uuidv4(), name: "Piccolo (Small)", price: piccolo.price },
              { id: uuidv4(), name: "Medio (Medium)", price: medio.price },
              { id: uuidv4(), name: "Grande (Large)", price: grande.price }
            ]
          }
        ];

        // Update the base item
        await prisma.item.update({
          where: { id: baseItem.id },
          data: { 
              name: name, // Remove size from name
              variants: variants 
          }
        });

        // Deactivate the Medio and Grande items
        await prisma.item.update({
          where: { id: medio.id },
          data: { isActive: false }
        });
        
        await prisma.item.update({
          where: { id: grande.id },
          data: { isActive: false }
        });

        console.log(`  Merged ${name}: Base item set to ${baseItem.price} with variants. Deactivated standalone Medio and Grande.`);
        variantsFixedCount++;
    }
    
    console.log(`\nFixed variants for ${variantsFixedCount} pizza groups.`);
    console.log("All done!");

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
