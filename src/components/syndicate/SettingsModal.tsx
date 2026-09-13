'use client';

import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Volume2, 
  VolumeX, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  Copy, 
  AlertTriangle 
} from 'lucide-react';
import { GameState } from '@/game/types';
import { exportSaveString, importSaveString, resetGame } from '@/game/storage';
import { formatMoney, formatTime } from '@/game/engine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  onStateUpdate: (newState: GameState) => void;
}

export default function SettingsModal({ isOpen, onClose, state, onStateUpdate }: Props) {
  const [copied, setCopied] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [importError, setImportError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleCopySave = () => {
    const code = exportSaveString(state);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportSave = () => {
    if (!importInput.trim()) return;
    const imported = importSaveString(importInput);
    if (imported) {
      onStateUpdate(imported);
      setImportInput('');
      setImportError('');
      onClose();
    } else {
      setImportError('Invalid save string. Please check the code and try again.');
    }
  };

  const handleHardReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    const fresh = resetGame();
    onStateUpdate(fresh);
    setConfirmReset(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto glass-panel rounded-3xl border border-white/20 p-4 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer touch-manipulation"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="p-2 rounded-xl bg-gold/20 text-gold">
            <Settings size={22} />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider text-white">
              Syndicate Settings
            </h2>
            <p className="text-xs text-zinc-400">
              Manage audio, performance, and game save data.
            </p>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2 mb-6">
          <div className="glass-panel p-3 rounded-xl border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Casino Sound Effects</span>
              <span className="text-[10px] text-zinc-400">Synthesized audio cues for chips and cards</span>
            </div>
            <button
              onClick={() => onStateUpdate({
                ...state,
                settings: { ...state.settings, soundEnabled: !state.settings.soundEnabled }
              })}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                state.settings.soundEnabled
                  ? 'bg-gold/20 border-gold/40 text-gold-glow'
                  : 'bg-white/5 border-white/10 text-zinc-500'
              }`}
            >
              {state.settings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>

          <div className="glass-panel p-3 rounded-xl border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Scientific Notation</span>
              <span className="text-[10px] text-zinc-400">Display numbers as 1.25e+7 instead of 12.5M</span>
            </div>
            <button
              onClick={() => onStateUpdate({
                ...state,
                settings: { ...state.settings, scientificNotation: !state.settings.scientificNotation }
              })}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                state.settings.scientificNotation
                  ? 'bg-gold/20 border-gold/40 text-gold-glow'
                  : 'bg-white/5 border-white/10 text-zinc-500'
              }`}
            >
              {state.settings.scientificNotation ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Save & Load Section */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
            Cloud / Device Save Management
          </h3>

          <div className="flex gap-2">
            <button
              onClick={handleCopySave}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? 'Copied to Clipboard!' : 'Export Save String'}
            </button>
          </div>

          <div>
            <textarea
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
              placeholder="Paste exported save string here..."
              rows={2}
              className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-gold/50 resize-none"
            />
            {importError && (
              <p className="text-[11px] text-ept-red mt-1">{importError}</p>
            )}
            <button
              onClick={handleImportSave}
              disabled={!importInput.trim()}
              className="w-full mt-1.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Import Save
            </button>
          </div>
        </div>

        {/* Syndicate Career Statistics */}
        <div className="glass-panel p-3.5 rounded-2xl border-white/5 mb-6 text-xs font-mono space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block font-sans mb-1">
            Career Records
          </span>
          <div className="flex justify-between text-zinc-300">
            <span>Time In Play:</span>
            <span className="text-white">{formatTime(state.stats.timePlayedSeconds)}</span>
          </div>
          <div className="flex justify-between text-zinc-300">
            <span>Lifetime Cash:</span>
            <span className="text-emerald-400">{formatMoney(state.stats.totalCashEarned)}</span>
          </div>
          <div className="flex justify-between text-zinc-300">
            <span>Hands Dealt:</span>
            <span className="text-amber-300">{state.stats.handsWon}</span>
          </div>
          <div className="flex justify-between text-zinc-300">
            <span>Prestige Resets:</span>
            <span className="text-gold">{state.stats.prestigeResets}</span>
          </div>
        </div>

        {/* Danger Zone: Hard Reset */}
        <div className="pt-4 border-t border-red-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-xs font-bold text-red-400 block">Wipe Save Data</span>
            <span className="text-[10px] text-zinc-500">Irreversibly restart from scratch</span>
          </div>

          <button
            onClick={handleHardReset}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              confirmReset
                ? 'bg-ept-red text-white shadow-[0_0_15px_rgba(230,57,70,0.6)] animate-pulse'
                : 'bg-red-950/40 hover:bg-red-950/80 text-red-400 border border-red-500/30'
            }`}
          >
            {confirmReset ? 'CONFIRM WIPE?' : 'Hard Reset'}
          </button>
        </div>

      </div>
    </div>
  );
}
