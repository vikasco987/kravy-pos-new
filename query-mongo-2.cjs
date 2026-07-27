const { MongoClient } = require('mongodb');

async function main() {
  const uri = "mongodb://Krishna:Radha%40987@ac-0r1awp8-shard-00-00.lprzjz2.mongodb.net:27017,ac-0r1awp8-shard-00-01.lprzjz2.mongodb.net:27017,ac-0r1awp8-shard-00-02.lprzjz2.mongodb.net:27017/Billgsoftware?ssl=true&replicaSet=atlas-oicdef-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Billgsoftware";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('Billgsoftware');
    const collections = await db.collections();
    
    for (let c of collections) {
      const name = c.collectionName;
      // find docs with any field containing 4631 (numeric or string)
      const docs = await c.find({
        $or: [
          { total: 4631 },
          { total: 4631.0 },
          { amount: 4631 },
          { totalAmount: 4631 }
        ]
      }).toArray();
      
      if (docs.length > 0) {
        console.log(`Found in collection: ${name}`, docs.map(d => ({_id: d._id, tokenNumber: d.tokenNumber, total: d.total})));
      }
    }
    console.log("Done searching collections by exact numeric 4631.");
  } finally {
    await client.close();
  }
}

main().catch(console.error);
