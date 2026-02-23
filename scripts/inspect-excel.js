const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../public/E.P.T. 2026.xlsx');
console.log('Reading:', filePath);

const workbook = xlsx.readFile(filePath);

console.log('--- SHEET NAMES ---');
console.log(workbook.SheetNames);

console.log('\n--- SHEET 1 (LEADERBOARD) - TOP 10 ROWS ---');
const sheet1 = workbook.Sheets['Sheet1'];
if (sheet1) {
    const data1 = xlsx.utils.sheet_to_json(sheet1, { header: 1 });
    console.log(data1.slice(0, 10));
}

console.log('\n--- EDWARD WEARING SHEET - TOP 25 ROWS ---');
const edwardSheet = workbook.Sheets['Edward Wearing '];
if (edwardSheet) {
    const dataEd = xlsx.utils.sheet_to_json(edwardSheet, { header: 1 });
    console.log(dataEd.slice(0, 26));
}
