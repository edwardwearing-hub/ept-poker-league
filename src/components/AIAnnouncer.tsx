'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, Volume2, Mic2 } from 'lucide-react';

interface Props {
    text: string;
    title?: string;
}

export default function AIAnnouncer({ text, title }: Props) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [progress, setProgress] = useState(0);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const estimatedDurationRef = useRef<number>(0);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            setIsSupported(false);
        }
        return () => {
            window.speechSynthesis?.cancel();
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, []);

    const getBestVoice = useCallback((): SpeechSynthesisVoice | null => {
        const voices = window.speechSynthesis.getVoices();
        // Preference order: Google UK English Male > Daniel (Siri UK) > any UK English > any English
        const preferred = [
            'Google UK English Male',
            'Daniel',
            'Google UK English Female',
        ];
        for (const name of preferred) {
            const found = voices.find(v => v.name === name);
            if (found) return found;
        }
        // Fallback: any en-GB voice
        const ukVoice = voices.find(v => v.lang === 'en-GB');
        if (ukVoice) return ukVoice;
        // Final fallback: any English
        return voices.find(v => v.lang.startsWith('en')) || null;
    }, []);

    const startProgress = useCallback(() => {
        const wordsPerMinute = 160;
        const wordCount = text.split(/\s+/).length;
        estimatedDurationRef.current = (wordCount / wordsPerMinute) * 60 * 1000;
        startTimeRef.current = Date.now();

        progressIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const pct = Math.min((elapsed / estimatedDurationRef.current) * 100, 99);
            setProgress(pct);
        }, 200);
    }, [text]);

    const stopProgress = useCallback(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    }, []);

    const handlePlay = useCallback(() => {
        if (!isSupported) return;

        if (isPaused && utteranceRef.current) {
            window.speechSynthesis.resume();
            setIsPaused(false);
            setIsPlaying(true);
            startProgress();
            return;
        }

        window.speechSynthesis.cancel();
        stopProgress();
        setProgress(0);

        const introText = title ? `${title}. ` : '';
        const utterance = new SpeechSynthesisUtterance(introText + text);
        utteranceRef.current = utterance;

        // Style the voice for a sports announcer feel
        utterance.rate = 0.95;     // Slightly slower for gravitas
        utterance.pitch = 0.85;    // Slightly lower pitch
        utterance.volume = 1;

        // Try to load voices and set best one
        const setVoice = () => {
            const voice = getBestVoice();
            if (voice) utterance.voice = voice;
        };
        setVoice();
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = setVoice;
        }

        utterance.onstart = () => {
            setIsPlaying(true);
            setIsPaused(false);
            startProgress();
        };

        utterance.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
            setProgress(100);
            stopProgress();
            setTimeout(() => setProgress(0), 1000);
        };

        utterance.onerror = () => {
            setIsPlaying(false);
            setIsPaused(false);
            stopProgress();
            setProgress(0);
        };

        window.speechSynthesis.speak(utterance);
    }, [isSupported, isPaused, text, title, getBestVoice, startProgress, stopProgress]);

    const handlePause = useCallback(() => {
        if (!isPlaying) return;
        window.speechSynthesis.pause();
        setIsPaused(true);
        setIsPlaying(false);
        stopProgress();
    }, [isPlaying, stopProgress]);

    const handleStop = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
        stopProgress();
    }, [stopProgress]);

    if (!isSupported) return null;

    return (
        <div className="flex flex-col gap-3 p-4 bg-black/60 backdrop-blur border border-gold/20 rounded-xl relative overflow-hidden">
            {/* Animated background when playing */}
            {isPlaying && (
                <div className="absolute inset-0 bg-gold/5 animate-pulse pointer-events-none" />
            )}

            <div className="flex items-center gap-2 relative z-10">
                <div className={`p-1.5 rounded-lg ${isPlaying ? 'bg-gold/20 text-gold' : 'bg-white/5 text-zinc-500'} transition-all`}>
                    <Mic2 className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
                </div>
                <div className="flex-1">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">
                        AI Announcer
                    </span>
                    <span className={`text-xs font-bold ${isPlaying ? 'text-gold' : isPaused ? 'text-yellow-500' : 'text-zinc-400'}`}>
                        {isPlaying ? 'Broadcasting...' : isPaused ? 'Paused' : 'Ready to Narrate'}
                    </span>
                </div>
                <Volume2 className={`w-4 h-4 ${isPlaying ? 'text-gold' : 'text-zinc-600'} transition-colors`} />
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-white/5 rounded-full overflow-hidden relative z-10">
                <div
                    className="h-full bg-gradient-to-r from-gold/60 to-gold rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap relative z-10">
                {!isPlaying ? (
                    <button
                        onClick={handlePlay}
                        className="flex items-center gap-2 px-4 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/30 hover:border-gold/60 text-gold rounded-lg font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                    >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {isPaused ? 'Resume' : 'Narrate'}
                    </button>
                ) : (
                    <button
                        onClick={handlePause}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-lg font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                    >
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        Pause
                    </button>
                )}

                {(isPlaying || isPaused) && (
                    <button
                        onClick={handleStop}
                        className="flex items-center gap-2 px-3 py-2 bg-ept-red/10 hover:bg-ept-red/20 border border-ept-red/30 text-ept-red rounded-lg font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                    >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        Stop
                    </button>
                )}
            </div>
        </div>
    );
}
