const { MongoClient } = require('mongodb');
require('dotenv').config();

async function main() {
  const uri = process.env.DATABASE_URL;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('Billgsoftware');
    const items = await db.collection('Item').find({ name: { $regex: /Egg Bujji/i } }).limit(2).toArray();
    
    console.log(JSON.stringify(items, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

main();
