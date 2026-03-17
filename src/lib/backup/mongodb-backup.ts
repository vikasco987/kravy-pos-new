import { MongoClient, BSON } from 'mongodb';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import zlib from 'zlib';
import prisma from '../prisma';

/**
 * MongoDB Multi-Collection Backup Engine (SDK v3)
 */
export async function runMongoBackup() {
  const MONGO_URI = process.env.DATABASE_URL;
  const BUCKET_NAME = process.env.AWS_S3_BACKUP_BUCKET;
  
  if (!MONGO_URI) throw new Error("DATABASE_URL is missing");
  if (!BUCKET_NAME) throw new Error("AWS_S3_BACKUP_BUCKET is missing");

  const client = new MongoClient(MONGO_URI);
  
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    }
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `kravy-backup-${timestamp}.json.gz`;

  // Safely get the backup model (handling potential case issues or stale client)
  const backupModel = (prisma as any).backup || (prisma as any).Backup;
  if (!backupModel) {
    console.warn("⚠️ Prisma 'backup' model not found in current instance. Models available:", Object.keys(prisma).filter(k => !k.startsWith('_')));
    throw new Error("Database model 'backup' not found. Please try restarting the server if you just ran prisma generate.");
  }

  const backupDoc = await backupModel.create({
    data: {
      filename,
      fileSize: 0,
      status: 'PENDING'
    }
  });
  const backupId = backupDoc.id;

  try {
    await client.connect();
    const db = client.db();
    const collections = await db.listCollections().toArray();
    
    let allData: Record<string, any> = {};

    for (const colDef of collections) {
      const colName = colDef.name;
      if (colName.startsWith('system.')) continue;
      
      const data = await db.collection(colName).find({}).toArray();
      allData[colName] = data;
    }

    const ejsonString = BSON.EJSON.stringify(allData);
    const compressed = zlib.gzipSync(Buffer.from(ejsonString));
    const fileSize = compressed.length;

    // Upload to S3 using SDK v3 Upload utility
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: `backups/${filename}`,
        Body: compressed,
        ContentType: 'application/gzip',
      }
    });

    await upload.done();

    await backupModel.update({
      where: { id: backupId },
      data: {
        status: 'SUCCESS',
        fileSize,
        s3Url: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/backups/${filename}`
      }
    });

    console.log(`✅ Backup Complete: ${filename} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
    return { success: true, filename, size: fileSize };

  } catch (error: any) {
    console.error("❌ Backup Failed:", error);
    await backupModel.update({
      where: { id: backupId },
      data: {
        status: 'FAILED',
        error: error.message || String(error)
      }
    });
    throw error;
  } finally {
    await client.close();
  }
}
