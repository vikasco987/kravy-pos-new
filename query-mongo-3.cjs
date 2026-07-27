const { MongoClient } = require('mongodb');

async function main() {
  const uri = "mongodb://Krishna:Radha%40987@ac-0r1awp8-shard-00-00.lprzjz2.mongodb.net:27017,ac-0r1awp8-shard-00-01.lprzjz2.mongodb.net:27017,ac-0r1awp8-shard-00-02.lprzjz2.mongodb.net:27017/Billgsoftware?ssl=true&replicaSet=atlas-oicdef-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Billgsoftware";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('Billgsoftware');
    const orders = await db.collection('Order').find({
      $or: [
        { total: 4410 },
        { total: 4631 }
      ]
    }).toArray();
    
    console.log("Orders found:", orders.map(o => ({ _id: o._id, total: o.total, customer: o.customerName, tokenNumber: o.tokenNumber, createdAt: o.createdAt })));
  } finally {
    await client.close();
  }
}

main().catch(console.error);
