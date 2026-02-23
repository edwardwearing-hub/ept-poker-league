'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Moon, Sun, Edit2, Check, Plus, Trash2 } from 'lucide-react';

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
    const wakeLockRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

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
                setTimeLeft(reindexed[newIdx].duration * 60);
            }
        }
    };

    useEffect(() => {
        // Create audio element for the casino bell
        // Using a reliable generic sound if asset is missing, or user can place one in public later.
        // Given the prompt, "sound alerts (Casino Bell) for level changes"
        audioRef.current = new Audio('https://www.soundjay.com/buttons/sounds/button-10.mp3');
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (isRunning && timeLeft === 0) {
            // Level Up!
            if (soundEnabled && audioRef.current) {
                audioRef.current.play().catch(e => console.log('Audio error:', e));
            }

            if (currentLevelIdx < levels.length - 1) {
                const nextIdx = currentLevelIdx + 1;
                setCurrentLevelIdx(nextIdx);
                setTimeLeft(levels[nextIdx].duration * 60);
            } else {
                setIsRunning(false);
            }
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft, currentLevelIdx, levels, soundEnabled]);

    const toggleTimer = () => setIsRunning(!isRunning);

    const resetTimer = () => {
        setIsRunning(false);
        setTimeLeft(levels[currentLevelIdx].duration * 60);
    };

    const nextLevel = () => {
        if (currentLevelIdx < levels.length - 1) {
            const idx = currentLevelIdx + 1;
            setCurrentLevelIdx(idx);
            setTimeLeft(levels[idx].duration * 60);
        }
    };

    const prevLevel = () => {
        if (currentLevelIdx > 0) {
            const idx = currentLevelIdx - 1;
            setCurrentLevelIdx(idx);
            setTimeLeft(levels[idx].duration * 60);
        }
    };

    const toggleWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                if (!wakeLockEnabled) {
                    wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                    setWakeLockEnabled(true);
                } else {
                    await wakeLockRef.current?.release();
                    wakeLockRef.current = null;
                    setWakeLockEnabled(false);
                }
            } catch (err: any) {
                console.error(`${err.name}, ${err.message}`);
            }
        } else {
            alert("Wake Lock API not supported in this browser.");
        }
    };

    // formatting
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');

    const currentLevel = levels[currentLevelIdx];
    const nextLvl = levels[currentLevelIdx + 1];

    return (
        <div className="min-h-screen bg-[#1c1c1c] flex flex-col items-center justify-center p-4 font-sans text-white">
            {/* Settings Bar */}
            <div className="absolute top-6 right-6 flex gap-4 z-20">
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`p-3 rounded-full border ${isEditing ? 'bg-[#cfb53b]/20 text-[#ffd700] border-[#cfb53b]' : 'bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-400'}`}
                    title="Edit Blinds"
                >
                    <Edit2 size={24} />
                </button>
                <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`p-3 rounded-full border ${soundEnabled ? 'bg-gray-800 border-gray-600 focus:border-[#cfb53b] hover:bg-gray-700' : 'bg-red-900/30 border-red-900 text-red-500 hover:text-red-400'}`}
                    title="Toggle Sound"
                >
                    {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                </button>
                <button
                    onClick={toggleWakeLock}
                    className={`p-3 rounded-full border ${wakeLockEnabled ? 'bg-[#cfb53b]/20 text-[#ffd700] border-[#cfb53b]' : 'bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-400'}`}
                    title="Toggle Wake Lock (Keep Screen On)"
                >
                    {wakeLockEnabled ? <Sun size={24} /> : <Moon size={24} />}
                </button>
            </div>

            <div className="w-full max-w-5xl bg-black rounded-[40px] border-4 border-[#cfb53b]/30 shadow-[0_0_100px_rgba(255,215,0,0.1)] p-10 md:p-20 text-center relative overflow-hidden">
                {/* Glow effect */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#ff073a] opacity-5 rounded-full blur-[100px] pointer-events-none transition-opacity duration-1000 ${timeLeft <= 60 && isRunning ? 'opacity-20 animate-pulse' : ''}`} />

                {isEditing ? (
                    <div className="text-left w-full mx-auto z-10 relative">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                            <h2 className="text-3xl text-[#ffd700] font-black uppercase tracking-widest">Edit Blinds</h2>
                            <button onClick={() => setIsEditing(false)} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold flex items-center gap-2 transition">
                                <Check size={20} /> Done
                            </button>
                        </div>
                        <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                            {levels.map((lvl, index) => (
                                <div key={index} className="flex flex-col md:flex-row md:items-center gap-4 bg-gray-900 p-4 rounded-xl border border-gray-700">
                                    <div className="text-gray-500 font-bold w-16 text-xl">Lvl {lvl.level}</div>
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={lvl.small} onChange={(e) => updateLevel(index, 'small', Number(e.target.value))} className="w-24 bg-black border border-gray-600 rounded p-2 text-white outline-none focus:border-[#cfb53b]" placeholder="SB" />
                                        <span className="text-gray-500">/</span>
                                        <input type="number" value={lvl.big} onChange={(e) => updateLevel(index, 'big', Number(e.target.value))} className="w-24 bg-black border border-gray-600 rounded p-2 text-white outline-none focus:border-[#cfb53b]" placeholder="BB" />
                                    </div>
                                    <div className="flex items-center gap-2 md:ml-4">
                                        <span className="text-gray-500 font-bold uppercase text-sm w-12">Mins:</span>
                                        <input type="number" value={lvl.duration} onChange={(e) => updateLevel(index, 'duration', Number(e.target.value))} className="w-20 bg-black border border-gray-600 rounded p-2 text-white outline-none focus:border-[#cfb53b]" />
                                    </div>
                                    <button onClick={() => removeLevel(index)} className="ml-auto text-red-500 hover:text-red-400 p-2 border border-red-900/50 rounded hover:bg-red-900/20 transition"><Trash2 size={20} /></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={addLevel} className="mt-4 w-full py-4 border-2 border-dashed border-gray-600 text-gray-400 hover:border-[#ffd700] hover:text-[#ffd700] rounded-xl flex items-center justify-center gap-2 font-bold transition">
                            <Plus size={24} /> Add Level
                        </button>

                        <div className="mt-12 mb-6 border-b border-gray-800 pb-4">
                            <h2 className="text-3xl text-[#ffd700] font-black uppercase tracking-widest">Edit Chips</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {chips.map((chip, index) => (
                                <div key={index} className="bg-gray-900 p-4 rounded-xl border border-gray-700 flex flex-col items-center gap-3">
                                    <div className="flex w-full justify-between items-center mb-2">
                                        <span className="text-gray-500 text-sm font-bold tracking-widest uppercase">Chip {index + 1}</span>
                                        <button onClick={() => removeChip(index)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                                    </div>
                                    <div className="flex items-center gap-2 w-full">
                                        <input
                                            type="color"
                                            value={chip.color}
                                            onChange={(e) => updateChip(index, 'color', e.target.value)}
                                            className="w-12 h-10 rounded cursor-pointer bg-transparent border-none p-0 outline-none"
                                        />
                                        <input
                                            type="number"
                                            value={chip.value}
                                            onChange={(e) => updateChip(index, 'value', Number(e.target.value))}
                                            className="flex-1 bg-black border border-gray-600 rounded p-2 text-white outline-none focus:border-[#cfb53b] w-full"
                                            placeholder="Value"
                                        />
                                    </div>
                                </div>
                            ))}
                            <button onClick={addChip} className="bg-gray-900/50 border-2 border-dashed border-gray-600 text-gray-400 hover:border-[#ffd700] hover:text-[#ffd700] rounded-xl flex flex-col items-center justify-center p-4 min-h-[120px] transition">
                                <Plus size={24} className="mb-2" /> Add Chip
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="relative z-10 hidden-scrollbar max-h-full overflow-y-auto w-full flex flex-col items-center">
                        {/* Level Display */}
                        <div className="mb-4">
                            <span className="text-[#ffd700] tracking-[0.3em] uppercase font-black text-xl md:text-3xl">
                                Level {currentLevel.level}
                            </span>
                        </div>

                        {/* Blinds */}
                        <div className="mb-8">
                            <h2 className="text-6xl md:text-[8rem] font-black text-white leading-none drop-shadow-xl min-w-max">
                                {currentLevel.small} <span className="text-[#ff073a]">/</span> {currentLevel.big}
                            </h2>
                            <div className="text-gray-400 mt-2 text-xl font-bold uppercase tracking-widest">Small / Big Blind</div>
                        </div>

                        {/* Timer */}
                        <div className="font-mono text-[8rem] md:text-[14rem] font-black text-[#ff073a] leading-none mb-10 drop-shadow-[0_0_30px_rgba(255,7,58,0.5)] tracking-tighter">
                            {m}:{s}
                        </div>

                        {/* Controls */}
                        <div className="flex justify-center gap-4 md:gap-6 mb-12 flex-wrap">
                            <button onClick={prevLevel} className="px-6 py-4 bg-gray-900 border border-gray-700 hover:border-gray-500 rounded-2xl text-white font-bold text-xl transition">
                                Prev Lvl
                            </button>
                            <button onClick={toggleTimer} className={`w-32 h-20 rounded-2xl flex items-center justify-center border-4 transition-all ${isRunning ? 'bg-black border-[#ff073a] text-[#ff073a] hover:bg-gray-900' : 'bg-[#ffd700] border-[#cfb53b] text-black hover:bg-yellow-400'}`}>
                                {isRunning ? <Pause size={40} /> : <Play size={40} className="ml-2" />}
                            </button>
                            <button onClick={resetTimer} className="w-20 h-20 bg-gray-900 border border-gray-700 hover:border-gray-500 rounded-2xl flex items-center justify-center text-white transition">
                                <RotateCcw size={32} />
                            </button>
                            <button onClick={nextLevel} className="px-6 py-4 bg-gray-900 border border-gray-700 hover:border-gray-500 rounded-2xl text-white font-bold text-xl transition">
                                Next Lvl
                            </button>
                        </div>

                        {/* Next Level Preview */}
                        {nextLvl && (
                            <div className="inline-block px-8 py-4 bg-gray-900/50 rounded-2xl border border-gray-800 backdrop-blur-sm mb-8 w-full md:w-auto">
                                <span className="text-gray-500 font-bold tracking-widest uppercase mr-4 block md:inline mb-2 md:mb-0">Preview: Level {nextLvl.level}</span>
                                <span className="text-2xl font-black text-gray-300">{nextLvl.small} / {nextLvl.big}</span>
                                <span className="text-gray-500 ml-4 font-bold">({nextLvl.duration}m)</span>
                            </div>
                        )}

                        {/* Chip Values */}
                        <div className="mt-8 flex flex-wrap justify-center gap-6 lg:gap-10 border-t border-gray-800 pt-8 w-full max-w-4xl mx-auto">
                            {chips.map((chip, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-2">
                                    <div
                                        className="w-12 h-12 rounded-full border-4 border-dashed shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center shrink-0 border-white/30"
                                        style={{ backgroundColor: chip.color }}
                                    />
                                    <span className="text-gray-400 font-bold text-sm tracking-widest uppercase">{chip.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
