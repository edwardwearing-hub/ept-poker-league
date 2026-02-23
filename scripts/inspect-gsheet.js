const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) process.env[key.trim()] = val.join('=').trim();
});

async function inspect() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, '..', 'google-credentials.json'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        console.log(`Inspecting Spreadsheet ID: ${spreadsheetId}`);

        const response = await sheets.spreadsheets.get({
            spreadsheetId
        });

        const sheetNames = response.data.sheets.map(s => s.properties.title);
        console.log("Sheet Names:", sheetNames);

        // Fetch the first few rows of Sheet1 (which usually contains the main leaderboard)
        const targetSheet = sheetNames.find(n => n.includes('Sheet1')) || sheetNames[0];

        const dataResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${targetSheet}!A1:Z30`,
        });

        console.log(`\n--- First 15 Rows of ${targetSheet} ---`);
        const rows = dataResponse.data.values || [];
        for (let i = 0; i < Math.min(15, rows.length); i++) {
            console.log(`Row ${i + 1}:`, rows[i]);
        }

    } catch (e) {
        console.error("Error inspecting spreadsheet:", e);
    }
}

inspect();
