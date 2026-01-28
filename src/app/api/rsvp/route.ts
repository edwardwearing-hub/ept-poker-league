
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'registrations.json');

// Default player list if no file exists
const PLAYERS = [
    "Edward Wearing", "Liam Duxbury", "Luke Daly", "Georgina Wearing",
    "Daniel Horne", "Darren Daly", "Chris Daly", "Stephen Flood",
    "Phil Landsberger", "Nathen Benson", "Dave Taylor"
];

// Helper to read data
function getRegistrations() {
    if (!fs.existsSync(DATA_FILE)) {
        // Initialize with everyone as false (not confirmed)
        const initialData = PLAYERS.reduce((acc, player) => {
            acc[player] = false;
            return acc;
        }, {} as Record<string, boolean>);

        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
        return initialData;
    }

    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    try {
        return JSON.parse(fileContent);
    } catch (e) {
        return {};
    }
}

export async function GET() {
    const data = getRegistrations();
    return NextResponse.json(data);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { player, isPlaying } = body;

        if (!player) {
            return NextResponse.json({ error: 'Player name required' }, { status: 400 });
        }

        const currentData = getRegistrations();
        currentData[player] = isPlaying;

        fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2));

        return NextResponse.json(currentData);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
