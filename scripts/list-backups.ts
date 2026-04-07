import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

async function listBackups() {
    const s3Client = new S3Client({
        region: process.env.AWS_REGION || "eu-north-1",
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
    });

    const bucket = process.env.AWS_S3_BACKUP_BUCKET;
    console.log(`🔍 Listing objects in bucket: ${bucket}...`);

    try {
        const command = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: "backups/",
        });

        const response = await s3Client.send(command);
        if (!response.Contents) {
            console.log("❌ No backups found.");
            return;
        }

        const backups = response.Contents
            .sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0));

        console.log("\n📬 Found Backups (Latest first):");
        backups.forEach(b => {
            console.log(`- ${b.Key} (${(b.Size || 0) / 1024} KB) - ${b.LastModified}`);
        });

    } catch (err) {
        console.error("❌ Error listing backups:", err);
    }
}

listBackups();
