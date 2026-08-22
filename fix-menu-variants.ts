import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

const prisma = new PrismaClient();

const apiKeyRaw = process.env.GEMINI_API_KEY;
const apiKey = apiKeyRaw ? apiKeyRaw.split(',')[0] : null;

async function translateText(text: string): Promise<string> {
    if (!apiKey) throw new Error("Missing API Key");
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const prompt = `Translate the following English food category name into Hindi. The output must ONLY contain the original English name followed by the Hindi translation, separated by a single space, without any brackets or extra text. Example: "Paneer" -> "Paneer पनीर"
    
    Text to translate: "${text}"`;

    const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    const data: any = await res.json();
    let translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (translated) {
        // clean up quotes if AI adds them
        translated = translated.replace(/^"|"$/g, '');
        return translated;
    }
    return text;
}

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

    // --- STEP 1: Revert Item Names (Remove Hindi) ---
    console.log("\\n--- STEP 1: Removing Hindi from Item Names ---");
    const allItems = await prisma.item.findMany({
      where: { userId: user.id }
    });

    let nameUpdatedCount = 0;
    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i];
      // Remove Devanagari characters
      const cleanedName = item.name.replace(/[\u0900-\u097F]/g, '').trim();
      if (cleanedName !== item.name) {
        if (i % 20 === 0) console.log(`Processing item ${i}/${allItems.length}...`);
        await prisma.item.update({
          where: { id: item.id },
          data: { name: cleanedName }
        });
        nameUpdatedCount++;
      }
    }
    console.log(`Removed Hindi from ${nameUpdatedCount} item names.`);

    // --- STEP 2: Translate Categories ---
    console.log("\\n--- STEP 2: Translating Categories ---");
    const categories = await prisma.category.findMany({
      where: { clerkId: clerkId }
    });

    let catUpdatedCount = 0;
    const hasDevanagari = (str: string) => /[\u0900-\u097F]/.test(str);
    
    for (const category of categories) {
      if (!hasDevanagari(category.name)) {
        const translatedName = await translateText(category.name);
        if (translatedName && translatedName !== category.name) {
          await prisma.category.update({
            where: { id: category.id },
            data: { name: translatedName }
          });
          console.log(`Translated Category: ${category.name} -> ${translatedName}`);
          catUpdatedCount++;
        }
      }
    }
    console.log(`Translated ${catUpdatedCount} categories.`);

    // --- STEP 3: Fix Dhaba Menu Duplicate Variants ---
    console.log("\\n--- STEP 3: Fixing Dhaba Variants ---");
    // Fetch again since names are updated
    const updatedItems = await prisma.item.findMany({
      where: { userId: user.id }
    });

    const dhabaItems = updatedItems.filter(i => i.zones && i.zones.includes('Dhaba') && i.isActive === true);
    
    // Group by exact name
    const groupedItems: { [name: string]: any[] } = {};
    for (const item of dhabaItems) {
      if (!groupedItems[item.name]) {
        groupedItems[item.name] = [];
      }
      groupedItems[item.name].push(item);
    }

    let variantsFixedCount = 0;
    for (const [name, items] of Object.entries(groupedItems)) {
      // If there are exactly two items with the same name, they are likely Half and Full
      // If there are more, we sort by price and take the lowest two
      if (items.length >= 2) {
        // Sort by price ascending
        items.sort((a, b) => a.price - b.price);
        
        // Sometimes prices are identical, skip those
        if (items[0].price === items[1].price) continue;
        
        const halfItem = items[0];
        const fullItem = items[1];

        // Create variants JSON
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

        // Update the Half item to include variants
        await prisma.item.update({
          where: { id: halfItem.id },
          data: { variants: variants }
        });

        // Deactivate the Full item (and remove Dhaba zone just in case)
        const updatedZones = (fullItem.zones as string[]).filter(z => z !== 'Dhaba');
        await prisma.item.update({
          where: { id: fullItem.id },
          data: { 
            isActive: false,
            zones: updatedZones
          }
        });

        console.log(`Merged ${name}: Base item set to ${halfItem.price} with variants Half(${halfItem.price}) / Full(${fullItem.price}). Deactivated duplicate item.`);
        variantsFixedCount++;
      }
    }
    
    console.log(`Fixed variants for ${variantsFixedCount} item groups.`);
    console.log("\\nAll done!");

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
