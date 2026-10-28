'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Brain,
  MessageSquare,
  Volume2,
  VolumeX,
  Sparkles,
  Crown,
  Info,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { useKonamiHighRoller } from '@/components/EasterEggs';

export interface RuleSummaryItem {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface VegasGuideOddsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  // AI Dealer Sarah Props
  dealerDialogue?: string | null;
  dealerStatus?: string;
  onAskSarah?: () => void;
  isAiThinking?: boolean;
  // Strategy & Odds Advisor Props
  advisorTitle?: string;
  recommendation?: string | null;
  recommendationHeadline?: string | null;
  recommendationExplanation?: string | null;
  rulesSummary?: RuleSummaryItem[];
  extraDetails?: React.ReactNode;
}

const KONAMI_VIP_WHISPERS = [
  "Ah, the Konami Code... Welcome to the 24K Gold Salon Privé, Your Highness. The £5,000 whale plaques are unlocked.",
  "Private ropes are drawn, Chairman of the E.P.T. Tonight we deal exclusively from the Black Obsidian & Gold Foil shoe.",
  "Only true legends know ↑ ↑ ↓ ↓ ← → ← → B A, darling. Champagne is on the house in the High Roller suite!",
  "The pit boss just authorized unlimited VIP privileges for you, Your Excellency. Shall we break the vault tonight?",
  "24K liquid gold felt and obsidian cards... Macau's highest rollers have nothing on you, darling.",
];

export default function VegasGuideOddsDrawer({
  isOpen,
  onClose,
  gameTitle,
  dealerDialogue,
  dealerStatus = 'Dealing for the House',
  onAskSarah,
  isAiThinking = false,
  advisorTitle = 'Zero Edge Strategy Advisor',
  recommendation,
  recommendationHeadline,
  recommendationExplanation,
  rulesSummary = [],
  extraDetails,
}: VegasGuideOddsDrawerProps) {
  const { isHighRoller } = useKonamiHighRoller();
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [whisperIdx, setWhisperIdx] = useState(0);
  const [displayLine, setDisplayLine] = useState<string>(
    dealerDialogue || 'Welcome to my table, darling. Best of luck against the house!'
  );
  const lastSpokenRef = useRef<string>('');

  useEffect(() => {
    if (dealerDialogue) {
      setDisplayLine(dealerDialogue);
    }
  }, [dealerDialogue]);

  useEffect(() => {
    if (isHighRoller) {
      setDisplayLine(KONAMI_VIP_WHISPERS[0]);
    }
  }, [isHighRoller]);

  // Voice synthesis effect
  useEffect(() => {
    if (!speechEnabled || !displayLine || typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }
    if (lastSpokenRef.current === displayLine) return;
    lastSpokenRef.current = displayLine;

    try {
      window.speechSynthesis.cancel();
      const cleanText = displayLine.replace(/[\u{1F300}-\u{1F6FF}|[\u{2600}-\u{26FF}]/gu, '');
      const utter = new SpeechSynthesisUtterance(cleanText);
      utter.rate = 1.0;
      utter.pitch = 1.15;

      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(
        (v) =>
          v.name.includes('Female') ||
          v.name.includes('Samantha') ||
          v.name.includes('Victoria') ||
          v.name.includes('Karen') ||
          v.name.includes('Google UK English Female') ||
          v.name.includes('Libby') ||
          v.name.includes('Natural')
      );
      if (femaleVoice) {
        utter.voice = femaleVoice;
      }
      window.speechSynthesis.speak(utter);
    } catch {
      // Speech synthesis unsupported or blocked
    }
  }, [displayLine, speechEnabled]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const cycleVipWhisper = () => {
    const next = (whisperIdx + 1) % KONAMI_VIP_WHISPERS.length;
    setWhisperIdx(next);
    setDisplayLine(KONAMI_VIP_WHISPERS[next]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex flex-col justify-end animate-in fade-in duration-200">
      {/* Semi-transparent backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-Over Bottom-Sheet Container */}
      <div
        className="relative z-[121] w-full max-w-xl mx-auto max-h-[85vh] bg-gradient-to-b from-[#181512] via-[#0d0d0d] to-black border-t-2 border-gold/70 rounded-t-3xl shadow-[0_-15px_50px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 select-none touch-manipulation"
        role="dialog"
        aria-modal="true"
        aria-label={`${gameTitle} Guide & Odds Advisor`}
      >
        {/* Drag handle */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0 bg-black/50">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
              <Brain size={15} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-black uppercase tracking-wider text-gold truncate block">
                {gameTitle} • Guide &amp; Odds
              </span>
              <span className="text-[9px] text-zinc-400 font-mono block truncate">
                Zero-Edge Strategy &amp; Croupier Hub
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {recommendation && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 text-[10px] font-mono font-black animate-pulse">
                REC: {recommendation}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-400 hover:text-white transition active:scale-95"
              aria-label="Close Guide Drawer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 touch-momentum">
          {/* SECTION 1: AI Glamorous Croupier Sarah */}
          <div
            className={`rounded-2xl p-3 sm:p-4 border relative overflow-hidden bg-gradient-to-r ${
              isHighRoller
                ? 'from-[#3b2903]/90 via-black to-[#291b02]/90 border-[#ffd700] shadow-[0_0_25px_rgba(255,215,0,0.25)]'
                : 'from-amber-950/60 via-black to-zinc-950 border-gold/40 shadow-lg'
            }`}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Sarah Avatar */}
              <div className="relative shrink-0 mt-0.5">
                <img
                  src="/vegas/dealer_sarah.jpg"
                  alt="Sarah Head Croupier"
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 object-cover ${
                    isHighRoller
                      ? 'border-[#ffd700] shadow-[0_0_18px_rgba(255,215,0,0.8)]'
                      : 'border-gold shadow-[0_0_12px_rgba(212,175,55,0.5)]'
                  }`}
                />
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[8px] font-black uppercase tracking-wider border border-white/60 shadow flex items-center gap-1 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>{isHighRoller ? 'VIP' : 'LIVE'}</span>
                </span>
              </div>

              {/* Sarah Dialogue Bubble */}
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black uppercase tracking-widest text-gold flex items-center gap-1">
                      <span>Sarah</span>
                      <span className="text-[10px] font-normal text-amber-200/80">
                        {isHighRoller ? '• 👑 VIP Croupier' : '• Head Croupier'}
                      </span>
                    </span>
                    {isAiThinking && (
                      <span className="text-[9px] font-mono text-cyan-400 animate-pulse flex items-center gap-1">
                        <Sparkles size={10} />
                        <span>Thinking...</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[9px] text-zinc-400 font-mono">
                    ({dealerStatus})
                  </span>
                </div>

                <div
                  className={`relative bg-black/75 border px-3 py-1.5 rounded-xl text-xs sm:text-sm font-sans italic leading-relaxed shadow-inner ${
                    isHighRoller ? 'border-[#ffd700]/50 text-yellow-100' : 'border-gold/30 text-zinc-200'
                  }`}
                >
                  &quot;{displayLine}&quot;
                </div>

                {/* Voice & VIP Controls */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSpeechEnabled(!speechEnabled)}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition flex items-center gap-1.5 ${
                      speechEnabled
                        ? 'bg-gold/20 text-gold border-gold/60 shadow-[0_0_8px_rgba(212,175,55,0.3)]'
                        : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {speechEnabled ? <Volume2 size={12} className="text-gold" /> : <VolumeX size={12} />}
                    <span>Voice: {speechEnabled ? 'ON' : 'OFF'}</span>
                  </button>

                  {onAskSarah && (
                    <button
                      type="button"
                      disabled={isAiThinking}
                      onClick={onAskSarah}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-gold/20 text-zinc-300 hover:text-gold border border-white/10 text-[10px] font-bold transition flex items-center gap-1"
                    >
                      <MessageSquare size={11} className="text-gold" />
                      <span>Ask Sarah</span>
                    </button>
                  )}

                  {isHighRoller && (
                    <button
                      type="button"
                      onClick={cycleVipWhisper}
                      className="px-2.5 py-1 rounded-lg bg-[#ffd700]/20 hover:bg-[#ffd700]/30 border border-[#ffd700] text-[#ffd700] text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1"
                    >
                      <Crown size={11} />
                      <span>VIP Whisper</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Real-Time Strategy Coach & Odds Advisor */}
          <div className="rounded-2xl p-3.5 sm:p-4 bg-gradient-to-r from-emerald-950/70 via-black to-zinc-950 border border-emerald-500/40 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-300">
                <Brain size={14} className="text-emerald-400" />
                <span>{advisorTitle}</span>
              </div>
              <span className="text-[9px] font-mono text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                Mathematically Optimal
              </span>
            </div>

            {recommendation ? (
              <div className="bg-black/60 border border-emerald-500/30 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-zinc-400">
                    Live GTO Recommendation:
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/25 border border-emerald-400 text-emerald-200 font-mono font-black text-xs sm:text-sm tracking-wider shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                    {recommendation}
                  </span>
                </div>
                {recommendationHeadline && (
                  <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 pt-0.5">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span>{recommendationHeadline}</span>
                  </div>
                )}
                {recommendationExplanation && (
                  <p className="text-[11px] sm:text-xs text-zinc-300 leading-relaxed font-sans pl-4">
                    {recommendationExplanation}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-center text-xs text-zinc-400">
                Place your wager or deal the hand to receive real-time street advice.
              </div>
            )}
          </div>

          {/* SECTION 3: Key Rules & House Edge Matrix */}
          {rulesSummary.length > 0 && (
            <div className="rounded-2xl p-3 sm:p-4 bg-zinc-950/80 border border-white/10 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-gold">
                <Info size={13} />
                <span>Rules &amp; House Edge Summary</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                {rulesSummary.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl border flex flex-col justify-between ${
                      item.highlight
                        ? 'bg-gold/10 border-gold/40 text-yellow-100'
                        : 'bg-black/40 border-white/5 text-zinc-300'
                    }`}
                  >
                    <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-400">
                      {item.label}
                    </span>
                    <span className="font-bold text-white mt-0.5">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: Extra Game-Specific Details (if any) */}
          {extraDetails && (
            <div className="rounded-2xl p-3 sm:p-4 bg-zinc-950/80 border border-white/10 space-y-2">
              {extraDetails}
            </div>
          )}
        </div>

        {/* Footer Dismiss Button */}
        <div className="p-3 border-t border-white/10 bg-black/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-gold/20 via-amber-500/25 to-gold/20 border border-gold/60 text-gold hover:text-white font-black text-xs uppercase tracking-widest transition shadow active:scale-98"
          >
            Dismiss &amp; Maximize Table Felt
          </button>
        </div>
      </div>
    </div>
  );
}
