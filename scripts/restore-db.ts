import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { MongoClient, BSON } from "mongodb";
import dotenv from "dotenv";
import zlib from "zlib";
import { Stream } from "stream";

dotenv.config();

/**
 * MongoDB Multi-Collection RESTORE Engine
 */
async function restoreBackup(filename: string) {
    const MONGO_URI = process.env.DATABASE_URL;
    const BUCKET_NAME = process.env.AWS_S3_BACKUP_BUCKET;

    if (!MONGO_URI) throw new Error("DATABASE_URL is missing");
    if (!BUCKET_NAME) throw new Error("AWS_S3_BACKUP_BUCKET is missing");

    console.log(`🚀 Starting RESTORE for ${filename}...`);

    const s3Client = new S3Client({
        region: process.env.AWS_REGION || "eu-north-1",
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
    });

    const mongoClient = new MongoClient(MONGO_URI);

    try {
        // 1. Download from S3
        console.log(`📥 Downloading ${filename} from S3...`);
        const getObjectCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: filename.startsWith("backups/") ? filename : `backups/${filename}`,
        });

        const s3Response = await s3Client.send(getObjectCommand);
        const chunks: Buffer[] = [];
        const stream = s3Response.Body as Stream;

        for await (const chunk of stream as any) {
            chunks.push(chunk);
        }
        const compressed = Buffer.concat(chunks);

        // 2. Decompress
        console.log(`🔓 Decompressing...`);
        const decompressed = zlib.gunzipSync(compressed);
        const ejsonString = decompressed.toString("utf-8");

        // 3. Parse EJSON
        console.log(`🧩 Parsing data...`);
        const allData = BSON.EJSON.parse(ejsonString) as Record<string, any[]>;

        // 4. Connect to Mongo and Restore
        await mongoClient.connect();
        const db = mongoClient.db();
        
        const collections = Object.keys(allData);
        console.log(`📦 Found ${collections.length} collections to restore.`);

        for (const colName of collections) {
            const data = allData[colName];
            if (!data || data.length === 0) continue;

            console.log(`🔄 Restoring collection: ${colName} (${data.length} documents)...`);
            
            // We use ordered: false to skip duplicates (where _id already exists)
            try {
                const result = await db.collection(colName).insertMany(data, { ordered: false });
                console.log(`   ✅ Inserted ${result.insertedCount} new documents into ${colName}.`);
            } catch (err: any) {
                if (err.code === 11000 || err.writeErrors) {
                    const inserted = err.result?.insertedCount || 0;
                    const skipped = data.length - inserted;
                    console.log(`   ⚠️ Inserted ${inserted}, skipped ${skipped} duplicates in ${colName}.`);
                } else {
                    console.error(`   ❌ Error in ${colName}:`, err.message);
                }
            }
        }

        console.log("\n🎉 RESTORE COMPLETED SUCCESSFULLY!");

    } catch (err) {
        console.error("\n❌ RESTORE FAILED:", err);
    } finally {
        await mongoClient.close();
    }
}

// Get the latest backup from command line or hardcoded
const latestBackup = "backups/kravy-backup-2026-03-24T08-00-21-039Z.json.gz";
restoreBackup(latestBackup);
