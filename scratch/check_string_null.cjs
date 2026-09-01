const { MongoClient } = require('mongodb');
require('dotenv').config();

async function main() {
  const uri = process.env.DATABASE_URL;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('Billgsoftware');
    const items = await db.collection('Item').find({ imageUrl: "null" }).limit(5).toArray();
    
    items.forEach(item => {
      console.log(`${item.name} | imageUrl: ${item.imageUrl} (type: ${typeof item.imageUrl}) | image: ${item.image} (type: ${typeof item.image})`);
    });
    
    console.log("Checking Egg Bujji specifically:");
    const eggBujji = await db.collection('Item').find({ name: { $regex: /Egg Bujji/i } }).limit(5).toArray();
    eggBujji.forEach(item => {
      console.log(`${item.name} | imageUrl: ${item.imageUrl} (type: ${typeof item.imageUrl}) | image: ${item.image} (type: ${typeof item.image})`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

main();
