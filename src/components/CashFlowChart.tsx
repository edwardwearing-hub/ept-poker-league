'use client';

import { motion } from 'framer-motion';

interface Props {
    data: { date: string; profit: number }[];
}

export default function CashFlowChart({ data }: Props) {
    if (!data || data.length === 0) return <div className="text-zinc-500 text-sm">No cash flow data available.</div>;

    // Dimensions
    const height = 200;
    const width = 600; // viewBox width
    const padding = 40;

    // Scales
    const maxProfit = Math.max(...data.map(d => d.profit), 50);
    const minProfit = Math.min(...data.map(d => d.profit), -50);
    const range = maxProfit - minProfit;

    // Normalize Y
    const getY = (val: number) => {
        // Invert Y because SVG 0 is top
        const pct = (val - minProfit) / range;
        return height - (padding + pct * (height - 2 * padding));
    };

    // Normalize X
    const getX = (index: number) => {
        return padding + (index / (data.length - 1 || 1)) * (width - 2 * padding);
    };

    // Build Path
    const pathD = data.map((d, i) => {
        const cmd = i === 0 ? 'M' : 'L';
        return `${cmd} ${getX(i)} ${getY(d.profit)}`;
    }).join(' ');

    const zeroY = getY(0);

    return (
        <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                {/* Zero Line */}
                <line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke="#ffffff" strokeOpacity={0.1} strokeDasharray="4 4" />

                {/* Data Path */}
                <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    d={pathD}
                    fill="none"
                    stroke="#D4AF37" // Gold
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Gradient Area (Optional, skipped for clean line look) */}

                {/* Points */}
                {data.map((d, i) => (
                    <motion.circle
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.5 + (i * 0.1) }}
                        cx={getX(i)}
                        cy={getY(d.profit)}
                        r={4}
                        fill={d.profit >= 0 ? '#10b981' : '#f43f5e'} // Green or Red
                        stroke="#18181b"
                        strokeWidth={2}
                    />
                ))}

                {/* Labels (Simplified) */}
                {data.map((d, i) => (
                    <text key={`label-${i}`} x={getX(i)} y={height - 5} textAnchor="middle" fill="#71717a" fontSize={10}>
                        {d.date}
                    </text>
                ))}
            </svg>
        </div>
    );
}
