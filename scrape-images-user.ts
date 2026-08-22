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
  const cleanName = rawQuery
    .replace(/\(V\)|\(NV\)|\(Egg\)/gi, '')
    .replace(/\(\d+\)/g, '')
    .replace(/\[.*?\]|\{.*?\}/g, '')
    // Remove Hindi characters from search query to get better image results
    .replace(/[\u0900-\u097F]/g, '')
    .trim();

  const searchQuery = cleanName || rawQuery;

  // 1. Try FoodSnap first
  try {
    const foodSnapUrl = `https://manager.foodsnap.in/api/image/search?q=${encodeURIComponent(searchQuery)}&page=1&limit=5`;
    const res = await fetch(foodSnapUrl, { timeout: 5000 } as any);
    if (res.ok) {
      const data: any = await res.json();
      const photos = data.data || [];
      for (const photo of photos) {
        const imgUrl = photo.image_url || photo.image || photo.url;
        if (imgUrl && isSafeProductUrl(imgUrl)) {
          return imgUrl;
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // 2. Try Bing Image Search
  try {
    const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(searchQuery + " food dish")}&adlt=strict&first=0`;
    const res = await fetch(bingUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
      },
      timeout: 7000
    } as any);

    if (res.ok) {
      const html = await res.text();
      const matches = html.match(/&quot;murl&quot;:&quot;(https?:\/\/[^&]+)&quot;/g) || [];
      for (const m of matches) {
        const match = m.match(/&quot;murl&quot;:&quot;(https?:\/\/[^&]+)&quot;/);
        const imgUrl = match ? decodeURIComponent(match[1]) : '';
        if (imgUrl && isSafeProductUrl(imgUrl)) {
          return imgUrl;
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // 3. Fallback: Google Images
  try {
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery + " food dish")}&safe=active&tbm=isch`;
    const res = await fetch(googleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
      },
      timeout: 7000
    } as any);

    if (res.ok) {
      const html = await res.text();
      const matches = html.match(/"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/g) || [];
      const urls = matches
        .map(m => m.replace(/"/g, ''))
        .filter(url => !url.includes('google') && !url.includes('gstatic') && !url.includes('doubleclick') && !url.includes('analytics'))
        .filter(isSafeProductUrl);

      if (urls.length > 0) {
        return urls[0];
      }
    }
  } catch (e) {
    // ignore
  }

  return null;
}

async function main() {
  const email = "shreeradha88@gmail.com";
  
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } }
  });

  if (!user) {
    console.error("User not found!");
    return;
  }
  
  const clerkId = user.clerkId || user.id;

  console.log(`🚀 [LIVE SCRAPER] Starting image scraping for ${user.name}...`);

  const allItems = await prisma.item.findMany({
    where: { 
        userId: user.id
    }
  });
  
  const items = allItems.filter(item => !item.imageUrl || item.imageUrl.trim() === "");

  console.log(`📋 Total items to process: ${items.length}\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemNum = i + 1;

    console.log(`[Item ${itemNum}/${items.length}] Searching image for: "${item.name}"...`);

    const imageUrl = await searchProductImage(item.name);

    if (imageUrl) {
      await prisma.item.update({
        where: { id: item.id },
        data: {
          imageUrl: imageUrl,
          image: imageUrl
        }
      });
      successCount++;
      console.log(`✅ [Item ${itemNum}/${items.length}] SUCCESS: ${item.name}`);
      console.log(`   └─ Image: ${imageUrl}\n`);
    } else {
      failCount++;
      console.log(`⚠️ [Item ${itemNum}/${items.length}] NO IMAGE FOUND: ${item.name}\n`);
    }

    // Small delay to be polite to servers
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log("==================================================");
  console.log(`🎉 SCRAPING COMPLETE! Total: ${items.length} | Success: ${successCount} | Failed/Skipped: ${failCount}`);
  console.log("==================================================");

  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Scraper Error:", err);
  prisma.$disconnect();
});
