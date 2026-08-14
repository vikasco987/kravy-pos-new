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

  const searchQuery = cleanName || rawQuery;

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
  return null;
}

const categoriesData = [
  {
    categoryName: "ROLL'S",
    items: [
      { name: "VEG ROLL", price: 60 },
      { name: "VEG PANEER ROLL", price: 90 },
      { name: "VEG CHEESE ROLL", price: 90 },
      { name: "VEG CHEESE PANEER ROLL", price: 120 },
      { name: "MUSHROOM ROLL", price: 80 },
      { name: "MUSHROOM CHEESE ROLL", price: 110 },
      { name: "FRENCH FRY ROLL", price: 80 },
      { name: "FRENCH FRY CHEESE ROLL", price: 110 },
      { name: "PANEER ROLL", price: 80 },
      { name: "PANEER CHEESE ROLL", price: 110 },
      { name: "SOYA CHAP ROLL", price: 70 },
      { name: "SOYA CHAAP CHEESE ROLL", price: 100 },
    ]
  },
  {
    categoryName: "CHINESE",
    items: [
      { name: "VEG CHOWMEIN (HALF)", price: 50 },
      { name: "VEG CHOWMEIN (FULL)", price: 80 },
      { name: "MUSHROOM CHOWMEIN (HALF)", price: 80 },
      { name: "MUSHROOM CHOWMEIN (FULL)", price: 140 },
      { name: "MIX CHOWMEIN (HALF)", price: 60 },
      { name: "MIX CHOWMEIN (FULL)", price: 100 },
      { name: "SEEZWAN CHOWMEIN (HALF)", price: 80 },
      { name: "SEEZWAN CHOWMEIN (FULL)", price: 120 },
      { name: "PANEER CHOWMEIN (HALF)", price: 60 },
      { name: "PANEER CHOWMEIN (FULL)", price: 100 },
      { name: "GINGER GARLIC CHOWMEIN (HALF)", price: 60 },
      { name: "GINGER GARLIC CHOWMEIN (FULL)", price: 100 },
      { name: "HAKKA NOODLES (HALF)", price: 80 },
      { name: "HAKKA NOODLES (FULL)", price: 120 },
      { name: "HAKKA PANEER NOODLES (HALF)", price: 90 },
      { name: "HAKKA PANEER NOODLES (FULL)", price: 140 },
      { name: "HAKKA MUSHROOM NOODLES (HALF)", price: 90 },
      { name: "HAKKA MUSHROOM NOODLES (FULL)", price: 140 },
      { name: "HAKKA MIX NOODLES (HALF)", price: 100 },
      { name: "HAKKA MIX NOODLES (FULL)", price: 150 },
      { name: "HAKKA SEEZWAN NOODLES (HALF)", price: 90 },
      { name: "HAKKA SEEZWAN NOODLES (FULL)", price: 140 },
    ]
  },
  {
    categoryName: "ITALIAN",
    items: [
      { name: "PASTA FRY (HALF)", price: 50 },
      { name: "PASTA FRY (FULL)", price: 80 },
      { name: "VEG PASTA (HALF)", price: 60 },
      { name: "VEG PASTA (FULL)", price: 100 },
      { name: "VEG CHEESE PASTA (HALF)", price: 80 },
      { name: "VEG CHEESE PASTA (FULL)", price: 130 },
      { name: "WHITE SAUCE PASTA (HALF)", price: 70 },
      { name: "WHITE SAUCE PASTA (FULL)", price: 130 },
      { name: "WHITE SAUCE CHEESE PASTA (HALF)", price: 90 },
      { name: "WHITE SAUCE CHEESE PASTA (FULL)", price: 160 },
      { name: "RED SAUCE PASTA (HALF)", price: 70 },
      { name: "RED SAUCE PASTA (FULL)", price: 130 },
      { name: "HOT SAUCE PASTA (HALF)", price: 80 },
      { name: "HOT SAUCE PASTA (FULL)", price: 140 },
    ]
  },
  {
    categoryName: "SNACKS",
    items: [
      { name: "FRENCH FRIES", price: 70 },
      { name: "MOMO'S VEG (HALF)", price: 40 },
      { name: "MOMO'S VEG (FULL)", price: 70 },
      { name: "MOMO'S PANEER (HALF)", price: 50 },
      { name: "MOMO'S PANEER (FULL)", price: 90 },
      { name: "PANEER PAKODA", price: 120 },
      { name: "PYAZI PAKODA", price: 100 },
    ]
  },
  {
    categoryName: "CHILLI'S",
    items: [
      { name: "PANEER CHILLY (HALF)", price: 90 },
      { name: "PANEER CHILLY (FULL)", price: 150 },
      { name: "MUSHROOM CHILLY (HALF)", price: 90 },
      { name: "MUSHROOM CHILLY (FULL)", price: 150 },
      { name: "BABY CORN CHILLY (HALF)", price: 90 },
      { name: "BABY CORN CHILLY (FULL)", price: 150 },
      { name: "BABY CORN CRISPY (HALF)", price: 90 },
      { name: "BABY CORN CRISPY (FULL)", price: 150 },
      { name: "FRENCH FRY CHILLY", price: 120 },
      { name: "POTATO CRISPY CHILLY", price: 100 },
      { name: "SOYA CHILLY", price: 80 },
    ]
  },
  {
    categoryName: "RICE",
    items: [
      { name: "VEG FRIED RICE (HALF)", price: 60 },
      { name: "VEG FRIED RICE (FULL)", price: 100 },
      { name: "SCHZEWAN FRIED RICE (HALF)", price: 70 },
      { name: "SCHZEWAN FRIED RICE (FULL)", price: 120 },
      { name: "MIX FRIED RICE (HALF)", price: 90 },
      { name: "MIX FRIED RICE (FULL)", price: 140 },
      { name: "PANEER FRIED RICE (HALF)", price: 90 },
      { name: "PANEER FRIED RICE (FULL)", price: 140 },
    ]
  },
  {
    categoryName: "IDLI",
    items: [
      { name: "IDLI SAMBHAR (2 PCS)", price: 50 },
      { name: "IDLI FRY", price: 70 },
      { name: "IDLI PODDI (PURE GHEE)", price: 100 },
      { name: "IDLI GARLIC SAMBHAR", price: 80 },
      { name: "WADA SAMBHAR", price: 60 },
    ]
  },
  {
    categoryName: "PARATHA",
    items: [
      { name: "PLAIN PRATHA", price: 20 },
      { name: "CHEESE PRATHA", price: 50 },
      { name: "LACCHA PARATHA", price: 40 },
      { name: "LACCHA CHEESE PARATHA", price: 70 },
    ]
  }
];


async function main() {
  const email = "cricholiccvegies@gmail.com";
  
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !user.clerkId) {
    console.error("User not found or missing clerkId");
    return;
  }
  
  const clerkId = user.clerkId;
  const userId = user.id;

  console.log(`Processing for User: ${user.name} (${email}) | ClerkId: ${clerkId}`);

  // Delete previously incorrectly uploaded Items and Categories for this user
  const delItems = await prisma.item.deleteMany({
    where: { clerkId }
  });

  const delCategories = await prisma.category.deleteMany({
    where: { clerkId }
  });

  console.log(`Cleanup Stats: Deleted ${delItems.count} incorrect items and ${delCategories.count} incorrect categories.`);

  let totalAdded = 0;
  let totalImagesAdded = 0;

  for (const catData of categoriesData) {
    let category = await prisma.category.create({
      data: {
        name: catData.categoryName,
        clerkId
      }
    });
    console.log(`\nCreated Category: ${catData.categoryName}`);

    for (const itemData of catData.items) {
      const imageUrl = await searchProductImage(itemData.name);
      
      await prisma.item.create({
        data: {
          name: itemData.name,
          price: itemData.price,
          sellingPrice: itemData.price,
          imageUrl: imageUrl || null,
          image: imageUrl || null,
          clerkId,
          userId,
          categoryId: category.id,
          isActive: true
        }
      });
      
      totalAdded++;
      if (imageUrl) {
        totalImagesAdded++;
      }
      console.log(`Added Item: ${itemData.name} - ₹${itemData.price} [Image: ${imageUrl ? 'YES' : 'NO'}]`);
    }
  }

  console.log("\n=================================");
  console.log("Final Insertion Stats (Corrected Menu):");
  console.log(`Total New Items Added: ${totalAdded}`);
  console.log(`Total Images Successfully Added: ${totalImagesAdded}`);
  console.log("=================================");

  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Error:", err);
  prisma.$disconnect();
});
