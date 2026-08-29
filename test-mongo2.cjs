const { MongoClient } = require('mongodb');
require('dotenv').config();

async function test() {
  console.log("Connecting to MongoDB...");
  const client = new MongoClient(process.env.DATABASE_URL);
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    await client.close();
  } catch (e) {
    console.error("Connection failed", e);
  }
}
test();
