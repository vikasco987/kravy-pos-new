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
  const cleanName = rawQuery.replace(/\(V\)|\(NV\)|\(Egg\)/gi, '').replace(/\(\d+\)/g, '').replace(/\[.*?\]|\{.*?\}/g, '').trim();
  const searchQuery = cleanName + " pizza dominos"; // hint

  try {
    const foodSnapUrl = `https://manager.foodsnap.in/api/image/search?q=${encodeURIComponent(cleanName + " pizza")}&page=1&limit=5`;
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

  try {
    const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(searchQuery)}&adlt=strict&first=0`;
    const res = await fetch(bingUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36' },
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
    const user = await prisma.user.findFirst({ where: { email: 'vidi.organicafe@gmail.com' } });
    if (!user) return;
    
    const categories = await prisma.category.findMany({ where: { clerkId: user.clerkId } });
    const pizzaCategory = categories.find(c => c.name.toLowerCase().includes('pizza'));
    
    if (!pizzaCategory) return;
    
    const pizzas = await prisma.item.findMany({
      where: { categoryId: pizzaCategory.id, clerkId: user.clerkId }
    });
    
    let updated = 0;
    for (const p of pizzas) {
      if (!p.image) {
        console.log(`Scraping image for ${p.name}...`);
        const imgUrl = await searchProductImage(p.name);
        if (imgUrl) {
          await prisma.item.update({
            where: { id: p.id },
            data: { image: imgUrl, imageUrl: imgUrl }
          });
          console.log(`✅ Updated ${p.name}`);
          updated++;
        }
      }
    }
    console.log(`Finished updating ${updated} missing pizza images.`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
