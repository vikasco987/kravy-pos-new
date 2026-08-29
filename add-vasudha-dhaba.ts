import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const userId = '6a7b541261bb5dd93dc1828b'; // gorapallisrikanth45@gmail.com
const targetZone = 'NON AC';

const menuData = [
  // IMAGE 1
  {
    category: 'Chicken Items',
    items: [
      { name: 'Chicken Manchurian', price: 180, isVeg: false },
      { name: 'Chilli Chicken', price: 210, isVeg: false },
      { name: 'Chicken 65', price: 210, isVeg: false },
      { name: 'Chicken Wings', price: 220, isVeg: false },
      { name: 'Chicken Lollipop', price: 230, isVeg: false },
      { name: 'Dragon Chicken', price: 240, isVeg: false },
      { name: 'Chicken Majestic', price: 240, isVeg: false },
      { name: 'Chicken Pakoda', price: 240, isVeg: false },
      { name: 'Garlic Chicken', price: 240, isVeg: false },
      { name: 'Pepper Chicken', price: 250, isVeg: false },
      { name: 'Chicken 555', price: 250, isVeg: false },
      { name: 'Chicken Fry Roast (B)', price: 210, isVeg: false },
      { name: 'Chicken Fry Roast (BL)', price: 250, isVeg: false },
      { name: 'Kaju Chicken Pakoda', price: 270, isVeg: false },
      { name: 'Chicken Drumsticks (2)', price: 230, isVeg: false },
    ]
  },
  {
    category: 'Fish Items',
    items: [
      { name: 'Apollo Fish', price: 250, isVeg: false },
      { name: 'Fish 65', price: 260, isVeg: false },
      { name: 'Fish Fry (3)', price: 250, isVeg: false },
      { name: 'Fish Manchurian', price: 260, isVeg: false },
      { name: 'Fish Finger', price: 300, isVeg: false },
    ]
  },
  {
    category: 'Prawns Items',
    items: [
      { name: 'Prawn Fry', price: 260, isVeg: false },
      { name: 'Prawn 65', price: 265, isVeg: false },
      { name: 'Pepper Prawns', price: 265, isVeg: false },
      { name: 'Chilli Prawns', price: 270, isVeg: false },
      { name: 'Loose Prawns', price: 290, isVeg: false },
      { name: 'Golden Fried Prawn', price: 300, isVeg: false },
      { name: 'Garlic Prawn', price: 300, isVeg: false },
    ]
  },
  {
    category: 'Mutton Items',
    items: [
      { name: 'Mutton Fry', price: 380, isVeg: false },
      { name: 'Mutton Ghee Roast', price: 399, isVeg: false },
      { name: 'Mutton Chilli', price: 390, isVeg: false },
      { name: 'Mutton Pepper', price: 399, isVeg: false },
      { name: 'Talakaya Fry', price: 250, isVeg: false },
      { name: 'Botti Fry', price: 240, isVeg: false },
    ]
  },
  {
    category: 'Kamuju Kodi Items',
    items: [
      { name: 'Kamuju Kodi Dry', price: 220, isVeg: false },
      { name: 'Kamuju Kodi Semi Wet', price: 230, isVeg: false },
    ]
  },
  {
    category: 'Egg Items',
    items: [
      { name: 'Egg 65', price: 180, isVeg: false },
      { name: 'Egg Chilli', price: 180, isVeg: false },
      { name: 'Boiled Egg', price: 10, isVeg: false },
      { name: 'Egg Bhurji', price: 99, isVeg: false },
      { name: 'Egg Keema', price: 130, isVeg: false },
    ]
  },
  {
    category: 'Veg Starters',
    items: [
      { name: 'Salad', price: 99, isVeg: true },
      { name: 'Crispy Corn', price: 160, isVeg: true },
      { name: 'Baby Corn Crispy', price: 200, isVeg: true },
      { name: 'Mushroom Chilli', price: 220, isVeg: true },
      { name: 'Mushroom 65', price: 240, isVeg: true },
      { name: 'Mushroom Manchurian', price: 240, isVeg: true },
      { name: 'Mushroom Pakoda', price: 240, isVeg: true },
      { name: 'Paneer Chilli', price: 230, isVeg: true },
      { name: 'Paneer Manchurian', price: 240, isVeg: true },
      { name: 'Paneer Pakoda', price: 240, isVeg: true },
      { name: 'Paneer 65', price: 250, isVeg: true },
    ]
  },
  {
    category: 'Biryanis',
    items: [
      { name: 'Chicken Dum Biryani', price: 180, isVeg: false },
      { name: 'Chicken Fry Piece Biryani', price: 200, isVeg: false },
      { name: 'Chicken Mughlai Biryani', price: 280, isVeg: false },
      { name: 'Spl Chicken Biryani', price: 290, isVeg: false },
      { name: 'Chicken 65 Biryani', price: 280, isVeg: false },
      { name: 'Chicken Lollipop Biryani', price: 260, isVeg: false },
      { name: 'Chicken Double Joint Biryani', price: 299, isVeg: false },
      { name: 'Gongura Chicken Biryani', price: 250, isVeg: false },
      { name: 'Prawn Biryani', price: 290, isVeg: false },
      { name: 'Gongura Prawn Biryani', price: 330, isVeg: false },
      { name: 'Mutton Biryani', price: 360, isVeg: false },
      { name: 'Mutton Mughlai Biryani', price: 380, isVeg: false },
      { name: 'Gongura Mutton Biryani', price: 390, isVeg: false },
      { name: 'Tadka Biryani (NV)', price: 370, isVeg: false },
      { name: 'Natu Kodi Biryani', price: 370, isVeg: false },
    ]
  },
  // IMAGE 2
  {
    category: 'Pulao',
    items: [
      { name: 'Plain Pulao', price: 150, isVeg: true },
      { name: 'Chicken Pulao', price: 290, isVeg: false },
      { name: 'Prawn Pulao', price: 360, isVeg: false },
      { name: 'Mutton Pulao', price: 390, isVeg: false },
      { name: 'Raju Gari Natu Kodi Pulao', price: 390, isVeg: false },
    ]
  },
  {
    category: 'Veg Biryani',
    items: [
      { name: 'Plain Biryani', price: 150, isVeg: true },
      { name: 'Veg Biryani', price: 160, isVeg: true },
      { name: 'Egg Biryani', price: 170, isVeg: false },
      { name: 'Mushroom Biryani', price: 240, isVeg: true },
      { name: 'Paneer Biryani', price: 250, isVeg: true },
      { name: 'Kaju Paneer Biryani', price: 290, isVeg: true },
      { name: 'Tadka Veg Biryani', price: 320, isVeg: true },
    ]
  },
  {
    category: 'Fried Rice',
    items: [
      { name: 'Veg Fried Rice', price: 150, isVeg: true },
      { name: 'Egg Fried Rice', price: 170, isVeg: false },
      { name: 'Chicken Fried Rice', price: 190, isVeg: false },
      { name: 'Prawn Fried Rice', price: 250, isVeg: false },
      { name: 'Spl Chicken Fried Rice', price: 260, isVeg: false },
      { name: 'Mixed Fried Rice (NV)', price: 290, isVeg: false },
      { name: 'Paneer Fried Rice', price: 190, isVeg: true },
      { name: 'Mushroom Fried Rice', price: 190, isVeg: true },
      { name: 'Spl Veg Fried Rice', price: 220, isVeg: true },
      { name: 'Kaju Fried Rice', price: 230, isVeg: true },
      { name: 'Kaju Chicken Fried Rice', price: 250, isVeg: false },
      { name: 'Mixed Fried Rice (V)', price: 230, isVeg: true },
      { name: 'Schezwan Veg Fried Rice', price: 170, isVeg: true },
      { name: 'Schezwan Egg Fried Rice', price: 190, isVeg: false },
      { name: 'Schezwan Chicken Fried Rice', price: 210, isVeg: false },
    ]
  },
  {
    category: 'Rice',
    items: [
      { name: 'White Rice', price: 50, isVeg: true },
      { name: 'Curd Rice', price: 99, isVeg: true },
    ]
  },
  {
    category: 'Veg Curries',
    items: [
      { name: 'Kaju Tomato', price: 220, isVeg: true },
      { name: 'Kaju Paneer', price: 260, isVeg: true },
      { name: 'Kadai Paneer', price: 240, isVeg: true },
      { name: 'Paneer Butter Masala', price: 250, isVeg: true },
      { name: 'Kaju Curry', price: 250, isVeg: true },
      { name: 'Paneer Curry', price: 230, isVeg: true },
      { name: 'Mushroom Curry', price: 240, isVeg: true },
      { name: 'Green Peas Masala', price: 160, isVeg: true },
      { name: 'Cashew Mushroom', price: 290, isVeg: true },
    ]
  },
  {
    category: 'Non-Veg Curries',
    items: [
      { name: 'Chicken Curry (B)', price: 200, isVeg: false },
      { name: 'Natu Kodi Curry', price: 290, isVeg: false },
      { name: 'Gongura Chicken Curry', price: 250, isVeg: false },
      { name: 'Chicken Boneless Curry', price: 250, isVeg: false },
      { name: 'Cashew Chicken Curry', price: 300, isVeg: false },
      { name: 'Butter Chicken Curry', price: 260, isVeg: false },
      { name: 'Chicken Mughlai Curry', price: 280, isVeg: false },
      { name: 'Tadka Curry (NV)', price: 320, isVeg: false },
      { name: 'Prawn Curry', price: 290, isVeg: false },
      { name: 'Boti Curry', price: 250, isVeg: false },
      { name: 'Thalakai Curry', price: 240, isVeg: false },
      { name: 'Mutton Curry', price: 350, isVeg: false },
      { name: 'Fish Curry', price: 230, isVeg: false },
      { name: 'Boneless Fish Curry', price: 250, isVeg: false },
    ]
  },
  {
    category: 'Veg Soups',
    items: [
      { name: 'Tomato Soup', price: 140, isVeg: true },
      { name: 'Sweet Corn Soup', price: 160, isVeg: true },
      { name: 'Hot And Sour Soup', price: 170, isVeg: true },
      { name: 'Manchow Soup', price: 180, isVeg: true },
      { name: 'Lemon Coriander Soup', price: 170, isVeg: true },
      { name: 'Clear Soup', price: 160, isVeg: true },
      { name: 'Cream of Soup', price: 170, isVeg: true },
    ]
  },
  {
    category: 'Non Veg Soups',
    items: [
      { name: 'Sweetcorn Soup (C)', price: 170, isVeg: false },
      { name: 'Hot And Sour Soup (C)', price: 180, isVeg: false },
      { name: 'Manchow Soup (C)', price: 200, isVeg: false },
      { name: 'Lemon Coriander Soup (C)', price: 200, isVeg: false },
      { name: 'Clear Soup (C)', price: 180, isVeg: false },
      { name: 'Cream of Soup (C)', price: 190, isVeg: false },
    ]
  },
  {
    category: 'Indian Breads',
    items: [
      { name: 'Phulka (1PC)', price: 15, isVeg: true },
      { name: 'Butter Phulka (1PC)', price: 25, isVeg: true },
    ]
  },
  {
    category: 'Desserts',
    items: [
      { name: 'Gulab Jamun', price: 0, isVeg: true },
      { name: 'Ice Cream', price: 0, isVeg: true },
    ]
  }
];

async function run() {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found!");
  console.log("Found user:", user.email, user.phone);

  // First, verify BusinessProfile zones
  const bp = await prisma.businessProfile.findFirst({ where: { userId } });
  if (bp) {
    let zones = bp.zones || [];
    if (!zones.includes(targetZone)) {
      zones.push(targetZone);
      await prisma.businessProfile.update({
        where: { id: bp.id },
        data: { zones }
      });
      console.log('Added nonAC zone to BusinessProfile.');
    }
  }

  let itemsAdded = 0;

  for (const block of menuData) {
    // 1. Get or create category
    let dbCat = await prisma.category.findFirst({
      where: { clerkId: user.clerkId, name: block.category }
    });
    if (!dbCat) {
      dbCat = await prisma.category.create({
        data: {
          name: block.category,
          clerkId: user.clerkId
        }
      });
      console.log(`Created category: ${dbCat.name}`);
    } else {
      console.log(`Found category: ${dbCat.name}`);
    }

    // 2. Add items
    for (const item of block.items) {
      // Check if item exists to avoid duplication
      const existing = await prisma.item.findFirst({
        where: { clerkId: user.clerkId, name: item.name }
      });

      if (existing) {
        // If it exists, make sure nonAC is in the zones
        let existingZones = existing.zones || [];
        if (!existingZones.includes(targetZone)) {
          existingZones.push(targetZone);
          await prisma.item.update({
            where: { id: existing.id },
            data: { zones: existingZones }
          });
        }
      } else {
        await prisma.item.create({
          data: {
            name: item.name,
            price: item.price,
            isVeg: item.isVeg,
            isActive: true,
            zones: [targetZone],
            categoryId: dbCat.id,
            userId,
            clerkId: user.clerkId,
            image: ''
          }
        });
        itemsAdded++;
      }
    }
  }

  console.log(`Successfully added ${itemsAdded} new items to the nonAC zone!`);
}

run().finally(() => prisma.$disconnect());
