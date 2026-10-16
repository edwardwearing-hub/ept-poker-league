'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';

interface Props {
  dialogue?: string | null;
  status?: string;
  gameTitle?: string;
  className?: string;
  compact?: boolean;
}

export default function VegasAiDealer({
  dialogue,
  status = 'Dealing for the House',
  gameTitle,
  className = '',
  compact = false,
}: Props) {
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [displayLine, setDisplayLine] = useState<string>(
    dialogue || 'Welcome to my table, darling. Best of luck against the house!'
  );
  const lastSpokenRef = useRef<string>('');

  useEffect(() => {
    if (dialogue) {
      setDisplayLine(dialogue);
    }
  }, [dialogue]);

  // Voice synthesis effect
  useEffect(() => {
    if (!speechEnabled || !displayLine || typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    if (lastSpokenRef.current === displayLine) return;
    lastSpokenRef.current = displayLine;

    try {
      window.speechSynthesis.cancel(); // Stop prior lines
      const cleanText = displayLine.replace(/[\u{1F300}-\u{1F6FF}|[\u{2600}-\u{26FF}]/gu, '');
      const utter = new SpeechSynthesisUtterance(cleanText);
      utter.rate = 1.0;
      utter.pitch = 1.15; // slightly higher, glamorous feminine tone

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

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 bg-black/80 border border-gold/40 rounded-2xl p-2.5 shadow-xl ${className}`}
      >
        <div className="relative shrink-0">
          <img
            src="/vegas/dealer_sarah.jpg"
            alt="AI Dealer Sarah"
            className="w-12 h-12 rounded-full border-2 border-gold object-cover shadow-[0_0_12px_rgba(212,175,55,0.5)]"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black" />
        </div>
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-gold">
              Sarah • House Dealer
            </span>
            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              className="text-zinc-400 hover:text-gold transition p-0.5"
              title={speechEnabled ? 'Mute Dealer Voice' : 'Enable Dealer Voice'}
            >
              {speechEnabled ? <Volume2 size={12} className="text-gold" /> : <VolumeX size={12} />}
            </button>
          </div>
          <p className="text-xs text-zinc-200 font-sans italic truncate">
            &quot;{displayLine}&quot;
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/70 via-black to-zinc-950 border border-gold/40 p-3.5 sm:p-4 shadow-xl flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-3.5 w-full sm:w-auto">
        {/* Sarah Dealer Avatar */}
        <div className="relative shrink-0">
          <img
            src="/vegas/dealer_sarah.jpg"
            alt="AI Dealer Sarah"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-gold object-cover shadow-[0_0_15px_rgba(212,175,55,0.6)]"
          />
          <span
            className="absolute -bottom-0.5 -right-0.5 px-1.5 py-0.2 rounded-full bg-gold text-black text-[8px] font-black uppercase tracking-tighter border border-white shadow"
            title="Official Vegas House Dealer"
          >
            HOUSE
          </span>
        </div>

        {/* Speech Bubble */}
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-gold flex items-center gap-1">
              <span>Sarah</span>
              <span className="text-[10px] font-normal text-zinc-400">• Las Vegas VIP Dealer</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-zinc-400 font-mono hidden md:inline">
              ({status})
            </span>
          </div>
          <div className="relative bg-black/60 border border-white/10 px-3 py-1.5 rounded-xl text-xs sm:text-sm text-zinc-200 font-sans italic leading-relaxed">
            &quot;{displayLine}&quot;
          </div>
        </div>
      </div>

      {/* Voice Toggle Button */}
      <button
        onClick={() => setSpeechEnabled(!speechEnabled)}
        className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shrink-0 self-end sm:self-center ${
          speechEnabled
            ? 'bg-gold/20 text-gold border-gold/60 shadow-[0_0_10px_rgba(212,175,55,0.3)]'
            : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
        }`}
        title={speechEnabled ? 'Mute AI Dealer Voice' : 'Unmute AI Dealer Voice'}
      >
        {speechEnabled ? <Volume2 size={14} className="text-gold" /> : <VolumeX size={14} />}
        <span className="text-[11px] font-black uppercase tracking-wider">
          Voice: {speechEnabled ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  );
}
