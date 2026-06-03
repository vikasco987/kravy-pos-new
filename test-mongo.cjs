const { MongoClient } = require('mongodb');
async function main() {
  const uri = "mongodb+srv://ajitkushwahacse:ajit12345@kravy.uqv3j.mongodb.net/";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const dbs = await client.db().admin().listDatabases();
    console.log("Databases:");
    for (let db of dbs.databases) {
      console.log(` - ${db.name}`);
      const collections = await client.db(db.name).listCollections().toArray();
      for (let col of collections) {
        console.log(`    -> ${col.name}`);
        if(col.name === 'items' || col.name === 'products' || col.name === 'menus' || col.name === 'Item' || col.name === 'images') {
           const sample = await client.db(db.name).collection(col.name).findOne({});
           console.log(`      Sample:`, sample);
        }
      }
    }
  } catch(e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
main();
