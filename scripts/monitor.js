const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const UPLOADS_DIR = path.join(__dirname, '../data/uploads');
const PROCESSED_DIR = path.join(__dirname, '../data/processed');

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(PROCESSED_DIR)) fs.mkdirSync(PROCESSED_DIR, { recursive: true });

console.log(`Starting EPT 2026 Monitor Skill on: ${UPLOADS_DIR}`);

// Data stores
let gazetteData = { latestGame: null, winner: null, biggestLoser: null };
let scoutingData = {};
let wantedPoster = { mostRivals: "Edward Wearing", rivalsCount: 10 };

// Setup chokidar watcher
const watcher = chokidar.watch(UPLOADS_DIR, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 1000,
    pollInterval: 100
  }
});

function processCSV(filePath) {
  console.log(`Processing new file: ${filePath}`);
  const results = [];
  
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      console.log(`Parsed ${results.length} rows from game file.`);
      generateReports(results);
      
      // Move processed file
      const fileName = path.basename(filePath);
      fs.rename(filePath, path.join(PROCESSED_DIR, fileName), (err) => {
        if (err) console.error('Error moving processed file:', err);
        else console.log(`Moved ${fileName} to processed directory.`);
      });
    });
}

function generateReports(gameData) {
  if (!gameData || gameData.length === 0) return;
  
  // Game data structure expectation: 
  // Player, Position, Winnings, Rebuys, AddOns, KOs, Date, PotTotal, SidePot
  
  let winner = null;
  let biggestLoser = null;
  let maxProfit = -999999;
  let minProfit = 999999;
  
  // Basic calculation per player for this game
  gameData.forEach(row => {
    const player = row.Player;
    if (!player) return;
    
    const winnings = parseFloat(row.Winnings) || 0;
    const rebuys = parseFloat(row.Rebuys) || 0;
    const addons = parseFloat(row.AddOns) || 0;
    const kos = parseInt(row.KOs) || 0;
    
    // Assuming 5 base buy-in, 5 per rebuy/addon
    const totalSpent = 5 + (rebuys * 5) + (addons * 5);
    const profit = winnings - totalSpent;

    if (profit > maxProfit) {
        maxProfit = profit;
        winner = { name: player, profit, winnings };
    }
    if (profit < minProfit) {
        minProfit = profit;
        biggestLoser = { name: player, profit, spent: totalSpent };
    }
    
    // Update scouting data
    if (!scoutingData[player]) {
        scoutingData[player] = {
            name: player,
            totalProfit: 0,
            totalKOs: 0,
            gamesPlayed: 0
        };
    }
    scoutingData[player].totalProfit += profit;
    scoutingData[player].totalKOs += kos;
    scoutingData[player].gamesPlayed += 1;
  });
  
  // Update Gazette
  gazetteData = {
    headline: `Epic Clash on ${gameData[0]?.Date || 'Game Night'}!`,
    date: gameData[0]?.Date || new Date().toISOString().split('T')[0],
    potTotal: gameData[0]?.PotTotal || 0,
    winner,
    biggestLoser
  };
  
  // Refresh Wanted Poster (mocking logic to keep Edward as most wanted or calculate dynamically later)
  wantedPoster = {
    mostRivals: "Edward Wearing", // Hardcoded based on prompt context but can be dynamic later
    rivalsCount: 11,
    bounty: 50 // Example
  };

  // Write out JSONs for the Next.js app to consume
  fs.writeFileSync(path.join(PROCESSED_DIR, 'gazette.json'), JSON.stringify(gazetteData, null, 2));
  fs.writeFileSync(path.join(PROCESSED_DIR, 'scouting.json'), JSON.stringify(scoutingData, null, 2));
  fs.writeFileSync(path.join(PROCESSED_DIR, 'wanted.json'), JSON.stringify(wantedPoster, null, 2));
  
  console.log('✅ Reports Generated Successfully!');
}

watcher.on('add', filePath => {
  if (filePath.endsWith('.csv')) {
    processCSV(filePath);
  }
});
