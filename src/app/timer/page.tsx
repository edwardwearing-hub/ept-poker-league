'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Moon, Sun, Edit2, Check, Plus, Trash2, Printer, Maximize, Minimize } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';

const DEFAULT_LEVELS = [
    { level: 1, small: 5, big: 10, duration: 15 }, // duration in minutes
    { level: 2, small: 10, big: 20, duration: 15 },
    { level: 3, small: 25, big: 50, duration: 20 },
    { level: 4, small: 50, big: 100, duration: 20 },
    { level: 5, small: 100, big: 200, duration: 20 },
    { level: 6, small: 250, big: 500, duration: 15 },
    { level: 7, small: 500, big: 1000, duration: 15 },
];

const DEFAULT_CHIPS = [
    { value: 5, color: '#ffffff' },
    { value: 10, color: '#dc2626' },
    { value: 25, color: '#2563eb' },
    { value: 100, color: '#16a34a' },
    { value: 500, color: '#000000' },
    { value: 1000, color: '#eab308' },
];

export default function BlindsTimer() {
    const [levels, setLevels] = useState(DEFAULT_LEVELS);
    const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(levels[0].duration * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [wakeLockEnabled, setWakeLockEnabled] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [chips, setChips] = useState(DEFAULT_CHIPS);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const wakeLockRef = useRef<{ release: () => Promise<void>; addEventListener?: (name: string, cb: () => void) => void } | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const targetEndTimeRef = useRef<number | null>(null);

    // Sync fullscreen state
    useEffect(() => {
        const onFsChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const toggleFullscreen = () => {
        if (typeof document === 'undefined') return;
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    };

    // Host Game Night keyboard shortcuts: Space (toggle), Arrows (levels), M (mute), F (fullscreen)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeTag = (document.activeElement?.tagName || '').toLowerCase();
            if (activeTag === 'input' || activeTag === 'textarea' || isEditing) {
                return;
            }

            if (e.code === 'Space') {
                e.preventDefault();
                toggleTimer();
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                nextLevel();
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                prevLevel();
            } else if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                setSoundEnabled(prev => !prev);
            } else if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                toggleFullscreen();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEditing, isRunning, timeLeft, currentLevelIdx, levels]);

    // High-fidelity Web Audio Casino Chime synthesizer (zero network latency, 100% offline reliability)
    const playCasinoChime = () => {
        try {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (!AudioContextClass) return;
            const ctx = new AudioContextClass();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            const now = ctx.currentTime;

            // Two harmonizing bell tones: fundamental 880Hz (A5) and octave harmonic 1760Hz
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, now);
            gain1.gain.setValueAtTime(0.35, now);
            gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 1.2);

            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1760, now + 0.05);
            gain2.gain.setValueAtTime(0.2, now + 0.05);
            gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.05);
            osc2.stop(now + 1.5);
        } catch {
            if (audioRef.current) {
                audioRef.current.play().catch(e => console.log('Audio error:', e));
            }
        }
    };

    const updateChip = (index: number, field: string, value: string | number) => {
        const newChips = [...chips];
        newChips[index] = { ...newChips[index], [field]: value };
        setChips(newChips);
    };

    const addChip = () => {
        setChips([...chips, { value: 0, color: '#888888' }]);
    };

    const removeChip = (index: number) => {
        setChips(chips.filter((_, i) => i !== index));
    };

    const updateLevel = (index: number, field: string, value: number) => {
        const newLevels = [...levels];
        newLevels[index] = { ...newLevels[index], [field]: value };
        setLevels(newLevels);
        // Instantly update time left if editing the current level
        if (currentLevelIdx === index && field === 'duration') {
            const currentSecondsSpent = (levels[index].duration * 60) - timeLeft;
            const newTotalTime = value * 60;
            const newTimeLeft = Math.max(0, newTotalTime - currentSecondsSpent);
            setTimeLeft(newTimeLeft);
            if (isRunning) {
                targetEndTimeRef.current = Date.now() + newTimeLeft * 1000;
            }
        }
    };

    const addLevel = () => {
        const last = levels[levels.length - 1];
        setLevels([...levels, { level: levels.length + 1, small: last.small * 2, big: last.big * 2, duration: last.duration }]);
    };

    const removeLevel = (index: number) => {
        if (levels.length > 1) {
            const newLevels = levels.filter((_, i) => i !== index);
            const reindexed = newLevels.map((l, i) => ({ ...l, level: i + 1 }));
            setLevels(reindexed);
            if (currentLevelIdx >= reindexed.length) {
                const newIdx = reindexed.length - 1;
                setCurrentLevelIdx(newIdx);
                const newDuration = reindexed[newIdx].duration * 60;
                setTimeLeft(newDuration);
                if (isRunning) {
                    targetEndTimeRef.current = Date.now() + newDuration * 1000;
                }
            }
        }
    };

    useEffect(() => {
        // Fallback audio element for environments where Web Audio is unavailable
        try {
            audioRef.current = new Audio('https://www.soundjay.com/buttons/sounds/button-10.mp3');
        } catch {
            // ignore
        }
    }, []);

    // Drift-free epoch timer interval
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isRunning) {
            if (!targetEndTimeRef.current) {
                targetEndTimeRef.current = Date.now() + timeLeft * 1000;
            }

            interval = setInterval(() => {
                if (!targetEndTimeRef.current) return;
                const remainingMs = targetEndTimeRef.current - Date.now();
                const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

                if (remainingSec <= 0) {
                    // Level Up!
                    if (soundEnabled) {
                        playCasinoChime();
                    }

                    if (currentLevelIdx < levels.length - 1) {
                        const nextIdx = currentLevelIdx + 1;
                        const nextDurationSec = levels[nextIdx].duration * 60;
                        setCurrentLevelIdx(nextIdx);
                        targetEndTimeRef.current = Date.now() + nextDurationSec * 1000;
                        setTimeLeft(nextDurationSec);
                    } else {
                        setIsRunning(false);
                        targetEndTimeRef.current = null;
                        setTimeLeft(0);
                    }
                } else {
                    setTimeLeft(remainingSec);
                }
            }, 250);
        } else {
            targetEndTimeRef.current = null;
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, currentLevelIdx, levels, soundEnabled]);

    const requestWakeLock = async () => {
        if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
            try {
                const nav = navigator as unknown as { wakeLock: { request: (type: string) => Promise<any> } };
                if (!wakeLockRef.current) {
                    const lock = await nav.wakeLock.request('screen');
                    wakeLockRef.current = lock;
                    setWakeLockEnabled(true);
                    lock.addEventListener?.('release', () => {
                        wakeLockRef.current = null;
                    });
                }
            } catch (err) {
                console.warn('Wake Lock request failed:', err);
            }
        }
    };

    const releaseWakeLock = async () => {
        if (wakeLockRef.current) {
            try {
                await wakeLockRef.current.release();
            } catch {
                // ignore
            }
            wakeLockRef.current = null;
            setWakeLockEnabled(false);
        }
    };

    // Auto-reacquire wake lock on visibilitychange and immediately re-sync epoch time on tab wake
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                if (isRunning && targetEndTimeRef.current) {
                    const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
                    setTimeLeft(remaining);
                }
                if (wakeLockEnabled || isRunning) {
                    await requestWakeLock();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            releaseWakeLock();
        };
    }, [isRunning, wakeLockEnabled]);

    const toggleTimer = async () => {
        if (!isRunning) {
            targetEndTimeRef.current = Date.now() + timeLeft * 1000;
            setIsRunning(true);
            await requestWakeLock();
        } else {
            if (targetEndTimeRef.current) {
                const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
                setTimeLeft(remaining);
            }
            targetEndTimeRef.current = null;
            setIsRunning(false);
        }
    };

    const resetTimer = () => {
        setIsRunning(false);
        targetEndTimeRef.current = null;
        setTimeLeft(levels[currentLevelIdx].duration * 60);
    };

    const nextLevel = () => {
        if (currentLevelIdx < levels.length - 1) {
            const idx = currentLevelIdx + 1;
            const nextDurationSec = levels[idx].duration * 60;
            setCurrentLevelIdx(idx);
            setTimeLeft(nextDurationSec);
            if (isRunning) {
                targetEndTimeRef.current = Date.now() + nextDurationSec * 1000;
            } else {
                targetEndTimeRef.current = null;
            }
        }
    };

    const prevLevel = () => {
        if (currentLevelIdx > 0) {
            const idx = currentLevelIdx - 1;
            const prevDurationSec = levels[idx].duration * 60;
            setCurrentLevelIdx(idx);
            setTimeLeft(prevDurationSec);
            if (isRunning) {
                targetEndTimeRef.current = Date.now() + prevDurationSec * 1000;
            } else {
                targetEndTimeRef.current = null;
            }
        }
    };

    const toggleWakeLock = async () => {
        if (wakeLockEnabled) {
            await releaseWakeLock();
        } else {
            await requestWakeLock();
        }
    };

    // formatting
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');

    const currentLevel = levels[currentLevelIdx];
    const nextLvl = levels[currentLevelIdx + 1];

    return (
        <div className="min-h-[calc(100vh-5rem)] bg-[#1c1c1c] flex flex-col items-center justify-center p-2 sm:p-4 font-sans text-white relative">
            {/* Settings Bar */}
            <div className="w-full flex justify-end gap-2 sm:gap-4 mb-4 z-20 print:hidden">
                <button
                    onClick={() => {
                        triggerHaptic(10);
                        if (typeof window !== 'undefined') window.print();
                    }}
                    className="p-2.5 sm:p-3 rounded-xl sm:rounded-full border transition active:scale-95 bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-400"
                    title="Print Tournament Structure Sheet"
                    aria-label="Print Tournament Structure Sheet"
                >
                    <Printer className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                    onClick={() => {
                        triggerHaptic(10);
                        toggleFullscreen();
                    }}
                    className="p-2.5 sm:p-3 rounded-xl sm:rounded-full border transition active:scale-95 bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-400"
                    title="Toggle Fullscreen (F)"
                    aria-label="Toggle Fullscreen"
                >
                    {isFullscreen ? <Minimize className="w-5 h-5 sm:w-6 sm:h-6" /> : <Maximize className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>
                <button
                    onClick={() => {
                        triggerHaptic(10);
                        setIsEditing(!isEditing);
                    }}
                    className={`p-2.5 sm:p-3 rounded-xl sm:rounded-full border transition active:scale-95 ${isEditing ? 'bg-[#cfb53b]/20 text-[#ffd700] border-[#cfb53b]' : 'bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-400'}`}
                    title="Edit Blinds"
                    aria-label="Edit Blinds"
                >
                    <Edit2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                    onClick={() => {
                        triggerHaptic(10);
                        setSoundEnabled(!soundEnabled);
                    }}
                    className={`p-2.5 sm:p-3 rounded-xl sm:rounded-full border transition active:scale-95 ${soundEnabled ? 'bg-gray-800 border-gray-600 focus:border-[#cfb53b] hover:bg-gray-700' : 'bg-red-900/30 border-red-900 text-red-500 hover:text-red-400'}`}
                    title="Toggle Sound (M)"
                    aria-label="Toggle Sound"
                >
                    {soundEnabled ? <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>
                <button
                    onClick={() => {
                        triggerHaptic(10);
                        toggleWakeLock();
                    }}
                    className={`p-2.5 sm:p-3 rounded-xl sm:rounded-full border transition active:scale-95 ${wakeLockEnabled ? 'bg-[#cfb53b]/20 text-[#ffd700] border-[#cfb53b]' : 'bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-400'}`}
                    title="Toggle Wake Lock (Keep Screen On)"
                    aria-label="Toggle Screen Wake Lock"
                >
                    {wakeLockEnabled ? <Sun className="w-5 h-5 sm:w-6 sm:h-6" /> : <Moon className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>
            </div>

            <div className="w-full max-w-5xl bg-black rounded-3xl sm:rounded-[40px] border-2 sm:border-4 border-[#cfb53b]/30 shadow-[0_0_80px_rgba(255,215,0,0.1)] p-4 sm:p-8 md:p-14 text-center relative overflow-hidden print:hidden">
                {/* Glow effect */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff073a] opacity-5 rounded-full blur-[100px] pointer-events-none transition-opacity duration-1000 ${timeLeft <= 60 && isRunning ? 'opacity-20 animate-pulse' : ''}`} />

                {isEditing ? (
                    <div className="text-left w-full mx-auto z-10 relative">
                        <div className="flex justify-between items-center mb-4 sm:mb-6 border-b border-gray-800 pb-3 sm:pb-4">
                            <h2 className="text-xl sm:text-3xl text-[#ffd700] font-black uppercase tracking-widest">Edit Blinds</h2>
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 sm:px-6 sm:py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg sm:rounded font-bold flex items-center gap-2 text-xs sm:text-base transition">
                                <Check className="w-4 h-4 sm:w-5 sm:h-5" /> Done
                            </button>
                        </div>
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
                            {levels.map((lvl, index) => (
                                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 bg-gray-900 p-3 sm:p-4 rounded-xl border border-gray-700">
                                    <div className="text-gray-400 font-bold w-16 text-sm sm:text-xl">Lvl {lvl.level}</div>
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={lvl.small} onChange={(e) => updateLevel(index, 'small', Number(e.target.value))} className="w-20 sm:w-24 bg-black border border-gray-600 rounded p-1.5 sm:p-2 text-white outline-none focus:border-[#cfb53b] text-sm" placeholder="SB" />
                                        <span className="text-gray-500">/</span>
                                        <input type="number" value={lvl.big} onChange={(e) => updateLevel(index, 'big', Number(e.target.value))} className="w-20 sm:w-24 bg-black border border-gray-600 rounded p-1.5 sm:p-2 text-white outline-none focus:border-[#cfb53b] text-sm" placeholder="BB" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500 font-bold uppercase text-xs w-12">Mins:</span>
                                        <input type="number" value={lvl.duration} onChange={(e) => updateLevel(index, 'duration', Number(e.target.value))} className="w-16 sm:w-20 bg-black border border-gray-600 rounded p-1.5 sm:p-2 text-white outline-none focus:border-[#cfb53b] text-sm" />
                                    </div>
                                    <button onClick={() => removeLevel(index)} className="self-end sm:self-auto text-red-500 hover:text-red-400 p-1.5 border border-red-900/50 rounded hover:bg-red-900/20 transition"><Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={addLevel} className="mt-4 w-full py-3 sm:py-4 border-2 border-dashed border-gray-600 text-gray-400 hover:border-[#ffd700] hover:text-[#ffd700] rounded-xl flex items-center justify-center gap-2 font-bold text-sm sm:text-base transition">
                            <Plus className="w-5 h-5 sm:w-6 sm:h-6" /> Add Level
                        </button>

                        <div className="mt-8 mb-4 border-b border-gray-800 pb-3">
                            <h2 className="text-xl sm:text-3xl text-[#ffd700] font-black uppercase tracking-widest">Edit Chips</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            {chips.map((chip, index) => (
                                <div key={index} className="bg-gray-900 p-3 sm:p-4 rounded-xl border border-gray-700 flex flex-col items-center gap-2">
                                    <div className="flex w-full justify-between items-center mb-1">
                                        <span className="text-gray-500 text-[10px] sm:text-xs font-bold tracking-widest uppercase">Chip {index + 1}</span>
                                        <button onClick={() => removeChip(index)} className="text-red-500 hover:text-red-400"><Trash2 size={14} /></button>
                                    </div>
                                    <div className="flex items-center gap-2 w-full">
                                        <input
                                            type="color"
                                            value={chip.color}
                                            onChange={(e) => updateChip(index, 'color', e.target.value)}
                                            className="w-10 h-8 rounded cursor-pointer bg-transparent border-none p-0 outline-none"
                                        />
                                        <input
                                            type="number"
                                            value={chip.value}
                                            onChange={(e) => updateChip(index, 'value', Number(e.target.value))}
                                            className="flex-1 bg-black border border-gray-600 rounded p-1.5 text-white outline-none focus:border-[#cfb53b] w-full text-xs sm:text-sm"
                                            placeholder="Value"
                                        />
                                    </div>
                                </div>
                            ))}
                            <button onClick={addChip} className="bg-gray-900/50 border-2 border-dashed border-gray-600 text-gray-400 hover:border-[#ffd700] hover:text-[#ffd700] rounded-xl flex flex-col items-center justify-center p-3 min-h-[100px] text-xs font-bold transition">
                                <Plus size={20} className="mb-1" /> Add Chip
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="relative z-10 w-full flex flex-col items-center">
                        {/* Level Display */}
                        <div className="mb-2 sm:mb-3">
                            <span className="text-[#ffd700] tracking-[0.2em] sm:tracking-[0.3em] uppercase font-black text-sm sm:text-xl md:text-2xl">
                                Level {currentLevel.level}
                            </span>
                        </div>

                        {/* Blinds */}
                        <div className="mb-4 sm:mb-6">
                            <h2 className="text-3xl sm:text-6xl md:text-7xl lg:text-[7.5rem] font-black text-white leading-none drop-shadow-xl tracking-tight">
                                {currentLevel.small} <span className="text-[#ff073a]">/</span> {currentLevel.big}
                            </h2>
                            <div className="text-gray-400 mt-1 sm:mt-2 text-xs sm:text-base font-bold uppercase tracking-widest">Small / Big Blind</div>
                        </div>

                        {/* Timer */}
                        <div className="font-mono text-5xl sm:text-7xl md:text-9xl lg:text-[12rem] font-black text-[#ff073a] leading-none mb-6 sm:mb-8 drop-shadow-[0_0_25px_rgba(255,7,58,0.5)] tracking-tighter tabular-nums select-none">
                            {m}:{s}
                        </div>

                        {/* Controls */}
                        <div className="flex justify-center items-center gap-2 sm:gap-4 md:gap-6 mb-6 sm:mb-8 flex-wrap">
                            <button onClick={() => { triggerHaptic(15); prevLevel(); }} className="px-3 py-2.5 sm:px-5 sm:py-3.5 bg-gray-900 border border-gray-700 hover:border-gray-500 rounded-xl sm:rounded-2xl text-white font-bold text-xs sm:text-base transition active:scale-95">
                                Prev Lvl
                            </button>
                            <button onClick={() => { triggerHaptic(20); toggleTimer(); }} className={`w-20 h-14 sm:w-28 sm:h-18 md:w-32 md:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center border-2 sm:border-4 transition-all active:scale-95 ${isRunning ? 'bg-black border-[#ff073a] text-[#ff073a] hover:bg-gray-900' : 'bg-[#ffd700] border-[#cfb53b] text-black hover:bg-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.3)]'}`}>
                                {isRunning ? <Pause className="w-7 h-7 sm:w-10 sm:h-10" /> : <Play className="w-7 h-7 sm:w-10 sm:h-10 ml-1" />}
                            </button>
                            <button onClick={() => { triggerHaptic(15); resetTimer(); }} className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gray-900 border border-gray-700 hover:border-gray-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white transition active:scale-95">
                                <RotateCcw className="w-5 h-5 sm:w-7 sm:h-7" />
                            </button>
                            <button onClick={() => { triggerHaptic(15); nextLevel(); }} className="px-3 py-2.5 sm:px-5 sm:py-3.5 bg-gray-900 border border-gray-700 hover:border-gray-500 rounded-xl sm:rounded-2xl text-white font-bold text-xs sm:text-base transition active:scale-95">
                                Next Lvl
                            </button>
                        </div>

                        {/* Next Level Preview */}
                        {nextLvl && (
                            <div className="inline-block px-4 py-2 sm:px-6 sm:py-3 bg-gray-900/60 rounded-xl sm:rounded-2xl border border-gray-800 backdrop-blur-sm mb-4 sm:mb-6 w-full sm:w-auto">
                                <span className="text-gray-400 font-bold tracking-widest uppercase text-[10px] sm:text-xs mr-2 sm:mr-3 block sm:inline mb-0.5 sm:mb-0">Upcoming: Level {nextLvl.level}</span>
                                <span className="text-sm sm:text-xl font-black text-white">{nextLvl.small} / {nextLvl.big}</span>
                                <span className="text-gray-400 ml-2 font-bold text-xs">({nextLvl.duration}m)</span>
                            </div>
                        )}

                        {/* Chip Values */}
                        <div className="mt-4 flex flex-wrap justify-center gap-3 sm:gap-6 border-t border-gray-800/80 pt-4 w-full max-w-2xl mx-auto">
                            {chips.map((chip, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-1">
                                    <div
                                        className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 sm:border-3 border-dashed shadow-[inset_0_0_8px_rgba(0,0,0,0.5)] flex items-center justify-center shrink-0 border-white/40"
                                        style={{ backgroundColor: chip.color }}
                                    />
                                    <span className="text-gray-300 font-mono font-bold text-[10px] sm:text-xs tracking-wider uppercase">{chip.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Game Night Host Keyboard Hotkeys Pill Bar */}
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[11px] sm:text-xs text-gray-400 font-mono select-none">
                            <span className="flex items-center gap-1.5 bg-gray-900/80 px-2.5 py-1 rounded-lg border border-gray-800">
                                <kbd className="bg-black/60 px-1.5 py-0.5 rounded border border-gray-700 text-white font-bold">Space</kbd> Play/Pause
                            </span>
                            <span className="flex items-center gap-1.5 bg-gray-900/80 px-2.5 py-1 rounded-lg border border-gray-800">
                                <kbd className="bg-black/60 px-1.5 py-0.5 rounded border border-gray-700 text-white font-bold">←</kbd>
                                <kbd className="bg-black/60 px-1.5 py-0.5 rounded border border-gray-700 text-white font-bold">→</kbd> Level
                            </span>
                            <span className="flex items-center gap-1.5 bg-gray-900/80 px-2.5 py-1 rounded-lg border border-gray-800">
                                <kbd className="bg-black/60 px-1.5 py-0.5 rounded border border-gray-700 text-white font-bold">M</kbd> Mute
                            </span>
                            <span className="flex items-center gap-1.5 bg-gray-900/80 px-2.5 py-1 rounded-lg border border-gray-800">
                                <kbd className="bg-black/60 px-1.5 py-0.5 rounded border border-gray-700 text-white font-bold">F</kbd> Fullscreen
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Printable Single-Page Tournament Structure Sheet */}
            <div className="hidden print:block w-full text-black bg-white p-8 max-w-4xl mx-auto">
                <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-wider text-black">E.P.T. Poker League</h1>
                        <p className="text-sm font-semibold text-gray-700 mt-1">Official Tournament Blind Schedule & Chip Denominations</p>
                    </div>
                    <div className="text-right text-xs text-gray-600 font-mono">
                        <div>Host Copy • eptpoker.co.uk</div>
                        <div>Tournament Structure Sheet</div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-8">
                    {/* Blinds Schedule */}
                    <div className="col-span-2">
                        <h2 className="text-sm font-black uppercase tracking-widest border-b border-black pb-1 mb-3">Blind Schedule</h2>
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b-2 border-black">
                                    <th className="py-1.5 font-bold">Level</th>
                                    <th className="py-1.5 font-bold">Small Blind</th>
                                    <th className="py-1.5 font-bold">Big Blind</th>
                                    <th className="py-1.5 font-bold">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {levels.map((lvl) => (
                                    <tr key={lvl.level} className="border-b border-gray-300">
                                        <td className="py-1.5 font-bold">Level {lvl.level}</td>
                                        <td className="py-1.5 font-mono">{lvl.small}</td>
                                        <td className="py-1.5 font-mono">{lvl.big}</td>
                                        <td className="py-1.5">{lvl.duration} mins</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Chip Values & Tournament Rules */}
                    <div className="col-span-1 space-y-6">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest border-b border-black pb-1 mb-3">Chip Values</h2>
                            <div className="space-y-2">
                                {chips.map((chip, idx) => (
                                    <div key={idx} className="flex items-center justify-between border-b border-gray-200 py-1 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-4 h-4 rounded-full border border-black inline-block"
                                                style={{ backgroundColor: chip.color }}
                                            />
                                            <span className="font-semibold text-gray-800">Chip {idx + 1}</span>
                                        </div>
                                        <span className="font-mono font-bold text-black">{chip.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border border-black p-3 rounded text-[10px] space-y-1.5 bg-gray-50">
                            <h3 className="font-black uppercase tracking-wider text-black">Tournament Rules</h3>
                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                                <li>Clock decisions made by host are final.</li>
                                <li>Blinds raise immediately when timer chimes.</li>
                                <li>Chips must remain visible with largest forward.</li>
                                <li>Cards speak for themselves at showdown.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
