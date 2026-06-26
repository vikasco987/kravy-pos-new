const xlsx = require('xlsx');

const workbook = xlsx.readFile('/Users/vikas/Downloads/chawla since 1960 (9).xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet);

const tandoori = data.filter(d => d['Item Name'] && d['Item Name'].toLowerCase().includes('tandoori chicken'));
console.log('Tandoori Chicken in Excel:', tandoori);
