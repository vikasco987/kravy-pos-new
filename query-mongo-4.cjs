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
      // find docs with string "4631" in total or any text search if possible
      const docs = await c.find({
        $or: [
          { total: "4631" },
          { amount: "4631" },
          { totalAmount: "4631" }
        ]
      }).toArray();
      
      if (docs.length > 0) {
        console.log(`Found string "4631" in collection: ${name}`, docs.map(d => d._id));
      }
    }
    
    // Let's also check for order with 9 items globally
    const Order = db.collection('Order');
    const nineItemOrders = await Order.find({ items: { $size: 9 } }).toArray();
    console.log("Orders with exactly 9 items:");
    nineItemOrders.forEach(o => console.log(`ID: ${o._id}, Total: ${o.total}, Token: ${o.tokenNumber}, Date: ${o.createdAt}`));

  } finally {
    await client.close();
  }
}

main().catch(console.error);
