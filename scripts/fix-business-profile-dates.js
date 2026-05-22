import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config();

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error("🚨 DATABASE_URL is not defined in env!");
    process.exit(1);
  }

  console.log("🔌 Connecting to MongoDB...");
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Get all collections to find the correct one
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log("📁 Database Collections:", collectionNames);
    
    // Check for both BusinessProfile and businessProfile
    const targetCollection = collectionNames.find(
      name => name.toLowerCase() === 'businessprofile'
    );
    
    if (!targetCollection) {
      console.error("🚨 BusinessProfile collection not found in database!");
      return;
    }
    
    console.log(`🎯 Found collection: "${targetCollection}"`);
    const collection = db.collection(targetCollection);
    
    // 1. Find documents where createdAt is null or missing
    const nullCreatedAtCount = await collection.countDocuments({
      $or: [
        { createdAt: null },
        { createdAt: { $exists: false } }
      ]
    });
    
    console.log(`🔍 Found ${nullCreatedAtCount} profiles with missing/null createdAt.`);
    
    if (nullCreatedAtCount > 0) {
      const result = await collection.updateMany(
        {
          $or: [
            { createdAt: null },
            { createdAt: { $exists: false } }
          ]
        },
        {
          $set: { createdAt: new Date() }
        }
      );
      console.log(`✅ Updated ${result.modifiedCount} profiles with current createdAt date.`);
    }

    // 2. Find documents where updatedAt is null or missing
    const nullUpdatedAtCount = await collection.countDocuments({
      $or: [
        { updatedAt: null },
        { updatedAt: { $exists: false } }
      ]
    });
    
    console.log(`🔍 Found ${nullUpdatedAtCount} profiles with missing/null updatedAt.`);
    
    if (nullUpdatedAtCount > 0) {
      const result = await collection.updateMany(
        {
          $or: [
            { updatedAt: null },
            { updatedAt: { $exists: false } }
          ]
        },
        {
          $set: { updatedAt: new Date() }
        }
      );
      console.log(`✅ Updated ${result.modifiedCount} profiles with current updatedAt date.`);
    }
    
    console.log("🎉 Database fix successfully executed!");
  } catch (error) {
    console.error("🚨 An error occurred:", error);
  } finally {
    await client.close();
    console.log("🔌 Connection closed.");
  }
}

main();
