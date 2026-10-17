'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  Calculator,
  Coins,
  Gamepad2,
  GraduationCap,
  Sparkles,
  Trophy,
  User,
  Brain,
  Sliders,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';
import { CareerTrackerStats, ScenarioPreset } from '@/lib/poker-trainer/types';
import {
  computeDerivedMetrics,
  getActivePlayerName,
  getInitialTrackerStats,
  loadTrackerStatsForPlayer,
  resetTrackerStats,
  saveTrackerStatsForPlayer,
  transferGuestChipsToPlayer,
} from '@/lib/poker-trainer/tracker';
import {
  ACADEMY_LICENSE_TESTS,
  CONSOLE_HUD_THEMES,
  ConsoleHudThemeId,
} from '@/lib/poker-trainer/console-aesthetics-db';
import BotTrainerArena from './BotTrainerArena';
import PlayStyleTracker from './PlayStyleTracker';
import RangeAndOddsLab from './RangeAndOddsLab';
import CurriculumAndQuiz from './CurriculumAndQuiz';
import ConsoleAestheticsAndLicenses from './ConsoleAestheticsAndLicenses';
import AcademyChipLeaderboard from './AcademyChipLeaderboard';
import HandOfTheWeekPuzzle from './HandOfTheWeekPuzzle';
import InfoTooltip from './InfoTooltip';
import { computeTotalAcademyChips } from '@/lib/poker-trainer/leaderboard';
import { CANONICAL_PLAYER_NAMES } from '@/lib/roster';

export type AcademyTab =
  | 'arena'
  | 'puzzles'
  | 'leaderboard'
  | 'licenses'
  | 'tracker'
  | 'ranges'
  | 'curriculum';

interface Props {
  defaultTab?: AcademyTab;
}

const HUD_THEME_STORAGE_KEY = 'ept_academy_hud_theme_v1';

export const LEAGUE_PLAYERS = CANONICAL_PLAYER_NAMES;

export default function AcademyHub({ defaultTab = 'arena' }: Props) {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab') as AcademyTab | null;
  const initialTab =
    urlTab &&
    ['arena', 'puzzles', 'leaderboard', 'licenses', 'tracker', 'ranges', 'curriculum'].includes(urlTab)
      ? urlTab
      : defaultTab;

  const [activeTab, setActiveTab] = useState<AcademyTab>(initialTab);
  const [activePlayerName, setActivePlayerName] = useState<string>('Guest Trainee');
  const [trackerStats, setTrackerStats] = useState<CareerTrackerStats>(() =>
    getInitialTrackerStats()
  );
  const [activePreset, setActivePreset] = useState<ScenarioPreset>('free-play');
  const [activeHudTheme, setActiveHudTheme] =
    useState<ConsoleHudThemeId>('gt4-license');
  const [allPlayersList, setAllPlayersList] = useState<{ name: string; isCustom?: boolean }[]>([]);

  useEffect(() => {
    if (
      urlTab &&
      ['arena', 'puzzles', 'leaderboard', 'licenses', 'tracker', 'ranges', 'curriculum'].includes(urlTab)
    ) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const fetchPlayerRoster = () => {
    fetch('/api/players')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setAllPlayersList(data);
      })
      .catch(() => {});
  };

  // Load active player, persisted stats, and console HUD theme on mount
  useEffect(() => {
    fetchPlayerRoster();
    const loggedIn = getActivePlayerName();
    const effectivePlayer = loggedIn || 'Guest Trainee';
    setActivePlayerName(effectivePlayer);

    const localStats = loadTrackerStatsForPlayer(effectivePlayer);
    setTrackerStats(localStats);

    // Sync with server profile if available (never downgrade higher local bankroll)
    if (effectivePlayer && effectivePlayer !== 'Guest Trainee') {
      fetch(`/api/player/academy-profile?name=${encodeURIComponent(effectivePlayer)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.stats) {
            const serverChips = computeTotalAcademyChips(data.stats);
            const localChips = computeTotalAcademyChips(localStats);
            if (serverChips >= localChips && data.stats.handsPlayed >= localStats.handsPlayed) {
              setTrackerStats(data.stats);
              saveTrackerStatsForPlayer(data.stats, effectivePlayer);
            }
          }
        })
        .catch(() => {});
    }

    try {
      const savedTheme = window.localStorage.getItem(
        HUD_THEME_STORAGE_KEY
      ) as ConsoleHudThemeId | null;
      if (savedTheme && savedTheme in CONSOLE_HUD_THEMES) {
        setActiveHudTheme(savedTheme);
      }
    } catch {
      // ignore storage errors
    }

    // Listen to login/logout from Locker PIN modal
    const handleStorage = () => {
      fetchPlayerRoster();
      const current = getActivePlayerName() || 'Guest Trainee';
      if (current !== activePlayerName) {
        setActivePlayerName(current);
        const stats = loadTrackerStatsForPlayer(current);
        setTrackerStats(stats);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleSwitchPlayer = (newPlayer: string) => {
    if (newPlayer === '__add_new__') {
      window.dispatchEvent(new CustomEvent('ept_open_login'));
      return;
    }

    // If switching from guest to a league player, claim any guest session winnings
    if (activePlayerName === 'Guest Trainee' && newPlayer !== 'Guest Trainee') {
      transferGuestChipsToPlayer(newPlayer);
    }

    setActivePlayerName(newPlayer);
    if (newPlayer !== 'Guest Trainee') {
      try {
        localStorage.setItem('ept_active_player_v2', newPlayer);
      } catch {}
    } else {
      try {
        localStorage.removeItem('ept_active_player_v2');
      } catch {}
    }
    const stats = loadTrackerStatsForPlayer(newPlayer);
    setTrackerStats(stats);

    // Also check server profile without downgrading local bankroll
    if (newPlayer !== 'Guest Trainee') {
      fetch(`/api/player/academy-profile?name=${encodeURIComponent(newPlayer)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.stats) {
            const serverChips = computeTotalAcademyChips(data.stats);
            const localChips = computeTotalAcademyChips(stats);
            if (serverChips >= localChips && data.stats.handsPlayed >= stats.handsPlayed) {
              setTrackerStats(data.stats);
              saveTrackerStatsForPlayer(data.stats, newPlayer);
            }
          }
        })
        .catch(() => {});
    }
  };

  const handleSelectHudTheme = (theme: ConsoleHudThemeId) => {
    setActiveHudTheme(theme);
    try {
      window.localStorage.setItem(HUD_THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  };

  const handleUpdateTracker = (
    updater: (prev: CareerTrackerStats) => CareerTrackerStats
  ) => {
    setTrackerStats((prev) => {
      const next = updater(prev);
      saveTrackerStatsForPlayer(next, activePlayerName);

      // Asynchronously sync to server
      if (activePlayerName && activePlayerName !== 'Guest Trainee') {
        fetch('/api/player/academy-profile', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({ name: activePlayerName, stats: next }),
        }).catch(() => {});
      }

      return next;
    });
  };

  const handleResetTracker = () => {
    const fresh = resetTrackerStats(activePlayerName);
    setTrackerStats(fresh);
    if (activePlayerName && activePlayerName !== 'Guest Trainee') {
      fetch('/api/player/academy-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: activePlayerName, stats: fresh }),
      }).catch(() => {});
    }
  };

  const handleLaunchPresetDrill = (preset: ScenarioPreset) => {
    setActivePreset(preset);
    setActiveTab('arena');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const derived = useMemo(
    () => computeDerivedMetrics(trackerStats),
    [trackerStats]
  );

  const hudThemeObj = useMemo(
    () =>
      CONSOLE_HUD_THEMES[activeHudTheme] ||
      CONSOLE_HUD_THEMES['gt4-license'],
    [activeHudTheme]
  );

  const licenseMedals = useMemo(() => {
    let gold = 0;
    let silver = 0;
    let bronze = 0;
    for (const test of ACADEMY_LICENSE_TESTS) {
      const m = test.medalStatus(trackerStats);
      if (m === 'Gold') gold++;
      else if (m === 'Silver') silver++;
      else if (m === 'Bronze') bronze++;
    }
    return { gold, silver, bronze, total: gold + silver + bronze };
  }, [trackerStats]);

  const totalCareerChips = useMemo(
    () => computeTotalAcademyChips(trackerStats),
    [trackerStats]
  );

  // Grouped Training Modes for the Mode Selector
  const TRAINING_MODES: {
    id: AcademyTab;
    label: string;
    category: 'arena' | 'study' | 'progress';
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string;
    tooltipTitle: string;
    tooltipDesc: string;
  }[] = [
    {
      id: 'arena',
      label: 'Free Play & Bot Arena',
      category: 'arena',
      icon: Gamepad2,
      badge: 'LIVE',
      tooltipTitle: 'AI Bot Scenario Trainer & Free Play',
      tooltipDesc:
        'Live poker table against AI bots with authentic E.P.T. playstyles. Play Cash, Eliminator, Bounty, All-In or Fold, Bomb Pot, and ICM Bubble while receiving real-time GTO coach feedback.',
    },
    {
      id: 'puzzles',
      label: 'Hand Review',
      category: 'arena',
      icon: Brain,
      badge: 'WEEKLY',
      tooltipTitle: 'Hand of the Week League Puzzles',
      tooltipDesc:
        'Replay and analyze real hands from the E.P.T. Poker League. Test tactical decisions, pot odds, and study post-hand coach debriefs.',
    },
    {
      id: 'licenses',
      label: 'Challenges & Licenses',
      category: 'progress',
      icon: Trophy,
      badge: `${licenseMedals.total}/6`,
      tooltipTitle: 'License Trials & Console Tutorial HUDs',
      tooltipDesc:
        'Earn Bronze, Silver, and Gold trophies across 6 Gran Turismo-style License Trials and switch between authentic console tutorial aesthetics.',
    },
    {
      id: 'tracker',
      label: 'Style Tracker',
      category: 'progress',
      icon: Activity,
      badge: `${trackerStats.handsPlayed} Hands`,
      tooltipTitle: 'Ongoing Play-Style Tracker & Leak Finder',
      tooltipDesc:
        'Tracks your live HUD stats (VPIP, PFR, 3-Bet, AF), maps your personality on the 2D Style Matrix, and pinpoints leaks.',
    },
    {
      id: 'ranges',
      label: 'GTO Ranges & Odds',
      category: 'study',
      icon: Calculator,
      tooltipTitle: 'GTO Starting Hand Grid & Pot Odds Lab',
      tooltipDesc:
        'Explore 13x13 pre-flop ranges by position and calculate pot odds, outs, pot-limit sizes, and bounty equity.',
    },
    {
      id: 'curriculum',
      label: 'Masterclass',
      category: 'study',
      icon: GraduationCap,
      tooltipTitle: 'Curriculum, Bot Dossier & Strategy Exam',
      tooltipDesc:
        'Study 6 tactical training modules, inspect AI bot profiles, take the 8-question Strategy Exam, and browse the Poker Lexicon.',
    },
    {
      id: 'leaderboard',
      label: 'Chip Leaderboard',
      category: 'progress',
      icon: Coins,
      badge: `£${totalCareerChips.toLocaleString()}`,
      tooltipTitle: 'Academy Bankroll & Progression Tiers',
      tooltipDesc:
        'Live bankroll leaderboard ranking all 12 E.P.T. league players from Rookie Trainee to GTO Master.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d0f12] text-white px-2.5 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 font-sans">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-3.5">
        
        {/* =====================================================================
            LAYER A: COMPACT ACADEMY HEADER
            Ultra-compact single/double-tier bar with zero wasted vertical height.
            ===================================================================== */}
        <header
          className={`rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 border transition-all bg-gradient-to-r ${hudThemeObj.bannerBg} ${hudThemeObj.borderColor} shadow-md`}
          aria-label="Academy Status and Profile Bar"
        >
          <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
            
            {/* Left: Branding & Player Profile Switcher */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold shadow-inner shrink-0">
                  <Sparkles size={15} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 leading-tight">
                    <h1 className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ffd700] via-[#ffe578] to-[#cfb53b] uppercase tracking-wider">
                      E.P.T. Academy
                    </h1>
                    <InfoTooltip
                      title="E.P.T. Poker Academy & AI Trainer"
                      description="Interactive training arena. Switch modes using the training selector below. The table and coach advice stay synchronized in real time."
                      size={11}
                    />
                  </div>

                  {/* Player & Skin Selector Strip */}
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-300 font-mono mt-0.5">
                    <User size={10} className="text-gold shrink-0" />
                    <select
                      aria-label="Current Player Profile"
                      value={activePlayerName}
                      onChange={(e) => handleSwitchPlayer(e.target.value)}
                      className="bg-transparent text-[10px] font-mono font-bold uppercase text-gold hover:text-white focus:outline-none cursor-pointer max-w-[140px] sm:max-w-none truncate"
                    >
                      <option value="Guest Trainee" className="bg-zinc-900 text-amber-300">
                        Player: Guest (Unsaved)
                      </option>
                      <optgroup label="Canonical League Roster" className="bg-zinc-900 text-zinc-300">
                        {LEAGUE_PLAYERS.map((p) => (
                          <option key={p} value={p} className="bg-zinc-900 text-white">
                            {p}
                          </option>
                        ))}
                      </optgroup>
                      {allPlayersList.filter((p) => !LEAGUE_PLAYERS.includes(p.name)).length > 0 && (
                        <optgroup label="Registered Cloud Players" className="bg-zinc-900 text-purple-300">
                          {allPlayersList
                            .filter((p) => !LEAGUE_PLAYERS.includes(p.name))
                            .map((p) => (
                              <option key={p.name} value={p.name} className="bg-zinc-900 text-white">
                                {p.name}
                              </option>
                            ))}
                        </optgroup>
                      )}
                      <option value="__add_new__" className="bg-zinc-900 text-gold font-black">
                        + Add / Login with PIN...
                      </option>
                    </select>

                    <span className="text-zinc-600">•</span>

                    {/* Console HUD Skin dropdown */}
                    <select
                      aria-label="Console HUD Skin Theme"
                      value={activeHudTheme}
                      onChange={(e) => handleSelectHudTheme(e.target.value as ConsoleHudThemeId)}
                      className="bg-transparent text-[10px] font-mono font-bold uppercase text-zinc-400 hover:text-white focus:outline-none cursor-pointer max-w-[90px] sm:max-w-none truncate"
                    >
                      {(Object.keys(CONSOLE_HUD_THEMES) as ConsoleHudThemeId[]).map((skinId) => (
                        <option key={skinId} value={skinId} className="bg-zinc-900 text-white">
                          HUD: {CONSOLE_HUD_THEMES[skinId].name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Compact Bankroll & Coach Grade Telemetry */}
            <div className="flex items-center gap-2 sm:gap-2.5 text-xs">
              
              {/* Bankroll Pill (Clickable -> Opens Leaderboard) */}
              <button
                type="button"
                onClick={() => setActiveTab('leaderboard')}
                title="Your live Academy Chip Bankroll. Click to view Leaderboard standings!"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 hover:bg-black/80 border border-gold/40 hover:border-gold transition text-left group"
              >
                <div className="w-5 h-5 rounded-full bg-gold text-black flex items-center justify-center font-black shadow shrink-0">
                  <Coins size={11} />
                </div>
                <div className="leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300">
                      Bankroll
                    </span>
                    {trackerStats.netChipsWon !== 0 && (
                      <span
                        className={`text-[8px] font-mono font-bold ${
                          trackerStats.netChipsWon > 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {trackerStats.netChipsWon > 0 ? '+' : ''}
                        £{trackerStats.netChipsWon.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-mono font-black text-white group-hover:text-gold transition">
                    £{totalCareerChips.toLocaleString()}
                  </div>
                </div>
              </button>

              {/* Coach Accuracy Grade */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/50 border border-white/10 font-mono">
                <Shield size={12} className="text-emerald-400 shrink-0" />
                <div className="leading-tight">
                  <div className="text-[9px] text-zinc-400 font-bold uppercase">Coach Grade</div>
                  <div className="text-xs font-black text-emerald-400">
                    {derived.decisionAccuracyPercent}%
                  </div>
                </div>
              </div>

              {/* Tracked Style Archetype */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/50 border border-white/10">
                <div className="leading-tight">
                  <div className="text-[9px] text-zinc-400 font-bold uppercase">Archetype</div>
                  <div className="text-xs font-black text-gold truncate max-w-[90px]">
                    {derived.archetype}
                  </div>
                </div>
              </div>

              {/* Quick Settings / PIN Modal Trigger */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('ept_open_login'))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-gold/20 text-zinc-400 hover:text-gold border border-white/10 hover:border-gold/40 transition"
                title="Locker PIN & Profile Settings"
                aria-label="Profile and PIN Settings"
              >
                <Sliders size={13} />
              </button>
            </div>
          </div>
        </header>

        {/* Guest Mode Warning Banner (Compact) */}
        {(activePlayerName === 'Guest Trainee' || activePlayerName.toLowerCase().startsWith('guest')) && (
          <div className="bg-gradient-to-r from-amber-950/60 via-black to-amber-950/60 border border-amber-500/40 rounded-xl px-3.5 py-2 flex items-center justify-between gap-3 text-xs shadow animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-amber-200 text-xs">
              <span className="text-sm">👁️</span>
              <span>
                <strong className="text-amber-300">Guest Mode:</strong> Hands are temporary and will not save to Firebase cloud storage.
              </span>
            </div>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('ept_open_login'))}
              className="px-3 py-1 rounded-lg bg-gold text-black font-black uppercase text-[10px] tracking-wider hover:brightness-110 active:scale-95 transition shrink-0"
            >
              Claim / Login →
            </button>
          </div>
        )}

        {/* =====================================================================
            LAYER B: TRAINING MODE SELECTOR
            Dedicated, clear, horizontally scrollable navigation strip for Academy modes.
            ===================================================================== */}
        <nav
          className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10 overflow-x-auto max-w-full touch-pan-x scrollbar-hide tabs-scrollbar"
          aria-label="Academy Training Modes"
        >
          {TRAINING_MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeTab === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setActiveTab(mode.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black shadow-[0_0_12px_rgba(212,175,55,0.35)]'
                    : 'text-zinc-300 hover:text-white hover:bg-white/5'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={13} className={isActive ? 'text-black' : 'text-gold'} />
                <span>{mode.label}</span>
                {mode.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-black ${
                      isActive ? 'bg-black/25 text-black' : 'bg-white/10 text-gold'
                    }`}
                  >
                    {mode.badge}
                  </span>
                )}
                <InfoTooltip
                  title={mode.tooltipTitle}
                  description={mode.tooltipDesc}
                  size={10}
                />
              </button>
            );
          })}
        </nav>

        {/* =====================================================================
            ACTIVE MODE VIEWPORT
            Renders the visual layers (Controls, Poker Table, Coach Panel).
            ===================================================================== */}
        <div className="pt-0.5">
          {activeTab === 'arena' && (
            <BotTrainerArena
              trackerStats={trackerStats}
              onUpdateTracker={handleUpdateTracker}
              onSwitchToTrackerTab={() => setActiveTab('tracker')}
              onSwitchToLicensesTab={() => setActiveTab('licenses')}
              initialPreset={activePreset}
              activeHudTheme={activeHudTheme}
              playerName={activePlayerName}
            />
          )}

          {activeTab === 'puzzles' && <HandOfTheWeekPuzzle />}

          {activeTab === 'leaderboard' && (
            <AcademyChipLeaderboard
              activePlayerName={activePlayerName}
              onLaunchPresetDrill={handleLaunchPresetDrill}
            />
          )}

          {activeTab === 'licenses' && (
            <ConsoleAestheticsAndLicenses
              trackerStats={trackerStats}
              activeHudTheme={activeHudTheme}
              onSelectHudTheme={handleSelectHudTheme}
              onLaunchPresetDrill={handleLaunchPresetDrill}
            />
          )}

          {activeTab === 'tracker' && (
            <PlayStyleTracker
              trackerStats={trackerStats}
              onResetTracker={handleResetTracker}
              onLaunchPresetDrill={handleLaunchPresetDrill}
              playerName={activePlayerName}
            />
          )}

          {activeTab === 'ranges' && <RangeAndOddsLab />}

          {activeTab === 'curriculum' && (
            <CurriculumAndQuiz onLaunchPresetDrill={handleLaunchPresetDrill} />
          )}
        </div>
      </div>
    </div>
  );
}
