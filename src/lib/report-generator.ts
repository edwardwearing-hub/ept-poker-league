import { PlayerStats } from "./data";

export function generateScoutingReport(player: PlayerStats): { headline: string; body: string } {
    const isProfitable = player.profit > 0;
    const isTop3 = player.rank <= 3;
    const isBottom3 = player.rank >= 10; // Assuming ~12 players
    const hasNemesis = player.rivalPlayer && player.rivalPlayer !== "None";
    const hasVictim = player.bulliedPlayer && player.bulliedPlayer !== "None";

    let headline = "";
    let body = "";

    // Headline Logic
    if (player.rank === 1) {
        headline = "The King of the Hill";
    } else if (isTop3) {
        headline = "Chasing the Crown";
    } else if (player.profit > 50) {
        headline = "Printing Money";
    } else if (player.knockOuts > 3) {
        headline = "The Terminator";
    } else if (isBottom3) {
        headline = "Looking for a Spark";
    } else {
        headline = "Mid-Table Grinder";
    }

    // Body Logic - Paragraph 1: Performance
    if (player.rank === 1) {
        body += `${player.name} is currently dominating the league, sitting comfortably at the top. `;
    } else if (isTop3) {
        body += `${player.name} is in striking distance of the lead, currently holding the #${player.rank} spot. `;
    } else if (isBottom3) {
        body += `It's been a tough run for ${player.name} so far, currently sitting at #${player.rank}. `;
    } else {
        body += `${player.name} finds themselves in the middle of the pack at #${player.rank}. `;
    }

    // Paragraph 2: Money & Aggression
    if (isProfitable) {
        body += `With a profit of £${player.profit}, they are playing smart poker. `;
        if (player.knockOuts > 2) body += `Aggression is key, racking up ${player.knockOuts} knockouts along the way. `;
    } else {
        body += `Currently down £${Math.abs(player.profit)}, there's work to be done to get back in the green. `;
        if (player.rebuys > 1) body += `Multiple rebuys (${player.rebuys}) suggest a loose playstyle that hasn't paid off yet. `;
    }

    // Paragraph 3: Rivalries
    if (hasNemesis) {
        body += `The tension with ${player.rivalPlayer} is palpable—this is the rival to watch. `;
    }
    if (hasVictim) {
        body += `On the flip side, ${player.name} seems to have ${player.bulliedPlayer}'s number, consistently winning big pots against them.`;
    }

    return { headline, body };
}
