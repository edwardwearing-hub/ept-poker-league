'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Calculator,
  Coins,
  Gamepad2,
  GraduationCap,
  Radio,
  Sparkles,
  Trophy,
  Tv,
  User,
} from 'lucide-react';
import { CareerTrackerStats, ScenarioPreset } from '@/lib/poker-trainer/types';
import {
  computeDerivedMetrics,
  getActivePlayerName,
  getInitialTrackerStats,
  loadTrackerStatsForPlayer,
  resetTrackerStats,
  saveTrackerStatsForPlayer,
} from '@/lib/poker-trainer/tracker';
import {
  ACADEMY_LICENSE_TESTS,
  CONSOLE_HUD_THEMES,
  CONSOLE_TUTORIAL_AESTHETICS_DB,
  ConsoleHudThemeId,
} from '@/lib/poker-trainer/console-aesthetics-db';
import BotTrainerArena from './BotTrainerArena';
import PlayStyleTracker from './PlayStyleTracker';
import RangeAndOddsLab from './RangeAndOddsLab';
import CurriculumAndQuiz from './CurriculumAndQuiz';
import ConsoleAestheticsAndLicenses from './ConsoleAestheticsAndLicenses';
import AcademyChipLeaderboard from './AcademyChipLeaderboard';
import InfoTooltip from './InfoTooltip';
import { computeTotalAcademyChips } from '@/lib/poker-trainer/leaderboard';

export type AcademyTab =
  | 'arena'
  | 'leaderboard'
  | 'licenses'
  | 'tracker'
  | 'ranges'
  | 'curriculum';

interface Props {
  defaultTab?: AcademyTab;
}

const HUD_THEME_STORAGE_KEY = 'ept_academy_hud_theme_v1';

export const LEAGUE_PLAYERS = [
  'Edward Wearing',
  'Liam Duxbury',
  'Luke Daly',
  'Georgina Wearing',
  'Daniel Horne',
  'Darren Daly',
  'Chris Daly',
  'Stephen Flood',
  'Dave Blackburn',
  'Nathen Benson',
  'Dave Taylor',
];

export default function AcademyHub({ defaultTab = 'arena' }: Props) {
  const [activeTab, setActiveTab] = useState<AcademyTab>(defaultTab);
  const [activePlayerName, setActivePlayerName] = useState<string>('Guest Trainee');
  const [trackerStats, setTrackerStats] = useState<CareerTrackerStats>(() =>
    getInitialTrackerStats()
  );
  const [activePreset, setActivePreset] = useState<ScenarioPreset>('free-play');
  const [activeHudTheme, setActiveHudTheme] =
    useState<ConsoleHudThemeId>('gt4-license');
  const [allPlayersList, setAllPlayersList] = useState<{ name: string; isCustom?: boolean }[]>([]);

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

    // Sync with server profile if available
    if (effectivePlayer && effectivePlayer !== 'Guest Trainee') {
      fetch(`/api/player/academy-profile?name=${encodeURIComponent(effectivePlayer)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.stats && data.stats.handsPlayed > localStats.handsPlayed) {
            setTrackerStats(data.stats);
            saveTrackerStatsForPlayer(data.stats, effectivePlayer);
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
    setActivePlayerName(newPlayer);
    if (newPlayer !== 'Guest Trainee') {
      try {
        localStorage.setItem('ept_active_player_v2', newPlayer);
      } catch {}
    }
    const stats = loadTrackerStatsForPlayer(newPlayer);
    setTrackerStats(stats);

    // Also check server profile
    if (newPlayer !== 'Guest Trainee') {
      fetch(`/api/player/academy-profile?name=${encodeURIComponent(newPlayer)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.stats && data.stats.handsPlayed > stats.handsPlayed) {
            setTrackerStats(data.stats);
            saveTrackerStatsForPlayer(data.stats, newPlayer);
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
          headers: { 'Content-Type': 'application/json' },
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

  const TABS: {
    id: AcademyTab;
    shortLabel: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string;
    tooltipTitle: string;
    tooltipDesc: string;
  }[] = [
    {
      id: 'arena',
      shortLabel: 'Poker Table',
      icon: Gamepad2,
      badge: 'LIVE',
      tooltipTitle: 'AI Bot Trainer & Scenario Simulator',
      tooltipDesc:
        'Play full poker hands against 1 to 8 AI bots with distinct E.P.T. playstyles. Customize the game format (No-Limit, Pot Limit, Bounty Hunter, All-In or Fold, ICM Bubble, Bomb Pot) while the Virtual Coach grades every action in real time.',
    },
    {
      id: 'leaderboard',
      shortLabel: 'Leaderboard',
      icon: Coins,
      badge: `£${totalCareerChips.toLocaleString()}`,
      tooltipTitle: 'Academy Chip Bankroll & Tier Leaderboard',
      tooltipDesc:
        'Live chip bankroll leaderboard ranking all 11 E.P.T. league players with training level progression from Rookie to GTO Master.',
    },
    {
      id: 'licenses',
      shortLabel: 'Licenses & HUDs',
      icon: Trophy,
      badge: `${licenseMedals.total}/6`,
      tooltipTitle: 'Gran Turismo License Center & 2000–2015 Console Tutorial DB',
      tooltipDesc:
        'Earn Bronze, Silver, and Gold trophies across 6 Gran Turismo-style E.P.T. License Trials, switch between 5 authentic 2000–2015 console tutorial HUD themes, and explore the 10-game Console Tutorial Aesthetics Database.',
    },
    {
      id: 'tracker',
      shortLabel: 'Style Tracker',
      icon: Activity,
      badge: `${trackerStats.handsPlayed}`,
      tooltipTitle: 'Ongoing Play-Style Tracker & Leak Finder',
      tooltipDesc:
        'Tracks every hand you play in the Arena to build your personal HUD profile (VPIP, PFR, 3-Bet, Aggression Factor), plots you on the 2D Style Matrix, and diagnoses your biggest poker leaks.',
    },
    {
      id: 'ranges',
      shortLabel: 'Ranges & Odds',
      icon: Calculator,
      tooltipTitle: 'GTO Pre-Flop Ranges & Math Lab',
      tooltipDesc:
        'Explore the interactive 13×13 starting-hand grid by table position and format, and use the Pot Odds, Outs, Pot-Limit, and Bounty Hunter calculator.',
    },
    {
      id: 'curriculum',
      shortLabel: 'Masterclass',
      icon: GraduationCap,
      tooltipTitle: 'Masterclass Curriculum, Bot Dossier & Exam',
      tooltipDesc:
        'Study 6 tactical training modules, scout the AI Bot personas, test yourself on the 8-question explained Strategy Exam, and browse the Poker Lexicon.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d0f12] text-white px-3 py-3 md:px-6 md:py-4 font-sans">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Compact Single-Row Command Header */}
        <div
          className={`rounded-2xl px-4 py-3 border transition-all bg-gradient-to-r ${hudThemeObj.bannerBg} ${hudThemeObj.borderColor} shadow-lg`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Brand Title + HUD Skin Selector */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold shadow-inner">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-base md:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ffd700] via-[#ffe578] to-[#cfb53b] uppercase tracking-wider leading-none">
                      E.P.T. Academy
                    </h1>
                    <InfoTooltip
                      title="The E.P.T. Poker Academy & AI Trainer"
                      description="Hover over any metric or click any ⓘ icon for instant formulas & pro tips. Switch between the Poker Table Arena, License Trials, Style Tracker, Ranges Lab, and Masterclass using the pills."
                      size={12}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <Radio
                      size={10}
                      style={{ color: hudThemeObj.accentColor }}
                    />
                    <select
                      aria-label="Console HUD Skin"
                      value={activeHudTheme}
                      onChange={(e) =>
                        handleSelectHudTheme(e.target.value as ConsoleHudThemeId)
                      }
                      className="bg-transparent text-[10px] font-mono font-bold uppercase text-zinc-300 hover:text-gold focus:outline-none cursor-pointer"
                    >
                      {(
                        Object.keys(CONSOLE_HUD_THEMES) as ConsoleHudThemeId[]
                      ).map((skinId) => (
                        <option
                          key={skinId}
                          value={skinId}
                          className="bg-zinc-900 text-white"
                        >
                          HUD: {CONSOLE_HUD_THEMES[skinId].name}
                        </option>
                      ))}
                    </select>

                    <span className="text-zinc-600 text-[10px]">•</span>

                    <User size={10} className="text-gold" />
                    <select
                      aria-label="Trainee Player Profile"
                      value={activePlayerName}
                      onChange={(e) => handleSwitchPlayer(e.target.value)}
                      className="bg-transparent text-[10px] font-mono font-bold uppercase text-gold hover:text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Guest Trainee" className="bg-zinc-900 text-amber-300">
                        Trainee: Guest (Unsaved)
                      </option>
                      <optgroup label="League Roster" className="bg-zinc-900 text-zinc-300">
                        {LEAGUE_PLAYERS.map((p) => (
                          <option key={p} value={p} className="bg-zinc-900 text-white">
                            {p}
                          </option>
                        ))}
                      </optgroup>
                      {allPlayersList.filter((p) => !LEAGUE_PLAYERS.includes(p.name)).length > 0 && (
                        <optgroup label="Registered Players (Cloud)" className="bg-zinc-900 text-purple-300">
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
                        + Add / Register New Player...
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Segmented Navigation Pills */}
            <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ')
                        setActiveTab(tab.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black shadow-[0_0_12px_rgba(212,175,55,0.35)]'
                        : 'text-zinc-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.shortLabel}</span>
                    {tab.badge && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-black ${
                          isActive
                            ? 'bg-black/25 text-black'
                            : 'bg-white/10 text-gold'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                    <InfoTooltip
                      title={tab.tooltipTitle}
                      description={tab.tooltipDesc}
                      size={11}
                    />
                  </div>
                );
              })}
            </div>

            {/* Right Compact Career Telemetry Pill with Live Total Chip Amount */}
            <div className="flex items-center gap-2.5 bg-black/65 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
              {/* Total Chip Bankroll Badge (Clickable to open Leaderboard) */}
              <div
                onClick={() => setActiveTab('leaderboard')}
                title="Your live Academy Chip Bankroll. Click to view Leaderboard standings!"
                className="flex items-center gap-1.5 pr-2.5 border-r border-white/10 cursor-pointer hover:opacity-85 transition group"
              >
                <div className="w-5 h-5 rounded-full bg-gold text-black flex items-center justify-center font-black shadow group-hover:scale-110 transition shrink-0">
                  <Coins size={12} />
                </div>
                <div>
                  <div className="flex items-center gap-1 leading-none">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300">
                      Bankroll
                    </span>
                    {trackerStats.netChipsWon !== 0 && (
                      <span
                        className={`text-[8px] font-mono font-bold ${
                          trackerStats.netChipsWon > 0
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {trackerStats.netChipsWon > 0 ? '+' : ''}
                        £{trackerStats.netChipsWon.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-mono font-black text-white group-hover:text-gold transition leading-tight">
                      £{totalCareerChips.toLocaleString()}
                    </span>
                    {Number(trackerStats.bankruptcyCount || 0) > 0 && (
                      <span
                        title={`Bankrupt ${trackerStats.bankruptcyCount || 0} time${(trackerStats.bankruptcyCount || 0) > 1 ? 's' : ''}!`}
                        className="px-1.5 py-0.2 rounded bg-red-950/90 border border-red-500/70 text-red-300 font-mono font-black text-[9px] flex items-center gap-0.5 shadow"
                      >
                        <span>🤡</span>
                        <span>×{trackerStats.bankruptcyCount || 0}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="hidden lg:block pr-2.5 border-r border-white/10">
                <InfoTooltip
                  title="Tracked Play-Style Archetype"
                  description="Classifies your overall poker personality based on how many hands you play (Tight vs. Loose) and how aggressively you raise and bet (Passive vs. Aggressive)."
                >
                  <span className="text-[10px] text-zinc-400 mr-1">Style:</span>
                </InfoTooltip>
                <span className="font-black text-gold">{derived.archetype}</span>
              </div>
              <div className="hidden md:block pr-2.5 border-r border-white/10 font-mono">
                <InfoTooltip
                  title="Hands Played (VPIP) / Hands Raised (PFR)"
                  description="Plain English: How often you choose to play a hand vs. how often you raise before the flop. Pro Term: VPIP % / PFR %."
                  formula="Pro Target: ~24% Hands Played (VPIP) / ~19% Raised (PFR)"
                >
                  <span className="text-[10px] text-zinc-400 mr-1">
                    Played/Raised:
                  </span>
                </InfoTooltip>
                <span className="font-bold text-white">
                  {derived.vpipPercent}%/{derived.pfrPercent}%
                </span>
              </div>
              <div className="hidden sm:block font-mono">
                <InfoTooltip
                  title="Overall Coach Grade (%)"
                  description="Your weighted decision accuracy across all hands graded by the Virtual Coach."
                >
                  <span className="text-[10px] text-zinc-400 mr-1">Coach Grade:</span>
                </InfoTooltip>
                <span className="font-black text-emerald-400">
                  {derived.decisionAccuracyPercent}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Guest Mode Unsaved Session Banner */}
        {(activePlayerName === 'Guest Trainee' || activePlayerName.toLowerCase().startsWith('guest')) && (
          <div className="bg-gradient-to-r from-amber-950/70 via-black to-amber-950/70 border border-amber-500/50 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-in fade-in duration-300">
            <div className="flex items-center gap-3 text-xs text-amber-200">
              <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center text-sm font-black shrink-0">
                👁️
              </span>
              <div>
                <span className="font-black uppercase text-amber-300">Guest Play Mode (Unsaved Session): </span>
                <span className="text-zinc-300">
                  You are training with temporary chips. Your hands and bankroll gains are <strong>not saved</strong> to Firebase.
                </span>
              </div>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('ept_open_login'))}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black uppercase text-xs tracking-wider shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95 transition shrink-0 flex items-center gap-1.5"
            >
              <span>Save Progress / Claim Profile →</span>
            </button>
          </div>
        )}

        {/* Active Tab View */}
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
  );
}
