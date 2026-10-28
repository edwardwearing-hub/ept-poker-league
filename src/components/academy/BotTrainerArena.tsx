'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Target,
  Zap,
  Award,
  Sliders,
  Play,
  Eye,
  EyeOff,
  AlertTriangle,
  Users,
  Coins,
  Brain,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  Timer,
  Clock,
  RefreshCw,
  Video,
  Pause,
  Trophy,
  Crown,
  Skull,
  RotateCcw,
  Palette,
} from 'lucide-react';
import {
  Card,
  CareerTrackerStats,
  CoachFeedback,
  DecisionGrade,
  DifficultyLevel,
  GameMode,
  ScenarioConfig,
  ScenarioPreset,
  Street,
  TrainerPlayer,
} from '@/lib/poker-trainer/types';
import {
  BOARD_TEXTURE_INFO,
  BOT_ROSTER,
  GAME_MODES_INFO,
  getPositionsForTableSize,
  getPreflopHandNotation,
  POKER_HAND_RANKING_LADDER,
  POSITION_BRIDGE_LABELS,
  POSITION_INFO,
  SCENARIO_PRESETS_INFO,
} from '@/lib/poker-trainer/constants';
import {
  analyzeDrawsAndTexture,
  calculatePotOdds,
  createShuffledDeck,
  decideBotAction,
  estimateHeroEquity,
  evaluateHand,
  evaluateHeroDecision,
  getPotLimitMaxTotalBet,
  getLiveCoachRecommendation,
} from '@/lib/poker-trainer/engine';
import { computeDerivedMetrics } from '@/lib/poker-trainer/tracker';
import {
  CONSOLE_HUD_THEMES,
  ConsoleHudThemeId,
} from '@/lib/poker-trainer/console-aesthetics-db';
import InfoTooltip from './InfoTooltip';
import { useKonamiHighRoller } from '@/components/EasterEggs';
import {
  TimedBlindsConfig,
  loadTimedBlindsConfig,
  saveTimedBlindsConfig,
  playBlindsUpChime,
  formatTimeDisplay,
} from '@/lib/poker-trainer/timed-blinds';
import TimedBlindsCustomizerModal from './TimedBlindsCustomizerModal';
import TournamentBlindClockBar from './TournamentBlindClockBar';
import HandDebriefModal, { HandDebriefData } from './HandDebriefModal';
import TournamentReportModal, {
  TournamentReportData,
  TournamentEliminationEntry,
} from './TournamentReportModal';
import {
  computeTotalAcademyChips,
  BASE_ACADEMY_BANKROLL,
} from '@/lib/poker-trainer/leaderboard';
import DevWrapper from '@/components/dev/DevWrapper';

export const TOURNAMENT_BLIND_LEVELS = [
  { level: 1, sb: 5, bb: 10, ante: 0 },
  { level: 2, sb: 10, bb: 20, ante: 0 },
  { level: 3, sb: 15, bb: 30, ante: 5 },
  { level: 4, sb: 25, bb: 50, ante: 10 },
  { level: 5, sb: 50, bb: 100, ante: 20 },
  { level: 6, sb: 100, bb: 200, ante: 50 },
  { level: 7, sb: 200, bb: 400, ante: 100 },
];

export interface ActionTimelineEntry {
  id: string;
  street: Street;
  type: 'post' | 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in' | 'deal' | 'showdown';
  playerName: string;
  avatar?: string;
  isHero?: boolean;
  actionText: string;
  amount?: number;
  potAfter?: number;
  reasoning?: string;
  cards?: Card[];
  timestamp: number;
}

export function getTimelineBadgeMeta(type: ActionTimelineEntry['type'], text: string) {
  switch (type) {
    case 'fold':
      return { label: 'FOLD', bg: 'bg-zinc-800 text-zinc-400 border-zinc-600' };
    case 'check':
      return { label: 'CHECK', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/50' };
    case 'call':
      return { label: 'CALL', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' };
    case 'bet':
      return { label: 'BET', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/50' };
    case 'raise':
      return { label: 'RAISE', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/50' };
    case 'all-in':
      return { label: 'ALL-IN', bg: 'bg-red-500/25 text-red-300 border-red-500/60 font-black' };
    case 'post':
      return { label: text.toUpperCase(), bg: 'bg-zinc-800 text-gold border-gold/40' };
    case 'deal':
      return { label: 'DEAL', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
    case 'showdown':
      return { label: 'WINNER', bg: 'bg-gold/25 text-gold border-gold/60 font-black' };
    default:
      return { label: text.toUpperCase(), bg: 'bg-zinc-800 text-zinc-300 border-white/20' };
  }
}

interface Props {
  trackerStats: CareerTrackerStats;
  onUpdateTracker: (updater: (prev: CareerTrackerStats) => CareerTrackerStats) => void;
  onSwitchToTrackerTab: () => void;
  onSwitchToLicensesTab?: () => void;
  initialPreset?: ScenarioPreset;
  activeHudTheme?: ConsoleHudThemeId;
  playerName?: string;
}

export default function BotTrainerArena({
  trackerStats,
  onUpdateTracker,
  onSwitchToTrackerTab,
  onSwitchToLicensesTab,
  initialPreset,
  activeHudTheme = 'gt4-license',
  playerName,
}: Props) {
  const hudTheme = useMemo(
    () =>
      CONSOLE_HUD_THEMES[activeHudTheme] ||
      CONSOLE_HUD_THEMES['gt4-license'],
    [activeHudTheme]
  );
  const [config, setConfig] = useState<ScenarioConfig>({
    gameMode: 'no-limit',
    difficulty: 'regular',
    numPlayers: 6,
    startingBigBlinds: 100,
    smallBlind: 5,
    bigBlind: 10,
    preset: initialPreset || 'free-play',
    liveCoachHints: true,
    autoRebuy: true,
    botsAutoRebuy: true,
    heroAutoRebuy: true,
    autoShowDebrief: false,
  });

  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [deck, setDeck] = useState<Card[]>([]);
  const [players, setPlayers] = useState<TrainerPlayer[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [pot, setPot] = useState(0);
  const [street, setStreet] = useState<Street>('Waiting');
  const [handNumber, setHandNumber] = useState(0);
  const [buttonOffset, setButtonOffset] = useState(0);
  const [customRaiseAmount, setCustomRaiseAmount] = useState(30);
  const [latestFeedback, setLatestFeedback] = useState<CoachFeedback | null>(null);
  const [currentHandFeedback, setCurrentHandFeedback] = useState<CoachFeedback[]>([]);
  const [lastHandDebriefData, setLastHandDebriefData] = useState<HandDebriefData | null>(null);
  const [showDebriefModal, setShowDebriefModal] = useState(false);
  const [handSummaryBanner, setHandSummaryBanner] = useState<{
    winnerNames: string[];
    winningHandDesc: string;
    potWon: number;
    bountiesClaimedDesc?: string;
    heroNetChips: number;
    heroBankrupt?: boolean;
    heroBustedTableOnly?: boolean;
    availableMainPot?: number;
    rebuyAmount?: number;
    newBankruptcyCount?: number;
  } | null>(null);
  const [bailoutModalData, setBailoutModalData] = useState<{
    count: number;
    chipsGranted: number;
  } | null>(null);
  const [isProcessingBots, setIsProcessingBots] = useState(false);
  const [actingPlayerId, setActingPlayerId] = useState<string | null>(null);
  const [actionTimeline, setActionTimeline] = useState<ActionTimelineEntry[]>([]);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const timelineEndRef = useRef<HTMLDivElement | null>(null);
  const timersRef = useRef<number[]>([]);

  // Full Game / Sit & Go Tournament State
  const [tournamentEliminationLadder, setTournamentEliminationLadder] = useState<TournamentEliminationEntry[]>([]);
  const [heroTournamentKnockouts, setHeroTournamentKnockouts] = useState<{ playerName: string; avatar: string; handNumber?: number }[]>([]);
  const [tournamentHandsPlayed, setTournamentHandsPlayed] = useState(0);
  const [tournamentDecisions, setTournamentDecisions] = useState<CoachFeedback[]>([]);
  const [tournamentBiggestPot, setTournamentBiggestPot] = useState<{ pot: number; handDesc: string; heroCards: Card[]; board: Card[] } | null>(null);
  const [showTournamentReport, setShowTournamentReport] = useState(false);
  const [tournamentReportData, setTournamentReportData] = useState<TournamentReportData | null>(null);

  // Auto-Advance Hand Progression State ("No asking to start a new hand")
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);
  const dealNewHandRef = useRef<() => void>(() => {});

  // 4-Color Deck Preference for Accessibility (♠ Black, ♥ Red, ♦ Blue, ♣ Green)
  const [fourColorDeck, setFourColorDeck] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ept_four_color_deck');
      if (saved === 'true') {
        setFourColorDeck(true);
      }
    }
  }, []);

  const totalCareerChips = useMemo(
    () => computeTotalAcademyChips(trackerStats),
    [trackerStats]
  );

  const prevPlayerNameRef = useRef(playerName);
  useEffect(() => {
    if (prevPlayerNameRef.current !== playerName) {
      prevPlayerNameRef.current = playerName;
      setPlayers([]);
      setStreet('Waiting');
      setHandNumber(0);
      setHandSummaryBanner(null);
      setActionTimeline([]);
      setAutoAdvanceCountdown(null);
    }
  }, [playerName]);

  useEffect(() => {
    if (timelineEndRef.current) {
      timelineEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [actionTimeline]);

  // Auto-advance hand countdown timer effect
  useEffect(() => {
    if (autoAdvanceCountdown === null || isAutoPlayPaused) return;

    if (autoAdvanceCountdown <= 0) {
      setAutoAdvanceCountdown(null);
      dealNewHandRef.current?.();
      return;
    }

    const timer = window.setTimeout(() => {
      setAutoAdvanceCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [autoAdvanceCountdown, isAutoPlayPaused]);

  const clearScheduledTimers = () => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  };

  // Timed Blinds / Tournament Clock States
  const [timedBlindsConfig, setTimedBlindsConfig] = useState<TimedBlindsConfig>(() =>
    loadTimedBlindsConfig()
  );
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [blindSecondsRemaining, setBlindSecondsRemaining] = useState<number>(() => {
    const initialConf = loadTimedBlindsConfig();
    const firstLevel = initialConf.levels[0];
    return firstLevel?.durationSeconds || initialConf.defaultLevelDurationSeconds;
  });
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [showCustomizerModal, setShowCustomizerModal] = useState(false);
  const [blindsUpAnnouncement, setBlindsUpAnnouncement] = useState<{
    level: number;
    smallBlind: number;
    bigBlind: number;
    ante?: number;
  } | null>(null);

  // Screen Recording State (Native Browser MediaRecorder)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<number | null>(null);

  const startScreenRecording = async () => {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
        alert(
          'Screen recording is not supported in this browser. Please use Chrome, Edge, or Windows Game Bar (Win + Alt + R).'
        );
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: false,
      });

      recordedChunksRef.current = [];
      const mimeType =
        typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `ept_hand_recording_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);

        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        setRecordingSeconds(0);
        if (recordIntervalRef.current) {
          window.clearInterval(recordIntervalRef.current);
          recordIntervalRef.current = null;
        }
      };

      stream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      };

      recorder.start(1000);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.log('Screen recording cancelled or not permitted:', err);
      setIsRecording(false);
    }
  };

  const stopScreenRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Sync initial blinds if timed blinds is enabled on load
  useEffect(() => {
    if (timedBlindsConfig.enabled && timedBlindsConfig.levels.length > 0) {
      const activeLvl = timedBlindsConfig.levels[currentLevelIndex] || timedBlindsConfig.levels[0];
      setConfig((prev) => ({
        ...prev,
        smallBlind: activeLvl.smallBlind,
        bigBlind: activeLvl.bigBlind,
      }));
    }
  }, []);

  // Countdown Interval for Timed Blinds Clock
  useEffect(() => {
    if (!timedBlindsConfig.enabled || !isTimerRunning) return;

    const interval = window.setInterval(() => {
      setBlindSecondsRemaining((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        // Blinds advance to next level!
        const nextIdx = currentLevelIndex + 1;
        if (nextIdx < timedBlindsConfig.levels.length) {
          const nextLvl = timedBlindsConfig.levels[nextIdx];
          setCurrentLevelIndex(nextIdx);

          setConfig((prevConfig) => ({
            ...prevConfig,
            smallBlind: nextLvl.smallBlind,
            bigBlind: nextLvl.bigBlind,
          }));

          if (timedBlindsConfig.soundAlerts) {
            playBlindsUpChime();
          }

          setBlindsUpAnnouncement({
            level: nextLvl.level,
            smallBlind: nextLvl.smallBlind,
            bigBlind: nextLvl.bigBlind,
            ante: nextLvl.ante,
          });

          return nextLvl.durationSeconds || timedBlindsConfig.defaultLevelDurationSeconds;
        } else {
          // Reached final level: reset timer to duration and stay at final level
          return timedBlindsConfig.defaultLevelDurationSeconds;
        }
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timedBlindsConfig, isTimerRunning, currentLevelIndex]);

  // Auto-dismiss Blinds Up Announcement after 5 seconds
  useEffect(() => {
    if (blindsUpAnnouncement) {
      const dismissTimer = window.setTimeout(() => {
        setBlindsUpAnnouncement(null);
      }, 5000);
      return () => window.clearTimeout(dismissTimer);
    }
  }, [blindsUpAnnouncement]);

  const handleSaveTimedBlindsConfig = (newConfig: TimedBlindsConfig) => {
    setTimedBlindsConfig(newConfig);
    saveTimedBlindsConfig(newConfig);

    if (newConfig.enabled) {
      const activeLvl = newConfig.levels[currentLevelIndex] || newConfig.levels[0];
      if (activeLvl) {
        setConfig((prev) => ({
          ...prev,
          smallBlind: activeLvl.smallBlind,
          bigBlind: activeLvl.bigBlind,
        }));
        setBlindSecondsRemaining(activeLvl.durationSeconds || newConfig.defaultLevelDurationSeconds);
      }
    }
  };

  const handleToggleTimer = () => {
    setIsTimerRunning((prev) => !prev);
  };

  const handleResetTimer = () => {
    const curLevel = timedBlindsConfig.levels[currentLevelIndex] || timedBlindsConfig.levels[0];
    setBlindSecondsRemaining(curLevel?.durationSeconds || timedBlindsConfig.defaultLevelDurationSeconds);
  };

  const handleNextBlindLevel = () => {
    if (currentLevelIndex < timedBlindsConfig.levels.length - 1) {
      const nextIdx = currentLevelIndex + 1;
      const nextLvl = timedBlindsConfig.levels[nextIdx];
      setCurrentLevelIndex(nextIdx);
      setBlindSecondsRemaining(nextLvl.durationSeconds || timedBlindsConfig.defaultLevelDurationSeconds);
      setConfig((prev) => ({
        ...prev,
        smallBlind: nextLvl.smallBlind,
        bigBlind: nextLvl.bigBlind,
      }));
    }
  };

  const handlePrevBlindLevel = () => {
    if (currentLevelIndex > 0) {
      const prevIdx = currentLevelIndex - 1;
      const prevLvl = timedBlindsConfig.levels[prevIdx];
      setCurrentLevelIndex(prevIdx);
      setBlindSecondsRemaining(prevLvl.durationSeconds || timedBlindsConfig.defaultLevelDurationSeconds);
      setConfig((prev) => ({
        ...prev,
        smallBlind: prevLvl.smallBlind,
        bigBlind: prevLvl.bigBlind,
      }));
    }
  };

  const handleJumpToLevel = (idx: number) => {
    if (idx >= 0 && idx < timedBlindsConfig.levels.length) {
      const targetLvl = timedBlindsConfig.levels[idx];
      setCurrentLevelIndex(idx);
      setBlindSecondsRemaining(targetLvl.durationSeconds || timedBlindsConfig.defaultLevelDurationSeconds);
      setConfig((prev) => ({
        ...prev,
        smallBlind: targetLvl.smallBlind,
        bigBlind: targetLvl.bigBlind,
      }));
    }
  };

  const scheduleTimer = (fn: () => void, delayMs: number) => {
    const id = window.setTimeout(fn, delayMs);
    timersRef.current.push(id);
    return id;
  };

  useEffect(() => {
    return () => clearScheduledTimers();
  }, []);

  // Sync preset changes if triggered from Leak Analyzer
  useEffect(() => {
    if (initialPreset && initialPreset !== 'free-play') {
      applyPreset(initialPreset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPreset]);

  const derivedMetrics = useMemo(() => computeDerivedMetrics(trackerStats), [trackerStats]);

  const applyPreset = (presetId: ScenarioPreset) => {
    const info = SCENARIO_PRESETS_INFO[presetId];
    setConfig((prev) => ({
      ...prev,
      preset: presetId,
      gameMode: info.recommendedMode,
      numPlayers: info.recommendedPlayers,
      startingBigBlinds: info.recommendedBB,
    }));
  };

  const startNewFullTournament = () => {
    clearScheduledTimers();
    setAutoAdvanceCountdown(null);
    setShowTournamentReport(false);
    setTournamentReportData(null);
    setTournamentEliminationLadder([]);
    setHeroTournamentKnockouts([]);
    setTournamentHandsPlayed(0);
    setTournamentDecisions([]);
    setTournamentBiggestPot(null);
    setHandSummaryBanner(null);
    setPlayers([]);
    setHandNumber(0);
    setStreet('Waiting');

    setConfig((prev) => ({
      ...prev,
      gameMode: 'tournament-eliminator',
      startingBigBlinds: 100,
      smallBlind: 5,
      bigBlind: 10,
      preset: 'free-play',
      numPlayers: 6,
      autoRebuy: false,
      botsAutoRebuy: false,
      heroAutoRebuy: false,
      autoShowDebrief: false,
    }));

    setTimeout(() => {
      dealNewHandRef.current?.();
    }, 80);
  };

  const handleModeChange = (mode: GameMode) => {
    clearScheduledTimers();
    setAutoAdvanceCountdown(null);

    if (mode === 'tournament-eliminator') {
      startNewFullTournament();
      return;
    }

    const modeInfo = GAME_MODES_INFO[mode];
    setConfig((prev) => ({
      ...prev,
      gameMode: mode,
      startingBigBlinds: modeInfo.defaultBB,
      preset: 'free-play',
      botsAutoRebuy: true,
      heroAutoRebuy: true,
      autoShowDebrief: false,
    }));
  };

  // Start / Deal a new hand with staggered card dealing + sequential 1-second pre-flop bot turns
  const dealNewHand = () => {
    clearScheduledTimers();
    setCurrentHandFeedback([]);
    setShowDebriefModal(false);
    setAutoAdvanceCountdown(null);
    dealNewHandRef.current = dealNewHand;

    const isTournament = config.gameMode === 'tournament-eliminator';
    const freshDeck = createShuffledDeck();

    let bb = config.bigBlind;
    let sb = config.smallBlind;
    let ante = 0;

    if (isTournament) {
      const levelIdx = Math.min(
        TOURNAMENT_BLIND_LEVELS.length - 1,
        Math.floor(handNumber / 3)
      );
      const curLvl = TOURNAMENT_BLIND_LEVELS[levelIdx];
      bb = curLvl.bb;
      sb = curLvl.sb;
      ante = curLvl.ante;
    } else {
      const activeLevel = timedBlindsConfig.enabled
        ? timedBlindsConfig.levels[currentLevelIndex] || timedBlindsConfig.levels[0]
        : undefined;
      bb = activeLevel ? activeLevel.bigBlind : config.bigBlind;
      sb = activeLevel ? activeLevel.smallBlind : config.smallBlind;
      ante = activeLevel?.ante || 0;
    }

    const effectiveBB =
      config.gameMode === 'all-in-or-fold' ? 10 : config.startingBigBlinds;
    const baseStartingChips = isTournament ? 1000 : effectiveBB * bb;

    const numBots = config.numPlayers - 1;
    const cleanPlayerName = (playerName || '').toLowerCase().trim();
    const availableBots = BOT_ROSTER.filter((b) => {
      if (!cleanPlayerName || cleanPlayerName === 'guest trainee') return true;
      const bName = b.name.toLowerCase().trim();
      return !bName.includes(cleanPlayerName) && !cleanPlayerName.includes(bName);
    });
    const selectedBots = (availableBots.length >= numBots ? availableBots : BOT_ROSTER).slice(0, numBots);
    const nextHandNum = handNumber + 1;
    const nextBtnOffset = (buttonOffset + 1) % config.numPlayers;
    const positions = getPositionsForTableSize(config.numPlayers);

    const drawCard = (): Card => freshDeck.pop()!;

    const seatParticipants: TrainerPlayer[] = [];

    for (let i = 0; i < config.numPlayers; i++) {
      const posIndex = (i - nextBtnOffset + config.numPlayers) % config.numPlayers;
      let position = positions[posIndex];

      if (config.preset === 'btn-vs-bb-3bet' && i === 0) {
        position = nextHandNum % 2 === 0 ? 'BTN' : 'BB';
      }

      const isHero = i === 0;
      const botProfile = !isHero ? selectedBots[i - 1] : undefined;

      let stackChips = baseStartingChips;
      if (isHero) {
        const prevHero = players.find((p) => p.isHero);
        if (isTournament) {
          if (handNumber === 0 || !prevHero) {
            stackChips = 1000;
          } else {
            stackChips = Math.max(0, prevHero.chips);
          }
        } else if (config.gameMode === 'all-in-or-fold') {
          stackChips = 10 * bb;
        } else if (prevHero && prevHero.chips >= bb) {
          // Carry over Hero's chip stack from the previous hand!
          // (e.g. if hero won 250 chips, hero starts with 1,250 chips)
          stackChips = prevHero.chips;
        } else if (prevHero && prevHero.chips < bb) {
          // Hero had a previous stack and busted their table stack!
          // Check if Hero has money in their Main Pot to rebuy!
          if (totalCareerChips > 0) {
            const rebuySize = Math.min(totalCareerChips, baseStartingChips);
            stackChips = Math.max(bb, rebuySize);
          } else {
            // Truly bankrupt (lost all money): £1,000 emergency bailout
            stackChips = 1000;
          }
        } else {
          // First hand of session (no prevHero yet):
          stackChips = baseStartingChips;
        }
      } else {
        const prevBot = players.find((p) => p.id === botProfile!.id);
        if (isTournament) {
          if (handNumber === 0 || !prevBot) {
            stackChips = 1000;
          } else {
            stackChips = Math.max(0, prevBot.chips);
          }
        } else {
          const botBusted = !prevBot || prevBot.chips < bb * 2;
          if (config.preset === 'bounty-short-stack' && i <= 2) {
            stackChips = 12 * bb;
          } else if (config.gameMode === 'icm-bubble') {
            const mults = [1.8, 0.45, 0.9, 1.3, 0.6, 1.1, 0.75, 1.5];
            stackChips = Math.round(baseStartingChips * mults[(i - 1) % mults.length]);
          } else if (config.gameMode === 'all-in-or-fold') {
            stackChips = 10 * bb;
          } else if (!botBusted) {
            // Bots also carry over their chip balance from hand to hand!
            stackChips = prevBot.chips;
          } else if (config.botsAutoRebuy !== false) {
            // Bots auto-rebuy is ON: reload to starting buy-in!
            stackChips = baseStartingChips;
          } else {
            // Bots auto-rebuy is OFF: bot sits out with 0 chips
            stackChips = 0;
          }
        }
      }

      const bountyVal =
        config.gameMode === 'bounty-hunter'
          ? !isHero && config.preset === 'bounty-short-stack' && i <= 2
            ? bb * 80
            : bb * 50
          : 0;

      const isEliminated = isTournament && stackChips <= 0;

      seatParticipants.push({
        id: isHero ? 'hero' : botProfile!.id,
        name: isHero
          ? playerName && playerName !== 'Guest Trainee'
            ? `${playerName} (Hero)`
            : 'You (Hero)'
          : botProfile!.name,
        isHero,
        avatar: isHero ? '/avatars/avatar_shark.png' : botProfile!.avatar,
        persona: botProfile?.persona,
        nickname: isHero ? derivedMetrics.archetype.split(' ')[0] : botProfile?.nickname,
        position,
        seatIndex: i,
        chips: stackChips,
        startingChips: stackChips,
        currentBet: 0,
        totalCommitted: 0,
        cards: [drawCard(), drawCard()],
        folded: isEliminated || stackChips === 0,
        isAllIn: false,
        bountyValue: bountyVal,
        bountiesWon: players[i]?.bountiesWon || 0,
        lastAction: isEliminated ? 'Eliminated' : stackChips === 0 ? 'Sitting Out' : undefined,
      });
    }

    let initialPot = 0;
    let initialCommunity: Card[] = [];
    let initialStreet: Street = 'Pre-flop';

    if (config.gameMode === 'bomb-pot') {
      const bombAnte = bb * 4;
      const initialEvents: ActionTimelineEntry[] = [];
      const baseTs = Date.now();
      for (const p of seatParticipants) {
        if (p.chips <= 0 || p.folded) continue;
        const paid = Math.min(p.chips, bombAnte);
        p.chips -= paid;
        p.totalCommitted += paid;
        initialPot += paid;
        p.lastAction = `Bomb Ante £${paid}`;
        initialEvents.push({
          id: `timeline-init-${p.id}`,
          street: 'Flop',
          type: 'post',
          playerName: p.name,
          avatar: p.avatar,
          isHero: p.isHero,
          actionText: `Posted Bomb Ante £${paid}`,
          amount: paid,
          potAfter: initialPot,
          timestamp: baseTs,
        });
      }
      initialCommunity = [drawCard(), drawCard(), drawCard()];
      initialEvents.push({
        id: `timeline-flop-${baseTs}`,
        street: 'Flop',
        type: 'deal',
        playerName: 'Dealer',
        actionText: 'Flop Dealt',
        cards: initialCommunity,
        potAfter: initialPot,
        timestamp: baseTs + 1,
      });
      initialStreet = 'Flop';

      setDeck(freshDeck);
      setPlayers(seatParticipants);
      setCommunityCards(initialCommunity);
      setPot(initialPot);
      setStreet(initialStreet);
      setHandNumber(nextHandNum);
      setButtonOffset(nextBtnOffset);
      setCustomRaiseAmount(
        Math.min(seatParticipants[0].chips, Math.max(bb * 2.5, Math.round(initialPot * 0.5)))
      );
      setHandSummaryBanner(null);
      setLatestFeedback(null);
      setCurrentHandFeedback([]);
      setActingPlayerId('hero');
      setIsProcessingBots(false);
      setActionTimeline(initialEvents);
      return;
    }

    const initialEvents: ActionTimelineEntry[] = [];
    const baseTs = Date.now();

    // Post Ante if configured for this level
    if (ante > 0) {
      for (const p of seatParticipants) {
        if (p.chips <= 0 || p.folded) continue;
        const antePaid = Math.min(p.chips, ante);
        p.chips -= antePaid;
        p.totalCommitted += antePaid;
        initialPot += antePaid;
        p.lastAction = `Ante £${antePaid}`;
        initialEvents.push({
          id: `timeline-ante-${p.id}`,
          street: 'Pre-flop',
          type: 'post',
          playerName: p.name,
          avatar: p.avatar,
          isHero: p.isHero,
          actionText: `Posted Ante £${antePaid}`,
          amount: antePaid,
          potAfter: initialPot,
          timestamp: baseTs,
        });
      }
    }

    // Standard Pre-Flop Blinds Posting
    for (const p of seatParticipants) {
      if (p.chips <= 0 || p.folded) continue;
      if (p.position === 'SB') {
        const paid = Math.min(p.chips, sb);
        p.chips -= paid;
        p.currentBet = paid;
        p.totalCommitted = paid;
        initialPot += paid;
        p.lastAction = `SB £${paid}`;
        initialEvents.push({
          id: `timeline-sb-${p.id}`,
          street: 'Pre-flop',
          type: 'post',
          playerName: p.name,
          avatar: p.avatar,
          isHero: p.isHero,
          actionText: `Posted Small Blind £${paid}`,
          amount: paid,
          potAfter: initialPot,
          timestamp: baseTs + 5,
        });
      } else if (p.position === 'BB') {
        const paid = Math.min(p.chips, bb);
        p.chips -= paid;
        p.currentBet = paid;
        p.totalCommitted = paid;
        initialPot += paid;
        p.lastAction = `BB £${paid}`;
        initialEvents.push({
          id: `timeline-bb-${p.id}`,
          street: 'Pre-flop',
          type: 'post',
          playerName: p.name,
          avatar: p.avatar,
          isHero: p.isHero,
          actionText: `Posted Big Blind £${paid}`,
          amount: paid,
          potAfter: initialPot,
          timestamp: baseTs + 10,
        });
      }
    }

    // Render initial deal & blinds immediately
    setDeck(freshDeck);
    setPlayers(seatParticipants.map((p) => ({ ...p })));
    setCommunityCards([]);
    setPot(initialPot);
    setStreet('Pre-flop');
    setHandNumber(nextHandNum);
    setButtonOffset(nextBtnOffset);
    setHandSummaryBanner(null);
    setLatestFeedback(null);
    setCurrentHandFeedback([]);
    setActionTimeline(initialEvents);

    const heroPlayer = seatParticipants[0];
    const preflopOrder: Record<string, number> = {
      UTG: 1,
      'UTG+1': 2,
      MP: 3,
      LJ: 4,
      HJ: 5,
      CO: 6,
      BTN: 7,
      SB: 8,
      BB: 9,
    };
    const heroOrder = preflopOrder[heroPlayer.position] || 5;

    // Identify bots that act before Hero pre-flop, sorted in table action order
    const botsBeforeHero = seatParticipants
      .filter((p) => {
        if (p.isHero || p.folded || p.chips <= 0) return false;
        const botOrder = preflopOrder[p.position] || 5;
        return botOrder < heroOrder || config.preset === 'btn-vs-bb-3bet';
      })
      .sort(
        (a, b) => (preflopOrder[a.position] || 5) - (preflopOrder[b.position] || 5)
      );

    if (botsBeforeHero.length === 0) {
      setCustomRaiseAmount(
        Math.min(seatParticipants[0].chips, Math.round(bb * 2.5))
      );
      setActingPlayerId('hero');
      setIsProcessingBots(false);
      return;
    }

    // Sequential ~1-second delay per pre-flop bot action
    setIsProcessingBots(true);
    let workingPlayers = seatParticipants.map((p) => ({ ...p }));
    let workingPot = initialPot;
    let currentHighBet = bb;
    const BOT_STEP_DELAY_MS = 1000;
    const INITIAL_DEAL_PAUSE_MS = 700;

    // Highlight first acting bot after card deal animation
    scheduleTimer(() => {
      setActingPlayerId(botsBeforeHero[0].id);
    }, INITIAL_DEAL_PAUSE_MS);

    botsBeforeHero.forEach((botRef, stepIdx) => {
      const actionFireTime = INITIAL_DEAL_PAUSE_MS + (stepIdx + 1) * BOT_STEP_DELAY_MS;

      scheduleTimer(() => {
        const targetBot = workingPlayers.find((wp) => wp.id === botRef.id);
        if (targetBot && !targetBot.folded && !targetBot.isAllIn) {
          const decision = decideBotAction({
            bot: targetBot,
            communityCards: [],
            street: 'Pre-flop',
            pot: workingPot,
            highestBet: currentHighBet,
            activePlayers: workingPlayers.filter((sp) => !sp.folded),
            config,
            heroStatsSummary: {
              vpipPercent: derivedMetrics.vpipPercent,
              pfrPercent: derivedMetrics.pfrPercent,
              foldToPressurePercent: derivedMetrics.foldToPressurePercent,
            },
          });

          const isLastPreHeroBot = stepIdx === botsBeforeHero.length - 1;
          const otherActiveBots = workingPlayers.filter(
            (wp) => !wp.isHero && wp.id !== targetBot.id && !wp.folded
          );

          // Ensure at least 1 bot stays in the hand if all previous bots folded
          if (decision.action === 'fold' && isLastPreHeroBot && otherActiveBots.length === 0) {
            const callDiff = Math.max(0, currentHighBet - targetBot.currentBet);
            const added = Math.min(targetBot.chips, callDiff);
            targetBot.chips -= added;
            targetBot.currentBet += added;
            targetBot.totalCommitted += added;
            workingPot += added;
            targetBot.lastAction = `Call £${targetBot.currentBet}`;
            targetBot.lastActionReasoning = 'Defending to keep action live against Hero.';
          } else if (decision.action === 'fold') {
            targetBot.folded = true;
            targetBot.lastAction = 'Fold';
            targetBot.lastActionReasoning = decision.reasoning;
          } else if (decision.action === 'check') {
            targetBot.lastAction = 'Check';
            targetBot.lastActionReasoning = decision.reasoning;
          } else {
            const added = Math.min(targetBot.chips, decision.betAmount);
            targetBot.chips -= added;
            targetBot.currentBet += added;
            targetBot.totalCommitted += added;
            workingPot += added;
            if (targetBot.chips === 0) targetBot.isAllIn = true;
            if (targetBot.currentBet > currentHighBet) {
              currentHighBet = targetBot.currentBet;
            }
            targetBot.lastAction =
              decision.action === 'all-in'
                ? `ALL-IN (£${targetBot.currentBet})`
                : decision.action === 'raise'
                ? `Raise £${targetBot.currentBet}`
                : `Call £${targetBot.currentBet}`;
            targetBot.lastActionReasoning = decision.reasoning;
          }
        }

        // Snapshot state update for this single bot's action
        const snapshot = workingPlayers.map((wp) => ({ ...wp }));
        setPlayers(snapshot);
        setPot(workingPot);

        if (targetBot) {
          setActionTimeline((prev) => [
            ...prev,
            {
              id: `timeline-bot-${targetBot.id}-${Date.now()}`,
              street: 'Pre-flop',
              type: targetBot.folded
                ? 'fold'
                : targetBot.isAllIn
                ? 'all-in'
                : targetBot.lastAction?.toLowerCase().includes('raise')
                ? 'raise'
                : targetBot.lastAction?.toLowerCase().includes('call')
                ? 'call'
                : 'check',
              playerName: targetBot.name,
              avatar: targetBot.avatar,
              isHero: false,
              actionText: targetBot.lastAction || 'Acted',
              amount: targetBot.currentBet,
              potAfter: workingPot,
              reasoning: targetBot.lastActionReasoning,
              timestamp: Date.now(),
            },
          ]);
        }

        // Advance turn indicator to next bot or to Hero
        const nextBot = botsBeforeHero[stepIdx + 1];
        if (nextBot) {
          setActingPlayerId(nextBot.id);
        } else {
          const maxBetNow = Math.max(...snapshot.map((p) => p.currentBet), bb);
          setCustomRaiseAmount(
            Math.min(snapshot[0].chips, Math.max(Math.round(maxBetNow * 2.5), Math.round(bb * 2.5)))
          );
          setActingPlayerId('hero');
          setIsProcessingBots(false);
        }
      }, actionFireTime);
    });
  };

  const hero = players.find((p) => p.isHero);
  const activeOpponents = players.filter((p) => !p.isHero && !p.folded);
  const highestBetOnStreet = useMemo(
    () => (players.length > 0 ? Math.max(...players.map((p) => p.currentBet)) : 0),
    [players]
  );
  const callAmount = hero ? Math.max(0, highestBetOnStreet - hero.currentBet) : 0;

  const maxAllowedRaiseAdditional = useMemo(() => {
    if (!hero) return 0;
    if (config.gameMode === 'pot-limit') {
      const maxTotal = getPotLimitMaxTotalBet(
        pot,
        highestBetOnStreet,
        hero.currentBet,
        hero.chips
      );
      return Math.max(0, maxTotal - hero.currentBet);
    }
    return hero.chips;
  }, [hero, config.gameMode, pot, highestBetOnStreet]);

  const minRaiseAdditional = useMemo(() => {
    if (!hero) return 0;
    return Math.min(hero.chips, callAmount + config.bigBlind);
  }, [hero, callAmount, config.bigBlind]);

  const liveAnalysis = useMemo(() => {
    if (!hero || hero.cards.length < 2 || street === 'Waiting') return null;
    const handEval = evaluateHand([...hero.cards, ...communityCards]);
    const drawInfo = analyzeDrawsAndTexture(hero.cards, communityCards);
    const activeBettors = activeOpponents.filter((opp) => opp.currentBet > 0 || opp.isAllIn);
    const effectiveOpps =
      street === 'Pre-flop' ? Math.max(1, activeBettors.length) : Math.max(1, activeOpponents.length);
    const equity = estimateHeroEquity(
      hero.cards,
      communityCards,
      effectiveOpps
    );

    let bountyBonus = 0;
    if (config.gameMode === 'bounty-hunter' && callAmount > 0) {
      for (const opp of activeOpponents) {
        if (opp.isAllIn && hero.chips >= callAmount) {
          bountyBonus += Math.round(opp.bountyValue * 0.5);
        }
      }
    }
    const { rawPotOdds, bountyAdjustedPotOdds } = calculatePotOdds(
      callAmount,
      pot,
      bountyBonus
    );
    const notation = getPreflopHandNotation(hero.cards[0], hero.cards[1]);

    return {
      handEval,
      drawInfo,
      equity,
      rawPotOdds,
      bountyAdjustedPotOdds,
      bountyBonus,
      notation,
    };
  }, [hero, communityCards, street, activeOpponents, config.gameMode, callAmount, pot]);

  const liveCoachRec = useMemo(() => {
    if (!hero || hero.cards.length < 2 || street === 'Waiting' || street === 'Showdown' || hero.folded) return null;
    return getLiveCoachRecommendation({
      hero,
      pot,
      callAmount,
      communityCards,
      street,
      activeOpponents,
      config,
    });
  }, [hero, pot, callAmount, communityCards, street, activeOpponents, config]);

  const resolveHandOutcome = (
    updatedPlayers: TrainerPlayer[],
    finalBoard: Card[],
    finalPot: number
  ) => {
    const remaining = updatedPlayers.filter((p) => !p.folded);
    const heroNow = updatedPlayers.find((p) => p.isHero)!;

    let winners: TrainerPlayer[] = [];
    let winningDesc = 'Opponents Folded';
    const reachedShowdown = remaining.length > 1;

    if (remaining.length === 1) {
      winners = [remaining[0]];
    } else {
      let bestScore = -1;
      for (const p of remaining) {
        const evalRes = evaluateHand([...p.cards, ...finalBoard]);
        if (evalRes.exactScore > bestScore) {
          bestScore = evalRes.exactScore;
          winners = [p];
          winningDesc = `${evalRes.rankName} (${evalRes.bestFiveDescription})`;
        } else if (evalRes.exactScore === bestScore) {
          winners.push(p);
        }
      }
    }

    const share = Math.floor(finalPot / Math.max(1, winners.length));
    const winnerIds = new Set(winners.map((w) => w.id));

    let bountiesClaimedByHero = 0;
    let bountyCashByHero = 0;
    const bountyNotes: string[] = [];

    if (config.gameMode === 'bounty-hunter') {
      for (const p of updatedPlayers) {
        if (!winnerIds.has(p.id) && p.chips === 0 && !p.folded) {
          const koWinners = winners.filter((w) => w.totalCommitted >= p.totalCommitted);
          if (koWinners.length > 0) {
            const koWinner = koWinners[0];
            const instantReward = Math.round(p.bountyValue * 0.5);
            const headIncrease = p.bountyValue - instantReward;
            koWinner.bountiesWon += 1;
            koWinner.bountyValue += headIncrease;
            koWinner.chips += instantReward;
            bountyNotes.push(
              `${koWinner.name} knocked out ${p.name} (+£${instantReward} Bounty!)`
            );
            if (koWinner.isHero) {
              bountiesClaimedByHero += 1;
              bountyCashByHero += instantReward;
            }
          }
        }
      }
    }

    const finalPlayers = updatedPlayers.map((p) =>
      winnerIds.has(p.id) ? { ...p, chips: p.chips + share } : p
    );

    const updatedHero = finalPlayers.find((p) => p.isHero)!;
    const heroNetChips = updatedHero.chips - updatedHero.startingChips;
    const heroNetBB = Number((heroNetChips / config.bigBlind).toFixed(1));
    const heroWon = winnerIds.has('hero');

    const isTournament = config.gameMode === 'tournament-eliminator';

    // Calculate player's projected total Main Pot bankroll after this hand outcome
    const currentRecordedNet = trackerStats.netChipsWon || 0;
    const totalMainPotAfterHand =
      BASE_ACADEMY_BANKROLL +
      (currentRecordedNet + heroNetChips) +
      (trackerStats.bountyCashWon || 0) +
      (trackerStats.bailoutChipsReceived || 0);

    const heroTableBusted = updatedHero.chips <= 0;
    // Bankrupt bailout ONLY triggers if player lost ALL of their money (main pot <= 0) and not in a tournament
    const heroIsBankrupt = !isTournament && heroTableBusted && totalMainPotAfterHand <= 0;
    const heroBustedTableOnly = !isTournament && heroTableBusted && totalMainPotAfterHand > 0;

    const currentBankruptcies = trackerStats.bankruptcyCount || 0;
    const nextBankruptcyCount = currentBankruptcies + (heroIsBankrupt ? 1 : 0);

    const standardBuyIn = config.startingBigBlinds * config.bigBlind;
    const rebuyAmount = heroBustedTableOnly ? Math.min(totalMainPotAfterHand, standardBuyIn) : 0;

    if (heroIsBankrupt) {
      setBailoutModalData({
        count: nextBankruptcyCount,
        chipsGranted: 1000,
      });
    }

    // Process Tournament Knockouts & Elimination Ladder
    const updatedLadder = [...tournamentEliminationLadder];
    const updatedHeroKnockouts = [...heroTournamentKnockouts];
    let tournamentEnded = false;

    if (isTournament) {
      const newlyEliminated = finalPlayers.filter(
        (p) =>
          p.chips <= 0 &&
          !updatedLadder.some(
            (e) => e.playerName.toLowerCase() === p.name.replace(' (Hero)', '').toLowerCase()
          )
      );

      const mainKiller = winners[0];
      const killerName = mainKiller ? mainKiller.name.replace(' (Hero)', '') : undefined;

      for (const busted of newlyEliminated) {
        const placement = config.numPlayers - updatedLadder.length;
        const entry: TournamentEliminationEntry = {
          placement,
          playerName: busted.name.replace(' (Hero)', ''),
          avatar: busted.avatar,
          isHero: busted.isHero,
          knockedOutBy: killerName,
          handNumber,
        };
        updatedLadder.push(entry);

        if (mainKiller && mainKiller.isHero && !busted.isHero) {
          updatedHeroKnockouts.push({
            playerName: busted.name.replace(' (Hero)', ''),
            avatar: busted.avatar,
            handNumber,
          });
        }
        bountyNotes.push(`💀 ${busted.name.replace(' (Hero)', '')} knocked out (${placement}th place)!`);
      }

      if (newlyEliminated.length > 0) {
        setTournamentEliminationLadder(updatedLadder);
        setHeroTournamentKnockouts(updatedHeroKnockouts);
      }

      setTournamentHandsPlayed((prev) => prev + 1);
      if (currentHandFeedback.length > 0) {
        setTournamentDecisions((prev) => [...prev, ...currentHandFeedback]);
      }
      if (heroWon && (!tournamentBiggestPot || finalPot > tournamentBiggestPot.pot)) {
        setTournamentBiggestPot({
          pot: finalPot,
          handDesc: winningDesc,
          heroCards: heroNow.cards,
          board: finalBoard,
        });
      }

      const alive = finalPlayers.filter((p) => p.chips > 0);
      const heroDead = updatedHero.chips <= 0;
      const heroChampion = alive.length === 1 && alive[0].isHero;
      const tournamentOver = heroDead || heroChampion || alive.length <= 1;

      if (tournamentOver) {
        tournamentEnded = true;
        const totalPrizePool = config.numPlayers * 1000;
        const heroPlacement = heroChampion
          ? 1
          : Math.max(2, config.numPlayers - updatedLadder.length + 1);

        const completeLadder: TournamentEliminationEntry[] = [];
        if (heroChampion) {
          completeLadder.push({
            placement: 1,
            playerName: playerName && playerName !== 'Guest Trainee' ? playerName : 'You (Hero)',
            avatar: '/avatars/avatar_shark.png',
            isHero: true,
          });
        } else if (alive.length === 1) {
          completeLadder.push({
            placement: 1,
            playerName: alive[0].name.replace(' (Hero)', ''),
            avatar: alive[0].avatar,
            isHero: false,
          });
        }
        completeLadder.push(...updatedLadder.sort((a, b) => a.placement - b.placement));

        const allDecisions = [...tournamentDecisions, ...currentHandFeedback];
        const optimal = allDecisions.filter((d) => d.grade === 'A+' || d.grade === 'B').length;
        const accuracy =
          allDecisions.length > 0 ? Math.round((optimal / allDecisions.length) * 100) : 100;

        let overallGrade: DecisionGrade = 'A+';
        if (accuracy < 60) overallGrade = 'D';
        else if (accuracy < 75) overallGrade = 'C';
        else if (accuracy < 88) overallGrade = 'B';

        const strengths: string[] = [];
        if (heroChampion) {
          strengths.push('Winner Takes All: Mastered the full table and collected all tournament chips.');
        }
        if (accuracy >= 80) {
          strengths.push(`High Technical Precision: ${accuracy}% optimal EV decision accuracy.`);
        }
        if (updatedHeroKnockouts.length > 0) {
          strengths.push(
            `Knockout Specialist: Personally eliminated ${updatedHeroKnockouts.length} opponent${
              updatedHeroKnockouts.length > 1 ? 's' : ''
            }.`
          );
        }
        if (strengths.length === 0) {
          strengths.push('Maintained solid discipline through escalating blind structures.');
        }

        const leakMap: Record<string, number> = {};
        for (const d of allDecisions) {
          if (d.leakCategory) {
            leakMap[d.leakCategory] = (leakMap[d.leakCategory] || 0) + 1;
          }
        }
        const topLeaks = Object.entries(leakMap).sort((a, b) => b[1] - a[1]);
        const coachLeaksCaught = topLeaks
          .slice(0, 2)
          .map(([cat]) => `Watch out for ${cat.replace(/-/g, ' ')} under blind pressure.`);

        const verdict = heroChampion
          ? `Incredible performance! You navigated the escalating blind structure, stacked ${
              updatedHeroKnockouts.length
            } opponents, and claimed all £${totalPrizePool.toLocaleString()} chips in the tournament.`
          : `You finished in ${heroPlacement}${
              heroPlacement === 2 ? 'nd' : heroPlacement === 3 ? 'rd' : 'th'
            } place out of ${
              config.numPlayers
            } players. Review your priority leaks and sharpen your short-stack play for the next tournament.`;

        const report: TournamentReportData = {
          tournamentTitle: 'Sit & Go Eliminator',
          heroPlacement,
          totalParticipants: config.numPlayers,
          totalHandsPlayed: tournamentHandsPlayed + 1,
          totalPrizePool,
          heroNetChips: heroChampion ? totalPrizePool - 1000 : -1000,
          heroKnockouts: updatedHeroKnockouts,
          eliminationLadder: completeLadder,
          handsWon: trackerStats.handsWon + (heroWon ? 1 : 0),
          winRatePercent: Math.round(
            ((trackerStats.handsWon + (heroWon ? 1 : 0)) /
              Math.max(1, tournamentHandsPlayed + 1)) *
              100
          ),
          vpipPercent: derivedMetrics.vpipPercent,
          pfrPercent: derivedMetrics.pfrPercent,
          aggressionFactor: derivedMetrics.aggressionFactor,
          coachGrade: overallGrade,
          coachAccuracyPercent: accuracy,
          biggestPotWon:
            heroWon && (!tournamentBiggestPot || finalPot > tournamentBiggestPot.pot)
              ? {
                  pot: finalPot,
                  handDesc: winningDesc,
                  heroCards: heroNow.cards,
                  board: finalBoard,
                }
              : tournamentBiggestPot,
          coachStrengths: strengths,
          coachLeaksCaught,
          coachVerdict: verdict,
        };

        setTournamentReportData(report);
        setAutoAdvanceCountdown(null);
        setTimeout(() => {
          setShowTournamentReport(true);
        }, 1200);
      }
    }

    setPlayers(finalPlayers);
    setActingPlayerId(null);
    setStreet('Showdown');
    setHandSummaryBanner({
      winnerNames: winners.map((w) => w.name),
      winningHandDesc: winningDesc,
      potWon: finalPot,
      bountiesClaimedDesc: bountyNotes.length > 0 ? bountyNotes.join(' • ') : undefined,
      heroNetChips,
      heroBankrupt: heroIsBankrupt,
      heroBustedTableOnly,
      availableMainPot: totalMainPotAfterHand,
      rebuyAmount,
      newBankruptcyCount: heroIsBankrupt ? nextBankruptcyCount : undefined,
    });

    const showdownTimelineEntry: ActionTimelineEntry = {
      id: `timeline-showdown-${Date.now()}`,
      street: 'Showdown',
      type: 'showdown',
      playerName: winners.map((w) => w.name).join(' & '),
      actionText: `${winners.map((w) => w.name).join(' & ')} won £${finalPot}!`,
      reasoning: winningDesc,
      potAfter: finalPot,
      timestamp: Date.now(),
    };

    setActionTimeline((prev) => [...prev, showdownTimelineEntry]);

    const activeAnte = timedBlindsConfig.enabled
      ? timedBlindsConfig.levels[currentLevelIndex]?.ante || 0
      : undefined;

    const debrief: HandDebriefData = {
      handNumber,
      gameMode: config.gameMode,
      blinds: {
        sb: config.smallBlind,
        bb: config.bigBlind,
        ante: activeAnte,
      },
      heroCards: heroNow.cards,
      heroPosition: heroNow.position,
      communityCards: finalBoard,
      potWon: finalPot,
      winnerNames: winners.map((w) => w.name),
      winningHandDesc: winningDesc,
      heroNetChips,
      heroFolded: heroNow.folded,
      decisions: [...currentHandFeedback],
      timeline: [...actionTimeline, showdownTimelineEntry],
    };
    setLastHandDebriefData(debrief);

    // Only show single-hand debrief in non-tournament modes if autoShowDebrief is enabled
    if (config.autoShowDebrief && !isTournament) {
      setShowDebriefModal(true);
    }

    // Auto-advance countdown to next hand (if auto-advance enabled and game is still running)
    if (!tournamentEnded && autoAdvanceEnabled && !isAutoPlayPaused && !heroTableBusted) {
      setAutoAdvanceCountdown(3);
    }

    onUpdateTracker((prev) => {
      const posStats = prev.byPosition[heroNow.position] || {
        hands: 0,
        vpipCount: 0,
        pfrCount: 0,
        handsWon: 0,
        netBB: 0,
        optimalDecisions: 0,
        totalDecisions: 0,
      };

      const updatedBankruptcies = (prev.bankruptcyCount || 0) + (heroIsBankrupt ? 1 : 0);
      const updatedBailoutChips = (prev.bailoutChipsReceived || 0) + (heroIsBankrupt ? 1000 : 0);

      return {
        ...prev,
        handsPlayed: prev.handsPlayed + 1,
        handsWon: prev.handsWon + (heroWon ? 1 : 0),
        showdownsReached: prev.showdownsReached + (reachedShowdown && !heroNow.folded ? 1 : 0),
        showdownsWon:
          prev.showdownsWon + (reachedShowdown && !heroNow.folded && heroWon ? 1 : 0),
        netChipsWon: prev.netChipsWon + heroNetChips,
        netBBWon: Number((prev.netBBWon + heroNetBB).toFixed(1)),
        bountiesClaimed: prev.bountiesClaimed + bountiesClaimedByHero,
        bountyCashWon: prev.bountyCashWon + bountyCashByHero,
        bankruptcyCount: updatedBankruptcies,
        bailoutChipsReceived: updatedBailoutChips,
        handsByMode: {
          ...prev.handsByMode,
          [config.gameMode]: (prev.handsByMode[config.gameMode] || 0) + 1,
        },
        byPosition: {
          ...prev.byPosition,
          [heroNow.position]: {
            ...posStats,
            hands: posStats.hands + 1,
            handsWon: posStats.handsWon + (heroWon ? 1 : 0),
            netBB: Number((posStats.netBB + heroNetBB).toFixed(1)),
          },
        },
      };
    });
  };

  const handleHeroAction = (
    actionType: 'fold' | 'check' | 'call' | 'raise' | 'all-in',
    explicitBet?: number
  ) => {
    if (!hero || isProcessingBots || street === 'Waiting' || street === 'Showdown') return;
    clearScheduledTimers();

    let additionalChips = 0;
    if (actionType === 'call') {
      additionalChips = Math.min(hero.chips, callAmount);
    } else if (actionType === 'all-in') {
      additionalChips = hero.chips;
    } else if (actionType === 'raise') {
      const rawDesired = explicitBet !== undefined ? explicitBet : customRaiseAmount;
      additionalChips = Math.min(
        maxAllowedRaiseAdditional,
        Math.max(minRaiseAdditional, rawDesired)
      );
      if (additionalChips >= hero.chips) {
        actionType = 'all-in';
      }
    }

    const feedback = evaluateHeroDecision({
      hero,
      action: actionType,
      betAmount: additionalChips,
      potBeforeAction: pot,
      callAmount,
      communityCards,
      street,
      activeOpponents,
      config,
    });
    setLatestFeedback(feedback);
    setCurrentHandFeedback((prev) => [...prev, feedback]);

    const isPreflop = street === 'Pre-flop';
    const isVpipAction =
      isPreflop && (actionType === 'call' || actionType === 'raise' || actionType === 'all-in');
    const isPfrAction = isPreflop && (actionType === 'raise' || actionType === 'all-in');
    const isLimpAction = isPreflop && actionType === 'call' && callAmount <= config.bigBlind;
    const isThreeBetOpp = isPreflop && callAmount > config.bigBlind;
    const isThreeBetAction = isThreeBetOpp && (actionType === 'raise' || actionType === 'all-in');

    onUpdateTracker((prev) => {
      const posStats = prev.byPosition[hero.position];
      const isOptimal = feedback.grade === 'A+' || feedback.grade === 'B';
      const updatedLeakCounts = { ...prev.leakCounts };
      if (feedback.leakCategory) {
        updatedLeakCounts[feedback.leakCategory] =
          (updatedLeakCounts[feedback.leakCategory] || 0) + 1;
      }

      return {
        ...prev,
        vpipOpportunities: prev.vpipOpportunities + (isPreflop ? 1 : 0),
        vpipCount: prev.vpipCount + (isVpipAction ? 1 : 0),
        pfrCount: prev.pfrCount + (isPfrAction ? 1 : 0),
        limpCount: prev.limpCount + (isLimpAction ? 1 : 0),
        threeBetOpportunities: prev.threeBetOpportunities + (isThreeBetOpp ? 1 : 0),
        threeBetCount: prev.threeBetCount + (isThreeBetAction ? 1 : 0),
        postflopBetsAndRaises:
          prev.postflopBetsAndRaises +
          (!isPreflop && (actionType === 'raise' || actionType === 'all-in') ? 1 : 0),
        postflopCalls:
          prev.postflopCalls + (!isPreflop && actionType === 'call' ? 1 : 0),
        postflopFolds:
          prev.postflopFolds + (!isPreflop && actionType === 'fold' ? 1 : 0),
        totalDecisionsGraded: prev.totalDecisionsGraded + 1,
        gradeCounts: {
          ...prev.gradeCounts,
          [feedback.grade]: (prev.gradeCounts[feedback.grade] || 0) + 1,
        },
        leakCounts: updatedLeakCounts,
        byPosition: {
          ...prev.byPosition,
          [hero.position]: {
            ...posStats,
            vpipCount: posStats.vpipCount + (isVpipAction ? 1 : 0),
            pfrCount: posStats.pfrCount + (isPfrAction ? 1 : 0),
            optimalDecisions: posStats.optimalDecisions + (isOptimal ? 1 : 0),
            totalDecisions: posStats.totalDecisions + 1,
          },
        },
        recentFeedback: [feedback, ...prev.recentFeedback].slice(0, 40),
      };
    });

    let workingPot = pot + additionalChips;
    let workingPlayers = players.map((p) => {
      if (!p.isHero) return p;
      const newChips = p.chips - additionalChips;
      const newBet = p.currentBet + additionalChips;
      return {
        ...p,
        chips: newChips,
        currentBet: newBet,
        totalCommitted: p.totalCommitted + additionalChips,
        folded: actionType === 'fold',
        isAllIn: newChips === 0 && actionType !== 'fold',
        lastAction:
          actionType === 'fold'
            ? 'Fold'
            : actionType === 'check'
            ? 'Check'
            : actionType === 'all-in'
            ? `ALL-IN (£${newBet})`
            : actionType === 'raise'
            ? `Raise £${newBet}`
            : `Call £${newBet}`,
      };
    });

    // Immediately show Hero's action & chip toss on the felt
    setPlayers(workingPlayers.map((wp) => ({ ...wp })));
    setPot(workingPot);

    const heroUpdated = workingPlayers.find((p) => p.isHero);
    if (heroUpdated) {
      setActionTimeline((prev) => [
        ...prev,
        {
          id: `timeline-hero-${Date.now()}`,
          street,
          type: actionType,
          playerName: heroUpdated.name,
          avatar: heroUpdated.avatar,
          isHero: true,
          actionText: heroUpdated.lastAction || actionType,
          amount: additionalChips,
          potAfter: workingPot,
          timestamp: Date.now(),
        },
      ]);
    }

    if (actionType === 'fold') {
      setIsProcessingBots(true);
      setActingPlayerId(null);
      scheduleTimer(() => {
        const workingDeck = [...deck];
        const finalBoard = [...communityCards];
        while (finalBoard.length < 5 && workingDeck.length > 0) {
          finalBoard.push(workingDeck.pop()!);
        }
        setCommunityCards(finalBoard);
        setDeck(workingDeck);
        setPot(workingPot);
        setIsProcessingBots(false);
        resolveHandOutcome(workingPlayers, finalBoard, workingPot);
      }, 950);
      return;
    }

    // Sequential ~1-second delay for each active bot response
    const botsToAct = workingPlayers.filter(
      (p) => !p.isHero && !p.folded && !p.isAllIn
    );
    const BOT_STEP_DELAY_MS = 1000;
    const STREET_TRANSITION_DELAY_MS = 950;

    setIsProcessingBots(true);
    let currentHighBet = Math.max(...workingPlayers.map((p) => p.currentBet));

    if (botsToAct.length > 0) {
      setActingPlayerId(botsToAct[0].id);
    } else {
      setActingPlayerId(null);
    }

    botsToAct.forEach((botRef, idx) => {
      const fireTime = (idx + 1) * BOT_STEP_DELAY_MS;
      scheduleTimer(() => {
        const targetBot = workingPlayers.find((wp) => wp.id === botRef.id);
        if (targetBot && !targetBot.folded && !targetBot.isAllIn) {
          const decision = decideBotAction({
            bot: targetBot,
            communityCards,
            street,
            pot: workingPot,
            highestBet: currentHighBet,
            activePlayers: workingPlayers.filter((wp) => !wp.folded),
            config,
            heroStatsSummary: {
              vpipPercent: derivedMetrics.vpipPercent,
              pfrPercent: derivedMetrics.pfrPercent,
              foldToPressurePercent: derivedMetrics.foldToPressurePercent,
            },
          });

          if (decision.action === 'fold') {
            targetBot.folded = true;
            targetBot.lastAction = 'Fold';
            targetBot.lastActionReasoning = decision.reasoning;
          } else if (decision.action === 'check') {
            targetBot.lastAction = 'Check';
            targetBot.lastActionReasoning = decision.reasoning;
          } else {
            let added = Math.min(targetBot.chips, decision.betAmount);
            if (actionType === 'raise' || actionType === 'all-in') {
              const toCall = Math.max(0, currentHighBet - targetBot.currentBet);
              added = Math.min(targetBot.chips, toCall);
            }

            const newChips = targetBot.chips - added;
            const newBet = targetBot.currentBet + added;
            workingPot += added;
            const raisedOver = newBet > currentHighBet;
            if (raisedOver) currentHighBet = newBet;

            targetBot.chips = newChips;
            targetBot.currentBet = newBet;
            targetBot.totalCommitted += added;
            targetBot.isAllIn = newChips === 0;
            targetBot.lastAction =
              newChips === 0
                ? `ALL-IN (£${newBet})`
                : raisedOver
                ? `Raise £${newBet}`
                : added === 0
                ? 'Check'
                : `Call £${newBet}`;
            targetBot.lastActionReasoning = decision.reasoning;
          }
        }

        // Snapshot update after this bot acts
        setPlayers(workingPlayers.map((wp) => ({ ...wp })));
        setPot(workingPot);

        if (targetBot) {
          setActionTimeline((prev) => [
            ...prev,
            {
              id: `timeline-bot-${targetBot.id}-${Date.now()}`,
              street,
              type: targetBot.folded
                ? 'fold'
                : targetBot.isAllIn
                ? 'all-in'
                : targetBot.lastAction?.toLowerCase().includes('raise')
                ? 'raise'
                : targetBot.lastAction?.toLowerCase().includes('call')
                ? 'call'
                : 'check',
              playerName: targetBot.name,
              avatar: targetBot.avatar,
              isHero: false,
              actionText: targetBot.lastAction || 'Acted',
              amount: targetBot.currentBet,
              potAfter: workingPot,
              reasoning: targetBot.lastActionReasoning,
              timestamp: Date.now(),
            },
          ]);
        }

        const nextBot = botsToAct[idx + 1];
        if (nextBot) {
          setActingPlayerId(nextBot.id);
        } else {
          setActingPlayerId(null);
        }
      }, fireTime);
    });

    // After all bots have acted (1s each), pause ~950ms and transition street or showdown
    const streetAdvanceTime =
      botsToAct.length * BOT_STEP_DELAY_MS + STREET_TRANSITION_DELAY_MS;

    scheduleTimer(() => {
      const stillActive = workingPlayers.filter((p) => !p.folded);
      const heroUpdated = workingPlayers.find((p) => p.isHero)!;

      // If any bot bet or raised above Hero's current bet, return action to Hero to respond!
      if (currentHighBet > heroUpdated.currentBet && !heroUpdated.folded && !heroUpdated.isAllIn) {
        setIsProcessingBots(false);
        setActingPlayerId('hero');
        const toCall = currentHighBet - heroUpdated.currentBet;
        setCustomRaiseAmount(
          Math.min(
            heroUpdated.chips,
            Math.max(toCall + config.bigBlind, Math.round(currentHighBet * 2.2))
          )
        );
        return;
      }

      if (stillActive.length === 1 || street === 'River' || heroUpdated.isAllIn) {
        const workingDeck = [...deck];
        const finalBoard = [...communityCards];
        if (stillActive.length > 1) {
          while (finalBoard.length < 5 && workingDeck.length > 0) {
            finalBoard.push(workingDeck.pop()!);
          }
        }
        setCommunityCards(finalBoard);
        setDeck(workingDeck);
        setPot(workingPot);
        setIsProcessingBots(false);
        setActingPlayerId(null);
        resolveHandOutcome(workingPlayers, finalBoard, workingPot);
        return;
      }

      const workingDeck = [...deck];
      let nextBoard = [...communityCards];
      let nextStreet: Street = 'Flop';

      if (street === 'Pre-flop') {
        nextBoard = [workingDeck.pop()!, workingDeck.pop()!, workingDeck.pop()!];
        nextStreet = 'Flop';
      } else if (street === 'Flop') {
        nextBoard = [...communityCards, workingDeck.pop()!];
        nextStreet = 'Turn';
      } else if (street === 'Turn') {
        nextBoard = [...communityCards, workingDeck.pop()!];
        nextStreet = 'River';
      }

      const resetStreetPlayers = workingPlayers.map((p) => ({
        ...p,
        currentBet: 0,
      }));

      setDeck(workingDeck);
      setCommunityCards(nextBoard);
      setPlayers(resetStreetPlayers);
      setPot(workingPot);
      setStreet(nextStreet);
      setLatestFeedback(null);

      setActionTimeline((prev) => [
        ...prev,
        {
          id: `timeline-deal-${nextStreet}-${Date.now()}`,
          street: nextStreet,
          type: 'deal',
          playerName: 'Dealer',
          actionText: `${nextStreet} Dealt`,
          cards:
            nextStreet === 'Flop'
              ? nextBoard.slice(0, 3)
              : [nextBoard[nextBoard.length - 1]],
          potAfter: workingPot,
          timestamp: Date.now(),
        },
      ]);
      setCustomRaiseAmount(
        Math.min(
          heroUpdated.chips,
          Math.max(config.bigBlind * 2, Math.round((workingPot * 0.6) / 5) * 5)
        )
      );
      setActingPlayerId('hero');
      setIsProcessingBots(false);
    }, streetAdvanceTime);
  };

  const { isHighRoller } = useKonamiHighRoller();
  const [feltColor, setFeltColor] = useState<'sky-blue' | 'ept-emerald' | 'vip-obsidian'>('sky-blue');
  const [rightDockTab, setRightDockTab] = useState<'coach' | 'ladder' | 'style'>('coach');

  const feltGradientClass = isHighRoller
    ? 'bg-[radial-gradient(ellipse_at_center,_#b8860b_0%,_#755405_60%,_#3d2901_100%)]'
    : feltColor === 'sky-blue'
    ? 'bg-[radial-gradient(ellipse_at_center,_#25668c_0%,_#154263_60%,_#092136_100%)]'
    : feltColor === 'ept-emerald'
    ? 'bg-[radial-gradient(ellipse_at_center,_#166534_0%,_#09361c_62%,_#03170b_100%)]'
    : 'bg-[radial-gradient(ellipse_at_center,_#2b261d_0%,_#15130f_65%,_#080705_100%)]';

  const renderPlayingCard = (
    card: Card,
    hidden = false,
    size: 'sm' | 'md' | 'lg' = 'md',
    animClass = 'animate-deal-card',
    delayMs = 0
  ) => {
    const dims =
      size === 'sm'
        ? 'w-10 h-14 text-[11px]'
        : size === 'lg'
        ? 'w-16 h-24 text-base'
        : 'w-14 h-20 text-sm';

    if (hidden) {
      return (
        <div
          key={`${handNumber}-${street}-${card.rank}${card.suit}-${delayMs}-back`}
          style={{ animationDelay: `${delayMs}ms` }}
          className={`${dims} ${animClass} rounded-lg border-2 shadow-[0_6px_14px_rgba(0,0,0,0.65)] flex items-center justify-center select-none relative overflow-hidden ${
            isHighRoller
              ? 'bg-gradient-to-br from-zinc-950 via-[#241a04] to-black border-[#ffd700]'
              : 'bg-gradient-to-br from-[#1d4ed8] via-[#1e3a8a] to-[#0f172a] border-white/80'
          }`}
        >
          <div className="w-[82%] h-[82%] rounded border border-gold/50 bg-[radial-gradient(circle,_rgba(212,175,55,0.25)_0%,_transparent_70%)] flex items-center justify-center text-[8px] font-black text-gold tracking-tighter">
            {isHighRoller ? '👑 24K' : 'E.P.T'}
          </div>
        </div>
      );
    }

    let suitTextColor = 'text-zinc-900';
    if (isHighRoller) {
      suitTextColor =
        card.suit === '♥' || card.suit === '♦'
          ? 'text-rose-400 drop-shadow-[0_0_6px_rgba(251,113,133,0.6)]'
          : 'text-[#ffd700] drop-shadow-[0_0_6px_rgba(255,215,0,0.6)]';
    } else if (fourColorDeck) {
      if (card.suit === '♠') suitTextColor = 'text-zinc-900';
      else if (card.suit === '♥') suitTextColor = 'text-red-600';
      else if (card.suit === '♦') suitTextColor = 'text-blue-600';
      else if (card.suit === '♣') suitTextColor = 'text-emerald-600';
    } else {
      suitTextColor = (card.suit === '♥' || card.suit === '♦') ? 'text-red-600' : 'text-zinc-900';
    }

    return (
      <div
        key={`${handNumber}-${street}-${card.rank}${card.suit}-${delayMs}-face`}
        style={{ animationDelay: `${delayMs}ms` }}
        className={`${dims} ${animClass} rounded-lg border-2 shadow-[0_8px_18px_rgba(0,0,0,0.65)] flex flex-col justify-between p-1.5 font-black select-none ${
          isHighRoller
            ? 'bg-gradient-to-b from-zinc-900 via-[#12100a] to-black border-[#ffd700]'
            : 'bg-white border-zinc-200'
        } ${suitTextColor}`}
      >
        <div className="leading-none text-left">
          <div className=" tracking-tighter">{card.rank}</div>
          <div className="text-[10px] leading-none">{card.suit}</div>
        </div>
        <div
          className={`text-center leading-none ${
            size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-base'
          }`}
        >
          {card.suit}
        </div>
        <div className="leading-none text-right rotate-180">
          <div className="tracking-tighter">{card.rank}</div>
        </div>
      </div>
    );
  };

  // Classify player's latest action for animated Sky-Poker-style action banner
  const getActionBadgeMeta = (lastAction?: string, folded?: boolean, isAllIn?: boolean) => {
    if (folded) {
      return {
        label: 'FOLD',
        bg: 'bg-zinc-800/95 text-zinc-400 border-zinc-600',
        podEffect: 'opacity-45 grayscale-[40%] scale-95',
      };
    }
    if (isAllIn || (lastAction && lastAction.toLowerCase().includes('all-in'))) {
      return {
        label: 'ALL-IN',
        bg: 'bg-gradient-to-r from-ept-red to-amber-600 text-white border-yellow-300 shadow-[0_0_12px_rgba(230,57,70,0.8)]',
        podEffect: 'ring-2 ring-ept-red shadow-[0_0_20px_rgba(230,57,70,0.45)]',
      };
    }
    if (!lastAction) return null;
    const lower = lastAction.toLowerCase();
    if (lower.includes('raise') || lower.includes('bet') || lower.includes('push')) {
      return {
        label: lower.includes('raise') ? 'RAISE' : 'BET',
        bg: 'bg-amber-500 text-black border-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.6)]',
        podEffect: 'ring-2 ring-amber-400/80 shadow-[0_0_16px_rgba(245,158,11,0.3)]',
      };
    }
    if (lower.includes('call')) {
      return {
        label: 'CALL',
        bg: 'bg-emerald-500 text-black border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
        podEffect: 'ring-1 ring-emerald-400/70',
      };
    }
    if (lower.includes('check')) {
      return {
        label: 'CHECK',
        bg: 'bg-sky-400 text-black border-sky-100',
        podEffect: 'animate-check-ripple ring-1 ring-sky-400/60',
      };
    }
    if (lower.includes('sb') || lower.includes('bb') || lower.includes('ante')) {
      return {
        label: lastAction.toUpperCase(),
        bg: 'bg-zinc-900/90 text-gold border-gold/40',
        podEffect: '',
      };
    }
    return {
      label: lastAction.toUpperCase(),
      bg: 'bg-zinc-800 text-white border-white/20',
      podEffect: '',
    };
  };

  // Compute radial stadium perimeter coordinates for 1 to 8 opponents with non-overlapping bet chips
  const getOpponentSeatLayout = (idx: number, totalBots: number) => {
    // Each entry positions the seat around the oval perimeter and places their chip bet cleanly beneath the pod
    const presets: Record<
      number,
      { seatClass: string; chipClass: string; dealerClass: string }[]
    > = {
      1: [
        {
          seatClass: 'top-3 left-1/2 -translate-x-1/2',
          chipClass: 'top-full mt-1.5 left-1/2 -translate-x-1/2',
          dealerClass: '-bottom-1.5 -right-3',
        },
      ],
      2: [
        {
          seatClass: 'top-4 left-[22%] -translate-x-1/2',
          chipClass: 'top-full mt-1.5 left-1/2 -translate-x-1/2',
          dealerClass: '-bottom-1.5 -right-3',
        },
        {
          seatClass: 'top-4 right-[22%] translate-x-1/2',
          chipClass: 'top-full mt-1.5 left-1/2 -translate-x-1/2',
          dealerClass: '-bottom-1.5 -left-3',
        },
      ],
      3: [
        {
          seatClass: 'top-1/2 -translate-y-1/2 left-3 sm:left-5',
          chipClass: 'top-full mt-1.5 left-2',
          dealerClass: '-top-2 -right-2',
        },
        {
          seatClass: 'top-3 left-1/2 -translate-x-1/2',
          chipClass: 'top-full mt-1.5 left-1/2 -translate-x-1/2',
          dealerClass: '-bottom-1.5 -right-3',
        },
        {
          seatClass: 'top-1/2 -translate-y-1/2 right-3 sm:right-5',
          chipClass: 'top-full mt-1.5 right-2',
          dealerClass: '-top-2 -left-2',
        },
      ],
      4: [
        {
          seatClass: 'top-[64%] left-3 sm:left-5 -translate-y-1/2',
          chipClass: 'top-full mt-1.5 left-2',
          dealerClass: '-top-2 -right-2',
        },
        {
          seatClass: 'top-[18%] left-6 sm:left-10 -translate-y-1/2',
          chipClass: 'top-full mt-1.5 left-3',
          dealerClass: '-bottom-1 -right-2',
        },
        {
          seatClass: 'top-[18%] right-6 sm:right-10 -translate-y-1/2',
          chipClass: 'top-full mt-1.5 right-3',
          dealerClass: '-bottom-1 -left-2',
        },
        {
          seatClass: 'top-[64%] right-3 sm:right-5 -translate-y-1/2',
          chipClass: 'top-full mt-1.5 right-2',
          dealerClass: '-top-2 -left-2',
        },
      ],
      5: [
        {
          seatClass: 'top-[64%] left-3 sm:left-5 -translate-y-1/2',
          chipClass: 'top-full mt-1.5 left-2 sm:left-3',
          dealerClass: '-top-2 -right-2',
        },
        {
          seatClass: 'top-[20%] left-5 sm:left-8 -translate-y-1/2',
          chipClass: 'top-full mt-1.5 left-3 sm:left-4',
          dealerClass: '-bottom-1 -right-2',
        },
        {
          seatClass: 'top-3 left-1/2 -translate-x-1/2',
          chipClass: 'top-full mt-1.5 left-1/2 -translate-x-1/2',
          dealerClass: '-bottom-1.5 -right-3',
        },
        {
          seatClass: 'top-[20%] right-5 sm:right-8 -translate-y-1/2',
          chipClass: 'top-full mt-1.5 right-3 sm:right-4',
          dealerClass: '-bottom-1 -left-2',
        },
        {
          seatClass: 'top-[64%] right-3 sm:right-5 -translate-y-1/2',
          chipClass: 'top-full mt-1.5 right-2 sm:right-3',
          dealerClass: '-top-2 -left-2',
        },
      ],
    };

    if (presets[totalBots] && presets[totalBots][idx]) {
      return presets[totalBots][idx];
    }

    // Default 8-opponent full-ring perimeter distribution
    const fullRing: { seatClass: string; chipClass: string; dealerClass: string }[] = [
      {
        seatClass: 'top-[74%] left-2.5 -translate-y-1/2',
        chipClass: 'top-full mt-1 left-2',
        dealerClass: '-top-2 -right-2',
      },
      {
        seatClass: 'top-[48%] left-2 -translate-y-1/2',
        chipClass: 'top-full mt-1 left-2',
        dealerClass: '-bottom-1 -right-2',
      },
      {
        seatClass: 'top-[22%] left-4 sm:left-6 -translate-y-1/2',
        chipClass: 'top-full mt-1 left-3',
        dealerClass: '-bottom-1 -right-2',
      },
      {
        seatClass: 'top-2.5 left-[34%] -translate-x-1/2',
        chipClass: 'top-full mt-1 left-1/2 -translate-x-1/2',
        dealerClass: '-bottom-1 -right-2',
      },
      {
        seatClass: 'top-2.5 right-[34%] translate-x-1/2',
        chipClass: 'top-full mt-1 left-1/2 -translate-x-1/2',
        dealerClass: '-bottom-1 -left-2',
      },
      {
        seatClass: 'top-[22%] right-4 sm:right-6 -translate-y-1/2',
        chipClass: 'top-full mt-1 right-3',
        dealerClass: '-bottom-1 -left-2',
      },
      {
        seatClass: 'top-[48%] right-2 -translate-y-1/2',
        chipClass: 'top-full mt-1 right-2',
        dealerClass: '-bottom-1 -left-2',
      },
      {
        seatClass: 'top-[74%] right-2.5 -translate-y-1/2',
        chipClass: 'top-full mt-1 right-2',
        dealerClass: '-top-2 -left-2',
      },
    ];
    return fullRing[idx % fullRing.length];
  };

  const activeModeInfo = GAME_MODES_INFO[config.gameMode];
  const opponentPlayers = players.filter((p) => !p.isHero);

  const gradeBadgeStyle = (grade: CoachFeedback['grade']) => {
    switch (grade) {
      case 'A+':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      case 'B':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
      case 'C':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'D':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'F':
        return 'bg-ept-red/20 text-ept-red border-ept-red/50';
    }
  };

  return (
    <div
      style={{ touchAction: 'manipulation' }}
      className="h-full flex-1 min-h-0 flex flex-col justify-between overflow-hidden select-none touch-manipulation gap-1 sm:gap-3"
    >
      {/* =====================================================================
          LAYER C: GAME CONTROLS STRIP
          Poker variant pills, blind status, grouped Table Settings & Tools drawer,
          and prominent high-contrast Deal Hand CTA.
          ===================================================================== */}
      <DevWrapper id="table-controls-bar" label="Table Controls Bar">
        <div className="glass-panel rounded-2xl px-3.5 sm:px-4 py-2 border border-white/15 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Compact Game Format Selector Pills + Live Blind Indicator */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full py-0.5 scrollbar-hide">
            <div className="flex items-center gap-1.5 shrink-0">
              {(Object.keys(GAME_MODES_INFO) as GameMode[]).map((modeKey) => {
                const m = GAME_MODES_INFO[modeKey];
                const isSelected = config.gameMode === modeKey;
                return (
                  <button
                    key={modeKey}
                    type="button"
                    onClick={() => handleModeChange(modeKey)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                      isSelected
                        ? 'bg-white/15 border-gold text-white shadow-[0_0_10px_rgba(212,175,55,0.25)]'
                        : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white hover:border-white/25'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: m.accentColor }}
                    />
                    <span>{m.shortBadge}</span>
                    <InfoTooltip
                      title={m.name}
                      description={m.description}
                      formula={m.rulesSummary[1]}
                      size={11}
                    />
                  </button>
                );
              })}
            </div>

            {/* Quick Blinds & Clock Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-[11px] font-mono shrink-0">
              <span className="text-zinc-400">Blinds:</span>
              <span className="font-bold text-gold">
                £{config.smallBlind}/£{config.bigBlind}
              </span>
              {timedBlindsConfig.enabled && (
                <span className="text-amber-300 font-bold flex items-center gap-1 border-l border-white/15 pl-1.5">
                  <Timer size={11} className="text-gold" />
                  L{currentLevelIndex + 1} ({formatTimeDisplay(blindSecondsRemaining)})
                </span>
              )}
            </div>
          </div>

          {/* Right: Eliminator Status + Poker League Link + Unified Table Settings & Tools + Prominent Deal Hand CTA */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Access to Poker League Leaderboard */}
            <Link
              href="/academy?tab=leaderboard&discipline=poker"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider bg-gold/15 hover:bg-gold/25 border border-gold/40 text-gold hover:text-white transition shadow"
              title="View Poker Academy League Standings"
            >
              <Trophy size={13} className="text-gold" />
              <span className="hidden sm:inline">Poker League</span>
            </Link>

            {/* Eliminator Tournament Alive Badge */}
            {config.gameMode === 'tournament-eliminator' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-rose-950/70 to-zinc-900 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.2)]">
                <Trophy size={12} className="text-rose-400" />
                <span className="text-[11px] font-black text-rose-300">
                  {players.filter((p) => p.chips > 0).length || config.numPlayers} / {config.numPlayers} Alive
                </span>
              </div>
            )}

            {/* Grouped Table Settings & Tools Button with Dynamic Status Indicators */}
            <button
              type="button"
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                showConfigPanel
                  ? 'bg-gold text-black border-gold shadow-[0_0_12px_rgba(212,175,55,0.35)]'
                  : 'bg-white/5 hover:bg-white/10 border-white/15 text-zinc-300 hover:text-white'
              }`}
              title="Open Table Settings, AI Roster, Blinds Clock, Screen Recording & Tools"
              aria-expanded={showConfigPanel}
            >
              <Sliders size={13} className={showConfigPanel ? 'text-black' : 'text-gold'} />
              <span>Table Settings & Tools</span>
              <div className="flex items-center gap-1 ml-0.5">
                {isRecording && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" title="Recording active" />
                )}
                {autoAdvanceEnabled && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Auto-deal active" />
                )}
                {!config.liveCoachHints && (
                  <span className="text-[9px] px-1 rounded bg-zinc-800 text-zinc-400 font-mono">Exam</span>
                )}
              </div>
              {showConfigPanel ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {/* Primary Action Button: Prominent High-Contrast Tactile Deal Hand */}
            <button
              type="button"
              onClick={dealNewHand}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#ffd700] via-[#ffe578] to-[#cfb53b] text-black hover:brightness-110 active:scale-95 transition shadow-[0_0_16px_rgba(212,175,55,0.45)] ring-1 ring-gold/50 cursor-pointer"
            >
              <Play size={13} fill="currentColor" />
              <span>
                {street === 'Waiting'
                  ? config.gameMode === 'tournament-eliminator'
                    ? 'Start Tournament 🏆'
                    : 'Deal Hand'
                  : 'Next Hand ⚡'}
              </span>
            </button>
          </div>
        </div>

        {/* Collapsible Table Settings & Tools Command Drawer */}
        {showConfigPanel && (
          <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-200">
            {/* Card 1: Table Size & Bot Difficulty */}
            <div className="bg-black/60 p-3 rounded-xl border border-white/10 space-y-2">
              <div className="text-[11px] font-bold text-gold uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Users size={13} /> Table Size & Opponents
                </span>
                <InfoTooltip
                  title="Table Size & Hand Ranges"
                  description="Fewer players (2 Heads-Up or 4-Max) require playing much wider, more aggressive ranges. Full Ring (9-Ring) requires tighter early-position selection."
                  size={11}
                />
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[2, 3, 4, 6, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, numPlayers: num }))}
                    className={`py-1 rounded text-[11px] font-bold border transition ${
                      config.numPlayers === num
                        ? 'bg-gold text-black border-gold'
                        : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {num === 2 ? '2-HU' : num === 6 ? '6-Max' : num === 9 ? '9-Ring' : `${num}P`}
                  </button>
                ))}
              </div>

              <div className="pt-1.5 border-t border-white/10">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1">
                    <Brain size={12} /> AI Bot Difficulty
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {(
                    [
                      { id: 'rookie', label: 'Rookie' },
                      { id: 'regular', label: 'EPT Regular' },
                      { id: 'shark', label: 'Pro Shark' },
                      { id: 'gto', label: 'GTO Solver' },
                    ] as { id: DifficultyLevel; label: string }[]
                  ).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, difficulty: d.id }))}
                      className={`py-1 px-1.5 rounded text-[10px] font-bold border transition ${
                        config.difficulty === d.id
                          ? 'bg-ept-red text-white border-ept-red'
                          : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 2: Stack Depth & Training Drills */}
            <div className="bg-black/60 p-3 rounded-xl border border-white/10 space-y-2">
              <div className="text-[11px] font-bold text-gold uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Coins size={13} /> Starting Stack Depth
                </span>
                <InfoTooltip
                  title="Stack Depth in Big Blinds (BB)"
                  description="10–25 BB is short-stack tournament territory. 100–200 BB is deep-stack poker where Suited Connectors and Set-Mining gain huge implied odds."
                  size={11}
                />
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[10, 25, 50, 100, 200].map((bbDepth) => (
                  <button
                    key={bbDepth}
                    type="button"
                    disabled={config.gameMode === 'all-in-or-fold' && bbDepth !== 10}
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        startingBigBlinds: bbDepth,
                      }))
                    }
                    className={`py-1 rounded text-[11px] font-bold border transition ${
                      config.startingBigBlinds === bbDepth
                        ? 'bg-emerald-500 text-black border-emerald-400'
                        : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white disabled:opacity-30'
                    }`}
                  >
                    {bbDepth}BB
                  </button>
                ))}
              </div>

              <div className="pt-1.5 border-t border-white/10">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1">
                    <Target size={12} /> Training Scenario Drill
                  </span>
                </div>
                <select
                  aria-label="Training Scenario Drill Preset"
                  value={config.preset}
                  onChange={(e) => applyPreset(e.target.value as ScenarioPreset)}
                  className="w-full bg-zinc-900 border border-white/15 rounded-lg p-1.5 text-[11px] text-white font-semibold focus:outline-none focus:border-gold"
                >
                  {Object.values(SCENARIO_PRESETS_INFO).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Card 3: Timed Blinds & Tournament Clock */}
            <div className="bg-black/60 p-3 rounded-xl border border-white/10 space-y-2 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold text-gold uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Timer size={13} /> Timed Blinds Clock
                  </span>
                  <InfoTooltip
                    title="Tournament Blind Timer"
                    description="Blinds automatically increase over time to simulate authentic poker tournament pressure. Fully customize blind amounts, durations (30s, 1m, 3m, 5m, etc.), and sound alerts."
                    size={11}
                  />
                </div>
                <div className="text-[11px] text-zinc-300 mt-1">
                  Status:{' '}
                  <span className={timedBlindsConfig.enabled ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                    {timedBlindsConfig.enabled
                      ? `L${currentLevelIndex + 1} (${formatTimeDisplay(blindSecondsRemaining)})`
                      : 'Disabled (Fixed Blinds)'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1.5 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !timedBlindsConfig.enabled;
                      handleSaveTimedBlindsConfig({
                        ...timedBlindsConfig,
                        enabled: next,
                      });
                    }}
                    className={`flex-1 py-1 px-2 rounded text-[10px] font-bold border transition ${
                      timedBlindsConfig.enabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {timedBlindsConfig.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomizerModal(true)}
                    className="py-1 px-2 rounded text-[10px] font-bold bg-gold/15 text-gold border border-gold/40 hover:bg-gold/25 transition"
                  >
                    Configure...
                  </button>
                </div>

                {config.gameMode === 'tournament-eliminator' && (
                  <button
                    type="button"
                    onClick={startNewFullTournament}
                    className="w-full py-1 px-2 rounded text-[10px] font-bold border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 transition flex items-center justify-center gap-1"
                  >
                    <RotateCcw size={11} />
                    <span>Reset Full Tournament</span>
                  </button>
                )}
              </div>
            </div>

            {/* Card 4: Table Tools, Cosmetics & Automation */}
            <div className="bg-black/60 p-3 rounded-xl border border-white/10 space-y-2 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold text-gold uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Palette size={13} /> Table Tools & Felt
                  </span>
                </div>

                {/* Felt Selector */}
                <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-300">
                  <span className="text-zinc-400 font-bold uppercase">Felt Cloth:</span>
                  <div className="flex items-center gap-1.5">
                    {[
                      { id: 'sky-blue', label: 'Sky Blue', color: '#25668c' },
                      { id: 'ept-emerald', label: 'Casino Green', color: '#166534' },
                      { id: 'vip-obsidian', label: 'VIP Obsidian', color: '#2b261d' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFeltColor(f.id as 'sky-blue' | 'ept-emerald' | 'vip-obsidian')}
                        title={`Switch felt to ${f.label}`}
                        style={{ backgroundColor: f.color }}
                        className={`w-4 h-4 rounded-full border transition ${
                          feltColor === f.id
                            ? 'border-gold scale-110 ring-2 ring-gold/40'
                            : 'border-white/30 opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* 4-Color Deck & Coach HUD Toggles */}
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !fourColorDeck;
                      setFourColorDeck(nextVal);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('ept_four_color_deck', String(nextVal));
                      }
                    }}
                    className={`py-1 px-1.5 rounded text-[10px] font-bold border transition text-center ${
                      fourColorDeck
                        ? 'bg-blue-500/20 border-blue-500/60 text-blue-300'
                        : 'bg-zinc-900 border-white/10 text-zinc-400'
                    }`}
                  >
                    4-Color: {fourColorDeck ? 'ON' : 'OFF'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        liveCoachHints: !prev.liveCoachHints,
                      }))
                    }
                    className={`py-1 px-1.5 rounded text-[10px] font-bold border transition text-center ${
                      config.liveCoachHints
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : 'bg-zinc-900 border-white/10 text-zinc-400'
                    }`}
                  >
                    {config.liveCoachHints ? 'Coach HUD' : 'Exam Mode'}
                  </button>
                </div>
              </div>

              {/* Automation Toggles & Screen Recording */}
              <div className="space-y-1.5 pt-1.5 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !autoAdvanceEnabled;
                      setAutoAdvanceEnabled(nextVal);
                      if (!nextVal) setAutoAdvanceCountdown(null);
                    }}
                    className={`flex-1 py-1 px-1.5 rounded text-[10px] font-bold border transition flex items-center justify-center gap-1 ${
                      autoAdvanceEnabled
                        ? 'bg-gold/20 border-gold/60 text-gold'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <Zap size={11} className={autoAdvanceEnabled ? 'fill-gold' : ''} />
                    <span>Auto-Deal: {autoAdvanceEnabled ? 'ON' : 'OFF'}</span>
                  </button>

                  {isRecording ? (
                    <button
                      type="button"
                      onClick={stopScreenRecording}
                      className="py-1 px-2 rounded text-[10px] font-black uppercase bg-red-600 text-white animate-pulse transition"
                    >
                      REC {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:
                      {String(recordingSeconds % 60).padStart(2, '0')} (Stop)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startScreenRecording}
                      className="py-1 px-2 rounded text-[10px] font-bold bg-white/5 hover:bg-red-500/20 text-zinc-300 hover:text-red-300 border border-white/10 transition flex items-center gap-1"
                    >
                      <Video size={11} className="text-red-400" />
                      <span>Record</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[9px] text-zinc-400">
                  <span>Bots Rebuy: {config.botsAutoRebuy !== false ? 'ON' : 'OFF'}</span>
                  <span>Hero Rebuy: {config.heroAutoRebuy !== false ? 'ON' : 'OFF'}</span>
                  <span>Debrief: {config.autoShowDebrief ? 'ON' : 'OFF'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </DevWrapper>

      {/* MAIN WORKSPACE: 3D STADIUM POKER TABLE (8 Cols) + CONDENSED TACTICAL DOCK (4 Cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: AUTHENTIC 3D OVAL / STADIUM POKER TABLE + BOTTOM ACTION DOCK */}
        <DevWrapper
          id="table-felt-container"
          label="Table Felt Container"
          className="xl:col-span-8 flex flex-col gap-3"
        >
          {/* Tournament Blind Clock Bar */}
          <TournamentBlindClockBar
            config={timedBlindsConfig}
            currentLevelIndex={currentLevelIndex}
            secondsRemaining={blindSecondsRemaining}
            isRunning={isTimerRunning}
            onToggleTimer={handleToggleTimer}
            onResetTimer={handleResetTimer}
            onNextLevel={handleNextBlindLevel}
            onPrevLevel={handlePrevBlindLevel}
            onOpenCustomizer={() => setShowCustomizerModal(true)}
          />

          {/* Outer Table Arena Backdrop (Teal/Slate Casino Spotlight like Sky Poker Ref) */}
          <div className="flex-1 min-h-0 relative rounded-2xl sm:rounded-3xl bg-[radial-gradient(circle_at_center,_#133340_0%,_#091820_65%,_#050b0f_100%)] border border-white/10 p-2 sm:p-5 md:p-7 shadow-2xl overflow-y-auto overflow-x-hidden flex flex-col justify-between">
            {/* Top-Left & Top-Right Subtle Corner Table Info */}
            <div className="flex items-center justify-between text-[11px] text-zinc-300/90 mb-2 px-1">
              <div className="flex items-center gap-2 font-mono flex-wrap">
                <span className="text-gold font-black">
                  HAND #{handNumber || 1}
                </span>
                <span>•</span>
                {timedBlindsConfig.enabled && (
                  <>
                    <span className="text-amber-300 font-bold flex items-center gap-1">
                      <Timer size={12} className="text-gold" />
                      LVL {currentLevelIndex + 1} ({formatTimeDisplay(blindSecondsRemaining)})
                    </span>
                    <span>•</span>
                  </>
                )}
                <span>
                  BLINDS £{config.smallBlind}/£{config.bigBlind}
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Coins size={12} className="text-gold" />
                  STACK: £{(hero?.chips ?? 1000).toLocaleString()}
                </span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded bg-black/50 border border-white/10 text-white font-sans font-bold">
                  {street}
                </span>
              </div>

              {liveAnalysis && street !== 'Waiting' && (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/60 border border-gold/30 text-[11px] text-gold font-bold">
                    <InfoTooltip
                      title={
                        BOARD_TEXTURE_INFO[liveAnalysis.drawInfo.boardTexture]
                          ?.title || liveAnalysis.drawInfo.boardTexture
                      }
                      description={
                        BOARD_TEXTURE_INFO[liveAnalysis.drawInfo.boardTexture]
                          ?.description ||
                        'Evaluates how coordinated the community cards are for straight and flush draws.'
                      }
                      example={
                        BOARD_TEXTURE_INFO[liveAnalysis.drawInfo.boardTexture]
                          ?.strategyTip
                      }
                      size={11}
                    >
                      <span>Board: {liveAnalysis.drawInfo.boardTexture}</span>
                    </InfoTooltip>
                  </span>
                </div>
              )}
            </div>

            {/* =====================================================
                THE 3D OVAL / STADIUM POKER TABLE
               ===================================================== */}
            <div className="relative mx-auto w-full max-w-4xl min-h-[280px] sm:min-h-[520px] md:min-h-[680px] rounded-[60px] sm:rounded-[190px] md:rounded-[230px] poker-table-rail p-2 sm:p-6 md:p-8 flex flex-col justify-between select-none flex-1">
              {/* Decorative Gold Diamond Rail Studs (Left, Right, Top-Left, Top-Right) */}
              <div className="hidden sm:block absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-4 rotate-45 bg-gradient-to-b from-[#ffe578] to-[#b48811] border border-black/60 shadow" />
              <div className="hidden sm:block absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-4 rotate-45 bg-gradient-to-b from-[#ffe578] to-[#b48811] border border-black/60 shadow" />

              {/* Inner Felt Surface inside the Leather Rail */}
              <div
                className={`relative w-full h-full min-h-[250px] sm:min-h-[460px] md:min-h-[620px] rounded-[50px] sm:rounded-[170px] md:rounded-[205px] poker-table-rim ${feltGradientClass} flex items-center justify-center p-2 sm:p-4 select-none flex-1`}
              >
                {/* Inner Betting Racetrack Line */}
                <div className="absolute inset-4 sm:inset-7 rounded-[100px] sm:rounded-[145px] md:rounded-[180px] border-2 border-white/15 pointer-events-none" />

                {/* Blinds Up Alert Overlay Banner */}
                {blindsUpAnnouncement && (
                  <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in-95 duration-200">
                    <div className="bg-gradient-to-b from-amber-950/95 via-black to-zinc-950 border-2 border-gold rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(212,175,55,0.7)] max-w-sm w-full mx-4 space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center text-3xl shadow-[0_0_25px_#ffd700] animate-bounce">
                        ⏰
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gold">
                          Tournament Clock Alert
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">
                          BLINDS ARE UP!
                        </h3>
                      </div>
                      <div className="p-3 rounded-2xl bg-gold/15 border border-gold/40 text-center">
                        <div className="text-xs font-bold text-zinc-300">
                          Now Playing Level {blindsUpAnnouncement.level}
                        </div>
                        <div className="text-2xl font-mono font-black text-gold mt-0.5">
                          £{blindsUpAnnouncement.smallBlind} / £{blindsUpAnnouncement.bigBlind}
                          {blindsUpAnnouncement.ante ? (
                            <span className="text-sm text-zinc-300 font-normal ml-1">
                              (Ante £{blindsUpAnnouncement.ante})
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Tournament blinds have increased! Adjust your stack depth and aggression.
                      </p>
                      <button
                        onClick={() => setBlindsUpAnnouncement(null)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black text-xs uppercase tracking-wider shadow hover:brightness-110 active:scale-95 transition"
                      >
                        Acknowledge & Continue →
                      </button>
                    </div>
                  </div>
                )}

                {street === 'Waiting' ? (
                  /* Pre-Deal Welcome Overlay on the Felt */
                  <div className="relative z-20 text-center max-w-md mx-auto space-y-3.5 py-6 px-5 bg-black/75 backdrop-blur-md rounded-3xl border border-gold/40 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/40 flex items-center justify-center mx-auto text-gold shadow-[0_0_25px_rgba(212,175,55,0.3)]">
                      <Brain size={26} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gold mb-0.5">
                        E.P.T. Training Arena
                      </div>
                      <h3 className="text-xl font-black text-white tracking-tight">
                        {activeModeInfo.name} Table Ready
                      </h3>
                      <p className="text-xs text-zinc-300 leading-relaxed mt-1">
                        {activeModeInfo.description}
                      </p>
                    </div>

                    {/* Table Specification Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2 rounded-xl bg-black/60 border border-white/10 text-[10px] font-mono">
                      <div className="text-center p-1 rounded bg-white/5">
                        <div className="text-zinc-400 text-[9px] uppercase">Seats</div>
                        <div className="font-bold text-white">{config.numPlayers}-Max</div>
                      </div>
                      <div className="text-center p-1 rounded bg-white/5">
                        <div className="text-zinc-400 text-[9px] uppercase">Blinds</div>
                        <div className="font-bold text-gold">£{config.smallBlind}/£{config.bigBlind}</div>
                      </div>
                      <div className="text-center p-1 rounded bg-white/5">
                        <div className="text-zinc-400 text-[9px] uppercase">Stack</div>
                        <div className="font-bold text-emerald-400">{config.startingBigBlinds} BB</div>
                      </div>
                      <div className="text-center p-1 rounded bg-white/5">
                        <div className="text-zinc-400 text-[9px] uppercase">AI Level</div>
                        <div className="font-bold text-amber-300 uppercase">{config.difficulty}</div>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={dealNewHand}
                        className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-[#ffd700] via-[#ffe578] to-[#cfb53b] text-black font-black uppercase tracking-wider text-xs shadow-[0_0_25px_rgba(212,175,55,0.5)] hover:brightness-110 active:scale-95 transition cursor-pointer"
                      >
                        {config.gameMode === 'tournament-eliminator'
                          ? 'Start Full Game Tournament (Winner Takes All) 🏆'
                          : 'Deal Training Hand →'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* ==========================================
                        PERIMETER OPPONENT SEATS AROUND THE OVAL
                       ========================================== */}
                    {opponentPlayers.map((bot, idx) => {
                      const botProfile = BOT_ROSTER.find((b) => b.id === bot.id);
                      const posInfo = POSITION_INFO[bot.position];
                      const seatCoords = getOpponentSeatLayout(
                        idx,
                        opponentPlayers.length
                      );
                      const actionBadge = getActionBadgeMeta(
                        bot.lastAction,
                        bot.folded,
                        bot.isAllIn
                      );
                      const isBotActingNow = actingPlayerId === bot.id;
                      const isEliminated =
                        config.gameMode === 'tournament-eliminator' && bot.chips <= 0;

                      return (
                        <div
                          key={bot.id}
                          className={`absolute z-20 ${seatCoords.seatClass} transition-all duration-300`}
                        >
                          <div className="relative flex flex-col items-center">
                            {/* Bot Hole Cards Sticking Out Top of Pod (Hidden if eliminated) */}
                            {!isEliminated && (
                              <div
                                className={`flex -space-x-2.5 mb-[-10px] relative z-10 transition-all duration-500 ${
                                  bot.folded
                                    ? 'translate-y-2 scale-75 opacity-25 rotate-6'
                                    : isBotActingNow
                                    ? '-translate-y-1.5 scale-105'
                                    : 'hover:-translate-y-1'
                                }`}
                              >
                                {bot.cards.map((c, cIdx) =>
                                  renderPlayingCard(
                                    c,
                                    street !== 'Showdown',
                                    'sm',
                                    'animate-deal-card',
                                    idx * 180 + cIdx * 90
                                  )
                                )}
                              </div>
                            )}

                            {/* Angled Sky-Poker Style Seat Name & Stack Plate */}
                            <div
                              className={`min-w-[116px] sm:min-w-[132px] rounded-xl px-2.5 py-1.5 bg-[#12161f]/95 border shadow-[0_8px_20px_rgba(0,0,0,0.85)] backdrop-blur-md transition-all duration-300 ${
                                isEliminated
                                  ? 'opacity-40 grayscale border-rose-950/40 bg-black/90'
                                  : isBotActingNow
                                  ? 'border-gold ring-2 ring-gold/80 shadow-[0_0_25px_rgba(212,175,55,0.55)] scale-105'
                                  : `border-white/20 ${actionBadge?.podEffect || ''}`
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <img
                                    src={bot.avatar}
                                    alt={bot.name}
                                    className="w-5 h-5 rounded-full object-cover border border-gold/50 shrink-0"
                                  />
                                  <span className="text-[11px] font-bold text-white truncate">
                                    <InfoTooltip
                                      title={`${bot.name} (${bot.nickname})`}
                                      description={
                                        botProfile?.bio ||
                                        'AI Opponent in the E.P.T. Bot Arena.'
                                      }
                                      formula={
                                        botProfile
                                          ? `HUD: ${botProfile.vpipTarget}% VPIP / ${botProfile.pfrTarget}% PFR / ${botProfile.bluffFreq}% Bluff`
                                          : undefined
                                      }
                                      example={botProfile?.signatureMove}
                                      size={10}
                                    >
                                      <span>{bot.name.split(' ')[0]}</span>
                                    </InfoTooltip>
                                  </span>
                                </div>
                                <span className="px-1 py-0.2 rounded bg-gold/20 text-gold text-[8px] font-black shrink-0">
                                  <InfoTooltip
                                    title={
                                      POSITION_BRIDGE_LABELS[bot.position]?.fullBridge ||
                                      posInfo?.title ||
                                      bot.position
                                    }
                                    description={
                                      posInfo?.description || 'Table seat position.'
                                    }
                                    size={9}
                                  >
                                    <span>
                                      {POSITION_BRIDGE_LABELS[bot.position]?.shortBridge ||
                                        bot.position}
                                    </span>
                                  </InfoTooltip>
                                </span>
                              </div>

                              <div className="flex items-center justify-between mt-0.5 pt-0.5 border-t border-white/10">
                                <span className="text-xs font-mono font-black text-white">
                                  {isEliminated ? (
                                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider flex items-center gap-0.5">
                                      <Skull size={10} /> Out
                                    </span>
                                  ) : (
                                    `£${bot.chips.toLocaleString()}`
                                  )}
                                </span>
                                {config.gameMode === 'bounty-hunter' && (
                                  <span className="text-[9px] font-black text-ept-red">
                                    🎯£{bot.bountyValue}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Yellow 'D' Dealer Button Puck on the Felt */}
                            {bot.position === 'BTN' && (
                              <div
                                className={`absolute ${seatCoords.dealerClass} z-30 w-6 h-6 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 text-black font-black text-[11px] flex items-center justify-center border-2 border-white shadow-[0_3px_10px_rgba(0,0,0,0.8)]`}
                                title="Dealer Button (Acts last post-flop)"
                              >
                                D
                              </div>
                            )}

                            {/* Active Street Bet Stack in Front of Bot (Swept into Center Pot between Streets) */}
                            {bot.currentBet > 0 && street !== 'Showdown' && (
                              <div
                                key={`chip-${bot.id}-${street}-${bot.currentBet}`}
                                className={`absolute ${seatCoords.chipClass} z-30 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/85 border border-sky-400/50 shadow-lg animate-chip-toss whitespace-nowrap`}
                              >
                                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-b from-sky-400 to-blue-700 border border-dashed border-white flex items-center justify-center text-[7px] font-black text-white shadow">
                                  ●
                                </span>
                                <span className="text-[11px] font-mono font-black text-white">
                                  £{bot.currentBet}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* ==========================================
                        CENTER FELT: POT CHIP BADGE, 5 COMMUNITY CARDS & WATERMARK
                        Positioned in the EXACT DEAD CENTER of the poker table
                       ========================================== */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center pointer-events-none w-full max-w-lg px-2">
                      {/* Casino Chip Total Pot Pill (Sky Poker Ref Style) */}
                      <div className="flex flex-wrap items-center justify-center gap-2 mb-2 sm:mb-2.5 pointer-events-auto">
                        <div className="px-4 py-1 rounded-full bg-black/75 border border-gold/50 shadow-xl flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-gradient-to-b from-sky-400 to-blue-700 border border-dashed border-white flex items-center justify-center text-[8px] font-black text-white">
                            ●
                          </span>
                          <InfoTooltip
                            title="Total Pot Size"
                            description="The total chips committed by all players across the hand so far."
                          >
                            <span className="text-sm sm:text-base font-black text-gold tracking-wide">
                              Pot: £{pot.toLocaleString()}
                            </span>
                          </InfoTooltip>
                          <span className="text-[11px] font-mono text-zinc-300">
                            ({Math.round(pot / config.bigBlind)} BB)
                          </span>
                        </div>

                        {config.gameMode === 'pot-limit' && (
                          <div className="px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-400/40 text-cyan-300 text-[11px] font-bold">
                            Max Pot Bet: £{maxAllowedRaiseAdditional}
                          </div>
                        )}
                      </div>

                      {/* 5 Community Card Slots with Animated Dealing (True Middle of the Stadium Table) */}
                      <div className="min-h-[84px] flex items-center justify-center gap-1.5 sm:gap-2.5 my-0.5 pointer-events-auto">
                        {communityCards.length === 0 ? (
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            {[0, 1, 2, 3, 4].map((slot) => (
                              <div
                                key={slot}
                                className="w-12 h-16 sm:w-14 sm:h-20 rounded-lg border border-white/15 bg-black/15 flex items-center justify-center text-[10px] font-black text-white/15"
                              >
                                EPT
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            {communityCards.map((c, idx) =>
                              renderPlayingCard(
                                c,
                                false,
                                'md',
                                'animate-deal-community',
                                idx * 280
                              )
                            )}
                            {Array.from({
                              length: Math.max(0, 5 - communityCards.length),
                            }).map((_, emptyIdx) => (
                              <div
                                key={`empty-${emptyIdx}`}
                                className="w-12 h-16 sm:w-14 sm:h-20 rounded-lg border border-white/10 bg-black/10"
                              />
                            ))}
                          </>
                        )}
                      </div>

                      {/* Subtle Center Felt Watermark (hidden at Showdown to give clean clearance) */}
                      {street !== 'Showdown' && (
                        <div className="text-center mt-1.5 pointer-events-none">
                          <div className="text-[10px] sm:text-[11px] font-bold text-white/40 tracking-wider">
                            {activeModeInfo.name} • {config.numPlayers}-Max ({config.difficulty.toUpperCase()})
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-white/30 font-mono">
                            Blinds £{config.smallBlind}/£{config.bigBlind} •{' '}
                            {isProcessingBots
                              ? 'Bots Acting...'
                              : `Street: ${street}`}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ==========================================
                        BOTTOM-CENTER HERO SEAT POD ON THE OVAL RAIL
                       ========================================== */}
                    {hero && (
                      <div className="absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                        {/* Hero's Current Street Chip Bet in Front of Pod (Swept into Center Pot between Streets) */}
                        {hero.currentBet > 0 && street !== 'Showdown' && (
                          <div
                            key={`hero-chip-${street}-${hero.currentBet}`}
                            className="mb-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/85 border border-gold/60 shadow-lg animate-chip-toss"
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-b from-amber-300 to-yellow-600 border border-dashed border-black flex items-center justify-center text-[7px] font-black text-black">
                              ●
                            </span>
                            <span className="text-xs font-mono font-black text-gold">
                              £{hero.currentBet}
                            </span>
                          </div>
                        )}

                        <div className="relative flex flex-col items-center">
                          {/* Yellow Dealer Button if Hero is BTN */}
                          {hero.position === 'BTN' && (
                            <div
                              className="absolute -left-9 top-6 z-30 w-7 h-7 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 text-black font-black text-xs flex items-center justify-center border-2 border-white shadow-[0_4px_12px_rgba(0,0,0,0.85)]"
                              title="You have the Dealer Button (Act last post-flop!)"
                            >
                              D
                            </div>
                          )}

                          {/* Hero's 2 Large Hole Cards Popping Up from Pod */}
                          <div
                            className={`flex -space-x-2 relative z-10 transition-all duration-300 ${
                              hero.folded
                                ? 'translate-y-3 scale-75 opacity-30 rotate-6'
                                : 'hover:-translate-y-1'
                            }`}
                          >
                            {hero.cards.map((c, idx) =>
                              renderPlayingCard(
                                c,
                                false,
                                'lg',
                                'animate-deal-card',
                                idx * 90
                              )
                            )}
                          </div>

                          {/* Sky-Poker Style Win Chance (Equity) vs Call Price (Pot Odds) Strip Across Base of Hero Cards */}
                          {config.liveCoachHints && liveAnalysis && (
                            <div className="relative z-20 -mt-3.5 min-w-[205px] rounded-md bg-gradient-to-r from-amber-700/95 via-zinc-900 to-emerald-800/95 border border-gold/60 px-2.5 py-0.5 flex items-center justify-between text-[10px] font-black text-white shadow-lg gap-2">
                              <InfoTooltip
                                title="Call Price (Pot Odds %)"
                                description="Plain English: How cheap the call is compared to the pot. If your Win Chance % is higher than this Call Price %, calling makes money long-term!"
                                size={9}
                              >
                                <span className="text-amber-200">
                                  Call Price: {liveAnalysis.bountyAdjustedPotOdds}%
                                </span>
                              </InfoTooltip>
                              <span className="text-gold">🔥</span>
                              <InfoTooltip
                                title="Win Chance (Equity %)"
                                description="Plain English: Your estimated chance of winning this pot against the active opponents."
                                size={9}
                              >
                                <span className="text-emerald-300">
                                  Win Chance: {liveAnalysis.equity}%
                                </span>
                              </InfoTooltip>
                            </div>
                          )}

                          {/* Hero Nameplate & Stack Pod */}
                          <div className="min-w-[210px] rounded-xl bg-gradient-to-b from-[#171c26] to-[#0b0e14] border-2 border-gold/60 px-3.5 py-1.5 text-center shadow-[0_10px_25px_rgba(0,0,0,0.9)]">
                            <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-300 font-bold">
                              <span className="px-1.5 py-0.2 rounded bg-gold text-black font-black text-[9px] shrink-0">
                                <InfoTooltip
                                  title={
                                    POSITION_BRIDGE_LABELS[hero.position]?.fullBridge ||
                                    POSITION_INFO[hero.position]?.title ||
                                    hero.position
                                  }
                                  description={
                                    POSITION_INFO[hero.position]?.description ||
                                    'Your current table position.'
                                  }
                                  size={9}
                                >
                                  <span>
                                    {POSITION_BRIDGE_LABELS[hero.position]?.shortBridge ||
                                      hero.position}
                                  </span>
                                </InfoTooltip>
                              </span>
                              <span
                                onClick={() => setRightDockTab('ladder')}
                                title="Click to view where your hand sits on the 10-step Poker Hand Ranking Ladder"
                                className="text-gold font-bold truncate max-w-[125px] cursor-pointer hover:underline"
                              >
                                {liveAnalysis?.handEval.rankName ||
                                  liveAnalysis?.notation}
                              </span>
                            </div>
                            <div className="text-base font-mono font-black text-white mt-0.5">
                              £{hero.chips.toLocaleString()}{' '}
                              <span className="text-[11px] text-emerald-400 font-normal">
                                ({Math.round(hero.chips / config.bigBlind)} Big Blinds)
                              </span>
                            </div>
                            {derivedMetrics.bankruptcyCount > 0 && (
                              <div className="mt-1 flex items-center justify-center gap-1 text-[9px] font-black uppercase text-red-300 bg-red-950/80 border border-red-500/60 rounded px-1.5 py-0.5 shadow-[0_0_8px_rgba(239,68,68,0.35)]">
                                <span>🤡 Bankrupt ×{derivedMetrics.bankruptcyCount}</span>
                              </div>
                            )}
                            {/* Green Time / Active Turn Bar at Bottom of Hero Pod */}
                            <div className="h-1 w-full rounded-full bg-emerald-500 mt-1 shadow-[0_0_8px_#22c55e]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* =====================================================
                CLEAN SKY-POKER STYLE BOTTOM ACTION DOCK
               ===================================================== */}
            {hero && street !== 'Waiting' && street !== 'Showdown' && !hero.folded && (
              <div className="mt-3 bg-black/85 border border-white/15 rounded-2xl p-3 shadow-xl">
                {config.gameMode === 'all-in-or-fold' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      disabled={isProcessingBots}
                      onClick={() => handleHeroAction('fold')}
                      className="py-3 rounded-xl bg-zinc-800 hover:bg-red-950 border border-white/15 text-white font-black uppercase text-sm tracking-wider transition flex items-center justify-center gap-2"
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black">
                        B
                      </span>
                      Fold Hand
                    </button>
                    <button
                      disabled={isProcessingBots}
                      onClick={() => handleHeroAction('all-in')}
                      className="py-3 rounded-xl bg-gradient-to-r from-amber-500 to-ept-red text-white font-black uppercase text-sm tracking-wider shadow-[0_0_20px_rgba(230,57,70,0.5)] hover:brightness-110 transition flex items-center justify-center gap-2"
                    >
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-black/50 border border-white/40 text-white text-[10px] font-mono font-black">
                        RT
                      </span>
                      🔥 All-In (£{hero.chips})
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Top Row: Quick Pot-Percentage Sizing Buttons + Raise Readout + Slider */}
                    {maxAllowedRaiseAdditional > callAmount && (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {[
                            { label: 'Min', val: minRaiseAdditional },
                            {
                              label: '50% of Pot',
                              val: Math.max(
                                minRaiseAdditional,
                                Math.round((pot * 0.5 + callAmount) / 5) * 5
                              ),
                            },
                            {
                              label: '75% of Pot',
                              val: Math.max(
                                minRaiseAdditional,
                                Math.round((pot * 0.75 + callAmount) / 5) * 5
                              ),
                            },
                            {
                              label:
                                config.gameMode === 'pot-limit' ? 'Max Pot' : 'Pot',
                              val: Math.min(
                                maxAllowedRaiseAdditional,
                                Math.max(minRaiseAdditional, pot + callAmount * 2)
                              ),
                            },
                            ...(config.gameMode !== 'pot-limit'
                              ? [{ label: 'All-In', val: hero.chips }]
                              : []),
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              onClick={() =>
                                setCustomRaiseAmount(
                                  Math.min(maxAllowedRaiseAdditional, preset.val)
                                )
                              }
                              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-gold/25 border border-white/15 hover:border-gold text-xs font-bold text-white transition"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2.5 flex-1 sm:flex-initial justify-end">
                          <div className="px-3 py-1 rounded-lg bg-black border border-white/20 font-mono text-sm font-black text-gold min-w-[80px] text-center">
                            £{customRaiseAmount}
                          </div>
                          <input
                            type="range"
                            min={minRaiseAdditional}
                            max={Math.max(
                              minRaiseAdditional,
                              maxAllowedRaiseAdditional
                            )}
                            step={5}
                            value={customRaiseAmount}
                            onChange={(e) =>
                              setCustomRaiseAmount(Number(e.target.value))
                            }
                            className="w-28 sm:w-36 accent-gold cursor-pointer"
                          />
                        </div>
                      </div>
                    )}

                    {/* Bottom Row: 3 Big Tactile Action Buttons (Fold | Check/Call | Raise to) */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        disabled={isProcessingBots}
                        onClick={() => handleHeroAction('fold')}
                        className="py-3 rounded-xl bg-gradient-to-b from-zinc-800 to-zinc-900 hover:from-red-900 hover:to-red-950 border border-white/15 hover:border-ept-red text-white font-black uppercase text-xs sm:text-sm tracking-wider transition flex items-center justify-center gap-2 shadow-lg"
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black shadow">
                          B
                        </span>
                        <span>Fold</span>
                      </button>

                      {callAmount === 0 ? (
                        <button
                          disabled={isProcessingBots}
                          onClick={() => handleHeroAction('check')}
                          className="py-3 rounded-xl bg-gradient-to-b from-sky-600/30 to-sky-900/40 hover:from-sky-600/45 hover:to-sky-800/50 border border-sky-400/60 text-sky-200 font-black uppercase text-xs sm:text-sm tracking-wider transition flex items-center justify-center gap-2 shadow-lg"
                        >
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sky-500 text-black text-[10px] font-black shadow">
                            X
                          </span>
                          <span>Check</span>
                        </button>
                      ) : (
                        <button
                          disabled={isProcessingBots}
                          onClick={() => handleHeroAction('call')}
                          className="py-3 rounded-xl bg-gradient-to-b from-emerald-600/35 to-emerald-900/45 hover:from-emerald-500/45 hover:to-emerald-800/55 border border-emerald-400 text-emerald-200 font-black uppercase text-xs sm:text-sm tracking-wider transition flex items-center justify-center gap-2 shadow-lg"
                        >
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-400 text-black text-[10px] font-black shadow">
                            A
                          </span>
                          <span>Call £{Math.min(hero.chips, callAmount)}</span>
                        </button>
                      )}

                      {maxAllowedRaiseAdditional > callAmount ? (
                        <button
                          disabled={isProcessingBots}
                          onClick={() =>
                            handleHeroAction('raise', customRaiseAmount)
                          }
                          className="py-3 rounded-xl bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black uppercase text-xs sm:text-sm tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:brightness-110 transition flex items-center justify-center gap-2"
                        >
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-950 text-gold border border-black/40 text-[10px] font-black">
                            {customRaiseAmount >= hero.chips ? 'RT' : 'Y'}
                          </span>
                          <span>
                            {customRaiseAmount >= hero.chips
                              ? `All-In £${hero.chips}`
                              : callAmount === 0
                              ? `Bet £${customRaiseAmount}`
                              : `Raise £${customRaiseAmount}`}
                          </span>
                        </button>
                      ) : (
                        <div className="py-3 rounded-xl bg-zinc-900/50 border border-white/5 text-zinc-600 font-bold text-xs flex items-center justify-center">
                          Raise Capped
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Clean Showdown Result Bar in Bottom Action Dock (Replaces floating popups on felt) */}
            {street === 'Showdown' && handSummaryBanner && (
              <div className="mt-3 bg-gradient-to-r from-amber-950/80 via-black to-zinc-950 border-2 border-gold/70 rounded-2xl p-4 shadow-[0_0_30px_rgba(212,175,55,0.3)] animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-gold text-black text-[10px] font-black uppercase tracking-wider shadow">
                        🏆 Showdown Winner
                      </span>
                      <span className="text-xs font-mono text-gold font-bold">
                        £{handSummaryBanner.potWon.toLocaleString()} Pot
                      </span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-white">
                      {handSummaryBanner.winnerNames.join(' & ')} won with{' '}
                      <span className="text-gold">{handSummaryBanner.winningHandDesc}</span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-xs flex-wrap">
                      <span
                        className={
                          handSummaryBanner.heroNetChips >= 0
                            ? 'text-emerald-400 font-bold'
                            : 'text-red-400 font-bold'
                        }
                      >
                        Your Result: {handSummaryBanner.heroNetChips >= 0 ? '+' : ''}
                        £{handSummaryBanner.heroNetChips.toLocaleString()}
                      </span>
                      {handSummaryBanner.bountiesClaimedDesc && (
                        <span className="text-ept-red font-bold">
                          • {handSummaryBanner.bountiesClaimedDesc}
                        </span>
                      )}
                      {handSummaryBanner.heroBankrupt && (
                        <span className="text-red-300 bg-red-950/80 border border-red-500/60 rounded px-1.5 py-0.5 font-bold">
                          ⚠️ Bankrupt! (£0 Total Bankroll) • +£1,000 Bailout Granted
                        </span>
                      )}
                      {handSummaryBanner.heroBustedTableOnly && (
                        <span className="text-amber-300 bg-amber-950/80 border border-amber-500/60 rounded px-1.5 py-0.5 font-bold">
                          Table Stack Busted (£0) • Main Pot: £{(handSummaryBanner.availableMainPot ?? 0).toLocaleString()} Available
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto shrink-0">
                    {/* Auto-Advance Countdown Indicator */}
                    {autoAdvanceCountdown !== null && (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold/15 border border-gold/40 text-gold text-xs font-black animate-pulse shrink-0">
                        <Zap size={14} className="fill-gold" />
                        <span>Dealing in {autoAdvanceCountdown}s...</span>
                      </div>
                    )}

                    {/* Pause Auto Deal */}
                    {autoAdvanceCountdown !== null && (
                      <button
                        onClick={() => {
                          setAutoAdvanceCountdown(null);
                          setIsAutoPlayPaused(true);
                        }}
                        className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/20 text-zinc-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                        title="Pause automatic dealing"
                      >
                        <Pause size={13} />
                        <span className="hidden sm:inline">Pause</span>
                      </button>
                    )}

                    {/* Resume Auto Deal */}
                    {isAutoPlayPaused && autoAdvanceEnabled && (
                      <button
                        onClick={() => {
                          setIsAutoPlayPaused(false);
                          setAutoAdvanceCountdown(3);
                        }}
                        className="px-3 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                        title="Resume automatic dealing"
                      >
                        <Play size={13} fill="currentColor" />
                        <span className="hidden sm:inline">Resume</span>
                      </button>
                    )}

                    {lastHandDebriefData && (
                      <button
                        onClick={() => setShowDebriefModal(true)}
                        className="w-full sm:w-auto px-4 py-3 rounded-xl bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 hover:from-purple-900 hover:to-indigo-900 border border-purple-400/60 text-purple-200 font-black uppercase text-xs tracking-wider transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:brightness-110 active:scale-95"
                      >
                        <Award size={15} className="text-purple-300" />
                        <span>📋 Hand Report & Debrief</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setAutoAdvanceCountdown(null);
                        dealNewHand();
                      }}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black uppercase text-xs sm:text-sm tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.5)] hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 shrink-0"
                    >
                      <Play size={15} fill="currentColor" />
                      <span>
                        {autoAdvanceCountdown !== null
                          ? 'Deal Now ⚡'
                          : handSummaryBanner.heroBankrupt
                          ? 'Accept £1,000 Bailout & Deal Next Hand →'
                          : handSummaryBanner.heroBustedTableOnly
                          ? `Rebuy £${(handSummaryBanner.rebuyAmount ?? 1000).toLocaleString()} from Main Pot & Deal →`
                          : 'Deal Next Hand →'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Folded State Notice Bar in Bottom Action Dock */}
            {hero && hero.folded && street !== 'Showdown' && street !== 'Waiting' && (
              <div className="mt-3 bg-black/85 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs shadow-lg animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-black uppercase text-[10px] border border-zinc-700">
                    Folded
                  </span>
                  <span>You folded this hand. Waiting for bots to finish the action...</span>
                </div>
                <button
                  onClick={dealNewHand}
                  className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-gold hover:text-black border border-white/20 text-gold font-bold text-xs uppercase tracking-wider transition shrink-0"
                >
                  Fast-Forward Hand →
                </button>
              </div>
            )}
          </div>
        </DevWrapper>

        {/* =====================================================
            RIGHT COLUMN: CONDENSED SINGLE-PANEL TACTICAL COACH & HUD DOCK
           ===================================================== */}
        <DevWrapper
          id="coach-hud-sidebar"
          label="Coach HUD Sidebar"
          className="xl:col-span-4"
        >
          <div
            className={`rounded-2xl border p-4 transition-all bg-gradient-to-br ${hudTheme.bannerBg} ${hudTheme.borderColor} shadow-xl space-y-4 h-full`}
          >
          {/* Compact 3-Way Sub-Tabs Inside Right Dock: Coach & Math | Hand Ranks | Style & Leaks */}
          <div className="flex items-center justify-between gap-1.5 border-b border-white/10 pb-2.5">
            <div className="grid grid-cols-3 gap-1 bg-black/50 p-1 rounded-xl border border-white/10 w-full">
              <button
                onClick={() => setRightDockTab('coach')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1 ${
                  rightDockTab === 'coach'
                    ? 'bg-gold text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Award size={12} />
                <span>Coach & Timeline</span>
              </button>
              <button
                onClick={() => setRightDockTab('ladder')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1 ${
                  rightDockTab === 'ladder'
                    ? 'bg-gold text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>🃏 Hand Ranks</span>
              </button>
              <button
                onClick={() => setRightDockTab('style')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1 ${
                  rightDockTab === 'style'
                    ? 'bg-gold text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Zap size={12} />
                <span>Style & Leaks</span>
              </button>
            </div>
          </div>

          {rightDockTab === 'coach' ? (
            <div className="space-y-3.5">
              {/* 1. Compact Live Win Chance (Equity), Call Price (Pot Odds) & Helpful Cards (Outs) */}
              {!config.liveCoachHints ? (
                <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-center text-xs text-zinc-400">
                  <EyeOff className="inline mr-1.5 text-zinc-500" size={14} />
                  Exam Mode Active — Live math hidden until you act.
                </div>
              ) : liveAnalysis && street !== 'Waiting' ? (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-black/60 p-2 rounded-xl border border-white/10">
                      <div className="text-[10px] text-zinc-300 font-bold leading-tight">
                        <InfoTooltip
                          title="Win Chance (Equity %)"
                          description="Plain English: Your estimated chance of winning the pot if the hand goes to the end. Pro Term: Equity %."
                          size={10}
                        >
                          <span>
                            Win Chance{' '}
                            <span className="text-zinc-500 block text-[9px]">
                              (Equity)
                            </span>
                          </span>
                        </InfoTooltip>
                      </div>
                      <div
                        className={`text-xl font-black mt-0.5 ${
                          liveAnalysis.equity >=
                          liveAnalysis.bountyAdjustedPotOdds
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {liveAnalysis.equity}%
                      </div>
                    </div>

                    <div className="bg-black/60 p-2 rounded-xl border border-white/10">
                      <div className="text-[10px] text-zinc-300 font-bold leading-tight">
                        <InfoTooltip
                          title="Call Price (Pot Odds %)"
                          description="Plain English: How cheap the call is compared to the pot. Rule of thumb: If your Win Chance % is higher than this Call Price %, calling is profitable! Pro Term: Pot Odds %."
                          formula="Call / (Pot + Call)"
                          size={10}
                        >
                          <span>
                            Call Price{' '}
                            <span className="text-zinc-500 block text-[9px]">
                              (Pot Odds)
                            </span>
                          </span>
                        </InfoTooltip>
                      </div>
                      <div className="text-xl font-black text-white mt-0.5">
                        {liveAnalysis.bountyAdjustedPotOdds}%
                      </div>
                    </div>

                    <div className="bg-black/60 p-2 rounded-xl border border-white/10">
                      <div className="text-[10px] text-zinc-300 font-bold leading-tight">
                        <InfoTooltip
                          title="Helpful Cards Left (Outs)"
                          description="Plain English: Unseen cards remaining in the deck that will upgrade your hand into a likely winner. Pro Term: Clean Outs."
                          formula="Flop Outs × 4 ≈ Win Chance %"
                          size={10}
                        >
                          <span>
                            Helpful Cards{' '}
                            <span className="text-zinc-500 block text-[9px]">
                              (Outs)
                            </span>
                          </span>
                        </InfoTooltip>
                      </div>
                      <div className="text-xl font-black text-cyan-400 mt-0.5">
                        {liveAnalysis.drawInfo.totalOuts}
                      </div>
                    </div>
                  </div>

                  {/* Live Current Hand Rank Summary + 1-Click Ladder Cheat-Sheet Trigger */}
                  {(() => {
                    const currentRung = POKER_HAND_RANKING_LADDER.find(
                      (r) => r.rankCategory === liveAnalysis.handEval.rankCategory
                    );
                    const betterHandsCount = currentRung
                      ? currentRung.rankNumber - 1
                      : 0;
                    return (
                      <div className="p-2.5 rounded-xl bg-black/65 border border-gold/30 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-gold text-black font-mono font-black text-[10px]">
                              Rank #{currentRung?.rankNumber || 10} of 10
                            </span>
                            <span className="text-xs font-black text-white truncate">
                              {liveAnalysis.handEval.rankName}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
                            {betterHandsCount === 0
                              ? 'Unbeatable (#1 Best Possible Hand!)'
                              : `${betterHandsCount} hand type${
                                  betterHandsCount > 1 ? 's' : ''
                                } beat this • ${liveAnalysis.handEval.bestFiveDescription}`}
                          </div>
                        </div>
                        <button
                          onClick={() => setRightDockTab('ladder')}
                          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-gold hover:text-black text-[10px] font-black text-gold uppercase tracking-wider transition shrink-0"
                        >
                          What Beats Me? →
                        </button>
                      </div>
                    );
                  })()}

                  {liveAnalysis.drawInfo.drawDescription.length > 0 && (
                    <div className="px-3 py-1.5 rounded-lg bg-black/45 border border-white/10 text-[11px] text-zinc-300">
                      {liveAnalysis.drawInfo.drawDescription.join(' • ')}
                    </div>
                  )}
                </div>
              ) : null}

              {/* 2. Virtual Coach Action Grader */}
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-mono font-black uppercase tracking-wider"
                    style={{ color: hudTheme.accentColor }}
                  >
                    {hudTheme.codecTitle} [{hudTheme.codecFrequency}]
                  </span>
                  {latestFeedback && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${gradeBadgeStyle(
                        latestFeedback.grade
                      )}`}
                    >
                      Grade: {latestFeedback.grade} (
                      {latestFeedback.evDelta >= 0 ? '+' : ''}
                      {latestFeedback.evDelta} BB)
                    </span>
                  )}
                </div>

                {!latestFeedback ? (
                  <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 text-xs text-zinc-300 space-y-1">
                    {street === 'Waiting' ? (
                      <div className="text-center text-zinc-400 py-1">
                        <span className="text-gold font-bold">Table Ready:</span> Click <strong className="text-gold">Deal Hand</strong> above to start and receive real-time coach advice on every street.
                      </div>
                    ) : hero && !hero.folded && actingPlayerId === 'hero' ? (
                      <div className="space-y-2 animate-in fade-in duration-200">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-black to-zinc-950 border border-gold/40 space-y-2 shadow-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-gold">
                              <span>🎯</span>
                              <span>COACH LIVE ADVICE ({hero.position})</span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gold text-black font-black uppercase shadow">
                              {liveCoachRec?.recommendedAction || 'Your Move'}
                            </span>
                          </div>
                          {liveCoachRec ? (
                            <>
                              <div className="text-xs font-black text-white">
                                {liveCoachRec.headline}
                              </div>
                              <div className="text-[11px] text-zinc-300 leading-relaxed">
                                {liveCoachRec.explanation}
                              </div>
                              <div className="pt-1.5 border-t border-white/10 text-[10px] text-gold/90 font-mono flex items-center gap-1.5">
                                <span>💡</span>
                                <span><strong>Coach Tip:</strong> {liveCoachRec.strategicTip}</span>
                              </div>
                            </>
                          ) : (
                            <div className="text-[11px] text-zinc-300">
                              Review your Win Chance vs Call Price above, then choose Fold, Check/Call, or Raise. Coach grading will evaluate your decision instantly.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : hero && hero.folded ? (
                      <div className="text-center text-zinc-400 py-1">
                        You folded this hand. Waiting for bots to conclude the street.
                      </div>
                    ) : (
                      <div className="text-center text-zinc-400 py-1">
                        Act on the table (<strong className="text-red-400">Fold</strong>,{' '}
                        <strong className="text-sky-400">Check</strong>,{' '}
                        <strong className="text-emerald-400">Call</strong>, or{' '}
                        <strong className="text-gold">Raise</strong>) to receive instant Coach Grading & advice.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs font-mono bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                      <span className="text-zinc-400">
                        YOUR MOVE:{' '}
                        <strong className="text-white">
                          {latestFeedback.actionTaken}
                        </strong>
                      </span>
                      <span className="text-zinc-400">
                        BEST MOVE:{' '}
                        <strong style={{ color: hudTheme.accentColor }}>
                          {latestFeedback.recommendedAction}
                        </strong>
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-black/60 border border-white/10">
                      <h4 className="text-xs font-black text-white mb-1">
                        {latestFeedback.headline}
                      </h4>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {latestFeedback.explanation}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/50 border border-gold/30 text-[11px] text-gold">
                      <strong>💡 Coach Tip:</strong> {latestFeedback.strategicTip}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Live Table Action Timeline (Expandable & Collapsible to protect Coach Advice visibility) */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-gold" />
                    <span className="text-xs font-mono font-black uppercase tracking-wider text-white">
                      Table Action Timeline
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 rounded bg-black/60 text-[10px] font-mono text-zinc-400 border border-white/10">
                      H#{handNumber || 1}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-gold/15 border border-gold/40 text-gold font-mono font-bold text-[10px]">
                      £{pot.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-zinc-300 text-[10px] font-bold border border-white/10 transition"
                      title={isTimelineExpanded ? 'Collapse action timeline' : 'Expand full action timeline'}
                    >
                      <span>{isTimelineExpanded ? 'Collapse' : `Expand (${actionTimeline.length})`}</span>
                      {isTimelineExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                  </div>
                </div>

                {/* Collapsed Compact Preview Row */}
                {!isTimelineExpanded ? (
                  actionTimeline.length === 0 ? (
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center text-[11px] text-zinc-500">
                      Hand starting... Actions will stream here in real-time.
                    </div>
                  ) : (
                    <div
                      onClick={() => setIsTimelineExpanded(true)}
                      className="p-2 rounded-xl bg-black/45 border border-white/10 hover:border-gold/40 text-xs flex items-center justify-between gap-2 cursor-pointer transition group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                        <span className="text-[11px] text-zinc-300 truncate">
                          Latest: <strong className="text-white">{actionTimeline[actionTimeline.length - 1].playerName}</strong> {actionTimeline[actionTimeline.length - 1].actionText}
                        </span>
                      </div>
                      <span className="text-[10px] text-gold font-bold group-hover:underline shrink-0 flex items-center gap-0.5">
                        <span>Show full history ({actionTimeline.length})</span>
                        <ChevronDown size={10} />
                      </span>
                    </div>
                  )
                ) : (
                  /* Expanded Full Timeline */
                  <div className="space-y-1.5">
                    <div className="max-h-[260px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                      {actionTimeline.length === 0 ? (
                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center text-xs text-zinc-500">
                          Hand starting... Actions will stream here in real-time as players act.
                        </div>
                      ) : (
                        actionTimeline.map((entry) => {
                          const badgeMeta = getTimelineBadgeMeta(entry.type, entry.actionText);
                          const isShowdown = entry.type === 'showdown';
                          const isDeal = entry.type === 'deal';

                          if (isDeal) {
                            return (
                              <div
                                key={entry.id}
                                className="py-1 px-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-center flex items-center justify-between gap-2"
                              >
                                <span className="text-[10px] font-mono font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1">
                                  <span>──</span>
                                  <span>{entry.actionText}</span>
                                  <span>──</span>
                                </span>
                                {entry.cards && entry.cards.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    {entry.cards.map((c, i) => {
                                      let pillClass = 'bg-zinc-900 text-zinc-200 border-zinc-600';
                                      if (fourColorDeck) {
                                        if (c.suit === '♠') pillClass = 'bg-zinc-900 text-zinc-200 border-zinc-600';
                                        else if (c.suit === '♥') pillClass = 'bg-red-950/60 text-red-300 border-red-500/40';
                                        else if (c.suit === '♦') pillClass = 'bg-blue-950/60 text-blue-300 border-blue-500/40';
                                        else if (c.suit === '♣') pillClass = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
                                      } else {
                                        pillClass = (c.suit === '♥' || c.suit === '♦')
                                          ? 'bg-red-950/60 text-red-300 border-red-500/40'
                                          : 'bg-zinc-900 text-zinc-200 border-zinc-600';
                                      }
                                      return (
                                        <span
                                          key={i}
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black border ${pillClass}`}
                                        >
                                          {c.rank}{c.suit}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          if (isShowdown) {
                            return (
                              <div
                                key={entry.id}
                                className="p-2.5 rounded-xl bg-gradient-to-r from-amber-950/70 via-black to-amber-950/70 border border-gold/60 space-y-1 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="px-2 py-0.5 rounded-full bg-gold text-black text-[9px] font-black uppercase tracking-wider">
                                    🏆 {badgeMeta.label}
                                  </span>
                                  <span className="text-xs font-mono font-black text-gold">
                                    £{entry.amount?.toLocaleString()} Pot
                                  </span>
                                </div>
                                <div className="text-xs font-black text-white">
                                  {entry.playerName} won with {entry.actionText}
                                </div>
                                {entry.cards && entry.cards.length > 0 && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-[10px] text-zinc-400">Winning Hand:</span>
                                    {entry.cards.map((c, i) => {
                                      let pillClass = 'bg-zinc-900 text-zinc-200 border-zinc-600';
                                      if (fourColorDeck) {
                                        if (c.suit === '♠') pillClass = 'bg-zinc-900 text-zinc-200 border-zinc-600';
                                        else if (c.suit === '♥') pillClass = 'bg-red-950/60 text-red-300 border-red-500/40';
                                        else if (c.suit === '♦') pillClass = 'bg-blue-950/60 text-blue-300 border-blue-500/40';
                                        else if (c.suit === '♣') pillClass = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
                                      } else {
                                        pillClass = (c.suit === '♥' || c.suit === '♦')
                                          ? 'bg-red-950/60 text-red-300 border-red-500/40'
                                          : 'bg-zinc-900 text-zinc-200 border-zinc-600';
                                      }
                                      return (
                                        <span
                                          key={i}
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black border ${pillClass}`}
                                        >
                                          {c.rank}{c.suit}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          return (
                            <div
                              key={entry.id}
                              className={`p-2 rounded-xl border text-xs transition-all ${
                                entry.isHero
                                  ? 'bg-emerald-950/30 border-emerald-500/40'
                                  : 'bg-black/50 border-white/5'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {entry.avatar && (
                                    <img
                                      src={entry.avatar}
                                      alt={entry.playerName}
                                      className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                                    />
                                  )}
                                  <span
                                    className={`truncate font-bold text-xs ${
                                      entry.isHero ? 'text-emerald-300' : 'text-white'
                                    }`}
                                  >
                                    {entry.playerName}
                                    {entry.isHero && (
                                      <span className="text-[10px] text-emerald-400 font-normal ml-1">
                                        (You)
                                      </span>
                                    )}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${badgeMeta.bg}`}
                                  >
                                    {badgeMeta.label}
                                    {entry.amount ? ` £${entry.amount}` : ''}
                                  </span>
                                  {entry.potAfter !== undefined && (
                                    <span className="text-[10px] font-mono text-zinc-400">
                                      (Pot: £{entry.potAfter})
                                    </span>
                                  )}
                                </div>
                              </div>

                              {entry.reasoning && (
                                <div className="mt-1 text-[10px] text-zinc-400 italic pl-6 border-l border-white/10">
                                  "{entry.reasoning}"
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                      <div ref={timelineEndRef} />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setIsTimelineExpanded(false)}
                        className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 transition"
                      >
                        <span>Collapse Timeline</span>
                        <ChevronUp size={10} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : rightDockTab === 'ladder' ? (
            /* TAB 2: LIVE 10-STEP HAND RANKING LADDER CHEAT-SHEET */
            <div className="space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-gold">
                    Poker Hand Ranking Ladder (#1 Best → #10 Weakest)
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Higher ranks beat all lower ranks. Your live hand is highlighted below:
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 max-h-[430px] overflow-y-auto pr-1">
                {POKER_HAND_RANKING_LADDER.map((rung) => {
                  const isCurrentHeroHand =
                    street !== 'Waiting' &&
                    liveAnalysis?.handEval.rankCategory === rung.rankCategory;
                  const beatsCurrentHeroHand =
                    street !== 'Waiting' &&
                    liveAnalysis &&
                    rung.rankCategory > liveAnalysis.handEval.rankCategory;

                  return (
                    <div
                      key={rung.rankCategory}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isCurrentHeroHand
                          ? 'bg-gradient-to-r from-gold/25 via-emerald-950/80 to-black border-2 border-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                          : beatsCurrentHeroHand
                          ? 'bg-black/60 border-white/15'
                          : 'bg-black/35 border-white/5 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg font-mono text-[11px] font-black flex items-center justify-center shrink-0 ${
                              isCurrentHeroHand
                                ? 'bg-gold text-black'
                                : rung.rankNumber <= 3
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-white/10 text-zinc-300'
                            }`}
                          >
                            #{rung.rankNumber}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-black text-white">
                                {rung.plainName}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-semibold">
                                ({rung.proSlang})
                              </span>
                              {isCurrentHeroHand && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-400 text-black text-[9px] font-black uppercase tracking-wider animate-pulse">
                                  YOUR HAND NOW
                                </span>
                              )}
                              {beatsCurrentHeroHand && (
                                <span className="text-[9px] font-bold text-ept-red uppercase">
                                  Beats You
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-300 mt-0.5">
                              {rung.whatItIs}
                            </p>
                          </div>
                        </div>

                        <div className="text-[10px] font-mono font-bold text-gold bg-black/70 px-2 py-1 rounded border border-white/10 whitespace-nowrap shrink-0">
                          {rung.exampleCards}
                        </div>
                      </div>

                      {isCurrentHeroHand && (
                        <div className="mt-2 pt-1.5 border-t border-gold/30 text-[11px] text-emerald-300">
                          <strong>Beginner Advice:</strong> {rung.beginnerAdvice}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* TAB 3: ONGOING STYLE HUD & LEAKS (WITH PLAIN + PRO BRIDGE LABELS) */
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-400">
                    Your Playing Personality (Archetype)
                  </div>
                  <div className="text-sm font-black text-gold">
                    {derivedMetrics.archetype}
                  </div>
                </div>
                <button
                  onClick={onSwitchToTrackerTab}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  Full Analytics <ChevronRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-black/55 p-2.5 rounded-xl border border-white/10">
                  <div className="text-[10px] text-zinc-300 font-bold">
                    <InfoTooltip
                      title="Hands Played % (VPIP)"
                      description="Plain English: How often you choose to put chips in the pot to play a hand before the flop (instead of folding). Pro Term: VPIP %."
                      formula="Ideal Range: 20% – 28% of hands"
                      size={10}
                    >
                      <span>Hands Played (VPIP)</span>
                    </InfoTooltip>
                  </div>
                  <div className="text-base font-black text-white mt-0.5">
                    {derivedMetrics.vpipPercent}%
                  </div>
                </div>
                <div className="bg-black/55 p-2.5 rounded-xl border border-white/10">
                  <div className="text-[10px] text-zinc-300 font-bold">
                    <InfoTooltip
                      title="Hands Raised % (PFR)"
                      description="Plain English: How often you enter the pot by raising rather than just calling. Raising puts pressure on opponents! Pro Term: PFR %."
                      formula="Ideal Range: 16% – 24% of hands"
                      size={10}
                    >
                      <span>Hands Raised (PFR)</span>
                    </InfoTooltip>
                  </div>
                  <div className="text-base font-black text-white mt-0.5">
                    {derivedMetrics.pfrPercent}%
                  </div>
                </div>
                <div className="bg-black/55 p-2.5 rounded-xl border border-white/10">
                  <div className="text-[10px] text-zinc-300 font-bold">
                    <InfoTooltip
                      title="Betting Drive (Aggression Factor / AF)"
                      description="Plain English: How often you bet or raise compared to how often you just call after the flop. Pro Term: Aggression Factor (AF)."
                      formula="Ideal Range: 2.0 – 3.5"
                      size={10}
                    >
                      <span>Betting Drive (AF)</span>
                    </InfoTooltip>
                  </div>
                  <div className="text-base font-black text-white mt-0.5">
                    {derivedMetrics.aggressionFactor}
                  </div>
                </div>
                <div className="bg-black/55 p-2.5 rounded-xl border border-white/10">
                  <div className="text-[10px] text-zinc-300 font-bold">
                    <InfoTooltip
                      title="Virtual Coach Accuracy Score"
                      description="Your overall grade across all decisions made at the table."
                      size={10}
                    >
                      <span>Coach Score</span>
                    </InfoTooltip>
                  </div>
                  <div className="text-base font-black text-emerald-400 mt-0.5">
                    {derivedMetrics.decisionAccuracyPercent}%
                  </div>
                </div>
              </div>

              {derivedMetrics.diagnosedLeaks.length > 0 && (
                <div className="bg-ept-red/10 border border-ept-red/30 rounded-xl p-3 text-xs">
                  <div className="font-bold text-ept-red flex items-center gap-1.5">
                    <AlertTriangle size={13} />
                    Habit to Fix: {derivedMetrics.diagnosedLeaks[0].title}
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-1">
                    {derivedMetrics.diagnosedLeaks[0].fixAction}
                  </p>
                </div>
              )}

              {onSwitchToLicensesTab && (
                <button
                  onClick={onSwitchToLicensesTab}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-gold transition"
                >
                  Open License Center & Console HUD Skins →
                </button>
              )}
            </div>
          )}
          </div>
        </DevWrapper>
      </div>

      {/* ========================================================
          EMERGENCY BANKRUPTCY & £1,000 BAILOUT MODAL DIALOG
         ======================================================== */}
      {bailoutModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-md w-full bg-gradient-to-b from-red-950/95 via-zinc-950 to-black border-2 border-red-500 rounded-3xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.5)] text-center space-y-4">
            {/* Humorous Animated Icon */}
            <div className="w-20 h-20 mx-auto rounded-full bg-red-900/60 border-2 border-red-500 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(239,68,68,0.7)] animate-bounce select-none">
              🤡
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-900/70 border border-red-500/80 text-red-200 text-[10px] font-black uppercase tracking-widest">
                <span>💥 Felted • Out of Chips</span>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                YOU WENT BANKRUPT!
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                You lost your entire career bankroll and ran completely out of chips! The EPT League Treasury has stepped in to keep you at the tables.
              </p>
            </div>

            {/* Free £1,000 Bailout Box */}
            <div className="p-4 rounded-2xl bg-black/80 border border-gold/40 text-center space-y-1 shadow-inner">
              <div className="text-[10px] uppercase font-bold text-zinc-400">
                E.P.T. League Treasury Emergency Grant
              </div>
              <div className="text-3xl font-mono font-black text-gold flex items-center justify-center gap-1">
                <span>+£{bailoutModalData.chipsGranted.toLocaleString()} Free Chips</span>
              </div>
              <div className="text-[11px] text-emerald-400 font-bold">
                Granted immediately so you can get back in the action!
              </div>
            </div>

            {/* Humiliating Loser Badge Award Announcement */}
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/60 text-left flex items-start gap-3">
              <div className="text-2xl shrink-0 mt-0.5">⚠️</div>
              <div className="text-xs">
                <div className="font-black text-red-300 uppercase">
                  Loser Badge Awarded: Bankrupt ×{bailoutModalData.count}
                </div>
                <div className="text-[11px] text-zinc-300 mt-0.5 leading-snug">
                  Your profile on the public League Leaderboard now bears the &quot;Bankrupt ×{bailoutModalData.count}&quot; badge for all league members to see.
                </div>
              </div>
            </div>

            <button
              onClick={() => setBailoutModalData(null)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-[#ffd700] text-black font-black uppercase text-xs tracking-wider shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:brightness-110 active:scale-95 transition"
            >
              Accept £1,000 Bailout & Wear Badge of Shame →
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          CUSTOMIZABLE TIMED BLINDS & TOURNAMENT CLOCK MODAL
         ======================================================== */}
      <TimedBlindsCustomizerModal
        isOpen={showCustomizerModal}
        onClose={() => setShowCustomizerModal(false)}
        config={timedBlindsConfig}
        onSaveConfig={handleSaveTimedBlindsConfig}
        currentLevelIndex={currentLevelIndex}
        secondsRemaining={blindSecondsRemaining}
        isRunning={isTimerRunning}
        onToggleTimer={handleToggleTimer}
        onResetTimer={handleResetTimer}
        onJumpToLevel={handleJumpToLevel}
      />

      {/* ========================================================
          POST-HAND COACH REPORT & DEBRIEF MODAL
         ======================================================== */}
      {showDebriefModal && lastHandDebriefData && (
        <HandDebriefModal
          data={lastHandDebriefData}
          onClose={() => setShowDebriefModal(false)}
          onDealNextHand={() => {
            setShowDebriefModal(false);
            dealNewHand();
          }}
          onLaunchDrill={(preset) => {
            setShowDebriefModal(false);
            applyPreset(preset);
            dealNewHand();
          }}
        />
      )}

      {/* ========================================================
          FULL GAME / TOURNAMENT GRAND FINALE REPORT MODAL
         ======================================================== */}
      {showTournamentReport && tournamentReportData && (
        <TournamentReportModal
          data={tournamentReportData}
          onClose={() => setShowTournamentReport(false)}
          onStartNewTournament={startNewFullTournament}
        />
      )}
    </div>
  );
}
