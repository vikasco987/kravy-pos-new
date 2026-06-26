import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import Papa from 'papaparse';

const prisma = new PrismaClient();

async function run() {
  const clerkId = 'custom_1780926122156_h2bai';
  const filePath = '/Users/vikas/Downloads/Customers_Report_2026_05_18_02_16_13 (2).csv';

  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Split the file to skip the first 4 lines
  const lines = fileContent.split('\n');
  
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('Name,Favourite,Phone')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    console.error('Could not find header row');
    return;
  }

  const csvContentToParse = lines.slice(headerIndex).join('\n');

  const { data, errors } = Papa.parse(csvContentToParse, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length > 0) {
    console.error('Errors parsing CSV:', errors);
  }

  console.log(`Found ${data.length} records. Starting import...`);

  let count = 0;
  let skipped = 0;

  for (const row of data as any[]) {
    if (!row.Phone) {
        skipped++;
        continue;
    }

    const name = row.Name ? row.Name.trim() : 'Unknown';
    let phone = row.Phone.trim();
    
    // Clean phone number (remove any weird characters or +91 if needed, but the schema allows String)
    if (phone.length > 15) {
        phone = phone.substring(0, 15); // Just in case
    }
    
    let addressParts = [];
    if (row['Primary Address']?.trim()) addressParts.push(row['Primary Address'].trim());
    if (row['Primary Locality']?.trim()) addressParts.push(row['Primary Locality'].trim());
    
    const address = addressParts.length > 0 ? addressParts.join(', ') : null;

    try {
      await prisma.party.upsert({
        where: {
          phone_createdBy: {
            phone: phone,
            createdBy: clerkId,
          }
        },
        update: {
          name,
          address,
        },
        create: {
          name,
          phone,
          address,
          createdBy: clerkId,
        }
      });
      count++;
      if (count % 1000 === 0) {
          console.log(`Imported ${count} records...`);
      }
    } catch (e) {
      console.error(`Failed to import row: ${phone}`, e);
      skipped++;
    }
  }

  console.log(`Import complete. Successfully imported/updated ${count} customers. Skipped ${skipped}.`);
  await prisma.$disconnect();
}

run().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
