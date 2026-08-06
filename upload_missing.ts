import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'support.thereunionadda@gmail.com';
  
  const user = await prisma.user.findFirst({
    where: { email: email }
  });

  if (!user) {
    console.log("User not found!");
    return;
  }

  // Helper to get or create category
  async function getCategory(name: string) {
    let cat = await prisma.category.findFirst({
      where: { clerkId: user.id, name: name }
    });
    if (!cat) {
      cat = await prisma.category.create({
        data: {
          name: name,
          clerkId: user.id
        }
      });
    }
    return cat;
  }

  // List of items to insert
  const categoriesData = [
    {
      name: "Chinese & Momos",
      items: [
        { name: "Chilli Paneer (Dry)", price: 110, isVeg: true },
        { name: "Chilli Paneer (Gravy)", price: 120, isVeg: true },
        { name: "Veg Manchurian (Dry)", price: 90, isVeg: true },
        { name: "Veg Manchurian (Gravy)", price: 100, isVeg: true },
        { name: "Veg Momos (8 Pcs) - Steam", price: 79, isVeg: true },
        { name: "Veg Momos (8 Pcs) - Fried", price: 89, isVeg: true },
        { name: "Veg Momos (8 Pcs) - Kurkure", price: 110, isVeg: true },
        { name: "Paneer Momos (8 Pcs) - Steam", price: 90, isVeg: true },
        { name: "Paneer Momos (8 Pcs) - Fried", price: 100, isVeg: true },
        { name: "Paneer Momos (8 Pcs) - Kurkure", price: 120, isVeg: true },
        { name: "Corn Cheese Momos (8 Pcs) - Steam", price: 110, isVeg: true },
        { name: "Corn Cheese Momos (8 Pcs) - Fried", price: 120, isVeg: true },
        { name: "Corn Cheese Momos (8 Pcs) - Kurkure", price: 130, isVeg: true },
        { name: "Veg Chowmein", price: 70, isVeg: true },
        { name: "Veg Fried Rice", price: 80, isVeg: true },
        { name: "Veg Hakka Noodles", price: 80, isVeg: true },
        { name: "Veg Spring Roll", price: 70, isVeg: true },
      ]
    },
    {
      name: "Daily Fuel Thalis & Street Food",
      items: [
        { name: "Budget Veg Thali", price: 99, isVeg: true, description: "1 Daily Sabji + 1 Dal Tadka + 3 Roti + Fresh Salad" },
        { name: "Reunion Special Thali", price: 220, isVeg: true, description: "1 Paneer + 1 Mix Veg + Dal Makhani + Boondi Raita + 4 Roti + Salad + Papad + Sweet" },
        { name: "Veg Maggi", price: 50, isVeg: true },
        { name: "Cheese Maggi", price: 80, isVeg: true },
        { name: "Pav Bhaji (2 Soft Butter Pav)", price: 80, isVeg: true },
        { name: "Mix Pakoda (6 Pcs)", price: 70, isVeg: true },
        { name: "Paneer Pakoda (6 Pcs)", price: 90, isVeg: true },
        { name: "Mix Pakode (Bulk Order)", price: 350, isVeg: true, unit: "Kg" },
        { name: "Chole Bhature (2 Bhature)", price: 70, isVeg: true },
        { name: "Aloo Paratha", price: 60, isVeg: true },
        { name: "Pyaz Paratha", price: 70, isVeg: true },
        { name: "Paneer Paratha", price: 90, isVeg: true },
      ]
    },
    {
      name: "Hot & Cold Beverages",
      items: [
        { name: "Masala Tea (Spiced Chai)", price: 15, isVeg: true },
        { name: "Desi Kulhad Tea", price: 25, isVeg: true },
        { name: "Cold Drink (Glass)", price: 25, isVeg: true },
        { name: "Hot Coffee", price: 49, isVeg: true },
        { name: "Classic Cold Coffee", price: 49, isVeg: true },
        { name: "Cold Coffee with Ice Cream", price: 99, isVeg: true },
      ]
    },
    {
      name: "North Indian Main Course",
      items: [
        { name: "Dal Tadka", price: 155, isVeg: true },
        { name: "Dal Fry", price: 155, isVeg: true },
        { name: "Mix Veg Handi", price: 165, isVeg: true },
        { name: "Dal Makhani (Creamy)", price: 175, isVeg: true },
        { name: "Shahi Paneer", price: 185, isVeg: true },
        { name: "Kadhai Paneer", price: 199, isVeg: true },
        { name: "Mushroom Masala", price: 199, isVeg: true },
        { name: "Paneer Butter Masala", price: 210, isVeg: true },
        { name: "Paneer Lababdar", price: 220, isVeg: true },
        { name: "Kaju Masala (Rich Gravy)", price: 240, isVeg: true },
      ]
    },
    {
      name: "Breads, Rice, Papad & Dessert",
      items: [
        { name: "Tawa Roti (Plain)", price: 10, isVeg: true },
        { name: "Tawa Roti (Butter)", price: 12, isVeg: true },
        { name: "Tandoori Roti (Plain)", price: 10, isVeg: true },
        { name: "Tandoori Roti (Butter)", price: 12, isVeg: true },
        { name: "Lachha Paratha", price: 35, isVeg: true },
        { name: "Butter Naan", price: 40, isVeg: true },
        { name: "Garlic Naan", price: 50, isVeg: true },
        { name: "Masala Papad", price: 40, isVeg: true },
        { name: "Veg Loaded Papad", price: 50, isVeg: true },
        { name: "Jeera Rice", price: 80, isVeg: true },
        { name: "Boondi Raita", price: 80, isVeg: true },
        { name: "Veg Dum Biryani (with Raita)", price: 149, isVeg: true },
        { name: "Gulab Jamun with Ice Cream (2 Pcs)", price: 60, isVeg: true },
      ]
    }
  ];

  for (const catData of categoriesData) {
    const category = await getCategory(catData.name);
    console.log(`Processing category: ${category.name}`);

    for (const itemData of catData.items) {
      const existing = await prisma.item.findFirst({
        where: { userId: user.id, name: itemData.name }
      });
      if (!existing) {
        await prisma.item.create({
          data: {
            name: itemData.name,
            sellingPrice: itemData.price,
            price: itemData.price,
            isVeg: itemData.isVeg,
            description: itemData.description || null,
            unit: itemData.unit || null,
            categoryId: category.id,
            userId: user.id,
            clerkId: user.id,
          }
        });
        console.log(`  Inserted: ${itemData.name} at ₹${itemData.price}`);
      } else {
        console.log(`  Skipped (Already exists): ${itemData.name}`);
      }
    }
  }

  console.log("Upload complete!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
