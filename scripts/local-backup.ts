import { MongoClient, BSON } from 'mongodb';
import zlib from 'zlib';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export async function runLocalMongoBackup() {
  console.log("1. Starting Local Backup...");
  const MONGO_URI = process.env.DATABASE_URL;
  
  if (!MONGO_URI) throw new Error("DATABASE_URL is missing");

  const client = new MongoClient(MONGO_URI);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `kravy-local-backup-${timestamp}.json.gz`;

  try {
    console.log("3. Connecting to MongoDB...");
    await client.connect();
    console.log("4. MongoClient connected");
    const db = client.db();
    const collections = await db.listCollections().toArray();
    
    let allData: Record<string, any> = {};

    for (const colDef of collections) {
      const colName = colDef.name;
      if (colName.startsWith('system.')) continue;
      
      console.log(`Backing up collection: ${colName}`);
      const data = await db.collection(colName).find({}).toArray();
      allData[colName] = data;
      // Add a tiny delay to prevent overwhelming MongoDB Atlas free tier connections
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    const ejsonString = BSON.EJSON.stringify(allData);
    const compressed = zlib.gzipSync(Buffer.from(ejsonString));
    const fileSize = compressed.length;

    console.log(`Writing to file ${filename}...`);
    fs.writeFileSync(path.join(process.cwd(), filename), compressed);

    console.log(`✅ Backup Complete: ${filename} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
    return { success: true, filename, size: fileSize };

  } catch (error: any) {
    console.error("❌ Backup Failed:", error);
    throw error;
  } finally {
    await client.close();
  }
}

runLocalMongoBackup().then(() => process.exit(0)).catch(() => process.exit(1));
