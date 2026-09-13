'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, 
  Users, 
  Droplets, 
  Zap, 
  Sparkles, 
  AlertCircle, 
  X, 
  Trophy, 
  Radio, 
  Layers, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { GameState, OfflineProgressSummary } from '@/game/types';
import { DEFAULT_GAME_STATE } from '@/game/constants';
import { 
  processGameTick, 
  calculateOfflineProgress,
  attemptBribeCommissioner,
  resolveFloorEvent 
} from '@/game/engine';
import { saveGame, loadGame } from '@/game/storage';
import { playSound } from '@/game/sound';

import CasinoHUD from '@/components/syndicate/CasinoHUD';
import ActivePlayArea from '@/components/syndicate/ActivePlayArea';
import FloorManagement from '@/components/syndicate/FloorManagement';
import TournamentsTab from '@/components/syndicate/TournamentsTab';
import SportsbookTab from '@/components/syndicate/SportsbookTab';
import StaffRoster from '@/components/syndicate/StaffRoster';
import LaundromatTab from '@/components/syndicate/LaundromatTab';
import RelicsVaultTab from '@/components/syndicate/RelicsVaultTab';
import UpgradesTab from '@/components/syndicate/UpgradesTab';
import BlackMarketTab from '@/components/syndicate/BlackMarketTab';
import PrestigeModal from '@/components/syndicate/PrestigeModal';
import OfflineModal from '@/components/syndicate/OfflineModal';
import SettingsModal from '@/components/syndicate/SettingsModal';
import TerritoryMapModal from '@/components/syndicate/TerritoryMapModal';
import AchievementsModal from '@/components/syndicate/AchievementsModal';
import FloorEventSpotter from '@/components/syndicate/FloorEventSpotter';
import SyndicateLuckyWheelModal from '@/components/syndicate/SyndicateLuckyWheelModal';
import HeistMissionModal from '@/components/syndicate/HeistMissionModal';
import ShadowCabinetModal from '@/components/syndicate/ShadowCabinetModal';

export default function SyndicatePage() {
  const [state, setState] = useState<GameState>(DEFAULT_GAME_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'floor' | 'tournaments' | 'sportsbook' | 'staff' | 'laundromat' | 'relics' | 'upgrades' | 'black_market'>('floor');
  
  const [offlineSummary, setOfflineSummary] = useState<OfflineProgressSummary | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPrestigeOpen, setIsPrestigeOpen] = useState(false);
  const [isTerritoryMapOpen, setIsTerritoryMapOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [isHeistsOpen, setIsHeistsOpen] = useState(false);
  const [isCabinetOpen, setIsCabinetOpen] = useState(false);
  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkTabScroll = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setCanScrollLeft(scrollLeft > 8);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkTabScroll, 100);
    const handleResize = () => checkTabScroll();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [isLoaded]);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollOffset = direction === 'left' ? -280 : 280;
      tabsContainerRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
      setTimeout(checkTabScroll, 350);
    }
  };

  const stateRef = useRef<GameState>(state);
  stateRef.current = state;

  // 1. Initial Load & Offline Progress Calculation
  useEffect(() => {
    const loaded = loadGame();
    const { nextState, summary } = calculateOfflineProgress(loaded);

    setState(nextState);
    stateRef.current = nextState;
    setIsLoaded(true);

    if (summary && summary.secondsOffline > 15) {
      setOfflineSummary(summary);
    }
  }, []);

  // 2. High Frequency Deterministic Ticking Engine (10 Ticks/sec)
  useEffect(() => {
    if (!isLoaded) return;

    let lastTime = performance.now();

    const interval = setInterval(() => {
      const now = performance.now();
      const deltaSeconds = (now - lastTime) / 1000;
      lastTime = now;

      const clampedDelta = Math.min(1.0, Math.max(0.001, deltaSeconds));
      const { nextState, event } = processGameTick(stateRef.current, clampedDelta);

      if (event) {
        setActiveNotification(event);
        playSound.raid(nextState.settings.soundEnabled);
      }

      setState(nextState);
    }, 100);

    return () => clearInterval(interval);
  }, [isLoaded]);

  // 3. Periodic Autosave (Every 5 seconds and on window unload)
  useEffect(() => {
    if (!isLoaded) return;

    const saveInterval = setInterval(() => {
      saveGame(stateRef.current);
    }, 5000);

    const handleBeforeUnload = () => {
      saveGame(stateRef.current);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(saveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isLoaded]);

  const handleStateUpdate = (newState: GameState) => {
    setState(newState);
    stateRef.current = newState;
    saveGame(newState);
  };

  const toggleSound = () => {
    const nextSettings = {
      ...state.settings,
      soundEnabled: !state.settings.soundEnabled,
    };
    handleStateUpdate({
      ...state,
      settings: nextSettings,
    });
  };

  const handleBribeChief = () => {
    const { nextState, success, message } = attemptBribeCommissioner(state);
    if (success) {
      playSound.cash(nextState.settings.soundEnabled);
    } else {
      playSound.raid(nextState.settings.soundEnabled);
    }
    setActiveNotification(message);
    handleStateUpdate(nextState);
  };

  if (!isLoaded) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold to-amber-600 animate-spin flex items-center justify-center">
            <Sparkles size={24} className="text-black" />
          </div>
          <span className="text-xs font-mono font-bold tracking-widest text-gold uppercase animate-pulse">
            Opening The Floor...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top HUD */}
      <CasinoHUD
        state={state}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSound={toggleSound}
        onOpenPrestige={() => setIsPrestigeOpen(true)}
        onBribeChief={handleBribeChief}
        onOpenTerritories={() => setIsTerritoryMapOpen(true)}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        onOpenWheel={() => setIsWheelOpen(true)}
        onOpenHeists={() => setIsHeistsOpen(true)}
        onOpenCabinet={() => setIsCabinetOpen(true)}
      />

      {/* Main Container */}
      <div className="space-y-6">
        
        {/* Urgent Police Raid Notification Banner */}
        {activeNotification && (
          <div className="glass-panel-red border-red-500/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(230,57,70,0.5)] animate-bounce">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={20} className="text-ept-red shrink-0" />
              <p className="text-xs sm:text-sm font-black text-white">
                {activeNotification}
              </p>
            </div>
            <button
              onClick={() => setActiveNotification(null)}
              aria-label="Dismiss notification"
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Dynamic Floor Spotter Event (Snitch, VIP Whale, or Vault Heist) */}
        <FloorEventSpotter
          event={state.activeFloorEvent}
          soundEnabled={state.settings.soundEnabled}
          onResolve={(action) => {
            const { nextState, notice } = resolveFloorEvent(state, action);
            handleStateUpdate(nextState);
            if (notice) setActiveNotification(notice);
          }}
        />

        {/* Boss High-Stakes Desk (Interactive Active Play) */}
        <ActivePlayArea
          state={state}
          onStateUpdate={handleStateUpdate}
        />

        {/* Navigation Tabs with Left/Right Scroll Controls & Gold Scrollbar */}
        <div className="relative group px-1">
          {/* Scroll Left Chevron */}
          {canScrollLeft && (
            <button
              onClick={() => scrollTabs('left')}
              aria-label="Scroll tabs left"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-charcoal-dark/95 border border-gold/50 text-gold hover:text-white hover:bg-gold/20 shadow-[0_0_15px_rgba(212,175,55,0.6)] backdrop-blur-md transition-all cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          {/* Scroll Right Chevron */}
          {canScrollRight && (
            <button
              onClick={() => scrollTabs('right')}
              aria-label="Scroll tabs right"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-charcoal-dark/95 border border-gold/50 text-gold hover:text-white hover:bg-gold/20 shadow-[0_0_15px_rgba(212,175,55,0.6)] backdrop-blur-md transition-all cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95 animate-pulse"
            >
              <ChevronRight size={18} />
            </button>
          )}

          {/* Left & Right Subtle Fade Overlays */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-3 w-8 bg-gradient-to-r from-charcoal via-charcoal/80 to-transparent z-10 pointer-events-none rounded-l-2xl" />
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-3 w-10 bg-gradient-to-l from-charcoal via-charcoal/80 to-transparent z-10 pointer-events-none rounded-r-2xl" />
          )}

          {/* Tabs Horizontal Scroll Strip */}
          <div
            ref={tabsContainerRef}
            onScroll={checkTabScroll}
            onWheel={(e) => {
              if (e.deltaY !== 0 && tabsContainerRef.current) {
                tabsContainerRef.current.scrollLeft += e.deltaY;
                checkTabScroll();
              }
            }}
            className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto tabs-scrollbar scroll-smooth"
          >
            <button
              onClick={() => setActiveTab('floor')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'floor'
                  ? 'bg-gradient-to-r from-amber-600 to-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  : 'glass-panel hover:bg-white/10 text-zinc-400 hover:text-white border-white/5'
              }`}
            >
              <Gamepad2 size={16} />
              Casino Floor
            </button>

            <button
              onClick={() => setActiveTab('tournaments')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'tournaments'
                  ? 'bg-gradient-to-r from-amber-600 to-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  : 'glass-panel hover:bg-white/10 text-zinc-400 hover:text-white border-white/5'
              }`}
            >
              <Trophy size={16} />
              Tournaments
              {Object.values(state.tournaments || {}).some(t => t.status === 'running') && (
                <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('sportsbook')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'sportsbook'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                  : 'glass-panel hover:bg-white/10 text-zinc-400 hover:text-white border-white/5'
              }`}
            >
              <Radio size={16} />
              Sportsbook
            </button>

            <button
              onClick={() => setActiveTab('relics')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'relics'
                  ? 'bg-gradient-to-r from-amber-600 to-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  : 'glass-panel hover:bg-white/10 text-zinc-400 hover:text-white border-white/5'
              }`}
            >
              <Layers size={16} />
              Relics Vault
              {state.equippedRelicIds?.length > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-gold/20 text-gold-glow">
                  {state.equippedRelicIds.length}/3
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'staff'
                  ? 'bg-gradient-to-r from-amber-600 to-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  : 'glass-panel hover:bg-white/10 text-zinc-400 hover:text-white border-white/5'
              }`}
            >
              <Users size={16} />
              Syndicate Staff
            </button>

            <button
              onClick={() => setActiveTab('laundromat')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'laundromat'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                  : 'glass-panel hover:bg-white/10 text-zinc-400 hover:text-white border-white/5'
              }`}
            >
              <Droplets size={16} />
              Laundromat Fronts
            </button>

            <button
              onClick={() => setActiveTab('upgrades')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'upgrades'
                  ? 'bg-gradient-to-r from-amber-600 to-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  : 'glass-panel hover:bg-white/10 text-zinc-400 hover:text-white border-white/5'
              }`}
            >
              <Zap size={16} />
              Tech & Upgrades
            </button>

            <button
              onClick={() => setActiveTab('black_market')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'black_market'
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                  : 'glass-panel hover:bg-white/10 text-zinc-400 hover:text-white border-white/5'
              }`}
            >
              <Sparkles size={16} />
              Black Market
              {state.stats.prestigeResets >= 1 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  UNLOCKED
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        <div>
          {activeTab === 'floor' && (
            <FloorManagement
              state={state}
              onStateUpdate={handleStateUpdate}
            />
          )}

          {activeTab === 'tournaments' && (
            <TournamentsTab
              state={state}
              onStateUpdate={handleStateUpdate}
            />
          )}

          {activeTab === 'sportsbook' && (
            <SportsbookTab
              state={state}
              onStateUpdate={handleStateUpdate}
            />
          )}

          {activeTab === 'relics' && (
            <RelicsVaultTab
              state={state}
              onStateUpdate={handleStateUpdate}
            />
          )}

          {activeTab === 'staff' && (
            <StaffRoster
              state={state}
              onStateUpdate={handleStateUpdate}
            />
          )}

          {activeTab === 'laundromat' && (
            <LaundromatTab
              state={state}
              onStateUpdate={handleStateUpdate}
            />
          )}

          {activeTab === 'upgrades' && (
            <UpgradesTab
              state={state}
              onStateUpdate={handleStateUpdate}
            />
          )}

          {activeTab === 'black_market' && (
            <BlackMarketTab
              state={state}
              onStateUpdate={handleStateUpdate}
              onOpenPrestigeModal={() => setIsPrestigeOpen(true)}
            />
          )}
        </div>

      </div>

      {/* Modals */}
      <PrestigeModal
        isOpen={isPrestigeOpen}
        onClose={() => setIsPrestigeOpen(false)}
        state={state}
        onStateUpdate={handleStateUpdate}
      />

      <OfflineModal
        summary={offlineSummary}
        onClose={() => setOfflineSummary(null)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        state={state}
        onStateUpdate={handleStateUpdate}
      />

      {isTerritoryMapOpen && (
        <TerritoryMapModal
          state={state}
          onClose={() => setIsTerritoryMapOpen(false)}
          onStateUpdate={handleStateUpdate}
        />
      )}

      {isAchievementsOpen && (
        <AchievementsModal
          state={state}
          onClose={() => setIsAchievementsOpen(false)}
          onStateUpdate={handleStateUpdate}
        />
      )}

      <SyndicateLuckyWheelModal
        isOpen={isWheelOpen}
        onClose={() => setIsWheelOpen(false)}
        state={state}
        onStateUpdate={handleStateUpdate}
      />

      <HeistMissionModal
        isOpen={isHeistsOpen}
        onClose={() => setIsHeistsOpen(false)}
        state={state}
        onStateUpdate={handleStateUpdate}
        onOpenPrestigeModal={() => setIsPrestigeOpen(true)}
      />

      <ShadowCabinetModal
        isOpen={isCabinetOpen}
        onClose={() => setIsCabinetOpen(false)}
        state={state}
        onStateUpdate={handleStateUpdate}
        onOpenPrestigeModal={() => setIsPrestigeOpen(true)}
      />

    </div>
  );
}
