import { PlayerStats } from "./data";

export function generateScoutingReport(player: PlayerStats): { headline: string; body: string } {
    const isProfitable = player.profit > 0;
    const isTop3 = player.rank <= 3;
    const isBottom3 = player.rank >= 10;
    const hasNemesis = player.rivalPlayer && player.rivalPlayer !== "None";
    const hasVictim = player.bulliedPlayer && player.bulliedPlayer !== "None";
    const avgRebuys = player.gamesPlayed > 0 ? ((player.rebuys || 0) / player.gamesPlayed).toFixed(2) : "0.00";
    const bubbles = player.bubbleFinishes || 0;

    let headline = "";
    let body = "";

    // Headline Logic
    if (player.rank === 1) {
        headline = "The King of the Hill";
    } else if (isTop3) {
        headline = "Chasing the Crown";
    } else if (player.profit > 50) {
        headline = "Printing Money";
    } else if (player.knockOuts > 5) {
        headline = "The Terminator";
    } else if (isBottom3) {
        headline = "Looking for a Spark";
    } else {
        headline = "Mid-Table Grinder";
    }

    // Body Logic - Paragraph 1: Performance & Bubble Finishes
    if (player.rank === 1) {
        body += `${player.name} is currently dominating the league, sitting at #1 with ${player.points} points across ${player.gamesPlayed} appearances (${player.wins || 0} wins). `;
    } else if (isTop3) {
        body += `${player.name} is in striking distance of the lead, holding the #${player.rank} spot with ${player.points} points across ${player.gamesPlayed} games (${player.wins || 0} wins). `;
    } else if (isBottom3) {
        body += `It's been a tough run for ${player.name} so far, sitting at #${player.rank} with ${player.points} points over ${player.gamesPlayed} appearances. `;
    } else {
        body += `${player.name} holds #${player.rank} on the leaderboard with ${player.points} points across ${player.gamesPlayed} games (${player.wins || 0} wins). `;
    }

    if (bubbles > 0) {
        body += `They have finished on the money bubble ${bubbles} ${bubbles === 1 ? "time" : "times"} (1 spot outside the payout cutoff). `;
    }

    // Paragraph 2: Money (@ £10 each), Re-Buys & Aggression
    if (player.gamesPlayed > 0) {
        body += `At £10 per buy-in, re-buy, and add-on, they have paid £${player.cashPaid || 0} into the pot (${player.rebuys || 0} total re-buys, max ${player.mostRebuysSingle || 0} in a single game, averaging ${avgRebuys} re-buys/game) and cashed £${player.winnings || 0}. `;
    }

    if (isProfitable) {
        body += `With a net profit of +£${player.profit}, they are playing sharp, profitable poker. `;
        if (player.knockOuts > 2) body += `Aggression has paid off with ${player.knockOuts} total knockouts (been knocked out ${player.totalTimesKnockedOut || 0} times). `;
    } else if (player.profit < 0) {
        body += `Currently at -£${Math.abs(player.profit)} net, with ${player.knockOuts} knockouts delivered and ${player.totalTimesKnockedOut || 0} eliminations suffered. `;
    }

    // Paragraph 3: Rivalries
    if (hasNemesis) {
        body += `Their sheet rival (most knocked out by) is ${player.rivalPlayer}. `;
    }
    if (hasVictim) {
        body += `Their favorite target (most knocked out in Column M) is ${player.bulliedPlayer}.`;
    }

    return { headline, body };
}
