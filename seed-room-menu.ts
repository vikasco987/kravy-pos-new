import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const menuData = [
  { category: "Paneer", items: [
    { name: "Matar Paneer मटर पनीर", half: 120, full: 210 },
    { name: "Chhole Paneer छोले पनीर", half: 140, full: 230 },
    { name: "Palak Paneer पालक पनीर", half: 130, full: 220 },
    { name: "Aloo Paneer आलू पनीर", half: 110, full: 200 },
    { name: "Chana Masala चना मसाला", half: 140, full: 230 },
    { name: "Matar Masala मटर मसाला", half: 120, full: 210 },
    { name: "Dum Aloo दम आलू", half: 120, full: 220 },
    { name: "Kashmiri Dum Aloo कश्मीरी दम आलू", half: 140, full: 240 },
    { name: "Shahi Paneer शाही पनीर", half: 140, full: 260 },
    { name: "Khoya Paneer खोया पनीर", half: 160, full: 300 },
    { name: "Mix Veg मिक्स वेज", half: 120, full: 210 },
    { name: "Malai Kofta मलाई कोफ्ता", half: 160, full: 300 },
    { name: "Kadhai Paneer कढ़ाई पनीर", half: 150, full: 280 },
    { name: "Paneer Bhurji पनीर भुर्जी", half: 150, full: 280 },
    { name: "Paneer Tikka पनीर टिक्का", half: 160, full: 300 },
    { name: "Chilli Paneer चिल्ली पनीर", half: 160, full: 310 },
    { name: "Paneer Butter Masala पनीर बटर मसाला", half: 160, full: 310 },
    { name: "Paneer Masala पनीर मसाला", half: 170, full: 340 },
    { name: "Paneer Do Pyaza पनीर दो प्याजा", half: 160, full: 200 },
    { name: "Handi Paneer हांडी पनीर", half: 160, full: 300 },
    { name: "Paneer Pasanda पनीर पसंदा", half: 170, full: 330 },
    { name: "Paneer Kolhapuri पनीर कोल्हापुरी", half: 180, full: 340 },
    { name: "Charno Amrit Sp. Paneer चरणों अमृत स्पे. पनीर", half: 190, full: 340 },
    { name: "Kaju Curry काजू करी", half: 180, full: 340 },
    { name: "Mushroom Masala मशरूम मसाला", half: 160, full: 300 },
    { name: "Matar Mushroom मटर मशरूम", half: 160, full: 300 },
    { name: "Paneer Mushroom पनीर मशरूम", half: 160, full: 300 },
    { name: "Mushroom Chilli मशरूम चिल्ली", half: 160, full: 270 },
    { name: "Mushroom Do Pyaza मशरूम दो प्याजा", half: 160, full: 270 },
  ]},
  { category: "Salad & Raita", items: [
    { name: "Green Salad ग्रीन सलाद", price: 70 },
    { name: "Onion Salad ऑनियन सलाद", price: 40 },
    { name: "Dahi दही", price: 60 },
    { name: "Meethi Dahi मीठी दही", price: 70 },
    { name: "Chhach 1 Glass छाछ 1 गिलास", price: 30 },
    { name: "Masala Chhach मसाला छाछ", price: 40 },
    { name: "Boondi Raita बूंदी रायता", half: 50, full: 80 },
    { name: "Aloo Raita आलू रायता", half: 60, full: 90 },
    { name: "Mix Raita मिक्स रायता", half: 70, full: 110 },
    { name: "Papad Dry पापड़ ड्राई", price: 20 },
    { name: "Papad Fry पापड़ फ्राई", price: 30 },
    { name: "Papad Masala पापड़ मसाला", price: 50 },
  ]},
  { category: "Rice", items: [
    { name: "Sada Rice सादा राइस", half: 60, full: 90 },
    { name: "Jeera Rice जीरा राइस", half: 70, full: 110 },
    { name: "Matar Pulao मटर पुलाव", half: 80, full: 150 },
    { name: "Veg Pulao वेज पुलाव", half: 90, full: 160 },
    { name: "Paneer Pulao पनीर पुलाव", half: 100, full: 170 },
  ]},
  { category: "Dal", items: [
    { name: "Dal Fry दाल फ्राई", price: 120 },
    { name: "Dal Fry Urad Chana दाल फ्राई उर्द चना", price: 130 },
    { name: "Amul Butter Dal Fry अमूल बटर दाल फ्राई", price: 160 },
    { name: "Dal Makhani दाल मखनी", price: 190 },
    { name: "Dal Tadka दाल तड़का", price: 150 },
    { name: "Dal Handi दाल हांडी", price: 180 },
    { name: "Punjabi Dal Tadka पंजाबी दाल तड़का", price: 190 },
    { name: "Mix Dal Tadka मिक्स दाल तड़का", price: 200 },
    { name: "Charno Amrit Special Dal चरणों अमृत स्पेशल दाल", price: 260 },
  ]},
  { category: "Sabji", items: [
    { name: "Aloo Chhole आलू छोले", price: 130 },
    { name: "Aloo Matar आलू मटर", price: 130 },
    { name: "Aloo Jeera आलू जीरा", price: 120 },
    { name: "Aloo Tamatar आलू टमाटर", price: 140 },
    { name: "Aloo Palak आलू पालक", price: 120 },
    { name: "Baingan Bharta बैंगन भर्ता", price: 150 },
    { name: "Aloo Gobi आलू गोभी", price: 170 },
    { name: "Tamatar Chutney टमाटर चटनी", price: 220 },
    { name: "Sev Tamatar सेव टमाटर", price: 140 },
    { name: "Sev Bhaji सेव भाजी", price: 140 },
    { name: "Gobi Masala गोभी मसाला", price: 180 },
    { name: "Gobi Matar गोभी मटर", price: 170 },
    { name: "Kadhi Pakora कढ़ी पकोड़ा", price: 120 },
    { name: "Rajma राजमा", price: 170 },
  ]},
  { category: "Roti", items: [
    { name: "Tawa Roti तवा रोटी", price: 15 },
    { name: "Butter Roti बटर रोटी", price: 20 },
    { name: "Tandoori Sada Roti तन्दूरी सादा रोटी", price: 10 },
    { name: "Tandoori Butter Roti तन्दूरी बटर रोटी", price: 15 },
    { name: "Lachha Paratha लच्छा परांठा", price: 50 },
    { name: "Plain Naan प्लेन नान", price: 70 },
    { name: "Butter Naan बटर नान", price: 80 },
    { name: "Missi Roti मिस्सी रोटी", price: 40 },
    { name: "Missi Roti Pyaz मिस्सी रोटी प्याज", price: 50 },
    { name: "Garlic Naan गार्लिक नान", price: 70 },
  ]},
  { category: "Thali", items: [
    { name: "Sada Thali सादा थाली", price: 170, description: "Mix veg, dal fry, rice, 4 butter roti, raita, salad, achar" },
    { name: "Special Thali स्पेशल थाली", price: 240, description: "Shahi paneer, mix veg, dal fry, jeera rice, 4 roti butter, raita, salad, papad, achar" },
  ]},
  { category: "Sweets", items: [
    { name: "Gulab Jamun गुलाब जामुन", price: 0 } 
  ]}
];

async function main() {
  const email = "shreeradha88@gmail.com";
  
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } }
  });

  if (!user) {
    console.error("User not found!");
    return;
  }
  
  console.log(`Found user: ${user.name} (${user.id})`);

  let profile = await prisma.businessProfile.findFirst({
    where: { userId: user.clerkId || user.id }
  });

  if (profile) {
    let zones = profile.zones || [];
    let zonesUpdated = false;
    
    if (!zones.includes("Dhaba")) { zones.push("Dhaba"); zonesUpdated = true; }
    if (!zones.includes("Room")) { zones.push("Room"); zonesUpdated = true; }

    if (zonesUpdated || !profile.multiZoneMenuEnabled) {
      await prisma.businessProfile.update({
        where: { id: profile.id },
        data: {
          multiZoneMenuEnabled: true,
          zones: zones
        }
      });
      console.log("Updated BusinessProfile zones:", zones);
    }
  }

  // Assign existing items to 'Dhaba' zone if they don't have it
  const existingItems = await prisma.item.findMany({
    where: { userId: user.id }
  });
  
  let updatedCount = 0;
  for (const item of existingItems) {
    if (!item.zones || item.zones.length === 0 || !item.zones.includes("Dhaba")) {
      const newZones = item.zones ? [...item.zones] : [];
      if (!newZones.includes("Dhaba")) {
        newZones.push("Dhaba");
        await prisma.item.update({
          where: { id: item.id },
          data: { zones: newZones }
        });
        updatedCount++;
      }
    }
  }
  console.log(`Assigned 'Dhaba' zone to ${updatedCount} existing items.`);

  // Create new categories and items
  for (const group of menuData) {
    // Find or create category
    let category = await prisma.category.findFirst({
      where: {
        name: group.category,
        clerkId: user.clerkId || user.id
      }
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: group.category,
          clerkId: user.clerkId || user.id
        }
      });
      console.log(`Created category: ${group.category}`);
    }

    // Add items
    for (const itemData of group.items) {
      let variants = null;
      let price = itemData.price || 0;

      if (itemData.half && itemData.full) {
        price = itemData.full; // default base price
        variants = [
          {
            id: uuidv4(),
            groupName: "Portion",
            type: "radio",
            required: true,
            options: [
              { id: uuidv4(), name: "Half", price: itemData.half },
              { id: uuidv4(), name: "Full", price: itemData.full }
            ]
          }
        ];
      }

      await prisma.item.create({
        data: {
          name: itemData.name,
          price: price,
          sellingPrice: price,
          description: itemData.description || "",
          isActive: true,
          userId: user.id,
          clerkId: user.clerkId || user.id,
          categoryId: category.id,
          zones: ["Room"],
          variants: variants ? variants : undefined
        }
      });
      console.log(`Created item: ${itemData.name}`);
    }
  }
  
  console.log("Migration complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
