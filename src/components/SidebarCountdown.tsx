'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface Props {
    targetDateStr: string;
}

export default function SidebarCountdown({ targetDateStr }: Props) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

    useEffect(() => {
        const targetDate = new Date(targetDateStr).getTime();

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0 });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

        return () => clearInterval(timer);
    }, [targetDateStr]);

    return (
        <div className="px-4 py-2 mt-4 mx-4 bg-black/20 rounded-lg border border-white/5">
            <div className="flex items-center gap-2 mb-2 text-zinc-400">
                <Clock size={12} />
                <span className="text-[10px] uppercase font-bold tracking-widest">Next Game Countdown</span>
            </div>
            <div className="flex gap-2 text-center">
                <div className="flex-1 bg-white/5 rounded p-1">
                    <div className="text-xl font-bold text-white leading-none">{timeLeft.days}</div>
                    <div className="text-[8px] uppercase text-zinc-500 font-bold">Days</div>
                </div>
                <div className="flex-1 bg-white/5 rounded p-1">
                    <div className="text-xl font-bold text-ep-red leading-none">{timeLeft.hours}</div>
                    <div className="text-[8px] uppercase text-zinc-500 font-bold">Hrs</div>
                </div>
                <div className="flex-1 bg-white/5 rounded p-1">
                    <div className="text-xl font-bold text-gold leading-none">{timeLeft.minutes}</div>
                    <div className="text-[8px] uppercase text-zinc-500 font-bold">Mins</div>
                </div>
            </div>
            <div className="text-center mt-2 text-[10px] text-zinc-500 font-mono">
                {targetDateStr}
            </div>
        </div>
    );
}
