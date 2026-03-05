// simple node script to drop problematic index (CJS)
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
    const indexes = await coll.indexes();
    console.log('existing indexes:', indexes);

    // find any duplicate userId values
    const duplicates = await coll.aggregate([
      { $group: { _id: "$userId", count: { $sum: 1 }, docs: { $push: "$_id" } } },
      { $match: { _id: { $ne: null }, count: { $gt: 1 } } }
    ]).toArray();
    if (duplicates.length) {
      console.log('found duplicate userId entries:', duplicates);
      // remove all but first of each duplicate set
      for (const dup of duplicates) {
        const [keep, ...rest] = dup.docs;
        console.log('keeping', keep, 'removing', rest);
        await coll.deleteMany({ _id: { $in: rest } });
      }
      console.log('duplicates removed');
    } else {
      console.log('no duplicate userId values found');
    }

    // after cleaning data, try dropping index if exists
    const idxName = 'BusinessProfile_userId_key';
    const hasIndex = indexes.find(i => i.name === idxName);
    if (hasIndex) {
      console.log('dropping named index', idxName);
      await coll.dropIndex(idxName);
      console.log('index dropped');
    }
  } catch (err) {
    console.error('error', err);
  } finally {
    await client.close();
  }
}

main();