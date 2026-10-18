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
    { label: '10s', seconds: 10 },
    { label: '15s', seconds: 15 },
    { label: '20s', seconds: 20 },
    { label: '30s', seconds: 30 },
    { label: '45s', seconds: 45 },
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
    | { type: 'player'; profile: ComputedPlayerProfile; id: string; label: string; badge: string }
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
    const cx = 120;
    const cy = 115;
    const radius = 74;
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
        <div className="flex flex-col items-center justify-center">
            <svg viewBox="0 0 240 230" className="w-full max-w-[235px] h-auto overflow-visible">
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
                            stroke="rgba(255,255,255,0.12)"
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
                            stroke="rgba(255,255,255,0.12)"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* League Average Baseline Polygon */}
                <polygon
                    points={avgPolygonPoints}
                    fill="rgba(56,189,248,0.08)"
                    stroke="rgba(56,189,248,0.5)"
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
                    const labelPt = getPoint(i, 1.26);
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
                                y={labelPt.y - 4}
                                textAnchor="middle"
                                className="fill-zinc-300 font-mono font-bold text-[8.5px] uppercase"
                            >
                                {attr.shortLabel}
                            </text>
                            <text
                                x={labelPt.x}
                                y={labelPt.y + 7}
                                textAnchor="middle"
                                className="fill-gold font-mono font-black text-[9.5px]"
                            >
                                {attr.value}
                            </text>
                        </g>
                    );
                })}
            </svg>
            <div className="flex items-center gap-4 text-[10px] font-mono mt-1">
                <span className="flex items-center gap-1.5 text-gold font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-gold inline-block" />
                    Player DNA
                </span>
                <span className="flex items-center gap-1.5 text-sky-400">
                    <span className="w-2.5 h-0.5 border-t border-dashed border-sky-400 inline-block" />
                    League Avg
                </span>
            </div>
        </div>
    );
}

function ProfitSparklineChart({ points }: { points: { label: string; value: number }[] }) {
    const width = 300;
    const height = 135;
    const padX = 28;
    const padY = 22;

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
        <div className="w-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                {/* Zero Break-Even Line */}
                <line
                    x1={padX}
                    y1={zeroY}
                    x2={width - padX}
                    y2={zeroY}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                />
                <text
                    x={padX - 4}
                    y={zeroY + 3}
                    textAnchor="end"
                    className="fill-zinc-500 font-mono text-[8px]"
                >
                    £0
                </text>

                {/* Trajectory Line */}
                {points.length > 1 && (
                    <polyline
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="2.5"
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
                                r="3.5"
                                fill={nodePositive ? '#4ade80' : '#f87171'}
                                stroke="#09090b"
                                strokeWidth="1.5"
                            />
                            {(i === 0 || i === points.length - 1 || points.length <= 8) && (
                                <text
                                    x={c.x}
                                    y={c.y - 7}
                                    textAnchor="middle"
                                    className={`font-mono font-bold text-[8px] ${
                                        nodePositive ? 'fill-emerald-400' : 'fill-rose-400'
                                    }`}
                                >
                                    {pt.value >= 0 ? `+£${pt.value}` : `-£${Math.abs(pt.value)}`}
                                </text>
                            )}
                            <text
                                x={c.x}
                                y={height - 5}
                                textAnchor="middle"
                                className="fill-zinc-500 font-mono text-[8px]"
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
    players,
    totalPot,
    history = [],
    reports = []
}: Props) {
    // Broadcast View Mode: 'showcase' (Auto-Loop Full Broadcast), 'split' (Timer + Loop), 'clock' (Timer + Roster)
    const [viewMode, setViewMode] = useState<'showcase' | 'split' | 'clock'>('showcase');

    // Auto-Loop Presentation State
    const [activeSlideIdx, setActiveSlideIdx] = useState(0);
    const [isLooping, setIsLooping] = useState(true);
    const [loopDurationSec, setLoopDurationSec] = useState(15);
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

            if (highestWinAmount === 0 && (p.winnings || 0) > 0) {
                const maxCf = Math.max(...(p.cashFlowHistory || []).map(c => c.profit + 20), 0);
                highestWinAmount = maxCf > 0
                    ? Math.min(p.winnings, maxCf)
                    : Math.round(p.winnings / Math.max(1, p.wins || 1));
                highestWinLabel = 'Season High Payout';
            }

            if (mostKOsInGame === 0 && (p.knockOuts || 0) > 0) {
                mostKOsInGame = Math.max(1, Math.ceil((p.knockOuts || 0) / Math.max(1, p.gamesPlayed || 1)));
                mostKOsLabel = 'Peak League Session';
            } else if (mostKOsInGame > 0 && p.knockOuts > 0 && mostKOsInGame > p.knockOuts) {
                mostKOsInGame = p.knockOuts;
            }

            let bestPosition: number | null = null;
            let worstPosition: number | null = null;
            let worstPositionLabel = p.gamesPlayed === 0 ? 'Did Not Play Any Games' : 'Across League Play';

            if (validPlaces.length > 0) {
                const sortedAsc = [...validPlaces].sort((a, b) => a.place - b.place);
                bestPosition = sortedAsc[0].place;
                const sortedDesc = [...validPlaces].sort((a, b) => b.place - a.place);
                worstPosition = sortedDesc[0].place;
                worstPositionLabel = `Game ${sortedDesc[0].gameNum} (${sortedDesc[0].date})`;
            } else if (p.gamesPlayed > 0) {
                if ((p.wins || 0) > 0) bestPosition = 1;
                else if ((p.winnings || 0) > 0) bestPosition = 2;
                else if (p.avgFinishPosition && p.avgFinishPosition > 0) {
                    bestPosition = Math.max(1, Math.floor(p.avgFinishPosition - 1));
                } else {
                    bestPosition = 4;
                }

                if (p.avgFinishPosition && p.avgFinishPosition > 0) {
                    worstPosition = Math.min(11, Math.max(bestPosition, Math.ceil(p.avgFinishPosition + 2)));
                } else {
                    worstPosition = Math.min(10, Math.max(5, p.gamesPlayed + 3));
                }
            }

            if ((p.wins || 0) > 0 && (bestPosition === null || bestPosition > 1)) {
                bestPosition = 1;
            }

            const avgFinish =
                p.avgFinishPosition && p.avgFinishPosition > 0
                    ? p.avgFinishPosition
                    : validPlaces.length > 0
                    ? Number((validPlaces.reduce((acc, v) => acc + v.place, 0) / validPlaces.length).toFixed(1))
                    : 0;

            const podiumCountFromHistory = validPlaces.filter(v => v.place <= 3).length;
            const podiumCount = Math.max(podiumCountFromHistory, p.wins || 0);
            const podiumRate = p.gamesPlayed > 0 ? Math.round((podiumCount / p.gamesPlayed) * 100) : 0;

            const winRate =
                p.winPercentage && p.winPercentage > 0
                    ? Math.round(p.winPercentage)
                    : p.gamesPlayed > 0
                    ? Math.round(((p.wins || 0) / p.gamesPlayed) * 100)
                    : 0;

            const bubbleFromHistory = validPlaces.filter(v => v.place === 4).length;
            const bubbleCount = p.bubbleFinishes !== undefined && p.bubbleFinishes > 0 ? p.bubbleFinishes : bubbleFromHistory;

            const maxRebuysSingle =
                p.mostRebuysSingle !== undefined && p.mostRebuysSingle > 0
                    ? p.mostRebuysSingle
                    : (p.rebuys || 0) > 0
                    ? Math.max(1, Math.ceil((p.rebuys || 0) / Math.max(1, Math.floor(p.gamesPlayed / 2))))
                    : 0;

            const timesEliminated =
                p.totalTimesKnockedOut !== undefined && p.totalTimesKnockedOut > 0
                    ? p.totalTimesKnockedOut
                    : Math.max(0, (p.gamesPlayed - (p.wins || 0)) + (p.rebuys || 0));

            const survivalRate =
                p.gamesPlayed > 0
                    ? Math.max(0, Math.min(100, Math.round(((p.gamesPlayed - Math.min(p.gamesPlayed, p.rebuys || 0)) / p.gamesPlayed) * 100)))
                    : 0;

            const cashPaid = p.cashPaid && p.cashPaid > 0 ? p.cashPaid : (p.gamesPlayed * 20 + (p.rebuys || 0) * 10 + (p.addOns || 0) * 10);
            const roiPct = cashPaid > 0 ? Math.round((p.profit / cashPaid) * 100) : 0;

            // Build cumulative profit sparkline points
            const cumulativeProfitPoints: { label: string; value: number }[] = [{ label: 'Start', value: 0 }];
            if (p.cashFlowHistory && p.cashFlowHistory.length > 0) {
                let running = 0;
                p.cashFlowHistory.forEach((cf, idx) => {
                    running += cf.profit;
                    cumulativeProfitPoints.push({
                        label: `G${idx + 1}`,
                        value: running
                    });
                });
            } else {
                const playedSessions = sessionLog.filter(s => s.played);
                if (playedSessions.length > 0) {
                    let running = 0;
                    const avgBuyInPerGame = p.gamesPlayed > 0 ? cashPaid / p.gamesPlayed : 20;
                    playedSessions.forEach(s => {
                        running += Math.round(s.winnings - avgBuyInPerGame);
                        cumulativeProfitPoints.push({
                            label: `G${s.gameNumber}`,
                            value: running
                        });
                    });
                    // Align final node with official net profit
                    cumulativeProfitPoints[cumulativeProfitPoints.length - 1].value = p.profit;
                } else {
                    cumulativeProfitPoints.push({ label: 'Now', value: p.profit });
                }
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
                timesEliminated,
                survivalRate,
                cashPaid,
                roiPct
            };
        });

        const maxLeaguePoints = Math.max(...rawMetrics.map(m => m.p.points || 0), 1);
        const maxLeagueProfit = Math.max(...rawMetrics.map(m => m.p.profit || 0), 1);
        const maxLeagueSingleWin = Math.max(...rawMetrics.map(m => m.highestWinAmount), 1);
        const maxLeagueGrossWinnings = Math.max(...rawMetrics.map(m => m.p.winnings || 0), 1);
        const maxLeagueSingleKOs = Math.max(...rawMetrics.map(m => m.mostKOsInGame), 1);
        const maxLeagueTotalKOs = Math.max(...rawMetrics.map(m => m.p.knockOuts || 0), 1);
        const maxLeagueWins = Math.max(...rawMetrics.map(m => m.p.wins || 0), 1);
        const maxLeagueRebuys = Math.max(...rawMetrics.map(m => m.p.rebuys || 0), 1);
        const maxLeagueBonusChips = Math.max(...rawMetrics.map(m => m.p.bonusChips || 0), 1);
        const worstLeaguePos = Math.max(...rawMetrics.map(m => m.worstPosition || 0), 1);

        return rawMetrics.map(m => {
            const { p } = m;
            const nameLower = p.name.toLowerCase();
            const attendancePct = Math.min(100, Math.round((p.gamesPlayed / totalSeasonGames) * 100));

            let archetypeBadge = '♠️ CHAMPIONSHIP CONTENDER';
            let archetypeColor = 'border-gold/60 bg-gold/15 text-gold';
            let fearLevel = 'Calculated Threat';
            let quote = 'Every chip at this table has my name on it.';
            let customIntro = '';

            if (p.gamesPlayed === 0) {
                archetypeBadge = '🚨 M.I.A. / GHOST PROTOCOL';
                archetypeColor = 'border-red-500 bg-red-950/60 text-red-400';
                fearLevel = '100% Paralyzed by Fear';
                quote = "You can't lose your buy-in if you never leave the sofa.";
                customIntro = `${p.name} has operated in complete ghost mode throughout the 2026 E.P.T. season, logging zero appearances, zero buy-ins, and zero hands dealt.`;
            } else if (p.gamesPlayed === 1) {
                archetypeBadge = '🎒 ONE-AND-DONE TOURIST';
                archetypeColor = 'border-orange-500 bg-orange-950/60 text-orange-300';
                fearLevel = 'Traumatized After 1 Session';
                quote = 'Came once, saw the carnage, entered Witness Protection.';
                customIntro = `${p.name} made a single cameo appearance this season (${attendancePct}% attendance), witnessed the ruthless aggression of the E.P.T. regulars firsthand, and immediately retreated into the shadows.`;
            } else if (nameLower.includes('liam') || p.rank === 1) {
                archetypeBadge = '🦈 LEAGUE APEX PREDATOR';
                archetypeColor = 'border-gold bg-gold/20 text-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]';
                fearLevel = 'Maximum Table Terror';
                quote = "I didn't come to play cards — I came to collect bounties.";
                customIntro = `Sitting at Rank #${p.rank} with ${p.points} points across ${p.gamesPlayed} appearances (${attendancePct}% attendance), ${p.name} has terrorized the 2026 season as the undisputed Apex Predator of the league.`;
            } else if (nameLower.includes('edward')) {
                archetypeBadge = '⚖️ THE BOUNTY WARLORD';
                archetypeColor = 'border-gold/80 bg-amber-950/50 text-gold';
                fearLevel = 'Ice-Cold Strategist';
                quote = 'Maximum psychological warfare, surgical championship focus.';
                customIntro = `Holding Rank #${p.rank} with ${p.points} championship points across ${p.gamesPlayed} games (${attendancePct}% attendance), ${p.name} ("The Bounty") has anchored the top tier of the standings all season with ironclad consistency.`;
            } else if (nameLower.includes('luke') || (p.rebuys || 0) >= 3) {
                archetypeBadge = '🏦 HIGH-ACTION REBUY KING';
                archetypeColor = 'border-blue-400 bg-blue-950/50 text-blue-300';
                fearLevel = 'Zero Fear / Maximum Gamble';
                quote = 'Another rebuy? Stick it on my tab and deal the cards.';
                customIntro = `Ranked #${p.rank} with ${p.points} points over ${p.gamesPlayed} sessions (${attendancePct}% attendance), ${p.name} brings fearless, high-octane action to every pot—never hesitating to reload the clip and turn a short stack into a podium run.`;
            } else if (nameLower.includes('blackburn')) {
                archetypeBadge = '🧠 THE POKER CHEAT CODE';
                archetypeColor = 'border-emerald-400 bg-emerald-950/50 text-emerald-300';
                fearLevel = 'Terrifyingly Clinical';
                quote = 'Show up, take the trophy, cash the cheque.';
                customIntro = `At Rank #${p.rank} with ${p.points} points in just ${p.gamesPlayed} appearances (${attendancePct}% attendance), ${p.name} ("The Professor") has posted one of the most lethal efficiency ratings in E.P.T. history.`;
            } else if (nameLower.includes('georgina')) {
                archetypeBadge = '🛡️ THE IRON DUCHESS';
                archetypeColor = 'border-purple-400 bg-purple-950/50 text-purple-300';
                fearLevel = 'Unshakable Patience';
                quote = '100% attendance and iron discipline while the boys punt off stacks.';
                customIntro = `Occupying Rank #${p.rank} with ${p.points} points across ${p.gamesPlayed} games (${attendancePct}% attendance), ${p.name} has demonstrated rock-solid tournament patience, surviving chaotic multi-way all-ins to climb the points ladder.`;
            } else if (nameLower.includes('horne')) {
                archetypeBadge = '🎯 THE GHOST HITMAN';
                archetypeColor = 'border-cyan-400 bg-cyan-950/50 text-cyan-300';
                fearLevel = 'Silent Assassin';
                quote = 'In, out, trophy secured, nobody sees me coming.';
                customIntro = `Sitting at Rank #${p.rank} with ${p.points} points across ${p.gamesPlayed} selective appearances (${attendancePct}% attendance), ${p.name} operates like a hired sniper—dropping in unannounced to raid the prize pot.`;
            } else if (nameLower.includes('chris')) {
                archetypeBadge = '🎲 THE LOOSE CANNON WILDCARD';
                archetypeColor = 'border-amber-400 bg-amber-950/50 text-amber-300';
                fearLevel = 'Unpredictable Chaos';
                quote = 'Any two cards can win if you bet hard enough.';
                customIntro = `Ranked #${p.rank} with ${p.points} points across ${p.gamesPlayed} appearances (${attendancePct}% attendance), ${p.name} is the ultimate table wildcard—capable of cracking pocket aces and swinging any final table.`;
            } else if (nameLower.includes('taylor')) {
                archetypeBadge = '⛏️ THE BLUE-COLLAR GRINDER';
                archetypeColor = 'border-zinc-400 bg-zinc-900/70 text-zinc-200';
                fearLevel = 'Resilient Veteran';
                quote = 'Keep grinding the blinds until the deck catches fire.';
                customIntro = `Holding Rank #${p.rank} with ${p.points} points across ${p.gamesPlayed} sessions (${attendancePct}% attendance), ${p.name} has battled through the trenches of the 2026 season as a true grinder.`;
            } else if (nameLower.includes('nathen') || nameLower.includes('nathan')) {
                archetypeBadge = '❤️ THE PRIZE POOL PHILANTHROPIST';
                archetypeColor = 'border-rose-400 bg-rose-950/50 text-rose-300';
                fearLevel = 'Dangerous Underdog';
                quote = "I'm just building up karma for the Grand Final.";
                customIntro = `At Rank #${p.rank} with ${p.points} points across ${p.gamesPlayed} games (${attendancePct}% attendance), ${p.name} has generously sponsored the E.P.T. prize vault this season, making him the ultimate dark-horse underdog.`;
            } else {
                customIntro = `Ranked #${p.rank} with ${p.points} points across ${p.gamesPlayed} games (${attendancePct}% attendance), ${p.name} enters the championship spotlight ready to rewrite the standings.`;
            }

            const nemesisName =
                p.rivalPlayer && p.rivalPlayer !== 'None' && p.rivalPlayer !== 'N/A'
                    ? p.rivalPlayer
                    : p.archNemesis?.name && p.archNemesis.name !== 'None'
                    ? p.archNemesis.name
                    : 'The Poker Gods';

            const pigeonName =
                p.bulliedPlayer && p.bulliedPlayer !== 'None' && p.bulliedPlayer !== 'N/A'
                    ? p.bulliedPlayer
                    : 'Short Stacks';

            const avgPts = p.gamesPlayed > 0 ? (p.avgPoints || p.points / p.gamesPlayed).toFixed(1) : '0.0';
            const avgWin = p.gamesPlayed > 0 ? (p.avgWinnings || p.winnings / p.gamesPlayed).toFixed(0) : '0';
            const koRatio = p.gamesPlayed > 0 ? (p.koToGameRatio || p.knockOuts / p.gamesPlayed).toFixed(2) : '0.00';

            // Compute 6-Axis Poker DNA Radar Scores (0 to 100)
            const agrScore = p.gamesPlayed === 0 ? 10 : Math.min(100, Math.max(20, Math.round(((p.aggressionFactor || 1.8) / 4.2) * 70 + ((p.vpip || 24) / 48) * 30)));
            const koScore = p.gamesPlayed === 0 ? 5 : Math.min(100, Math.max(15, Math.round(((p.knockOuts || 0) / maxLeagueTotalKOs) * 75 + (m.mostKOsInGame / maxLeagueSingleKOs) * 25)));
            const roiScore = p.gamesPlayed === 0 ? 30 : Math.min(100, Math.max(15, Math.round(50 + (m.roiPct * 0.45) + ((m.highestWinAmount / maxLeagueSingleWin) * 20))));
            const srvScore = p.gamesPlayed === 0 ? 50 : Math.min(100, Math.max(20, m.survivalRate));
            const conScore = p.gamesPlayed === 0 ? 10 : Math.min(100, Math.max(20, Math.round((m.podiumRate * 0.6) + (m.avgFinish > 0 ? Math.max(0, (10 - m.avgFinish) * 4.5) : 20))));
            const attScore = Math.max(10, attendancePct);

            const radarAttributes: RadarAttribute[] = [
                { axis: 'Aggression', shortLabel: 'AGR', value: agrScore, avg: 58 },
                { axis: 'Bounty Hunting', shortLabel: 'KOs', value: koScore, avg: 52 },
                { axis: 'Cash & ROI', shortLabel: 'ROI', value: roiScore, avg: 50 },
                { axis: 'Survival', shortLabel: 'SRV', value: srvScore, avg: 62 },
                { axis: 'Consistency', shortLabel: 'CON', value: conScore, avg: 55 },
                { axis: 'Attendance', shortLabel: 'ATT', value: attScore, avg: 68 },
            ];

            const reportParagraphs = [
                {
                    title: 'I. Season Campaign & Standings Verdict',
                    text: `${customIntro} Averaging ${avgPts} points per game, they currently sit ${
                        leaderPoints - p.points === 0
                            ? 'at the very summit of the league table as the #1 seed'
                            : `${leaderPoints - p.points} points behind the #1 leaderboard spot`
                    } and bring +${(p.bonusChips || 0).toLocaleString()} earned bonus chips into the Grand Final.`
                },
                {
                    title: 'II. Financial Ledger & Highest Win Record',
                    text:
                        p.gamesPlayed > 0
                            ? `Across ${p.gamesPlayed} sessions, ${p.name} has invested £${m.cashPaid} into the league pot (including ${p.rebuys || 0} rebuys and ${p.addOns || 0} add-ons) and collected £${p.winnings || 0} in gross prize money for a net season balance of ${
                                  p.profit >= 0 ? `+£${p.profit}` : `-£${Math.abs(p.profit)}`
                              } (${m.roiPct >= 0 ? `+${m.roiPct}%` : `${m.roiPct}%`} ROI, £${avgWin} avg cash/game). Their highest single-game win stands at £${m.highestWinAmount} (${m.highestWinLabel}).`
                            : `With £0 invested and £0 cashed, ${p.name} has yet to register a single-game payout or financial swing on the 2026 ledger.`
                },
                {
                    title: 'III. Placement Trajectory — Best, Worst & Bubbles',
                    text:
                        p.gamesPlayed > 0
                            ? `In tournament placement telemetry, ${p.name} boasts a Best Finish of ${formatOrdinal(m.bestPosition)} (${p.wins || 0} tournament ${
                                  p.wins === 1 ? 'victory' : 'victories'
                              }, ${m.winRate}% win rate) and ${m.podiumCount} top-3 podium finishes (${m.podiumRate}% podium rate). On the flip side, their Worst Finish Position of the season was ${formatOrdinal(m.worstPosition)} (${m.worstPositionLabel}), with an overall Average Finish Position of ${m.avgFinish.toFixed(1)} and ${m.bubbleCount} agonizing 4th-place Bubble ${
                                  m.bubbleCount === 1 ? 'finish' : 'finishes'
                              }.`
                            : `No finishing positions have been logged this season—meaning no podiums, no bubbles, and no last-place walks of shame.`
                },
                {
                    title: 'IV. Combat Telemetry, Knockouts & Rivalry Intelligence',
                    text:
                        p.gamesPlayed > 0
                            ? `On the combat front, ${p.name} has racked up ${p.knockOuts || 0} total knockouts (${koRatio} KOs/game), highlighted by a single-game record of ${m.mostKOsInGame} KOs in one night (${m.mostKOsLabel}). They have been eliminated ${m.timesEliminated} times (${m.survivalRate}% single-bullet survival, max ${m.maxRebuysSingle} rebuys in a game) while playing with an estimated ${p.vpip || 24}% VPIP and ${p.aggressionFactor || 1.8} Aggression Factor. Their fiercest Arch-Nemesis is ${nemesisName}, while their favorite target ("Pigeon") at the felt is ${pigeonName}.`
                            : `Zero knockouts delivered and zero times eliminated. Their Arch-Nemesis remains the calendar, and their Grand Final strategy remains a complete mystery.`
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
                    value: m.worstPosition ? `${formatOrdinal(m.worstPosition)} 💀` : 'DNS',
                    subtext: m.worstPositionLabel,
                    category: 'placement',
                    highlightColor: 'text-orange-400 border-orange-500/30 bg-orange-950/20',
                    isLeagueRecord: m.worstPosition === worstLeaguePos && (m.worstPosition || 0) >= 8,
                    recordLabel: '⚓ ANCHOR RECORD'
                },
                {
                    id: 'best-pos',
                    label: '5. Best Finish Position',
                    value: m.bestPosition ? `${formatOrdinal(m.bestPosition)} ${m.bestPosition === 1 ? '🏆' : '🏅'}` : 'DNS',
                    subtext: `${p.wins || 0}x 1st Place Titles`,
                    category: 'placement',
                    highlightColor: 'text-yellow-300 border-yellow-500/30 bg-yellow-950/20',
                    isLeagueRecord: (p.wins || 0) === maxLeagueWins && (p.wins || 0) > 0,
                    recordLabel: '👑 MOST TITLES'
                },
                {
                    id: 'avg-pos',
                    label: '6. Average Finish Position',
                    value: m.avgFinish > 0 ? `${m.avgFinish.toFixed(1)}th` : 'N/A',
                    subtext: `Across ${p.gamesPlayed} League Appearances`,
                    category: 'placement',
                    highlightColor: 'text-cyan-300 border-cyan-500/30 bg-cyan-950/20'
                },
                {
                    id: 'net-profit',
                    label: '7. Net Season Profit',
                    value: p.profit >= 0 ? `+£${p.profit}` : `-£${Math.abs(p.profit)}`,
                    subtext: `ROI: ${m.roiPct >= 0 ? `+${m.roiPct}%` : `${m.roiPct}%`} (£${m.cashPaid} Outlay)`,
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
                    label: '11. Bubble Finishes (4th)',
                    value: `${m.bubbleCount} 🫧`,
                    subtext: 'Finished 1 Spot Outside the Money',
                    category: 'placement',
                    highlightColor: 'text-purple-300 border-purple-500/30 bg-purple-950/20'
                },
                {
                    id: 'rebuys',
                    label: '12. Total & Single-Game Rebuys',
                    value: `${p.rebuys || 0} (Max ${m.maxRebuysSingle})`,
                    subtext: `${p.addOns || 0} Add-Ons • £${(p.rebuys || 0) * 10} Rebuy Spend`,
                    category: 'resilience',
                    highlightColor: 'text-blue-300 border-blue-500/30 bg-blue-950/20',
                    isLeagueRecord: (p.rebuys || 0) === maxLeagueRebuys && (p.rebuys || 0) > 0,
                    recordLabel: '🏧 REBUY KING'
                },
                {
                    id: 'eliminations',
                    label: '13. Times Eliminated & Survival',
                    value: `${m.timesEliminated} Deaths ⚰️`,
                    subtext: `${m.survivalRate}% Single-Bullet Survival`,
                    category: 'resilience',
                    highlightColor: 'text-zinc-200 border-white/15 bg-zinc-900/60'
                },
                {
                    id: 'bonus-chips',
                    label: '14. Final Table Bonus Stack',
                    value: `+${(p.bonusChips || 0).toLocaleString()}`,
                    subtext: 'Grand Final Starting Bonus Chips',
                    category: 'standings',
                    highlightColor: 'text-gold border-gold/30 bg-gold/10',
                    isLeagueRecord: (p.bonusChips || 0) === maxLeagueBonusChips && (p.bonusChips || 0) > 0,
                    recordLabel: '🪙 BIG STACK'
                },
                {
                    id: 'nemesis',
                    label: '15. Arch-Nemesis (Rival)',
                    value: nemesisName,
                    subtext: p.archNemesis?.headToHeadNotes || 'Primary Executioner at the Felt',
                    category: 'rivalry',
                    highlightColor: 'text-red-400 border-red-500/30 bg-red-950/25'
                },
                {
                    id: 'pigeon',
                    label: '16. Favorite Target (Pigeon)',
                    value: pigeonName,
                    subtext: 'Most Exploited Matchup in 2026',
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
                    p.rank === 1
                        ? 'The Reigning #1 Seed & Championship Favorite'
                        : p.rank <= 3
                        ? 'Elite Title Contender Within Striking Distance'
                        : p.profit > 0
                        ? 'In-The-Green Cash Shark Ready to Strike'
                        : p.gamesPlayed === 0
                        ? 'Missing in Action — The Undefeated Sofa Champion'
                        : 'Dangerous Final Table Dark Horse',
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

    // Build the full Broadcast Slide Deck (Players + Option 1 Special Interstitial Slides)
    const broadcastSlides: BroadcastSlide[] = useMemo(() => {
        const filteredPlayers = onlyActiveFinalists
            ? computedProfiles.filter(cp => !eliminatedPlayers[cp.player.name])
            : computedProfiles;
        const activeList = filteredPlayers.length > 0 ? filteredPlayers : computedProfiles;

        const slides: BroadcastSlide[] = activeList.map(cp => ({
            type: 'player',
            profile: cp,
            id: `player_${cp.player.name}`,
            label: cp.player.name.split(' ')[0],
            badge: `#${cp.player.rank}`
        }));

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
    }, [computedProfiles, onlyActiveFinalists, eliminatedPlayers, includeSpecialSlides]);

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
        if (playFanfareOnSlide && nextSlide && nextSlide.type === 'player') {
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
        if (playFanfareOnSlide && prevSlide && prevSlide.type === 'player') {
            const th = playerThemes[prevSlide.profile.player.name] || 'gladiator';
            playWalkUpTheme(th);
        }
    }, [broadcastSlides, safeSlideIdx, playFanfareOnSlide, playerThemes, playWalkUpTheme]);

    const handleSelectSlide = (idx: number) => {
        setActiveSlideIdx(idx);
        setLoopProgress(0);
        const target = broadcastSlides[idx];
        if (playFanfareOnSlide && target && target.type === 'player') {
            const th = playerThemes[target.profile.player.name] || 'gladiator';
            playWalkUpTheme(th);
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
    const effectivePot = totalPot > 0 ? totalPot : 600;

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
    // RENDER TOP LOOP & CAROUSEL BAR (SHARED ACROSS ALL SLIDES)
    // ========================================================================
    const renderTopLoopControls = () => (
        <div className="bg-zinc-950/90 border border-gold/30 rounded-2xl p-3 shadow-2xl relative overflow-hidden">
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

            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setIsLooping(!isLooping)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${
                            isLooping
                                ? 'bg-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                                : 'bg-zinc-800 text-zinc-300 border border-white/10 hover:text-white'
                        }`}
                        title="Pause or Resume Auto-Loop (Spacebar)"
                    >
                        {isLooping ? <Pause size={13} className="fill-current" /> : <Play size={13} className="fill-current" />}
                        <span>{isLooping ? 'Auto-Looping' : 'Loop Paused'}</span>
                    </button>

                    <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
                        <span className="text-[10px] font-mono text-zinc-400 px-1.5 uppercase">Speed:</span>
                        {LOOP_INTERVAL_OPTIONS.map(opt => (
                            <button
                                key={opt.seconds}
                                onClick={() => {
                                    setLoopDurationSec(opt.seconds);
                                    setLoopProgress(0);
                                }}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
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
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase border transition cursor-pointer ${
                            includeSpecialSlides
                                ? 'bg-amber-950/80 border-gold/50 text-gold'
                                : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                        title="Include Tale of the Tape, Season Awards, & Payouts slides in loop"
                    >
                        TV Specials: {includeSpecialSlides ? 'ON (+3 Slides)' : 'OFF'}
                    </button>

                    <button
                        onClick={() => {
                            setOnlyActiveFinalists(!onlyActiveFinalists);
                            setActiveSlideIdx(0);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase border transition cursor-pointer ${
                            onlyActiveFinalists
                                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                                : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                    >
                        {onlyActiveFinalists ? `In Play Only (${remainingCount})` : `All Players (${players.length})`}
                    </button>

                    <button
                        onClick={() => setPlayFanfareOnSlide(!playFanfareOnSlide)}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase border transition flex items-center gap-1 cursor-pointer ${
                            playFanfareOnSlide
                                ? 'bg-purple-950/80 border-purple-400/50 text-purple-300'
                                : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                    >
                        <Music size={11} />
                        <span className="hidden sm:inline">Slide Audio: {playFanfareOnSlide ? 'ON' : 'OFF'}</span>
                    </button>
                </div>

                {/* Slide Counter & Prev/Next */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-400">
                        Slide <strong className="text-gold">{safeSlideIdx + 1}</strong> of {broadcastSlides.length}
                    </span>
                    <button
                        onClick={handlePrevSlide}
                        className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={handleNextSlide}
                        className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Horizontal Clickable Slide & Player Carousel */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {broadcastSlides.map((s, idx) => {
                    const isSelected = idx === safeSlideIdx;
                    if (s.type === 'player') {
                        const cp = s.profile;
                        const eliminated = !!eliminatedPlayers[cp.player.name];
                        return (
                            <button
                                key={s.id}
                                onClick={() => handleSelectSlide(idx)}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border shrink-0 transition-all cursor-pointer ${
                                    isSelected
                                        ? 'bg-gradient-to-r from-gold/25 via-amber-500/20 to-black border-gold shadow-[0_0_15px_rgba(212,175,55,0.35)] scale-[1.02]'
                                        : eliminated
                                        ? 'bg-zinc-950/60 border-red-900/40 opacity-45 hover:opacity-75'
                                        : 'bg-zinc-900/70 border-white/10 hover:border-white/25'
                                }`}
                            >
                                <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-gold/40 shrink-0 bg-zinc-800">
                                    <img
                                        src={getAvatarFilename(cp.player.name)}
                                        alt={cp.player.name}
                                        className={`w-full h-full object-cover ${eliminated ? 'grayscale' : ''}`}
                                    />
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[9px] font-mono font-black text-gold">#{cp.player.rank}</span>
                                        <span className={`text-xs font-extrabold uppercase truncate max-w-[90px] ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                    <div className="text-[9px] font-mono text-zinc-400">
                                        {cp.player.points}p • {cp.player.knockOuts}☠️
                                    </div>
                                </div>
                            </button>
                        );
                    }

                    // Special Broadcast Slide Pill
                    return (
                        <button
                            key={s.id}
                            onClick={() => handleSelectSlide(idx)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shrink-0 transition-all cursor-pointer ${
                                isSelected
                                    ? 'bg-gradient-to-r from-purple-600/40 via-amber-500/30 to-black border-gold text-white shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-[1.02]'
                                    : 'bg-purple-950/30 border-purple-500/30 text-purple-200 hover:border-gold/50'
                            }`}
                        >
                            <div className="text-left">
                                <div className="text-[9px] font-mono font-black text-gold uppercase">{s.badge}</div>
                                <div className="text-xs font-black uppercase whitespace-nowrap">{s.label}</div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    // ========================================================================
    // OPTION 1A: UFC-STYLE "TALE OF THE TAPE" RIVALRY SLIDE
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
            },
            {
                label: 'Final Table Bonus Chips',
                valA: fighterA.player.bonusChips || 0,
                valB: fighterB.player.bonusChips || 0,
                fmtA: `+${(fighterA.player.bonusChips || 0).toLocaleString()}`,
                fmtB: `+${(fighterB.player.bonusChips || 0).toLocaleString()}`,
                higherWins: true
            }
        ];

        return (
            <div className="bg-gradient-to-b from-zinc-950/95 via-[#12090d]/95 to-black border-2 border-gold/50 rounded-3xl p-5 sm:p-8 shadow-[0_0_80px_rgba(220,38,38,0.2)] animate-in fade-in duration-300 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                        <span className="text-xs font-mono font-black uppercase tracking-[0.3em] text-ept-red flex items-center gap-2">
                            <Swords className="w-4 h-4" />
                            <span>Main Event Rivalry Showcase • Head-to-Head</span>
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-black uppercase italic text-white tracking-tight mt-1">
                            Championship Tale of the Tape
                        </h2>
                    </div>

                    {/* Quick Rivalry Matchup Selector */}
                    <div className="flex flex-wrap items-center gap-2 bg-black/70 p-2 rounded-2xl border border-white/10">
                        <span className="text-[10px] font-mono uppercase text-zinc-400 px-1">Matchup:</span>
                        <select
                            value={rivalryIdxA}
                            onChange={e => setRivalryIdxA(Number(e.target.value))}
                            className="bg-zinc-900 text-gold font-bold text-xs px-2.5 py-1.5 rounded-xl border border-gold/40"
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
                            className="bg-zinc-900 text-sky-400 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-sky-400/40"
                        >
                            {computedProfiles.map((cp, i) => (
                                <option key={cp.player.name} value={i}>
                                    #{cp.player.rank} {cp.player.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Fighter Headers */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Fighter A */}
                    <div className="md:col-span-4 flex flex-col items-center text-center p-5 rounded-3xl bg-gradient-to-b from-gold/15 to-black border-2 border-gold/50 shadow-xl">
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-gold overflow-hidden shadow-[0_0_35px_rgba(212,175,55,0.5)] bg-zinc-900">
                                <WantedVideo
                                    playerName={fighterA.player.name}
                                    className="absolute inset-0 w-full h-full object-cover object-top z-10"
                                />
                                <img src={getAvatarFilename(fighterA.player.name)} alt={fighterA.player.name} className="w-full h-full object-cover object-top" />
                                <span className="absolute top-1.5 left-1.5 z-20 px-1.5 py-0.5 rounded bg-black/80 text-gold text-[8px] font-mono font-black uppercase border border-gold/40">
                                    🎬 AI Video
                                </span>
                            </div>
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-amber-400/70 overflow-hidden shadow-lg bg-zinc-950">
                                <img
                                    src={getAvatarFilename(fighterA.player.name)}
                                    alt={`${fighterA.player.name} 8-bit`}
                                    className="w-full h-full object-cover object-top"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                                <span className="absolute bottom-1 inset-x-1 z-20 px-1 py-0.5 rounded bg-black/85 text-amber-300 text-[7px] font-mono font-black uppercase text-center border border-amber-400/30">
                                    👾 8-Bit
                                </span>
                            </div>
                        </div>
                        <span className="px-3 py-0.5 rounded-full bg-gold text-black font-black text-[10px] uppercase tracking-widest mb-1">
                            Seed #{fighterA.player.rank} • {fighterA.player.nickname || 'Contender'}
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black uppercase text-white">{fighterA.player.name}</h3>
                        <span className="text-xs font-mono text-gold mt-1">{fighterA.archetypeBadge}</span>
                    </div>

                    {/* Center Comparison Bars */}
                    <div className="md:col-span-4 space-y-3">
                        {comparisons.map(row => {
                            const aWins = row.higherWins ? row.valA >= row.valB : row.valA <= row.valB;
                            const bWins = row.higherWins ? row.valB >= row.valA : row.valB <= row.valA;
                            const total = Math.max(1, Math.abs(row.valA) + Math.abs(row.valB));
                            const pctA = row.higherWins
                                ? Math.max(15, Math.min(85, Math.round((Math.max(0, row.valA) / total) * 100)))
                                : Math.max(15, Math.min(85, 100 - Math.round((Math.max(0, row.valA) / total) * 100)));

                            return (
                                <div key={row.label} className="bg-black/70 p-2.5 rounded-xl border border-white/10 space-y-1">
                                    <div className="flex items-center justify-between text-xs font-mono">
                                        <span className={aWins ? 'text-gold font-black' : 'text-zinc-400'}>{row.fmtA}</span>
                                        <span className="text-[10px] uppercase font-bold text-zinc-300 tracking-wider">{row.label}</span>
                                        <span className={bWins ? 'text-sky-400 font-black' : 'text-zinc-400'}>{row.fmtB}</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden flex">
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
                    <div className="md:col-span-4 flex flex-col items-center text-center p-5 rounded-3xl bg-gradient-to-b from-sky-500/15 to-black border-2 border-sky-400/50 shadow-xl">
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-sky-400 overflow-hidden shadow-[0_0_35px_rgba(56,189,248,0.4)] bg-zinc-900">
                                <WantedVideo
                                    playerName={fighterB.player.name}
                                    className="absolute inset-0 w-full h-full object-cover object-top z-10"
                                />
                                <img src={getAvatarFilename(fighterB.player.name)} alt={fighterB.player.name} className="w-full h-full object-cover object-top" />
                                <span className="absolute top-1.5 left-1.5 z-20 px-1.5 py-0.5 rounded bg-black/80 text-sky-300 text-[8px] font-mono font-black uppercase border border-sky-400/40">
                                    🎬 AI Video
                                </span>
                            </div>
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-sky-400/70 overflow-hidden shadow-lg bg-zinc-950">
                                <img
                                    src={getAvatarFilename(fighterB.player.name)}
                                    alt={`${fighterB.player.name} 8-bit`}
                                    className="w-full h-full object-cover object-top"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                                <span className="absolute bottom-1 inset-x-1 z-20 px-1 py-0.5 rounded bg-black/85 text-sky-300 text-[7px] font-mono font-black uppercase text-center border border-sky-400/30">
                                    👾 8-Bit
                                </span>
                            </div>
                        </div>
                        <span className="px-3 py-0.5 rounded-full bg-sky-400 text-black font-black text-[10px] uppercase tracking-widest mb-1">
                            Seed #{fighterB.player.rank} • {fighterB.player.nickname || 'Contender'}
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black uppercase text-white">{fighterB.player.name}</h3>
                        <span className="text-xs font-mono text-sky-300 mt-1">{fighterB.archetypeBadge}</span>
                    </div>
                </div>
            </div>
        );
    };

    // ========================================================================
    // OPTION 1B: SEASON AWARDS & "HALL OF SHAME" SUPERLATIVES SLIDE
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
                title: '☠️ THE GRIM REAPER',
                subtitle: 'Most Total Season Knockouts',
                winner: koLeader.player.name,
                stat: `${koLeader.player.knockOuts} Total KOs`,
                detail: `Averaging ${(koLeader.player.knockOuts / Math.max(1, koLeader.player.gamesPlayed)).toFixed(2)} eliminations per game.`,
                color: 'border-red-500/50 bg-gradient-to-b from-red-950/40 to-black text-red-400'
            },
            {
                title: '💰 BIGGEST SINGLE PAYDAY',
                subtitle: 'Highest Single-Game Cash Win',
                winner: singleWinLeader.player.name,
                stat: `£${singleWinLeader.highestWinAmount} Cash`,
                detail: `Recorded in ${singleWinLeader.highestWinLabel} • £${singleWinLeader.player.winnings} total cashed.`,
                color: 'border-emerald-500/50 bg-gradient-to-b from-emerald-950/40 to-black text-emerald-400'
            },
            {
                title: '⚔️ ONE-NIGHT RAMPAGE',
                subtitle: 'Most Knockouts in a Single Game',
                winner: singleKoLeader.player.name,
                stat: `${singleKoLeader.mostKOsInGame} KOs in 1 Night`,
                detail: `Set during ${singleKoLeader.mostKOsLabel}.`,
                color: 'border-amber-500/50 bg-gradient-to-b from-amber-950/40 to-black text-gold'
            },
            {
                title: '🧠 CLINICAL CHEAT CODE',
                subtitle: 'Highest Tournament Win Percentage',
                winner: winRateLeader.player.name,
                stat: `${winRateLeader.winRate}% Win Rate`,
                detail: `${winRateLeader.player.wins || 0} 1st-place trophies in ${winRateLeader.player.gamesPlayed} appearances (+£${winRateLeader.player.profit}).`,
                color: 'border-cyan-500/50 bg-gradient-to-b from-cyan-950/40 to-black text-cyan-300'
            },
            {
                title: '🏧 THE LEAGUE ATM SPONSOR',
                subtitle: 'Most Rebuys & Prize Pool Funding',
                winner: rebuyLeader.player.name,
                stat: `${rebuyLeader.player.rebuys} Rebuys (£${rebuyLeader.cashPaid} In)`,
                detail: `Max ${rebuyLeader.maxRebuysSingle} rebuys in a single game • Single-handedly funding the vault.`,
                color: 'border-blue-500/50 bg-gradient-to-b from-blue-950/40 to-black text-blue-300'
            },
            {
                title: '🫧 THE HEARTBREAK KID',
                subtitle: 'Most 4th-Place Bubble Finishes',
                winner: bubbleLeader.player.name,
                stat: `${bubbleLeader.bubbleCount} Bubble Finishes`,
                detail: `Eliminated one spot outside the prize money more than anyone else.`,
                color: 'border-purple-500/50 bg-gradient-to-b from-purple-950/40 to-black text-purple-300'
            },
            {
                title: '⚰️ THE BULLET SPONGE',
                subtitle: 'Most Times Eliminated at the Felt',
                winner: bulletSponge.player.name,
                stat: `${bulletSponge.timesEliminated} Deaths`,
                detail: `Absorbed more all-in beats than any other player in the 2026 campaign.`,
                color: 'border-orange-500/50 bg-gradient-to-b from-orange-950/40 to-black text-orange-300'
            },
            {
                title: '🚨 WITNESS PROTECTION AWARD',
                subtitle: 'Lowest Season Table Attendance',
                winner: ghostAward.player.name,
                stat: `${ghostAward.player.gamesPlayed} Games (${ghostAward.attendancePct}%)`,
                detail: `Preserved their emotional sanity by staying far away from the sharks.`,
                color: 'border-rose-500/50 bg-gradient-to-b from-rose-950/40 to-black text-rose-300'
            }
        ];

        return (
            <div className="bg-gradient-to-b from-zinc-950/95 via-[#0f0c16]/95 to-black border-2 border-gold/50 rounded-3xl p-5 sm:p-8 shadow-[0_0_80px_rgba(212,175,55,0.2)] animate-in fade-in duration-300 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                        <span className="text-xs font-mono font-black uppercase tracking-[0.3em] text-gold flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            <span>Official 2026 Season Superlatives</span>
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-black uppercase italic text-white tracking-tight mt-1">
                            Hall of Fame &amp; Hall of Shame Awards
                        </h2>
                    </div>
                    <span className="hidden sm:inline-block px-4 py-1.5 rounded-full bg-gold/15 border border-gold/40 text-gold font-mono font-bold text-xs">
                        8 Official Season Honors
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {awards.map(aw => (
                        <div
                            key={aw.title}
                            className={`p-4 rounded-2xl border-2 flex flex-col justify-between space-y-3 shadow-xl ${aw.color}`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <div className="text-xs font-black uppercase tracking-wider">{aw.title}</div>
                                    <div className="text-[10px] font-mono text-zinc-400">{aw.subtitle}</div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/30 bg-zinc-900">
                                        <WantedVideo
                                            playerName={aw.winner}
                                            className="absolute inset-0 w-full h-full object-cover object-top z-10"
                                        />
                                        <img src={getAvatarFilename(aw.winner)} alt={aw.winner} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-gold/40 bg-zinc-950">
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
                                <div className="text-lg font-black uppercase text-white truncate">{aw.winner}</div>
                                <div className="text-xl font-black font-mono mt-0.5">{aw.stat}</div>
                            </div>

                            <p className="text-[11px] text-zinc-300 leading-snug font-sans border-t border-white/10 pt-2">
                                {aw.detail}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // ========================================================================
    // OPTION 1C: FINAL TABLE STARTING STACKS, BIG BLIND DEPTH & PAYOUTS SLIDE
    // ========================================================================
    const renderStacksAndPayoutsSlide = () => {
        const firstPayout = Math.round(effectivePot * 0.50);
        const secondPayout = Math.round(effectivePot * 0.30);
        const thirdPayout = Math.round(effectivePot * 0.15);
        const bountyPayout = Math.round(effectivePot * 0.05);
        const baseStartingStack = 20000;

        return (
            <div className="bg-gradient-to-b from-zinc-950/95 via-[#09130e]/95 to-black border-2 border-gold/50 rounded-3xl p-5 sm:p-8 shadow-[0_0_80px_rgba(16,185,129,0.2)] animate-in fade-in duration-300 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                        <span className="text-xs font-mono font-black uppercase tracking-[0.3em] text-emerald-400 flex items-center gap-2">
                            <Coins className="w-4 h-4" />
                            <span>Grand Final Prize Distribution &amp; Chip Telemetry</span>
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-black uppercase italic text-white tracking-tight mt-1">
                            Championship Payouts &amp; Starting Stack Depth
                        </h2>
                    </div>

                    <div className="px-5 py-2 rounded-2xl bg-gold/20 border-2 border-gold text-right">
                        <span className="text-[10px] font-mono uppercase text-gold block">Total Championship Vault</span>
                        <span className="text-2xl sm:text-3xl font-black font-mono text-white">£{effectivePot}</span>
                    </div>
                </div>

                {/* Payout Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-gold/25 to-black border-2 border-gold text-center">
                        <span className="text-xs font-black uppercase text-gold block">🏆 1st Place Champion (50%)</span>
                        <span className="text-3xl sm:text-4xl font-black font-mono text-white mt-1 block">£{firstPayout}</span>
                        <span className="text-[10px] font-mono text-zinc-400">+ E.P.T. 2026 Championship Trophy</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-zinc-400/20 to-black border-2 border-zinc-400 text-center">
                        <span className="text-xs font-black uppercase text-zinc-300 block">🥈 2nd Place Runner-Up (30%)</span>
                        <span className="text-3xl sm:text-4xl font-black font-mono text-white mt-1 block">£{secondPayout}</span>
                        <span className="text-[10px] font-mono text-zinc-400">Silver Finalist Payout</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-700/25 to-black border-2 border-amber-600 text-center">
                        <span className="text-xs font-black uppercase text-amber-400 block">🥉 3rd Place Podium (15%)</span>
                        <span className="text-3xl sm:text-4xl font-black font-mono text-white mt-1 block">£{thirdPayout}</span>
                        <span className="text-[10px] font-mono text-zinc-400">Bronze Podium Payout</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-red-600/25 to-black border-2 border-red-500 text-center">
                        <span className="text-xs font-black uppercase text-red-400 block">☠️ Top Bounty Hunter (5%)</span>
                        <span className="text-3xl sm:text-4xl font-black font-mono text-white mt-1 block">£{bountyPayout}</span>
                        <span className="text-[10px] font-mono text-zinc-400">Special Knockout Bonus</span>
                    </div>
                </div>

                {/* Starting Stacks & Big Blind Depth Table */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {computedProfiles.map(cp => {
                        const bonus = cp.player.bonusChips || 0;
                        const totalStack = baseStartingStack + bonus;
                        const bbDepth = Math.round(totalStack / currentLevel.bb);
                        const isOut = !!eliminatedPlayers[cp.player.name];

                        return (
                            <div
                                key={cp.player.name}
                                className={`flex items-center justify-between p-3 rounded-2xl border ${
                                    isOut
                                        ? 'bg-zinc-950/60 border-red-900/40 opacity-40'
                                        : cp.player.rank === 1
                                        ? 'bg-gold/15 border-gold'
                                        : 'bg-zinc-900/80 border-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-gold/40 shrink-0 bg-zinc-800">
                                        <img src={getAvatarFilename(cp.player.name)} alt={cp.player.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-black uppercase text-white truncate">
                                            #{cp.player.rank} {cp.player.name}
                                        </div>
                                        <div className="text-[10px] font-mono text-zinc-400">
                                            Base 20k + <strong className="text-gold">{bonus.toLocaleString()} Bonus</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <div className="text-sm font-black font-mono text-emerald-400">
                                        {totalStack.toLocaleString()} Chips
                                    </div>
                                    <div className="text-[10px] font-mono text-gold font-bold">
                                        {bbDepth} BB (Lvl {currentLevel.level})
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
    // RENDER INDIVIDUAL PLAYER SLIDE (WITH 16 STATS + RADAR + SPARKLINE + REPORT)
    // ========================================================================
    const renderPlayerDossierSlide = (currentProfile: ComputedPlayerProfile, compact = false) => {
        const { player: p } = currentProfile;
        const isOut = !!eliminatedPlayers[p.name];

        return (
            <div
                key={p.name}
                className="bg-gradient-to-b from-zinc-950/95 via-[#0c0c0e]/95 to-black border-2 border-gold/40 rounded-3xl p-4 sm:p-6 shadow-[0_0_70px_rgba(212,175,55,0.18)] relative overflow-hidden animate-in fade-in duration-300"
            >
                <div className="absolute -top-6 right-4 text-[8rem] sm:text-[12rem] font-black text-white/[0.03] select-none pointer-events-none leading-none font-mono">
                    #{p.rank}
                </div>

                {/* 1. HERO PLAYER IDENTITY HEADER (WITH BOTH AI VIDEO & 8-BIT CHARACTER) */}
                <div className="relative z-10 flex flex-col xl:flex-row items-center xl:items-start justify-between gap-6 pb-5 border-b border-white/10">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                        {/* Dual Media Showcase: Live AI Video + 8-Bit Character Portrait */}
                        <div className="flex items-center gap-3 shrink-0">
                            {/* Card 1: AI Video Feed */}
                            <div className="relative">
                                <div className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl border-4 overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.5)] bg-zinc-900 ${
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
                                    <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-md bg-black/80 border border-gold/50 text-[8px] font-mono font-black uppercase tracking-wider text-gold">
                                        🎬 AI Video
                                    </span>
                                    {isOut && (
                                        <div className="absolute inset-0 z-30 bg-red-950/75 flex flex-col items-center justify-center">
                                            <Skull className="w-10 h-10 text-red-500 animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white bg-red-600 px-2 py-0.5 rounded mt-1">
                                                BUSTED
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1 rounded-full bg-gradient-to-r from-gold via-yellow-400 to-amber-500 text-black font-black text-xs uppercase tracking-widest shadow-xl whitespace-nowrap border border-white">
                                    SEED #{p.rank}
                                </div>
                            </div>

                            {/* Card 2: 8-Bit Arcade Character */}
                            <div className="relative">
                                <div className={`relative w-24 h-28 sm:w-28 sm:h-36 rounded-3xl border-2 overflow-hidden shadow-[0_0_25px_rgba(245,158,11,0.3)] bg-zinc-950 ${
                                    isOut ? 'border-red-600/60 grayscale' : 'border-amber-400/70'
                                }`}>
                                    <img
                                        src={getAvatarFilename(p.name)}
                                        alt={`${p.name} 8-Bit Character`}
                                        className="w-full h-full object-cover object-top"
                                        style={{ imageRendering: 'pixelated' }}
                                    />
                                    <span className="absolute bottom-2 inset-x-1.5 z-20 px-1.5 py-0.5 rounded-md bg-black/85 border border-amber-400/40 text-[8px] font-mono font-black uppercase tracking-wider text-amber-300 text-center">
                                        👾 8-Bit Avatar
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2.5 max-w-2xl">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${currentProfile.archetypeColor}`}>
                                    {currentProfile.archetypeBadge}
                                </span>
                                {p.nickname && (
                                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-mono font-bold">
                                        AKA &ldquo;{p.nickname}&rdquo;
                                    </span>
                                )}
                                <span className="px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10 text-[11px] font-mono text-zinc-400">
                                    Attendance: <strong className="text-white">{currentProfile.attendanceRate}</strong>
                                </span>
                            </div>

                            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_20px_rgba(255,215,0,0.3)]">
                                {p.name}
                            </h2>

                            <p className="text-xs sm:text-sm font-mono text-gold/90 italic">
                                &ldquo;{currentProfile.quote}&rdquo;
                            </p>

                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                                {(p.badges || []).map(badge => (
                                    <span
                                        key={badge.id}
                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border uppercase tracking-wider ${badge.color}`}
                                    >
                                        <span>{badge.icon}</span>
                                        <span>{badge.label}</span>
                                    </span>
                                ))}
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-zinc-900 border border-white/15 text-zinc-300">
                                    VPIP: <strong className="text-gold">{p.vpip || 24}%</strong>
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-zinc-900 border border-white/15 text-zinc-300">
                                    Aggression: <strong className="text-gold">{p.aggressionFactor || 1.8}</strong>
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-zinc-900 border border-white/15 text-zinc-300">
                                    Threat Level: <strong className="text-ept-red">{currentProfile.fearLevel}</strong>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex flex-wrap sm:flex-nowrap xl:flex-col items-center xl:items-end gap-2.5 shrink-0">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    const th = playerThemes[p.name] || 'gladiator';
                                    playWalkUpTheme(th);
                                }}
                                className="px-3.5 py-2 rounded-xl bg-gold/20 hover:bg-gold/30 border border-gold/50 text-gold text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                            >
                                <Music size={14} />
                                <span>Walk-Up Fanfare</span>
                            </button>

                            <button
                                onClick={() => toggleEliminate(p.name)}
                                className={`px-3.5 py-2 rounded-xl border text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                                    isOut
                                        ? 'bg-red-950/90 border-red-500 text-red-300 hover:bg-red-900'
                                        : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                                }`}
                            >
                                {isOut ? '💀 Marked Busted (Restore)' : '🟢 Active In Final'}
                            </button>
                        </div>

                        <div className="flex items-center gap-1 bg-black/80 p-1 rounded-xl border border-white/10">
                            {(['gladiator', 'cyberpunk', 'casino', 'rock'] as const).map(th => (
                                <button
                                    key={th}
                                    onClick={() => handleSelectTheme(p.name, th)}
                                    className={`px-2 py-0.5 rounded-lg uppercase font-mono font-bold text-[9px] transition cursor-pointer ${
                                        (playerThemes[p.name] || 'gladiator') === th
                                            ? 'bg-gold text-black'
                                            : 'text-zinc-500 hover:text-white'
                                    }`}
                                >
                                    {th}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. THE 16 LEAGUE STATISTICS GRID */}
                <div className="mt-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-gold" />
                            <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                                Complete 16-Point Season League Telemetry
                            </h3>
                        </div>
                        <span className="text-[10px] font-mono uppercase text-zinc-400">
                            Live Synced from E.P.T. 2026 Master Ledger
                        </span>
                    </div>

                    <div className={`grid grid-cols-2 sm:grid-cols-4 ${compact ? 'xl:grid-cols-4' : 'xl:grid-cols-8'} gap-2.5`}>
                        {currentProfile.statsGrid.map(stat => (
                            <div
                                key={stat.id}
                                className={`relative p-3 rounded-2xl border flex flex-col justify-between transition-all hover:scale-[1.02] ${stat.highlightColor}`}
                            >
                                {stat.isLeagueRecord && (
                                    <span className="absolute -top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-gold via-yellow-300 to-amber-500 text-black text-[8px] font-black uppercase tracking-widest shadow-md border border-white">
                                        {stat.recordLabel || '★ RECORD'}
                                    </span>
                                )}
                                <div className="text-[10px] font-mono font-bold uppercase text-zinc-400 tracking-tight leading-snug">
                                    {stat.label}
                                </div>
                                <div className="text-lg sm:text-xl font-black font-mono tracking-tight my-1 truncate">
                                    {stat.value}
                                </div>
                                <div className="text-[10px] font-sans text-zinc-400/90 leading-tight line-clamp-2">
                                    {stat.subtext}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. FULL LEAGUE REPORT + 6-AXIS POKER DNA RADAR + PROFIT SPARKLINE + SESSION ARCHIVE */}
                <div className={`grid grid-cols-1 ${compact ? 'xl:grid-cols-1' : 'xl:grid-cols-12'} gap-5 mt-5 pt-5 border-t border-white/10`}>
                    {/* Left 5 Cols: Comprehensive 4-Part League Scouting Report */}
                    <div className={`${compact ? '' : 'xl:col-span-5'} bg-zinc-900/60 border border-gold/25 rounded-2xl p-4 sm:p-5 space-y-3.5`}>
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                            <div className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-gold" />
                                <div>
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-gold block">
                                        Official 2026 League Scouting Dossier
                                    </span>
                                    <h3 className="text-sm sm:text-base font-black text-white uppercase italic">
                                        &ldquo;{currentProfile.headline}&rdquo;
                                    </h3>
                                </div>
                            </div>
                            <Link
                                href={`/scouting/${encodeURIComponent(p.name)}`}
                                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-gold/20 border border-white/10 hover:border-gold/40 text-[10px] font-bold text-zinc-300 hover:text-gold transition shrink-0"
                            >
                                Dossier →
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {currentProfile.reportParagraphs.map((sec, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1"
                                >
                                    <div className="text-[11px] font-black uppercase tracking-wider text-gold">
                                        {sec.title}
                                    </div>
                                    <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                                        {sec.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Center 3 Cols: Option 3 — 6-Axis Poker DNA Radar & Cumulative Profit Sparkline */}
                    <div className={`${compact ? '' : 'xl:col-span-3'} bg-zinc-900/60 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3`}>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-black uppercase tracking-wider text-gold flex items-center gap-1.5">
                                    <Activity className="w-4 h-4" />
                                    <span>6-Axis Poker DNA</span>
                                </span>
                                <span className="text-[9px] font-mono text-zinc-400">0–100 Index</span>
                            </div>
                            <PokerDnaRadarChart attributes={currentProfile.radarAttributes} />
                        </div>

                        <div className="pt-2 border-t border-white/10">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-black uppercase tracking-wider text-white flex items-center gap-1">
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Season Profit Trajectory</span>
                                </span>
                                <span className={`text-xs font-mono font-black ${p.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {p.profit >= 0 ? `+£${p.profit}` : `-£${Math.abs(p.profit)}`}
                                </span>
                            </div>
                            <ProfitSparklineChart points={currentProfile.cumulativeProfitPoints} />
                        </div>
                    </div>

                    {/* Right 4 Cols: Session-by-Session Log & Gazette Press Clippings */}
                    <div className={`${compact ? '' : 'xl:col-span-4'} flex flex-col justify-between gap-4`}>
                        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-gold" />
                                    <span>Session-by-Session Log</span>
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400">
                                    {p.gamesPlayed}/{currentProfile.sessionLog.length} Played
                                </span>
                            </div>

                            {currentProfile.sessionLog.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[195px] overflow-y-auto pr-1 custom-scrollbar">
                                    {currentProfile.sessionLog.map(s => (
                                        <div
                                            key={s.gameNumber}
                                            className={`p-2 rounded-xl border text-center transition ${
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
                                            <div className="flex items-center justify-between text-[8.5px] font-mono text-zinc-400">
                                                <span>G{s.gameNumber}</span>
                                                <span className="truncate max-w-[45px]">{s.date}</span>
                                            </div>
                                            <div className={`text-xs font-black font-mono my-0.5 ${
                                                !s.played
                                                    ? 'text-zinc-600'
                                                    : s.placeNum === 1
                                                    ? 'text-gold'
                                                    : s.placeNum && s.placeNum <= 3
                                                    ? 'text-emerald-400'
                                                    : 'text-white'
                                            }`}>
                                                {s.played ? `${s.placeLabel} ${s.placeNum === 1 ? '🏆' : ''}` : 'DNP'}
                                            </div>
                                            {s.played && (
                                                <div className="text-[8.5px] font-mono text-zinc-400 flex items-center justify-center gap-1">
                                                    <span className={s.winnings > 0 ? 'text-green-400 font-bold' : ''}>£{s.winnings}</span>
                                                    <span>•</span>
                                                    <span>{s.kos}☠️</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-3 text-center text-xs text-zinc-500 bg-black/40 rounded-xl border border-white/5">
                                    Session history will populate automatically.
                                </div>
                            )}
                        </div>

                        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 space-y-2 flex-1">
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
                                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                                    {currentProfile.gazetteMentions.slice(0, 2).map((m, idx) => (
                                        <div
                                            key={idx}
                                            className="p-2.5 rounded-xl bg-black/70 border-l-2 border-gold text-xs space-y-1"
                                        >
                                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                                                <span className="text-gold font-bold uppercase">{m.episode} {m.title ? `• ${m.title}` : ''}</span>
                                                <span>{m.date}</span>
                                            </div>
                                            <p className="text-zinc-300 text-xs line-clamp-2 italic leading-relaxed">
                                                &ldquo;{m.snippet}&rdquo;
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-500 italic">
                                    Operating under the radar in official Gazette dispatches this season.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderActiveSlideContent = (compact = false) => {
        if (!currentSlide) return null;
        return (
            <div className="flex flex-col gap-4 w-full">
                {renderTopLoopControls()}
                {currentSlide.type === 'player' && renderPlayerDossierSlide(currentSlide.profile, compact)}
                {currentSlide.type === 'tale_of_the_tape' && renderTaleOfTheTapeSlide()}
                {currentSlide.type === 'season_awards' && renderSeasonAwardsSlide()}
                {currentSlide.type === 'stacks_and_payouts' && renderStacksAndPayoutsSlide()}
            </div>
        );
    };

    return (
        <div className="relative min-h-screen bg-black text-white font-sans flex flex-col justify-between p-3 sm:p-6 pb-16 select-none overflow-hidden rounded-3xl border border-white/10">
            <style>{`
                @keyframes eptTickerScroll {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-50%); }
                }
                .ept-ticker-track {
                    display: flex;
                    width: max-content;
                    animation: eptTickerScroll 75s linear infinite;
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

            {/* TOP BROADCAST HEADER */}
            <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/final"
                        className="text-zinc-400 hover:text-white p-2.5 bg-zinc-900 border border-white/10 rounded-2xl transition-colors hover:scale-105"
                        title="Back to Finals Hub"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-ept-red">
                                Ongoing Final Game TV Broadcast • Auto-Looping Player Dossiers
                            </span>
                        </div>
                        <h1 className="text-lg sm:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2 italic">
                            <span>E.P.T. 2026 Championship Presentation</span>
                            <Crown className="w-5 h-5 text-gold fill-gold/20" />
                        </h1>
                    </div>
                </div>

                {/* Center: Compact Live Blind Clock Pill */}
                <div className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-zinc-950/90 border border-gold/40 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gold" />
                        <div>
                            <span className="text-[9px] font-mono uppercase text-zinc-400 block">
                                Lvl {currentLevel.level} • {currentLevel.sb}/{currentLevel.bb} {currentLevel.ante ? `(${currentLevel.ante})` : ''}
                            </span>
                            <span className="text-base sm:text-lg font-black font-mono text-white tracking-tight">
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsClockRunning(!isClockRunning)}
                        className={`px-2.5 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1 transition cursor-pointer ${
                            isClockRunning ? 'bg-red-600 text-white' : 'bg-gold text-black'
                        }`}
                    >
                        {isClockRunning ? <Pause size={11} className="fill-current" /> : <Play size={11} className="fill-current" />}
                        <span>{isClockRunning ? 'Pause' : 'Clock'}</span>
                    </button>
                    <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />
                    <div className="hidden sm:block text-right">
                        <span className="text-[9px] text-zinc-400 font-bold uppercase block">Prize Vault</span>
                        <span className="text-sm font-black text-gold font-mono">£{effectivePot}</span>
                    </div>
                </div>

                {/* Right: View Switcher & Fullscreen */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-zinc-900/90 p-1 rounded-2xl border border-white/10">
                        <button
                            onClick={() => setViewMode('showcase')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                                viewMode === 'showcase' ? 'bg-gold text-black shadow' : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            <LayoutGrid size={13} />
                            <span className="hidden md:inline">Player Loop</span>
                        </button>
                        <button
                            onClick={() => setViewMode('split')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                                viewMode === 'split' ? 'bg-gold text-black shadow' : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            <Columns size={13} />
                            <span className="hidden md:inline">Split TV</span>
                        </button>
                        <button
                            onClick={() => setViewMode('clock')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                                viewMode === 'clock' ? 'bg-gold text-black shadow' : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            <Clock size={13} />
                            <span className="hidden md:inline">Timer Only</span>
                        </button>
                    </div>

                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="p-2.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 rounded-2xl transition-all cursor-pointer"
                    >
                        {soundEnabled ? <Volume2 className="w-5 h-5 text-gold" /> : <VolumeX className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={handleFullscreen}
                        className="p-2.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 rounded-2xl transition-all hover:scale-105 cursor-pointer"
                    >
                        <Maximize className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="relative z-10 my-auto py-2">
                {viewMode === 'showcase' && renderActiveSlideContent(false)}

                {viewMode === 'split' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-4 space-y-4">
                            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-zinc-950/95 to-black rounded-3xl border-2 border-gold/40 shadow-[0_0_60px_rgba(212,175,55,0.2)] relative overflow-hidden">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/40 rounded-full mb-2 text-gold text-xs font-black uppercase tracking-widest">
                                    <Flame className="w-3.5 h-3.5 fill-current" />
                                    <span>Blind Level {currentLevel.level} of {BLIND_LEVELS.length}</span>
                                </div>

                                <div className="text-6xl sm:text-7xl font-black font-mono tracking-tighter text-white drop-shadow-[0_0_35px_rgba(255,215,0,0.35)] my-2">
                                    {formatTime(timeLeft)}
                                </div>

                                <div className="grid grid-cols-3 gap-2.5 w-full mt-2 text-center">
                                    <div className="p-3 bg-zinc-900/90 border border-gold/30 rounded-2xl">
                                        <span className="text-[9px] text-zinc-400 font-bold uppercase block">Small</span>
                                        <span className="text-xl font-black text-gold font-mono">{currentLevel.sb}</span>
                                    </div>
                                    <div className="p-3 bg-zinc-900/90 border border-gold/30 rounded-2xl">
                                        <span className="text-[9px] text-zinc-400 font-bold uppercase block">Big</span>
                                        <span className="text-xl font-black text-gold font-mono">{currentLevel.bb}</span>
                                    </div>
                                    <div className="p-3 bg-zinc-900/90 border border-white/10 rounded-2xl">
                                        <span className="text-[9px] text-zinc-400 font-bold uppercase block">Ante</span>
                                        <span className="text-xl font-black text-amber-500 font-mono">{currentLevel.ante || '-'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-5">
                                    <button
                                        onClick={() => {
                                            if (currentLevelIdx > 0) {
                                                setCurrentLevelIdx(prev => prev - 1);
                                                setTimeLeft(BLIND_LEVELS[currentLevelIdx - 1].duration);
                                            }
                                        }}
                                        disabled={currentLevelIdx === 0}
                                        className="p-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-white/10 rounded-xl text-zinc-300 cursor-pointer"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setIsClockRunning(!isClockRunning)}
                                        className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-black uppercase text-xs tracking-wider cursor-pointer ${
                                            isClockRunning ? 'bg-red-600 text-white' : 'bg-gold text-black'
                                        }`}
                                    >
                                        {isClockRunning ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current" />}
                                        <span>{isClockRunning ? 'Pause' : 'Start'}</span>
                                    </button>
                                    <button
                                        onClick={() => setTimeLeft(currentLevel.duration)}
                                        className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-zinc-300 cursor-pointer"
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
                                        className="p-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-white/10 rounded-xl text-zinc-300 cursor-pointer"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 bg-zinc-950/95 border border-white/10 rounded-3xl space-y-2.5">
                                <div className="flex items-center justify-between text-xs font-black uppercase">
                                    <span className="text-white flex items-center gap-1.5">
                                        <Users size={14} className="text-gold" />
                                        <span>Live Table Status</span>
                                    </span>
                                    <span className="text-green-400 font-mono">{remainingCount}/{players.length} In Play</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                                    {players.map(p => {
                                        const isOut = !!eliminatedPlayers[p.name];
                                        return (
                                            <button
                                                key={p.name}
                                                onClick={() => toggleEliminate(p.name)}
                                                className={`flex items-center justify-between p-2 rounded-xl border text-left transition cursor-pointer ${
                                                    isOut
                                                        ? 'bg-zinc-950 border-red-900/40 opacity-40'
                                                        : 'bg-zinc-900/80 border-white/10 hover:border-gold/40'
                                                }`}
                                            >
                                                <span className={`text-xs font-bold truncate ${isOut ? 'line-through text-zinc-500' : 'text-white'}`}>
                                                    #{p.rank} {p.name.split(' ')[0]}
                                                </span>
                                                <span className="text-[9px] font-mono">{isOut ? '💀' : '🟢'}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-8">
                            {renderActiveSlideContent(true)}
                        </div>
                    </div>
                )}

                {viewMode === 'clock' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-7 flex flex-col items-center justify-center p-8 sm:p-12 bg-gradient-to-b from-zinc-950/95 to-black rounded-3xl border-2 border-gold/40 shadow-[0_0_100px_rgba(212,175,55,0.2)] relative overflow-hidden backdrop-blur-md">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-80" />
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/40 rounded-full mb-3 text-gold text-xs font-black uppercase tracking-widest">
                                <Flame className="w-3.5 h-3.5 fill-current" />
                                <span>Level {currentLevel.level} of {BLIND_LEVELS.length}</span>
                            </div>
                            <div className="text-7xl sm:text-9xl md:text-[10rem] font-black font-mono tracking-tighter text-white drop-shadow-[0_0_50px_rgba(255,215,0,0.35)] my-2">
                                {formatTime(timeLeft)}
                            </div>
                            <div className="grid grid-cols-3 gap-4 w-full max-w-xl mt-4 text-center">
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
                                <div className="mt-5 text-xs font-mono text-zinc-400 font-bold">
                                    Next Level: <span className="text-gold font-black">{nextLevel.sb} / {nextLevel.bb}</span> (Ante: {nextLevel.ante || 0})
                                </div>
                            )}
                            <div className="flex items-center gap-3 mt-8">
                                <button
                                    onClick={() => {
                                        if (currentLevelIdx > 0) {
                                            setCurrentLevelIdx(prev => prev - 1);
                                            setTimeLeft(BLIND_LEVELS[currentLevelIdx - 1].duration);
                                        }
                                    }}
                                    disabled={currentLevelIdx === 0}
                                    className="p-3.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-white/10 rounded-2xl text-zinc-300 transition-all hover:scale-105 cursor-pointer"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setIsClockRunning(!isClockRunning)}
                                    className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black uppercase text-sm tracking-wider transition-all transform hover:scale-105 cursor-pointer ${
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
                                    className="p-3.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-2xl text-zinc-300 transition-all hover:scale-105 cursor-pointer"
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
                                    className="p-3.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-white/10 rounded-2xl text-zinc-300 transition-all hover:scale-105 cursor-pointer"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-5 p-6 bg-zinc-950/95 border border-white/10 rounded-3xl flex flex-col justify-between h-full space-y-4 backdrop-blur-md shadow-2xl">
                            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-gold" />
                                    <h3 className="text-base font-black uppercase text-white tracking-wider">Final Table Roster</h3>
                                </div>
                                <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/30 rounded-lg text-xs font-mono font-bold text-green-400">
                                    {remainingCount} / {players.length} Remaining
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                                {players.map((p, i) => {
                                    const isOut = !!eliminatedPlayers[p.name];
                                    return (
                                        <div
                                            key={p.name}
                                            onClick={() => toggleEliminate(p.name)}
                                            className={`relative flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                                                isOut
                                                    ? 'bg-zinc-950/80 border-red-950/50 opacity-40'
                                                    : i === 0
                                                    ? 'bg-gradient-to-r from-gold/15 to-black/80 border-gold/50 shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                                                    : 'bg-zinc-900/80 border-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 bg-zinc-900 ${
                                                    isOut ? 'border-red-600 grayscale' : i === 0 ? 'border-gold' : 'border-white/20'
                                                }`}>
                                                    <img
                                                        src={getAvatarFilename(p.name)}
                                                        alt={p.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {isOut && (
                                                        <div className="absolute inset-0 bg-red-950/70 flex items-center justify-center">
                                                            <Skull className="w-5 h-5 text-red-500 drop-shadow-md" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-xs font-mono font-bold ${i === 0 ? 'text-gold' : 'text-zinc-500'}`}>
                                                            #{p.rank}
                                                        </span>
                                                        <span className={`text-sm font-extrabold uppercase truncate max-w-[140px] ${
                                                            isOut ? 'line-through text-zinc-500' : 'text-white'
                                                        }`}>
                                                            {p.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] font-mono text-zinc-400 font-semibold block">
                                                        {p.points} Pts • {p.knockOuts} KOs • {p.profit >= 0 ? `+£${p.profit}` : `-£${Math.abs(p.profit)}`}
                                                    </span>
                                                </div>
                                            </div>

                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                                                isOut
                                                    ? 'bg-red-950/80 text-red-400 border-red-800'
                                                    : 'bg-green-950/80 text-green-400 border-green-700/50'
                                            }`}>
                                                {isOut ? 'BUSTED' : 'IN PLAY'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* OPTION 4: SKY SPORTS / ESPN SCROLLING NEWS TICKER FOOTER */}
            <footer className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t-2 border-gold/60 shadow-[0_-10px_30px_rgba(0,0,0,0.9)] flex items-center h-11 overflow-hidden">
                {/* Left Fixed Broadcast Bug */}
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-amber-600 text-white font-black text-xs uppercase tracking-widest px-4 h-full flex items-center gap-2 shrink-0 z-20 shadow-[5px_0_15px_rgba(0,0,0,0.8)] border-r border-white/20">
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>E.P.T. LIVE WIRE</span>
                </div>

                {/* Continuous Marquee Track (Duplicated for seamless infinite scroll) */}
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

                {/* Right Keyboard Shortcut Hint */}
                <div className="hidden xl:flex items-center gap-2 px-4 h-full bg-black border-l border-white/10 text-[10px] font-mono text-zinc-400 shrink-0 z-20">
                    <span className="text-gold font-bold">[SPACE]</span> Pause
                    <span>•</span>
                    <span className="text-gold font-bold">[←/→]</span> Slide
                </div>
            </footer>
        </div>
    );
}
