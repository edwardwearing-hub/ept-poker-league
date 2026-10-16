import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/data';
import { getPlayerSession } from '@/lib/playerAuth';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { verifyCsrf } from '@/lib/security';

export async function POST(request: Request) {
    // 1. CSRF Protection
    const csrf = verifyCsrf(request);
    if (!csrf.valid) {
        return NextResponse.json({ error: csrf.reason || 'Forbidden' }, { status: 403 });
    }

    // 2. Authentication Check
    const session = getPlayerSession(request);
    const isAdmin = verifyAdminAuth(request);

    if (!session && !isAdmin) {
        return NextResponse.json({
            error: 'Unauthorized: You must be logged in with your PIN to redeem your profile.'
        }, { status: 401 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();

        // 3. Authorization Guard: Player can only redeem their OWN profile
        if (body?.playerName && !isAdmin && session && body.playerName.toLowerCase().trim() !== session.name.toLowerCase().trim()) {
            return NextResponse.json({
                error: 'Unauthorized: You cannot redeem another player’s profile.'
            }, { status: 403 });
        }

        const effectivePlayer = isAdmin && body?.playerName ? String(body.playerName).trim() : session?.name;

        if (!effectivePlayer || !spreadsheetId) {
            return NextResponse.json({ error: 'Missing player identity or Sheet ID' }, { status: 400 });
        }

        const sheets = await getSheetsClient();

        // 4. Fetch current PVP_SYSTEM data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'PVP_SYSTEM!B1:F30',
        });
        const rows = response.data.values || [];

        let playerRow = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0]?.toString().trim().toLowerCase() === effectivePlayer.toLowerCase()) {
                playerRow = i + 1;
                break;
            }
        }

        if (playerRow === -1) {
            return NextResponse.json({ error: 'Player not found in PVP_SYSTEM' }, { status: 404 });
        }

        const playerData = rows[playerRow - 1];
        const isHijacked = playerData[3]?.toString().toUpperCase() === 'TRUE';

        // 5. Redemption Guard: Must actually be hijacked to redeem and receive bonus token
        if (!isHijacked && !isAdmin) {
            return NextResponse.json({
                error: 'Profile is not currently hijacked. No redemption needed.'
            }, { status: 400 });
        }

        const currentTokens = parseInt(playerData[2]) || 0; // Col D

        // 6. Perform updates: Clear hijacked status, clear queue, grant +1 token
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `PVP_SYSTEM!D${playerRow}:F${playerRow}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[
                    currentTokens + 1, // Hack_Tokens + 1
                    'FALSE',           // Profile_Hijacked = FALSE
                    '[]'               // Hijacker_Queue = empty
                ]]
            }
        });

        return NextResponse.json({
            success: true,
            player: effectivePlayer,
            tokens: currentTokens + 1,
            message: 'Profile successfully recovered and hack token granted!'
        });

    } catch (error) {
        console.error('Error redeeming profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
