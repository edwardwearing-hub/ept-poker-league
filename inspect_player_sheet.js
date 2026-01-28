
const XLSX = require('xlsx');

try {
    const file = 'E.P.T. 2026.xlsx';
    const workbook = XLSX.readFile(file);

    // Inspect 'Edward Wearing' sheet specifically (note the trailing space in previous inspection: "Edward Wearing ")
    // Let's check the exact name again from the previous output or just iterate.
    const targetSheetName = workbook.SheetNames.find(n => n.trim() === 'Edward Wearing');

    console.log(`Inspecting sheet: "${targetSheetName}"`);

    const sheet = workbook.Sheets[targetSheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // header:1 gives array of arrays

    // Print first 30 rows to find the stats
    for (let i = 0; i < 30; i++) {
        if (data[i]) {
            console.log(`Row ${i}:`, JSON.stringify(data[i]));
        }
    }
} catch (e) {
    console.error('Error reading file:', e);
}
