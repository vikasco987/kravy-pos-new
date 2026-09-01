const { MongoClient } = require('mongodb');
require('dotenv').config();

async function main() {
  const uri = process.env.DATABASE_URL || 'mongodb+srv://user:pass@cluster.mongodb.net/Billgsoftware'; // I'll assume it will pick from .env if running from project root using dotenv
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('Billgsoftware'); // or whatever db name
    const items = await db.collection('MenuItem').find({ imageUrl: { $ne: null } }).limit(500).toArray();
    
    const hosts = new Set();
    items.forEach(item => {
      if (item.imageUrl) {
        try {
          const url = new URL(item.imageUrl);
          hosts.add(url.hostname);
        } catch (e) {
          // ignore
        }
      }
    });
    console.log("Unique hostnames in imageUrls:", Array.from(hosts));
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

main();
