import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const uri = process.env.DATABASE_URL;
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const users = db.collection('User');
  
  await users.updateMany({ role: "user" }, { $set: { role: "USER" } });
  await users.updateMany({ role: "seller" }, { $set: { role: "SELLER" } });
  await users.updateMany({ role: "admin" }, { $set: { role: "ADMIN" } });
  
  console.log("Roles updated.");
  await client.close();
}
main();
