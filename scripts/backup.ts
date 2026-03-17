
import { runMongoBackup } from '../src/lib/backup/mongodb-backup';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function main() {
  console.log("🚀 Starting Manual Backup...");
  try {
    const result = await runMongoBackup();
    console.log("✅ Manual Backup Successful!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Manual Backup Failed!");
    process.exit(1);
  }
}

main();
