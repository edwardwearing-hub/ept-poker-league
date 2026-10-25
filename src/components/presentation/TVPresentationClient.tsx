'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Play,
    Pause,
    RotateCcw,
    ChevronRight,
    ChevronLeft,
    Maximize,
    Volume2,
    VolumeX,
    Trophy,
    Crown,
    Flame,
    Skull,
    ArrowLeft,
    Sparkles,
    Target,
    Coins,
    Users,
    Music,
    Award,
    TrendingUp,
    Swords,
    Newspaper,
    Calendar,
    BarChart3,
    Clock,
    LayoutGrid,
    Columns,
    Activity,
    Radio
} from 'lucide-react';
import Link from 'next/link';
import {
    WalkUpTheme,
    playWalkUpAudio,
    savePlayerWalkUpTheme,
    getPlayerWalkUpTheme,
    DEFAULT_PLAYER_THEMES
} from '@/lib/walkup-audio';
import { getAvatarFilename } from '@/lib/avatars';
import WantedVideo from '@/components/WantedVideo';
import type { PlayerStats, GameHistorySession, GazetteReport } from '@/lib/data';
import { FALLBACK_PLAYERS, FALLBACK_GAME_HISTORY, FALLBACK_TOTAL_POT } from '@/lib/sheetFallbackData';

interface Props {
    players: PlayerStats[];
    totalPot: number;
    history?: GameHistorySession[];
    reports?: GazetteReport[];
}

const BLIND_LEVELS = [
    { level: 1, sb: 25, bb: 50, ante: 0, duration: 900 },
    { level: 2, sb: 50, bb: 100, ante: 0, duration: 900 },
    { level: 3, sb: 75, bb: 150, ante: 25, duration: 900 },
    { level: 4, sb: 100, bb: 200, ante: 50, duration: 900 },
    { level: 5, sb: 150, bb: 300, ante: 75, duration: 900 },
    { level: 6, sb: 200, bb: 400, ante: 100, duration: 900 },
    { level: 7, sb: 300, bb: 600, ante: 150, duration: 900 },
    { level: 8, sb: 500, bb: 1000, ante: 250, duration: 900 },
    { level: 9, sb: 750, bb: 1500, ante: 500, duration: 900 },
    { level: 10, sb: 1000, bb: 2000, ante: 1000, duration: 900 },
];

const LOOP_INTERVAL_OPTIONS = [
    { label: '30s', seconds: 30 },
    { label: '45s', seconds: 45 },
    { label: '90s', seconds: 90 },
    { label: '3m', seconds: 180 },
    { label: '5m', seconds: 300 },
];

function formatOrdinal(n: number | null | undefined): string {
    if (n === null || n === undefined || isNaN(n) || n <= 0) return 'N/A';
    const rounded = Math.round(n);
    const s = ['th', 'st', 'nd', 'rd'];
    const v = rounded % 100;
    return rounded + (s[(v - 20) % 10] || s[v] || s[0]);
}

interface PlayerSessionEntry {
    gameNumber: number;
    date: string;
    played: boolean;
    placeNum: number | null;
    placeLabel: string;
    winnings: number;
    points: number;
    kos: number;
    netProfit?: number;
}

interface StatCardItem {
    id: string;
    label: string;
    value: string;
    subtext: string;
    category: 'standings' | 'financial' | 'combat' | 'placement' | 'resilience' | 'rivalry';
    highlightColor: string;
    isLeagueRecord?: boolean;
    recordLabel?: string;
}

interface RadarAttribute {
    axis: string;
    shortLabel: string;
    value: number; // 0 to 100
    avg: number;   // 0 to 100
}

interface ComputedPlayerProfile {
    player: PlayerStats;
    archetypeBadge: string;
    archetypeColor: string;
    fearLevel: string;
    attendanceRate: string;
    attendancePct: number;
    headline: string;
    quote: string;
    reportParagraphs: { title: string; text: string }[];
    highestWinAmount: number;
    highestWinLabel: string;
    mostKOsInGame: number;
    mostKOsLabel: string;
    bestPosition: number | null;
    worstPosition: number | null;
    worstPositionLabel: string;
    avgFinish: number;
    podiumCount: number;
    podiumRate: number;
    winRate: number;
    bubbleCount: number;
    maxRebuysSingle: number;
    timesEliminated: number;
    survivalRate: number;
    cashPaid: number;
    roiPct: number;
    nemesisName: string;
    pigeonName: string;
    sessionLog: PlayerSessionEntry[];
    cumulativeProfitPoints: { label: string; value: number }[];
    radarAttributes: RadarAttribute[];
    gazetteMentions: { episode: string; date: string; title: string; snippet: string; isWinner: boolean }[];
    statsGrid: StatCardItem[];
}

type BroadcastSlide =
    | {
          type: 'player';
          profile: ComputedPlayerProfile;
          page: 1 | 2 | 3;
          id: string;
          label: string;
          badge: string;
      }
    | {
          type: 'league_stats';
          page: 1 | 2 | 3;
          id: string;
          label: string;
          badge: string;
      }
    | { type: 'tale_of_the_tape'; id: string; label: string; badge: string }
    | { type: 'season_awards'; id: string; label: string; badge: string }
    | { type: 'stacks_and_payouts'; id: string; label: string; badge: string };

const PLAYER_SEARCH_TERMS: Record<string, string[]> = {
    'edward wearing': ['edward wearing', 'edward', 'eddy', 'eddie'],
    'georgina wearing': ['georgina wearing', 'georgina'],
    'luke daly': ['luke daly', 'luke'],
    'darren daly': ['darren daly', 'darren'],
    'chris daly': ['chris daly', 'chris'],
    'daniel horne': ['daniel horne', 'daniel', 'dan horne', 'horne'],
    'stephen flood': ['stephen flood', 'stephen', 'flood'],
    'dave blackburn': ['dave blackburn', 'david blackburn', 'blackburn'],
    'dave taylor': ['dave taylor', 'david taylor', 'taylor'],
    'liam duxbury': ['liam duxbury', 'liam', 'duxbury'],
    'nathen benson': ['nathen benson', 'nathan benson', 'nathen', 'nathan', 'benson'],
};

function getSearchTerms(name: string): string[] {
    const key = name.toLowerCase().trim();
    if (PLAYER_SEARCH_TERMS[key]) return PLAYER_SEARCH_TERMS[key];
    const parts = key.split(/\s+/).filter(Boolean);
    return parts.length > 0 && parts[0].length >= 3 ? [key, parts[0]] : [key];
}

// ============================================================================
// OPTION 3 HELPER COMPONENTS: 6-AXIS POKER DNA RADAR & PROFIT SPARKLINE
// ============================================================================
function PokerDnaRadarChart({ attributes }: { attributes: RadarAttribute[] }) {
    const cx = 115;
    const cy = 110;
    const radius = 68;
    const levels = [0.25, 0.5, 0.75, 1.0];

    const getPoint = (idx: number, fraction: number) => {
        const angleDeg = -90 + idx * 60;
        const rad = (angleDeg * Math.PI) / 180;
        return {
            x: cx + radius * fraction * Math.cos(rad),
            y: cy + radius * fraction * Math.sin(rad),
        };
    };

    const playerPolygonPoints = attributes
        .map((attr, i) => {
            const pt = getPoint(i, Math.max(0.08, Math.min(1, attr.value / 100)));
            return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
        })
        .join(' ');

    const avgPolygonPoints = attributes
        .map((attr, i) => {
            const pt = getPoint(i, Math.max(0.1, Math.min(1, attr.avg / 100)));
            return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
        })
        .join(' ');

    return (
        <div className="flex items-center justify-between gap-3 w-full h-full min-h-0">
            <svg viewBox="0 0 230 220" className="h-full max-h-[155px] w-auto shrink-0 overflow-visible">
                <defs>
                    <radialGradient id="dnaGoldGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffd700" stopOpacity="0.55" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.18" />
                    </radialGradient>
                </defs>

                {/* Concentric Hexagon Grid Rings */}
                {levels.map((lvl, lIdx) => {
                    const ringPts = attributes
                        .map((_, i) => {
                            const pt = getPoint(i, lvl);
                            return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
                        })
                        .join(' ');
                    return (
                        <polygon
                            key={lIdx}
                            points={ringPts}
                            fill="none"
                            stroke="rgba(255,255,255,0.14)"
                            strokeWidth="1"
                            strokeDasharray={lvl === 1 ? undefined : '2 2'}
                        />
                    );
                })}

                {/* Axis Spokes */}
                {attributes.map((_, i) => {
                    const end = getPoint(i, 1);
                    return (
                        <line
                            key={i}
                            x1={cx}
                            y1={cy}
                            x2={end.x}
                            y2={end.y}
                            stroke="rgba(255,255,255,0.14)"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* League Average Baseline Polygon */}
                <polygon
                    points={avgPolygonPoints}
                    fill="rgba(56,189,248,0.1)"
                    stroke="rgba(56,189,248,0.6)"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                />

                {/* Player DNA Polygon */}
                <polygon
                    points={playerPolygonPoints}
                    fill="url(#dnaGoldGrad)"
                    stroke="#ffd700"
                    strokeWidth="2.5"
                />

                {/* Vertex Dots & Axis Labels */}
                {attributes.map((attr, i) => {
                    const valPt = getPoint(i, Math.max(0.08, Math.min(1, attr.value / 100)));
                    const labelPt = getPoint(i, 1.27);
                    return (
                        <g key={attr.axis}>
                            <circle
                                cx={valPt.x}
                                cy={valPt.y}
                                r="3.5"
                                fill="#ffd700"
                                stroke="#000"
                                strokeWidth="1"
                            />
                            <text
                                x={labelPt.x}
                                y={labelPt.y - 3}
                                textAnchor="middle"
                                className="fill-zinc-300 font-mono font-bold text-[8.5px] uppercase"
                            >
                                {attr.shortLabel}
                            </text>
                            <text
                                x={labelPt.x}
                                y={labelPt.y + 8}
                                textAnchor="middle"
                                className="fill-gold font-mono font-black text-[9.5px]"
                            >
                                {attr.value}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Right-side 6-Axis Attribute Bars */}
            <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5 min-w-0">
                {attributes.map(attr => (
                    <div key={attr.axis} className="bg-black/50 px-2.5 py-1.5 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                            <span className="text-zinc-300 font-bold truncate">{attr.axis}</span>
                            <span className="text-gold font-black">{attr.value}<span className="text-zinc-500 text-[8px]">/{attr.avg} avg</span></span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-gold"
                                style={{ width: `${Math.max(8, Math.min(100, attr.value))}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProfitSparklineChart({ points }: { points: { label: string; value: number }[] }) {
    const width = 560;
    const height = 108;
    const padX = 34;
    const padY = 20;

    const vals = points.map(p => p.value);
    const minVal = Math.min(0, ...vals, -20);
    const maxVal = Math.max(0, ...vals, 20);
    const range = Math.max(1, maxVal - minVal);

    const getCoords = (idx: number, val: number) => {
        const x =
            points.length <= 1
                ? width / 2
                : padX + (idx / (points.length - 1)) * (width - padX * 2);
        const y = height - padY - ((val - minVal) / range) * (height - padY * 2);
        return { x, y };
    };

    const zeroY = height - padY - ((0 - minVal) / range) * (height - padY * 2);
    const polylineStr = points
        .map((pt, i) => {
            const c = getCoords(i, pt.value);
            return `${c.x.toFixed(1)},${c.y.toFixed(1)}`;
        })
        .join(' ');

    const finalValue = points.length > 0 ? points[points.length - 1].value : 0;
    const isPositive = finalValue >= 0;
    const strokeColor = isPositive ? '#4ade80' : '#f87171';

    return (
        <div className="w-full h-full flex items-center">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-h-[110px] overflow-visible">
                {/* Zero Break-Even Line */}
                <line
                    x1={padX}
                    y1={zeroY}
                    x2={width - padX}
                    y2={zeroY}
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                />
                <text
                    x={padX - 6}
                    y={zeroY + 3}
                    textAnchor="end"
                    className="fill-zinc-400 font-mono text-[9px] font-bold"
                >
                    £0
                </text>

                {/* Trajectory Line */}
                {points.length > 1 && (
                    <polyline
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={polylineStr}
                    />
                )}

                {/* Data Nodes */}
                {points.map((pt, i) => {
                    const c = getCoords(i, pt.value);
                    const nodePositive = pt.value >= 0;
                    return (
                        <g key={i}>
                            <circle
                                cx={c.x}
                                cy={c.y}
                                r="4"
                                fill={nodePositive ? '#4ade80' : '#f87171'}
                                stroke="#09090b"
                                strokeWidth="1.5"
                            />
                            <text
                                x={c.x}
                                y={c.y - 7}
                                textAnchor="middle"
                                className={`font-mono font-black text-[9px] ${
                                    nodePositive ? 'fill-emerald-400' : 'fill-rose-400'
                                }`}
                            >
                                {pt.value >= 0 ? `+£${pt.value}` : `-£${Math.abs(pt.value)}`}
                            </text>
                            <text
                                x={c.x}
                                y={height - 3}
                                textAnchor="middle"
                                className="fill-zinc-400 font-mono text-[8.5px]"
                            >
                                {pt.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

export default function TVPresentationClient({
    players: playersProp,
    totalPot: totalPotProp,
    history: historyProp = [],
    reports = []
}: Props) {
    const players = playersProp && playersProp.length > 0 ? playersProp : FALLBACK_PLAYERS;
    const history = historyProp && historyProp.length > 0 ? historyProp : FALLBACK_GAME_HISTORY;
    const totalPot = totalPotProp && totalPotProp > 0 ? totalPotProp : FALLBACK_TOTAL_POT;

    // Broadcast View Mode: 'showcase' (Auto-Loop Full Broadcast), 'split' (Timer + Loop), 'clock' (Timer + Roster)
    const [viewMode, setViewMode] = useState<'showcase' | 'split' | 'clock'>('showcase');

    // Auto-Loop Presentation State
    const [activeSlideIdx, setActiveSlideIdx] = useState(0);
    const [isLooping, setIsLooping] = useState(true);
    const [loopDurationSec, setLoopDurationSec] = useState(30);
    const [loopProgress, setLoopProgress] = useState(0);
    const [onlyActiveFinalists, setOnlyActiveFinalists] = useState(false);
    const [includeSpecialSlides, setIncludeSpecialSlides] = useState(true);
    const [playFanfareOnSlide, setPlayFanfareOnSlide] = useState(false);

    // Tale of the Tape Rivalry Pair Selection
    const [rivalryIdxA, setRivalryIdxA] = useState(0);
    const [rivalryIdxB, setRivalryIdxB] = useState(1);

    // Blind Timer State
    const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(BLIND_LEVELS[0].duration);
    const [isClockRunning, setIsClockRunning] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [eliminatedPlayers, setEliminatedPlayers] = useState<Record<string, boolean>>({});
    const [playerThemes, setPlayerThemes] = useState<Record<string, WalkUpTheme>>(DEFAULT_PLAYER_THEMES);

    useEffect(() => {
        const loaded: Record<string, WalkUpTheme> = { ...DEFAULT_PLAYER_THEMES };
        players.forEach(p => {
            loaded[p.name] = getPlayerWalkUpTheme(p.name);
        });
        setPlayerThemes(loaded);
    }, [players]);

    const totalSeasonGames = useMemo(() => {
        const maxFromPlayers = Math.max(...players.map(p => p.gamesPlayed || 0), 0);
        return Math.max(history.length, maxFromPlayers, 1);
    }, [players, history]);

    // Compute comprehensive 16-stat profiles, 6-axis DNA radar, sparklines, and full league reports
    const computedProfiles: ComputedPlayerProfile[] = useMemo(() => {
        if (!players || players.length === 0) return [];

        const leaderPoints = Math.max(...players.map(p => p.points || 0), 0);

        const rawMetrics = players.map(p => {
            const pNameLower = p.name.toLowerCase().trim();
            const sessionLog: PlayerSessionEntry[] = [];

            let highestWinAmount = 0;
            let highestWinLabel = 'No Single-Game Cash Yet';
            let mostKOsInGame = 0;
            let mostKOsLabel = '0 KOs Recorded';
            const validPlaces: { place: number; gameNum: number; date: string }[] = [];

            history.forEach((session, idx) => {
                const gNum = idx + 1;
                const match = (session.results || []).find(
                    r => r.name.toLowerCase().trim() === pNameLower
                );
                const cfMatch = (p.cashFlowHistory || [])[idx];

                if (match) {
                    const placeNum = parseInt(match.place, 10);
                    const validPlace = !isNaN(placeNum) && placeNum > 0 ? placeNum : null;
                    const winAmt = match.winnings || 0;
                    const kosAmt = match.kos || 0;

                    if (winAmt > highestWinAmount) {
                        highestWinAmount = winAmt;
                        highestWinLabel = `Game ${gNum} (${session.date})`;
                    }
                    if (kosAmt > mostKOsInGame) {
                        mostKOsInGame = kosAmt;
                        mostKOsLabel = `Game ${gNum} (${session.date})`;
                    }
                    if (validPlace !== null) {
                        validPlaces.push({ place: validPlace, gameNum: gNum, date: session.date });
                    }

                    sessionLog.push({
                        gameNumber: gNum,
                        date: session.date,
                        played: true,
                        placeNum: validPlace,
                        placeLabel: validPlace ? formatOrdinal(validPlace) : (match.place || 'Played'),
                        winnings: winAmt,
                        points: match.points || 0,
                        kos: kosAmt,
                        netProfit: cfMatch?.profit
                    });
                } else {
                    sessionLog.push({
                        gameNumber: gNum,
                        date: session.date,
                        played: false,
                        placeNum: null,
                        placeLabel: 'DNP',
                        winnings: 0,
                        points: 0,
                        kos: 0
                    });
                }
            });

            let bestPosition: number | null = null;
            let worstPosition: number | null = null;
            let worstPositionLabel = p.gamesPlayed === 0 ? 'Did Not Play Any Games' : 'No Placement Logged';

            if (validPlaces.length > 0) {
                const sortedAsc = [...validPlaces].sort((a, b) => a.place - b.place);
                bestPosition = sortedAsc[0].place;
                const sortedDesc = [...validPlaces].sort((a, b) => b.place - a.place);
                worstPosition = sortedDesc[0].place;
                worstPositionLabel = `Game ${sortedDesc[0].gameNum} (${sortedDesc[0].date})`;
            }

            const avgFinish =
                p.avgFinishPosition && p.avgFinishPosition > 0
                    ? p.avgFinishPosition
                    : validPlaces.length > 0
                    ? Number((validPlaces.reduce((acc, v) => acc + v.place, 0) / validPlaces.length).toFixed(1))
                    : 0;

            const podiumCount = validPlaces.filter(v => v.place <= 3).length;
            const podiumRate = p.gamesPlayed > 0 ? Math.round((podiumCount / p.gamesPlayed) * 100) : 0;

            const winRate =
                p.winPercentage !== undefined && p.winPercentage > 0
                    ? Math.round(p.winPercentage)
                    : p.gamesPlayed > 0
                    ? Math.round(((p.wins || 0) / p.gamesPlayed) * 100)
                    : 0;

            // Dynamic Bubble Finishes: compare how many times this player finished 1 position after the last paid position in that game
            // (e.g. finished 4th when money was paid down to 3rd, or finished 3rd when money was paid down to 2nd)
            let bubbleFromHistory = 0;
            history.forEach(session => {
                const results = session.results || [];
                const paidPlaces = results
                    .filter(r => (r.winnings || 0) > 0)
                    .map(r => parseInt(r.place, 10))
                    .filter(n => !isNaN(n) && n > 0);
                if (paidPlaces.length > 0) {
                    const lastPaidPlace = Math.max(...paidPlaces);
                    const bubblePlace = lastPaidPlace + 1;
                    const pMatch = results.find(
                        r => r.name.toLowerCase().trim() === pNameLower
                    );
                    if (
                        pMatch &&
                        parseInt(pMatch.place, 10) === bubblePlace &&
                        (pMatch.winnings || 0) === 0
                    ) {
                        bubbleFromHistory += 1;
                    }
                }
            });
            const bubbleCount =
                bubbleFromHistory > 0
                    ? bubbleFromHistory
                    : p.bubbleFinishes !== undefined && p.bubbleFinishes > 0
                    ? p.bubbleFinishes
                    : 0;

            const maxRebuysSingle = p.mostRebuysSingle !== undefined ? p.mostRebuysSingle : 0;
            const avgRebuysPerGame =
                p.gamesPlayed > 0
                    ? Number(((p.rebuys || 0) / p.gamesPlayed).toFixed(2))
                    : 0;
            const timesEliminated = p.totalTimesKnockedOut !== undefined ? p.totalTimesKnockedOut : 0;

            const survivalRate =
                p.gamesPlayed > 0
                    ? Math.max(0, Math.min(100, Math.round(((p.gamesPlayed - Math.min(p.gamesPlayed, timesEliminated)) / p.gamesPlayed) * 100)))
                    : 0;

            const cashPaid = p.cashPaid || 0;
            const roiPct = cashPaid > 0 ? Math.round((p.profit / cashPaid) * 100) : 0;

            // Build cumulative profit sparkline points strictly from Google Sheet cashFlowHistory
            const cumulativeProfitPoints: { label: string; value: number }[] = [{ label: 'Start', value: 0 }];
            if (p.cashFlowHistory && p.cashFlowHistory.length > 0) {
                let running = 0;
                p.cashFlowHistory.forEach((cf, idx) => {
                    running += cf.profit;
                    cumulativeProfitPoints.push({
                        label: cf.date || `G${idx + 1}`,
                        value: running
                    });
                });
            } else {
                cumulativeProfitPoints.push({ label: 'Total', value: p.profit || 0 });
            }

            return {
                p,
                sessionLog,
                cumulativeProfitPoints,
                highestWinAmount,
                highestWinLabel,
                mostKOsInGame,
                mostKOsLabel,
                bestPosition,
                worstPosition,
                worstPositionLabel,
                avgFinish,
                podiumCount,
                podiumRate,
                winRate,
                bubbleCount,
                maxRebuysSingle,
                avgRebuysPerGame,
                timesEliminated,
                survivalRate,
                cashPaid,
                roiPct
            };
        });

        const maxLeaguePoints = Math.max(...rawMetrics.map(m => m.p.points || 0), 1);
        const maxLeagueProfit = Math.max(...rawMetrics.map(m => m.p.profit || 0), 1);
        const minLeagueProfit = Math.min(...rawMetrics.map(m => m.p.profit || 0), 0);
        const profitSpan = Math.max(1, maxLeagueProfit - minLeagueProfit);
        const maxLeagueSingleWin = Math.max(...rawMetrics.map(m => m.highestWinAmount), 1);
        const maxLeagueGrossWinnings = Math.max(...rawMetrics.map(m => m.p.winnings || 0), 1);
        const maxLeagueSingleKOs = Math.max(...rawMetrics.map(m => m.mostKOsInGame), 1);
        const maxLeagueTotalKOs = Math.max(...rawMetrics.map(m => m.p.knockOuts || 0), 1);
        const maxLeagueWins = Math.max(...rawMetrics.map(m => m.p.wins || 0), 1);
        const maxLeagueRebuys = Math.max(...rawMetrics.map(m => m.p.rebuys || 0), 1);
        const maxLeagueBonusChips = Math.max(...rawMetrics.map(m => m.p.bonusChips || 0), 1);
        const worstLeaguePos = Math.max(...rawMetrics.map(m => m.worstPosition || 0), 1);

        // Compute true mathematical league averages across all players for the 6-Axis Radar baseline
        const rawRadarScores = rawMetrics.map(m => {
            const { p } = m;
            const attendancePct = Math.min(100, Math.round((p.gamesPlayed / totalSeasonGames) * 100));
            const ptsScore = Math.round(((p.points || 0) / maxLeaguePoints) * 100);
            const koScore = Math.round(((p.knockOuts || 0) / maxLeagueTotalKOs) * 100);
            const netProfitScore = p.gamesPlayed === 0 ? 0 : Math.round((((p.profit || 0) - minLeagueProfit) / profitSpan) * 100);
            const podiumScore = m.podiumRate;
            const finishScore =
                m.avgFinish > 0
                    ? Math.max(0, Math.min(100, Math.round(((11 - m.avgFinish) / 10) * 100)))
                    : 0;
            const attScore = attendancePct;
            return { ptsScore, koScore, netProfitScore, podiumScore, finishScore, attScore };
        });

        const activeCount = Math.max(1, rawRadarScores.length);
        const avgPtsAxis = Math.round(rawRadarScores.reduce((s, r) => s + r.ptsScore, 0) / activeCount);
        const avgKoAxis = Math.round(rawRadarScores.reduce((s, r) => s + r.koScore, 0) / activeCount);
        const avgProfitAxis = Math.round(rawRadarScores.reduce((s, r) => s + r.netProfitScore, 0) / activeCount);
        const avgPodiumAxis = Math.round(rawRadarScores.reduce((s, r) => s + r.podiumScore, 0) / activeCount);
        const avgFinishAxis = Math.round(rawRadarScores.reduce((s, r) => s + r.finishScore, 0) / activeCount);
        const avgAttAxis = Math.round(rawRadarScores.reduce((s, r) => s + r.attScore, 0) / activeCount);

        return rawMetrics.map((m, idx) => {
            const { p } = m;
            const attendancePct = Math.min(100, Math.round((p.gamesPlayed / totalSeasonGames) * 100));
            const avgPts = p.gamesPlayed > 0 ? (p.avgPoints || p.points / p.gamesPlayed).toFixed(1) : '0.0';
            const avgWin = p.gamesPlayed > 0 ? (p.avgWinnings || p.winnings / p.gamesPlayed).toFixed(0) : '0';
            const koRatio = p.gamesPlayed > 0 ? (p.koToGameRatio || p.knockOuts / p.gamesPlayed).toFixed(2) : '0.00';

            let archetypeBadge = `SEED #${p.rank} • LEAGUE STANDINGS`;
            let archetypeColor = 'border-gold/60 bg-gold/15 text-gold';
            let fearLevel = `${p.gamesPlayed} Games Played`;

            if (p.gamesPlayed === 0) {
                archetypeBadge = '0 GAMES PLAYED';
                archetypeColor = 'border-red-500/60 bg-red-950/50 text-red-300';
                fearLevel = '0% Attendance';
            } else if (p.rank === 1) {
                archetypeBadge = '🏆 #1 CHAMPIONSHIP LEADER';
                archetypeColor = 'border-gold bg-gold/20 text-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]';
                fearLevel = '#1 Seed';
            } else if (p.rank <= 3) {
                archetypeBadge = `🏅 TOP-3 PODIUM SEED (#${p.rank})`;
                archetypeColor = 'border-emerald-400/70 bg-emerald-950/50 text-emerald-300';
                fearLevel = `Seed #${p.rank}`;
            } else {
                archetypeBadge = `♠️ RANK #${p.rank} CONTENDER`;
                archetypeColor = 'border-white/25 bg-zinc-900/80 text-zinc-200';
                fearLevel = `Seed #${p.rank}`;
            }

            const quote =
                p.gamesPlayed > 0
                    ? `Rank #${p.rank} • ${p.points} Pts (${avgPts} Pts/Gm) • ${p.wins || 0} Wins • ${m.podiumCount} Podiums`
                    : `Rank #${p.rank} • 0 Games Logged in 2026 Season`;

            const nemesisName =
                p.rivalPlayer && p.rivalPlayer !== 'None' && p.rivalPlayer !== 'N/A'
                    ? p.rivalPlayer
                    : 'None Recorded';

            const pigeonName =
                p.bulliedPlayer && p.bulliedPlayer !== 'None' && p.bulliedPlayer !== 'N/A'
                    ? p.bulliedPlayer
                    : 'None Recorded';

            const rs = rawRadarScores[idx];
            const radarAttributes: RadarAttribute[] = [
                { axis: 'Points Rate', shortLabel: 'PTS', value: rs.ptsScore, avg: avgPtsAxis },
                { axis: 'Knockouts', shortLabel: 'KOs', value: rs.koScore, avg: avgKoAxis },
                { axis: 'Net Profit', shortLabel: '£ NET', value: rs.netProfitScore, avg: avgProfitAxis },
                { axis: 'Podium %', shortLabel: 'POD%', value: rs.podiumScore, avg: avgPodiumAxis },
                { axis: 'Avg Finish', shortLabel: 'FIN', value: rs.finishScore, avg: avgFinishAxis },
                { axis: 'Attendance', shortLabel: 'ATT', value: rs.attScore, avg: avgAttAxis },
            ];

            const reportParagraphs = [
                {
                    title: 'I. Official Standings & Points Breakdown',
                    text:
                        p.gamesPlayed > 0
                            ? `${p.name} holds Rank #${p.rank} on the official E.P.T. leaderboard with ${p.points} total points across ${p.gamesPlayed} of ${totalSeasonGames} season games (${attendancePct}% attendance, averaging ${avgPts} points per game). They sit ${
                                  leaderPoints - p.points === 0
                                      ? 'at #1 overall at the top of the table'
                                      : `${leaderPoints - p.points} points behind the #1 leaderboard spot`
                              } and have accumulated +${(p.bonusChips || 0).toLocaleString()} Grand Final bonus chips.`
                            : `${p.name} has recorded 0 appearances out of ${totalSeasonGames} games this season (0 points, +0 bonus chips).`
                },
                {
                    title: 'II. Official Financial Ledger & Highest Payout',
                    text:
                        p.gamesPlayed > 0
                            ? `Over ${p.gamesPlayed} appearances, ${p.name} has paid £${m.cashPaid} into the prize pool (${p.rebuys || 0} rebuys, ${m.avgRebuysPerGame.toFixed(2)} avg rebuys/game, ${p.addOns || 0} add-ons @ £10 each) and won £${p.winnings || 0} in gross payouts for an official net profit of ${
                                  p.profit >= 0 ? `+£${p.profit}` : `-£${Math.abs(p.profit)}`
                              } (${m.roiPct >= 0 ? `+${m.roiPct}%` : `${m.roiPct}%`} ROI, £${avgWin} avg winnings/game). Highest single-game payout: £${m.highestWinAmount} (${m.highestWinLabel}).`
                            : `£0 paid in buy-ins and £0 won in payouts recorded on the 2026 season sheet.`
                },
                {
                    title: 'III. Recorded Finishing Positions & Podiums',
                    text:
                        p.gamesPlayed > 0
                            ? `Recorded game placements show a Best Finish of ${formatOrdinal(m.bestPosition)} (${p.wins || 0} first-place ${
                                  p.wins === 1 ? 'win' : 'wins'
                              }, ${m.winRate}% win rate) and ${m.podiumCount} top-3 finishes (${m.podiumRate}% podium rate). Worst recorded finish: ${formatOrdinal(m.worstPosition)} (${m.worstPositionLabel}), with an Average Finish Position of ${
                                  m.avgFinish > 0 ? m.avgFinish.toFixed(1) : 'N/A'
                              } and ${m.bubbleCount} bubble ${m.bubbleCount === 1 ? 'finish' : 'finishes'} (finishing 1 spot outside the money).`
                            : `No tournament finishing positions recorded in the 2026 game history log.`
                },
                {
                    title: 'IV. Knockouts, Eliminations & Sheet Rivalry Log',
                    text:
                        p.gamesPlayed > 0
                            ? `${p.name} has recorded ${p.knockOuts || 0} total season knockouts (${koRatio} KOs per game), with a single-game high of ${m.mostKOsInGame} KOs (${m.mostKOsLabel}). According to the player sheet knockout log, they have been knocked out ${m.timesEliminated} times (max ${m.maxRebuysSingle} rebuys in a single game, ${m.avgRebuysPerGame.toFixed(2)} avg/game). Sheet Rival (Most Knocked Out By): ${nemesisName} • Sheet Target (Most Knocked Out): ${pigeonName}.`
                            : `0 knockouts recorded, 0 times knocked out, and no head-to-head rivalries logged on the player sheet.`
                }
            ];

            const terms = getSearchTerms(p.name);
            const regexes = terms.map(t => new RegExp('\\b' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i'));
            const gazetteMentions: { episode: string; date: string; title: string; snippet: string; isWinner: boolean }[] = [];
            const seenKeys = new Set<string>();

            (reports || []).forEach(r => {
                const full = (r.content || '').trim();
                const key = `${r.episode}_${full.slice(0, 80)}`;
                if (seenKeys.has(key)) return;
                seenKeys.add(key);

                const isWinner = regexes.some(rx => rx.test(r.winner || ''));
                const paragraphs = full.split(/\n+/).map(s => s.trim()).filter(Boolean);
                const matchingPara = paragraphs.find(para => regexes.some(rx => rx.test(para)));

                if (matchingPara || isWinner) {
                    gazetteMentions.push({
                        episode: r.episode || 'Gazette Dispatch',
                        date: r.date || '',
                        title: (r.title || '').replace(/^["']|["']$/g, ''),
                        snippet: matchingPara || paragraphs[0] || '',
                        isWinner
                    });
                }
            });

            const statsGrid: StatCardItem[] = [
                {
                    id: 'points',
                    label: '1. Championship Points',
                    value: `${p.points} Pts`,
                    subtext: `Rank #${p.rank} • ${avgPts} Pts / Game Avg`,
                    category: 'standings',
                    highlightColor: 'text-gold border-gold/40 bg-gold/10',
                    isLeagueRecord: p.points === maxLeaguePoints && p.points > 0,
                    recordLabel: '🏆 #1 SEED'
                },
                {
                    id: 'highest-win',
                    label: '2. Highest Single-Game Win',
                    value: `£${m.highestWinAmount}`,
                    subtext: m.highestWinLabel,
                    category: 'financial',
                    highlightColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30',
                    isLeagueRecord: m.highestWinAmount === maxLeagueSingleWin && m.highestWinAmount > 0,
                    recordLabel: '💰 BIGGEST PAYDAY'
                },
                {
                    id: 'most-kos-game',
                    label: '3. Most KOs in a Game',
                    value: `${m.mostKOsInGame} KOs ☠️`,
                    subtext: m.mostKOsLabel,
                    category: 'combat',
                    highlightColor: 'text-red-400 border-red-500/40 bg-red-950/30',
                    isLeagueRecord: m.mostKOsInGame === maxLeagueSingleKOs && m.mostKOsInGame > 0,
                    recordLabel: '⚔️ SINGLE-GAME RECORD'
                },
                {
                    id: 'worst-pos',
                    label: '4. Worst Finish Position',
                    value: m.worstPosition ? `${formatOrdinal(m.worstPosition)} 💀` : 'N/A',
                    subtext: m.worstPositionLabel,
                    category: 'placement',
                    highlightColor: 'text-orange-400 border-orange-500/30 bg-orange-950/20',
                    isLeagueRecord: m.worstPosition === worstLeaguePos && (m.worstPosition || 0) >= 8,
                    recordLabel: '⚓ ANCHOR RECORD'
                },
                {
                    id: 'best-pos',
                    label: '5. Best Finish Position',
                    value: m.bestPosition ? `${formatOrdinal(m.bestPosition)} ${m.bestPosition === 1 ? '🏆' : '🏅'}` : 'N/A',
                    subtext: `${p.wins || 0}x 1st Place Wins`,
                    category: 'placement',
                    highlightColor: 'text-yellow-300 border-yellow-500/30 bg-yellow-950/20',
                    isLeagueRecord: (p.wins || 0) === maxLeagueWins && (p.wins || 0) > 0,
                    recordLabel: '👑 MOST TITLES'
                },
                {
                    id: 'avg-pos',
                    label: '6. Average Finish Position',
                    value: m.avgFinish > 0 ? `${m.avgFinish.toFixed(1)}` : 'N/A',
                    subtext: `Across ${p.gamesPlayed} League Appearances`,
                    category: 'placement',
                    highlightColor: 'text-cyan-300 border-cyan-500/30 bg-cyan-950/20'
                },
                {
                    id: 'net-profit',
                    label: '7. Net Season Profit',
                    value: p.profit >= 0 ? `+£${p.profit}` : `-£${Math.abs(p.profit)}`,
                    subtext: `ROI: ${m.roiPct >= 0 ? `+${m.roiPct}%` : `${m.roiPct}%`} (£${m.cashPaid} Paid In)`,
                    category: 'financial',
                    highlightColor: p.profit >= 0
                        ? 'text-green-400 border-green-500/40 bg-green-950/30'
                        : 'text-rose-400 border-rose-500/40 bg-rose-950/30',
                    isLeagueRecord: p.profit === maxLeagueProfit && p.profit > 0,
                    recordLabel: '📈 TOP PROFIT'
                },
                {
                    id: 'gross-winnings',
                    label: '8. Total Gross Winnings',
                    value: `£${p.winnings || 0}`,
                    subtext: `Avg £${avgWin} Won Per Appearance`,
                    category: 'financial',
                    highlightColor: 'text-emerald-300 border-emerald-500/30 bg-emerald-950/20',
                    isLeagueRecord: (p.winnings || 0) === maxLeagueGrossWinnings && (p.winnings || 0) > 0,
                    recordLabel: '🏦 TOP CASHER'
                },
                {
                    id: 'total-kos',
                    label: '9. Total Career Knockouts',
                    value: `${p.knockOuts || 0} KOs`,
                    subtext: `${koRatio} Knockouts Per Game Ratio`,
                    category: 'combat',
                    highlightColor: 'text-ept-red border-red-500/40 bg-red-950/30',
                    isLeagueRecord: (p.knockOuts || 0) === maxLeagueTotalKOs && (p.knockOuts || 0) > 0,
                    recordLabel: '☠️ HEADHUNTER'
                },
                {
                    id: 'win-podium-rate',
                    label: '10. Win & Podium Rate',
                    value: `${m.winRate}% / ${m.podiumRate}%`,
                    subtext: `${p.wins || 0} Wins • ${m.podiumCount} Top-3 Finishes`,
                    category: 'placement',
                    highlightColor: 'text-amber-300 border-amber-500/30 bg-amber-950/20'
                },
                {
                    id: 'bubbles',
                    label: '11. Bubble Finishes',
                    value: `${m.bubbleCount} 🫧`,
                    subtext: 'Finished 1 Spot Outside the Money',
                    category: 'placement',
                    highlightColor: 'text-purple-300 border-purple-500/30 bg-purple-950/20'
                },
                {
                    id: 'rebuys',
                    label: '12. Rebuys (Total, Max & Avg)',
                    value: `${p.rebuys || 0} (Max ${m.maxRebuysSingle})`,
                    subtext: `${m.avgRebuysPerGame.toFixed(2)} Avg/Gm • ${p.addOns || 0} Add-Ons (£10 ea)`,
                    category: 'resilience',
                    highlightColor: 'text-blue-300 border-blue-500/30 bg-blue-950/20',
                    isLeagueRecord: (p.rebuys || 0) === maxLeagueRebuys && (p.rebuys || 0) > 0,
                    recordLabel: '🏧 REBUY LEADER'
                },
                {
                    id: 'eliminations',
                    label: '13. Times Knocked Out',
                    value: `${m.timesEliminated} ⚰️`,
                    subtext: `From Player Sheet "Knocked Out By" Log`,
                    category: 'resilience',
                    highlightColor: 'text-zinc-200 border-white/15 bg-zinc-900/60'
                },
                {
                    id: 'bonus-chips',
                    label: '14. Final Table Bonus Stack',
                    value: `+${(p.bonusChips || 0).toLocaleString()}`,
                    subtext: 'Earned Season Bonus Chips',
                    category: 'standings',
                    highlightColor: 'text-gold border-gold/30 bg-gold/10',
                    isLeagueRecord: (p.bonusChips || 0) === maxLeagueBonusChips && (p.bonusChips || 0) > 0,
                    recordLabel: '🪙 BIG STACK'
                },
                {
                    id: 'nemesis',
                    label: '15. Sheet Rival (Nemesis)',
                    value: nemesisName,
                    subtext: 'Most Knocked Out By (Player Sheet)',
                    category: 'rivalry',
                    highlightColor: 'text-red-400 border-red-500/30 bg-red-950/25'
                },
                {
                    id: 'pigeon',
                    label: '16. Sheet Target (Bullied)',
                    value: pigeonName,
                    subtext: 'Most Knocked Out Opponent (Player Sheet)',
                    category: 'rivalry',
                    highlightColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/25'
                }
            ];

            return {
                player: p,
                archetypeBadge,
                archetypeColor,
                fearLevel,
                attendanceRate: `${attendancePct}% (${p.gamesPlayed}/${totalSeasonGames} Games)`,
                attendancePct,
                headline:
                    p.gamesPlayed === 0
                        ? `Rank #${p.rank} • 0 Appearances Logged in 2026 Season`
                        : `Rank #${p.rank} Official League Dossier • ${p.points} Championship Points`,
                quote,
                reportParagraphs,
                highestWinAmount: m.highestWinAmount,
                highestWinLabel: m.highestWinLabel,
                mostKOsInGame: m.mostKOsInGame,
                mostKOsLabel: m.mostKOsLabel,
                bestPosition: m.bestPosition,
                worstPosition: m.worstPosition,
                worstPositionLabel: m.worstPositionLabel,
                avgFinish: m.avgFinish,
                podiumCount: m.podiumCount,
                podiumRate: m.podiumRate,
                winRate: m.winRate,
                bubbleCount: m.bubbleCount,
                maxRebuysSingle: m.maxRebuysSingle,
                timesEliminated: m.timesEliminated,
                survivalRate: m.survivalRate,
                cashPaid: m.cashPaid,
                roiPct: m.roiPct,
                nemesisName,
                pigeonName,
                sessionLog: m.sessionLog,
                cumulativeProfitPoints: m.cumulativeProfitPoints,
                radarAttributes,
                gazetteMentions,
                statsGrid
            };
        });
    }, [players, history, reports, totalSeasonGames]);

    // Compute non-player-specific League Macro Telemetry, Nightly Session Logs, and Parity Benchmarks
    const leagueMacroTelemetry = useMemo(() => {
        const gamesCompleted = Math.max(history.length, totalSeasonGames, 1);
        const totalEntriesFromPlayers = players.reduce((acc, p) => acc + (p.gamesPlayed || 0), 0);
        const totalEntriesFromHistory = history.reduce((acc, s) => acc + (s.results?.length || 0), 0);
        const totalEntries = Math.max(totalEntriesFromPlayers, totalEntriesFromHistory, 1);

        const totalMoneySpent = players.reduce((acc, p) => acc + (p.cashPaid || 0), 0);
        const totalWinningsPaid = players.reduce((acc, p) => acc + (p.winnings || 0), 0);
        const totalNightlyPotsFromHistory = history.reduce((acc, s) => acc + (s.prizePot || 0), 0);
        const totalNightlyPots = totalNightlyPotsFromHistory > 0 ? totalNightlyPotsFromHistory : totalMoneySpent;

        const totalPointsAwarded = players.reduce((acc, p) => acc + (p.points || 0), 0);
        const totalKnockouts = players.reduce((acc, p) => acc + (p.knockOuts || 0), 0);
        const totalRebuys = players.reduce((acc, p) => acc + (p.rebuys || 0), 0);
        const totalAddOns = players.reduce((acc, p) => acc + (p.addOns || 0), 0);
        const totalBonusChips = players.reduce((acc, p) => acc + (p.bonusChips || 0), 0);

        const avgPlayersPerGame = Number((totalEntries / gamesCompleted).toFixed(1));
        const avgNightlyPot = Math.round(totalNightlyPots / gamesCompleted);
        const avgSpendPerGame = Math.round(totalMoneySpent / gamesCompleted);
        const avgPointsPerGame = Number((totalPointsAwarded / gamesCompleted).toFixed(1));
        const avgKOsPerGame = Number((totalKnockouts / gamesCompleted).toFixed(1));
        const rebuysPerGame = Number((totalRebuys / gamesCompleted).toFixed(2));
        const addOnsPerGame = Number((totalAddOns / gamesCompleted).toFixed(1));

        const addOnAdoptionRate = Math.min(100, Math.round((totalAddOns / totalEntries) * 100));
        const rebuyFrequencyRate = Math.round((totalRebuys / totalEntries) * 100);

        const koPointsTotal = totalKnockouts;
        const placementPointsTotal = Math.max(0, totalPointsAwarded - koPointsTotal);
        const placementPointsShare = Math.round((placementPointsTotal / Math.max(1, totalPointsAwarded)) * 100);
        const koPointsShare = Math.max(0, 100 - placementPointsShare);

        // Session-by-session non-player summary
        let runningSidePot = 0;
        let maxPlayersInGame = 0;
        let maxPlayersDate = '2026 Season';
        let minPlayersInGame = 99;
        let biggestNightlyPot = 0;
        let biggestPotLabel = '2026 Season';
        let smallestNightlyPot = 999999;
        let smallestPotLabel = '2026 Season';
        let biggestSinglePayout = 0;
        let mostKOsInSingleNight = 0;
        let mostKOsNightLabel = '2026 Season';

        const tierCounts: Record<number, { count: number; basePts: number; totalPts: number; totalCash: number }> = {
            1: { count: 0, basePts: 10, totalPts: 0, totalCash: 0 },
            2: { count: 0, basePts: 6, totalPts: 0, totalCash: 0 },
            3: { count: 0, basePts: 4, totalPts: 0, totalCash: 0 },
            4: { count: 0, basePts: 3, totalPts: 0, totalCash: 0 },
            5: { count: 0, basePts: 2, totalPts: 0, totalCash: 0 },
        };

        const sessionSummaries = history.map((s, idx) => {
            const gNum = idx + 1;
            const pCount = s.results?.length || 0;
            const pot = s.prizePot || 0;
            const side = s.sidePot || 0;
            runningSidePot += side;

            const cleanDate = (s.date || `Game ${gNum}`).replace(/^[A-Za-z]+,\s*/, '');
            const shortDate = cleanDate.replace(/,\s*\d{4}$/, '');

            if (pCount > maxPlayersInGame) {
                maxPlayersInGame = pCount;
                maxPlayersDate = shortDate;
            }
            if (pCount > 0 && pCount < minPlayersInGame) {
                minPlayersInGame = pCount;
            }
            if (pot > biggestNightlyPot) {
                biggestNightlyPot = pot;
                biggestPotLabel = `Game ${gNum} (${shortDate})`;
            }
            if (pot > 0 && pot < smallestNightlyPot) {
                smallestNightlyPot = pot;
                smallestPotLabel = `Game ${gNum} (${shortDate})`;
            }

            let nightPoints = 0;
            let nightKOs = 0;
            let nightPaidOut = 0;
            const payoutsList: number[] = [];

            (s.results || []).forEach(r => {
                const pl = parseInt(r.place, 10);
                const w = r.winnings || 0;
                const pts = r.points || 0;
                const kos = r.kos || 0;

                nightPoints += pts;
                nightKOs += kos;
                nightPaidOut += w;
                if (w > 0) payoutsList.push(w);
                if (w > biggestSinglePayout) biggestSinglePayout = w;

                if (pl >= 1 && pl <= 5 && tierCounts[pl]) {
                    tierCounts[pl].count += 1;
                    tierCounts[pl].totalPts += tierCounts[pl].basePts;
                    tierCounts[pl].totalCash += w;
                }
            });

            payoutsList.sort((a, b) => b - a);

            if (nightKOs > mostKOsInSingleNight) {
                mostKOsInSingleNight = nightKOs;
                mostKOsNightLabel = `Game ${gNum} (${shortDate})`;
            }

            return {
                gameNumber: gNum,
                rawDate: s.date,
                shortDate,
                prizePot: pot,
                sidePot: side,
                cumulativeSidePot: runningSidePot,
                playerCount: pCount,
                nightPoints,
                nightKOs,
                nightPaidOut,
                payoutsList,
            };
        });

        if (minPlayersInGame === 99) minPlayersInGame = maxPlayersInGame;
        if (smallestNightlyPot === 999999) smallestNightlyPot = biggestNightlyPot;
        if (biggestSinglePayout === 0) {
            biggestSinglePayout = Math.max(...computedProfiles.map(c => c.highestWinAmount), 0);
        }

        const activeRosterCount = players.filter(p => (p.gamesPlayed || 0) > 0).length || players.length || 1;
        const uniqueWinnersCount = players.filter(p => (p.wins || 0) > 0).length;
        const podiumFinishersCount = computedProfiles.filter(c => c.podiumCount > 0).length;
        const profitableOrEvenCount = players.filter(p => (p.gamesPlayed || 0) > 0 && (p.profit || 0) >= 0).length;
        const deficitCount = Math.max(0, activeRosterCount - profitableOrEvenCount);

        const avgOutlayPerSeat = Number((totalMoneySpent / totalEntries).toFixed(2));
        const avgWinningsPerSeat = Number((totalWinningsPaid / totalEntries).toFixed(2));
        const avgPointsPerSeat = Number((totalPointsAwarded / totalEntries).toFixed(1));
        const avgKOsPerSeat = Number((totalKnockouts / totalEntries).toFixed(2));

        return {
            gamesCompleted,
            totalEntries,
            activeRosterCount,
            totalRosterCount: players.length,
            totalMoneySpent,
            totalWinningsPaid,
            totalNightlyPots,
            avgPlayersPerGame,
            avgNightlyPot,
            avgSpendPerGame,
            avgPointsPerGame,
            avgKOsPerGame,
            totalPointsAwarded,
            totalKnockouts,
            totalRebuys,
            totalAddOns,
            totalBonusChips,
            rebuysPerGame,
            addOnsPerGame,
            addOnAdoptionRate,
            rebuyFrequencyRate,
            koPointsTotal,
            placementPointsTotal,
            placementPointsShare,
            koPointsShare,
            maxPlayersInGame,
            maxPlayersDate,
            minPlayersInGame,
            biggestNightlyPot,
            biggestPotLabel,
            smallestNightlyPot,
            smallestPotLabel,
            biggestSinglePayout,
            mostKOsInSingleNight,
            mostKOsNightLabel,
            uniqueWinnersCount,
            podiumFinishersCount,
            profitableOrEvenCount,
            deficitCount,
            avgOutlayPerSeat,
            avgWinningsPerSeat,
            avgPointsPerSeat,
            avgKOsPerSeat,
            tierCounts,
            sessionSummaries,
        };
    }, [players, history, computedProfiles, totalSeasonGames]);

    // Build the full Broadcast Slide Deck (3 Pages per Player + 3 League Stats Pages + Special Interstitial Slides)
    const activePlayerProfiles = useMemo(() => {
        const filteredPlayers = onlyActiveFinalists
            ? computedProfiles.filter(cp => !eliminatedPlayers[cp.player.name])
            : computedProfiles;
        return filteredPlayers.length > 0 ? filteredPlayers : computedProfiles;
    }, [computedProfiles, onlyActiveFinalists, eliminatedPlayers]);

    const broadcastSlides: BroadcastSlide[] = useMemo(() => {
        const slides: BroadcastSlide[] = [];

        // 1. All Players' 3-Page Stat Dossiers (Run first and loop with Generic League Stats)
        activePlayerProfiles.forEach(cp => {
            const firstName = cp.player.name.split(' ')[0];
            slides.push(
                {
                    type: 'player',
                    profile: cp,
                    page: 1,
                    id: `player_${cp.player.name}_p1`,
                    label: `${firstName} (1/3)`,
                    badge: `#${cp.player.rank} • P1`
                },
                {
                    type: 'player',
                    profile: cp,
                    page: 2,
                    id: `player_${cp.player.name}_p2`,
                    label: `${firstName} (2/3)`,
                    badge: `#${cp.player.rank} • P2`
                },
                {
                    type: 'player',
                    profile: cp,
                    page: 3,
                    id: `player_${cp.player.name}_p3`,
                    label: `${firstName} (3/3)`,
                    badge: `#${cp.player.rank} • P3`
                }
            );
        });

        // 2. Generic Non-Player-Specific League Statistics (3 Pages running in the loop alongside player pages)
        slides.push(
            {
                type: 'league_stats',
                page: 1,
                id: 'league_stats_p1',
                label: 'League Stats (1/3)',
                badge: '📊 LEAGUE • P1'
            },
            {
                type: 'league_stats',
                page: 2,
                id: 'league_stats_p2',
                label: 'Season Log (2/3)',
                badge: '📅 LEAGUE • P2'
            },
            {
                type: 'league_stats',
                page: 3,
                id: 'league_stats_p3',
                label: 'Parity & Rules (3/3)',
                badge: '📈 LEAGUE • P3'
            }
        );

        // 3. Special Broadcast Slides
        if (includeSpecialSlides && computedProfiles.length > 0) {
            slides.push(
                {
                    type: 'tale_of_the_tape',
                    id: 'special_tale_of_the_tape',
                    label: 'Tale of the Tape',
                    badge: '⚔️ H2H'
                },
                {
                    type: 'season_awards',
                    id: 'special_season_awards',
                    label: 'Awards & Shame',
                    badge: '💀 AWARDS'
                },
                {
                    type: 'stacks_and_payouts',
                    id: 'special_stacks_and_payouts',
                    label: 'Stacks & Payouts',
                    badge: '💰 VAULT'
                }
            );
        }

        return slides;
    }, [activePlayerProfiles, computedProfiles.length, includeSpecialSlides]);

    const safeSlideIdx = broadcastSlides.length > 0 ? activeSlideIdx % broadcastSlides.length : 0;
    const currentSlide = broadcastSlides[safeSlideIdx] || broadcastSlides[0];

    const playWalkUpTheme = useCallback(
        (theme: WalkUpTheme) => {
            if (!soundEnabled) return;
            playWalkUpAudio(theme);
        },
        [soundEnabled]
    );

    const handleNextSlide = useCallback(() => {
        if (broadcastSlides.length === 0) return;
        const nextIdx = (safeSlideIdx + 1) % broadcastSlides.length;
        setActiveSlideIdx(nextIdx);
        setLoopProgress(0);

        const nextSlide = broadcastSlides[nextIdx];
        if (playFanfareOnSlide && nextSlide && nextSlide.type === 'player' && nextSlide.page === 1) {
            const th = playerThemes[nextSlide.profile.player.name] || 'gladiator';
            playWalkUpTheme(th);
        }
    }, [broadcastSlides, safeSlideIdx, playFanfareOnSlide, playerThemes, playWalkUpTheme]);

    const handlePrevSlide = useCallback(() => {
        if (broadcastSlides.length === 0) return;
        const prevIdx = (safeSlideIdx - 1 + broadcastSlides.length) % broadcastSlides.length;
        setActiveSlideIdx(prevIdx);
        setLoopProgress(0);

        const prevSlide = broadcastSlides[prevIdx];
        if (playFanfareOnSlide && prevSlide && prevSlide.type === 'player' && prevSlide.page === 1) {
            const th = playerThemes[prevSlide.profile.player.name] || 'gladiator';
            playWalkUpTheme(th);
        }
    }, [broadcastSlides, safeSlideIdx, playFanfareOnSlide, playerThemes, playWalkUpTheme]);

    const handleSelectSlide = (idx: number) => {
        setActiveSlideIdx(idx);
        setLoopProgress(0);
        const target = broadcastSlides[idx];
        if (playFanfareOnSlide && target && target.type === 'player' && target.page === 1) {
            const th = playerThemes[target.profile.player.name] || 'gladiator';
            playWalkUpTheme(th);
        }
    };

    const handleSelectPlayerPage = (playerName: string, page: 1 | 2 | 3) => {
        const targetIdx = broadcastSlides.findIndex(
            s => s.type === 'player' && s.profile.player.name === playerName && s.page === page
        );
        if (targetIdx !== -1) {
            handleSelectSlide(targetIdx);
        }
    };

    const handleSelectLeaguePage = (page: 1 | 2 | 3) => {
        const targetIdx = broadcastSlides.findIndex(
            s => s.type === 'league_stats' && s.page === page
        );
        if (targetIdx !== -1) {
            handleSelectSlide(targetIdx);
        }
    };

    // Auto-Loop Timer Effect
    useEffect(() => {
        if (!isLooping || viewMode === 'clock' || broadcastSlides.length <= 1) return;

        const stepMs = 100;
        const increment = (stepMs / (loopDurationSec * 1000)) * 100;

        const timer = setInterval(() => {
            setLoopProgress(prev => {
                if (prev + increment >= 100) {
                    handleNextSlide();
                    return 0;
                }
                return prev + increment;
            });
        }, stepMs);

        return () => clearInterval(timer);
    }, [isLooping, viewMode, loopDurationSec, broadcastSlides.length, handleNextSlide]);

    // Keyboard shortcuts
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.code === 'ArrowRight') {
                e.preventDefault();
                handleNextSlide();
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                handlePrevSlide();
            } else if (e.code === 'Space') {
                e.preventDefault();
                setIsLooping(prev => !prev);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleNextSlide, handlePrevSlide]);

    // Blind Timer Effect
    const currentLevel = BLIND_LEVELS[currentLevelIdx] || BLIND_LEVELS[0];
    const nextLevel = BLIND_LEVELS[currentLevelIdx + 1];

    useEffect(() => {
        let interval: any = null;
        if (isClockRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (isClockRunning && timeLeft === 0) {
            if (soundEnabled && typeof window !== 'undefined') {
                try {
                    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
                    gain.gain.setValueAtTime(0.3, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 1.2);
                } catch {}
            }
            if (currentLevelIdx < BLIND_LEVELS.length - 1) {
                setCurrentLevelIdx(prev => prev + 1);
                setTimeLeft(BLIND_LEVELS[currentLevelIdx + 1].duration);
            } else {
                setIsClockRunning(false);
            }
        }
        return () => clearInterval(interval);
    }, [isClockRunning, timeLeft, currentLevelIdx, soundEnabled]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const toggleEliminate = (name: string) => {
        setEliminatedPlayers(prev => ({
            ...prev,
            [name]: !prev[name]
        }));
    };

    const handleSelectTheme = (playerName: string, theme: WalkUpTheme) => {
        setPlayerThemes(prev => ({ ...prev, [playerName]: theme }));
        savePlayerWalkUpTheme(playerName, theme);
        playWalkUpTheme(theme);
    };

    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    };

    const remainingCount = players.length - Object.values(eliminatedPlayers).filter(Boolean).length;
    const effectivePot = totalPot || 0;

    // ========================================================================
    // OPTION 4: SKY SPORTS / ESPN SCROLLING NEWS TICKER ITEMS
    // ========================================================================
    const tickerHeadlines = useMemo(() => {
        if (computedProfiles.length === 0) return [];
        const items: { tag: string; tagColor: string; text: string }[] = [];

        const leader = computedProfiles[0];
        const runnerUp = computedProfiles[1];
        const koKing = [...computedProfiles].sort((a, b) => (b.player.knockOuts || 0) - (a.player.knockOuts || 0))[0];
        const singleGameKoKing = [...computedProfiles].sort((a, b) => b.mostKOsInGame - a.mostKOsInGame)[0];
        const singleWinKing = [...computedProfiles].sort((a, b) => b.highestWinAmount - a.highestWinAmount)[0];
        const rebuyKing = [...computedProfiles].sort((a, b) => (b.player.rebuys || 0) - (a.player.rebuys || 0))[0];
        const profitKing = [...computedProfiles].sort((a, b) => b.player.profit - a.player.profit)[0];

        items.push({
            tag: '🔴 LIVE TOURNAMENT',
            tagColor: 'bg-red-600 text-white',
            text: `Blind Level ${currentLevel.level} (${currentLevel.sb}/${currentLevel.bb}${currentLevel.ante ? `, Ante ${currentLevel.ante}` : ''}) • ${remainingCount} of ${players.length} Finalists Remaining • Championship Vault: £${effectivePot}`
        });

        if (leader && runnerUp) {
            items.push({
                tag: '🏆 TITLE RACE',
                tagColor: 'bg-gold text-black',
                text: `${leader.player.name} leads the 2026 Championship on ${leader.player.points} pts (+${(leader.player.bonusChips || 0).toLocaleString()} bonus chips), just ${leader.player.points - runnerUp.player.points} pts ahead of #2 ${runnerUp.player.name} (${runnerUp.player.points} pts)!`
            });
        }

        if (singleWinKing && singleWinKing.highestWinAmount > 0) {
            items.push({
                tag: '💰 RECORD PAYDAY',
                tagColor: 'bg-emerald-500 text-black',
                text: `${singleWinKing.player.name} holds the Highest Single-Game Win record of £${singleWinKing.highestWinAmount} (${singleWinKing.highestWinLabel})!`
            });
        }

        if (singleGameKoKing && singleGameKoKing.mostKOsInGame > 0) {
            items.push({
                tag: '⚔️ EXECUTION RECORD',
                tagColor: 'bg-red-500 text-white',
                text: `${singleGameKoKing.player.name} holds the Single-Game Knockout Record with ${singleGameKoKing.mostKOsInGame} KOs in one night (${singleGameKoKing.mostKOsLabel}) — ${koKing.player.name} leads overall with ${koKing.player.knockOuts} total season KOs!`
            });
        }

        if (profitKing && profitKing.player.profit > 0) {
            items.push({
                tag: '📈 CASH SHARK',
                tagColor: 'bg-green-500 text-black',
                text: `${profitKing.player.name} leads the season profit ledger at +£${profitKing.player.profit} (${profitKing.roiPct}% ROI) with ${profitKing.winRate}% tournament win rate!`
            });
        }

        if (rebuyKing && (rebuyKing.player.rebuys || 0) > 0) {
            items.push({
                tag: '🏧 LEAGUE ATM',
                tagColor: 'bg-blue-500 text-white',
                text: `${rebuyKing.player.name} tops the Rebuy Leaderboard with ${rebuyKing.player.rebuys} rebuys (Max ${rebuyKing.maxRebuysSingle} in a single game) and £${rebuyKing.cashPaid} pumped into the prize pool!`
            });
        }

        computedProfiles.forEach(cp => {
            items.push({
                tag: `#${cp.player.rank} ${cp.player.name.split(' ')[0].toUpperCase()}`,
                tagColor: 'bg-zinc-800 text-gold border border-gold/40',
                text: `${cp.player.points} Pts • High Win: £${cp.highestWinAmount} • Max KOs: ${cp.mostKOsInGame} • Best: ${formatOrdinal(cp.bestPosition)} • Worst: ${formatOrdinal(cp.worstPosition)} • Net: ${cp.player.profit >= 0 ? `+£${cp.player.profit}` : `-£${Math.abs(cp.player.profit)}`}`
            });
        });

        return items;
    }, [computedProfiles, currentLevel, remainingCount, players.length, effectivePot]);

    // ========================================================================
    // RENDER COMPACT TOP LOOP & PLAYER CAROUSEL BAR
    // ========================================================================
    const renderTopLoopControls = () => {
        const activePlayerName = currentSlide?.type === 'player' ? currentSlide.profile.player.name : null;
        const activePlayerPage = currentSlide?.type === 'player' ? currentSlide.page : null;
        const activeLeaguePage = currentSlide?.type === 'league_stats' ? currentSlide.page : null;

        return (
            <div className="bg-zinc-950/95 border border-gold/30 rounded-2xl px-3.5 py-2 shadow-xl relative overflow-hidden shrink-0">
                {/* Animated Top Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-900 overflow-hidden">
                    <div
                        className={`h-full transition-all duration-100 ${
                            isLooping
                                ? 'bg-gradient-to-r from-gold via-yellow-300 to-amber-500 shadow-[0_0_12px_#ffd700]'
                                : 'bg-zinc-600'
                        }`}
                        style={{ width: `${loopProgress}%` }}
                    />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-white/10">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                            onClick={() => setIsLooping(!isLooping)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-[11px] uppercase tracking-wider transition cursor-pointer ${
                                isLooping
                                    ? 'bg-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                                    : 'bg-zinc-800 text-zinc-300 border border-white/10 hover:text-white'
                            }`}
                            title="Pause or Resume Auto-Loop (Spacebar)"
                        >
                            {isLooping ? <Pause size={12} className="fill-current" /> : <Play size={12} className="fill-current" />}
                            <span>{isLooping ? 'Auto-Looping' : 'Paused'}</span>
                        </button>

                        <div className="flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded-xl border border-white/10">
                            <span className="text-[9px] font-mono text-zinc-400 px-1 uppercase">Page Speed:</span>
                            {LOOP_INTERVAL_OPTIONS.map(opt => (
                                <button
                                    key={opt.seconds}
                                    onClick={() => {
                                        setLoopDurationSec(opt.seconds);
                                        setLoopProgress(0);
                                    }}
                                    className={`px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
                                        loopDurationSec === opt.seconds
                                            ? 'bg-gold/25 text-gold border border-gold/40'
                                            : 'text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setIncludeSpecialSlides(!includeSpecialSlides)}
                            className={`px-2 py-1 rounded-xl text-[10px] font-mono font-bold uppercase border transition cursor-pointer ${
                                includeSpecialSlides
                                    ? 'bg-amber-950/80 border-gold/50 text-gold'
                                    : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                            }`}
                        >
                            TV Specials: {includeSpecialSlides ? 'ON' : 'OFF'}
                        </button>

                        <button
                            onClick={() => {
                                setOnlyActiveFinalists(!onlyActiveFinalists);
                                setActiveSlideIdx(0);
                            }}
                            className={`px-2 py-1 rounded-xl text-[10px] font-mono font-bold uppercase border transition cursor-pointer ${
                                onlyActiveFinalists
                                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                                    : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                            }`}
                        >
                            {onlyActiveFinalists ? `In Play (${remainingCount})` : `All (${players.length})`}
                        </button>

                        <button
                            onClick={() => setPlayFanfareOnSlide(!playFanfareOnSlide)}
                            className={`px-2 py-1 rounded-xl text-[10px] font-mono font-bold uppercase border transition flex items-center gap-1 cursor-pointer ${
                                playFanfareOnSlide
                                    ? 'bg-purple-950/80 border-purple-400/50 text-purple-300'
                                    : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                            }`}
                        >
                            <Music size={10} />
                            <span className="hidden sm:inline">Fanfare: {playFanfareOnSlide ? 'ON' : 'OFF'}</span>
                        </button>
                    </div>

                    {/* Right: Active League/Player 3-Page Tabs + Slide Counter */}
                    <div className="flex items-center gap-2">
                        {activeLeaguePage && (
                            <div className="flex items-center gap-1 bg-black/80 px-2 py-0.5 rounded-xl border border-emerald-400/40">
                                <span className="text-[9px] font-mono uppercase text-emerald-300 mr-1">
                                    League Pages:
                                </span>
                                {([1, 2, 3] as const).map(pg => (
                                    <button
                                        key={pg}
                                        onClick={() => handleSelectLeaguePage(pg)}
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-black uppercase transition cursor-pointer ${
                                            activeLeaguePage === pg
                                                ? 'bg-emerald-400 text-black shadow'
                                                : 'text-zinc-400 hover:text-white bg-zinc-900'
                                        }`}
                                    >
                                        P{pg}/3
                                    </button>
                                ))}
                            </div>
                        )}

                        {activePlayerName && activePlayerPage && (
                            <div className="flex items-center gap-1 bg-black/80 px-2 py-0.5 rounded-xl border border-gold/40">
                                <span className="text-[9px] font-mono uppercase text-zinc-400 mr-1">
                                    {activePlayerName.split(' ')[0]} Pages:
                                </span>
                                {([1, 2, 3] as const).map(pg => (
                                    <button
                                        key={pg}
                                        onClick={() => handleSelectPlayerPage(activePlayerName, pg)}
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-black uppercase transition cursor-pointer ${
                                            activePlayerPage === pg
                                                ? 'bg-gold text-black shadow'
                                                : 'text-zinc-400 hover:text-white bg-zinc-900'
                                        }`}
                                    >
                                        P{pg}/3
                                    </button>
                                ))}
                            </div>
                        )}

                        <span className="text-[11px] font-mono text-zinc-400">
                            Slide <strong className="text-gold">{safeSlideIdx + 1}</strong>/{broadcastSlides.length}
                        </span>
                        <button
                            onClick={handlePrevSlide}
                            className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                        >
                            <ChevronLeft size={15} />
                        </button>
                        <button
                            onClick={handleNextSlide}
                            className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                        >
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>

                {/* Compact Single-Row League Stats, Player & Special Slide Strip */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {/* Dedicated 3-Page Generic League Stats Pill */}
                    <button
                        onClick={() => {
                            if (activeLeaguePage) {
                                const nextPg = ((activeLeaguePage % 3) + 1) as 1 | 2 | 3;
                                handleSelectLeaguePage(nextPg);
                            } else {
                                handleSelectLeaguePage(1);
                            }
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border shrink-0 transition-all cursor-pointer ${
                            activeLeaguePage
                                ? 'bg-gradient-to-r from-emerald-500/35 via-teal-500/25 to-black border-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.4)]'
                                : 'bg-emerald-950/35 border-emerald-500/40 hover:border-emerald-400'
                        }`}
                        title="View 3-Page Generic League-Wide Statistics (Click again to cycle P1 → P2 → P3)"
                    >
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-[11px] font-black uppercase text-white whitespace-nowrap">
                            League Stats
                        </span>
                        <span className={`px-1 py-0.2 rounded text-[8px] font-mono font-black ${
                            activeLeaguePage ? 'bg-emerald-400 text-black' : 'bg-emerald-900/70 text-emerald-300'
                        }`}>
                            {activeLeaguePage ? `${activeLeaguePage}/3` : '3 Pages'}
                        </span>
                    </button>

                    {activePlayerProfiles.map(cp => {
                        const isPlayerActive = activePlayerName === cp.player.name;
                        const eliminated = !!eliminatedPlayers[cp.player.name];
                        return (
                            <button
                                key={cp.player.name}
                                onClick={() => {
                                    if (isPlayerActive && activePlayerPage) {
                                        const nextPg = ((activePlayerPage % 3) + 1) as 1 | 2 | 3;
                                        handleSelectPlayerPage(cp.player.name, nextPg);
                                    } else {
                                        handleSelectPlayerPage(cp.player.name, 1);
                                    }
                                }}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border shrink-0 transition-all cursor-pointer ${
                                    isPlayerActive
                                        ? 'bg-gradient-to-r from-gold/30 via-amber-500/20 to-black border-gold shadow-[0_0_12px_rgba(212,175,55,0.35)]'
                                        : eliminated
                                        ? 'bg-zinc-950/60 border-red-900/40 opacity-40 hover:opacity-75'
                                        : 'bg-zinc-900/70 border-white/10 hover:border-white/25'
                                }`}
                            >
                                <div className="relative w-6 h-6 rounded-md overflow-hidden border border-gold/40 shrink-0 bg-zinc-800">
                                    <img
                                        src={getAvatarFilename(cp.player.name)}
                                        alt={cp.player.name}
                                        className={`w-full h-full object-cover ${eliminated ? 'grayscale' : ''}`}
                                    />
                                </div>
                                <div className="text-left leading-none">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[8.5px] font-mono font-black text-gold">#{cp.player.rank}</span>
                                        <span className={`text-[11px] font-extrabold uppercase ${isPlayerActive ? 'text-white' : 'text-zinc-300'}`}>
                                            {cp.player.name.split(' ')[0]}
                                        </span>
                                        {isPlayerActive && activePlayerPage && (
                                            <span className="px-1 py-0.2 rounded bg-gold text-black text-[8px] font-mono font-black">
                                                {activePlayerPage}/3
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    {includeSpecialSlides &&
                        broadcastSlides
                            .map((s, idx) => ({ s, idx }))
                            .filter(item => item.s.type !== 'player' && item.s.type !== 'league_stats')
                            .map(({ s, idx }) => {
                                const isSelected = idx === safeSlideIdx;
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => handleSelectSlide(idx)}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border shrink-0 transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-gradient-to-r from-purple-600/40 via-amber-500/30 to-black border-gold text-white shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                                                : 'bg-purple-950/30 border-purple-500/30 text-purple-200 hover:border-gold/50'
                                        }`}
                                    >
                                        <span className="text-[9px] font-mono font-black text-gold uppercase">{s.badge}</span>
                                        <span className="text-[11px] font-black uppercase whitespace-nowrap">{s.label}</span>
                                    </button>
                                );
                            })}
                </div>
            </div>
        );
    };

    // ========================================================================
    // OPTION 1A: UFC-STYLE "TALE OF THE TAPE" RIVALRY SLIDE (ZERO-SCROLL TV FIT)
    // ========================================================================
    const renderTaleOfTheTapeSlide = () => {
        const fighterA = computedProfiles[rivalryIdxA % computedProfiles.length] || computedProfiles[0];
        const fighterB = computedProfiles[rivalryIdxB % computedProfiles.length] || computedProfiles[1] || computedProfiles[0];
        if (!fighterA || !fighterB) return null;

        const comparisons = [
            {
                label: 'Championship Points',
                valA: fighterA.player.points,
                valB: fighterB.player.points,
                fmtA: `${fighterA.player.points} Pts`,
                fmtB: `${fighterB.player.points} Pts`,
                higherWins: true
            },
            {
                label: 'Highest Single-Game Win',
                valA: fighterA.highestWinAmount,
                valB: fighterB.highestWinAmount,
                fmtA: `£${fighterA.highestWinAmount}`,
                fmtB: `£${fighterB.highestWinAmount}`,
                higherWins: true
            },
            {
                label: 'Most KOs in a Single Game',
                valA: fighterA.mostKOsInGame,
                valB: fighterB.mostKOsInGame,
                fmtA: `${fighterA.mostKOsInGame} KOs ☠️`,
                fmtB: `${fighterB.mostKOsInGame} KOs ☠️`,
                higherWins: true
            },
            {
                label: 'Total Season Knockouts',
                valA: fighterA.player.knockOuts || 0,
                valB: fighterB.player.knockOuts || 0,
                fmtA: `${fighterA.player.knockOuts || 0} KOs`,
                fmtB: `${fighterB.player.knockOuts || 0} KOs`,
                higherWins: true
            },
            {
                label: 'Net Season Profit',
                valA: fighterA.player.profit + 300,
                valB: fighterB.player.profit + 300,
                fmtA: fighterA.player.profit >= 0 ? `+£${fighterA.player.profit}` : `-£${Math.abs(fighterA.player.profit)}`,
                fmtB: fighterB.player.profit >= 0 ? `+£${fighterB.player.profit}` : `-£${Math.abs(fighterB.player.profit)}`,
                higherWins: true
            },
            {
                label: 'Tournament Victories & Win %',
                valA: fighterA.winRate,
                valB: fighterB.winRate,
                fmtA: `${fighterA.player.wins || 0} Wins (${fighterA.winRate}%)`,
                fmtB: `${fighterB.player.wins || 0} Wins (${fighterB.winRate}%)`,
                higherWins: true
            },
            {
                label: 'Average Finish Position',
                valA: fighterA.avgFinish || 10,
                valB: fighterB.avgFinish || 10,
                fmtA: fighterA.avgFinish > 0 ? `${fighterA.avgFinish.toFixed(1)}th` : 'N/A',
                fmtB: fighterB.avgFinish > 0 ? `${fighterB.avgFinish.toFixed(1)}th` : 'N/A',
                higherWins: false
            },
            {
                label: 'Worst Finish Position',
                valA: fighterA.worstPosition || 11,
                valB: fighterB.worstPosition || 11,
                fmtA: formatOrdinal(fighterA.worstPosition),
                fmtB: formatOrdinal(fighterB.worstPosition),
                higherWins: false
            }
        ];

        return (
            <div className="flex-1 min-h-0 bg-gradient-to-b from-zinc-950/95 via-[#12090d]/95 to-black border-2 border-gold/50 rounded-3xl p-4 sm:p-6 shadow-[0_0_80px_rgba(220,38,38,0.2)] animate-in fade-in duration-300 flex flex-col justify-between overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-3 shrink-0">
                    <div>
                        <span className="text-[11px] font-mono font-black uppercase tracking-[0.3em] text-ept-red flex items-center gap-2">
                            <Swords className="w-4 h-4" />
                            <span>Main Event Rivalry Showcase • Head-to-Head</span>
                        </span>
                        <h2 className="text-xl sm:text-3xl font-black uppercase italic text-white tracking-tight">
                            Championship Tale of the Tape
                        </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 bg-black/70 p-1.5 rounded-2xl border border-white/10">
                        <span className="text-[10px] font-mono uppercase text-zinc-400 px-1">Matchup:</span>
                        <select
                            value={rivalryIdxA}
                            onChange={e => setRivalryIdxA(Number(e.target.value))}
                            className="bg-zinc-900 text-gold font-bold text-xs px-2.5 py-1 rounded-xl border border-gold/40"
                        >
                            {computedProfiles.map((cp, i) => (
                                <option key={cp.player.name} value={i}>
                                    #{cp.player.rank} {cp.player.name}
                                </option>
                            ))}
                        </select>
                        <span className="text-xs font-black text-ept-red px-1">VS</span>
                        <select
                            value={rivalryIdxB}
                            onChange={e => setRivalryIdxB(Number(e.target.value))}
                            className="bg-zinc-900 text-sky-400 font-bold text-xs px-2.5 py-1 rounded-xl border border-sky-400/40"
                        >
                            {computedProfiles.map((cp, i) => (
                                <option key={cp.player.name} value={i}>
                                    #{cp.player.rank} {cp.player.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Fighter Headers & Center Comparison Bars */}
                <div className="flex-1 min-h-0 grid grid-cols-12 gap-5 items-center pt-3 overflow-hidden">
                    {/* Fighter A */}
                    <div className="col-span-4 h-full flex flex-col items-center justify-center text-center p-4 rounded-3xl bg-gradient-to-b from-gold/15 to-black border-2 border-gold/50 shadow-xl">
                        <div className="relative flex items-center justify-center mb-3">
                            <div className="relative w-56 h-56 xl:w-72 xl:h-72 rounded-2xl border-4 border-gold overflow-hidden shadow-[0_0_45px_rgba(212,175,55,0.55)] bg-zinc-900">
                                <WantedVideo
                                    playerName={fighterA.player.name}
                                    className="absolute inset-0 w-full h-full object-cover object-top z-10"
                                />
                                <img src={getAvatarFilename(fighterA.player.name)} alt={fighterA.player.name} className="w-full h-full object-cover object-top" />
                                <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded bg-black/80 text-gold text-[9px] font-mono font-black uppercase border border-gold/40">
                                    🎬 AI Video
                                </span>
                            </div>
                            <div className="absolute -bottom-2 -right-3 w-16 h-20 xl:w-20 xl:h-24 rounded-xl border-2 border-amber-400/80 overflow-hidden shadow-2xl bg-zinc-950 z-30">
                                <img
                                    src={getAvatarFilename(fighterA.player.name)}
                                    alt={`${fighterA.player.name} 8-bit`}
                                    className="w-full h-full object-cover object-top"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                                <span className="absolute bottom-0.5 inset-x-0.5 z-20 px-1 py-0.5 rounded bg-black/85 text-amber-300 text-[6.5px] font-mono font-black uppercase text-center border border-amber-400/30">
                                    👾 8-Bit
                                </span>
                            </div>
                        </div>
                        <span className="px-3 py-0.5 rounded-full bg-gold text-black font-black text-[10px] uppercase tracking-widest mb-1">
                            Seed #{fighterA.player.rank} • {fighterA.player.points} Pts
                        </span>
                        <h3 className="text-2xl xl:text-3xl font-black uppercase text-white">{fighterA.player.name}</h3>
                        <span className="text-xs font-mono text-gold mt-1">{fighterA.archetypeBadge}</span>
                    </div>

                    {/* Center Comparison Bars */}
                    <div className="col-span-4 h-full flex flex-col justify-center gap-2 overflow-hidden">
                        {comparisons.map(row => {
                            const aWins = row.higherWins ? row.valA >= row.valB : row.valA <= row.valB;
                            const bWins = row.higherWins ? row.valB >= row.valA : row.valB <= row.valA;
                            const total = Math.max(1, Math.abs(row.valA) + Math.abs(row.valB));
                            const pctA = row.higherWins
                                ? Math.max(15, Math.min(85, Math.round((Math.max(0, row.valA) / total) * 100)))
                                : Math.max(15, Math.min(85, 100 - Math.round((Math.max(0, row.valA) / total) * 100)));

                            return (
                                <div key={row.label} className="bg-black/70 px-3 py-1.5 rounded-xl border border-white/10 space-y-1">
                                    <div className="flex items-center justify-between text-xs font-mono">
                                        <span className={aWins ? 'text-gold font-black' : 'text-zinc-400'}>{row.fmtA}</span>
                                        <span className="text-[10px] uppercase font-bold text-zinc-300 tracking-wider">{row.label}</span>
                                        <span className={bWins ? 'text-sky-400 font-black' : 'text-zinc-400'}>{row.fmtB}</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden flex">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-500 to-gold transition-all duration-500"
                                            style={{ width: `${pctA}%` }}
                                        />
                                        <div
                                            className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500"
                                            style={{ width: `${100 - pctA}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Fighter B */}
                    <div className="col-span-4 h-full flex flex-col items-center justify-center text-center p-4 rounded-3xl bg-gradient-to-b from-sky-500/15 to-black border-2 border-sky-400/50 shadow-xl">
                        <div className="relative flex items-center justify-center mb-3">
                            <div className="relative w-56 h-56 xl:w-72 xl:h-72 rounded-2xl border-4 border-sky-400 overflow-hidden shadow-[0_0_45px_rgba(56,189,248,0.45)] bg-zinc-900">
                                <WantedVideo
                                    playerName={fighterB.player.name}
                                    className="absolute inset-0 w-full h-full object-cover object-top z-10"
                                />
                                <img src={getAvatarFilename(fighterB.player.name)} alt={fighterB.player.name} className="w-full h-full object-cover object-top" />
                                <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded bg-black/80 text-sky-300 text-[9px] font-mono font-black uppercase border border-sky-400/40">
                                    🎬 AI Video
                                </span>
                            </div>
                            <div className="absolute -bottom-2 -right-3 w-16 h-20 xl:w-20 xl:h-24 rounded-xl border-2 border-sky-400/80 overflow-hidden shadow-2xl bg-zinc-950 z-30">
                                <img
                                    src={getAvatarFilename(fighterB.player.name)}
                                    alt={`${fighterB.player.name} 8-bit`}
                                    className="w-full h-full object-cover object-top"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                                <span className="absolute bottom-0.5 inset-x-0.5 z-20 px-1 py-0.5 rounded bg-black/85 text-sky-300 text-[6.5px] font-mono font-black uppercase text-center border border-sky-400/30">
                                    👾 8-Bit
                                </span>
                            </div>
                        </div>
                        <span className="px-3 py-0.5 rounded-full bg-sky-400 text-black font-black text-[10px] uppercase tracking-widest mb-1">
                            Seed #{fighterB.player.rank} • {fighterB.player.points} Pts
                        </span>
                        <h3 className="text-2xl xl:text-3xl font-black uppercase text-white">{fighterB.player.name}</h3>
                        <span className="text-xs font-mono text-sky-300 mt-1">{fighterB.archetypeBadge}</span>
                    </div>
                </div>
            </div>
        );
    };

    // ========================================================================
    // OPTION 1B: SEASON AWARDS & "HALL OF SHAME" SUPERLATIVES SLIDE (ZERO-SCROLL)
    // ========================================================================
    const renderSeasonAwardsSlide = () => {
        if (computedProfiles.length === 0) return null;

        const koLeader = [...computedProfiles].sort((a, b) => (b.player.knockOuts || 0) - (a.player.knockOuts || 0))[0];
        const singleWinLeader = [...computedProfiles].sort((a, b) => b.highestWinAmount - a.highestWinAmount)[0];
        const singleKoLeader = [...computedProfiles].sort((a, b) => b.mostKOsInGame - a.mostKOsInGame)[0];
        const rebuyLeader = [...computedProfiles].sort((a, b) => (b.player.rebuys || 0) - (a.player.rebuys || 0))[0];
        const winRateLeader = [...computedProfiles].filter(c => c.player.gamesPlayed >= 2).sort((a, b) => b.winRate - a.winRate)[0] || computedProfiles[0];
        const bubbleLeader = [...computedProfiles].sort((a, b) => b.bubbleCount - a.bubbleCount)[0];
        const bulletSponge = [...computedProfiles].sort((a, b) => b.timesEliminated - a.timesEliminated)[0];
        const ghostAward = [...computedProfiles].sort((a, b) => a.player.gamesPlayed - b.player.gamesPlayed)[0];

        const awards = [
            {
                title: '☠️ MOST TOTAL KNOCKOUTS',
                subtitle: 'Season Knockout Leader (Sheet1)',
                winner: koLeader.player.name,
                stat: `${koLeader.player.knockOuts} Total KOs`,
                detail: `Averaging ${(koLeader.player.knockOuts / Math.max(1, koLeader.player.gamesPlayed)).toFixed(2)} knockouts per game across ${koLeader.player.gamesPlayed} games.`,
                color: 'border-red-500/50 bg-gradient-to-b from-red-950/40 to-black text-red-400'
            },
            {
                title: '💰 HIGHEST SINGLE-GAME WIN',
                subtitle: 'Largest Recorded Game Payout',
                winner: singleWinLeader.player.name,
                stat: `£${singleWinLeader.highestWinAmount} Cash`,
                detail: `Recorded in ${singleWinLeader.highestWinLabel} • £${singleWinLeader.player.winnings} total gross winnings.`,
                color: 'border-emerald-500/50 bg-gradient-to-b from-emerald-950/40 to-black text-emerald-400'
            },
            {
                title: '⚔️ MOST KOs IN A SINGLE GAME',
                subtitle: 'Single-Night Knockout Record',
                winner: singleKoLeader.player.name,
                stat: `${singleKoLeader.mostKOsInGame} KOs in 1 Game`,
                detail: `Recorded in ${singleKoLeader.mostKOsLabel}.`,
                color: 'border-amber-500/50 bg-gradient-to-b from-amber-950/40 to-black text-gold'
            },
            {
                title: '🏆 HIGHEST WIN PERCENTAGE',
                subtitle: 'Best Tournament Win Rate (Min 2 Games)',
                winner: winRateLeader.player.name,
                stat: `${winRateLeader.winRate}% Win Rate`,
                detail: `${winRateLeader.player.wins || 0} 1st-place wins in ${winRateLeader.player.gamesPlayed} appearances (${winRateLeader.player.profit >= 0 ? `+£${winRateLeader.player.profit}` : `-£${Math.abs(winRateLeader.player.profit)}`}).`,
                color: 'border-cyan-500/50 bg-gradient-to-b from-cyan-950/40 to-black text-cyan-300'
            },
            {
                title: '🏧 MOST SEASON REBUYS',
                subtitle: 'Highest Rebuy & Cash Contribution',
                winner: rebuyLeader.player.name,
                stat: `${rebuyLeader.player.rebuys} Rebuys (£${rebuyLeader.cashPaid} Paid)`,
                detail: `Max ${rebuyLeader.maxRebuysSingle} rebuys in a single game • ${rebuyLeader.player.addOns || 0} add-ons recorded.`,
                color: 'border-blue-500/50 bg-gradient-to-b from-blue-950/40 to-black text-blue-300'
            },
            {
                title: '🫧 MOST BUBBLE FINISHES',
                subtitle: 'Finished 1 Spot Outside the Money',
                winner: bubbleLeader.player.name,
                stat: `${bubbleLeader.bubbleCount} Bubble Finishes`,
                detail: `Finished 1 position outside the cash payouts ${bubbleLeader.bubbleCount} times this season.`,
                color: 'border-purple-500/50 bg-gradient-to-b from-purple-950/40 to-black text-purple-300'
            },
            {
                title: '⚰️ MOST TIMES KNOCKED OUT',
                subtitle: 'From Player Sheet "Knocked Out By" Table',
                winner: bulletSponge.player.name,
                stat: `${bulletSponge.timesEliminated} Times KO'd`,
                detail: `Recorded across ${bulletSponge.player.gamesPlayed} appearances in the player sheet knockout log.`,
                color: 'border-orange-500/50 bg-gradient-to-b from-orange-950/40 to-black text-orange-300'
            },
            {
                title: '📉 LOWEST TABLE ATTENDANCE',
                subtitle: 'Fewest Season Games Played',
                winner: ghostAward.player.name,
                stat: `${ghostAward.player.gamesPlayed} Games (${ghostAward.attendancePct}%)`,
                detail: `${ghostAward.player.gamesPlayed} of ${totalSeasonGames} season games attended.`,
                color: 'border-rose-500/50 bg-gradient-to-b from-rose-950/40 to-black text-rose-300'
            }
        ];

        return (
            <div className="flex-1 min-h-0 bg-gradient-to-b from-zinc-950/95 via-[#0f0c16]/95 to-black border-2 border-gold/50 rounded-3xl p-4 sm:p-6 shadow-[0_0_80px_rgba(212,175,55,0.2)] animate-in fade-in duration-300 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
                    <div>
                        <span className="text-[11px] font-mono font-black uppercase tracking-[0.3em] text-gold flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            <span>Official 2026 Season Records (Google Sheets)</span>
                        </span>
                        <h2 className="text-xl sm:text-3xl font-black uppercase italic text-white tracking-tight">
                            Season Statistical Leaders &amp; Records
                        </h2>
                    </div>
                    <span className="hidden sm:inline-block px-4 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold font-mono font-bold text-xs">
                        8 Official Sheet Records
                    </span>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-4 grid-rows-2 gap-3.5 pt-3 overflow-hidden">
                    {awards.map(aw => (
                        <div
                            key={aw.title}
                            className={`p-3.5 rounded-2xl border-2 flex flex-col justify-between shadow-xl overflow-hidden ${aw.color}`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <div className="text-xs font-black uppercase tracking-wider">{aw.title}</div>
                                    <div className="text-[10px] font-mono text-zinc-400">{aw.subtitle}</div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <div className="relative w-20 h-20 xl:w-24 xl:h-24 rounded-2xl overflow-hidden border-2 border-white/30 bg-zinc-900 shadow-lg">
                                        <WantedVideo
                                            playerName={aw.winner}
                                            className="absolute inset-0 w-full h-full object-cover object-top z-10"
                                        />
                                        <img src={getAvatarFilename(aw.winner)} alt={aw.winner} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-gold/40 bg-zinc-950">
                                        <img
                                            src={getAvatarFilename(aw.winner)}
                                            alt={`${aw.winner} 8-bit`}
                                            className="w-full h-full object-cover"
                                            style={{ imageRendering: 'pixelated' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="text-lg xl:text-xl font-black uppercase text-white truncate">{aw.winner}</div>
                                <div className="text-xl xl:text-2xl font-black font-mono mt-0.5">{aw.stat}</div>
                            </div>

                            <p className="text-[11px] text-zinc-300 leading-snug font-sans border-t border-white/10 pt-2 line-clamp-2">
                                {aw.detail}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // ========================================================================
    // OPTION 1C: OFFICIAL BONUS CHIPS, SEASON LEDGER & PRIZE VAULT SLIDE
    // ========================================================================
    const renderStacksAndPayoutsSlide = () => {
        const firstPayout = Math.round(effectivePot * 0.50);
        const secondPayout = Math.round(effectivePot * 0.30);
        const thirdPayout = Math.round(effectivePot * 0.15);
        const bountyPayout = Math.round(effectivePot * 0.05);

        return (
            <div className="flex-1 min-h-0 bg-gradient-to-b from-zinc-950/95 via-[#09130e]/95 to-black border-2 border-gold/50 rounded-3xl p-4 sm:p-6 shadow-[0_0_80px_rgba(16,185,129,0.2)] animate-in fade-in duration-300 flex flex-col justify-between gap-3 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-2.5 shrink-0">
                    <div>
                        <span className="text-[11px] font-mono font-black uppercase tracking-[0.3em] text-emerald-400 flex items-center gap-2">
                            <Coins className="w-4 h-4" />
                            <span>Official Google Sheet Prize Pot (AF25) &amp; Bonus Chips (Col R)</span>
                        </span>
                        <h2 className="text-xl sm:text-3xl font-black uppercase italic text-white tracking-tight">
                            Championship Prize Vault &amp; Earned Bonus Chips
                        </h2>
                    </div>

                    <div className="px-4 py-1.5 rounded-2xl bg-gold/20 border-2 border-gold text-right">
                        <span className="text-[9px] font-mono uppercase text-gold block">Official Sheet Prize Pot</span>
                        <span className="text-xl sm:text-2xl font-black font-mono text-white">£{effectivePot}</span>
                    </div>
                </div>

                {/* Projected Payout Cards (50/30/15/5 of Sheet Pot) */}
                <div className="grid grid-cols-4 gap-3 shrink-0">
                    <div className="p-3 rounded-2xl bg-gradient-to-b from-gold/25 to-black border-2 border-gold text-center">
                        <span className="text-xs font-black uppercase text-gold block">🏆 1st Place Share (50%)</span>
                        <span className="text-2xl xl:text-3xl font-black font-mono text-white mt-0.5 block">£{firstPayout}</span>
                        <span className="text-[10px] font-mono text-zinc-400">50% of £{effectivePot} Pot</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-gradient-to-b from-zinc-400/20 to-black border-2 border-zinc-400 text-center">
                        <span className="text-xs font-black uppercase text-zinc-300 block">🥈 2nd Place Share (30%)</span>
                        <span className="text-2xl xl:text-3xl font-black font-mono text-white mt-0.5 block">£{secondPayout}</span>
                        <span className="text-[10px] font-mono text-zinc-400">30% of £{effectivePot} Pot</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-gradient-to-b from-amber-700/25 to-black border-2 border-amber-600 text-center">
                        <span className="text-xs font-black uppercase text-amber-400 block">🥉 3rd Place Share (15%)</span>
                        <span className="text-2xl xl:text-3xl font-black font-mono text-white mt-0.5 block">£{thirdPayout}</span>
                        <span className="text-[10px] font-mono text-zinc-400">15% of £{effectivePot} Pot</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-gradient-to-b from-red-600/25 to-black border-2 border-red-500 text-center">
                        <span className="text-xs font-black uppercase text-red-400 block">☠️ Bounty Pool (5%)</span>
                        <span className="text-2xl xl:text-3xl font-black font-mono text-white mt-0.5 block">£{bountyPayout}</span>
                        <span className="text-[10px] font-mono text-zinc-400">5% of £{effectivePot} Pot</span>
                    </div>
                </div>

                {/* Official Earned Bonus Chips & Season Ledger Table */}
                <div className="flex-1 min-h-0 grid grid-cols-3 lg:grid-cols-4 gap-2.5 content-stretch overflow-hidden">
                    {computedProfiles.map(cp => {
                        const bonus = cp.player.bonusChips || 0;
                        const isOut = !!eliminatedPlayers[cp.player.name];

                        return (
                            <div
                                key={cp.player.name}
                                className={`flex items-center justify-between px-3 py-2 rounded-2xl border ${
                                    isOut
                                        ? 'bg-zinc-950/60 border-red-900/40 opacity-40'
                                        : cp.player.rank === 1
                                        ? 'bg-gold/15 border-gold'
                                        : 'bg-zinc-900/80 border-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-gold/40 shrink-0 bg-zinc-800 relative">
                                        <WantedVideo
                                            playerName={cp.player.name}
                                            className="absolute inset-0 w-full h-full object-cover object-top z-10"
                                        />
                                        <img src={getAvatarFilename(cp.player.name)} alt={cp.player.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-black uppercase text-white truncate">
                                            #{cp.player.rank} {cp.player.name}
                                        </div>
                                        <div className="text-[10px] font-mono text-zinc-400">
                                            {cp.player.points} Pts • {cp.player.gamesPlayed} Games
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <div className="text-sm font-black font-mono text-gold">
                                        +{bonus.toLocaleString()} Chips
                                    </div>
                                    <div className={`text-[10px] font-mono font-bold ${cp.player.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        Net: {cp.player.profit >= 0 ? `+£${cp.player.profit}` : `-£${Math.abs(cp.player.profit)}`}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ========================================================================
    // RENDER INDIVIDUAL PLAYER SLIDE (SPLIT ACROSS 3 ZERO-SCROLL TV PAGES!)
    // Page 1: Core Standings, Cash & Placement Stats (Stats 1–8) + Profit Trajectory
    // Page 2: Combat, Survival & Extremes (Stats 9–16) + 6-Axis Poker DNA & Rivalries
    // Page 3: Full 4-Part Official League Scouting Dossier + Session Log & Gazette
    // ========================================================================
    const renderPlayerDossierSlide = (currentProfile: ComputedPlayerProfile, page: 1 | 2 | 3) => {
        const { player: p } = currentProfile;
        const isOut = !!eliminatedPlayers[p.name];
        const page1Stats = currentProfile.statsGrid.slice(0, 8);
        const page2Stats = currentProfile.statsGrid.slice(8, 16);

        const pageTitles: Record<1 | 2 | 3, { badge: string; title: string; subtitle: string }> = {
            1: {
                badge: 'PAGE 1 OF 3 • HEADLINE & FINANCIAL TELEMETRY',
                title: 'Championship Standings, Payouts & Profit Curve',
                subtitle: 'Stats 1–8 of 16 • Cumulative Season Cash Flow Trajectory'
            },
            2: {
                badge: 'PAGE 2 OF 3 • COMBAT, SURVIVAL & POKER DNA',
                title: 'Knockout Records, Rebuy Resilience & 6-Axis DNA',
                subtitle: 'Stats 9–16 of 16 • Hexagon Attribute Radar & Rivalry Matchups'
            },
            3: {
                badge: 'PAGE 3 OF 3 • OFFICIAL LEAGUE SCOUTING DOSSIER',
                title: 'Full Season Analyst Report, Game Log & Gazette Press',
                subtitle: '4-Part Tactical Breakdown • Game-by-Game Results & Headlines'
            }
        };

        return (
            <div
                key={`${p.name}_page_${page}`}
                className="flex-1 min-h-0 bg-gradient-to-b from-zinc-950/95 via-[#0c0c0e]/95 to-black border-2 border-gold/40 rounded-3xl p-4 sm:p-5 shadow-[0_0_70px_rgba(212,175,55,0.18)] relative overflow-hidden animate-in fade-in duration-300 grid grid-cols-12 gap-5"
            >
                <div className="absolute -bottom-8 right-6 text-[9rem] font-black text-white/[0.025] select-none pointer-events-none leading-none font-mono">
                    #{p.rank}
                </div>

                {/* LEFT 4 COLUMNS: ANCHORED PLAYER BROADCAST IDENTITY & MEDIA SHOWCASE */}
                <div className="col-span-4 h-full min-h-0 flex flex-col justify-between bg-zinc-900/50 border border-gold/25 rounded-2xl p-3.5 relative z-10 overflow-hidden">
                    {/* Top: Prominent Doubled AI Video Showcase + Corner 8-Bit Arcade Badge */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-center">
                            <div className="relative">
                                {/* Doubled AI Video Feed (w-60 h-60 xl:w-72 xl:h-72) */}
                                <div className={`relative w-60 h-60 xl:w-72 xl:h-72 rounded-2xl border-4 overflow-hidden shadow-[0_0_45px_rgba(212,175,55,0.5)] bg-zinc-900 ${
                                    isOut ? 'border-red-600 grayscale' : 'border-gold'
                                }`}>
                                    <WantedVideo
                                        playerName={p.name}
                                        className="absolute inset-0 w-full h-full object-cover object-top z-10"
                                    />
                                    <img
                                        src={getAvatarFilename(p.name)}
                                        alt={p.name}
                                        className="w-full h-full object-cover object-top scale-105"
                                    />
                                    <span className="absolute top-2.5 left-2.5 z-20 px-2.5 py-0.5 rounded bg-black/85 border border-gold/50 text-[9px] font-mono font-black uppercase tracking-wider text-gold">
                                        🎬 AI Video
                                    </span>
                                    {isOut && (
                                        <div className="absolute inset-0 z-30 bg-red-950/75 flex flex-col items-center justify-center">
                                            <Skull className="w-12 h-12 text-red-500 animate-pulse" />
                                            <span className="text-xs font-black uppercase tracking-widest text-white bg-red-600 px-2.5 py-0.5 rounded mt-1">
                                                BUSTED
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Seed Pill */}
                                <div className="absolute -bottom-2.5 left-4 z-30 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-gold via-yellow-400 to-amber-500 text-black font-black text-[10px] uppercase tracking-widest shadow-xl whitespace-nowrap border border-white">
                                    SEED #{p.rank}
                                </div>

                                {/* Corner 8-Bit Arcade Character PiP Badge */}
                                <div className={`absolute -bottom-3 -right-3 z-30 w-16 h-20 xl:w-20 xl:h-24 rounded-xl border-2 overflow-hidden shadow-[0_0_25px_rgba(0,0,0,0.9)] bg-zinc-950 ${
                                    isOut ? 'border-red-600/60 grayscale' : 'border-amber-400'
                                }`}>
                                    <img
                                        src={getAvatarFilename(p.name)}
                                        alt={`${p.name} 8-Bit Character`}
                                        className="w-full h-full object-cover object-top"
                                        style={{ imageRendering: 'pixelated' }}
                                    />
                                    <span className="absolute bottom-0.5 inset-x-0.5 z-20 px-1 py-0.2 rounded bg-black/90 border border-amber-400/40 text-[6.5px] font-mono font-black uppercase tracking-wider text-amber-300 text-center">
                                        👾 8-Bit
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Player Identity Details */}
                        <div className="text-center pt-1.5 space-y-1">
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${currentProfile.archetypeColor}`}>
                                    {currentProfile.archetypeBadge}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-[9px] font-mono font-bold">
                                    {p.gamesPlayed} {p.gamesPlayed === 1 ? 'Game' : 'Games'} Played
                                </span>
                            </div>

                            <h2 className="text-xl xl:text-3xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_20px_rgba(255,215,0,0.3)] leading-tight">
                                {p.name}
                            </h2>

                            <p className="text-[10px] xl:text-[11px] font-mono text-gold/90 line-clamp-1 px-1">
                                {currentProfile.quote}
                            </p>
                        </div>

                        {/* Quick Summary Strip */}
                        <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                            <div className="bg-black/60 border border-gold/30 rounded-xl p-1.5 text-center">
                                <div className="text-[7.5px] font-mono uppercase text-zinc-400">Points</div>
                                <div className="text-xs xl:text-sm font-black font-mono text-gold">{p.points}</div>
                            </div>
                            <div className="bg-black/60 border border-white/10 rounded-xl p-1.5 text-center">
                                <div className="text-[7.5px] font-mono uppercase text-zinc-400">Net Profit</div>
                                <div className={`text-xs xl:text-sm font-black font-mono ${p.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {p.profit >= 0 ? `+£${p.profit}` : `-£${Math.abs(p.profit)}`}
                                </div>
                            </div>
                            <div className="bg-black/60 border border-white/10 rounded-xl p-1.5 text-center">
                                <div className="text-[7.5px] font-mono uppercase text-zinc-400">High Win</div>
                                <div className="text-xs xl:text-sm font-black font-mono text-emerald-300">£{currentProfile.highestWinAmount}</div>
                            </div>
                            <div className="bg-black/60 border border-white/10 rounded-xl p-1.5 text-center">
                                <div className="text-[7.5px] font-mono uppercase text-zinc-400">Total KOs</div>
                                <div className="text-xs xl:text-sm font-black font-mono text-ept-red">{p.knockOuts}☠️</div>
                            </div>
                        </div>

                        {/* 100% Real Google Sheet Telemetry Badges */}
                        <div className="flex flex-wrap items-center justify-center gap-1">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-black/70 border border-white/10 text-zinc-300">
                                Avg Pos: <strong className="text-gold">{currentProfile.avgFinish > 0 ? currentProfile.avgFinish.toFixed(1) : 'N/A'}</strong>
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-black/70 border border-white/10 text-zinc-300">
                                Bonus: <strong className="text-gold">+{(p.bonusChips || 0).toLocaleString()}</strong>
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-black/70 border border-white/10 text-zinc-300">
                                Rebuys: <strong className="text-blue-300">{p.rebuys || 0}</strong>
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-black/70 border border-white/10 text-zinc-300">
                                Att: <strong className="text-white">{currentProfile.attendancePct}%</strong>
                            </span>
                        </div>
                    </div>

                    {/* Bottom: 3-Page Dossier Switcher + Walk-Up Audio & Status Controls */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className="grid grid-cols-3 gap-1.5">
                            {([
                                { pg: 1 as const, label: '1/3 • Core Stats' },
                                { pg: 2 as const, label: '2/3 • Combat & DNA' },
                                { pg: 3 as const, label: '3/3 • Full Report' }
                            ]).map(tab => (
                                <button
                                    key={tab.pg}
                                    onClick={() => handleSelectPlayerPage(p.name, tab.pg)}
                                    className={`py-1.5 px-2 rounded-xl font-mono font-black text-[10px] uppercase tracking-wider border transition cursor-pointer ${
                                        page === tab.pg
                                            ? 'bg-gold text-black border-white shadow-[0_0_15px_rgba(212,175,55,0.45)]'
                                            : 'bg-black/70 text-zinc-400 border-white/10 hover:text-white hover:border-gold/40'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <button
                                onClick={() => {
                                    const th = playerThemes[p.name] || 'gladiator';
                                    playWalkUpTheme(th);
                                }}
                                className="flex-1 py-1.5 px-3 rounded-xl bg-gold/20 hover:bg-gold/30 border border-gold/50 text-gold text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                                <Music size={12} />
                                <span>Fanfare</span>
                            </button>

                            <button
                                onClick={() => toggleEliminate(p.name)}
                                className={`flex-1 py-1.5 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                                    isOut
                                        ? 'bg-red-950/90 border-red-500 text-red-300 hover:bg-red-900'
                                        : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                                }`}
                            >
                                {isOut ? '💀 Busted (Restore)' : '🟢 Active Finalist'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT 8 COLUMNS: DYNAMIC ZERO-SCROLL PAGE CONTENT (PAGE 1, PAGE 2, OR PAGE 3) */}
                <div className="col-span-8 h-full min-h-0 flex flex-col justify-between gap-3 relative z-10 overflow-hidden">
                    {/* Page Section Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 shrink-0">
                        <div>
                            <span className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-gold block">
                                {pageTitles[page].badge}
                            </span>
                            <h3 className="text-lg xl:text-2xl font-black uppercase italic text-white tracking-tight">
                                {pageTitles[page].title}
                            </h3>
                        </div>
                        <div className="text-right hidden sm:block">
                            <span className="px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold font-mono font-black text-xs">
                                Page {page} of 3
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                                {pageTitles[page].subtitle}
                            </span>
                        </div>
                    </div>

                    {/* ============================================================ */}
                    {/* PAGE 1 OF 3: STATS 1–8 (4x2 GRID) + SEASON PROFIT SPARKLINE */}
                    {/* ============================================================ */}
                    {page === 1 && (
                        <div className="flex-1 min-h-0 flex flex-col justify-between gap-3 overflow-hidden">
                            <div className="flex-1 min-h-0 grid grid-cols-4 grid-rows-2 gap-3">
                                {page1Stats.map(stat => (
                                    <div
                                        key={stat.id}
                                        className={`relative p-3.5 rounded-2xl border-2 flex flex-col justify-between shadow-lg ${stat.highlightColor}`}
                                    >
                                        {stat.isLeagueRecord && (
                                            <span className="absolute -top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-gold via-yellow-300 to-amber-500 text-black text-[8.5px] font-black uppercase tracking-widest shadow-md border border-white">
                                                {stat.recordLabel || '★ RECORD'}
                                            </span>
                                        )}
                                        <div className="text-[11px] font-mono font-black uppercase text-zinc-300 tracking-tight">
                                            {stat.label}
                                        </div>
                                        <div className="text-2xl xl:text-3xl font-black font-mono tracking-tight my-auto truncate">
                                            {stat.value}
                                        </div>
                                        <div className="text-[11px] font-sans text-zinc-300/90 leading-snug line-clamp-2 border-t border-white/10 pt-1.5">
                                            {stat.subtext}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Bottom Widescreen Profit Trajectory Card */}
                            <div className="h-[175px] shrink-0 bg-zinc-900/70 border border-white/15 rounded-2xl p-3.5 grid grid-cols-12 gap-4 items-center overflow-hidden">
                                <div className="col-span-4 h-full flex flex-col justify-between border-r border-white/10 pr-3">
                                    <div>
                                        <span className="text-[10px] font-mono font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                            <TrendingUp className="w-3.5 h-3.5" />
                                            <span>Season Cash Trajectory</span>
                                        </span>
                                        <h4 className="text-base font-black uppercase text-white mt-0.5">
                                            Cumulative Profit Curve
                                        </h4>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-black/60 p-2 rounded-xl border border-white/10">
                                            <span className="text-[9px] font-mono text-zinc-400 uppercase block">Total Outlay</span>
                                            <span className="text-sm font-black font-mono text-white">£{currentProfile.cashPaid}</span>
                                        </div>
                                        <div className="bg-black/60 p-2 rounded-xl border border-white/10">
                                            <span className="text-[9px] font-mono text-zinc-400 uppercase block">Season ROI</span>
                                            <span className={`text-sm font-black font-mono ${currentProfile.roiPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {currentProfile.roiPct >= 0 ? `+${currentProfile.roiPct}%` : `${currentProfile.roiPct}%`}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-8 h-full min-h-0 flex items-center">
                                    <ProfitSparklineChart points={currentProfile.cumulativeProfitPoints} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* PAGE 2 OF 3: STATS 9–16 (4x2 GRID) + 6-AXIS DNA & RIVALRIES */}
                    {/* ============================================================ */}
                    {page === 2 && (
                        <div className="flex-1 min-h-0 flex flex-col justify-between gap-3 overflow-hidden">
                            <div className="flex-1 min-h-0 grid grid-cols-4 grid-rows-2 gap-3">
                                {page2Stats.map(stat => (
                                    <div
                                        key={stat.id}
                                        className={`relative p-3.5 rounded-2xl border-2 flex flex-col justify-between shadow-lg ${stat.highlightColor}`}
                                    >
                                        {stat.isLeagueRecord && (
                                            <span className="absolute -top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-gold via-yellow-300 to-amber-500 text-black text-[8.5px] font-black uppercase tracking-widest shadow-md border border-white">
                                                {stat.recordLabel || '★ RECORD'}
                                            </span>
                                        )}
                                        <div className="text-[11px] font-mono font-black uppercase text-zinc-300 tracking-tight">
                                            {stat.label}
                                        </div>
                                        <div className="text-2xl xl:text-3xl font-black font-mono tracking-tight my-auto truncate">
                                            {stat.value}
                                        </div>
                                        <div className="text-[11px] font-sans text-zinc-300/90 leading-snug line-clamp-2 border-t border-white/10 pt-1.5">
                                            {stat.subtext}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Bottom 6-Axis Poker DNA Radar + Rivalry Spotlight */}
                            <div className="h-[195px] shrink-0 grid grid-cols-12 gap-3 overflow-hidden">
                                <div className="col-span-7 h-full bg-zinc-900/70 border border-gold/30 rounded-2xl p-3 flex flex-col justify-between overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black uppercase tracking-wider text-gold flex items-center gap-1.5">
                                            <Activity className="w-4 h-4" />
                                            <span>6-Axis Sheet Performance vs. Real League Avg</span>
                                        </span>
                                        <span className="text-[9px] font-mono text-sky-400">Dashed = True League Mean</span>
                                    </div>
                                    <div className="flex-1 min-h-0">
                                        <PokerDnaRadarChart attributes={currentProfile.radarAttributes} />
                                    </div>
                                </div>

                                <div className="col-span-5 h-full bg-zinc-900/70 border border-white/15 rounded-2xl p-3 flex flex-col justify-between overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black uppercase tracking-wider text-ept-red flex items-center gap-1.5">
                                            <Swords className="w-4 h-4" />
                                            <span>Player Sheet Knockout Rivalry Log</span>
                                        </span>
                                        <span className="text-[9px] font-mono text-zinc-400">From Google Sheet</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2.5 my-auto">
                                        <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/40 flex items-center gap-2.5">
                                            <img
                                                src={getAvatarFilename(currentProfile.nemesisName)}
                                                alt={currentProfile.nemesisName}
                                                className="w-11 h-11 rounded-xl border border-red-500/50 object-cover bg-zinc-900 shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <span className="text-[9px] font-mono font-black uppercase text-red-400 block">⚔️ Sheet Rival</span>
                                                <span className="text-xs font-black uppercase text-white truncate block">{currentProfile.nemesisName}</span>
                                                <span className="text-[9px] font-mono text-zinc-400 truncate block">
                                                    Most Knocked Out By
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center gap-2.5">
                                            <img
                                                src={getAvatarFilename(currentProfile.pigeonName)}
                                                alt={currentProfile.pigeonName}
                                                className="w-11 h-11 rounded-xl border border-emerald-500/50 object-cover bg-zinc-900 shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <span className="text-[9px] font-mono font-black uppercase text-emerald-400 block">🎯 Sheet Target</span>
                                                <span className="text-xs font-black uppercase text-white truncate block">{currentProfile.pigeonName}</span>
                                                <span className="text-[9px] font-mono text-zinc-400 truncate block">
                                                    Most Knocked Out
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-300 bg-black/50 px-3 py-1.5 rounded-xl border border-white/10">
                                        <span>Max KOs/Gm: <strong className="text-gold">{currentProfile.mostKOsInGame} KOs</strong></span>
                                        <span>•</span>
                                        <span>Times KO&apos;d: <strong className="text-rose-400">{currentProfile.timesEliminated}</strong></span>
                                        <span>•</span>
                                        <span>Bonus: <strong className="text-gold">+{(p.bonusChips || 0).toLocaleString()}</strong></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* PAGE 3 OF 3: 4-PART LEAGUE REPORT + GAME LOG + GAZETTE       */}
                    {/* ============================================================ */}
                    {page === 3 && (
                        <div className="flex-1 min-h-0 flex flex-col justify-between gap-3 overflow-hidden">
                            {/* Top 2x2 Official League Scouting Report Grid */}
                            <div className="flex-1 min-h-0 bg-zinc-900/60 border border-gold/30 rounded-2xl p-4 flex flex-col justify-between gap-2.5 overflow-hidden">
                                <div className="flex items-center justify-between border-b border-white/10 pb-2 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-gold" />
                                        <h4 className="text-sm xl:text-base font-black text-white uppercase italic">
                                            &ldquo;{currentProfile.headline}&rdquo;
                                        </h4>
                                    </div>
                                    <span className="text-[10px] font-mono uppercase text-gold">
                                        4-Part Tactical Dossier
                                    </span>
                                </div>

                                <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-3">
                                    {currentProfile.reportParagraphs.map((sec, idx) => (
                                        <div
                                            key={idx}
                                            className="p-3.5 rounded-xl bg-black/70 border border-white/10 flex flex-col justify-center space-y-1.5 overflow-hidden"
                                        >
                                            <div className="text-xs font-black uppercase tracking-wider text-gold">
                                                {sec.title}
                                            </div>
                                            <p className="text-xs xl:text-sm text-zinc-200 leading-relaxed font-sans line-clamp-4">
                                                {sec.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Bottom: 10-Game Session Log (5x2 Grid) + Gazette Headlines */}
                            <div className="h-[190px] shrink-0 grid grid-cols-12 gap-3 overflow-hidden">
                                <div className="col-span-7 h-full bg-zinc-900/70 border border-white/15 rounded-2xl p-3 flex flex-col justify-between overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4 text-gold" />
                                            <span>Game-by-Game Season Performance Log</span>
                                        </span>
                                        <span className="text-[10px] font-mono text-zinc-400">
                                            {p.gamesPlayed}/{currentProfile.sessionLog.length} Sessions Played
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-5 grid-rows-2 gap-1.5 my-auto">
                                        {currentProfile.sessionLog.slice(0, 10).map(s => (
                                            <div
                                                key={s.gameNumber}
                                                className={`px-2 py-1.5 rounded-xl border text-center ${
                                                    !s.played
                                                        ? 'bg-black/40 border-white/5 opacity-40'
                                                        : s.placeNum === 1
                                                        ? 'bg-gradient-to-b from-gold/25 to-black border-gold text-white'
                                                        : s.placeNum && s.placeNum <= 3
                                                        ? 'bg-emerald-950/40 border-emerald-500/40 text-white'
                                                        : s.placeNum === currentProfile.worstPosition
                                                        ? 'bg-red-950/30 border-red-500/40 text-zinc-200'
                                                        : 'bg-black/70 border-white/10 text-zinc-200'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between text-[8px] font-mono text-zinc-400">
                                                    <span>G{s.gameNumber}</span>
                                                    <span className="truncate max-w-[38px]">{s.date}</span>
                                                </div>
                                                <div className={`text-xs font-black font-mono ${
                                                    !s.played
                                                        ? 'text-zinc-600'
                                                        : s.placeNum === 1
                                                        ? 'text-gold'
                                                        : s.placeNum && s.placeNum <= 3
                                                        ? 'text-emerald-400'
                                                        : 'text-white'
                                                }`}>
                                                    {s.played ? `${s.placeLabel}${s.placeNum === 1 ? '🏆' : ''}` : 'DNP'}
                                                </div>
                                                <div className="text-[8px] font-mono text-zinc-400 truncate">
                                                    {s.played ? `£${s.winnings} • ${s.kos}☠️` : '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="col-span-5 h-full bg-zinc-900/70 border border-white/15 rounded-2xl p-3 flex flex-col justify-between overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black uppercase tracking-wider text-gold flex items-center gap-1.5">
                                            <Newspaper className="w-4 h-4" />
                                            <span>Gazette Press Mentions</span>
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-gold/15 text-gold text-[10px] font-mono font-bold border border-gold/30">
                                            {currentProfile.gazetteMentions.length} Headlines
                                        </span>
                                    </div>

                                    {currentProfile.gazetteMentions.length > 0 ? (
                                        <div className="space-y-2 my-auto overflow-hidden">
                                            {currentProfile.gazetteMentions.slice(0, 2).map((m, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-2.5 rounded-xl bg-black/70 border-l-2 border-gold text-xs space-y-0.5"
                                                >
                                                    <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
                                                        <span className="text-gold font-bold uppercase truncate max-w-[200px]">
                                                            {m.episode} {m.title ? `• ${m.title}` : ''}
                                                        </span>
                                                        <span>{m.date}</span>
                                                    </div>
                                                    <p className="text-zinc-200 text-[11px] line-clamp-2 italic leading-snug">
                                                        &ldquo;{m.snippet}&rdquo;
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-3 my-auto rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-400 italic text-center">
                                            Operating under the radar in official Gazette dispatches this season.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // =========================================================================
    // SLIDE TYPE 0: GENERIC LEAGUE MACRO TELEMETRY (3 NON-PLAYER PAGES)
    // =========================================================================
    const renderLeagueStatsSlide = (page: 1 | 2 | 3) => {
        const m = leagueMacroTelemetry;

        return (
            <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
                {/* LEFT 4 COLUMNS: LEAGUE SEASON IDENTITY & GLOBAL TOTALS */}
                <div className="col-span-4 bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-black border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-2xl">
                    <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none bg-emerald-500" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none bg-amber-500" />

                    {/* Top Identity Header */}
                    <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/25 via-emerald-900/40 to-black border-2 border-emerald-400/50 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.25)] shrink-0">
                                    <span className="text-xl leading-none">🏆</span>
                                    <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest mt-0.5">
                                        2026
                                    </span>
                                </div>
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[9px] font-black uppercase tracking-widest mb-1">
                                        <span>📊 Live Google Sheets Telemetry</span>
                                    </div>
                                    <h2 className="text-2xl font-serif font-black text-white uppercase tracking-tight leading-none">
                                        League Macro Report
                                    </h2>
                                    <p className="text-[11px] text-zinc-400 font-medium mt-1">
                                        Aggregate E.P.T. Season Statistics • Non-Player Overview
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Season Completion Progress Bar */}
                        <div className="bg-black/60 border border-white/10 rounded-xl p-3 mb-3">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                                <span className="text-zinc-400">Regular Season Progress</span>
                                <span className="text-emerald-400">
                                    {m.gamesCompleted} Games Completed • {m.activeRosterCount}/{m.totalRosterCount} Roster Active
                                </span>
                            </div>
                            <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-white/10 p-0.5">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-amber-400 transition-all duration-700"
                                    style={{ width: `${Math.min(100, Math.round((m.gamesCompleted / 10) * 100))}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1.5 font-mono">
                                <span>Total Entries Logged: <strong className="text-white">{m.totalEntries} Seats</strong></span>
                                <span>Avg Turnout: <strong className="text-emerald-300">{m.avgPlayersPerGame.toFixed(1)} / Night</strong></span>
                            </div>
                        </div>

                        {/* 2x3 Primary League Totals Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-2.5">
                                <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold block">
                                    Total League Money Spent
                                </span>
                                <div className="text-xl font-black font-mono text-white mt-0.5">
                                    £{m.totalMoneySpent.toLocaleString()}
                                </div>
                                <span className="text-[10px] text-zinc-400">
                                    {m.totalEntries} Buy-Ins + {m.totalRebuys} Rebuys + {m.totalAddOns} Add-Ons (@ £10)
                                </span>
                            </div>

                            <div className="bg-zinc-900/80 border border-emerald-500/30 rounded-xl p-2.5">
                                <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold block">
                                    Nightly Prize Pots
                                </span>
                                <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                                    £{m.totalNightlyPots.toLocaleString()}
                                </div>
                                <span className="text-[10px] text-zinc-400">
                                    £{m.totalWinningsPaid.toLocaleString()} distributed to date
                                </span>
                            </div>

                            <div className="bg-amber-950/25 border border-amber-500/35 rounded-xl p-2.5">
                                <span className="text-[9px] uppercase tracking-widest text-amber-400 font-bold block">
                                    Grand Final Vault
                                </span>
                                <div className="text-xl font-black font-mono text-amber-400 mt-0.5">
                                    £{totalPot.toLocaleString()}
                                </div>
                                <span className="text-[10px] text-amber-200/70">
                                    Accumulated Season Side Pot
                                </span>
                            </div>

                            <div className="bg-zinc-900/80 border border-sky-500/30 rounded-xl p-2.5">
                                <span className="text-[9px] uppercase tracking-widest text-sky-400 font-bold block">
                                    Total League Points
                                </span>
                                <div className="text-xl font-black font-mono text-sky-300 mt-0.5">
                                    {m.totalPointsAwarded.toLocaleString()} <span className="text-xs font-sans">PTS</span>
                                </div>
                                <span className="text-[10px] text-zinc-400">
                                    {m.placementPointsTotal} Placement + {m.koPointsTotal} KO
                                </span>
                            </div>

                            <div className="bg-zinc-900/80 border border-rose-500/30 rounded-xl p-2.5">
                                <span className="text-[9px] uppercase tracking-widest text-rose-400 font-bold block">
                                    Total Knockouts
                                </span>
                                <div className="text-xl font-black font-mono text-rose-400 mt-0.5">
                                    {m.totalKnockouts} <span className="text-xs font-sans">KOs</span>
                                </div>
                                <span className="text-[10px] text-zinc-400">
                                    {m.avgKOsPerGame.toFixed(1)} eliminations per game
                                </span>
                            </div>

                            <div className="bg-zinc-900/80 border border-purple-500/30 rounded-xl p-2.5">
                                <span className="text-[9px] uppercase tracking-widest text-purple-400 font-bold block">
                                    Final Bonus Chips
                                </span>
                                <div className="text-xl font-black font-mono text-purple-300 mt-0.5">
                                    {m.totalBonusChips.toLocaleString()}
                                </div>
                                <span className="text-[10px] text-zinc-400">
                                    500 chips per league point
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Page Switcher inside Left Panel */}
                    <div className="pt-2.5 border-t border-white/10 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                            <span className="uppercase tracking-widest font-bold">Rebuys &amp; Add-Ons (£10 ea)</span>
                            <span className="font-mono text-zinc-200 font-bold">
                                {m.totalRebuys} Rebuys (£{m.totalRebuys * 10}) • {m.totalAddOns} Add-Ons (£{m.totalAddOns * 10})
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            {([
                                { p: 1 as const, title: '1/3 • Economy' },
                                { p: 2 as const, title: '2/3 • Nightly Log' },
                                { p: 3 as const, title: '3/3 • Parity & Rules' },
                            ]).map((item) => (
                                <button
                                    key={item.p}
                                    onClick={() => handleSelectLeaguePage(item.p)}
                                    className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                                        page === item.p
                                            ? 'bg-emerald-500 text-black border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                                            : 'bg-zinc-900/90 text-zinc-400 border-white/10 hover:text-white'
                                    }`}
                                >
                                    {item.title}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT 8 COLUMNS: PAGE-SPECIFIC MACRO TELEMETRY */}
                <div className="col-span-8 flex flex-col gap-3 min-h-0">
                    {/* =========================================================
                        PAGE 1: MACRO ECONOMY, AVERAGES & POT TRAJECTORY
                    ========================================================= */}
                    {page === 1 && (
                        <div className="flex-1 flex flex-col justify-between gap-3 min-h-0">
                            {/* Top 4x2 Macro Telemetry Cards */}
                            <div className="grid grid-cols-4 gap-2.5">
                                <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                        Avg Nightly Prize Pot
                                    </span>
                                    <div className="text-2xl font-black font-mono text-emerald-400 my-1">
                                        £{Math.round(m.avgNightlyPot)}
                                    </div>
                                    <span className="text-[10px] text-zinc-400">
                                        Range: £{m.smallestNightlyPot} – £{m.biggestNightlyPot}
                                    </span>
                                </div>

                                <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                        Peak Nightly Pot
                                    </span>
                                    <div className="text-2xl font-black font-mono text-amber-400 my-1">
                                        £{m.biggestNightlyPot}
                                    </div>
                                    <span className="text-[10px] text-zinc-400 truncate">
                                        {m.biggestPotLabel} • Top Single Payout £{m.biggestSinglePayout}
                                    </span>
                                </div>

                                <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                        Table Attendance
                                    </span>
                                    <div className="text-2xl font-black font-mono text-white my-1">
                                        {m.avgPlayersPerGame.toFixed(1)} <span className="text-xs font-sans text-zinc-400">AVG</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-400 truncate">
                                        Peak: {m.maxPlayersInGame} ({m.maxPlayersDate}) • Min: {m.minPlayersInGame}
                                    </span>
                                </div>

                                <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                        Avg Spend Per Seat
                                    </span>
                                    <div className="text-2xl font-black font-mono text-sky-300 my-1">
                                        £{m.avgOutlayPerSeat.toFixed(2)}
                                    </div>
                                    <span className="text-[10px] text-zinc-400">
                                        £{Math.round(m.avgSpendPerGame)} total table spend / game
                                    </span>
                                </div>

                                <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                        Add-On Adoption Rate
                                    </span>
                                    <div className="text-2xl font-black font-mono text-emerald-300 my-1">
                                        {m.addOnAdoptionRate}%
                                    </div>
                                    <span className="text-[10px] text-zinc-400">
                                        {m.totalAddOns} Add-Ons across {m.totalEntries} entries ({m.addOnsPerGame.toFixed(1)}/game)
                                    </span>
                                </div>

                                <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                        Rebuy Frequency
                                    </span>
                                    <div className="text-2xl font-black font-mono text-orange-400 my-1">
                                        {m.rebuyFrequencyRate}%
                                    </div>
                                    <span className="text-[10px] text-zinc-400">
                                        {m.totalRebuys} Total Rebuys ({m.rebuysPerGame.toFixed(2)} per game)
                                    </span>
                                </div>

                                <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                        Nightly Action Tempo
                                    </span>
                                    <div className="text-2xl font-black font-mono text-rose-400 my-1">
                                        {m.avgKOsPerGame.toFixed(1)} <span className="text-xs font-sans text-zinc-400">KOs/G</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-400 truncate">
                                        Peak Carnage: {m.mostKOsInSingleNight} KOs ({m.mostKOsNightLabel})
                                    </span>
                                </div>

                                <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                        Points Per Session
                                    </span>
                                    <div className="text-2xl font-black font-mono text-purple-300 my-1">
                                        {m.avgPointsPerGame.toFixed(1)} <span className="text-xs font-sans text-zinc-400">PTS/G</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-400">
                                        {m.placementPointsShare}% Placement • {m.koPointsShare}% Bounties
                                    </span>
                                </div>
                            </div>

                            {/* Bottom Widescreen Chart: Nightly Prize Pot vs Cumulative Final Vault */}
                            <div className="flex-1 bg-zinc-900/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between min-h-0">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                                            Season Financial Trajectory (Games 1 – {m.gamesCompleted})
                                        </span>
                                        <h3 className="text-base font-serif font-bold text-white">
                                            Nightly Prize Pots, Cumulative Grand Final Vault &amp; Attendance
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5 text-emerald-400">
                                            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Nightly Pot (£)
                                        </span>
                                        <span className="flex items-center gap-1.5 text-amber-400">
                                            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Cumulative Final Vault (£)
                                        </span>
                                        <span className="flex items-center gap-1.5 text-sky-300">
                                            <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" /> Players Seated
                                        </span>
                                    </div>
                                </div>

                                {/* Custom Bar + Metric Strip for All Completed Sessions */}
                                <div className="flex-1 grid grid-cols-9 gap-2.5 items-end pt-4 pb-1 min-h-0">
                                    {m.sessionSummaries.map((s) => {
                                        const maxChartVal = Math.max(240, m.biggestNightlyPot, totalPot);
                                        const potHeightPct = Math.max(12, Math.round((s.prizePot / maxChartVal) * 100));
                                        const vaultHeightPct = Math.max(8, Math.round((s.cumulativeSidePot / maxChartVal) * 100));

                                        return (
                                            <div
                                                key={s.gameNumber}
                                                className="h-full flex flex-col justify-between bg-black/45 border border-white/5 rounded-xl p-2 hover:border-emerald-500/40 transition-all"
                                            >
                                                {/* Top Session Badges */}
                                                <div className="flex items-center justify-between text-[9px] font-mono">
                                                    <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 font-bold">
                                                        {s.playerCount}P
                                                    </span>
                                                    <span className="text-rose-400 font-bold">
                                                        {s.nightKOs} KO
                                                    </span>
                                                </div>

                                                {/* Dual Bars Container */}
                                                <div className="flex-1 flex items-end justify-center gap-2 py-2 min-h-0">
                                                    {/* Nightly Prize Pot Bar */}
                                                    <div className="flex flex-col items-center justify-end h-full w-6">
                                                        <span className="text-[9px] font-mono font-black text-emerald-300 mb-1">
                                                            £{s.prizePot}
                                                        </span>
                                                        <div
                                                            className="w-full rounded-t-md bg-gradient-to-t from-emerald-700 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.25)]"
                                                            style={{ height: `${potHeightPct}%` }}
                                                        />
                                                    </div>

                                                    {/* Cumulative Final Vault Bar */}
                                                    <div className="flex flex-col items-center justify-end h-full w-6">
                                                        <span className="text-[9px] font-mono font-bold text-amber-300 mb-1">
                                                            £{s.cumulativeSidePot}
                                                        </span>
                                                        <div
                                                            className="w-full rounded-t-md bg-gradient-to-t from-amber-700 to-amber-400 opacity-90"
                                                            style={{ height: `${vaultHeightPct}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Bottom Game Label */}
                                                <div className="pt-1.5 border-t border-white/10 text-center">
                                                    <div className="text-[10px] font-black text-white uppercase tracking-wider">
                                                        Game {s.gameNumber}
                                                    </div>
                                                    <div className="text-[9px] text-zinc-400 font-mono truncate">
                                                        {s.shortDate}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* =========================================================
                        PAGE 2: GAME-BY-GAME SEASON SESSION CHRONICLE (NON-PLAYER)
                    ========================================================= */}
                    {page === 2 && (
                        <div className="flex-1 flex flex-col justify-between gap-3 min-h-0">
                            <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-3.5 flex-1 flex flex-col justify-between min-h-0">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                                            Official Session Log • Non-Player Macro Breakdown
                                        </span>
                                        <h3 className="text-base font-serif font-bold text-white">
                                            Game-by-Game Turnout, Prize Pools, Payout Splits &amp; Table Action
                                        </h3>
                                    </div>
                                    <div className="text-right text-[10px] font-mono text-zinc-400">
                                        <span>Total Nightly Prize Pools: <strong className="text-emerald-400">£{m.totalNightlyPots}</strong></span>
                                        <span className="mx-2">•</span>
                                        <span>Side Pot Vault Added: <strong className="text-amber-400">£{totalPot}</strong></span>
                                    </div>
                                </div>

                                {/* 3x3 Grid of Completed Games */}
                                <div className="grid grid-cols-3 gap-2.5 flex-1 min-h-0">
                                    {m.sessionSummaries.map((s) => (
                                        <div
                                            key={s.gameNumber}
                                            className="bg-black/55 border border-white/10 rounded-xl p-3 flex flex-col justify-between hover:border-emerald-500/40 transition-all"
                                        >
                                            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                                                        Game #{s.gameNumber}
                                                    </span>
                                                    <span className="text-xs font-bold text-zinc-200">
                                                        {s.rawDate}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-mono font-bold text-sky-300 bg-sky-500/10 border border-sky-500/25 px-2 py-0.5 rounded">
                                                    {s.playerCount} Players
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-4 gap-1.5 my-1.5 text-center">
                                                <div className="bg-zinc-900/90 rounded-lg p-1.5 border border-white/5">
                                                    <span className="text-[8px] uppercase text-zinc-400 block">Prize Pot</span>
                                                    <span className="text-sm font-mono font-black text-emerald-400">
                                                        £{s.prizePot}
                                                    </span>
                                                </div>
                                                <div className="bg-zinc-900/90 rounded-lg p-1.5 border border-white/5">
                                                    <span className="text-[8px] uppercase text-zinc-400 block">Vault +</span>
                                                    <span className="text-sm font-mono font-black text-amber-400">
                                                        +£{s.sidePot}
                                                    </span>
                                                </div>
                                                <div className="bg-zinc-900/90 rounded-lg p-1.5 border border-white/5">
                                                    <span className="text-[8px] uppercase text-zinc-400 block">Points</span>
                                                    <span className="text-sm font-mono font-black text-sky-300">
                                                        {s.nightPoints}
                                                    </span>
                                                </div>
                                                <div className="bg-zinc-900/90 rounded-lg p-1.5 border border-white/5">
                                                    <span className="text-[8px] uppercase text-zinc-400 block">Total KOs</span>
                                                    <span className="text-sm font-mono font-black text-rose-400">
                                                        {s.nightKOs}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/5">
                                                <span className="text-zinc-400 uppercase tracking-wider font-bold text-[9px]">
                                                    Payout Structure:
                                                </span>
                                                <div className="flex items-center gap-1 font-mono font-bold">
                                                    {s.payoutsList.length > 0 ? (
                                                        s.payoutsList.map((amt, idx) => (
                                                            <span
                                                                key={idx}
                                                                className={`px-1.5 py-0.5 rounded text-[9px] ${
                                                                    idx === 0
                                                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                                        : idx === 1
                                                                        ? 'bg-zinc-700/50 text-zinc-200'
                                                                        : 'bg-amber-900/30 text-amber-400/90'
                                                                }`}
                                                            >
                                                                {idx + 1}st: £{amt}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-zinc-400">Recorded in Sheet</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Bottom Summary Strip */}
                            <div className="bg-zinc-900/90 border border-white/10 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-6">
                                    <div>
                                        <span className="text-zinc-400 uppercase text-[10px] font-bold mr-2">Biggest Night:</span>
                                        <span className="font-mono font-black text-emerald-400">£{m.biggestNightlyPot} ({m.biggestPotLabel})</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-400 uppercase text-[10px] font-bold mr-2">Tightest Night:</span>
                                        <span className="font-mono font-bold text-zinc-200">£{m.smallestNightlyPot} ({m.smallestPotLabel})</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-400 uppercase text-[10px] font-bold mr-2">Most Action:</span>
                                        <span className="font-mono font-black text-rose-400">{m.mostKOsInSingleNight} KOs ({m.mostKOsNightLabel})</span>
                                    </div>
                                </div>
                                <div className="font-mono text-[11px] text-amber-300 font-bold">
                                    Grand Final Vault Contribution: £10–£20 / Night → £{totalPot} Total
                                </div>
                            </div>
                        </div>
                    )}

                    {/* =========================================================
                        PAGE 3: LEAGUE PARITY, FINISH DISTRIBUTIONS & SCORING CHARTER
                    ========================================================= */}
                    {page === 3 && (
                        <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
                            {/* Left 7 Cols: Points & Prize Distribution by Finish Position */}
                            <div className="col-span-7 bg-zinc-900/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                                        Season Placement &amp; Bounty Breakdown
                                    </span>
                                    <h3 className="text-base font-serif font-bold text-white mb-3">
                                        Where All {m.totalPointsAwarded} League Points &amp; £{m.totalWinningsPaid.toLocaleString()} Were Won
                                    </h3>

                                    <div className="space-y-2.5">
                                        {([
                                            { pos: 1, label: '1st Place' },
                                            { pos: 2, label: '2nd Place' },
                                            { pos: 3, label: '3rd Place' },
                                            { pos: 4, label: '4th Place' },
                                            { pos: 5, label: '5th Place' },
                                        ] as const).map((tierMeta) => {
                                            const t = m.tierCounts[tierMeta.pos] || {
                                                count: 0,
                                                basePts: 0,
                                                totalPts: 0,
                                                totalCash: 0,
                                            };
                                            const cashSharePct =
                                                m.totalWinningsPaid > 0
                                                    ? Math.round((t.totalCash / m.totalWinningsPaid) * 100)
                                                    : 0;
                                            const ptsSharePct =
                                                m.totalPointsAwarded > 0
                                                    ? Math.round((t.totalPts / m.totalPointsAwarded) * 100)
                                                    : 0;

                                            return (
                                                <div
                                                    key={tierMeta.pos}
                                                    className="bg-black/50 border border-white/10 rounded-xl p-2.5 flex flex-col gap-1.5"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-xs font-black">
                                                                {tierMeta.label}
                                                            </span>
                                                            <span className="text-xs text-zinc-300 font-bold">
                                                                {t.basePts} Base Pts × {t.count} Games
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 font-mono text-xs">
                                                            <span className="text-sky-300 font-black">
                                                                {t.totalPts} PTS ({ptsSharePct}%)
                                                            </span>
                                                            <span className="text-emerald-400 font-black">
                                                                £{t.totalCash.toLocaleString()} ({cashSharePct}%)
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden flex gap-0.5">
                                                        <div
                                                            className="h-full bg-sky-500 rounded-l-full"
                                                            style={{ width: `${ Math.max(4, ptsSharePct) }%` }}
                                                        />
                                                        <div
                                                            className="h-full bg-emerald-500 rounded-r-full"
                                                            style={{ width: `${ Math.max(2, cashSharePct / 2) }%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Knockout Bounty Pool Row */}
                                        <div className="bg-rose-950/25 border border-rose-500/30 rounded-xl p-2.5 flex items-center justify-between">
                                            <div>
                                                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-xs font-black mr-2">
                                                    KO Bounty Pool
                                                </span>
                                                <span className="text-xs text-zinc-300 font-bold">
                                                    1.0 Pt per Elimination × {m.totalKnockouts} KOs
                                                </span>
                                            </div>
                                            <span className="font-mono text-xs font-black text-rose-400">
                                                {m.koPointsTotal} PTS ({m.koPointsShare}% of all League Points)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Expected Value Per Single Seat Benchmark */}
                                <div className="pt-3 border-t border-white/10">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                        Average Single-Entry Seat Benchmark ({m.totalEntries} Total Seats)
                                    </span>
                                    <div className="grid grid-cols-4 gap-2 text-center">
                                        <div className="bg-black/50 border border-white/5 rounded-lg p-2">
                                            <span className="text-[9px] text-zinc-400 uppercase block">Avg Outlay / Seat</span>
                                            <span className="text-sm font-mono font-black text-white">£{m.avgOutlayPerSeat.toFixed(2)}</span>
                                        </div>
                                        <div className="bg-black/50 border border-white/5 rounded-lg p-2">
                                            <span className="text-[9px] text-zinc-400 uppercase block">Avg Return / Seat</span>
                                            <span className="text-sm font-mono font-black text-emerald-400">£{m.avgWinningsPerSeat.toFixed(2)}</span>
                                        </div>
                                        <div className="bg-black/50 border border-white/5 rounded-lg p-2">
                                            <span className="text-[9px] text-zinc-400 uppercase block">Avg Points / Seat</span>
                                            <span className="text-sm font-mono font-black text-sky-300">{m.avgPointsPerSeat.toFixed(1)} PTS</span>
                                        </div>
                                        <div className="bg-black/50 border border-white/5 rounded-lg p-2">
                                            <span className="text-[9px] text-zinc-400 uppercase block">Avg KOs / Seat</span>
                                            <span className="text-sm font-mono font-black text-rose-400">{m.avgKOsPerSeat.toFixed(2)} KOs</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right 5 Cols: League Competitive Parity & Official Charter */}
                            <div className="col-span-5 flex flex-col justify-between gap-3">
                                {/* Competitive Parity Card */}
                                <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                                            Competitive Parity Index
                                        </span>
                                        <h3 className="text-base font-serif font-bold text-white mb-3">
                                            Field Balance Across {m.gamesCompleted} Sessions
                                        </h3>

                                        <div className="grid grid-cols-2 gap-2.5">
                                            <div className="bg-black/50 border border-white/10 rounded-xl p-3">
                                                <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">
                                                    Unique Night Winners
                                                </span>
                                                <div className="text-2xl font-black font-mono text-amber-400 mt-0.5">
                                                    {m.uniqueWinnersCount} <span className="text-xs text-zinc-400 font-sans">/ {m.gamesCompleted} Games</span>
                                                </div>
                                                <span className="text-[10px] text-zinc-400">
                                                    {Math.round((m.uniqueWinnersCount / Math.max(1, m.gamesCompleted)) * 100)}% title variety rate
                                                </span>
                                            </div>

                                            <div className="bg-black/50 border border-white/10 rounded-xl p-3">
                                                <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">
                                                    Unique Podium Finishers
                                                </span>
                                                <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
                                                    {m.podiumFinishersCount} <span className="text-xs text-zinc-400 font-sans">/ {m.activeRosterCount} Active</span>
                                                </div>
                                                <span className="text-[10px] text-zinc-400">
                                                    {Math.round((m.podiumFinishersCount / Math.max(1, m.activeRosterCount)) * 100)}% of active players cashed
                                                </span>
                                            </div>

                                            <div className="bg-black/50 border border-white/10 rounded-xl p-3">
                                                <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">
                                                    In-Profit / Break-Even
                                                </span>
                                                <div className="text-2xl font-black font-mono text-emerald-300 mt-0.5">
                                                    {m.profitableOrEvenCount} <span className="text-xs text-zinc-400 font-sans">Players</span>
                                                </div>
                                                <span className="text-[10px] text-zinc-400">
                                                    Net bankroll &ge; £0 this season
                                                </span>
                                            </div>

                                            <div className="bg-black/50 border border-white/10 rounded-xl p-3">
                                                <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">
                                                    Chasing Recovery
                                                </span>
                                                <div className="text-2xl font-black font-mono text-rose-400 mt-0.5">
                                                    {m.deficitCount} <span className="text-xs text-zinc-400 font-sans">Players</span>
                                                </div>
                                                <span className="text-[10px] text-zinc-400">
                                                    Hunting the £{totalPot} Final Vault
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Official Scoring & Final Stack Conversion Charter */}
                                    <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 mt-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 block mb-1.5">
                                            Official E.P.T. 2026 Scoring &amp; Final Charter
                                        </span>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-zinc-300 font-mono">
                                            <div>• 1st Place: <strong className="text-white">10 PTS</strong></div>
                                            <div>• 2nd Place: <strong className="text-white">6 PTS</strong></div>
                                            <div>• 3rd Place: <strong className="text-white">4 PTS</strong></div>
                                            <div>• 4th Place: <strong className="text-white">3 PTS</strong></div>
                                            <div>• 5th Place: <strong className="text-white">2 PTS</strong></div>
                                            <div>• Knockout: <strong className="text-rose-400">+1 PT / KO</strong></div>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-amber-300 font-mono">
                                            Grand Final Stack Formula: <strong>20,000 Base + (500 × League Points)</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderActiveSlideContent = () => {
        if (!currentSlide) return null;
        const devPageScope =
            currentSlide.type === 'player'
                ? `presentation-page-${currentSlide.page}`
                : currentSlide.type === 'league_stats'
                ? `presentation-league-stats-${currentSlide.page}`
                : `presentation-${currentSlide.type}`;
        const devPageLabel =
            currentSlide.type === 'player'
                ? `Player Dossier • Page ${currentSlide.page}/3`
                : currentSlide.label;

        return (
            <div
                data-dev-page-scope={devPageScope}
                data-dev-page-label={devPageLabel}
                className="flex-1 min-h-0 flex flex-col gap-2.5 w-full overflow-hidden"
            >
                {renderTopLoopControls()}
                {currentSlide.type === 'league_stats' && renderLeagueStatsSlide(currentSlide.page)}
                {currentSlide.type === 'player' && renderPlayerDossierSlide(currentSlide.profile, currentSlide.page)}
                {currentSlide.type === 'tale_of_the_tape' && renderTaleOfTheTapeSlide()}
                {currentSlide.type === 'season_awards' && renderSeasonAwardsSlide()}
                {currentSlide.type === 'stacks_and_payouts' && renderStacksAndPayoutsSlide()}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[60] w-screen h-screen bg-black text-white font-sans flex flex-col justify-between px-4 pt-3 pb-12 select-none overflow-hidden">
            <style>{`
                @keyframes eptTickerScroll {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-50%); }
                }
                .ept-ticker-track {
                    display: flex;
                    width: max-content;
                    /* Slowed down by 75% (from 75s to 300s) for relaxed TV reading */
                    animation: eptTickerScroll 300s linear infinite;
                }
                .ept-ticker-track:hover {
                    animation-play-state: paused;
                }
            `}</style>

            {/* Background Atmosphere Image */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none filter blur-sm"
                style={{ backgroundImage: `url('/images/final/championship_trophy.jpg')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/80 pointer-events-none" />

            {/* TOP BROADCAST HEADER (COMPACT SINGLE-ROW TV BAR) */}
            <header className="relative z-10 flex items-center justify-between gap-4 border-b border-white/10 pb-2 mb-2 shrink-0">
                <div className="flex items-center gap-3">
                    <Link
                        href="/final"
                        className="text-zinc-400 hover:text-white p-2 bg-zinc-900 border border-white/10 rounded-xl transition-colors hover:scale-105"
                        title="Back to Finals Hub"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-ept-red">
                                Live TV Final Table • 3-Page Auto-Looping Player Dossiers
                            </span>
                        </div>
                        <h1 className="text-base sm:text-xl font-black uppercase text-white tracking-tight flex items-center gap-2 italic leading-tight">
                            <span>E.P.T. 2026 Championship Presentation</span>
                            <Crown className="w-4 h-4 text-gold fill-gold/20" />
                        </h1>
                    </div>
                </div>

                {/* Center: Compact Live Blind Clock Pill */}
                <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-zinc-950/90 border border-gold/40 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gold" />
                        <div>
                            <span className="text-[8.5px] font-mono uppercase text-zinc-400 block">
                                Lvl {currentLevel.level} • {currentLevel.sb}/{currentLevel.bb} {currentLevel.ante ? `(${currentLevel.ante})` : ''}
                            </span>
                            <span className="text-sm sm:text-base font-black font-mono text-white tracking-tight">
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsClockRunning(!isClockRunning)}
                        className={`px-2.5 py-1 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1 transition cursor-pointer ${
                            isClockRunning ? 'bg-red-600 text-white' : 'bg-gold text-black'
                        }`}
                    >
                        {isClockRunning ? <Pause size={10} className="fill-current" /> : <Play size={10} className="fill-current" />}
                        <span>{isClockRunning ? 'Pause' : 'Clock'}</span>
                    </button>
                    <div className="h-5 w-[1px] bg-white/10 hidden sm:block" />
                    <div className="hidden sm:block text-right">
                        <span className="text-[8.5px] text-zinc-400 font-bold uppercase block">Prize Vault</span>
                        <span className="text-sm font-black text-gold font-mono">£{effectivePot}</span>
                    </div>
                </div>

                {/* Right: View Switcher & Fullscreen */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setViewMode('showcase')}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition cursor-pointer ${
                                viewMode === 'showcase' ? 'bg-gold text-black shadow' : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            <LayoutGrid size={12} />
                            <span className="hidden md:inline">Player Loop</span>
                        </button>
                        <button
                            onClick={() => setViewMode('split')}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition cursor-pointer ${
                                viewMode === 'split' ? 'bg-gold text-black shadow' : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            <Columns size={12} />
                            <span className="hidden md:inline">Split TV</span>
                        </button>
                        <button
                            onClick={() => setViewMode('clock')}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition cursor-pointer ${
                                viewMode === 'clock' ? 'bg-gold text-black shadow' : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            <Clock size={12} />
                            <span className="hidden md:inline">Timer Only</span>
                        </button>
                    </div>

                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="p-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 rounded-xl transition-all cursor-pointer"
                    >
                        {soundEnabled ? <Volume2 className="w-4 h-4 text-gold" /> : <VolumeX className="w-4 h-4" />}
                    </button>

                    <button
                        onClick={handleFullscreen}
                        className="p-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 rounded-xl transition-all hover:scale-105 cursor-pointer"
                        title="Toggle Fullscreen TV Mode"
                    >
                        <Maximize className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* MAIN ZERO-SCROLL TV STAGE */}
            <main className="relative z-10 flex-1 min-h-0 flex flex-col overflow-hidden">
                {viewMode === 'showcase' && renderActiveSlideContent()}

                {viewMode === 'split' && (
                    <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 overflow-hidden">
                        <div className="col-span-3 h-full min-h-0 flex flex-col justify-between gap-3 overflow-hidden">
                            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-zinc-950/95 to-black rounded-3xl border-2 border-gold/40 shadow-[0_0_60px_rgba(212,175,55,0.2)] relative overflow-hidden">
                                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-gold/10 border border-gold/40 rounded-full mb-1 text-gold text-[10px] font-black uppercase tracking-widest">
                                    <Flame className="w-3 h-3 fill-current" />
                                    <span>Level {currentLevel.level} of {BLIND_LEVELS.length}</span>
                                </div>

                                <div className="text-5xl xl:text-6xl font-black font-mono tracking-tighter text-white drop-shadow-[0_0_35px_rgba(255,215,0,0.35)] my-1">
                                    {formatTime(timeLeft)}
                                </div>

                                <div className="grid grid-cols-3 gap-2 w-full mt-2 text-center">
                                    <div className="p-2 bg-zinc-900/90 border border-gold/30 rounded-xl">
                                        <span className="text-[8px] text-zinc-400 font-bold uppercase block">Small</span>
                                        <span className="text-base font-black text-gold font-mono">{currentLevel.sb}</span>
                                    </div>
                                    <div className="p-2 bg-zinc-900/90 border border-gold/30 rounded-xl">
                                        <span className="text-[8px] text-zinc-400 font-bold uppercase block">Big</span>
                                        <span className="text-base font-black text-gold font-mono">{currentLevel.bb}</span>
                                    </div>
                                    <div className="p-2 bg-zinc-900/90 border border-white/10 rounded-xl">
                                        <span className="text-[8px] text-zinc-400 font-bold uppercase block">Ante</span>
                                        <span className="text-base font-black text-amber-500 font-mono">{currentLevel.ante || '-'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 mt-3">
                                    <button
                                        onClick={() => {
                                            if (currentLevelIdx > 0) {
                                                setCurrentLevelIdx(prev => prev - 1);
                                                setTimeLeft(BLIND_LEVELS[currentLevelIdx - 1].duration);
                                            }
                                        }}
                                        disabled={currentLevelIdx === 0}
                                        className="p-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-white/10 rounded-xl text-zinc-300 cursor-pointer"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setIsClockRunning(!isClockRunning)}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black uppercase text-xs tracking-wider cursor-pointer ${
                                            isClockRunning ? 'bg-red-600 text-white' : 'bg-gold text-black'
                                        }`}
                                    >
                                        {isClockRunning ? <Pause size={12} className="fill-current" /> : <Play size={12} className="fill-current" />}
                                        <span>{isClockRunning ? 'Pause' : 'Start'}</span>
                                    </button>
                                    <button
                                        onClick={() => setTimeLeft(currentLevel.duration)}
                                        className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-zinc-300 cursor-pointer"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (currentLevelIdx < BLIND_LEVELS.length - 1) {
                                                setCurrentLevelIdx(prev => prev + 1);
                                                setTimeLeft(BLIND_LEVELS[currentLevelIdx + 1].duration);
                                            }
                                        }}
                                        disabled={currentLevelIdx === BLIND_LEVELS.length - 1}
                                        className="p-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-white/10 rounded-xl text-zinc-300 cursor-pointer"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-3 bg-zinc-950/95 border border-white/10 rounded-3xl space-y-2 shrink-0">
                                <div className="flex items-center justify-between text-xs font-black uppercase">
                                    <span className="text-white flex items-center gap-1.5">
                                        <Users size={13} className="text-gold" />
                                        <span>Live Table Status</span>
                                    </span>
                                    <span className="text-green-400 font-mono">{remainingCount}/{players.length} In Play</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {players.map(p => {
                                        const isOut = !!eliminatedPlayers[p.name];
                                        return (
                                            <button
                                                key={p.name}
                                                onClick={() => toggleEliminate(p.name)}
                                                className={`flex items-center justify-between px-2 py-1.5 rounded-xl border text-left transition cursor-pointer ${
                                                    isOut
                                                        ? 'bg-zinc-950 border-red-900/40 opacity-40'
                                                        : 'bg-zinc-900/80 border-white/10 hover:border-gold/40'
                                                }`}
                                            >
                                                <span className={`text-[11px] font-bold truncate ${isOut ? 'line-through text-zinc-500' : 'text-white'}`}>
                                                    #{p.rank} {p.name.split(' ')[0]}
                                                </span>
                                                <span className="text-[9px] font-mono">{isOut ? '💀' : '🟢'}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="col-span-9 h-full min-h-0 flex flex-col overflow-hidden">
                            {renderActiveSlideContent()}
                        </div>
                    </div>
                )}

                {viewMode === 'clock' && (
                    <div className="flex-1 min-h-0 grid grid-cols-12 gap-6 items-stretch overflow-hidden">
                        <div className="col-span-7 h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-zinc-950/95 to-black rounded-3xl border-2 border-gold/40 shadow-[0_0_100px_rgba(212,175,55,0.2)] relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-80" />
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/40 rounded-full mb-2 text-gold text-xs font-black uppercase tracking-widest">
                                <Flame className="w-3.5 h-3.5 fill-current" />
                                <span>Level {currentLevel.level} of {BLIND_LEVELS.length}</span>
                            </div>
                            <div className="text-7xl xl:text-9xl font-black font-mono tracking-tighter text-white drop-shadow-[0_0_50px_rgba(255,215,0,0.35)] my-2">
                                {formatTime(timeLeft)}
                            </div>
                            <div className="grid grid-cols-3 gap-4 w-full max-w-xl mt-3 text-center">
                                <div className="p-4 bg-zinc-900/90 border border-gold/30 rounded-2xl shadow-md">
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Small Blind</span>
                                    <span className="text-2xl sm:text-3xl font-black text-gold font-mono">{currentLevel.sb}</span>
                                </div>
                                <div className="p-4 bg-zinc-900/90 border border-gold/30 rounded-2xl shadow-md">
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Big Blind</span>
                                    <span className="text-2xl sm:text-3xl font-black text-gold font-mono">{currentLevel.bb}</span>
                                </div>
                                <div className="p-4 bg-zinc-900/90 border border-white/10 rounded-2xl shadow-md">
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Ante</span>
                                    <span className="text-2xl sm:text-3xl font-black text-amber-500 font-mono">{currentLevel.ante || '-'}</span>
                                </div>
                            </div>
                            {nextLevel && (
                                <div className="mt-4 text-xs font-mono text-zinc-400 font-bold">
                                    Next Level: <span className="text-gold font-black">{nextLevel.sb} / {nextLevel.bb}</span> (Ante: {nextLevel.ante || 0})
                                </div>
                            )}
                            <div className="flex items-center gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        if (currentLevelIdx > 0) {
                                            setCurrentLevelIdx(prev => prev - 1);
                                            setTimeLeft(BLIND_LEVELS[currentLevelIdx - 1].duration);
                                        }
                                    }}
                                    disabled={currentLevelIdx === 0}
                                    className="p-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-white/10 rounded-2xl text-zinc-300 transition-all hover:scale-105 cursor-pointer"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setIsClockRunning(!isClockRunning)}
                                    className={`flex items-center gap-2 px-7 py-3 rounded-2xl font-black uppercase text-sm tracking-wider transition-all transform hover:scale-105 cursor-pointer ${
                                        isClockRunning
                                            ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_30px_rgba(220,38,38,0.5)]'
                                            : 'bg-gold hover:bg-yellow-400 text-black shadow-[0_0_30px_rgba(212,175,55,0.5)]'
                                    }`}
                                >
                                    {isClockRunning ? (
                                        <>
                                            <Pause className="w-5 h-5 fill-current" />
                                            <span>Pause Clock</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-5 h-5 fill-current" />
                                            <span>Start Clock</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setTimeLeft(currentLevel.duration)}
                                    className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-2xl text-zinc-300 transition-all hover:scale-105 cursor-pointer"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => {
                                        if (currentLevelIdx < BLIND_LEVELS.length - 1) {
                                            setCurrentLevelIdx(prev => prev + 1);
                                            setTimeLeft(BLIND_LEVELS[currentLevelIdx + 1].duration);
                                        }
                                    }}
                                    disabled={currentLevelIdx === BLIND_LEVELS.length - 1}
                                    className="p-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-white/10 rounded-2xl text-zinc-300 transition-all hover:scale-105 cursor-pointer"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="col-span-5 h-full p-5 bg-zinc-950/95 border border-white/10 rounded-3xl flex flex-col justify-between overflow-hidden shadow-2xl">
                            <div className="flex items-center justify-between pb-2.5 border-b border-white/10 shrink-0">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-gold" />
                                    <h3 className="text-base font-black uppercase text-white tracking-wider">Final Table Roster</h3>
                                </div>
                                <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/30 rounded-lg text-xs font-mono font-bold text-green-400">
                                    {remainingCount} / {players.length} Remaining
                                </span>
                            </div>

                            <div className="flex-1 min-h-0 grid grid-cols-2 gap-2 pt-3 content-stretch overflow-hidden">
                                {players.map((p, i) => {
                                    const isOut = !!eliminatedPlayers[p.name];
                                    return (
                                        <div
                                            key={p.name}
                                            onClick={() => toggleEliminate(p.name)}
                                            className={`relative flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                                                isOut
                                                    ? 'bg-zinc-950/80 border-red-950/50 opacity-40'
                                                    : i === 0
                                                    ? 'bg-gradient-to-r from-gold/15 to-black/80 border-gold/50'
                                                    : 'bg-zinc-900/80 border-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`relative w-10 h-10 rounded-xl overflow-hidden border shrink-0 bg-zinc-900 ${
                                                    isOut ? 'border-red-600 grayscale' : i === 0 ? 'border-gold' : 'border-white/20'
                                                }`}>
                                                    <img
                                                        src={getAvatarFilename(p.name)}
                                                        alt={p.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="text-xs font-extrabold uppercase truncate text-white">
                                                        #{p.rank} {p.name.split(' ')[0]}
                                                    </div>
                                                    <span className="text-[10px] font-mono text-zinc-400 font-semibold block">
                                                        {p.points}p • {p.knockOuts}☠️
                                                    </span>
                                                </div>
                                            </div>

                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                                isOut
                                                    ? 'bg-red-950/80 text-red-400 border-red-800'
                                                    : 'bg-green-950/80 text-green-400 border-green-700/50'
                                            }`}>
                                                {isOut ? 'OUT' : 'IN'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* OPTION 4: SKY SPORTS / ESPN SCROLLING NEWS TICKER FOOTER (SLOWED BY 75%) */}
            <footer className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t-2 border-gold/60 shadow-[0_-10px_30px_rgba(0,0,0,0.9)] flex items-center h-10 overflow-hidden">
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-amber-600 text-white font-black text-xs uppercase tracking-widest px-4 h-full flex items-center gap-2 shrink-0 z-20 shadow-[5px_0_15px_rgba(0,0,0,0.8)] border-r border-white/20">
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>E.P.T. LIVE WIRE</span>
                </div>

                <div className="flex-1 overflow-hidden relative h-full flex items-center">
                    <div className="ept-ticker-track items-center gap-8 px-4">
                        {[...tickerHeadlines, ...tickerHeadlines].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2.5 shrink-0">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider ${item.tagColor}`}>
                                    {item.tag}
                                </span>
                                <span className="text-xs sm:text-sm font-mono text-zinc-200 font-semibold whitespace-nowrap">
                                    {item.text}
                                </span>
                                <span className="text-gold/50 font-black mx-2">★</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hidden xl:flex items-center gap-2 px-4 h-full bg-black border-l border-white/10 text-[10px] font-mono text-zinc-400 shrink-0 z-20">
                    <span className="text-gold font-bold">[SPACE]</span> Pause
                    <span>•</span>
                    <span className="text-gold font-bold">[←/→]</span> Page
                </div>
            </footer>
        </div>
    );
}
