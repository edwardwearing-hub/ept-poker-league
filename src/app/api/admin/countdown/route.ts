import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const countdownFilePath = path.join(process.cwd(), 'data', 'countdown.json');

export async function GET() {
    try {
        if (fs.existsSync(countdownFilePath)) {
            const data = fs.readFileSync(countdownFilePath, 'utf8');
            return NextResponse.json(JSON.parse(data));
        }
        // Default target if no file exists: next Friday essentially
        const target = new Date();
        target.setDate(target.getDate() + 6);
        target.setHours(target.getHours() + 4);
        return NextResponse.json({ targetDate: target.toISOString() });
    } catch (err) {
        console.error("Countdown read error:", err);
        return NextResponse.json({ error: 'Failed to read countdown' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { targetDate } = await request.json();

        const dir = path.dirname(countdownFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(countdownFilePath, JSON.stringify({ targetDate }));
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Countdown save error:", err);
        return NextResponse.json({ error: 'Failed to save countdown' }, { status: 500 });
    }
}
