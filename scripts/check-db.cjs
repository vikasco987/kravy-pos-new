const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const clerkId = 'custom_1780926122156_h2bai';
  const itemNames = [
    'Fish Butter Masala (Sole)',
    'Veg Fried Momos',
    'Paneer Kali Mirch Tikka',
    'Mushroom Malai Tikka',
    'Mushroom Kali Mirch Tikka',
    'Mushroom Achari Tikka',
    'Chaap Kali Mirch Tikka',
    'Cheese Corn Roll',
    'Garlic Fish (Sole)',
    'Fish Fry (Sole)'
  ];

  const items = await prisma.item.findMany({
    where: { 
      clerkId,
      name: {
         // match loosely to see what we get
      }
    }
  });

  const filtered = items.filter(i => itemNames.some(name => i.name.includes(name) || name.includes(i.name)));
  console.log('Items from the screenshot:');
  filtered.forEach(i => console.log(`- ${i.name} (Code: ${i.shortCode}, Price: ${i.price})`));

  // Also let's check if they have shortCode exactly 33
  const code33 = items.filter(i => i.shortCode === '33');
  console.log('\nItems with exact code 33:');
  code33.forEach(i => console.log(`- ${i.name} (Code: ${i.shortCode})`));

  await prisma.$disconnect();
}

run().catch(console.error);
