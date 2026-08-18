import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

const isSafeProductUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  const nsfwKeywords = [
    'nude', 'naked', 'sex', 'porn', 'adult', 'bikini', 'boob', 'breast',
    'erotic', 'model', 'girl', 'woman', 'body', 'underwear', 'lingerie',
    'person', 'human', 'face', 'portrait'
  ];
  if (nsfwKeywords.some(kw => lower.includes(kw))) return false;
  return true;
};

async function searchProductImage(rawQuery: string): Promise<string | null> {
  const cleanName = rawQuery.replace(/\(V\)|\(NV\)|\(Egg\)/gi, '')
    .replace(/\(HALF\)|\(FULL\)|\(\d+\)/gi, '')
    .replace(/\[.*?\]|\{.*?\}/g, '').trim();

  // 1. FoodSnap
  try {
    const foodSnapUrl = `https://manager.foodsnap.in/api/image/search?q=${encodeURIComponent(cleanName)}&page=1&limit=5`;
    const res = await fetch(foodSnapUrl, { timeout: 5000 } as any);
    if (res.ok) {
      const data: any = await res.json();
      const photos = data.data || [];
      for (const photo of photos) {
        const imgUrl = photo.image_url || photo.image || photo.url;
        if (imgUrl && isSafeProductUrl(imgUrl)) return imgUrl;
      }
    }
  } catch (e) {}

  // 2. Bing
  try {
    const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(cleanName + " dish food")}&adlt=strict&first=0`;
    const res = await fetch(bingUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 7000
    } as any);
    if (res.ok) {
      const html = await res.text();
      const matches = html.match(/&quot;murl&quot;:&quot;(https?:\/\/[^&]+)&quot;/g) || [];
      for (const m of matches) {
        const match = m.match(/&quot;murl&quot;:&quot;(https?:\/\/[^&]+)&quot;/);
        const imgUrl = match ? decodeURIComponent(match[1]) : '';
        if (imgUrl && isSafeProductUrl(imgUrl)) return imgUrl;
      }
    }
  } catch (e) {}

  return null;
}

async function main() {
  try {
    const user = await prisma.user.findFirst({ where: { email: 'balis.cuisine@gmail.com' } });
    if (!user) return;
    
    const items = await prisma.item.findMany({
      where: { clerkId: user.clerkId },
      include: { category: true }
    });
    
    let updatedImages = 0;
    let wrongDeleted = 0;
    let missingAdded = 0;
    
    // Names to correct
    const nameCorrections: Record<string, string> = {
      'WALLNUT BROWINE': 'WALNUT BROWNIE',
      'PEANUT CHAT': 'PEANUT CHAAT' // optional, but let's leave it as image says CHAT
    };

    // Categories to delete (not in images)
    for (const item of items) {
      const catName = item.category?.name || '';
      
      // Delete "Sides" and "Add-Ons" since they are not on the images provided
      if (catName === 'Sides' || catName === 'Add-Ons') {
        await prisma.item.delete({ where: { id: item.id } });
        wrongDeleted++;
        continue;
      }
      
      // Correct names
      let currentName = item.name;
      if (nameCorrections[item.name]) {
        currentName = nameCorrections[item.name];
        await prisma.item.update({
          where: { id: item.id },
          data: { name: currentName }
        });
      }
      
      // Re-scrape image to ensure correctness
      console.log(`Checking image for: ${currentName}`);
      const newImgUrl = await searchProductImage(currentName);
      if (newImgUrl && newImgUrl !== item.image) {
        await prisma.item.update({
          where: { id: item.id },
          data: { image: newImgUrl, imageUrl: newImgUrl }
        });
        updatedImages++;
        console.log(`Updated image for ${currentName}`);
      }
    }
    
    console.log(`\n--- REPORT ---`);
    console.log(`Correct Images Uploaded: ${updatedImages}`);
    console.log(`Wrong Items Deleted: ${wrongDeleted}`);
    console.log(`Missing Items Added: ${missingAdded}`);
    
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
