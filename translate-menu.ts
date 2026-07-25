import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'mddanishalam496@gmail.com' },
    });

    if (!user) {
      console.error('User not found');
      return;
    }

    const items = await prisma.item.findMany({
      where: { clerkId: user.clerkId! },
    });

    console.log(`Found ${items.length} items to translate.`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing API Key");

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const batchSize = 40;
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        console.log(`Processing batch ${i/batchSize + 1} (${batch.length} items)...`);
        
        const payload = batch.map(b => ({ id: b.id, name: b.name }));
        
        const prompt = `
Translate these food menu items to Arabic. The output must be an exact JSON array of objects with 'id' and 'name' fields.
The 'name' field MUST contain the original English name followed immediately by the Arabic script name, separated by a single space.
DO NOT USE BRACKETS for the Arabic name!
Example: 'Chicken Shawarma شاورما دجاج' or 'Hummus حمص'
If input contains (NV) or (V) or (S), just ignore translating the letters but translate the food name.

Input JSON:
${JSON.stringify(payload)}
        `;

        const res = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = await res.json();
        const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) {
            console.error("Failed to get response", JSON.stringify(data, null, 2));
            continue;
        }

        try {
            const translatedBatch = JSON.parse(textResponse);
            
            for (const t of translatedBatch) {
                const originalItem = batch.find(b => b.id === t.id);
                if (originalItem && originalItem.name !== t.name) {
                    await prisma.item.update({
                        where: { id: t.id },
                        data: { name: t.name }
                    });
                    console.log(`Updated: ${originalItem.name} -> ${t.name}`);
                }
            }
        } catch (err) {
            console.error("JSON Parse Error for batch", textResponse);
        }
    }
    
    console.log("Translation complete.");
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
