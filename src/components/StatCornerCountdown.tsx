'use client';

import { useState, useEffect } from 'react';

export default function StatCornerCountdown({ targetDateStr }: { targetDateStr: string }) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0 });
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const targetDate = new Date(targetDateStr).getTime();

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                });
            } else {
                setTimeLeft({ days: 0, hours: 0 });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000);

        return () => clearInterval(timer);
    }, [targetDateStr]);

    if (!isMounted) {
        return (
            <div className="mt-2 flex gap-2 text-center">
                <div className="bg-black/30 rounded p-1.5 min-w-[3rem]">
                    <div className="text-lg font-bold text-ept-red">--</div>
                    <div className="text-[9px] uppercase text-zinc-500">Days</div>
                </div>
                <div className="bg-black/30 rounded p-1.5 min-w-[3rem]">
                    <div className="text-lg font-bold text-white">--</div>
                    <div className="text-[9px] uppercase text-zinc-500">Hrs</div>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-2 flex gap-2 text-center">
            <div className="bg-black/30 rounded p-1.5 min-w-[3rem]">
                <div className="text-lg font-bold text-ept-red">{timeLeft.days}</div>
                <div className="text-[9px] uppercase text-zinc-500">Days</div>
            </div>
            <div className="bg-black/30 rounded p-1.5 min-w-[3rem]">
                <div className="text-lg font-bold text-white">{timeLeft.hours}</div>
                <div className="text-[9px] uppercase text-zinc-500">Hrs</div>
            </div>
        </div>
    );
}
