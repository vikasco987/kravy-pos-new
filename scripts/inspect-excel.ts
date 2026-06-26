import * as xlsx from 'xlsx';

const workbook = xlsx.readFile('/Users/vikas/Downloads/chawla since 1960 (9).xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet);

console.log('First 5 rows:');
console.log(JSON.stringify(data.slice(0, 5), null, 2));
console.log('\nTotal rows:', data.length);
