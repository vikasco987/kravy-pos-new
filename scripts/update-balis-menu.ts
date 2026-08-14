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
    categoryName: "SANDWICH (JUMBO)",
    items: [
      { name: "FARM FRESH SANDWICH", price: 159 },
      { name: "PANEER LOADED SANDWICH", price: 179 },
      { name: "TANDOORI PANEER SANDWICH", price: 199 },
      { name: "GRILLED CHICKEN SANDWICH", price: 219 },
      { name: "TANDOORI CHICKEN SANDWICH", price: 239 },
    ]
  },
  {
    categoryName: "PASTA",
    items: [
      { name: "VEG ARRABIATA PASTA", price: 189 },
      { name: "NON-VEG ARRABIATA PASTA", price: 209 },
      { name: "VEG ALFREDO PASTA", price: 219 },
      { name: "NON-VEG ALFREDO PASTA", price: 239 },
      { name: "VEG MIX PASTA", price: 249 },
      { name: "NON-VEG MIX PASTA", price: 269 },
    ]
  },
  {
    categoryName: "DIET SALADS",
    items: [
      { name: "SAUTEED VEGGIES SALAD", price: 179 },
      { name: "GRILLED PANEER SALAD", price: 199 },
      { name: "GRILLED CHICKEN SALAD", price: 219 },
    ]
  },
  {
    categoryName: "FRIES",
    items: [
      { name: "SALTED FRIES", price: 99 },
      { name: "PERI PERI FRIES", price: 119 },
      { name: "CHEESY FRIES", price: 149 },
      { name: "GRILLED CHICKEN FRIES", price: 159 },
      { name: "CHICKEN CHEESY FRIES", price: 179 },
    ]
  },
  {
    categoryName: "ROLLS",
    items: [
      { name: "VEG SPRING ROLL", price: 149 },
      { name: "PANEER KATHI ROLL", price: 149 },
      { name: "CHICKEN SEEK KABAB ROLL", price: 159 },
      { name: "EGG CHICKEN SEEK KABAB ROLL", price: 169 },
    ]
  },
  {
    categoryName: "BURGER (WITH FRIES)",
    items: [
      { name: "ALOO TIKKI BURGER", price: 119 },
      { name: "CHEESE OVERLOADED BURGER", price: 159 },
      { name: "SPICY PANEER BURGER", price: 159 },
      { name: "CHICKEN ZINGER BURGER", price: 179 },
    ]
  },
  {
    categoryName: "SIDES",
    items: [
      { name: "PANEER POPCORN", price: 179 },
      { name: "PANEER STRIPS", price: 199 },
      { name: "CHICKEN POPCORN", price: 199 },
      { name: "CHICKEN STRIPS", price: 219 },
      { name: "CHICKEN NUGGETS (10)", price: 159 },
      { name: "CHICKEN SEEKH KEBAB (3)", price: 199 },
      { name: "CHICKEN FRIED WINGS", price: 179 },
    ]
  },
  {
    categoryName: "ADD-ONS",
    items: [
      { name: "CHICKEN ADD-ON", price: 40 },
      { name: "EGG ADD-ON", price: 20 },
      { name: "CHEESES ADD-ON", price: 30 },
      { name: "SAUCES ADD-ON", price: 20 },
    ]
  },
  {
    categoryName: "MAGGI",
    items: [
      { name: "MASALA MAGGI", price: 79 },
      { name: "VEGETABLE MAGGI", price: 99 },
      { name: "CHEESE MAGGI", price: 109 },
      { name: "VEG TANDOORI MAGGI", price: 119 },
      { name: "CHICKEN MAGGI", price: 139 },
      { name: "CHICKEN CHEESE MAGGI", price: 159 },
      { name: "CHICKEN TANDOORI MAGGI", price: 199 },
    ]
  },
  {
    categoryName: "OMELETTE (2 EGG)",
    items: [
      { name: "CLASSIC BREAD OMELETTE", price: 99 },
      { name: "VEGETABLE OMELETTE", price: 119 },
      { name: "CHEESE OMELETTE", price: 139 },
      { name: "CHICKEN OMELETTE", price: 179 },
      { name: "CHICKEN CHEESE OMELETTE", price: 199 },
    ]
  },
  {
    categoryName: "MOMOS",
    items: [
      { name: "VEG MOMOS (HALF)", price: 59 },
      { name: "VEG MOMOS (FULL)", price: 99 },
      { name: "PANEER MOMOS (HALF)", price: 69 },
      { name: "PANEER MOMOS (FULL)", price: 109 },
      { name: "CHICKEN MOMOS (HALF)", price: 79 },
      { name: "CHICKEN MOMOS (FULL)", price: 129 },
      { name: "VEG KURKURE MOMOS", price: 139 },
      { name: "PANEER KURKURE MOMOS", price: 149 },
      { name: "CHICKEN KURKURE MOMOS", price: 169 },
    ]
  },
  {
    categoryName: "DESSERTS",
    items: [
      { name: "DOUBLE CHOCOLATE BROWNIE", price: 119 },
      { name: "WALLNUT BROWINE", price: 149 },
      { name: "CHOCO LAVA CAKE", price: 99 },
    ]
  },
  {
    categoryName: "BEVERAGES",
    items: [
      { name: "COKE CAN", price: 0 },
      { name: "THUMS UP CAN", price: 0 },
      { name: "FRESH LIME SODA", price: 59 },
      { name: "MINT MOJITO", price: 89 },
      { name: "COLD COFFEE", price: 99 },
    ]
  },
  {
    categoryName: "SNACKS",
    items: [
      { name: "MASALA PAPAD", price: 100 },
      { name: "PEANUT CHAT", price: 100 },
      { name: "FRENCH FRIES", price: 100 },
      { name: "SPRING ROLL", price: 150 },
      { name: "BOILED EGG", price: 80 },
      { name: "BHURJI", price: 60 },
    ]
  },
  {
    categoryName: "NON-VEG",
    items: [
      { name: "CHICKEN NUGGET", price: 159 },
      { name: "CHICKEN SEEKH KABAB", price: 199 },
    ]
  },
  {
    categoryName: "DRINKS",
    items: [
      { name: "ICE", price: 50 },
      { name: "WATER", price: 0 },
      { name: "SODA", price: 0 },
    ]
  }
];

async function main() {
  const email = "balis.cuisine@gmail.com";
  
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

  // Delete ALL existing items for this customer first, as requested
  const deleteResult = await prisma.item.deleteMany({
    where: {
      clerkId
    }
  });
  console.log(`Removed ${deleteResult.count} old items for this customer.`);

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
  console.log(`Total Old Items Removed: ${deleteResult.count}`);
  console.log(`Total New Items Added: ${totalAdded}`);
  console.log(`Total Images Added: ${totalImagesAdded}`);
  console.log("=================================");

  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Error:", err);
  prisma.$disconnect();
});
