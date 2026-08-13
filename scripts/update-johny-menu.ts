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
    categoryName: "SADA DOSA VARIETY",
    items: [
      { name: "SADA DOSA", price: 50 },
      { name: "SHEZWAN SADA DOSA", price: 60 },
      { name: "CHEESE SHEZWAN SADA DOSA", price: 75 },
      { name: "MYSOR SADA DOSA", price: 70 },
      { name: "CHEESE MYSOR SADA DOSA", price: 90 },
      { name: "GARLIC SADA DOSA", price: 60 },
    ]
  },
  {
    categoryName: "MASALA DOSA VARIETY",
    items: [
      { name: "MASALA DOSA", price: 60 },
      { name: "CHEESE MASALA DOSA", price: 80 },
      { name: "CHEESE PANEER MASALA DOSA", price: 100 },
      { name: "MYSOR MASALA DOSA", price: 90 },
      { name: "CHEESE MYSOR MASALA DOSA", price: 110 },
      { name: "CHEESE SHEZWAN MASALA DOSA", price: 110 },
      { name: "PAPER MASALA DOSA", price: 140 },
      { name: "CHEESE PAPER SADA DOSA", price: 150 },
    ]
  },
  {
    categoryName: "ME'S DOSA SPECIAL",
    items: [
      { name: "SPECIAL VEG DOSA", price: 180 },
      { name: "PIZZA DOSA", price: 150 },
      { name: "GININ DOSA", price: 150 },
      { name: "GOLMAL DOSA", price: 250 },
      { name: "CIRCUIT DOSA", price: 200 },
      { name: "SPRING ROLI DOSA", price: 180 },
      { name: "DIL KhUSH DOSA", price: 180 },
      { name: "PANEER CHILLY DOSA", price: 150 },
      { name: "CHEESE PANEER CHILLY DOSA", price: 180 },
      { name: "KERALA DSOA", price: 100 },
      { name: "SPRING DOSA", price: 100 },
      { name: "CHEESE SPRING DOSA", price: 120 },
    ]
  },
  {
    categoryName: "CHINESE VERITY - DOSA",
    items: [
      { name: "AMERICAN CHOPSY DOSA", price: 110 },
      { name: "CHEESE AMERICAN CHOPSY DOSA", price: 130 },
      { name: "CHEESE PAV BHAJI DOSA", price: 130 },
    ]
  },
  {
    categoryName: "IDLI & VADA",
    items: [
      { name: "IDLI", price: 50 },
      { name: "BUTTER IDLI", price: 80 },
      { name: "IDLY FRY", price: 90 },
      { name: "MASALA IDLY", price: 100 },
      { name: "CHEESE MASALA IDLI", price: 120 },
      { name: "CHEEESE CHILLY IDLI", price: 110 },
      { name: "CHEESE PANEER CHILLY IDLY", price: 130 },
      { name: "IDLI VADA", price: 60 },
      { name: "BUTTON IDLI", price: 90 },
      { name: "ONLY SINGLE IDLI", price: 25 },
      { name: "MEDU VADA", price: 70 },
      { name: "ONLY SINGLE MENDU VADA", price: 30 },
      { name: "BATATA VADA (SINGLE) SAMBAR", price: 50 },
      { name: "DAHI VADA", price: 80 },
    ]
  },
  {
    categoryName: "UTAPPA VERITY",
    items: [
      { name: "CHEESE SADSA UTAPPA", price: 80 },
      { name: "CHEESE PANEER MASALA UTAPPA", price: 110 },
      { name: "MAYSOR MASALA UTAPPA", price: 80 },
      { name: "CHEESE PANEER ONION UTAPPA", price: 110 },
      { name: "PANEER TOMATO ONION UTAPPA", price: 110 },
    ]
  }
];

async function main() {
  const email = "johny31982@gmail.com";
  
  // Find User
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

  let totalRemoved = 0;
  let totalAdded = 0;
  let totalImagesAdded = 0;

  for (const catData of categoriesData) {
    // Check if category exists
    let category = await prisma.category.findFirst({
      where: {
        clerkId,
        name: { equals: catData.categoryName, mode: 'insensitive' }
      }
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: catData.categoryName,
          clerkId
        }
      });
      console.log(`Created Category: ${catData.categoryName}`);
    }

    // Delete existing items in this category
    const deleteResult = await prisma.item.deleteMany({
      where: {
        clerkId,
        categoryId: category.id
      }
    });
    
    totalRemoved += deleteResult.count;
    console.log(`Removed ${deleteResult.count} items from ${catData.categoryName}`);

    // Add new items
    for (const itemData of catData.items) {
      const imageUrl = await searchProductImage(itemData.name);
      
      await prisma.item.create({
        data: {
          name: itemData.name,
          price: itemData.price,
          sellingPrice: itemData.price, // assuming selling price is same
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
  console.log("Stats:");
  console.log(`Total Items Removed: ${totalRemoved}`);
  console.log(`Total Items Added: ${totalAdded}`);
  console.log(`Total Images Added: ${totalImagesAdded}`);
  console.log("=================================");

  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Error:", err);
  prisma.$disconnect();
});
