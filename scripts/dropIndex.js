// simple node script to drop problematic index
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const client = new MongoClient(url);
  try {
    await client.connect();
    const dbName = client.db().databaseName;
    console.log('connected to', dbName);
    const db = client.db(dbName);
    const coll = db.collection('BusinessProfile');
    console.log('dropping index BusinessProfile_userId_key');
    await coll.dropIndex('BusinessProfile_userId_key');
    console.log('index dropped');
  } catch (err) {
    console.error('error', err);
  } finally {
    await client.close();
  }
}

main();