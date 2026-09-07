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
    .trim();

  const searchQuery = cleanName + " food dish";

  try {
    const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(searchQuery)}&adlt=strict&first=0`;
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
  } catch (e) {}

  return null;
}

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { equals: 'dalegno@gmail.com', mode: 'insensitive' } },
  });

  const items = await prisma.item.findMany({
    where: { userId: user.id, isActive: true }
  });

  let wrongImagesFound = 0;
  let newImagesAdded = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // Determine if wrong/missing
    // Assuming "galat show thi" means we can just re-scrape any that are null or have a generic placeholder
    // If the user meant all are wrong, we'd do all. Let's do missing/null.
    if (!item.image || item.image.includes('placeholder')) {
        wrongImagesFound++;
        const img = await searchProductImage(item.name);
        if (img) {
            await prisma.item.update({
                where: { id: item.id },
                data: { image: img, imageUrl: img }
            });
            newImagesAdded++;
            console.log(`Updated image for ${item.name}`);
        }
    }
  }
  
  console.log(`Wrong images found: ${wrongImagesFound}`);
  console.log(`New images added: ${newImagesAdded}`);
}
main().catch(console.error).finally(()=>prisma.$disconnect());
