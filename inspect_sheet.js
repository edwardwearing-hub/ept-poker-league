
const XLSX = require('xlsx');

try {
    const file = 'E.P.T. 2026.xlsx';
    const workbook = XLSX.readFile(file);

    console.log('Sheet Names:', workbook.SheetNames);

    workbook.SheetNames.forEach(name => {
        const sheet = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // header:1 gives array of arrays
        console.log(`\n--- Sheet: ${name} ---`);
        if (data.length > 0) {
            console.log('Row 0:', data[0]);
            console.log('Row 1:', data[1]);
            console.log('Row 2:', data[2]);
            console.log('Row 3:', data[3]);
            console.log('Row 4:', data[4]);
        } else {
            console.log('Empty sheet');
        }
    });
} catch (e) {
    console.error('Error reading file:', e);
}
