const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.DATABASE_URL;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('Billgsoftware');
    const collections = await db.collections();
    
    for (let c of collections) {
      const name = c.collectionName;
      // Search for 4631 or 9855934487
      const count1 = await c.countDocuments({ $text: { $search: "9855934487" } }).catch(() => 0);
      const docs1 = await c.find({ $or: [{ total: 4631 }, { phone: "9855934487" }, { customerPhone: "9855934487" }] }).toArray();
      
      if (docs1.length > 0) {
        console.log(`Found in collection: ${name}`, docs1);
      }
    }
    console.log("Done searching collections.");
  } finally {
    await client.close();
  }
}

main().catch(console.error);
