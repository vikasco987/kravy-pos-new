const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');

const prisma = new PrismaClient();

function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function run() {
  const workbook = xlsx.readFile('/Users/vikas/Downloads/chawla since 1960 (9).xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const excelData = xlsx.utils.sheet_to_json(worksheet);

  const clerkId = 'custom_1780926122156_h2bai';
  const dbItems = await prisma.item.findMany({ where: { clerkId } });

  let updatedCount = 0;
  let matchCount = 0;

  for (const dbItem of dbItems) {
    let name = dbItem.name;
    // Remove (V) or (NV)
    name = name.replace(/\(V\)/i, '').replace(/\(NV\)/i, '').replace(/\(NV \(Egg\)\)/i, '').trim();

    let dbVariation = '';
    const match = name.match(/\((Half|Full|Quarter|Plate|QTR)\)/i);
    if (match) {
      dbVariation = match[1];
      if (dbVariation.toLowerCase() === 'qtr') dbVariation = 'Quarter';
      name = name.replace(match[0], '').trim();
    }

    const normName = normalize(name);
    const normVar = normalize(dbVariation);

    // Find in Excel
    let matchedExcel = excelData.find(row => {
      const exName = normalize(row['Item Name']);
      const exVar = normalize(row['Variation'] || '');
      return exName === normName && exVar === normVar;
    });

    if (!matchedExcel) {
        // try finding exact name without variation if variation is empty in db or in excel
        matchedExcel = excelData.find(row => normalize(row['Item Name']) === normName);
    }

    if (matchedExcel && matchedExcel['CODE ']) {
        const newCode = String(matchedExcel['CODE ']).trim();
        if (dbItem.shortCode !== newCode) {
            await prisma.item.update({
                where: { id: dbItem.id },
                data: { shortCode: newCode }
            });
            updatedCount++;
            console.log(`[UPDATED] ${dbItem.name}: ${dbItem.shortCode || 'none'} -> ${newCode}`);
        }
        matchCount++;
    }
  }

  console.log(`\nMatched: ${matchCount}, Updated: ${updatedCount}`);
  await prisma.$disconnect();
}

run().catch(console.error);
