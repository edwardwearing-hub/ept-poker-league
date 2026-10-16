'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Coins,
  Crown,
  Dices,
  Sparkles,
  HelpCircle,
  Play,
  RotateCcw,
  ShieldAlert,
  ArrowLeft,
  Flame,
  Trophy,
  Zap,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  getActivePlayerName,
  loadTrackerStatsForPlayer,
  saveTrackerStatsForPlayer,
} from '@/lib/poker-trainer/tracker';
import { isSoundEnabled, setSoundEnabled } from '@/lib/vegas/VegasAudio';
import { computeTotalAcademyChips } from '@/lib/poker-trainer/leaderboard';
import { CareerTrackerStats } from '@/lib/poker-trainer/types';
import { VEGAS_GAMES_CATALOG, VegasGameTutorial } from './vegas-rules-db';
import VegasTutorialModal from './VegasTutorialModal';

// Games
import BlackjackGame from './games/BlackjackGame';
import SlotsGame from './games/SlotsGame';
import PubFruityGame from './games/PubFruityGame';
import CrapsGame from './games/CrapsGame';
import RouletteGame from './games/RouletteGame';
import BaccaratGame from './games/BaccaratGame';
import LivePokerPromo from './games/LivePokerPromo';
import VideoPokerGame from './games/VideoPokerGame';
import SportsbookGame from './games/SportsbookGame';
import UltimateHoldemGame from './games/UltimateHoldemGame';
import PaiGowGame from './games/PaiGowGame';
import VegasAiDealer from './VegasAiDealer';
import VegasGameCompanion from './VegasGameCompanion';

type CategoryFilter = 'all' | 'table' | 'machine' | 'poker' | 'sports';

export default function VegasLobby() {
  const [activePlayerName, setActivePlayerName] = useState('Guest Trainee');
  const [trackerStats, setTrackerStats] = useState<CareerTrackerStats>(() =>
    loadTrackerStatsForPlayer('Guest Trainee')
  );
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [tutorialGame, setTutorialGame] = useState<VegasGameTutorial | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [showBailoutModal, setShowBailoutModal] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [theaterMode, setTheaterMode] = useState(true);

  // Sync player and bankroll on mount
  useEffect(() => {
    setSoundOn(isSoundEnabled());
    const current = getActivePlayerName() || 'Guest Trainee';
    setActivePlayerName(current);
    const stats = loadTrackerStatsForPlayer(current);
    setTrackerStats(stats);

    // Sync from server if registered
    if (current && current !== 'Guest Trainee') {
      fetch(`/api/player/academy-profile?name=${encodeURIComponent(current)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.stats) {
            setTrackerStats(data.stats);
            saveTrackerStatsForPlayer(data.stats, current);
          }
        })
        .catch(() => {});
    }

    const handleStorage = () => {
      const updated = getActivePlayerName() || 'Guest Trainee';
      setActivePlayerName(updated);
      setTrackerStats(loadTrackerStatsForPlayer(updated));
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const totalChips = useMemo(() => {
    return computeTotalAcademyChips(trackerStats);
  }, [trackerStats]);

  const isGuest =
    !activePlayerName ||
    activePlayerName.toLowerCase().trim() === 'guest trainee' ||
    activePlayerName.toLowerCase().startsWith('guest');

  // Handle Bankroll Update across all Vegas games with automatic bailout rule
  const handleUpdateBankroll = (delta: number) => {
    setTrackerStats((prev) => {
      const next: CareerTrackerStats = {
        ...prev,
        netChipsWon: (prev.netChipsWon || 0) + delta,
      };

      const computedAfter = computeTotalAcademyChips(next);

      // Check bankruptcy condition: total chips drop to 0 or less
      if (computedAfter <= 0) {
        const newCount = (prev.bankruptcyCount || 0) + 1;
        const newBailout = (prev.bailoutChipsReceived || 0) + 1000;
        next.bankruptcyCount = newCount;
        next.bailoutChipsReceived = newBailout;
        setShowBailoutModal(true);
      }

      saveTrackerStatsForPlayer(next, activePlayerName);

      // Async sync to server for registered players
      if (activePlayerName && !isGuest) {
        fetch('/api/player/academy-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: activePlayerName, stats: next }),
        }).catch(() => {});
      }

      return next;
    });
  };

  const filteredCatalog = useMemo(() => {
    if (categoryFilter === 'all') return VEGAS_GAMES_CATALOG;
    return VEGAS_GAMES_CATALOG.filter((g) => g.category === categoryFilter);
  }, [categoryFilter]);

  const currentGame = VEGAS_GAMES_CATALOG.find((g) => g.id === selectedGameId);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Las Vegas Neon Marquee Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950/70 via-black to-purple-950/80 border-2 border-gold/50 p-6 sm:p-8 shadow-[0_0_40px_rgba(212,175,55,0.25)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-xs font-black uppercase tracking-widest">
            <Sparkles size={14} />
            <span>Fabulous Las Vegas Casino Floor</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            VEGAS GAMES! 🎰
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Play authentic Las Vegas casino classics, master the rules through interactive tutorials, and wager your Academy chip bankroll. The standard £1,000 League Bankruptcy Bailout applies if you get felted on the Strip!
          </p>
        </div>

        {/* Player Bankroll Status HUD */}
        <div className="bg-black/80 border-2 border-gold/40 rounded-2xl p-4 flex flex-col items-center sm:items-start gap-2 shrink-0 min-w-[260px] shadow-2xl">
          <div className="text-[10px] text-zinc-400 uppercase font-bold flex items-center justify-between w-full">
            <span>Player Bankroll:</span>
            <span className={`font-mono font-black ${isGuest ? 'text-amber-400' : 'text-gold'}`}>
              {isGuest ? 'Guest (Temporary)' : activePlayerName}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ffd700] to-[#cfb53b] text-black flex items-center justify-center font-black shadow-[0_0_15px_#ffd700] shrink-0">
              <Coins size={20} />
            </div>
            <div>
              <div className="text-xs text-zinc-400 font-bold uppercase">Academy Balance</div>
              <div className="text-xl sm:text-2xl font-mono font-black text-gold">
                £{totalChips.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Bankruptcy Badge if any */}
          {(trackerStats.bankruptcyCount || 0) > 0 && (
            <div className="w-full text-[10px] font-black text-red-300 bg-red-950/80 border border-red-500/60 px-2 py-1 rounded-lg flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>🤡</span> Bankrupt Status:
              </span>
              <span className="text-red-200">
                Felted ×{trackerStats.bankruptcyCount || 0} (+£{(trackerStats.bailoutChipsReceived || (trackerStats.bankruptcyCount || 0) * 1000).toLocaleString()})
              </span>
            </div>
          )}

          {/* Sound FX Toggle & Quick link back to Academy */}
          <div className="flex items-center justify-between w-full gap-2 mt-1">
            <button
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                setSoundEnabled(next);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-zinc-300 hover:text-gold transition border border-white/10 hover:border-gold/30 bg-white/5"
              title="Toggle Casino Sound FX"
            >
              {soundOn ? <Volume2 size={12} className="text-gold" /> : <VolumeX size={12} className="text-zinc-500" />}
              <span>Sound: {soundOn ? 'ON' : 'MUTED'}</span>
            </button>

            <Link
              href="/academy"
              className="text-center py-1 px-2 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-gold transition border border-white/5 hover:border-gold/30"
            >
              ← Leaderboard
            </Link>
          </div>
        </div>
      </div>

      {/* Guest Mode Alert Banner */}
      {isGuest && (
        <div className="bg-gradient-to-r from-amber-950/70 via-black to-amber-950/70 border border-amber-500/50 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3 text-xs text-amber-200">
            <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center text-sm font-black shrink-0">
              👁️
            </span>
            <div>
              <span className="font-black uppercase text-amber-300">Guest Play Mode: </span>
              <span className="text-zinc-300">
                You are playing with a temporary £10,000 roll. To save your bankroll and appear on the Challenger Leaderboard, claim a player handle!
              </span>
            </div>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('ept_open_login'))}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black uppercase text-xs tracking-wider shadow hover:brightness-110 active:scale-95 transition shrink-0"
          >
            Claim Handle / Sign In →
          </button>
        </div>
      )}

      {/* ACTIVE GAME STAGE OR CASINO FLOOR LOBBY */}
      {selectedGameId ? (
        <div className="space-y-4">
          {/* Navigation & Layout Controls */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <button
              onClick={() => setSelectedGameId(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black/60 hover:bg-black/90 border border-white/10 hover:border-gold/50 text-xs font-black uppercase tracking-wider text-zinc-300 hover:text-gold transition shadow"
            >
              <ArrowLeft size={14} />
              <span>← Back to Casino Floor</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheaterMode(!theaterMode)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/90 text-zinc-300 hover:text-gold border border-white/10 hover:border-gold/30 text-xs font-bold transition shadow"
                title={theaterMode ? 'Switch to side-by-side view' : 'Expand table to full screen width'}
              >
                {theaterMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                <span>{theaterMode ? 'Side Ticker View' : 'Full Table View'}</span>
              </button>

              <button
                onClick={() => setTutorialGame(currentGame || null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold/15 text-gold border border-gold/40 text-xs font-bold hover:bg-gold/25 transition shadow"
              >
                <HelpCircle size={14} />
                <span>How to Play</span>
              </button>
            </div>
          </div>

          {/* TABLE ARENA: Supports both Theater Mode (Full Screen Table) and Split Mode */}
          <div className={`grid grid-cols-1 ${theaterMode ? 'gap-6' : 'xl:grid-cols-12 gap-6 items-start'}`}>
            <div className={`${theaterMode ? 'w-full' : 'xl:col-span-8'} space-y-4`}>
              {/* Active Game Component */}
              {selectedGameId === 'blackjack' && (
                <BlackjackGame
                  bankroll={totalChips}
                  onUpdateBankroll={handleUpdateBankroll}
                  onOpenTutorial={() => setTutorialGame(currentGame || null)}
                />
              )}

              {selectedGameId === 'slots' && (
                <SlotsGame
                  bankroll={totalChips}
                  onUpdateBankroll={handleUpdateBankroll}
                  onOpenTutorial={() => setTutorialGame(currentGame || null)}
                  onSwitchToPubFruity={() => setSelectedGameId('pub-fruity')}
                />
              )}

              {selectedGameId === 'pub-fruity' && (
                <PubFruityGame
                  bankroll={totalChips}
                  onUpdateBankroll={handleUpdateBankroll}
                  onOpenTutorial={() => setTutorialGame(currentGame || null)}
                  onSwitchToVegas={() => setSelectedGameId('slots')}
                />
              )}

              {selectedGameId === 'craps' && (
                <CrapsGame
                  bankroll={totalChips}
                  onUpdateBankroll={handleUpdateBankroll}
                  onOpenTutorial={() => setTutorialGame(currentGame || null)}
                />
              )}

              {selectedGameId === 'roulette' && (
                <RouletteGame
                  bankroll={totalChips}
                  onUpdateBankroll={handleUpdateBankroll}
                  onOpenTutorial={() => setTutorialGame(currentGame || null)}
                />
              )}

              {selectedGameId === 'baccarat' && (
                <BaccaratGame
                  bankroll={totalChips}
                  onUpdateBankroll={handleUpdateBankroll}
                  onOpenTutorial={() => setTutorialGame(currentGame || null)}
                />
              )}

              {selectedGameId === 'live-poker' && (
                <LivePokerPromo onOpenTutorial={() => setTutorialGame(currentGame || null)} />
              )}

              {selectedGameId === 'video-poker' && (
                <VideoPokerGame
                  bankroll={totalChips}
                  onUpdateBankroll={handleUpdateBankroll}
                  onOpenTutorial={() => setTutorialGame(currentGame || null)}
                />
              )}

              {selectedGameId === 'sportsbook' && (
                <SportsbookGame
                  bankroll={totalChips}
                  onUpdateBankroll={handleUpdateBankroll}
                  onOpenTutorial={() => setTutorialGame(currentGame || null)}
                />
              )}

              {selectedGameId === 'ultimate-holdem' && (
                <UltimateHoldemGame
                  bankroll={totalChips}
                  onUpdateBankroll={handleUpdateBankroll}
                  onOpenTutorial={() => setTutorialGame(currentGame || null)}
                />
              )}

              {selectedGameId === 'pai-gow' && (
                <PaiGowGame
                  bankroll={totalChips}
                  onUpdateBankroll={handleUpdateBankroll}
                  onOpenTutorial={() => setTutorialGame(currentGame || null)}
                />
              )}
            </div>

            {/* Rules, How to Play & Live Ticker Companion Box */}
            <div className={`${theaterMode ? 'w-full' : 'xl:col-span-4'} space-y-4 ${theaterMode ? '' : 'xl:sticky xl:top-24'}`}>
              {currentGame && <VegasGameCompanion game={currentGame} />}
            </div>
          </div>
        </div>
      ) : (
        /* CASINO FLOOR LOBBY: Category Pills & 10 Game Cards */
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All 10 Games' },
              { id: 'table', label: 'Table Classics' },
              { id: 'machine', label: 'Slots & Video Machines' },
              { id: 'poker', label: 'Poker & Carnival' },
              { id: 'sports', label: 'Sportsbook' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id as CategoryFilter)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap ${
                  categoryFilter === cat.id
                    ? 'bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                    : 'bg-black/60 text-zinc-400 hover:text-white border border-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* AI Hostess / Dealer Welcome */}
          <VegasAiDealer
            compact
            dialogue="Welcome to the VIP room, darling. I'm Sarah, your croupier tonight. Pick any table on the floor to play, or review the house rules before placing your wagers!"
            gameTitle="VIP Casino Floor"
            status="Hostess & Head Dealer"
          />

          {/* 10 Realistic AI Casino Tables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCatalog.map((game) => (
              <div
                key={game.id}
                onClick={() => setSelectedGameId(game.id)}
                className="rounded-3xl overflow-hidden border border-gold/30 hover:border-gold/80 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.8)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.25)] bg-gradient-to-b from-zinc-900/90 via-black to-zinc-950 cursor-pointer"
              >
                {/* Photorealistic AI Casino Table Preview */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-black select-none">
                  <img
                    src={game.image}
                    alt={`${game.title} Casino Table`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90 group-hover:brightness-105"
                    loading="lazy"
                  />
                  {/* Atmospheric cinematic gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/60 pointer-events-none" />

                  {/* Top Badges Floating Over Felt */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                    <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-gold border border-gold/40 flex items-center gap-1 font-mono font-black text-xs shadow-lg">
                      <Crown size={12} className="text-gold" />
                      <span>#{game.number}</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-300 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-emerald-500/40 shadow-lg">
                      Edge: {game.houseEdge}
                    </span>
                  </div>

                  {/* Central Take A Seat Play Pill on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="px-4 py-2 rounded-full bg-black/85 backdrop-blur-md border-2 border-gold text-gold font-black uppercase text-xs tracking-widest shadow-[0_0_25px_rgba(212,175,55,0.8)] flex items-center gap-2 transform group-hover:scale-105 transition-transform">
                      <Play size={13} fill="currentColor" />
                      <span>Take A Seat</span>
                    </div>
                  </div>

                  {/* Bottom Chip Range Floating on Felt */}
                  <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between text-[11px] font-mono font-bold text-zinc-300 pointer-events-none">
                    <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-gold">
                      Min £{game.minBet}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-white">
                      Max £{game.maxBet.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Table Details & Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xl font-black text-white group-hover:text-gold transition flex items-center gap-2">
                        <span>{game.title}</span>
                      </h3>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-400 shrink-0">
                        {game.category === 'table'
                          ? 'Table Classic'
                          : game.category === 'machine'
                          ? 'Machine'
                          : game.category === 'poker'
                          ? 'Cardroom'
                          : 'Sportsbook'}
                      </span>
                    </div>

                    <div className="text-xs text-gold/80 font-bold">
                      {game.tagline}
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {game.appeal}
                    </p>
                  </div>

                  {/* Actions: Tutorial & Direct Play */}
                  <div className="pt-3 border-t border-white/10 flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTutorialGame(game);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-gold/30 text-xs font-bold text-zinc-300 hover:text-white transition flex items-center justify-center gap-1.5"
                    >
                      <HelpCircle size={14} className="text-gold" />
                      <span>Tutorial</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGameId(game.id);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black uppercase text-xs tracking-wider shadow hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-1.5"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Play Table</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official Vegas Rules & Tutorial Modal */}
      {tutorialGame && (
        <VegasTutorialModal
          game={tutorialGame}
          onClose={() => setTutorialGame(null)}
          onPlayGame={() => {
            setSelectedGameId(tutorialGame.id);
            setTutorialGame(null);
          }}
        />
      )}

      {/* League & Vegas Bankruptcy Bailout Alert Modal */}
      {showBailoutModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-b from-red-950 via-black to-zinc-950 border-2 border-red-500 rounded-3xl p-6 sm:p-8 text-center max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.6)] space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-950 border-2 border-red-500/80 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-bounce">
              🤡
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-red-400">
                The League Bankruptcy Rule
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight mt-1">
                FELTED IN LAS VEGAS!
              </h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              You lost all your chips and went broke on the Strip! The E.P.T. League Treasury has stepped in to bail you out with an emergency <span className="text-gold font-bold">£1,000 chip loan</span> so you can keep playing.
            </p>
            <div className="p-3 rounded-xl bg-red-900/40 border border-red-500/40 text-[11px] font-mono text-red-200">
              ⚠️ You have received a public Bankrupt strike on the official League Leaderboard.
            </div>
            <button
              onClick={() => setShowBailoutModal(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ffd700] to-[#cfb53b] text-black font-black uppercase text-xs tracking-wider shadow hover:brightness-110 active:scale-95 transition"
            >
              Accept £1,000 Bailout & Continue →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
