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
      const docs = await c.find({
        $or: [
          { customerPhone: { $regex: "9855934487" } },
          { customerName: { $regex: "3 frds" } },
          { phone: { $regex: "9855934487" } }
        ]
      }).toArray();
      
      if (docs.length > 0) {
        console.log(`Found 9855934487 or 3 frds in collection: ${name}`, docs.map(d => d._id));
      }
    }
  } finally {
    await client.close();
  }
}

main().catch(console.error);
